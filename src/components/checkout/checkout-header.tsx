"use client";

import Image from "next/image";
import MediaImage from "@/components/media-image";
import MetaChip from "@/components/meta-chip";
import type { HeroMeta } from "@/components/detail-hero";

interface CheckoutHeaderProps {
  image?: string | null;
  title: string;
  metas: HeroMeta[];
}

/**
 * Compact listing summary at the top of a checkout. Small on purpose — the
 * customer already chose this listing; the panel's job now is the form.
 */
export function CheckoutHeader({ image, title, metas }: CheckoutHeaderProps) {
  return (
    <div className="flex items-start gap-x-3 rounded-2xl border border-background-light bg-white p-3">
      <MediaImage
        src={image}
        alt={title}
        className="h-16 w-16 shrink-0 rounded-xl sm:h-20 sm:w-20"
      />
      <div className="min-w-0 flex-1">
        <h2 className="truncate text-base font-bold text-primary-text sm:text-lg">
          {title}
        </h2>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {metas.map((meta) => (
            <MetaChip key={meta.label} icon={meta.icon}>
              {meta.label}
            </MetaChip>
          ))}
        </div>
      </div>
    </div>
  );
}

/** "Powered by SpinStrip" strip that closes both checkouts. */
export function CheckoutFooter() {
  return (
    <div className="flex items-center justify-center gap-x-1.5 border-t border-background-light pt-4">
      <p className="text-xs text-secondary-text">Powered by</p>
      <Image
        src="/logo-black.svg"
        alt="SpinStrip"
        width={100}
        height={100}
        className="h-[20px] w-[65px] object-contain"
      />
    </div>
  );
}
