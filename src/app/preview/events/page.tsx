"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Calendar03Icon,
  Call02Icon,
  Globe02Icon,
  Location01Icon,
  Mail01Icon,
  SearchList01Icon,
  Ticket01Icon,
  UserMultipleIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import MaxWidthWrapper from "@/components/max-width-wrapper";
import ContainerWrapper from "@/components/container-wrapper";
import DetailHero from "@/components/detail-hero";
import BookingBar from "@/components/booking-bar";
import SectionHeader from "@/components/section-header";
import GalleryStrip from "@/components/gallery-strip";
import PostsRail, { RailPost } from "@/components/posts-rail";
import InfoRow from "@/components/info-row";
import EmptyState from "@/components/empty-state";
import Loader from "@/components/loader";
import BackLink from "@/components/back-link";
import { Button } from "@/components/ui/button";
import ReviewComposer from "@/components/review-composer";
import CheckOutModal from "./_components/modals/checkout";
import { usePublicEvent } from "@/hooks/use-events";
import { useMerchantPreview } from "@/lib/merchant-preview";
import { formatAmount, formatDateDisplay, formatEnumLabel } from "@/utils";
import { cn } from "@/lib/utils";

function EventsPageContent() {
  const posts: RailPost[] = [];
  const [isModalOpen, setIsModalOpen] = useState(false);
  const id = useSearchParams().get("id");
  const { event: publicEvent, isLoading: eventLoading } = usePublicEvent(id);
  // Inside the merchant dashboard's preview modal, a draft event comes from the dashboard.
  const preview = useMerchantPreview<NonNullable<typeof publicEvent>>("event", id);
  const event = publicEvent ?? preview.data;
  const loading = eventLoading || (!publicEvent && preview.waiting);

  if (loading) return <Loader />;

  if (!event) {
    return (
      <MaxWidthWrapper className="flex min-h-[60vh] items-center justify-center">
        <EmptyState
          icon={<HugeiconsIcon icon={SearchList01Icon} size={26} />}
          title="Event not found"
          description="This event may have been unpublished, or the link you followed is out of date."
          action={
            <Button asChild size="lg">
              <Link href="/">Browse events</Link>
            </Button>
          }
        />
      </MaxWidthWrapper>
    );
  }

  const tiers = event.ticketTiers ?? [];
  const prices = tiers.map((tier) => tier.price).filter((p) => p >= 0);
  const lowestPrice = prices.length ? Math.min(...prices) : 0;
  const priceLabel = !tiers.length
    ? "Free entry"
    : lowestPrice > 0
      ? `From ${formatAmount(lowestPrice)}`
      : "Free";

  const startsAt = new Date(event.startDate).toLocaleString("en-US", {
    day: "numeric",
    month: "long",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const openCheckout = () => setIsModalOpen(true);

  return (
    <section className="pb-28 lg:pb-6">
      <MaxWidthWrapper className="space-y-10">
        <BackLink label="All events" />

        <DetailHero
          image={event.images?.[0]}
          title={event.name}
          eyebrow={formatEnumLabel(event.frequency) || "Event"}
          impressions={event.totalImpressions ?? 0}
          metas={[
            {
              icon: Location01Icon,
              label: [event.city, event.state].filter(Boolean).join(", "),
            },
            {
              icon: Calendar03Icon,
              label: formatDateDisplay(event.startDate),
            },
            ...(event.expectedGuests
              ? [
                  {
                    icon: UserMultipleIcon,
                    label: `${event.expectedGuests.toLocaleString()} expected`,
                  },
                ]
              : []),
          ]}
        />

        <BookingBar
          price={priceLabel}
          caption={`Starts ${startsAt}`}
          ctaLabel="Reserve a spot"
          onCta={openCheckout}
        />

        {/* Overview */}
        <section className="space-y-3">
          <SectionHeader title="Overview" />
          {event.description ? (
            <p className="whitespace-pre-line text-sm leading-relaxed text-secondary-text">
              {event.description}
            </p>
          ) : (
            <EmptyState
              variant="inline"
              title="No description yet"
              description="The organiser hasn't added details about this event."
            />
          )}
        </section>

        {/* Tickets */}
        <section className="space-y-4">
          <SectionHeader
            title="Tickets"
            subtitle={
              tiers.length
                ? `Sales close on ${formatDateDisplay(event.startDate)}`
                : undefined
            }
            action={
              tiers.length ? (
                <Button onClick={openCheckout} className="btn-press shrink-0">
                  Get tickets
                </Button>
              ) : undefined
            }
          />
          {tiers.length === 0 ? (
            <EmptyState
              icon={<HugeiconsIcon icon={Ticket01Icon} size={26} />}
              title="No tickets on sale"
              description="The organiser hasn't published ticket tiers for this event yet. Follow the event to hear when they go live."
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {tiers.map((tier) => {
                const soldOut = tier.quantityAvailable <= 0;
                return (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={openCheckout}
                    disabled={soldOut}
                    className={cn(
                      "listing-card flex flex-col items-start gap-y-1 rounded-3xl border border-background-light bg-white p-4 text-left",
                      soldOut && "cursor-not-allowed opacity-60",
                    )}
                  >
                    <span className="text-sm font-bold text-primary-text">
                      {tier.name}
                    </span>
                    {tier.description && (
                      <span className="line-clamp-2 text-xs text-secondary-text">
                        {tier.description}
                      </span>
                    )}
                    <span className="mt-2 text-lg font-bold text-primary">
                      {tier.price > 0 ? formatAmount(tier.price) : "Free"}
                    </span>
                    <span className="text-xs text-secondary-text">
                      {soldOut
                        ? "Sold out"
                        : `${tier.quantityAvailable.toLocaleString()} left`}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <GalleryStrip
          images={event.images}
          alt={event.name}
          emptyDescription="The organiser hasn't uploaded photos for this event yet."
        />

        {/* Location & contact */}
        <ContainerWrapper className="space-y-2">
          <SectionHeader title="Location & contact" className="mb-2" />
          <InfoRow
            icon={Location01Icon}
            label="Address"
            value={event.location}
            href={
              event.location
                ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`
                : undefined
            }
          />
          <InfoRow
            icon={Call02Icon}
            label="Call"
            value={event.contactPhone}
            href={event.contactPhone ? `tel:${event.contactPhone}` : undefined}
          />
          <InfoRow
            icon={Mail01Icon}
            label="Email"
            value={event.contactEmail}
            href={
              event.contactEmail ? `mailto:${event.contactEmail}` : undefined
            }
          />
          {event.location ? (
            <div className="mt-3 h-[200px] overflow-hidden rounded-2xl border border-background-light">
              <iframe
                title={`Map showing ${event.location}`}
                src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${encodeURIComponent(event.location)}`}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          ) : (
            <EmptyState
              variant="inline"
              icon={<HugeiconsIcon icon={Globe02Icon} size={22} />}
              title="No map available"
              description="This event hasn't shared a venue address yet."
            />
          )}
        </ContainerWrapper>

        {/* Reviews */}
        <ContainerWrapper className="space-y-4">
          <SectionHeader title="Reviews" />
          {event.id && (
            <ReviewComposer
              target={{ kind: "event", id: event.id }}
              title="Review this event"
              description="Went to this event? Rate it and tell others what it was like."
            />
          )}
        </ContainerWrapper>

        <ContainerWrapper>
          <PostsRail
            posts={posts}
            emptyDescription="No posts have been shared about this event yet."
          />
        </ContainerWrapper>
      </MaxWidthWrapper>

      <BookingBar
        variant="sticky"
        price={priceLabel}
        caption={`Starts ${startsAt}`}
        ctaLabel="Reserve"
        onCta={openCheckout}
      />

      <CheckOutModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        event={event}
      />
    </section>
  );
}

// useSearchParams() requires a Suspense boundary for the prerender pass.
export default function EventsPage() {
  return (
    <Suspense fallback={<Loader />}>
      <EventsPageContent />
    </Suspense>
  );
}
