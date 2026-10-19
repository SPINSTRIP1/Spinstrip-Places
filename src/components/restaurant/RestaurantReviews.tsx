"use client";

import { formatDistanceToNowStrict } from "date-fns";
import { StarIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import ReviewComposer from "@/components/review-composer";
import { useMenuReviews } from "@/hooks/use-reviews";
import { monogramFor } from "@/utils";

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

/**
 * The Reviews tab: rating summary and what other diners said, with the
 * review form alongside on wide screens and below the list on phones.
 */
export default function RestaurantReviews({
  merchantId,
  restaurantName,
}: {
  merchantId: string;
  restaurantName: string;
}) {
  const { reviews, isSample } = useMenuReviews(merchantId);

  const count = reviews.length;
  const average = count ? reviews.reduce((sum, review) => sum + review.stars, 0) / count : 0;
  const breakdown = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    total: reviews.filter((review) => review.stars === stars).length,
  }));

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
      <div className="min-w-0 space-y-5">
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
                    style={{ width: count ? `${(total / count) * 100}%` : 0 }}
                  />
                </span>
                <span className="w-5 shrink-0 tabular-nums">{total}</span>
              </li>
            ))}
          </ul>

          <a
            href="#write-review"
            className="btn-press sec-bg shrink-0 self-start rounded-full px-5 py-2.5 text-sm font-bold text-white sm:self-center lg:hidden"
          >
            Write a review
          </a>
        </section>

        {isSample && (
          <p className="px-1 text-xs text-secondary-text">
            Sample reviews for now. Real diner reviews will show here soon.
          </p>
        )}

        {/* List */}
        {count > 0 && (
          <ul className={`${card} divide-y divide-background-light px-5 sm:px-6`}>
            {reviews.map((review) => (
              <li key={review.id} className="py-4">
                <div className="flex items-center gap-3">
                  <span className="sec-soft sec-text grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-bold">
                    {monogramFor(review.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-primary-text">{review.name}</p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <Stars value={review.stars} />
                      <span className="text-xs text-secondary-text">
                        {formatDistanceToNowStrict(new Date(review.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
                {review.comment && (
                  <p className="mt-2.5 text-sm leading-relaxed text-secondary-text">
                    {review.comment}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Form: beside the list on desktop, after it on phones. */}
      <div id="write-review" className="min-w-0 scroll-mt-36 lg:sticky lg:top-36">
        <ReviewComposer
          target={{ kind: "menu", id: merchantId }}
          title={`Review ${restaurantName}`}
          description="Ordered here before? Rate your meal and tell others what it was like."
        />
      </div>
    </div>
  );
}
