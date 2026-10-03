"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Bell, Hand, Lock, MessageCircle, Send, Star, Wallet } from "lucide-react";
import type { PublicMenuOrder } from "@/hooks/use-menu";
import {
  apiErrorMessage,
  PING_COOLDOWN_MS,
  useOrderMessages,
  usePingWaiter,
  useRateWaiter,
  useSendOrderMessage,
  useTipWaiter,
  type SocketState,
  type TipPaymentMethod,
} from "@/hooks/use-order-live";
import { getMyRating, setMyRating, timeAgo, type MyRating } from "@/lib/smart-menu";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/utils";

export type WaiterState = "none" | "assigned" | "released";

/**
 * Where the waiter stands. `waiterAssignment` is the source of truth
 * (ACCEPTED / UNASSIGNED); `waiterReleasedAt` only tells an unassigned order
 * apart from one that was handed back — it is not cleared on re-accept.
 */
export function waiterStateOf(order: PublicMenuOrder | null): WaiterState {
  if (!order) return "none";
  if (order.waiterAssignment?.toUpperCase() === "ACCEPTED" && order.waiterUserId) {
    return "assigned";
  }
  if (order.waiterReleasedAt) return "released";
  return "none";
}

interface Props {
  order: PublicMenuOrder;
  /** The checkout email, only known on the phone that ordered. */
  email: string | null;
  socketState: SocketState;
}

export default function WaiterPanel({ order, email, socketState }: Props) {
  const state = waiterStateOf(order);
  const assigned = state === "assigned";
  const isPaid = order.status?.toUpperCase() !== "PENDING";

  if (!email) {
    return (
      <div className="rounded-2xl border border-background-light bg-white/90 p-6 text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-background text-secondary-text">
          <Lock className="h-5 w-5" />
        </span>
        <p className="mt-3 font-semibold text-primary-text">Open this on the phone that ordered</p>
        <p className="mt-1 text-sm text-secondary-text">
          Pinging, chatting with and rating your waiter work from the device used at checkout.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <WaiterStatus order={order} state={state} isPaid={isPaid} socketState={socketState} />
      {assigned && <PingCard order={order} email={email} />}
      <ChatCard order={order} email={email} state={state} socketState={socketState} />
      {assigned && <TipCard orderId={order.id} email={email} />}
      {assigned && <RatingCard orderId={order.id} email={email} />}
      {!assigned && (
        <p className="px-1 text-center text-xs text-secondary-text">
          Tipping and rating open while a waiter is handling your order.
        </p>
      )}
    </div>
  );
}

function WaiterStatus({
  order,
  state,
  isPaid,
  socketState,
}: {
  order: PublicMenuOrder;
  state: WaiterState;
  isPaid: boolean;
  socketState: SocketState;
}) {
  const copy =
    state === "assigned"
      ? {
          title: "A waiter has your order",
          body: `Accepted ${timeAgo(order.waiterAcceptedAt)}. Ping them or send a message below.`,
        }
      : state === "released"
        ? {
            title: "Waiting for the next waiter",
            body: "Your waiter handed this order over. Another waiter will pick it up shortly.",
          }
        : isPaid
          ? {
              title: "No waiter yet",
              body: "Show the receipt QR above to any waiter. Once they accept, chat and ping unlock here.",
            }
          : {
              title: "Waiting for payment",
              body: "A waiter can pick this order up once your payment is confirmed.",
            };

  return (
    <div className="rounded-2xl border border-background-light bg-white/90 p-5">
      <div className="flex items-center gap-4">
        <span
          className={cn(
            "grid h-12 w-12 shrink-0 place-items-center rounded-full",
            state === "assigned" ? "bg-primary text-white" : "bg-primary-accent text-primary",
          )}
        >
          <Hand className="h-6 w-6" />
        </span>
        <div className="min-w-0">
          <p className="font-semibold text-primary-text">{copy.title}</p>
          <p className="mt-0.5 text-sm text-secondary-text">{copy.body}</p>
        </div>
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-[11px] text-secondary-text">
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            socketState === "live" ? "bg-emerald-500" : "bg-neutral-accent",
          )}
        />
        {socketState === "live" ? "Live updates on" : "Reconnecting — updates may be delayed"}
      </p>
    </div>
  );
}

function useSecondsLeft(pingedAt: string | null) {
  const [now, setNow] = useState(() => Date.now());
  const until = pingedAt ? new Date(pingedAt).getTime() + PING_COOLDOWN_MS : 0;
  const left = Math.max(0, Math.ceil((until - now) / 1000));
  useEffect(() => {
    if (left <= 0) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [left]);
  return left;
}

function PingCard({ order, email }: { order: PublicMenuOrder; email: string }) {
  const [note, setNote] = useState("");
  const ping = usePingWaiter(order.id, email);
  const secondsLeft = useSecondsLeft(order.pingedAt);

  const send = () =>
    ping.mutate(note, {
      onSuccess: () => {
        setNote("");
        navigator.vibrate?.(40);
        toast.success("Ping sent — your waiter has been alerted");
      },
      onError: (error) => toast.error(apiErrorMessage(error)),
    });

  return (
    <div className="rounded-2xl border border-background-light bg-white/90 p-5">
      <p className="flex items-center gap-2 font-semibold text-primary-text">
        <Bell className="h-4 w-4 text-primary" /> Call your waiter over
      </p>
      <input
        value={note}
        onChange={(e) => setNote(e.target.value.slice(0, 500))}
        placeholder="Optional note, e.g. extra plates please"
        className="mt-3 h-11 w-full rounded-xl border border-background-light bg-white px-3 text-sm text-primary-text outline-none focus:border-primary"
      />
      <button
        onClick={send}
        disabled={secondsLeft > 0 || ping.isPending}
        className="btn-press mt-3 w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-white shadow-[0_8px_24px_-8px_rgba(105,50,226,0.6)] disabled:opacity-50"
      >
        {ping.isPending
          ? "Pinging…"
          : secondsLeft > 0
            ? `Ping sent · again in ${secondsLeft}s`
            : "Ping your waiter"}
      </button>
      {order.pingedAt && (
        <p className="mt-2 text-center text-xs text-secondary-text">
          Last ping {timeAgo(order.pingedAt)}
          {order.pingMessage ? ` · “${order.pingMessage}”` : ""}
        </p>
      )}
    </div>
  );
}

function ChatCard({
  order,
  email,
  state,
  socketState,
}: {
  order: PublicMenuOrder;
  email: string;
  state: WaiterState;
  socketState: SocketState;
}) {
  const [draft, setDraft] = useState("");
  const canSend = state === "assigned";
  // Poll only as a fallback while the socket is down.
  const { messages, isLoading } = useOrderMessages(order.id, email, {
    enabled: state !== "none",
    pollMs: canSend && socketState !== "live" ? 10_000 : false,
  });
  const send = useSendOrderMessage(order.id, email);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages.length]);

  const submit = () => {
    const body = draft.trim();
    if (!body || !canSend) return;
    send.mutate(body, {
      onSuccess: () => setDraft(""),
      onError: (error) => toast.error(apiErrorMessage(error)),
    });
  };

  const placeholder = useMemo(() => {
    if (state === "none") return "Chat opens once a waiter accepts your order";
    if (state === "released") return "This chat closed when the waiter handed over";
    return "Message your waiter…";
  }, [state]);

  return (
    <div className="rounded-2xl border border-background-light bg-white/90 p-4">
      <p className="flex items-center gap-2 px-1 font-semibold text-primary-text">
        <MessageCircle className="h-4 w-4 text-primary" /> Chat with your waiter
      </p>

      <div className="mt-3 max-h-72 space-y-2 overflow-y-auto rounded-xl bg-background/70 p-3">
        {isLoading && state !== "none" ? (
          <p className="py-6 text-center text-xs text-secondary-text">Loading messages…</p>
        ) : messages.length === 0 ? (
          <p className="py-6 text-center text-xs text-secondary-text">
            {canSend ? "No messages yet. Say hi or ask for anything." : placeholder}
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.sender === "GUEST";
            return (
              <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-3 py-2 text-sm",
                    mine
                      ? "rounded-br-md bg-primary text-white"
                      : "rounded-bl-md border border-background-light bg-white text-primary-text",
                  )}
                >
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  <p className={cn("mt-0.5 text-[10px]", mine ? "text-white/70" : "text-secondary-text")}>
                    {mine ? "You" : "Waiter"} · {timeAgo(m.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="mt-3 flex items-center gap-2"
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value.slice(0, 500))}
          disabled={!canSend}
          placeholder={placeholder}
          className="h-11 min-w-0 flex-1 rounded-xl border border-background-light bg-white px-3 text-sm text-primary-text outline-none focus:border-primary disabled:bg-background disabled:text-secondary-text"
        />
        <button
          type="submit"
          aria-label="Send message"
          disabled={!canSend || !draft.trim() || send.isPending}
          className="btn-press grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary text-white disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}

function RatingCard({ orderId, email }: { orderId: string; email: string }) {
  const [mine, setMine] = useState<MyRating | null>(null);
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");
  const rate = useRateWaiter(orderId, email);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading browser storage after mount
    setMine(getMyRating(orderId));
  }, [orderId]);

  const submit = () =>
    rate.mutate(
      { stars, comment },
      {
        onSuccess: () => {
          const saved = { stars, comment: comment.trim() || undefined };
          setMyRating(orderId, saved);
          setMine(saved);
          toast.success("Thanks for the rating!");
        },
        onError: (error) => toast.error(apiErrorMessage(error)),
      },
    );

  return (
    <div className="rounded-2xl border border-background-light bg-white/90 p-5">
      <p className="text-[11px] font-bold uppercase tracking-wider text-secondary-text">Rate your waiter</p>
      {mine ? (
        <p className="mt-2 text-sm text-primary-text">
          You rated <span className="text-primary">{"★".repeat(mine.stars)}</span>
          {mine.comment && <> — “{mine.comment}”</>}
        </p>
      ) : (
        <>
          <div className="mt-2 flex gap-1.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => setStars(n)} aria-label={`${n} star${n > 1 ? "s" : ""}`}>
                <Star
                  className={cn(
                    "h-8 w-8 transition-colors",
                    n <= stars ? "fill-primary text-primary" : "text-background-light",
                  )}
                />
              </button>
            ))}
          </div>
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value.slice(0, 300))}
            placeholder="Optional comment"
            className="mt-3 h-11 w-full rounded-xl border border-background-light bg-white px-3 text-sm text-primary-text outline-none focus:border-primary"
          />
          <button
            onClick={submit}
            disabled={stars === 0 || rate.isPending}
            className="btn-press mt-3 w-full rounded-xl bg-primary-accent py-3 text-sm font-bold text-primary disabled:opacity-50"
          >
            {rate.isPending ? "Sending…" : "Submit rating"}
          </button>
        </>
      )}
    </div>
  );
}

const TIP_PRESETS = [500, 1000, 2000, 5000];

/** Session key for the tip reference, for providers that don't echo it back. */
export const TIP_REFERENCE_KEY = "spinstrip:pending-tip";

/**
 * Starts a tip payment and hands off to the provider. The API only accepts
 * tips while a waiter holds the order, so this card hides after a release.
 */
function TipCard({ orderId, email }: { orderId: string; email: string }) {
  const [amount, setAmount] = useState<number>(1000);
  const [custom, setCustom] = useState("");
  const [method, setMethod] = useState<TipPaymentMethod>("PAYSTACK");
  const tip = useTipWaiter(orderId, email);
  const value = custom ? Math.round(Number(custom)) : amount;
  const valid = Number.isFinite(value) && value >= 1;

  const start = () => {
    if (!valid) return;
    // Trailing slash matches `trailingSlash: true` in next.config.
    const callbackUrl = `${window.location.origin}/orders/${orderId}/?tip=1`;
    tip.mutate(
      { amount: value, paymentMethod: method, callbackUrl },
      {
        onSuccess: (data) => {
          const url = data?.payment?.authorizationUrl;
          if (!url) {
            toast.error("We couldn't start the tip payment. Please try again.");
            return;
          }
          try {
            sessionStorage.setItem(TIP_REFERENCE_KEY, data.payment.reference);
          } catch {
            /* the ?reference param still works */
          }
          window.location.assign(url);
        },
        onError: (error) => toast.error(apiErrorMessage(error)),
      },
    );
  };

  return (
    <div className="rounded-2xl border border-primary/30 bg-white/90 p-5">
      <p className="flex items-center gap-2 font-semibold text-primary-text">
        <Wallet className="h-4 w-4 text-primary" /> Tip your waiter
      </p>
      <p className="mt-0.5 text-xs text-secondary-text">Goes straight to their wallet.</p>
      <div className="mt-3 grid grid-cols-4 gap-2">
        {TIP_PRESETS.map((preset) => (
          <button
            key={preset}
            onClick={() => {
              setAmount(preset);
              setCustom("");
            }}
            className={cn(
              "btn-press rounded-xl border py-2.5 text-sm font-bold tabular-nums transition-colors",
              !custom && amount === preset
                ? "border-primary bg-primary-accent text-primary"
                : "border-background-light bg-white text-primary-text hover:border-primary-tint",
            )}
          >
            {formatPrice(preset)}
          </button>
        ))}
      </div>
      <input
        value={custom}
        onChange={(e) => setCustom(e.target.value.replace(/\D/g, "").slice(0, 7))}
        inputMode="numeric"
        placeholder="Or enter an amount (₦)"
        className="mt-2 h-11 w-full rounded-xl border border-background-light bg-white px-3 text-sm tabular-nums text-primary-text outline-none focus:border-primary"
      />
      <div className="mt-3 grid grid-cols-2 gap-2">
        {(
          [
            ["PAYSTACK", "Paystack"],
            ["LEDGER_BLOCK", "Fuspay"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setMethod(id)}
            className={cn(
              "rounded-xl border py-2 text-xs font-semibold transition-colors",
              method === id
                ? "border-primary bg-primary-accent/60 text-primary"
                : "border-background-light bg-white text-secondary-text",
            )}
          >
            {label}
          </button>
        ))}
      </div>
      <button
        onClick={start}
        disabled={!valid || tip.isPending}
        className="btn-press mt-3 w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-white shadow-[0_8px_24px_-8px_rgba(105,50,226,0.6)] disabled:opacity-50"
      >
        {tip.isPending ? "Starting payment…" : valid ? `Tip ${formatPrice(value)}` : "Choose an amount"}
      </button>
    </div>
  );
}
