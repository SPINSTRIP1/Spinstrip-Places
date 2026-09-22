"use client";

import { Clock3, Minus, Plus, Sparkles, Store, Trash2 } from "lucide-react";
import MediaImage from "@/components/media-image";
import { isMenuItemOrderable, type PublicMenuItem } from "@/hooks/use-menu";
import { cn } from "@/lib/utils";
import {
  describeAvailability,
  formatEnumLabel,
  formatPrice,
  menuStockLabel,
} from "@/utils";

interface DishCardProps {
  item: PublicMenuItem;
  index?: number;
  /** Shown under the name on cross-restaurant surfaces like the home rail. */
  restaurantName?: string;
  onOpen: (item: PublicMenuItem) => void;
  /** When present, the card gets a one-tap add button. */
  onAdd?: (item: PublicMenuItem) => void;
  /** Quantity already in the cart — turns the add button into a stepper. */
  inCart?: number;
  /** Adjusts the cart line by ±1; reaching 0 removes the dish. */
  onChangeQuantity?: (item: PublicMenuItem, delta: number) => void;
  /** Upper bound for the stepper (stock or the per-item cap). */
  maxQuantity?: number;
  className?: string;
}

/**
 * A dish is something you buy, so the price is the loudest element after
 * the photo, and the add button lives where the thumb lands. Out-of-stock
 * dishes stay visible but visibly unavailable.
 */
export default function DishCard({
  item,
  index = 0,
  restaurantName,
  onOpen,
  onAdd,
  inCart = 0,
  onChangeQuantity,
  maxQuantity,
  className,
}: DishCardProps) {
  const orderable = isMenuItemOrderable(item);
  const lowStock =
    orderable && item.quantity !== null && item.quantity > 0 && item.quantity <= 10;
  const category = formatEnumLabel(item.category);

  return (
    <article
      className={cn(
        "listing-card card-in group flex h-full cursor-pointer flex-col overflow-hidden rounded-3xl border border-background-light bg-white/90 backdrop-blur-md",
        className,
      )}
      style={{ "--i": index } as React.CSSProperties}
      onClick={() => onOpen(item)}
    >
      {/* Photo */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <MediaImage
          src={item.images?.[0]}
          alt={item.name}
          className="h-full w-full"
          imgClassName="card-img"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        {item.tag && (
          <span className="sec-text absolute left-3 top-3 max-w-[70%] truncate rounded-full border border-white/60 bg-white/90 px-2.5 py-1 text-[11px] font-bold backdrop-blur-md">
            {item.tag}
          </span>
        )}
        {item.isFeatured && (
          <span className="sec-gradient absolute right-3 top-3 flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold text-white shadow-[0_6px_20px_-6px_var(--sec-glow)]">
            <Sparkles className="h-3 w-3" /> Featured
          </span>
        )}

        <span className="font-display absolute bottom-3 left-3 rounded-full bg-white px-3.5 py-1.5 text-base font-bold tracking-tight text-primary-text shadow-md sm:text-lg">
          {formatPrice(item.price)}
        </span>

        {!orderable && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/55 backdrop-blur-[2px]">
            <span className="rounded-full border border-white/40 bg-white/15 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-md">
              {menuStockLabel(item)}
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-display line-clamp-2 text-base font-bold leading-snug text-primary-text">
          {item.name}
        </h3>
        {restaurantName && (
          <p className="mt-1 flex items-center gap-1 text-xs text-secondary-text">
            <Store className="sec-text h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{restaurantName}</span>
          </p>
        )}
        {item.description && (
          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-secondary-text">
            {item.description}
          </p>
        )}

        <div className="mt-auto flex items-end justify-between gap-3 pt-3">
          <div className="min-w-0 space-y-1">
            <p className="flex items-center gap-1 text-[11px] text-secondary-text">
              <Clock3 className="h-3 w-3 shrink-0" />
              <span className="truncate">
                {category ? `${category} · ` : ""}
                {describeAvailability(item)}
              </span>
            </p>
            {lowStock && (
              <p className="sec-text text-[11px] font-semibold">
                Only {item.quantity} left
              </p>
            )}
          </div>

          {onAdd && inCart > 0 && onChangeQuantity ? (
            <div
              className="sec-bg flex h-10 shrink-0 items-center rounded-full text-white shadow-[0_8px_24px_-8px_var(--sec-glow)]"
              onClick={(event) => event.stopPropagation()}
              role="group"
              aria-label={`${item.name} quantity`}
            >
              <button
                type="button"
                aria-label={inCart === 1 ? `Remove ${item.name}` : `One less ${item.name}`}
                onClick={() => onChangeQuantity(item, -1)}
                className="btn-press grid h-10 w-10 place-items-center rounded-full transition-colors hover:bg-white/15"
              >
                {inCart === 1 ? (
                  <Trash2 className="h-4 w-4" />
                ) : (
                  <Minus className="h-4 w-4" />
                )}
              </button>
              <span
                key={inCart}
                className="bump min-w-[1.25rem] text-center text-sm font-bold tabular-nums"
              >
                {inCart}
              </span>
              <button
                type="button"
                aria-label={`One more ${item.name}`}
                disabled={maxQuantity !== undefined && inCart >= maxQuantity}
                onClick={() => onChangeQuantity(item, 1)}
                className="btn-press grid h-10 w-10 place-items-center rounded-full transition-colors hover:bg-white/15 disabled:opacity-40"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          ) : onAdd ? (
            <button
              type="button"
              disabled={!orderable}
              aria-label={`Add ${item.name} to order`}
              onClick={(event) => {
                event.stopPropagation();
                onAdd(item);
              }}
              className="btn-press sec-bg flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white shadow-[0_8px_24px_-8px_var(--sec-glow)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus className="h-5 w-5" />
            </button>
          ) : (
            <span className="sec-soft sec-text flex shrink-0 items-center rounded-full px-3.5 py-2 text-xs font-bold transition-colors duration-300 group-hover:text-white group-hover:[background-color:var(--sec)]">
              {orderable ? "Order" : "View"}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
