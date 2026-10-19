"use client";

import { useMemo, useState } from "react";
import { Flame, Plus, Search, SearchX } from "lucide-react";
import MediaImage from "@/components/media-image";
import DishCard from "@/components/cards/dish-card";
import DishRow from "@/components/cards/dish-row";
import { maxQuantity } from "@/components/restaurant/ItemSheet";
import type { MenuOrdering } from "@/hooks/use-menu-ordering";
import type { RestaurantProfile } from "@/hooks/use-restaurants";
import { cn } from "@/lib/utils";
import { formatEnumLabel, formatPrice } from "@/utils";

const ALL = "All";

interface MenuBrowserProps {
  restaurant: RestaurantProfile;
  ordering: MenuOrdering;
  /**
   * `responsive`: full-width page, list on phones and a card grid from `md`.
   * `list`: always the phone list, for narrow single-column pages.
   */
  layout?: "responsive" | "list";
}

/**
 * A restaurant's menu: search, the "Popular here" rail, category chips and
 * the dishes. Adding and opening dishes go through `ordering`, so the cart is
 * the same wherever the menu is shown. Needs the menu section theme
 * (`sectionThemeVars("menu")`) on an ancestor.
 */
export default function MenuBrowser({
  restaurant,
  ordering,
  layout = "responsive",
}: MenuBrowserProps) {
  const { cart, addToCart, changeQuantity, setOpenItem } = ordering;
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(ALL);

  const list = layout === "list";
  /** Horizontal page gutter for each block. */
  const gutter = list ? "px-5" : "mx-auto max-w-7xl px-4 sm:px-6";
  const railInset = list ? "px-5" : "px-4 sm:px-6";

  const categories = useMemo(() => [ALL, ...restaurant.categories], [restaurant]);

  const visible = useMemo(() => {
    let dishes = restaurant.items;
    if (category !== ALL) {
      dishes = dishes.filter(
        (item) => (formatEnumLabel(item.category) || "Other") === category,
      );
    }
    const q = query.trim().toLowerCase();
    if (q) {
      dishes = dishes.filter((item) =>
        [item.name, item.description, item.category, item.tag ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(q),
      );
    }
    return dishes;
  }, [restaurant, category, query]);

  const showHighlights = restaurant.highlights.length > 0 && category === ALL && !query.trim();

  const rows = (
    <div
      key={`rows-${category}-${query}`}
      className={cn(
        "section-swap divide-y divide-background-light rounded-3xl border border-background-light bg-white/90 px-4 backdrop-blur-md",
        !list && "md:hidden",
      )}
    >
      {visible.map((item, i) => (
        <DishRow
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
  );

  return (
    <>
      {/* Search */}
      <div className={cn(gutter, "mt-6")}>
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
        <section className={cn("mt-8", !list && "mx-auto max-w-7xl")}>
          <div className={cn("flex items-center gap-2", railInset)}>
            <Flame className="sec-text h-5 w-5" />
            <h2 className="font-display text-lg font-bold text-primary-text">Popular here</h2>
          </div>
          <div className={cn("chip-rail snap-rail mt-3 flex gap-3 overflow-x-auto pb-2", railInset)}>
            {restaurant.highlights.map((item) => (
              <div
                key={item.id}
                role="button"
                tabIndex={0}
                onClick={() => setOpenItem(item)}
                onKeyDown={(event) => event.key === "Enter" && setOpenItem(item)}
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
      <div
        className={cn(
          "chip-rail mt-8 flex gap-2 overflow-x-auto py-1",
          !list && "mx-auto max-w-7xl",
          railInset,
        )}
      >
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

      {/* Dishes */}
      <section className={cn(gutter, "mt-6")}>
        {visible.length > 0 ? (
          list ? (
            rows
          ) : (
            <>
              {/* Phones: a scannable list, photo on the right. */}
              {rows}
              <div
                key={`${category}-${query}`}
                className="section-swap hidden grid-cols-2 gap-5 md:grid lg:grid-cols-3"
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
            </>
          )
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
    </>
  );
}
