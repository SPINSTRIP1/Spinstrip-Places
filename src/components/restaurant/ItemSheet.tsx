"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Clock3,
  Minus,
  Package,
  Plus,
  ShoppingBag,
  Sparkles,
  X,
} from "lucide-react";
import MediaImage from "@/components/media-image";
import { isMenuItemOrderable, type PublicMenuItem } from "@/hooks/use-menu";
import { cn } from "@/lib/utils";
import {
  describeAvailability,
  formatEnumLabel,
  formatPrice,
  menuStockLabel,
} from "@/utils";

/** Upper bound for untracked stock, so a stray tap can't order 500 plates. */
export const MAX_PER_ITEM = 20;

export function maxQuantity(item: PublicMenuItem) {
  return item.quantity === null
    ? MAX_PER_ITEM
    : Math.min(item.quantity, MAX_PER_ITEM);
}

interface Props {
  item: PublicMenuItem;
  /** Portions of this dish already in the cart. */
  inCart?: number;
  onClose: () => void;
  onAdd: (item: PublicMenuItem, quantity: number) => void;
}

/**
 * Dish detail sheet: everything a customer checks before committing —
 * what's in it, what it may contain, when it's served — and one button
 * that adds the chosen portions to the restaurant's cart.
 */
export default function ItemSheet({ item, inCart = 0, onClose, onAdd }: Props) {
  const [qty, setQty] = useState(1);
  const orderable = isMenuItemOrderable(item);
  const max = maxQuantity(item);
  const remaining = Math.max(0, max - inCart);
  const price = parseFloat(item.price) || 0;
  const allergens = item.nutritionAllergens ?? [];
  const sizes = item.sizeOptions ?? [];
  const options = [...(item.addOns ?? []), ...(item.extras ?? [])];

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const canAdd = orderable && remaining > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={item.name}
    >
      <div
        className="sheet-overlay absolute inset-0 bg-primary-text/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="sheet-panel relative flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white sm:rounded-3xl">
        {/* Photo */}
        <div className="relative h-52 shrink-0 sm:h-60">
          <MediaImage
            src={item.images?.[0]}
            alt={item.name}
            eager
            className="h-full w-full"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          <button
            onClick={onClose}
            className="btn-press absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-primary-text shadow-md"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5">
            {item.tag && (
              <span className="sec-text rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold backdrop-blur-md">
                {item.tag}
              </span>
            )}
            {item.isFeatured && (
              <span className="sec-gradient flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold text-white">
                <Sparkles className="h-3 w-3" /> Featured
              </span>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="sec-text text-[11px] font-bold uppercase tracking-wider">
                {formatEnumLabel(item.category) || "Menu"}
              </p>
              <h3 className="font-display mt-0.5 text-xl font-bold text-primary-text">
                {item.name}
              </h3>
            </div>
            <span className="font-display shrink-0 text-2xl font-bold tracking-tight text-primary-text">
              {formatPrice(item.price)}
            </span>
          </div>

          {item.description && (
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-secondary-text">
              {item.description}
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-background px-2.5 py-1 text-xs font-medium text-secondary-text">
              <Clock3 className="h-3.5 w-3.5" /> {describeAvailability(item)}
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
                orderable
                  ? "bg-background text-secondary-text"
                  : "bg-red-50 text-red-600",
              )}
            >
              <Package className="h-3.5 w-3.5" /> {menuStockLabel(item)}
            </span>
          </div>

          {sizes.length > 0 && (
            <section className="mt-5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-secondary-text">
                Sizes
              </h4>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {sizes.map((size) => (
                  <span
                    key={size}
                    className="rounded-full border border-background-light bg-white px-2.5 py-1 text-xs text-primary-text"
                  >
                    {size}
                  </span>
                ))}
              </div>
            </section>
          )}

          {options.length > 0 && (
            <section className="mt-5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-secondary-text">
                Add-ons & extras
              </h4>
              <p className="mt-1 text-xs text-secondary-text">
                Online orders are for the standard portion — mention these to
                the kitchen.
              </p>
              <ul className="mt-2 divide-y divide-background-light rounded-2xl border border-background-light bg-white">
                {options.map((option) => (
                  <li
                    key={option.name}
                    className="flex items-center justify-between px-3 py-2 text-sm"
                  >
                    <span className="text-primary-text">{option.name}</span>
                    <span className="text-secondary-text">
                      {option.price > 0 ? `+${formatPrice(option.price)}` : "Included"}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="mt-5">
            <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-secondary-text">
              <AlertTriangle className="h-3.5 w-3.5" /> Allergens & nutrition
            </h4>
            {allergens.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {allergens.map((entry) => (
                  <span
                    key={`${entry.type}-${entry.name}`}
                    className={cn(
                      "flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium",
                      entry.type === "allergen"
                        ? "border-amber-200 bg-amber-50 text-amber-700"
                        : "border-background-light bg-background text-secondary-text",
                    )}
                  >
                    {entry.type === "allergen" && (
                      <AlertTriangle className="h-3 w-3" />
                    )}
                    {entry.type === "allergen" ? `Contains ${entry.name.toLowerCase()}` : entry.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-xs text-secondary-text">
                No allergen information listed. Ask the kitchen if you have a
                severe allergy.
              </p>
            )}
          </section>

          {/* Quantity */}
          <div className="mt-5 flex items-center justify-between rounded-2xl bg-background p-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                disabled={qty <= 1}
                className="btn-press flex h-9 w-9 items-center justify-center rounded-full border border-background-light bg-white text-primary-text disabled:opacity-40"
                aria-label="Decrease quantity"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="font-display w-6 text-center text-lg font-bold text-primary-text">
                {qty}
              </span>
              <button
                onClick={() => setQty((q) => Math.min(remaining || 1, q + 1))}
                disabled={qty >= remaining}
                className="btn-press flex h-9 w-9 items-center justify-center rounded-full border border-background-light bg-white text-primary-text disabled:opacity-40"
                aria-label="Increase quantity"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="text-right">
              {inCart > 0 && (
                <p className="text-[11px] text-secondary-text">
                  {inCart} already in your order
                </p>
              )}
              <p className="sec-text font-display text-xl font-bold tracking-tight">
                {formatPrice(price * qty)}
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div
          className="shrink-0 border-t border-background-light bg-white p-4"
          style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
        >
          <button
            onClick={() => canAdd && onAdd(item, qty)}
            disabled={!canAdd}
            className="btn-press sec-gradient flex w-full items-center justify-center gap-2 rounded-full py-3.5 font-display text-base font-semibold text-white shadow-[0_10px_30px_-8px_var(--sec-glow)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ShoppingBag className="h-5 w-5" />
            {!orderable
              ? menuStockLabel(item)
              : remaining === 0
                ? "Maximum reached"
                : `Add ${qty} to order · ${formatPrice(price * qty)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
