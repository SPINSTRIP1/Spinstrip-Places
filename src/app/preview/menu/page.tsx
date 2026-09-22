"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Alert02Icon,
  ChefHatIcon,
  Clock01Icon,
  PackageIcon,
  SearchList01Icon,
  SpoonAndForkIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import MaxWidthWrapper from "@/components/max-width-wrapper";
import ContainerWrapper from "@/components/container-wrapper";
import DetailHero from "@/components/detail-hero";
import BookingBar from "@/components/booking-bar";
import SectionHeader from "@/components/section-header";
import GalleryStrip from "@/components/gallery-strip";
import EmptyState from "@/components/empty-state";
import MediaImage from "@/components/media-image";
import MetaChip from "@/components/meta-chip";
import Loader from "@/components/loader";
import { Button } from "@/components/ui/button";
import CheckOutModal, { MenuCart } from "./_components/modals/checkout";
import { isMenuItemOrderable, usePublicMenuItem } from "@/hooks/use-menu";
import {
  describeAvailability,
  formatAmount,
  formatEnumLabel,
  menuStockLabel as stockLabel,
} from "@/utils";
import { cn } from "@/lib/utils";

function MenuPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const merchantId = searchParams.get("merchant");
  const { menuItem: item, merchantMenu, isLoading } = usePublicMenuItem(
    id,
    merchantId,
  );

  // Lives on the page, not in the modal, so the order survives moving
  // between dishes from the same kitchen.
  const [cart, setCart] = useState<MenuCart>({});
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (isLoading) return <Loader />;

  if (!item) {
    return (
      <MaxWidthWrapper className="flex min-h-[60vh] items-center justify-center">
        <EmptyState
          icon={<HugeiconsIcon icon={SearchList01Icon} size={26} />}
          title="Dish not found"
          description="This item may have been removed from the menu, or the link you followed is out of date."
          action={
            <Button asChild size="lg">
              <Link href="/">Browse the menu</Link>
            </Button>
          }
        />
      </MaxWidthWrapper>
    );
  }

  const orderable = isMenuItemOrderable(item);
  const moreFromKitchen = merchantMenu.filter(
    (other) => other.id !== item.id && !other.isHidden,
  );
  const allergens = item.nutritionAllergens ?? [];
  const sizes = item.sizeOptions ?? [];
  const optionLines = [...(item.addOns ?? []), ...(item.extras ?? [])];
  const cartCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0);

  const openCheckout = () => {
    if (!orderable) return;
    // Ordering from this page always puts this dish in the basket.
    setCart((previous) =>
      previous[item.id] ? previous : { ...previous, [item.id]: 1 },
    );
    setIsModalOpen(true);
  };

  const ctaLabel = !orderable
    ? stockLabel(item)
    : cartCount > 0
      ? `View order (${cartCount})`
      : "Order now";

  return (
    <section className="pb-28 lg:pb-6">
      <MaxWidthWrapper className="space-y-10">
        <DetailHero
          image={item.images?.[0]}
          title={item.name}
          eyebrow={formatEnumLabel(item.category) || "Menu"}
          metas={[
            { icon: Clock01Icon, label: describeAvailability(item) },
            { icon: PackageIcon, label: stockLabel(item) },
            ...(item.tag ? [{ icon: ChefHatIcon, label: item.tag }] : []),
          ]}
        />

        <BookingBar
          price={formatAmount(item.price)}
          caption={describeAvailability(item)}
          ctaLabel={ctaLabel}
          onCta={openCheckout}
          disabled={!orderable}
        />

        {/* Overview */}
        <section className="space-y-3">
          <SectionHeader title="About this dish" />
          {item.description ? (
            <p className="whitespace-pre-line text-sm leading-relaxed text-secondary-text">
              {item.description}
            </p>
          ) : (
            <EmptyState
              variant="inline"
              title="No description yet"
              description="The restaurant hasn't described this dish."
            />
          )}
        </section>

        {/* Allergens */}
        <section className="space-y-3">
          <SectionHeader title="Allergens & nutrition" />
          {allergens.length ? (
            <div className="flex flex-wrap gap-2">
              {allergens.map((entry) => (
                <MetaChip
                  key={`${entry.type}-${entry.name}`}
                  icon={entry.type === "allergen" ? Alert02Icon : undefined}
                  tone={entry.type === "allergen" ? "accent" : "default"}
                >
                  {entry.name}
                </MetaChip>
              ))}
            </div>
          ) : (
            <EmptyState
              variant="inline"
              icon={<HugeiconsIcon icon={Alert02Icon} size={22} />}
              title="No allergen information"
              description="Check with the restaurant if you have dietary requirements."
            />
          )}
        </section>

        {/* Sizes, add-ons and extras aren't part of an online order yet. */}
        {(sizes.length > 0 || optionLines.length > 0) && (
          <ContainerWrapper className="space-y-3">
            <SectionHeader
              title="Sizes & extras"
              subtitle="Online orders are for the standard portion. Ask the restaurant about these options."
            />
            {sizes.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => (
                  <MetaChip key={size}>{size}</MetaChip>
                ))}
              </div>
            )}
            {optionLines.length > 0 && (
              <ul className="divide-y divide-background-light">
                {optionLines.map((option) => (
                  <li
                    key={option.name}
                    className="flex items-center justify-between py-2 text-sm"
                  >
                    <span className="text-primary-text">{option.name}</span>
                    <span className="text-secondary-text">
                      +{formatAmount(option.price)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </ContainerWrapper>
        )}

        <GalleryStrip
          images={item.images}
          alt={item.name}
          emptyDescription="The restaurant hasn't uploaded photos of this dish yet."
        />

        {/* More from the same merchant — all orderable in one basket. */}
        <section className="space-y-4">
          <SectionHeader
            title="More from this kitchen"
            subtitle={
              moreFromKitchen.length
                ? "Open any of these to add it to the same order."
                : undefined
            }
            href={`/restaurants/${item.userId}`}
            linkLabel="View restaurant"
          />
          {moreFromKitchen.length === 0 ? (
            <EmptyState
              icon={<HugeiconsIcon icon={SpoonAndForkIcon} size={26} />}
              title="Nothing else on the menu"
              description="This is the only dish this restaurant has published so far."
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {moreFromKitchen.map((other) => {
                const available = isMenuItemOrderable(other);
                return (
                  <button
                    key={other.id}
                    type="button"
                    onClick={() =>
                      router.push(
                        `/preview/menu?id=${other.id}&merchant=${other.userId}`,
                      )
                    }
                    className={cn(
                      "listing-card flex items-center gap-x-3 rounded-3xl border border-background-light bg-white p-3 text-left",
                      !available && "opacity-60",
                    )}
                  >
                    <MediaImage
                      src={other.images?.[0]}
                      alt={other.name}
                      className="h-16 w-16 shrink-0 rounded-2xl"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-primary-text">
                        {other.name}
                      </span>
                      <span className="block truncate text-xs text-secondary-text">
                        {formatEnumLabel(other.category)} · {stockLabel(other)}
                      </span>
                      <span className="mt-1 block text-sm font-bold text-primary">
                        {formatAmount(other.price)}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </MaxWidthWrapper>

      <BookingBar
        variant="sticky"
        price={formatAmount(item.price)}
        caption={describeAvailability(item)}
        ctaLabel={orderable ? (cartCount > 0 ? "View order" : "Order") : ctaLabel}
        onCta={openCheckout}
        disabled={!orderable}
      />

      <CheckOutModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        item={item}
        merchantMenu={merchantMenu}
        cart={cart}
        onCartChange={setCart}
      />
    </section>
  );
}

// useSearchParams() requires a Suspense boundary for the prerender pass.
export default function MenuPreviewPage() {
  return (
    <Suspense fallback={<Loader />}>
      <MenuPageContent />
    </Suspense>
  );
}
