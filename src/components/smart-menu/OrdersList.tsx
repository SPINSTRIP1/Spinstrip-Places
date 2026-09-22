"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronRight, Lock, ReceiptText, Store } from "lucide-react";
import EmptyState from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePublicOrders, type PublicMenuOrder } from "@/hooks/use-menu";
import { getKnownEmails, getOrderSnapshot } from "@/lib/smart-menu";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/utils";

/** Status pill copy and colour for the storefront's order states. */
export function orderStatusMeta(status: string) {
  const s = status.toUpperCase();
  if (s === "PENDING")
    return { label: "Awaiting payment", className: "bg-amber-50 text-amber-700" };
  if (s === "CONFIRMED")
    return { label: "Placed", className: "bg-primary-accent text-primary" };
  if (/CANCEL|FAIL|REFUND/.test(s))
    return { label: "Cancelled", className: "bg-red-50 text-red-600" };
  if (/COMPLET|SERVED|DELIVER/.test(s))
    return { label: "Served", className: "bg-emerald-50 text-emerald-700" };
  if (/PREPAR|ONGOING|PROGRESS|READY/.test(s))
    return { label: "In the kitchen", className: "bg-sky-50 text-sky-700" };
  if (/ACCEPT|CLAIM/.test(s))
    return { label: "Claimed", className: "bg-primary-accent text-primary" };
  return { label: s.charAt(0) + s.slice(1).toLowerCase(), className: "bg-background text-secondary-text" };
}

function formatWhen(iso: string) {
  const date = new Date(iso);
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function OrderRow({ order, index }: { order: PublicMenuOrder; index: number }) {
  const status = orderStatusMeta(order.status);
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
  // The API doesn't carry the restaurant name or table yet; the snapshot
  // saved on this phone at checkout usually does.
  const snapshot = getOrderSnapshot(order.id);
  const restaurantName = order.restaurantName || snapshot?.restaurantName || "Restaurant";
  const summary = order.items
    .map((item) => `${item.quantity}× ${item.name}`)
    .join(", ");

  return (
    <Link
      href={`/orders/${order.id}`}
      className="listing-card card-in flex items-center gap-4 rounded-3xl border border-background-light bg-white/90 p-4 backdrop-blur-md"
      style={{ "--i": index } as React.CSSProperties}
    >
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary-accent text-primary">
        <Store className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-display truncate text-base font-bold text-primary-text">
            {restaurantName}
          </p>
          <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold", status.className)}>
            {status.label}
          </span>
        </div>
        <p className="mt-0.5 truncate text-xs text-secondary-text">{summary}</p>
        <p className="mt-1 text-xs text-secondary-text">
          <span className="font-semibold tabular-nums text-primary">{order.displayCode}</span>
          {" · "}
          {formatWhen(order.createdAt)}
          {snapshot?.tableNumber && ` · Table ${snapshot.tableNumber}`}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <p className="font-display text-base font-bold text-primary-text">
          {formatPrice(order.totalAmount)}
        </p>
        <p className="text-[11px] text-secondary-text">
          {itemCount} {itemCount === 1 ? "item" : "items"}
        </p>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-secondary-text" />
    </Link>
  );
}

/**
 * Orders placed from this phone. There is no login on the storefront, so
 * the guard is the email remembered at checkout: no checkout here, no
 * order history — and never an email prompt, since the list API would let
 * anyone read any customer's orders by address.
 */
export default function OrdersList() {
  const [emails, setEmails] = useState<string[] | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading browser storage after mount
    setEmails(getKnownEmails());
  }, []);

  const { orders, isLoading } = usePublicOrders(emails ?? []);

  return (
    <div className="section-swap mx-auto min-h-dvh max-w-2xl px-4 pb-16 pt-24 sm:px-6">
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1 text-sm text-secondary-text transition-colors hover:text-primary-text"
      >
        <ArrowLeft className="h-4 w-4" /> Back to restaurants
      </Link>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display flex items-center gap-2.5 text-3xl font-bold tracking-tight text-primary-text">
            <span aria-hidden className="h-7 w-1.5 rounded-full bg-primary" />
            My orders
          </h1>
          <p className="mt-1 text-sm text-secondary-text">
            Open an order for its receipt QR, live status and table games.
          </p>
        </div>
        {emails && emails.length > 0 && !isLoading && (
          <span className="shrink-0 rounded-full bg-primary-accent px-3 py-1 text-xs font-semibold text-primary">
            {orders.length} {orders.length === 1 ? "order" : "orders"}
          </span>
        )}
      </div>

      <div className="mt-6">
        {emails === null || (emails.length > 0 && isLoading) ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 rounded-3xl border border-background-light bg-white/90 p-4"
              >
                <Skeleton className="h-12 w-12 shrink-0 rounded-2xl" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-1/2 rounded-md" />
                  <Skeleton className="mt-2 h-3 w-3/4 rounded-md" />
                  <Skeleton className="mt-2 h-3 w-1/3 rounded-md" />
                </div>
                <Skeleton className="h-5 w-16 rounded-md" />
              </div>
            ))}
          </div>
        ) : emails.length === 0 ? (
          <EmptyState
            icon={<Lock size={26} />}
            title="No orders on this phone yet"
            description="Your order history unlocks after your first order here. Scan a table code or pick a restaurant to get started."
            action={
              <Button asChild size="lg">
                <Link href="/">Browse restaurants</Link>
              </Button>
            }
          />
        ) : orders.length === 0 ? (
          <EmptyState
            icon={<ReceiptText size={26} />}
            title="Nothing to show yet"
            description="We couldn't find orders for the email you checked out with. If you just paid, give it a moment and refresh."
            action={
              <Button asChild size="lg">
                <Link href="/">Browse restaurants</Link>
              </Button>
            }
          />
        ) : (
          <div className="space-y-3">
            {orders.map((order, i) => (
              <OrderRow key={order.id} order={order} index={i} />
            ))}
          </div>
        )}
      </div>

      {emails && emails.length > 0 && (
        <p className="mt-6 text-center text-xs text-secondary-text">
          Showing orders for {emails.join(", ")} — the {emails.length === 1 ? "email" : "emails"} used at
          checkout on this phone.
        </p>
      )}
    </div>
  );
}
