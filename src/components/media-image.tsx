"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { FALLBACK_IMAGE } from "@/constants";

interface MediaImageProps {
  src?: string | null;
  alt: string;
  /** Classes for the wrapper (control size / radius / aspect here). */
  className?: string;
  /** Extra classes for the <img> itself. */
  imgClassName?: string;
  /** Renders the image behind a soft dark scrim, for text overlays. */
  scrim?: boolean;
  eager?: boolean;
}

/**
 * Remote media renderer used across the preview + checkout surfaces.
 *
 * Deliberately a plain <img>: place/event media is served from several
 * buckets and `next/image` only has one host allow-listed, so optimisation
 * would turn an unexpected host into a broken page. In exchange we get a
 * shimmer while loading and a branded placeholder when a URL is missing or
 * 404s, instead of the browser's broken-image glyph.
 */
export default function MediaImage({
  src,
  alt,
  className,
  imgClassName,
  scrim = false,
  eager = false,
}: MediaImageProps) {
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    src ? "loading" : "error",
  );
  const resolved = status === "error" || !src ? FALLBACK_IMAGE : src;

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-primary-accent/40",
        className,
      )}
    >
      {status === "loading" && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-primary-accent/70 via-background-light/60 to-primary-accent/70" />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={resolved}
        alt={alt}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        onLoad={() => setStatus("ready")}
        onError={() => setStatus("error")}
        className={cn(
          "h-full w-full object-cover transition-opacity duration-500",
          status === "loading" ? "opacity-0" : "opacity-100",
          status === "error" && "object-contain p-[12%] opacity-60",
          imgClassName,
        )}
      />
      {scrim && (
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      )}
    </div>
  );
}
