"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Call02Icon,
  Globe02Icon,
  Location01Icon,
  Mail01Icon,
  SearchList01Icon,
  Sofa01Icon,
  StarIcon,
  Time01Icon,
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
import FacilityCard from "@/components/facility-card";
import Loader from "@/components/loader";
import { Button } from "@/components/ui/button";
import CheckOutModal from "./_components/modals/checkout";
import { PublicFacility, usePublicPlace } from "@/hooks/use-places";
import { PLACE_TYPES } from "@/constants";
import { cn, getOperatingHoursDisplay } from "@/lib/utils";
import { formatAmount, formatEnumLabel } from "@/utils";

const TABS = [
  { value: "home", label: "Home" },
  { value: "about", label: "About" },
] as const;

type Tab = (typeof TABS)[number]["value"];

function PlacesPageContent() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFacility, setSelectedFacility] =
    useState<PublicFacility | null>(null);
  const [tab, setTab] = useState<Tab>("home");

  const id = useSearchParams().get("id");
  const { place, isLoading: loading } = usePublicPlace(id);
  const posts: RailPost[] = [];

  const openBooking = (facility?: PublicFacility) => {
    setSelectedFacility(facility ?? null);
    setIsModalOpen(true);
  };

  if (loading) return <Loader />;

  if (!place) {
    return (
      <MaxWidthWrapper className="flex min-h-[60vh] items-center justify-center">
        <EmptyState
          icon={<HugeiconsIcon icon={SearchList01Icon} size={26} />}
          title="Place not found"
          description="This place may have been unpublished, or the link you followed is out of date."
          action={
            <Button asChild size="lg">
              <Link href="/">Browse places</Link>
            </Button>
          }
        />
      </MaxWidthWrapper>
    );
  }

  const facilities = place.facilities ?? [];

  /** Unique facility categories, rendered as chips under "Facilities". */
  const categories = Array.from(
    new Set(facilities.map((facility) => facility.facilityCategory)),
  ).filter(Boolean);

  const allFees = facilities.flatMap((facility) =>
    (facility.fees ?? [])
      .filter((fee) => fee.isActive !== false)
      .map((fee) => Number(fee.amount) || 0),
  );
  const lowestFee = allFees.length ? Math.min(...allFees) : 0;
  const priceLabel = !facilities.length
    ? "Not bookable yet"
    : lowestFee > 0
      ? `From ${formatAmount(lowestFee)}`
      : "Free to book";

  const hoursLabel = getOperatingHoursDisplay(place.operatingHours);
  const placeTypeLabel =
    PLACE_TYPES.find((type) => type.value === place.placeType)?.label ??
    formatEnumLabel(place.placeType);

  return (
    <section className="pb-28 lg:pb-6">
      <MaxWidthWrapper className="space-y-8">
        {/* Merchant bar + section tabs */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-x-3">
            <MediaImage
              src={place.coverImage}
              alt={place.name}
              className="h-11 w-11 shrink-0 rounded-full"
            />
            <div className="min-w-0">
              <p className="truncate text-base font-bold text-primary-text">
                {place.name}
              </p>
              <p className="truncate text-xs text-secondary-text">
                {placeTypeLabel}
              </p>
            </div>
          </div>

          <div
            role="tablist"
            aria-label="Place sections"
            className="flex shrink-0 gap-1 rounded-full border border-background-light bg-white p-1"
          >
            {TABS.map((item) => (
              <button
                key={item.value}
                role="tab"
                aria-selected={tab === item.value}
                onClick={() => setTab(item.value)}
                className={cn(
                  "seg-pill rounded-full px-6 py-2 text-sm font-bold transition-colors",
                  tab === item.value
                    ? "bg-primary text-white"
                    : "text-secondary-text hover:text-primary-text",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <DetailHero
          image={place.coverImage}
          title={place.name}
          eyebrow={placeTypeLabel}
          impressions={place.views ?? 0}
          metas={[
            {
              icon: Location01Icon,
              label: [place.city, place.state].filter(Boolean).join(", "),
            },
            { icon: Time01Icon, label: hoursLabel },
            ...(place.website
              ? [{ icon: Globe02Icon, label: place.website }]
              : []),
          ]}
        />

        <BookingBar
          price={priceLabel}
          caption={hoursLabel}
          ctaLabel="Book a facility"
          onCta={() => openBooking()}
          disabled={facilities.length === 0}
        />

        {tab === "home" ? (
          <div className="section-swap space-y-10">
            {/* Facilities */}
            <section className="space-y-4">
              <SectionHeader
                title="Facilities"
                badge={facilities.length ? `${facilities.length}` : undefined}
                subtitle={
                  facilities.length
                    ? "Pick a facility to check availability and book."
                    : undefined
                }
              />

              {categories.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => {
                    const type = PLACE_TYPES.find(
                      (item) => item.label === category,
                    );
                    return (
                      <span
                        key={category}
                        className="inline-flex items-center gap-x-1.5 rounded-full border border-background-light bg-white px-3 py-1.5 text-xs font-medium text-secondary-text"
                      >
                        <HugeiconsIcon
                          icon={type?.icon || StarIcon}
                          size={16}
                          color="currentColor"
                        />
                        {category}
                      </span>
                    );
                  })}
                </div>
              )}

              {facilities.length === 0 ? (
                <EmptyState
                  icon={<HugeiconsIcon icon={Sofa01Icon} size={26} />}
                  title="No facilities listed"
                  description="This place hasn't published any bookable facilities yet. Follow it to hear when reservations open."
                />
              ) : (
                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {facilities.map((facility) => (
                    <FacilityCard
                      key={facility.id}
                      title={facility.name}
                      description={facility.description}
                      imgUrl={facility.images?.[0] || place.coverImage}
                      facilityType={facility.facilityCategory}
                      accessType={facility.accessType || ""}
                      price={facility.fees?.[0]?.amount ?? 0}
                      onClick={() => openBooking(facility)}
                    />
                  ))}
                </div>
              )}
            </section>

            <GalleryStrip
              images={place.images}
              alt={place.name}
              emptyDescription="This place hasn't uploaded photos yet."
            />

            <ContainerWrapper>
              <PostsRail
                posts={posts}
                emptyDescription="No posts have been shared about this place yet."
              />
            </ContainerWrapper>
          </div>
        ) : (
          <div className="section-swap space-y-10">
            {/* Overview */}
            <section className="space-y-3">
              <SectionHeader title="Overview" />
              {place.description ? (
                <p className="whitespace-pre-line text-sm leading-relaxed text-secondary-text">
                  {place.description}
                </p>
              ) : (
                <EmptyState
                  variant="inline"
                  title="No description yet"
                  description="This place hasn't added an overview."
                />
              )}
            </section>

            {/* Contact */}
            <ContainerWrapper className="space-y-2">
              <SectionHeader title="Location & contact" className="mb-2" />
              <InfoRow
                icon={Location01Icon}
                label="Address"
                value={place.address}
                href={
                  place.address
                    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.address)}`
                    : undefined
                }
              />
              <InfoRow
                icon={Time01Icon}
                label="Opening hours"
                value={hoursLabel}
              />
              <InfoRow
                icon={Call02Icon}
                label="Call"
                value={place.phoneNumbers?.join(", ")}
                href={
                  place.phoneNumbers?.[0]
                    ? `tel:${place.phoneNumbers[0]}`
                    : undefined
                }
              />
              <InfoRow
                icon={Mail01Icon}
                label="Email"
                value={place.emails?.join(", ")}
                href={place.emails?.[0] ? `mailto:${place.emails[0]}` : undefined}
              />
              <InfoRow
                icon={Globe02Icon}
                label="Website"
                value={place.website}
                href={place.website || undefined}
              />

              {place.address ? (
                <div className="mt-3 h-[200px] overflow-hidden rounded-2xl border border-background-light">
                  <iframe
                    title={`Map showing ${place.address}`}
                    src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${encodeURIComponent(place.address)}`}
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
                  description="This place hasn't shared a street address yet."
                />
              )}
            </ContainerWrapper>
          </div>
        )}
      </MaxWidthWrapper>

      <BookingBar
        variant="sticky"
        price={priceLabel}
        caption={hoursLabel}
        ctaLabel="Book"
        onCta={() => openBooking()}
        disabled={facilities.length === 0}
      />

      <CheckOutModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        place={place}
        facility={selectedFacility}
      />
    </section>
  );
}

// useSearchParams() requires a Suspense boundary for the prerender pass.
export default function PlacesPage() {
  return (
    <Suspense fallback={<Loader />}>
      <PlacesPageContent />
    </Suspense>
  );
}
