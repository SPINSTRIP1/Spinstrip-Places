"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft01Icon,
  Call02Icon,
  CheckmarkCircle02Icon,
  Location01Icon,
  LockIcon,
  SearchList01Icon,
  Sofa01Icon,
  Time01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import MaxWidthWrapper from "@/components/max-width-wrapper";
import ContainerWrapper from "@/components/container-wrapper";
import DetailHero from "@/components/detail-hero";
import BookingBar from "@/components/booking-bar";
import SectionHeader from "@/components/section-header";
import GalleryStrip from "@/components/gallery-strip";
import InfoRow from "@/components/info-row";
import EmptyState from "@/components/empty-state";
import MediaImage from "@/components/media-image";
import Loader from "@/components/loader";
import { Button } from "@/components/ui/button";
import CheckOutModal from "../_components/modals/checkout";
import { usePublicPlace, type PublicFacility, type PublicPlace } from "@/hooks/use-places";
import { useMerchantPreview } from "@/lib/merchant-preview";
import { PLACE_TYPES } from "@/constants";
import { getOperatingHoursDisplay } from "@/lib/utils";
import { formatAmount, formatEnumLabel } from "@/utils";
import { facilityHref } from "@/lib/links";

/** Fee tiers a customer can actually book (inactive tiers are hidden). */
const activeFees = (facility: PublicFacility) => (facility.fees ?? []).filter((fee) => fee.isActive !== false);

function FacilityPageContent() {
  const params = useSearchParams();
  const placeId = params.get("place");
  const facilityId = params.get("id");
  const { place: publicPlace, isLoading: placeLoading } = usePublicPlace(placeId);
  const preview = useMerchantPreview<PublicPlace>("place", placeId);
  const place = publicPlace ?? preview.data;
  const isLoading = placeLoading || (!publicPlace && preview.waiting);
  const [isBooking, setIsBooking] = useState(false);

  if (isLoading) return <Loader />;

  const facility = place?.facilities?.find((f) => f.id === facilityId) ?? null;

  if (!place || !facility) {
    return (
      <MaxWidthWrapper className="flex min-h-[60vh] items-center justify-center">
        <EmptyState
          icon={<HugeiconsIcon icon={SearchList01Icon} size={26} />}
          title="Facility not found"
          description="This facility may have been removed, or the link you followed is out of date."
          action={
            <Button asChild size="lg">
              <Link href={place ? `/preview/places?id=${place.id}` : "/"}>
                {place ? `Back to ${place.name}` : "Browse places"}
              </Link>
            </Button>
          }
        />
      </MaxWidthWrapper>
    );
  }

  const fees = activeFees(facility);
  const amounts = fees.map((fee) => Number(fee.amount) || 0);
  const lowest = amounts.length ? Math.min(...amounts) : 0;
  // Same rule as the checkout: a facility is paid when it has an active rate above zero
  // (`accessType` can be stale — the API doesn't update it on edit).
  const isFree = fees.length === 0 || lowest === 0;
  const priceLabel = isFree ? "Free to book" : fees.length > 1 ? `From ${formatAmount(lowest)}` : formatAmount(lowest);
  const hoursLabel = getOperatingHoursDisplay(place.operatingHours);
  const placeTypeLabel =
    PLACE_TYPES.find((type) => type.value === place.placeType)?.label ?? formatEnumLabel(place.placeType);
  const location = [place.city, place.state].filter(Boolean).join(", ");
  const otherFacilities = (place.facilities ?? []).filter((f) => f.id !== facility.id);
  const images = facility.images?.length ? facility.images : place.images;

  return (
    <section className="pb-28 lg:pb-6">
      <MaxWidthWrapper className="space-y-8">
        <Link
          href={`/preview/places?id=${place.id}`}
          className="inline-flex items-center gap-x-1.5 text-sm font-bold text-secondary-text transition-colors hover:text-primary"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
          {place.name}
        </Link>

        <DetailHero
          image={facility.images?.[0] || place.coverImage}
          title={facility.name}
          eyebrow={facility.facilityCategory || placeTypeLabel}
          metas={[
            ...(location ? [{ icon: Location01Icon, label: `${place.name} · ${location}` }] : []),
            { icon: Time01Icon, label: hoursLabel },
            ...(facility.isGated ? [{ icon: LockIcon, label: "Gated access" }] : []),
          ]}
        />

        <BookingBar
          price={priceLabel}
          caption={`${place.name} · ${hoursLabel}`}
          ctaLabel="Book this facility"
          onCta={() => setIsBooking(true)}
        />

        <section className="space-y-3">
          <SectionHeader title="About this facility" />
          {facility.description ? (
            <p className="whitespace-pre-line text-sm leading-relaxed text-secondary-text">{facility.description}</p>
          ) : (
            <EmptyState
              variant="inline"
              title="No description yet"
              description="This place hasn't described this facility."
            />
          )}
        </section>

        <section className="space-y-4">
          <SectionHeader
            title="Rates"
            badge={fees.length ? `${fees.length}` : undefined}
            subtitle={fees.length ? "Pick a rate when you book." : undefined}
          />
          {isFree && fees.length === 0 ? (
            <ContainerWrapper className="flex items-center gap-x-3">
              <HugeiconsIcon icon={CheckmarkCircle02Icon} size={22} className="shrink-0 text-primary" />
              <p className="text-sm text-secondary-text">
                Open access — there&apos;s no charge to book this facility.
              </p>
            </ContainerWrapper>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {fees.map((fee) => (
                <button
                  key={fee.id}
                  type="button"
                  onClick={() => setIsBooking(true)}
                  className="listing-card flex flex-col gap-y-1 rounded-3xl border border-background-light bg-white p-4 text-left"
                >
                  <span className="text-sm font-bold text-primary-text">{fee.name}</span>
                  <span className="text-lg font-bold text-primary">
                    {Number(fee.amount) > 0 ? formatAmount(fee.amount) : "Free"}
                  </span>
                  {fee.description && <span className="text-xs text-secondary-text">{fee.description}</span>}
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <SectionHeader title="Good to know" />
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-background-light bg-white px-3 py-1.5 text-xs font-medium text-secondary-text">
              {isFree ? "Free to book" : "Paid booking"}
            </span>
            <span className="rounded-full border border-background-light bg-white px-3 py-1.5 text-xs font-medium text-secondary-text">
              {facility.isGated ? "Gated — check-in required" : "No gate"}
            </span>
            {facility.facilityCategory && (
              <span className="rounded-full border border-background-light bg-white px-3 py-1.5 text-xs font-medium text-secondary-text">
                {facility.facilityCategory}
              </span>
            )}
          </div>
        </section>

        <GalleryStrip
          images={images}
          alt={facility.name}
          emptyDescription="No photos of this facility yet."
        />

        <ContainerWrapper className="space-y-2">
          <SectionHeader title="Where it is" className="mb-2" href={`/preview/places?id=${place.id}`} linkLabel="View place" />
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
          <InfoRow icon={Time01Icon} label="Opening hours" value={hoursLabel} />
          <InfoRow
            icon={Call02Icon}
            label="Call"
            value={place.phoneNumbers?.join(", ")}
            href={place.phoneNumbers?.[0] ? `tel:${place.phoneNumbers[0]}` : undefined}
          />
        </ContainerWrapper>

        {otherFacilities.length > 0 && (
          <section className="space-y-4">
            <SectionHeader title={`More at ${place.name}`} badge={`${otherFacilities.length}`} />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {otherFacilities.map((other) => {
                const otherFees = activeFees(other).map((fee) => Number(fee.amount) || 0);
                const from = otherFees.length ? Math.min(...otherFees) : 0;
                return (
                  <Link
                    key={other.id}
                    href={facilityHref(place.id as string, other.id)}
                    className="listing-card flex items-center gap-x-3 rounded-3xl border border-background-light bg-white p-3"
                  >
                    <MediaImage
                      src={other.images?.[0] || place.coverImage}
                      alt={other.name}
                      className="h-16 w-16 shrink-0 rounded-2xl"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-primary-text">{other.name}</span>
                      <span className="block truncate text-xs text-secondary-text">{other.facilityCategory}</span>
                      <span className="mt-1 block text-sm font-bold text-primary">
                        {from > 0 ? `From ${formatAmount(from)}` : "Free"}
                      </span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {otherFacilities.length === 0 && (
          <EmptyState
            variant="inline"
            icon={<HugeiconsIcon icon={Sofa01Icon} size={22} />}
            title="The only facility here"
            description={`${place.name} hasn't listed other facilities yet.`}
          />
        )}
      </MaxWidthWrapper>

      <BookingBar
        variant="sticky"
        price={priceLabel}
        caption={facility.name}
        ctaLabel="Book"
        onCta={() => setIsBooking(true)}
      />

      <CheckOutModal isOpen={isBooking} onClose={() => setIsBooking(false)} place={place} facility={facility} />
    </section>
  );
}

// useSearchParams() requires a Suspense boundary for the prerender pass.
export default function FacilityPage() {
  return (
    <Suspense fallback={<Loader />}>
      <FacilityPageContent />
    </Suspense>
  );
}
