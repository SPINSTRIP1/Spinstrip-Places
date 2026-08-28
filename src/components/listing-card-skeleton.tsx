import { Skeleton } from "@/components/ui/skeleton";

/**
 * Placeholder that mirrors ListingCard's layout so the grid keeps its
 * shape while places/events/menu are being fetched.
 */
export function ListingCardSkeleton({ index = 0 }: { index?: number }) {
  return (
    <article
      className="card-in overflow-hidden rounded-3xl border border-background-light bg-white/90 backdrop-blur-md"
      style={{ "--i": index } as React.CSSProperties}
      aria-hidden="true"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-primary-accent/60">
        {/* category chip */}
        <Skeleton className="absolute left-3 top-3 h-6 w-20 rounded-full bg-white/70" />
        {/* tag chip */}
        <Skeleton className="absolute right-3 top-3 h-6 w-16 rounded-full bg-white/70" />
        {/* meta chip */}
        <Skeleton className="absolute bottom-3 left-3 h-6 w-28 rounded-full bg-white/70" />
      </div>
      <div className="p-4 sm:p-5">
        <Skeleton className="h-5 w-3/4 rounded-md" />
        <Skeleton className="mt-2 h-3 w-2/5 rounded-md" />
        <Skeleton className="mt-3 h-3 w-full rounded-md" />
        <Skeleton className="mt-2 h-3 w-5/6 rounded-md" />
      </div>
    </article>
  );
}

/**
 * A full grid of skeleton cards, matching the results grid columns.
 */
export default function ListingCardSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="section-swap grid grid-cols-1 gap-5 pb-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <ListingCardSkeleton key={i} index={i} />
      ))}
    </div>
  );
}
