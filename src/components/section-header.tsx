import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  /** Small muted line under the title. */
  subtitle?: string;
  /** Pill shown next to the title — a count, a status, a price. */
  badge?: React.ReactNode;
  /** "See more" style link on the right. */
  href?: string;
  linkLabel?: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * One heading treatment for every section across the places and events
 * previews, so the two pages read as the same product.
 */
export default function SectionHeader({
  title,
  subtitle,
  badge,
  href,
  linkLabel = "See more",
  action,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div className="min-w-0">
        <div className="flex items-center gap-x-2">
          <span
            aria-hidden
            className="h-4 w-1 shrink-0 rounded-full bg-primary"
          />
          <h2 className="truncate text-lg font-bold text-primary-text lg:text-xl">
            {title}
          </h2>
          {badge && (
            <span className="shrink-0 rounded-full bg-primary-accent px-2.5 py-0.5 text-xs font-bold text-primary">
              {badge}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="mt-1 pl-3 text-sm text-secondary-text">{subtitle}</p>
        )}
      </div>

      {action}

      {!action && href && (
        <Link
          href={href}
          className="flex shrink-0 items-center gap-x-1 rounded-full px-2 py-1 text-xs font-bold text-primary transition-colors hover:bg-primary-accent"
        >
          {linkLabel} <ChevronRight size={14} />
        </Link>
      )}
    </div>
  );
}
