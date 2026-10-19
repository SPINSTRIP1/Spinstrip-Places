"use client";

import { useEffect, useState } from "react";

/**
 * Merchant preview: the merchant dashboard shows these preview pages inside a
 * modal (an iframe with `?merchantPreview=1`). Published places and events load
 * normally from the public API. Drafts and unpublished listings aren't public,
 * so the dashboard sends its own copy of the record over `postMessage` and the
 * page renders that instead — the merchant sees exactly what customers will.
 *
 * Messages are only accepted when framed, and only from dashboard origins.
 */

export type PreviewKind = "place" | "event";

const DEFAULT_DASHBOARD_ORIGINS = [
  "https://merchant.spinstrip.com",
  "http://localhost:3000",
  "http://localhost:3001",
];

export const DASHBOARD_ORIGINS = (process.env.NEXT_PUBLIC_DASHBOARD_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim().replace(/\/+$/, ""))
  .filter(Boolean)
  .concat(DEFAULT_DASHBOARD_ORIGINS);

const READY = "spinstrip:preview-ready";
const DATA = "spinstrip:preview-data";

/** How long a framed page waits for the dashboard's copy before showing "not found". */
const WAIT_MS = 4000;

const FLAG = "spinstrip:merchant-preview";

/** Framed with `?merchantPreview=1` — remembered for the session so in-preview navigation keeps it. */
export function isMerchantPreview() {
  if (typeof window === "undefined" || window.parent === window) return false;
  try {
    if (new URLSearchParams(window.location.search).get("merchantPreview") === "1") {
      sessionStorage.setItem(FLAG, "1");
      return true;
    }
    return sessionStorage.getItem(FLAG) === "1";
  } catch {
    return new URLSearchParams(window.location.search).get("merchantPreview") === "1";
  }
}

/**
 * Listens for the dashboard's copy of a listing. `waiting` is true while a
 * framed preview is still expecting it, so pages can keep their loader up
 * instead of flashing "not found" for a draft.
 */
export function useMerchantPreview<T>(kind: PreviewKind, id: string | null | undefined) {
  const [data, setData] = useState<T | null>(null);
  const [waiting, setWaiting] = useState(false);

  useEffect(() => {
    if (!id || !isMerchantPreview()) return;
    setWaiting(true);

    const onMessage = (event: MessageEvent) => {
      if (!DASHBOARD_ORIGINS.includes(event.origin)) return;
      const message = event.data as { type?: string; kind?: string; id?: string; data?: T };
      if (message?.type !== DATA || message.kind !== kind || message.id !== id || !message.data) return;
      setData(message.data);
      setWaiting(false);
    };
    window.addEventListener("message", onMessage);

    // Tell the dashboard we're ready. Its origin isn't known yet, so ask each allowed one.
    DASHBOARD_ORIGINS.forEach((origin) => {
      try {
        window.parent.postMessage({ type: READY, kind, id }, origin);
      } catch {
        // Not that origin.
      }
    });

    const timer = window.setTimeout(() => setWaiting(false), WAIT_MS);
    return () => {
      window.removeEventListener("message", onMessage);
      window.clearTimeout(timer);
    };
  }, [kind, id]);

  return { data, waiting };
}
