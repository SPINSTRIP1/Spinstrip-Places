"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AuroraBackground from "@/components/AuroraBackground";
import BottomNav from "@/components/BottomNav";
import CategoryChips from "@/components/CategoryChips";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import ListingCard from "@/components/ListingCard";
import ListingCardSkeletonGrid from "@/components/listing-card-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import SectionTabs from "@/components/SectionTabs";
import { SECTIONS, type Listing, type SectionKey } from "@/data/listings";
import {
  EVENT_CATEGORIES,
  EVENT_FEATURED_VALUE,
  EVENT_SORTS,
  MENU_CATEGORIES,
  MENU_SORTS,
  PAGE_SIZE,
  PLACE_CATEGORIES,
  PLACE_SORTS,
  type SortKey,
} from "@/constants";
import { usePublicPlaces } from "@/hooks/use-places";
import { usePublicEvents } from "@/hooks/use-events";
import { usePublicMenu } from "@/hooks/use-menu";
import { useDebouncedValue } from "@/hooks/use-debounce";
import {
  transformEventToListing,
  transformMenuItemToListing,
  transformPlaceToListing,
} from "@/utils";
import { SearchX } from "lucide-react";

const CATEGORY_OPTIONS = {
  places: PLACE_CATEGORIES,
  events: EVENT_CATEGORIES,
  menu: MENU_CATEGORIES,
} as const;

export default function HomeView() {
  const router = useRouter();
  const [section, setSection] = useState<SectionKey>("places");
  const [category, setCategory] = useState("");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("recommended");
  const resultsRef = useRef<HTMLDivElement>(null);

  // Search runs on the server, so only send it once typing settles.
  const search = useDebouncedValue(query.trim(), 400);

  // Every filter below is a server query param — nothing is filtered client-side.
  const {
    places,
    count: placesCount,
    isLoading: placesLoading,
  } = usePublicPlaces(
    {
      status: "PUBLISHED",
      placeType: category || undefined,
      search: search || undefined,
      ...PLACE_SORTS[sort],
      page: 1,
      limit: PAGE_SIZE,
    },
    { enabled: section === "places" },
  );

  const {
    events,
    count: eventsCount,
    isLoading: eventsLoading,
  } = usePublicEvents(
    {
      status: "ACTIVE",
      isFeatured: category === EVENT_FEATURED_VALUE ? true : undefined,
      frequency:
        category && category !== EVENT_FEATURED_VALUE ? category : undefined,
      search: search || undefined,
      ...EVENT_SORTS[sort],
      page: 1,
      limit: PAGE_SIZE,
    },
    { enabled: section === "events" },
  );

  const {
    menuItems,
    count: menuCount,
    isLoading: menuLoading,
  } = usePublicMenu(
    {
      category: category || undefined,
      search: search || undefined,
      ...MENU_SORTS[sort],
      page: 1,
      limit: PAGE_SIZE,
    },
    { enabled: section === "menu" },
  );

  const handleSection = (s: SectionKey) => {
    setSection(s);
    setCategory("");
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const visible: Listing[] = useMemo(() => {
    if (section === "places") return places.map(transformPlaceToListing);
    if (section === "events") return events.map(transformEventToListing);
    return menuItems.map(transformMenuItemToListing);
  }, [section, places, events, menuItems]);

  const total =
    section === "places"
      ? placesCount
      : section === "events"
        ? eventsCount
        : menuCount;

  // isLoading is true only while the active section has no data yet, so a
  // background refetch never swaps rendered cards for the spinner.
  const isLoading =
    section === "places"
      ? placesLoading
      : section === "events"
        ? eventsLoading
        : menuLoading;

  const activeSection = SECTIONS.find((s) => s.key === section)!;

  const handleOpen = (listing: Listing) => {
    if (section === "menu") return;
    if (section === "events") {
      router.push(`/preview/events?id=${listing.id}`);
      return;
    }
    router.push(`/preview/places?id=${listing.id}`);
  };

  return (
    <div className="min-h-screen">
      <AuroraBackground />
      <Header />

      <main>
        <Hero query={query} onQuery={setQuery} />
        <SectionTabs active={section} onChange={handleSection} />

        <div ref={resultsRef} className="scroll-mt-20">
          <CategoryChips
            key={section}
            categories={CATEGORY_OPTIONS[section]}
            active={category}
            onChange={setCategory}
            sort={sort}
            onSort={setSort}
          />

          <section className="mx-auto mt-8 max-w-6xl px-4 sm:px-6">
            <div className="mb-5 flex items-end justify-between">
              <div>
                <h2 className="font-display text-2xl font-bold text-[#0F0F0F] sm:text-3xl">
                  {activeSection.label}
                </h2>
                <p className="mt-1 text-sm text-[#6F6D6D]">
                  {activeSection.blurb}
                </p>
              </div>
              {isLoading ? (
                <Skeleton className="h-[26px] w-20 shrink-0 rounded-full" />
              ) : (
                <span className="shrink-0 rounded-full border border-background-light bg-white/70 px-3 py-1 text-xs font-medium text-[#6F6D6D]">
                  {total} {total === 1 ? "result" : "results"}
                </span>
              )}
            </div>

            {isLoading ? (
              <ListingCardSkeletonGrid />
            ) : visible.length > 0 ? (
              <div
                key={`${section}-${category}-${sort}-${search}`}
                className="section-swap grid grid-cols-1 gap-5 pb-6 sm:grid-cols-2 lg:grid-cols-3"
              >
                {visible.map((l, i) => (
                  <ListingCard
                    key={l.id}
                    listing={l}
                    index={i}
                    onOpen={handleOpen}
                  />
                ))}
              </div>
            ) : (
              <div className="section-swap flex flex-col items-center gap-3 rounded-3xl border border-dashed border-neutral-accent bg-white/60 py-16 text-center">
                <SearchX className="h-8 w-8 text-primary-light" />
                <p className="font-display text-lg font-semibold text-[#0F0F0F]">
                  Nothing found
                </p>
                <p className="max-w-xs text-sm text-[#6F6D6D]">
                  Try a different search term or clear the category filter.
                </p>
                <button
                  onClick={() => {
                    setQuery("");
                    setCategory("");
                  }}
                  className="btn-press mt-2 rounded-full bg-[#6932E2] px-5 py-2 text-sm font-semibold text-white hover:bg-[#7C4BE8]"
                >
                  Clear filters
                </button>
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />
      <BottomNav active={section} onChange={handleSection} />
    </div>
  );
}
