"use client";

import { Clock3, Minus, Plus, Sparkles, Trash2 } from "lucide-react";
import MediaImage from "@/components/media-image";
import { isMenuItemOrderable, type PublicMenuItem } from "@/hooks/use-menu";
import { cn } from "@/lib/utils";
import { describeAvailability, formatPrice, menuStockLabel } from "@/utils";

interface DishRowProps {
  item: PublicMenuItem;
  index?: number;
  onOpen: (item: PublicMenuItem) => void;
  onAdd: (item: PublicMenuItem) => void;
  /** Quantity already in the cart — turns the add button into a stepper. */
  inCart?: number;
  /** Adjusts the cart line by ±1; reaching 0 removes the dish. */
  onChangeQuantity: (item: PublicMenuItem, delta: number) => void;
  /** Upper bound for the stepper (stock or the per-item cap). */
  maxQuantity?: number;
  className?: string;
}

/**
 * Compact menu row for phones: details on the left, photo on the right with
 * the add button sitting on its corner, so a long menu scans like a list.
 */
export default function DishRow({
  item,
  index = 0,
  onOpen,
  onAdd,
  inCart = 0,
  onChangeQuantity,
  maxQuantity,
  className,
}: DishRowProps) {
  const orderable = isMenuItemOrderable(item);
  const lowStock =
    orderable &&
    item.quantity !== null &&
    item.quantity > 0 &&
    item.quantity <= 10;
  const badge = item.isFeatured ? "Featured" : item.tag;

  return (
    <article
      className={cn(
        "card-in flex items-center cursor-pointer gap-3 py-4",
        className,
      )}
      style={{ "--i": index } as React.CSSProperties}
      onClick={() => onOpen(item)}
    >
      {/* Details */}
      <div className="flex min-w-0 flex-1 flex-col">
        <h3 className="font-display line-clamp-2 text-base font-bold leading-snug text-primary-text">
          {item.name}
        </h3>
        {badge && (
          <span className="sec-soft sec-text mt-1.5 flex w-fit max-w-full items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold">
            {item.isFeatured && <Sparkles className="h-3 w-3 shrink-0" />}
            <span className="truncate">{badge}</span>
          </span>
        )}
        {item.description && (
          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-secondary-text">
            {item.description}
          </p>
        )}
        {/* Availability and price share one line to keep the row short. */}
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <div className="min-w-0">
            <p className="flex items-center gap-1 text-[11px] text-secondary-text">
              <Clock3 className="h-3 w-3 shrink-0" />
              <span className="truncate">{describeAvailability(item)}</span>
            </p>
            {lowStock && (
              <p className="sec-text mt-0.5 text-[11px] font-semibold">
                Only {item.quantity} left
              </p>
            )}
          </div>
          <p className="font-display shrink-0 text-base font-bold tracking-tight text-primary-text">
            {formatPrice(item.price)}
          </p>
        </div>
      </div>

      {/* Photo + add: stretches to the full height of the details column. */}
      <div className="relative h-32 w-32 shrink-0 self-stretch">
        <MediaImage
          src={item.images?.[0]}
          alt={item.name}
          className="absolute inset-0 rounded-2xl"
        />

        {!orderable && (
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/55">
            <span className="rounded-full border border-white/40 bg-white/15 px-2.5 py-1 text-[11px] font-bold text-white">
              {menuStockLabel(item)}
            </span>
          </div>
        )}

        {orderable && inCart > 0 ? (
          <div
            className="absolute bottom-2 right-2 flex h-8 items-center rounded-lg bg-white text-primary-text shadow-md"
            onClick={(event) => event.stopPropagation()}
            role="group"
            aria-label={`${item.name} quantity`}
          >
            <button
              type="button"
              aria-label={
                inCart === 1 ? `Remove ${item.name}` : `One less ${item.name}`
              }
              onClick={() => onChangeQuantity(item, -1)}
              className="btn-press grid h-8 w-8 place-items-center"
            >
              {inCart === 1 ? (
                <Trash2 className="h-3.5 w-3.5" />
              ) : (
                <Minus className="h-3.5 w-3.5" />
              )}
            </button>
            <span
              key={inCart}
              className="bump min-w-[1rem] text-center text-sm font-bold tabular-nums"
            >
              {inCart}
            </span>
            <button
              type="button"
              aria-label={`One more ${item.name}`}
              disabled={maxQuantity !== undefined && inCart >= maxQuantity}
              onClick={() => onChangeQuantity(item, 1)}
              className="btn-press grid h-8 w-8 place-items-center disabled:opacity-40"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : orderable ? (
          <button
            type="button"
            aria-label={`Add ${item.name} to order`}
            onClick={(event) => {
              event.stopPropagation();
              onAdd(item);
            }}
            className="btn-press absolute bottom-2 right-2 grid h-8 w-8 place-items-center rounded-lg bg-white text-primary-text shadow-md"
          >
            <Plus className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </article>
  );
}
