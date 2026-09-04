import React from "react";
import { cn } from "@/lib/utils";

export function SummaryRow({
  label,
  value,
  muted,
}: {
  label: string;
  value: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-x-4 py-1">
      <p className="text-sm text-secondary-text">{label}</p>
      <p
        className={cn(
          "shrink-0 text-right text-sm font-medium",
          muted ? "text-secondary-text" : "text-primary-text",
        )}
      >
        {value}
      </p>
    </div>
  );
}

interface SummaryCardProps {
  title?: string;
  children: React.ReactNode;
  /** The bold bottom line. */
  total: React.ReactNode;
  totalLabel?: string;
  /** Small print under the total, e.g. "You won't be charged yet". */
  note?: string;
  className?: string;
}

/** Order summary panel, identical across both checkouts. */
export default function SummaryCard({
  title = "Order summary",
  children,
  total,
  totalLabel = "Total",
  note,
  className,
}: SummaryCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-background-light bg-background p-4",
        className,
      )}
    >
      <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-secondary-text">
        {title}
      </h3>
      <div className="divide-y divide-background-light/70">{children}</div>
      <div className="mt-3 flex items-center justify-between border-t border-neutral-accent/60 pt-3">
        <p className="text-sm font-bold text-primary-text">{totalLabel}</p>
        <p className="text-lg font-bold text-primary">{total}</p>
      </div>
      {note && <p className="mt-2 text-xs text-secondary-text">{note}</p>}
    </div>
  );
}
