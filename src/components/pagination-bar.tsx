"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationBarProps {
  /** 1-based page currently shown. */
  page: number;
  /** `lastpage` from the API. */
  lastPage: number;
  /** `count` from the API — total rows across all pages. */
  total: number;
  /** Rows requested per page (`limit`). */
  pageSize: number;
  onPageChange: (page: number) => void;
  /** Dims the control while the next page is in flight. */
  busy?: boolean;
  className?: string;
}

/**
 * Builds the page list with ellipses: always the first and last page, plus a
 * window around the current one — [1, …, 4, 5, 6, …, 12].
 */
function buildPages(current: number, last: number): (number | "gap")[] {
  if (last <= 7) {
    return Array.from({ length: last }, (_, i) => i + 1);
  }

  const pages = new Set<number>([1, last, current]);
  if (current - 1 > 1) pages.add(current - 1);
  if (current + 1 < last) pages.add(current + 1);
  // Keep the row a stable width when the window sits at either end.
  if (current <= 3) pages.add(2).add(3).add(4);
  if (current >= last - 2) pages.add(last - 1).add(last - 2).add(last - 3);

  const sorted = [...pages].filter((p) => p >= 1 && p <= last).sort((a, b) => a - b);

  return sorted.flatMap((page, index) => {
    const previous = sorted[index - 1];
    return previous && page - previous > 1
      ? (["gap", page] as (number | "gap")[])
      : [page];
  });
}

export default function PaginationBar({
  page,
  lastPage,
  total,
  pageSize,
  onPageChange,
  busy = false,
  className,
}: PaginationBarProps) {
  if (lastPage <= 1) return null;

  const current = Math.min(Math.max(page, 1), lastPage);
  const firstRow = (current - 1) * pageSize + 1;
  const lastRow = Math.min(current * pageSize, total);

  const go = (next: number) => {
    const target = Math.min(Math.max(next, 1), lastPage);
    if (target !== current) onPageChange(target);
  };

  const arrowClasses =
    "grid h-9 w-9 place-items-center rounded-full border border-background-light bg-white text-primary-text transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-background-light disabled:hover:text-primary-text";

  return (
    <nav
      aria-label="Pagination"
      className={cn(
        "flex flex-col items-center gap-4 pb-10 pt-2 sm:flex-row sm:justify-between",
        busy && "pointer-events-none opacity-60",
        className,
      )}
    >
      <p className="text-xs text-secondary-text" aria-live="polite">
        Showing <span className="font-bold text-primary-text">{firstRow}</span>–
        <span className="font-bold text-primary-text">{lastRow}</span> of{" "}
        <span className="font-bold text-primary-text">{total}</span>
      </p>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          aria-label="Previous page"
          onClick={() => go(current - 1)}
          disabled={current <= 1}
          className={arrowClasses}
        >
          <ChevronLeft size={16} />
        </button>

        {/* Numbered pages are a desktop affordance; small screens get the
            page counter below instead. */}
        <div className="hidden items-center gap-1.5 sm:flex">
          {buildPages(current, lastPage).map((item, index) =>
            item === "gap" ? (
              <span
                key={`gap-${index}`}
                aria-hidden
                className="px-1 text-sm text-neutral-accent"
              >
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                aria-label={`Page ${item}`}
                aria-current={item === current ? "page" : undefined}
                onClick={() => go(item)}
                className={cn(
                  "h-9 min-w-9 rounded-full border px-3 text-sm font-bold transition-colors",
                  item === current
                    ? "border-primary bg-primary text-white"
                    : "border-background-light bg-white text-primary-text hover:border-primary hover:text-primary",
                )}
              >
                {item}
              </button>
            ),
          )}
        </div>

        <span className="px-2 text-sm font-bold text-primary-text sm:hidden">
          {current} / {lastPage}
        </span>

        <button
          type="button"
          aria-label="Next page"
          onClick={() => go(current + 1)}
          disabled={current >= lastPage}
          className={arrowClasses}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </nav>
  );
}
