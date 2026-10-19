"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Clock3,
  MapPin,
  ReceiptText,
  ShoppingBag,
  Star,
  Store,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import AuroraBackground from "@/components/AuroraBackground";
import EmptyState from "@/components/empty-state";
import Loader from "@/components/loader";
import MediaImage from "@/components/media-image";
import { maxQuantity } from "@/components/restaurant/ItemSheet";
import MenuBrowser from "@/components/restaurant/MenuBrowser";
import MenuOrderLayer from "@/components/restaurant/MenuOrderLayer";
import RestaurantInfo from "@/components/restaurant/RestaurantInfo";
import RestaurantLogo from "@/components/restaurant/RestaurantLogo";
import RestaurantReviews from "@/components/restaurant/RestaurantReviews";
import { Button } from "@/components/ui/button";
import { sectionThemeVars } from "@/data/listings";
import { findTable, isMenuItemOrderable, usePublicTables } from "@/hooks/use-menu";
import { useMenuOrdering } from "@/hooks/use-menu-ordering";
import { useRestaurant } from "@/hooks/use-restaurants";
import {
  decodeCartTransfer,
  getTable,
  setTable,
  tableFromSearch,
} from "@/lib/smart-menu";
import { cn } from "@/lib/utils";
import { formatPrice, getOpenStatus } from "@/utils";

interface Props {
  merchantId: string;
}

type Tab = "about" | "menu" | "reviews";

const TABS: { value: Tab; label: string; icon: typeof Store }[] = [
  { value: "about", label: "About", icon: Store },
  { value: "menu", label: "Menu", icon: UtensilsCrossed },
  { value: "reviews", label: "Reviews", icon: Star },
];

const isTab = (value: string | null): value is Tab =>
  TABS.some((entry) => entry.value === value);

/**
 * Restaurant storefront. The order lives here, not in the checkout: the
 * customer adds as many dishes as they like, reviews them with "Place
 * order", then pays. One cart per restaurant, persisted per restaurant.
 *
 * Smart Menu: a table QR opens this page with `?number=<table>`, which is
 * remembered for the visit and printed on the order. `?transfer=<code>` is
 * a cart another diner sent to this phone (the table captain) via QR.
 */
export default function RestaurantPage({ merchantId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightedItemId = searchParams.get("item");
  const transferCode = searchParams.get("transfer");
  const scannedAtTable = tableFromSearch(searchParams) !== null;

  const { restaurant, isLoading } = useRestaurant(merchantId);

  const items = useMemo(() => restaurant?.items ?? [], [restaurant]);
  const ordering = useMenuOrdering(merchantId, items);
  const { setCart, setTags, setOpenItem, cartCount, setCheckoutOpen } = ordering;
  const [tableNumber, setTableNumber] = useState<string | null>(null);
  // Match the scanned number to one of the merchant's real tables, for the table chip.
  const { tables: merchantTables } = usePublicTables(merchantId);
  const scannedTable = findTable(merchantTables, tableNumber);
  const autoOpened = useRef(false);
  const transferApplied = useRef(false);
  // `?tab=about` / `?tab=reviews` deep-link straight to a tab; Menu is home.
  const [tab, setTab] = useState<Tab>(() => {
    const fromUrl = searchParams.get("tab");
    return isTab(fromUrl) ? fromUrl : "menu";
  });
  /** Each tab keeps its own scroll position, like the tabs of a native app. */
  const tabScroll = useRef<Partial<Record<Tab, number>>>({});

  // Runs after the new tab's panel is visible, so its height is real.
  useEffect(() => {
    window.scrollTo({ top: tabScroll.current[tab] ?? 0 });
  }, [tab]);

  // The table this diner scanned earlier in the visit.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading browser storage after mount
    setTableNumber(getTable(merchantId));
  }, [merchantId]);

  // A table QR carries the table number; keep it for the whole visit.
  useEffect(() => {
    const fromUrl = tableFromSearch(searchParams);
    if (!fromUrl) return;
    setTable(merchantId, fromUrl);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing the scanned table into state
    setTableNumber(fromUrl);
  }, [merchantId, searchParams]);

  // Arriving from a dish card on the home page opens that dish straight away.
  useEffect(() => {
    if (autoOpened.current || !restaurant || !highlightedItemId) return;
    const item = restaurant.items.find((entry) => entry.id === highlightedItemId);
    if (!item) return;
    autoOpened.current = true;
    setOpenItem(item);
  }, [restaurant, highlightedItemId, setOpenItem]);

  // The table captain scanned a diner's transfer QR: merge their cart into
  // ours, tag the lines with their nickname, and clean the URL so a refresh
  // doesn't add it twice.
  useEffect(() => {
    if (transferApplied.current || !restaurant || !transferCode || !ordering.ready) return;
    transferApplied.current = true;
    const transfer = decodeCartTransfer(transferCode);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("transfer");
    router.replace(`/restaurants/${merchantId}${params.size ? `?${params}` : ""}`);
    if (!transfer) {
      toast.error("That cart transfer link is invalid or incomplete.");
      return;
    }
    let added = 0;
    const nextCart = { ...ordering.cart };
    const nextTags = { ...ordering.tags };
    for (const [id, qty] of Object.entries(transfer.lines)) {
      const item = restaurant.items.find((entry) => entry.id === id);
      if (!item || !isMenuItemOrderable(item)) continue;
      const current = nextCart[id] ?? 0;
      const next = Math.min(maxQuantity(item), current + qty);
      if (next === current) continue;
      nextCart[id] = next;
      added += next - current;
      const existing = nextTags[id] ?? [];
      if (!existing.includes(transfer.nick)) nextTags[id] = [...existing, transfer.nick];
    }
    if (added === 0) {
      toast.error(`${transfer.nick}'s cart had nothing that can be ordered right now.`);
      return;
    }
    setCart(nextCart);
    setTags(nextTags);
    toast.success(`${transfer.nick}'s cart added — ${added} ${added === 1 ? "item" : "items"}`);
  }, [restaurant, transferCode, merchantId, router, searchParams, ordering.ready, ordering.cart, ordering.tags, setCart, setTags]);

  const selectTab = (next: Tab) => {
    // Tapping the tab you're on scrolls it back to the top, as native apps do.
    if (next === tab) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    tabScroll.current[tab] = window.scrollY;
    setTab(next);
    // Keep the tab in the URL so a refresh or shared link opens the same one.
    // replaceState, not a push: switching tabs shouldn't fill the back stack.
    const params = new URLSearchParams(window.location.search);
    if (next === "menu") params.delete("tab");
    else params.set("tab", next);
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${params.size ? `?${params}` : ""}`,
    );
  };

  // Arrow keys move between tabs, as in a native tab list.
  const handleTabKeys = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    const index = TABS.findIndex((entry) => entry.value === tab);
    const step = event.key === "ArrowRight" ? 1 : -1;
    const next = TABS[(index + step + TABS.length) % TABS.length].value;
    selectTab(next);
    event.currentTarget.querySelector<HTMLButtonElement>(`#tab-${next}`)?.focus();
  };

  if (isLoading) return <Loader label="Loading the menu…" />;

  // Merchants without a published place aren't listed, so their storefront is "not found" too.
  if (!restaurant?.place) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <EmptyState
          icon={<UtensilsCrossed size={26} />}
          title="Restaurant not found"
          description="This kitchen hasn't published a menu on SpinStrip, or the link you followed is out of date."
          action={
            <Button asChild size="lg">
              <Link href="/">Browse restaurants</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const open = getOpenStatus(restaurant.place?.operatingHours);
  const tableChip = tableNumber && (
    <span className="sec-soft sec-text inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold">
      <Users className="h-3.5 w-3.5" /> Table {tableNumber}
      {scannedTable?.name ? ` · ${scannedTable.name}` : ""}
    </span>
  );

  return (
    <div
      className="section-swap min-h-screen pb-44 md:pb-32"
      style={sectionThemeVars("menu")}
    >
      <AuroraBackground />

      {/* Top bar */}
      <header className="fixed inset-x-0 top-0 z-40 border-b border-background-light bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          {/* A table QR (`?number=`) is the diner's entry point, so there's nowhere to go back to. */}
          {!scannedAtTable && (
            <Link
              href="/"
              className="btn-press flex shrink-0 items-center gap-1.5 rounded-full border border-background-light bg-white px-3.5 py-2 text-sm font-semibold text-primary-text hover:border-[color:var(--sec-border)]"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </Link>
          )}
          <div className="flex min-w-0 items-center gap-2">
            <RestaurantLogo
              name={restaurant.name}
              monogram={restaurant.monogram}
              src={restaurant.logo}
              size={32}
              className="rounded-xl"
            />
            <span className="font-display truncate text-sm font-bold text-primary-text sm:text-base">
              {restaurant.name}
            </span>
            {tableNumber && (
              <span className="sec-soft sec-text hidden shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold sm:inline">
                Table {tableNumber}
              </span>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/orders"
              aria-label="My orders"
              className="btn-press flex h-10 w-10 items-center justify-center rounded-full border border-background-light bg-white text-primary-text hover:border-[color:var(--sec-border)]"
            >
              <ReceiptText className="h-5 w-5" />
            </Link>
            <button
              onClick={() => cartCount > 0 && setCheckoutOpen(true)}
              className="btn-press relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-background-light bg-white text-primary-text hover:border-[color:var(--sec-border)]"
            aria-label={cartCount > 0 ? `Review order, ${cartCount} items` : "Your order is empty"}
          >
            <ShoppingBag className="h-5 w-5" />
            {cartCount > 0 && (
              <span
                key={cartCount}
                className="sec-bg bump absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
              >
                {cartCount}
              </span>
            )}
            </button>
          </div>
        </div>
      </header>

      {/* Room for the fixed top bar */}
      <div className="h-16" aria-hidden />

      {/* Desktop tabs, stuck under the top bar. Phones get the bottom bar instead. */}
      <div className="sticky top-16 z-30 hidden border-b border-background-light bg-white/80 backdrop-blur-xl md:block">
        <div
          role="tablist"
          aria-label={`${restaurant.name} sections`}
          onKeyDown={handleTabKeys}
          className="mx-auto flex max-w-7xl gap-8 px-6"
        >
          {TABS.map((entry) => {
            const active = tab === entry.value;
            return (
              <button
                key={entry.value}
                id={`tab-${entry.value}`}
                type="button"
                role="tab"
                aria-selected={active}
                aria-controls={`panel-${entry.value}`}
                tabIndex={active ? 0 : -1}
                onClick={() => selectTab(entry.value)}
                className={cn(
                  "relative py-3.5 text-sm font-bold transition-colors",
                  active ? "text-primary-text" : "text-secondary-text hover:text-primary-text",
                )}
              >
                {entry.label}
                {active && (
                  <span className="sec-bg absolute inset-x-0 bottom-0 h-0.5 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* About tab. Panels are hidden, not unmounted, so search, filters and a
          half-written review survive switching tabs. */}
      <div
        role="tabpanel"
        id="panel-about"
        aria-labelledby="tab-about"
        hidden={tab !== "about"}
      >
        {/* Branded hero */}
        <section className="relative">
          <div className="relative h-52 overflow-hidden sm:h-72">
            {restaurant.cover ? (
              <MediaImage
                src={restaurant.cover}
                alt=""
                eager
                className="h-full w-full"
              />
            ) : (
              <div className="sec-gradient h-full w-full opacity-90" />
            )}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to top, rgba(15,15,15,0.72), rgba(15,15,15,0.08) 60%), linear-gradient(135deg, var(--sec-glow), transparent 55%)",
              }}
            />
          </div>

          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="relative -mt-14 rounded-3xl border border-background-light bg-white/90 p-5 shadow-[0_20px_50px_-20px_var(--sec-glow)] backdrop-blur-xl sm:-mt-16 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <RestaurantLogo
                  name={restaurant.name}
                  monogram={restaurant.monogram}
                  src={restaurant.logo}
                  size={72}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <h1 className="font-display text-2xl font-bold text-primary-text">
                      {restaurant.name}
                    </h1>
                    {tableChip}
                    {open && (
                      <span
                        className={cn(
                          "flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                          open.isOpen
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-background text-secondary-text",
                        )}
                      >
                        {open.isOpen && <span className="live-dot" />}
                        {open.label}
                      </span>
                    )}
                  </div>
                  {restaurant.categories.length > 0 && (
                    <p className="sec-text mt-0.5 text-xs font-semibold">
                      {restaurant.categories.join(" · ")}
                    </p>
                  )}
                  {restaurant.place?.description && (
                    <p className="mt-1.5 line-clamp-2 text-sm text-secondary-text">
                      {restaurant.place.description}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-secondary-text">
                    {restaurant.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="sec-text h-3.5 w-3.5" />
                        {restaurant.location}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <UtensilsCrossed className="sec-text h-3.5 w-3.5" />
                      {restaurant.dishCount}{" "}
                      {restaurant.dishCount === 1 ? "dish" : "dishes"}
                      {restaurant.minPrice !== null &&
                        ` · from ${formatPrice(restaurant.minPrice)}`}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2 self-start sm:self-center">
                  <Image
                    src="/logo.png"
                    alt="SpinStrip"
                    width={1671}
                    height={512}
                    className="h-4 w-auto opacity-70"
                  />
                  <span className="text-[10px] font-medium uppercase tracking-widest text-secondary-text">
                    on SpinStrip
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto mt-6 max-w-7xl px-4 sm:px-6">
          <RestaurantInfo restaurant={restaurant} />
        </div>
      </div>

      {/* Menu tab */}
      <div
        role="tabpanel"
        id="panel-menu"
        aria-labelledby="tab-menu"
        hidden={tab !== "menu"}
      >
        {/* Status strip: the hero lives on About, so keep table and hours in view here. */}
        {(tableChip || open) && (
          <div className="mx-auto mt-4 flex max-w-7xl flex-wrap items-center gap-2 px-4 sm:px-6">
            {tableChip}
            {open && (
              <span
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
                  open.isOpen ? "bg-emerald-50 text-emerald-700" : "bg-white/80 text-secondary-text",
                )}
              >
                {open.isOpen && <span className="live-dot" />}
                {open.label}
              </span>
            )}
          </div>
        )}

        <MenuBrowser restaurant={restaurant} ordering={ordering} />

        {/* Small reassurance for kitchens without hours */}
        {!open && (
          <p className="mx-auto mt-10 flex max-w-7xl items-center gap-1.5 px-4 text-xs text-secondary-text sm:px-6">
            <Clock3 className="h-3.5 w-3.5" />
            Serving times are shown per dish. Prices are confirmed by the
            restaurant when you pay.
          </p>
        )}
      </div>

      {/* Reviews tab */}
      <section
        role="tabpanel"
        id="panel-reviews"
        aria-labelledby="tab-reviews"
        hidden={tab !== "reviews"}
        className="mx-auto mt-6 max-w-7xl px-4 sm:px-6"
      >
        <RestaurantReviews merchantId={merchantId} restaurantName={restaurant.name} />
      </section>

      {/* Phone tab bar, like a native app's. Desktop uses the tabs under the header. */}
      <nav
        aria-label={`${restaurant.name} sections`}
        className="fixed inset-x-0 bottom-0 z-40 border-t border-background-light bg-white/90 backdrop-blur-xl md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="grid h-16 grid-cols-3">
          {TABS.map(({ value, label, icon: Icon }) => {
            const active = tab === value;
            return (
              <button
                key={value}
                type="button"
                aria-current={active ? "page" : undefined}
                aria-controls={`panel-${value}`}
                onClick={() => selectTab(value)}
                className={cn(
                  "btn-press flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition-colors",
                  active ? "sec-text" : "text-secondary-text",
                )}
              >
                <span
                  className={cn(
                    "relative grid h-8 w-14 place-items-center rounded-full transition-colors duration-300",
                    active && "sec-soft",
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 2} />
                  {value === "menu" && cartCount > 0 && (
                    <span
                      key={cartCount}
                      className="sec-bg bump absolute -top-1 right-2 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold text-white"
                    >
                      {cartCount}
                    </span>
                  )}
                </span>
                {label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Place order bar (floats above the phone tab bar), dish sheet and checkout */}
      <MenuOrderLayer
        restaurant={restaurant}
        ordering={ordering}
        tableNumber={tableNumber}
        barClassName="inset-x-3 bottom-[calc(4.75rem_+_env(safe-area-inset-bottom))] sm:inset-x-auto sm:right-6 sm:w-[420px] md:bottom-[calc(0.75rem_+_env(safe-area-inset-bottom))]"
      />
    </div>
  );
}
