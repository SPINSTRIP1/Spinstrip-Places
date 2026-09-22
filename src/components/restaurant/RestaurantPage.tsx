"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  ArrowRight,
  Clock3,
  Flame,
  MapPin,
  Plus,
  Search,
  SearchX,
  ShoppingBag,
  UtensilsCrossed,
} from "lucide-react";
import AuroraBackground from "@/components/AuroraBackground";
import EmptyState from "@/components/empty-state";
import Loader from "@/components/loader";
import MediaImage from "@/components/media-image";
import DishCard from "@/components/cards/dish-card";
import ItemSheet, { maxQuantity } from "@/components/restaurant/ItemSheet";
import RestaurantLogo from "@/components/restaurant/RestaurantLogo";
import { Button } from "@/components/ui/button";
import CheckOutModal, {
  type MenuCart,
} from "@/app/preview/menu/_components/modals/checkout";
import { sectionThemeVars } from "@/data/listings";
import { isMenuItemOrderable, type PublicMenuItem } from "@/hooks/use-menu";
import { useRestaurant } from "@/hooks/use-restaurants";
import { cn } from "@/lib/utils";
import { formatEnumLabel, formatPrice, getOpenStatus } from "@/utils";

interface Props {
  merchantId: string;
}

const ALL = "All";

const cartKey = (merchantId: string) => `spinstrip:cart:${merchantId}`;

/**
 * Restaurant storefront. The order lives here, not in the checkout: the
 * customer adds as many dishes as they like, reviews them with "Place
 * order", then pays. One cart per restaurant, persisted per restaurant.
 */
export default function RestaurantPage({ merchantId }: Props) {
  const searchParams = useSearchParams();
  const highlightedItemId = searchParams.get("item");

  const { restaurant, isLoading } = useRestaurant(merchantId);

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(ALL);
  const [openItem, setOpenItem] = useState<PublicMenuItem | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [cart, setCart] = useState<MenuCart>({});
  const restored = useRef(false);
  const autoOpened = useRef(false);

  // Restore the saved cart once we're on the client; reading storage during
  // render would break hydration.
  useEffect(() => {
    let saved: MenuCart = {};
    try {
      const raw = localStorage.getItem(cartKey(merchantId));
      if (raw) saved = JSON.parse(raw) as MenuCart;
    } catch {
      /* storage blocked — start empty */
    }
    restored.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- restoring persisted cart on mount
    setCart(saved);
  }, [merchantId]);

  useEffect(() => {
    if (!restored.current) return;
    try {
      localStorage.setItem(cartKey(merchantId), JSON.stringify(cart));
    } catch {
      /* ignore */
    }
  }, [cart, merchantId]);

  // Arriving from a dish card on the home page opens that dish straight away.
  useEffect(() => {
    if (autoOpened.current || !restaurant || !highlightedItemId) return;
    const item = restaurant.items.find(
      (entry) => entry.id === highlightedItemId,
    );
    if (!item) return;
    autoOpened.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- deep link into a dish
    setOpenItem(item);
  }, [restaurant, highlightedItemId]);

  const items = useMemo(() => restaurant?.items ?? [], [restaurant]);

  // Only lines for dishes that are still on the menu and orderable count.
  const lines = useMemo(
    () =>
      items
        .filter((item) => cart[item.id] > 0 && isMenuItemOrderable(item))
        .map((item) => ({ item, quantity: cart[item.id] })),
    [items, cart],
  );
  const cartCount = lines.reduce((sum, line) => sum + line.quantity, 0);
  const cartTotal = lines.reduce(
    (sum, line) => sum + (parseFloat(line.item.price) || 0) * line.quantity,
    0,
  );

  const addToCart = (item: PublicMenuItem, quantity = 1) => {
    if (!isMenuItemOrderable(item)) return;
    const current = cart[item.id] ?? 0;
    const next = Math.min(maxQuantity(item), current + quantity);
    const added = next - current;
    setOpenItem(null);
    if (added <= 0) {
      toast.error(`You already have the maximum of ${item.name}`);
      return;
    }
    setCart({ ...cart, [item.id]: next });
    toast.success(
      `${added} × ${item.name} added${next > added ? ` · ${next} in order` : ""}`,
    );
  };

  // ± on a card. Going below 1 removes the dish; the cap is stock or 20.
  const changeQuantity = (item: PublicMenuItem, delta: number) => {
    const current = cart[item.id] ?? 0;
    const next = current + delta;
    if (next <= 0) {
      const rest = { ...cart };
      delete rest[item.id];
      setCart(rest);
      toast.success(`${item.name} removed`);
      return;
    }
    if (next > maxQuantity(item)) {
      toast.error(`You already have the maximum of ${item.name}`);
      return;
    }
    setCart({ ...cart, [item.id]: next });
  };

  const categories = useMemo(() => {
    if (!restaurant) return [ALL];
    return [ALL, ...restaurant.categories];
  }, [restaurant]);

  const visible = useMemo(() => {
    let list = items;
    if (category !== ALL) {
      list = list.filter(
        (item) => (formatEnumLabel(item.category) || "Other") === category,
      );
    }
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((item) =>
        [item.name, item.description, item.category, item.tag ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(q),
      );
    }
    return list;
  }, [items, category, query]);

  const showHighlights =
    !!restaurant &&
    restaurant.highlights.length > 0 &&
    category === ALL &&
    !query.trim();

  if (isLoading) return <Loader label="Loading the menu…" />;

  if (!restaurant) {
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
  const checkoutItem =
    lines[0]?.item ?? items.find(isMenuItemOrderable) ?? items[0];

  return (
    <div
      className="section-swap min-h-screen pb-32"
      style={sectionThemeVars("menu")}
    >
      <AuroraBackground />

      {/* Top bar */}
      <header className="fixed inset-x-0 top-0 z-40 border-b border-background-light bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link
            href="/"
            className="btn-press flex shrink-0 items-center gap-1.5 rounded-full border border-background-light bg-white px-3.5 py-2 text-sm font-semibold text-primary-text hover:border-[color:var(--sec-border)]"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>

          <button
            onClick={() => cartCount > 0 && setCheckoutOpen(true)}
            className="btn-press relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-background-light bg-white text-primary-text hover:border-[color:var(--sec-border)]"
            aria-label={
              cartCount > 0
                ? `Review order, ${cartCount} items`
                : "Your order is empty"
            }
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
      </header>

      {/* Branded hero */}
      <section className="relative pt-16">
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

      {/* Search */}
      <div className="mx-auto mt-6 max-w-7xl px-4 sm:px-6">
        <label className="search-shell flex items-center gap-3 rounded-2xl border border-background-light bg-white/80 px-4 py-3.5 shadow-sm backdrop-blur-xl">
          <Search className="sec-text h-5 w-5 shrink-0" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search the ${restaurant.name} menu…`}
            enterKeyHint="search"
            className="w-full bg-transparent text-base text-primary-text outline-none placeholder:text-neutral-accent"
          />
        </label>
      </div>

      {/* Popular */}
      {showHighlights && (
        <section className="mx-auto mt-8 max-w-7xl">
          <div className="flex items-center gap-2 px-4 sm:px-6">
            <Flame className="sec-text h-5 w-5" />
            <h2 className="font-display text-lg font-bold text-primary-text">
              Popular here
            </h2>
          </div>
          <div className="chip-rail snap-rail mt-3 flex gap-3 overflow-x-auto px-4 pb-2 sm:px-6">
            {restaurant.highlights.map((item) => (
              <div
                key={item.id}
                role="button"
                tabIndex={0}
                onClick={() => setOpenItem(item)}
                onKeyDown={(event) =>
                  event.key === "Enter" && setOpenItem(item)
                }
                className="listing-card flex w-72 shrink-0 cursor-pointer items-center gap-3 rounded-3xl border border-background-light bg-white/90 p-3 text-left backdrop-blur-md"
              >
                <MediaImage
                  src={item.images?.[0]}
                  alt={item.name}
                  className="h-16 w-16 shrink-0 rounded-2xl"
                />
                <div className="min-w-0 flex-1">
                  {item.tag && (
                    <span className="sec-gradient inline-block max-w-full truncate rounded-full px-2 py-0.5 text-[10px] font-bold text-white">
                      {item.tag}
                    </span>
                  )}
                  <p className="mt-1 truncate text-sm font-semibold text-primary-text">
                    {item.name}
                  </p>
                  <p className="sec-text font-display text-base font-bold">
                    {formatPrice(item.price)}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label={`Add ${item.name} to order`}
                  onClick={(event) => {
                    event.stopPropagation();
                    addToCart(item, 1);
                  }}
                  className="btn-press sec-bg flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white shadow-md"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Categories */}
      <div className="chip-rail mx-auto mt-8 flex max-w-7xl gap-2 overflow-x-auto px-4 py-1 sm:px-6">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={cn(
              "chip shrink-0 rounded-full border px-4 py-2 text-sm font-medium",
              category === c
                ? "chip-active sec-bg border-transparent text-white"
                : "border-background-light bg-white/70 text-secondary-text hover:text-primary-text",
            )}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Menu grid */}
      <section className="mx-auto mt-6 max-w-7xl px-4 sm:px-6">
        {visible.length > 0 ? (
          <div
            key={`${category}-${query}`}
            className="section-swap grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
          >
            {visible.map((item, i) => (
              <DishCard
                key={item.id}
                item={item}
                index={i}
                inCart={cart[item.id] ?? 0}
                maxQuantity={maxQuantity(item)}
                onOpen={setOpenItem}
                onAdd={(dish) => addToCart(dish, 1)}
                onChangeQuantity={changeQuantity}
              />
            ))}
          </div>
        ) : (
          <div className="section-swap flex flex-col items-center gap-3 rounded-3xl border border-dashed border-neutral-accent bg-white/60 py-16 text-center">
            <span className="sec-soft sec-text grid h-14 w-14 place-items-center rounded-full">
              <SearchX className="h-6 w-6" />
            </span>
            <p className="font-display text-lg font-semibold text-primary-text">
              No dishes found
            </p>
            <p className="max-w-xs text-sm text-secondary-text">
              Try another keyword or a different category.
            </p>
            <button
              onClick={() => {
                setQuery("");
                setCategory(ALL);
              }}
              className="btn-press sec-bg mt-2 rounded-full px-5 py-2 text-sm font-semibold text-white"
            >
              Clear filters
            </button>
          </div>
        )}
      </section>

      {/* Place order bar */}
      {cartCount > 0 && !checkoutOpen && !openItem && (
        <div
          className="fixed inset-x-3 z-40 sm:inset-x-auto sm:right-6 sm:w-[420px]"
          style={{ bottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
        >
          <button
            onClick={() => setCheckoutOpen(true)}
            className="bar-in btn-press sec-gradient flex w-full items-center justify-between rounded-full py-3 pl-4 pr-3 text-white"
            style={{ boxShadow: "0 16px 40px -10px var(--sec-glow)" }}
          >
            <span className="flex items-center gap-3">
              <span className="relative grid h-9 w-9 place-items-center rounded-full bg-white/20">
                <ShoppingBag className="h-4 w-4" />
                <span
                  key={cartCount}
                  className="bump absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-primary-text"
                >
                  {cartCount}
                </span>
              </span>
              <span className="text-left">
                <span className="block text-[11px] font-medium text-white/80">
                  {cartCount} {cartCount === 1 ? "item" : "items"} ·{" "}
                  {restaurant.name}
                </span>
                <span className="font-display block text-base font-bold">
                  {formatPrice(cartTotal)}
                </span>
              </span>
            </span>
            <span className="font-display flex items-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-primary-text">
              Place order <ArrowRight className="h-4 w-4" />
            </span>
          </button>
        </div>
      )}

      {/* Sheets */}
      {openItem && (
        <ItemSheet
          item={openItem}
          inCart={cart[openItem.id] ?? 0}
          onClose={() => setOpenItem(null)}
          onAdd={addToCart}
        />
      )}

      {checkoutItem && (
        <CheckOutModal
          isOpen={checkoutOpen}
          onClose={() => setCheckoutOpen(false)}
          item={checkoutItem}
          merchantMenu={items}
          cart={cart}
          onCartChange={setCart}
          restaurantName={restaurant.isNamed ? restaurant.name : undefined}
        />
      )}

      {/* Small reassurance for kitchens without hours */}
      {!open && (
        <p className="mx-auto mt-10 flex max-w-7xl items-center gap-1.5 px-4 text-xs text-secondary-text sm:px-6">
          <Clock3 className="h-3.5 w-3.5" />
          Serving times are shown per dish. Prices are confirmed by the
          restaurant when you pay.
        </p>
      )}
    </div>
  );
}
