"use client";

import React from "react";
import MediaImage from "@/components/media-image";
import { cn } from "@/lib/utils";

interface OptionCardProps {
  selected: boolean;
  onSelect: () => void;
  title: string;
  subtitle?: string | null;
  /** Right-hand value — a price, a rate, a provider name. */
  trailing?: React.ReactNode;
  /** Optional square thumbnail on the left. */
  image?: string | null;
  disabled?: boolean;
  /** Rendered inside the card, below the row (e.g. a quantity stepper). */
  children?: React.ReactNode;
  className?: string;
}

/**
 * The one selectable row used everywhere a checkout asks the customer to
 * pick something: a facility, a rate, a ticket tier, a payment provider.
 * One component means the two checkouts cannot drift apart visually.
 */
export default function OptionCard({
  selected,
  onSelect,
  title,
  subtitle,
  trailing,
  image,
  disabled = false,
  children,
  className,
}: OptionCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border transition-all",
        selected
          ? "border-primary bg-primary-accent/40 shadow-[0_0_0_1px_rgba(105,50,226,0.25)]"
          : "border-background-light bg-white hover:border-primary-tint",
        disabled && "cursor-not-allowed opacity-50 hover:border-background-light",
        className,
      )}
    >
      <button
        type="button"
        role="radio"
        aria-checked={selected}
        disabled={disabled}
        onClick={onSelect}
        className="flex w-full items-center gap-x-3 p-3 text-left disabled:cursor-not-allowed"
      >
        {image !== undefined && (
          <MediaImage
            src={image}
            alt={title}
            className="h-14 w-14 shrink-0 rounded-xl"
          />
        )}

        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold text-primary-text">
            {title}
          </span>
          {subtitle && (
            <span className="mt-0.5 block line-clamp-2 text-xs text-secondary-text">
              {subtitle}
            </span>
          )}
        </span>

        {trailing && (
          <span className="shrink-0 text-sm font-bold text-primary-text">
            {trailing}
          </span>
        )}

        <span
          className={cn(
            "grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 transition-colors",
            selected ? "border-primary" : "border-neutral-accent",
          )}
        >
          {selected && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
        </span>
      </button>

      {children && <div className="px-3 pb-3">{children}</div>}
    </div>
  );
}
