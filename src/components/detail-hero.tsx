"use client";

import Image from "next/image";
import MediaImage from "@/components/media-image";
import MetaChip from "@/components/meta-chip";
import ImpressionsStack from "@/components/impressions-stack";

export interface HeroMeta {
  // Hugeicons' icon objects are loosely typed in the free package.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any;
  label: string;
}

interface DetailHeroProps {
  image?: string | null;
  title: string;
  /** Category / place type, shown above the title. */
  eyebrow?: string;
  metas: HeroMeta[];
  impressions?: number;
}

/**
 * The masthead for a place or an event. Both previews use it so the two
 * detail pages open with the same shape: full-bleed photography, the name
 * over a scrim, then the facts as chips.
 */
export default function DetailHero({
  image,
  title,
  eyebrow,
  metas,
  impressions,
}: DetailHeroProps) {
  return (
    <header className="relative overflow-hidden rounded-3xl border border-background-light bg-primary-text">
      <MediaImage
        src={image}
        alt={title}
        eager
        scrim
        className="h-[280px] w-full sm:h-[380px] lg:h-[460px]"
      />

      <button
        type="button"
        className="btn-press absolute right-4 top-4 flex items-center gap-x-1.5 rounded-full border border-white/30 bg-white/15 px-3 py-2 text-sm font-bold text-white backdrop-blur-md transition-colors hover:bg-white/25"
      >
        <Image
          src="/logo-mark.svg"
          alt=""
          width={40}
          height={40}
          className="h-4 w-4 object-contain"
        />
        Follow
      </button>

      <div className="absolute inset-x-0 bottom-0 space-y-3 p-4 sm:p-6">
        {eyebrow && (
          <span className="inline-flex rounded-full bg-primary px-3 py-1 text-xs font-bold text-white">
            {eyebrow}
          </span>
        )}
        <h1 className="max-w-3xl text-2xl font-bold leading-[1.1] text-white sm:text-4xl lg:text-[52px]">
          {title}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          {metas.map((meta) => (
            <MetaChip key={meta.label} icon={meta.icon} tone="light">
              {meta.label}
            </MetaChip>
          ))}
          {typeof impressions === "number" && (
            <ImpressionsStack impressions={impressions} tone="light" />
          )}
        </div>
      </div>
    </header>
  );
}
