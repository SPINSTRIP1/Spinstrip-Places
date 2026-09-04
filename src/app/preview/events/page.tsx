"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import {
  Calendar03Icon,
  Call02Icon,
  Globe02Icon,
  Location01Icon,
  Mail01Icon,
  SearchList01Icon,
  StarIcon,
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
import MediaImage from "@/components/media-image";
import Loader from "@/components/loader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import CheckOutModal from "./_components/modals/checkout";
import { usePublicEvent } from "@/hooks/use-events";
import { formatAmount, formatDateDisplay, formatEnumLabel } from "@/utils";
import { cn } from "@/lib/utils";

interface EventReview {
  id: string;
  name: string;
  avatar?: string;
  rating: number;
  date: string;
  body: string;
}

function ReviewComposer() {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const canSubmit = rating > 0 && comment.trim().length > 0;

  return (
    <div className="rounded-3xl border border-background-light bg-white p-4">
      <h3 className="text-sm font-bold text-primary-text">Review this event</h3>
      <p className="mt-1 text-sm text-secondary-text">
        Rate your experience and tell others what it was like.
      </p>

      <div className="mt-3 flex items-center gap-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            aria-label={`Rate ${star} star${star === 1 ? "" : "s"}`}
            onClick={() => setRating(star)}
            className="btn-press rounded-full p-1"
          >
            <HugeiconsIcon
              icon={StarIcon}
              size={24}
              color={star <= rating ? "#9E76F8" : "#C8C8C8"}
              fill={star <= rating ? "#9E76F8" : "#C8C8C8"}
            />
          </button>
        ))}
      </div>

      <Textarea
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        placeholder="Share your thoughts on this event..."
        className="my-4 border-background-light bg-background"
        rows={5}
      />
      <Button
        disabled={!canSubmit}
        onClick={() => {
          toast.success("Thanks for the feedback — reviews go live soon.");
          setRating(0);
          setComment("");
        }}
      >
        Submit review
      </Button>
    </div>
  );
}

function EventsPageContent() {
  const posts: RailPost[] = [];
  const reviews: EventReview[] = [];
  const [isModalOpen, setIsModalOpen] = useState(false);
  const id = useSearchParams().get("id");
  const { event, isLoading: loading } = usePublicEvent(id);

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
          <SectionHeader
            title="Reviews"
            badge={reviews.length ? `${reviews.length}` : undefined}
            href={reviews.length ? "/" : undefined}
          />
          {reviews.length === 0 ? (
            <EmptyState
              icon={<HugeiconsIcon icon={StarIcon} size={26} />}
              title="No reviews yet"
              description="Be the first to share your experience of this event."
            />
          ) : (
            <div className="space-y-5">
              {reviews.map((review) => (
                <article key={review.id} className="space-y-2">
                  <div className="flex items-center gap-x-3">
                    <MediaImage
                      src={review.avatar}
                      alt={review.name}
                      className="h-10 w-10 shrink-0 rounded-full"
                    />
                    <div>
                      <p className="text-sm font-bold text-primary-text">
                        {review.name}
                      </p>
                      <div className="flex items-center gap-x-2">
                        <div className="flex items-center gap-x-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <HugeiconsIcon
                              key={star}
                              icon={StarIcon}
                              size={13}
                              color={
                                star <= review.rating ? "#9E76F8" : "#C8C8C8"
                              }
                              fill={
                                star <= review.rating ? "#9E76F8" : "#C8C8C8"
                              }
                            />
                          ))}
                        </div>
                        <p className="text-xs text-secondary-text">
                          {review.date}
                        </p>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed text-secondary-text">
                    {review.body}
                  </p>
                </article>
              ))}
            </div>
          )}
          <ReviewComposer />
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
