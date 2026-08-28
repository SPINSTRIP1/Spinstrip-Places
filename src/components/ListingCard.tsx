"use client";

import { useState } from "react";
import Image from "next/image";
import type { Listing } from "@/data/listings";
import { MapPin } from "lucide-react";
import { FALLBACK_IMAGE } from "@/constants";

interface Props {
  listing: Listing;
  index: number;
  onOpen?: (listing: Listing) => void;
}

export default function ListingCard({ listing, index, onOpen }: Props) {
  const [src, setSrc] = useState(listing.image || FALLBACK_IMAGE);
  const isFallback = src === FALLBACK_IMAGE;

  return (
    <article
      className="listing-card card-in group cursor-pointer overflow-hidden rounded-3xl border border-background-light bg-white/90 backdrop-blur-md"
      style={{ "--i": index } as React.CSSProperties}
      onClick={() => onOpen?.(listing)}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={src}
          alt={listing.name}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="card-img object-cover"
          draggable={false}
          unoptimized={isFallback}
          onError={() => setSrc(FALLBACK_IMAGE)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
        <span className="absolute left-3 top-3 rounded-full border border-white/40 bg-white/75 px-2.5 py-1 text-[11px] font-semibold text-[#6932E2] backdrop-blur-md">
          {listing.category}
        </span>
        {listing.tag && (
          <span className="absolute right-3 top-3 rounded-full bg-[#6932E2] px-2.5 py-1 text-[11px] font-semibold text-white shadow-[0_6px_20px_-6px_rgba(105,50,226,0.8)]">
            {listing.tag}
          </span>
        )}
        {listing.meta && (
          <span className="absolute bottom-3 left-3 rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-md">
            {listing.meta}
          </span>
        )}
      </div>
      <div className="p-4 sm:p-5">
        <h3 className="font-display text-base font-semibold leading-snug text-[#0F0F0F] sm:text-lg">
          {listing.name}
        </h3>
        {listing.location && (
          <p className="mt-1 flex items-center gap-1 text-xs text-[#6932E2]">
            <MapPin className="h-3.5 w-3.5" />
            {listing.location}
          </p>
        )}
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[#6F6D6D]">
          {listing.description}
        </p>
      </div>
    </article>
  );
}
