"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface Props {
  name: string;
  monogram: string;
  /** Logo URL when the merchant has one; falls back to the monogram tile. */
  src?: string | null;
  size?: number;
  className?: string;
}

/**
 * Restaurant identity mark. Real logos render on a white tile so dark and
 * light marks both read; kitchens without one get a section-gradient
 * monogram, which stays consistent between the list and the storefront.
 */
export default function RestaurantLogo({
  name,
  monogram,
  src,
  size = 72,
  className,
}: Props) {
  const [failed, setFailed] = useState(false);
  const showImage = !!src && !failed;

  return (
    <div
      className={cn(
        "grid shrink-0 place-items-center overflow-hidden rounded-3xl font-display font-bold text-white",
        showImage ? "border border-background-light bg-white" : "sec-gradient",
        className,
      )}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        boxShadow: "0 10px 30px -10px var(--sec-glow)",
      }}
      role="img"
      aria-label={name}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- merchant logos come from several hosts
        <img
          src={src}
          alt=""
          onError={() => setFailed(true)}
          className="h-full w-full object-contain p-[12%]"
          draggable={false}
        />
      ) : (
        monogram
      )}
    </div>
  );
}
