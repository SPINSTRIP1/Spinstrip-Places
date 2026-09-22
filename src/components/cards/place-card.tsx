"use client";

import { ArrowUpRight, Building2, Clock3, Globe, MapPin } from "lucide-react";
import MediaImage from "@/components/media-image";
import type { PublicPlace } from "@/hooks/use-places";
import { cn } from "@/lib/utils";
import {
  formatPrice,
  getOpenStatus,
  getPlaceStartingPrice,
  placeTypeLabel,
} from "@/utils";

interface PlaceCardProps {
  place: PublicPlace;
  index?: number;
  onOpen: (place: PublicPlace) => void;
}

/**
 * A place is somewhere you go, so the card answers the questions you'd ask
 * at the door: what kind of place, where, is it open, and what does entry
 * cost.
 *
 * Most merchants only upload a logo, not photography, so the card is built
 * as a business profile — logo beside the name — and only grows a photo
 * band on top when a cover image actually exists. A logo never has to
 * carry an empty 4:3 media area on its own.
 */
export default function PlaceCard({ place, index = 0, onOpen }: PlaceCardProps) {
  const cover = place.coverImage || place.images?.[0] || null;
  const logo = place.metadata?.logoUrl || null;
  const type = placeTypeLabel(place.placeType);
  const open = getOpenStatus(place.operatingHours);
  const startingPrice = getPlaceStartingPrice(place);
  const facilityCount = place.facilities?.length ?? 0;
  const area =
    [place.city, place.state].filter(Boolean).join(", ") || place.country;

  const openBadge = open && (
    <span
      className={cn(
        "flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold",
        cover
          ? open.isOpen
            ? "bg-emerald-500/95 text-white backdrop-blur-md"
            : "bg-black/55 text-white backdrop-blur-md"
          : open.isOpen
            ? "bg-emerald-50 text-emerald-700"
            : "bg-background text-secondary-text",
      )}
    >
      {open.isOpen && <span className="live-dot" />}
      {open.short}
    </span>
  );

  return (
    <article
      className="listing-card card-in group flex cursor-pointer flex-col overflow-hidden rounded-3xl border border-background-light bg-white/90 backdrop-blur-md"
      style={{ "--i": index } as React.CSSProperties}
      onClick={() => onOpen(place)}
    >
      {/* Photo band — only when the merchant has one */}
      {cover && (
        <div className="relative aspect-[16/9] overflow-hidden">
          <MediaImage
            src={cover}
            alt={place.name}
            className="h-full w-full"
            imgClassName="card-img"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          <span className="sec-text absolute left-3 top-3 rounded-full border border-white/60 bg-white/85 px-2.5 py-1 text-[11px] font-bold backdrop-blur-md">
            {type}
          </span>
          <div className="absolute right-3 top-3">{openBadge}</div>
        </div>
      )}

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        {/* Identity row */}
        <div className={cn("flex items-start gap-3", cover && "-mt-10 sm:-mt-11")}>
          <span
            className={cn(
              "grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl border bg-white",
              cover
                ? "border-white shadow-[0_10px_24px_-10px_rgba(15,15,15,0.45)]"
                : "sec-border shadow-[0_10px_24px_-14px_var(--sec-glow)]",
            )}
          >
            {logo ? (
              <MediaImage
                src={logo}
                alt=""
                className="h-full w-full"
                imgClassName="object-contain p-1.5"
              />
            ) : (
              <span className="sec-soft sec-text grid h-full w-full place-items-center">
                <Building2 className="h-7 w-7" strokeWidth={1.6} />
              </span>
            )}
          </span>

          <div className={cn("min-w-0 flex-1", cover && "pt-11 sm:pt-12")}>
            {!cover && (
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="sec-text text-[11px] font-bold uppercase tracking-wider">
                  {type}
                </span>
                {openBadge}
              </div>
            )}
            <h3 className="font-display line-clamp-1 text-base font-bold leading-snug text-primary-text sm:text-lg">
              {place.name}
            </h3>
            {area && (
              <p className="mt-0.5 flex items-center gap-1 text-xs text-secondary-text">
                <MapPin className="sec-text h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{area}</span>
              </p>
            )}
          </div>
        </div>

        {place.description && (
          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-secondary-text">
            {place.description}
          </p>
        )}

        <div className="mt-3 flex flex-wrap gap-1.5">
          {open && (
            <span className="inline-flex items-center gap-1 rounded-full bg-background px-2.5 py-1 text-[11px] font-medium text-secondary-text">
              <Clock3 className="h-3 w-3" />
              {open.label}
            </span>
          )}
          {facilityCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-background px-2.5 py-1 text-[11px] font-medium text-secondary-text">
              <Building2 className="h-3 w-3" />
              {facilityCount} {facilityCount === 1 ? "facility" : "facilities"}
            </span>
          )}
          {place.website && (
            <span className="inline-flex items-center gap-1 rounded-full bg-background px-2.5 py-1 text-[11px] font-medium text-secondary-text">
              <Globe className="h-3 w-3" />
              Website
            </span>
          )}
          {!open && place.address && (
            <span className="inline-flex max-w-full items-center gap-1 rounded-full bg-background px-2.5 py-1 text-[11px] font-medium text-secondary-text">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{place.address}</span>
            </span>
          )}
        </div>

        <div className="mt-auto flex items-end justify-between gap-3 border-t border-background-light/80 pt-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-secondary-text">
              {startingPrice ? "Access from" : "Access"}
            </p>
            <p className="font-display text-lg font-bold tracking-tight text-primary-text sm:text-xl">
              {startingPrice ? formatPrice(startingPrice) : "Free to visit"}
            </p>
          </div>
          <span className="sec-soft sec-text grid h-10 w-10 shrink-0 place-items-center rounded-full transition-all duration-300 group-hover:text-white group-hover:[background-color:var(--sec)]">
            <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </div>
      </div>
    </article>
  );
}
