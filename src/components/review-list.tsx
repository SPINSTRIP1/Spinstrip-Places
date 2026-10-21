"use client";

import { formatDistanceToNowStrict } from "date-fns";
import { StarIcon, UserIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Skeleton } from "@/components/ui/skeleton";
import { usePublicReviews } from "@/hooks/use-reviews";
import type { ReviewTarget } from "@/lib/reviews";
import { cn } from "@/lib/utils";

const STAR_ON = "#9E76F8";
const STAR_OFF = "#C8C8C8";

function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <HugeiconsIcon
          key={star}
          icon={StarIcon}
          size={size}
          color={star <= value ? STAR_ON : STAR_OFF}
          fill={star <= value ? STAR_ON : STAR_OFF}
        />
      ))}
    </span>
  );
}

const card = "rounded-3xl border border-background-light bg-white/90 backdrop-blur-md";

/** The API hides who wrote a review, but only eligible people can post one. */
const REVIEWER: Record<ReviewTarget["kind"], string> = {
  place: "Verified guest",
  event: "Ticket holder",
  menu: "Verified diner",
};

/**
 * Rating summary and the public reviews for a place, event or restaurant.
 * `writeHref` adds a "Write a review" link to the summary (used on phones,
 * where the form sits below the list).
 */
export default function ReviewList({
  target,
  writeHref,
  className,
}: {
  target: ReviewTarget;
  writeHref?: string;
  className?: string;
}) {
  const { reviews, count, average, isLoading } = usePublicReviews(target);

  if (isLoading) {
    return (
      <div className={cn("space-y-3", className)}>
        <Skeleton className="h-36 rounded-3xl" />
        <Skeleton className="h-24 rounded-3xl" />
      </div>
    );
  }

  const breakdown = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    total: reviews.filter((review) => review.stars === stars).length,
  }));

  return (
    <div className={cn("space-y-5", className)}>
      {/* Summary */}
      <section className={`${card} flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6`}>
        <div className="flex items-center gap-4 sm:flex-col sm:items-start sm:gap-1">
          <p className="font-display text-5xl font-bold tracking-tight text-primary-text">
            {count ? average.toFixed(1) : "–"}
          </p>
          <div className="space-y-1">
            <Stars value={Math.round(average)} size={16} />
            <p className="text-xs text-secondary-text">
              {count} {count === 1 ? "review" : "reviews"}
            </p>
          </div>
        </div>

        <ul className="min-w-0 flex-1 space-y-1.5">
          {breakdown.map(({ stars, total }) => (
            <li key={stars} className="flex items-center gap-2 text-xs text-secondary-text">
              <span className="w-3 shrink-0 text-right tabular-nums">{stars}</span>
              <span className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-background">
                <span
                  className="sec-bg block h-full rounded-full"
                  style={{ width: reviews.length ? `${(total / reviews.length) * 100}%` : 0 }}
                />
              </span>
              <span className="w-5 shrink-0 tabular-nums">{total}</span>
            </li>
          ))}
        </ul>

        {writeHref && (
          <a
            href={writeHref}
            className="btn-press sec-bg shrink-0 self-start rounded-full px-5 py-2.5 text-sm font-bold text-white sm:self-center lg:hidden"
          >
            Write a review
          </a>
        )}
      </section>

      {/* List */}
      {count === 0 ? (
        <p className="px-1 text-sm text-secondary-text">No reviews yet. Be the first to leave one.</p>
      ) : (
        <ul className={`${card} divide-y divide-background-light px-5 sm:px-6`}>
          {reviews.map((review) => (
            <li key={review.id} className="py-4">
              <div className="flex items-center gap-3">
                <span className="sec-soft sec-text grid h-10 w-10 shrink-0 place-items-center rounded-full">
                  <HugeiconsIcon icon={UserIcon} size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-primary-text">{REVIEWER[target.kind]}</p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <Stars value={review.stars} />
                    <span className="text-xs text-secondary-text">
                      {formatDistanceToNowStrict(new Date(review.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>
              {review.comment && (
                <p className="mt-2.5 text-sm leading-relaxed text-secondary-text">{review.comment}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
