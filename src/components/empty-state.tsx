import React from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
  /**
   * `card` — dashed, self-contained panel. Use inside a section that would
   * otherwise render a grid or a rail.
   * `inline` — compact, borderless. Use inside an already-bordered surface
   * such as the order summary or a modal step.
   */
  variant?: "card" | "inline";
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  variant = "card",
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex w-full flex-col items-center justify-center text-center",
        variant === "card"
          ? "rounded-3xl border border-dashed border-background-light bg-white/60 px-6 py-10"
          : "px-4 py-6",
        className,
      )}
    >
      {icon && (
        <div
          className={cn(
            "mb-4 grid place-items-center rounded-full bg-primary-accent text-primary",
            variant === "card" ? "h-16 w-16" : "h-12 w-12",
          )}
        >
          {icon}
        </div>
      )}
      <h3
        className={cn(
          "font-bold text-primary-text",
          variant === "card" ? "text-base" : "text-sm",
        )}
      >
        {title}
      </h3>
      <p className="mt-1 max-w-sm text-sm leading-relaxed text-secondary-text">
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
