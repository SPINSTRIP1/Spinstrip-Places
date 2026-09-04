"use client";

import { Button } from "@/components/ui/button";
import MediaImage from "@/components/media-image";
import { formatAmount } from "@/utils";

interface FacilityCardProps {
  title: string;
  imgUrl: string;
  description: string;
  facilityType: string;
  accessType: string;
  /** Fees arrive from the API as decimal strings. */
  price: number | string;
  onClick?: () => void;
}

export default function FacilityCard({
  title,
  imgUrl,
  description,
  facilityType,
  accessType,
  price,
  onClick,
}: FacilityCardProps) {
  const amount = typeof price === "string" ? parseFloat(price) : price;
  const isFree = !amount || Number.isNaN(amount);

  return (
    <article className="listing-card group flex h-full flex-col overflow-hidden rounded-3xl border border-background-light bg-white">
      <div className="relative">
        <MediaImage
          src={imgUrl}
          alt={title}
          className="h-[180px] w-full"
          imgClassName="card-img"
        />
        {facilityType && (
          <span className="absolute left-3 top-3 rounded-full border border-white/40 bg-white/85 px-2.5 py-1 text-[11px] font-bold text-primary backdrop-blur-md">
            {facilityType}
          </span>
        )}
        {accessType && accessType !== "N/A" && (
          <span className="absolute right-3 top-3 rounded-full bg-primary-text/70 px-2.5 py-1 text-[11px] font-medium capitalize text-white backdrop-blur-md">
            {accessType.toLowerCase()}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-y-2 p-4">
        <h3 className="text-base font-bold leading-snug text-primary-text">
          {title}
        </h3>
        {description && (
          <p className="line-clamp-2 text-sm leading-relaxed text-secondary-text">
            {description}
          </p>
        )}

        <div className="mt-auto flex items-end justify-between gap-x-3 pt-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-secondary-text">
              {isFree ? "Access" : "From"}
            </p>
            <p className="text-lg font-bold text-primary-text">
              {isFree ? "Free" : formatAmount(amount)}
            </p>
          </div>
          {onClick && (
            <Button size="lg" onClick={onClick} className="btn-press h-11 px-7">
              Book
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
