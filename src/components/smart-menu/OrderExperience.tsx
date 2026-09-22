"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import QRCode from "qrcode";
import {
  ArrowLeft,
  Bell,
  CreditCard,
  Gamepad2,
  Hand,
  Puzzle,
  ReceiptText,
  Sparkles,
  Star,
  Trophy,
  Users,
  Wallet,
} from "lucide-react";
import EmptyState from "@/components/empty-state";
import Loader from "@/components/loader";
import MediaImage from "@/components/media-image";
import { orderStatusMeta } from "@/components/smart-menu/OrdersList";
import { Button } from "@/components/ui/button";
import { usePublicOrder, type PublicMenuOrder } from "@/hooks/use-menu";
import { useRestaurant } from "@/hooks/use-restaurants";
import {
  getDinerNick,
  getOrderSnapshot,
  orderIdForReference,
  receiptQrPayload,
  setDinerNick,
  shortOrderCode,
  type OrderSnapshot,
} from "@/lib/smart-menu";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/utils";

const TABS = [
  { id: "order", label: "My Order", icon: ReceiptText },
  { id: "waiter", label: "My Waiter", icon: Hand },
  { id: "group", label: "Group", icon: Users },
  { id: "game", label: "Game", icon: Gamepad2 },
] as const;
type TabId = (typeof TABS)[number]["id"];

const STEPS = ["Placed", "Claimed", "Ongoing", "Served"] as const;

const GAMES = [
  { id: "jigsaw", name: "Restaurant Puzzle", desc: "3×3 jigsaw swap — fastest time + fewest moves wins", icon: Puzzle },
  { id: "tiles", name: "Polymorphic Tiles", desc: "Fill the 8×8 board — efficiency score", icon: Sparkles },
  { id: "spinanza", name: "Spin-to-Build", desc: "Spin the wheel, build your castle first", icon: Gamepad2 },
] as const;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Map whatever status the backend uses onto the four-step timeline. */
function stepForStatus(status: string | undefined): number {
  const s = (status ?? "").toUpperCase();
  if (/SERVED|COMPLETED|DELIVERED|FULFILLED/.test(s)) return 3;
  if (/PREPARING|ONGOING|IN_PROGRESS|PROCESSING|READY/.test(s)) return 2;
  if (/ACCEPTED|CLAIMED/.test(s)) return 1;
  return 0;
}

/** One line as the page renders it, whichever source it came from. */
interface Line {
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
  image: string | null;
  sourceNicks: string[];
}

interface Props {
  orderId: string;
}

/**
 * The page a diner lands on after paying, and from "My orders" later: the
 * receipt QR a waiter scans to claim the table, where the order is, and
 * something to do while they wait.
 *
 * The order itself comes from the API, so it works on any device. The
 * snapshot saved at checkout only adds what the API doesn't have yet: the
 * table number, dish photos and who transferred which lines.
 */
export default function OrderExperience({ orderId }: Props) {
  const searchParams = useSearchParams();
  const [snapshot, setSnapshot] = useState<OrderSnapshot | null | undefined>(undefined);
  const [tab, setTab] = useState<TabId>("order");
  const [qr, setQr] = useState<string | null>(null);
  const [nick, setNick] = useState("");

  // The snapshot lives in localStorage, so it can only be read on the client.
  useEffect(() => {
    const reference = searchParams.get("ref");
    const resolvedId =
      getOrderSnapshot(orderId) ? orderId : (reference && orderIdForReference(reference)) || orderId;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrating from browser storage
    setSnapshot(getOrderSnapshot(resolvedId));
    setNick(getDinerNick());
  }, [orderId, searchParams]);

  // A reference can stand in for the id on the URL; the snapshot maps it.
  const apiId = UUID.test(orderId) ? orderId : snapshot?.id && UUID.test(snapshot.id) ? snapshot.id : null;
  const { order, isLoading: orderLoading } = usePublicOrder(apiId);

  const merchantId = order?.merchantUserId ?? snapshot?.merchantId ?? null;

  // The API carries no restaurant name or dish photos yet; the storefront
  // profile fills both in.
  const { restaurant } = useRestaurant(merchantId);
  const restaurantName =
    order?.restaurantName || snapshot?.restaurantName || restaurant?.name || "Restaurant";

  const tableNumber =
    snapshot?.tableNumber ??
    (order?.tableNumber !== null && order?.tableNumber !== undefined ? String(order.tableNumber) : null);

  const lines = useMemo<Line[]>(() => {
    const photo = (menuItemId: string) =>
      snapshot?.lines.find((l) => l.menuItemId === menuItemId)?.image ??
      restaurant?.items.find((item) => item.id === menuItemId)?.images?.[0] ??
      null;
    const nicks = (menuItemId: string) =>
      snapshot?.lines.find((l) => l.menuItemId === menuItemId)?.sourceNicks ?? [];
    if (order) {
      return order.items.map((item) => ({
        menuItemId: item.menuItemId,
        name: item.name,
        quantity: item.quantity,
        price: parseFloat(item.unitPrice) || 0,
        image: photo(item.menuItemId),
        sourceNicks: nicks(item.menuItemId),
      }));
    }
    return (snapshot?.lines ?? []).map((l) => ({
      menuItemId: l.menuItemId,
      name: l.name,
      quantity: l.quantity,
      price: l.price,
      image: l.image ?? photo(l.menuItemId),
      sourceNicks: l.sourceNicks ?? [],
    }));
  }, [order, snapshot, restaurant]);

  const total = order ? parseFloat(order.totalAmount) || 0 : (snapshot?.total ?? 0);
  const code = order?.displayCode ?? `#${shortOrderCode(snapshot?.id ?? orderId)}`;
  const status = order?.status;
  const statusMeta = status ? orderStatusMeta(status) : null;
  const awaitingPayment = status?.toUpperCase() === "PENDING";
  const stepIdx = stepForStatus(status);

  const qrSource = useMemo<OrderSnapshot | null>(() => {
    if (!merchantId) return null;
    return {
      id: order?.id ?? snapshot?.id ?? orderId,
      reference: order?.transactionRef ?? snapshot?.reference ?? null,
      merchantId,
      restaurantName,
      tableNumber,
      lines: [],
      total,
      customerName: order?.customerName ?? snapshot?.customerName ?? "",
      placedAt: order?.createdAt ?? snapshot?.placedAt ?? "",
    };
  }, [merchantId, order, snapshot, orderId, restaurantName, tableNumber, total]);

  useEffect(() => {
    if (!qrSource) return;
    void QRCode.toDataURL(receiptQrPayload(qrSource), {
      margin: 1,
      width: 320,
      color: { dark: "#0F0F0F", light: "#FFFFFF" },
    }).then(setQr);
  }, [qrSource]);

  const menuHref = merchantId
    ? `/restaurants/${merchantId}${tableNumber ? `?number=${encodeURIComponent(tableNumber)}` : ""}`
    : "/";
  const gameQuery = `r=${merchantId ?? ""}&t=${encodeURIComponent(tableNumber ?? "")}&order=${order?.id ?? snapshot?.id ?? orderId}`;

  const contributors = useMemo(() => {
    const names = new Set<string>();
    for (const line of lines) for (const n of line.sourceNicks) names.add(n);
    return [...names];
  }, [lines]);

  if (snapshot === undefined || (apiId && orderLoading && !snapshot)) {
    return <Loader label="Opening your order…" />;
  }

  if (!order && !snapshot) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <EmptyState
          icon={<ReceiptText size={26} />}
          title="Order not found"
          description="This order may still be settling, or the link is out of date. Your orders are listed under My orders."
          action={
            <Button asChild size="lg">
              <Link href="/orders">Go to my orders</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="section-swap mx-auto min-h-dvh max-w-md pb-12">
      {/* Header */}
      <header className="px-5 pt-5">
        <div className="mb-3 flex items-center justify-between">
          <Link
            href={menuHref}
            className="inline-flex items-center gap-1 text-sm text-secondary-text transition-colors hover:text-primary-text"
          >
            <ArrowLeft className="h-4 w-4" /> Back to menu
          </Link>
          <Link
            href="/orders"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary"
          >
            <ReceiptText className="h-4 w-4" /> My orders
          </Link>
        </div>
        <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-primary">{restaurantName}</p>
        <h1 className="font-display mt-1 text-3xl font-bold tracking-tight text-primary-text">
          Order {code}
        </h1>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-secondary-text">
          <span>
            {tableNumber ? `Table ${tableNumber} · ` : ""}
            <span className="font-semibold text-primary-text">{formatPrice(total)}</span>
          </span>
          {statusMeta && (
            <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold", statusMeta.className)}>
              {statusMeta.label}
            </span>
          )}
        </p>
      </header>

      {awaitingPayment && (
        <div className="mx-5 mt-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <CreditCard className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Payment hasn&apos;t been confirmed for this order yet. The kitchen starts once it settles; this
            page updates on its own.
          </p>
        </div>
      )}

      {/* Receipt QR */}
      <div className="mx-5 mt-4 rounded-3xl border border-background-light bg-white/90 p-5 text-center backdrop-blur-md">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-secondary-text">
          Receipt QR — show to your waiter
        </p>
        {qr ? (
          // eslint-disable-next-line @next/next/no-img-element -- generated data URI
          <img src={qr} alt="Receipt QR code" className="mx-auto mt-3 w-48 rounded-2xl bg-white p-2" />
        ) : (
          <div className="mx-auto mt-3 h-48 w-48 animate-pulse rounded-2xl bg-primary-accent/60" />
        )}
        <p className="mt-2 text-xs tabular-nums text-secondary-text">
          {code}
          {order?.transactionRef && ` · ${order.transactionRef}`}
        </p>
      </div>

      {/* Status timeline */}
      <div className="mx-5 mt-5 flex items-center">
        {STEPS.map((step, i) => (
          <div key={step} className="flex flex-1 items-center">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "h-2.5 w-2.5 rounded-full",
                  i <= stepIdx ? "bg-primary" : "bg-background-light",
                  i === stepIdx && stepIdx < 3 && !awaitingPayment && "live-dot text-primary",
                )}
              />
              <span
                className={cn(
                  "mt-1 text-[10px] font-medium",
                  i <= stepIdx ? "text-primary-text" : "text-secondary-text",
                )}
              >
                {step}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn("mx-1 mb-4 h-px flex-1", i < stepIdx ? "bg-primary" : "bg-background-light")} />
            )}
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div
        role="tablist"
        className="mx-5 mt-5 grid grid-cols-4 gap-1 rounded-full border border-background-light bg-white/90 p-1 backdrop-blur-md"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex flex-col items-center gap-0.5 rounded-full py-2 text-[10px] font-semibold transition-all",
              tab === t.id
                ? "bg-primary text-white shadow-[0_6px_20px_-6px_rgba(105,50,226,0.7)]"
                : "text-secondary-text",
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      <div className="px-5 pt-4">
        {tab === "order" && (
          <div className="space-y-2">
            {lines.map((line) => (
              <div
                key={line.menuItemId}
                className="flex items-center justify-between gap-3 rounded-2xl border border-background-light bg-white/90 p-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <MediaImage src={line.image} alt={line.name} className="h-11 w-11 shrink-0 rounded-xl" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-primary-text">
                      {line.quantity}× {line.name}
                    </p>
                    {line.sourceNicks.length > 0 ? (
                      <p className="truncate text-xs text-primary">via {line.sourceNicks.join(", ")}</p>
                    ) : (
                      <p className="truncate text-xs text-secondary-text">{formatPrice(line.price)} each</p>
                    )}
                  </div>
                </div>
                <span className="shrink-0 text-sm font-semibold tabular-nums text-secondary-text">
                  {formatPrice(line.quantity * line.price)}
                </span>
              </div>
            ))}
            <div className="flex justify-between px-1 pt-2 text-sm">
              <span className="text-secondary-text">Total</span>
              <span className="font-display text-base font-bold text-primary-text">{formatPrice(total)}</span>
            </div>
            {order && (
              <OrderFacts order={order} />
            )}
            {stepIdx === 3 && (
              <p className="rounded-xl bg-primary-accent/60 p-3 text-center text-sm text-primary">
                Served! Enjoy — and consider rating your waiter.
              </p>
            )}
          </div>
        )}

        {tab === "waiter" && (
          <div className="space-y-3">
            <div className="rounded-2xl border border-background-light bg-white/90 p-6 text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary-accent text-primary">
                <Hand className="h-6 w-6" />
              </span>
              <p className="mt-3 font-semibold text-primary-text">No waiter yet</p>
              <p className="mt-1 text-sm text-secondary-text">
                Show the receipt QR above to any waiter. Once they scan it, this tab unlocks.
              </p>
            </div>
            <ul className="space-y-2">
              {[
                { icon: Bell, title: "Ping your waiter", desc: "One tap to call them over, with a cooldown so it stays polite." },
                { icon: Star, title: "Rate the service", desc: "Once per visit. Ratings feed the restaurant's best-waiter board." },
                { icon: Wallet, title: "Tip directly", desc: "Goes straight to your waiter's wallet." },
              ].map((f) => (
                <li
                  key={f.title}
                  className="flex items-start gap-3 rounded-2xl border border-dashed border-background-light bg-white/60 p-4 opacity-70"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-background text-secondary-text">
                    <f.icon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-primary-text">{f.title}</p>
                    <p className="text-xs text-secondary-text">{f.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {tab === "group" && (
          <div className="space-y-3">
            <div className="rounded-2xl border border-background-light bg-white/90 p-5">
              <p className="font-semibold text-primary-text">Your nickname</p>
              <p className="mt-1 text-sm text-secondary-text">
                Shown on carts you send to the table captain and on the game leaderboard.
              </p>
              <input
                value={nick}
                onChange={(e) => {
                  setNick(e.target.value.slice(0, 24));
                  setDinerNick(e.target.value.slice(0, 24));
                }}
                placeholder="e.g. Ada"
                className="mt-3 h-11 w-full rounded-xl border border-background-light bg-white px-3 text-sm text-primary-text outline-none focus:border-primary"
              />
            </div>
            <div className="rounded-2xl border border-background-light bg-white/90 p-5">
              <p className="font-semibold text-primary-text">Cart transfer</p>
              <p className="mt-1 text-sm text-secondary-text">
                Everyone builds their own cart, then sends it to the table captain via QR from the menu. The
                captain places one order for the table.
              </p>
              {contributors.length > 0 && (
                <p className="mt-2 text-xs text-primary">This order includes carts from {contributors.join(", ")}.</p>
              )}
              <Link
                href={menuHref}
                className="btn-press mt-3 block rounded-xl bg-primary py-3 text-center text-sm font-semibold text-white"
              >
                Open menu{tableNumber ? ` for table ${tableNumber}` : ""}
              </Link>
            </div>
          </div>
        )}

        {tab === "game" && (
          <div className="space-y-3">
            <p className="text-sm text-secondary-text">
              Wait-time games{tableNumber ? ` for table ${tableNumber}` : ""}. Weekly leaderboard per restaurant —
              prizes are house vouchers.
            </p>
            {GAMES.map((g) => (
              <Link
                key={g.id}
                href={`/games/${g.id}?${gameQuery}`}
                className="listing-card flex items-center justify-between gap-3 rounded-2xl border border-background-light bg-white/90 p-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary-accent text-primary">
                    <g.icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-primary-text">{g.name}</p>
                    <p className="mt-0.5 text-xs text-secondary-text">{g.desc}</p>
                  </div>
                </div>
                <Gamepad2 className="h-5 w-5 shrink-0 text-primary" />
              </Link>
            ))}
            <Link
              href={`/games/leaderboard?${gameQuery}`}
              className="flex items-center justify-center gap-2 rounded-2xl border border-background-light bg-white/60 p-4 text-sm font-medium text-secondary-text"
            >
              <Trophy className="h-4 w-4 text-primary" /> This week&apos;s leaderboard
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

/** Receipt-style facts from the server record. */
function OrderFacts({ order }: { order: PublicMenuOrder }) {
  const placed = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(order.createdAt));
  const rows: [string, string][] = [
    ["Placed", placed],
    ["Name", order.customerName],
    ["Payment", order.paymentMethod === "LEDGER_BLOCK" ? "Fuspay" : order.paymentMethod === "PAYSTACK" ? "Paystack" : order.paymentMethod],
  ];
  return (
    <dl className="mt-3 divide-y divide-background-light rounded-2xl border border-background-light bg-white/70 px-4 text-sm">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-center justify-between py-2">
          <dt className="text-secondary-text">{label}</dt>
          <dd className="font-medium text-primary-text">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
