"use client";

import ReviewComposer from "@/components/review-composer";
import ReviewList from "@/components/review-list";

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
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
      <ReviewList
        target={{ kind: "menu", id: merchantId }}
        writeHref="#write-review"
        className="min-w-0"
      />

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
