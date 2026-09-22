import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** Mirrors PlaceCard, which is a profile (logo beside name) rather than a photo card. */
export function ProfileSkeleton({ index = 0 }: { index?: number }) {
  return (
    <article
      className="card-in overflow-hidden rounded-3xl border border-background-light bg-white/90 p-4 backdrop-blur-md sm:p-5"
      style={{ "--i": index } as React.CSSProperties}
      aria-hidden="true"
    >
      <div className="flex items-start gap-3">
        <Skeleton className="h-16 w-16 shrink-0 rounded-2xl" />
        <div className="min-w-0 flex-1">
          <Skeleton className="h-2.5 w-16 rounded-md" />
          <Skeleton className="mt-2 h-5 w-3/4 rounded-md" />
          <Skeleton className="mt-2 h-3 w-1/3 rounded-md" />
        </div>
      </div>
      <Skeleton className="mt-4 h-3 w-full rounded-md" />
      <Skeleton className="mt-2 h-3 w-5/6 rounded-md" />
      <div className="mt-3 flex gap-1.5">
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="mt-4 flex items-end justify-between border-t border-background-light/80 pt-4">
        <div>
          <Skeleton className="h-2.5 w-14 rounded-md" />
          <Skeleton className="mt-1.5 h-5 w-20 rounded-md" />
        </div>
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
    </article>
  );
}

/** Skeleton that mirrors EventCard / DishCard proportions. */
export function ListingSkeleton({
  index = 0,
  className,
}: {
  index?: number;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "card-in overflow-hidden rounded-3xl border border-background-light bg-white/90 backdrop-blur-md",
        className,
      )}
      style={{ "--i": index } as React.CSSProperties}
      aria-hidden="true"
    >
      <div className="sec-soft relative aspect-[4/3] overflow-hidden opacity-70">
        <Skeleton className="absolute left-3 top-3 h-6 w-20 rounded-full bg-white/80" />
        <Skeleton className="absolute right-3 top-3 h-6 w-16 rounded-full bg-white/80" />
        <Skeleton className="absolute bottom-3 left-3 h-7 w-24 rounded-full bg-white/80" />
      </div>
      <div className="p-4 sm:p-5">
        <Skeleton className="h-5 w-3/4 rounded-md" />
        <Skeleton className="mt-2 h-3 w-2/5 rounded-md" />
        <Skeleton className="mt-3 h-3 w-full rounded-md" />
        <Skeleton className="mt-2 h-3 w-5/6 rounded-md" />
        <div className="mt-4 flex items-end justify-between">
          <div>
            <Skeleton className="h-2.5 w-14 rounded-md" />
            <Skeleton className="mt-1.5 h-5 w-20 rounded-md" />
          </div>
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      </div>
    </article>
  );
}

/** Grid of card skeletons matching the results grid columns. */
export function ListingSkeletonGrid({
  count = 6,
  variant = "media",
}: {
  count?: number;
  /** "profile" for places, "media" for events. */
  variant?: "media" | "profile";
}) {
  return (
    <div className="section-swap grid grid-cols-1 gap-5 pb-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) =>
        variant === "profile" ? (
          <ProfileSkeleton key={i} index={i} />
        ) : (
          <ListingSkeleton key={i} index={i} />
        ),
      )}
    </div>
  );
}

/** Horizontal rail of skeletons for the dish carousel. */
export function DishRailSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="section-swap flex gap-4 overflow-hidden pb-2">
      {Array.from({ length: count }).map((_, i) => (
        <ListingSkeleton
          key={i}
          index={i}
          className="w-[82%] shrink-0 sm:w-[52%] lg:w-[35%] xl:w-[27%]"
        />
      ))}
    </div>
  );
}

/** Row skeletons for the restaurant list. */
export function RestaurantListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="section-swap grid gap-4 lg:grid-cols-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="card-in flex items-center gap-4 rounded-3xl border border-background-light bg-white/90 p-4 backdrop-blur-md"
          style={{ "--i": i } as React.CSSProperties}
          aria-hidden="true"
        >
          <Skeleton className="h-16 w-16 shrink-0 rounded-2xl" />
          <div className="flex-1">
            <Skeleton className="h-5 w-1/2 rounded-md" />
            <Skeleton className="mt-2 h-3 w-1/3 rounded-md" />
            <Skeleton className="mt-2 h-3 w-2/3 rounded-md" />
          </div>
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      ))}
    </div>
  );
}
