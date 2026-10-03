"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { io, type Socket } from "socket.io-client";
import type { AxiosError } from "axios";
import api from "@/lib/api/axios-client";
import { handleAxiosError } from "@/lib/api/handle-axios-error";
import { MENU_API_URL, MENU_REALTIME_ORIGIN, MENU_REALTIME_PATH } from "@/constants";

/* ─────────────────────────── Socket ─────────────────────────── */

/** Events a guest receives. `order.confirmed` and `order.pinged` are waiter-only. */
export type GuestOrderEvent =
  | "order.accepted"
  | "order.released"
  | "order.message"
  | "order.tipped"
  | "order.rated";

const GUEST_EVENTS: GuestOrderEvent[] = [
  "order.accepted",
  "order.released",
  "order.message",
  "order.tipped",
  "order.rated",
];

/** Every payload carries these; event-specific fields ride alongside. */
export interface OrderEventPayload {
  orderId: string;
  displayCode: string;
  merchantUserId: string;
  tableNumber: string | null;
  waiterUserId: string | null;
  /** order.message */
  sender?: "GUEST" | "WAITER";
  body?: string;
  /** order.tipped */
  amount?: number | string;
  /** order.rated */
  stars?: number;
  [key: string]: unknown;
}

export type SocketState = "idle" | "connecting" | "live" | "offline";

/**
 * Live updates for one order. The socket is receive-only: it never sends,
 * it only tells us when to refetch. Each event refreshes the order (waiter
 * assignment, ping time) and, for chat, the message thread.
 *
 * The server authenticates the guest by `{ orderId, email }` and silently
 * disconnects on a mismatch, so `state` falls back to "offline" and the
 * order page keeps polling.
 */
export function useOrderSocket(
  orderId: string | null | undefined,
  email: string | null | undefined,
  onEvent?: (event: GuestOrderEvent, payload: OrderEventPayload) => void,
) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<SocketState>("idle");
  // Held in a ref so a new inline callback doesn't reconnect the socket.
  const onEventRef = useRef(onEvent);
  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    if (!orderId || !email) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect -- reflecting the socket lifecycle
    setState("connecting");
    const socket: Socket = io(MENU_REALTIME_ORIGIN, {
      path: MENU_REALTIME_PATH,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      auth: { orderId, email },
    });

    socket.on("connect", () => setState("live"));
    socket.on("disconnect", () => setState("offline"));
    socket.on("connect_error", () => setState("offline"));

    for (const event of GUEST_EVENTS) {
      socket.on(event, (payload: OrderEventPayload) => {
        if (payload?.orderId && payload.orderId !== orderId) return;
        void queryClient.invalidateQueries({ queryKey: ["public-order", orderId] });
        if (event === "order.message" || event === "order.released" || event === "order.accepted") {
          void queryClient.invalidateQueries({ queryKey: ["order-messages", orderId] });
        }
        onEventRef.current?.(event, payload);
      });
    }

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [orderId, email, queryClient]);

  return { state };
}

/* ─────────────────────────── Chat ─────────────────────────── */

export interface OrderMessage {
  id: string;
  sender: "GUEST" | "WAITER";
  body: string;
  createdAt: string;
}

/** The thread's response schema isn't documented; normalise what arrives. */
function normaliseMessage(raw: Record<string, unknown>, index: number): OrderMessage {
  const sender = String(raw.sender ?? raw.senderType ?? "GUEST").toUpperCase();
  return {
    id: String(raw.id ?? raw.messageId ?? `${index}-${raw.createdAt ?? ""}`),
    sender: sender === "WAITER" ? "WAITER" : "GUEST",
    body: String(raw.body ?? raw.message ?? ""),
    createdAt: String(raw.createdAt ?? raw.sentAt ?? new Date(0).toISOString()),
  };
}

export function useOrderMessages(
  orderId: string | null | undefined,
  email: string | null | undefined,
  options?: { enabled?: boolean; pollMs?: number | false },
) {
  const query = useQuery<OrderMessage[]>({
    queryKey: ["order-messages", orderId, email],
    queryFn: async () => {
      try {
        const params = new URLSearchParams({ email: email ?? "" });
        const res = await api.get(
          `${MENU_API_URL}/menu/public/orders/${orderId}/messages?${params}`,
        );
        const list = Array.isArray(res.data?.data)
          ? res.data.data
          : Array.isArray(res.data?.data?.data)
            ? res.data.data.data
            : [];
        return (list as Record<string, unknown>[])
          .map(normaliseMessage)
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      } catch (error) {
        console.log("Error fetching order messages:", error);
        return [];
      }
    },
    enabled: !!orderId && !!email && (options?.enabled ?? true),
    refetchInterval: options?.pollMs ?? false,
  });
  return { messages: query.data ?? [], isLoading: query.isLoading };
}

/* ─────────────────────────── Guest actions ─────────────────────────── */

const messageFrom = (error: unknown) => handleAxiosError(error as AxiosError);

export function useSendOrderMessage(orderId: string, email: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: string) => {
      await api.post(`${MENU_API_URL}/menu/public/orders/${orderId}/messages`, {
        email,
        body: body.trim().slice(0, 500),
      });
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["order-messages", orderId] }),
  });
}

export function usePingWaiter(orderId: string, email: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (message?: string) => {
      const note = message?.trim().slice(0, 500);
      await api.post(`${MENU_API_URL}/menu/public/orders/${orderId}/ping`, {
        email,
        ...(note ? { message: note } : {}),
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["public-order", orderId] }),
  });
}

export function useRateWaiter(orderId: string, email: string | null) {
  return useMutation({
    mutationFn: async ({ stars, comment }: { stars: number; comment?: string }) => {
      const note = comment?.trim();
      await api.post(`${MENU_API_URL}/menu/public/orders/${orderId}/rating`, {
        email,
        stars,
        ...(note ? { comment: note } : {}),
      });
    },
  });
}

export type TipPaymentMethod = "PAYSTACK" | "LEDGER_BLOCK";

/** `POST /public/orders/:id/tips` → `data`. */
export interface TipInitResponse {
  tipId: string;
  payment: {
    provider: string;
    /** Prefixed `MENU-TIP-`; the menu verify route settles it. */
    reference: string;
    authorizationUrl: string;
    accessCode?: string;
  };
}

/** Tip references are `MENU-TIP-<tipId>`; food orders are `MENU-<orderId>`. */
export const isTipReference = (reference: string | null | undefined) =>
  !!reference && reference.toUpperCase().startsWith("MENU-TIP-");

/**
 * Starts a tip payment. Only accepted while a waiter holds the order — the
 * API rejects tips after a release. The caller redirects to
 * `authorizationUrl`; the provider returns to `callbackUrl` with `?reference=`.
 */
export function useTipWaiter(orderId: string, email: string | null) {
  return useMutation({
    mutationFn: async (input: {
      amount: number;
      paymentMethod: TipPaymentMethod;
      callbackUrl: string;
    }) => {
      const res = await api.post(`${MENU_API_URL}/menu/public/orders/${orderId}/tips`, {
        email,
        amount: input.amount,
        paymentMethod: input.paymentMethod,
        callbackUrl: input.callbackUrl,
      });
      return res.data?.data as TipInitResponse;
    },
  });
}

/** Settles a tip on return from the provider. Status stays PENDING until paid. */
export async function verifyTip(reference: string) {
  const res = await api.get(
    `${MENU_API_URL}/menu/payments/verify/${encodeURIComponent(reference)}`,
  );
  return (res.data?.data ?? null) as { reference: string; status: string; tipId?: string } | null;
}

export { messageFrom as apiErrorMessage };

/** One ping per order per minute; seconds left from the order's `pingedAt`. */
export const PING_COOLDOWN_MS = 60_000;
