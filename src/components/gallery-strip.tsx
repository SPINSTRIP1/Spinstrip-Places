"use client";

import { Image01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import MediaImage from "@/components/media-image";
import EmptyState from "@/components/empty-state";
import SectionHeader from "@/components/section-header";

interface GalleryStripProps {
  images?: string[] | null;
  alt: string;
  title?: string;
  emptyDescription?: string;
}

/**
 * Horizontal photo rail shared by the places and events previews, including
 * the empty state for listings that were published without a gallery.
 */
export default function GalleryStrip({
  images,
  alt,
  title = "Gallery",
  emptyDescription = "No photos have been added to this listing yet. Check back soon.",
}: GalleryStripProps) {
  const photos = (images ?? []).filter(Boolean);

  return (
    <section className="space-y-4">
      <SectionHeader
        title={title}
        badge={photos.length ? `${photos.length}` : undefined}
      />
      {photos.length === 0 ? (
        <EmptyState
          icon={<HugeiconsIcon icon={Image01Icon} size={26} />}
          title="No photos yet"
          description={emptyDescription}
        />
      ) : (
        <div className="chip-rail -mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-2">
          {photos.map((image, index) => (
            <MediaImage
              key={`${image}-${index}`}
              src={image}
              alt={`${alt} photo ${index + 1}`}
              className="h-[180px] w-[260px] shrink-0 snap-start rounded-2xl border border-background-light md:h-[220px] md:w-[320px]"
            />
          ))}
        </div>
      )}
    </section>
  );
}
