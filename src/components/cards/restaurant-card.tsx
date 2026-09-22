"use client";

import Link from "next/link";
import { ChevronRight, MapPin, UtensilsCrossed } from "lucide-react";
import MediaImage from "@/components/media-image";
import RestaurantLogo from "@/components/restaurant/RestaurantLogo";
import type { RestaurantProfile } from "@/hooks/use-restaurants";
import { cn } from "@/lib/utils";
import { formatPrice, getOpenStatus } from "@/utils";

interface RestaurantCardProps {
  restaurant: RestaurantProfile;
  index?: number;
}

/**
 * A restaurant row for the storefront list: the brand up front, then the
 * two facts that decide a tap (what they cook, what it starts at), and a
 * peek at the actual food so the row never feels like a directory entry.
 */
export default function RestaurantCard({
  restaurant,
  index = 0,
}: RestaurantCardProps) {
  const open = getOpenStatus(restaurant.place?.operatingHours);
  const previews = restaurant.items.filter((item) => item.images?.length).slice(0, 4);
  const extra = restaurant.dishCount - previews.length;
  const cuisine =
    restaurant.place?.metadata?.businessSubCategory ||
    restaurant.categories.slice(0, 2).join(" · ");

  return (
    <Link
      href={`/restaurants/${restaurant.id}`}
      className="listing-card card-in group block overflow-hidden rounded-3xl border border-background-light bg-white/90 backdrop-blur-md sec-ring"
      style={{ "--i": index } as React.CSSProperties}
    >
      <div className="flex items-center gap-4 p-4">
        <RestaurantLogo
          name={restaurant.name}
          monogram={restaurant.monogram}
          src={restaurant.logo}
          size={64}
          className="shrink-0 rounded-2xl"
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-display truncate text-base font-bold text-primary-text sm:text-lg">
              {restaurant.name}
            </h3>
            {open && (
              <span
                className={cn(
                  "flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                  open.isOpen
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-background text-secondary-text",
                )}
              >
                {open.isOpen && <span className="live-dot" />}
                {open.short}
              </span>
            )}
          </div>

          {cuisine && (
            <p className="sec-text mt-0.5 truncate text-xs font-semibold">
              {cuisine}
            </p>
          )}

          <p className="mt-1 flex items-center gap-1 truncate text-xs text-secondary-text">
            {restaurant.location ? (
              <>
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{restaurant.location}</span>
              </>
            ) : (
              <>
                <UtensilsCrossed className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Orders on SpinStrip</span>
              </>
            )}
          </p>

          <p className="mt-1.5 text-xs text-secondary-text">
            <span className="font-semibold text-primary-text">
              {restaurant.dishCount} {restaurant.dishCount === 1 ? "dish" : "dishes"}
            </span>
            {restaurant.minPrice !== null && (
              <>
                {" · "}from{" "}
                <span className="font-display text-sm font-bold text-primary-text">
                  {formatPrice(restaurant.minPrice)}
                </span>
              </>
            )}
          </p>
        </div>

        <span className="sec-soft sec-text grid h-10 w-10 shrink-0 place-items-center rounded-full transition-all duration-300 group-hover:text-white group-hover:[background-color:var(--sec)]">
          <ChevronRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-0.5" />
        </span>
      </div>

      {previews.length > 0 && (
        <div className="flex items-center gap-2 border-t border-background-light/80 bg-background/60 px-4 py-3">
          <div className="flex -space-x-2">
            {previews.map((item) => (
              <MediaImage
                key={item.id}
                src={item.images?.[0]}
                alt={item.name}
                className="h-9 w-9 rounded-xl border-2 border-white shadow-sm"
              />
            ))}
          </div>
          <p className="truncate text-xs text-secondary-text">
            {previews.map((item) => item.name).join(", ")}
            {extra > 0 && ` +${extra} more`}
          </p>
        </div>
      )}
    </Link>
  );
}
