"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BookingBarProps {
  /** Headline price, already formatted ("From ₦20,000" / "Free"). */
  price: string;
  /** Supporting line — opening hours, event date, availability. */
  caption: string;
  ctaLabel: string;
  onCta: () => void;
  disabled?: boolean;
  /**
   * `inline` sits in the page flow (desktop), `sticky` pins to the bottom
   * of the viewport on small screens.
   */
  variant?: "inline" | "sticky";
  className?: string;
}

/**
 * The single conversion point on a preview page. Kept identical between
 * places and events so the primary action never moves between the two.
 */
export default function BookingBar({
  price,
  caption,
  ctaLabel,
  onCta,
  disabled = false,
  variant = "inline",
  className,
}: BookingBarProps) {
  const body = (
    <div
      className={cn(
        "flex items-center justify-between gap-x-4",
        variant === "inline"
          ? "rounded-3xl border border-background-light bg-white p-4 shadow-xs"
          : "rounded-3xl border border-background-light bg-white/95 p-3 shadow-lg backdrop-blur-md",
      )}
    >
      <div className="min-w-0">
        <p className="text-lg font-bold text-primary-text">{price}</p>
        <p className="truncate text-xs text-secondary-text">{caption}</p>
      </div>
      <Button
        size="lg"
        onClick={onCta}
        disabled={disabled}
        className={cn("btn-press shrink-0", variant === "inline" && "px-10")}
      >
        {ctaLabel}
      </Button>
    </div>
  );

  if (variant === "sticky") {
    return (
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] lg:hidden",
          className,
        )}
      >
        {body}
      </div>
    );
  }

  return <div className={cn("hidden lg:block", className)}>{body}</div>;
}
