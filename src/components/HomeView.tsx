"use client";

import { useMemo, useRef, useState } from "react";
import AutoScroll from "embla-carousel-auto-scroll";
import { useRouter } from "next/navigation";
import { SearchX, Store, UtensilsCrossed } from "lucide-react";
import AuroraBackground from "@/components/AuroraBackground";
import BottomNav from "@/components/BottomNav";
import CategoryChips from "@/components/CategoryChips";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import PaginationBar from "@/components/pagination-bar";
import SectionTabs from "@/components/SectionTabs";
import PlaceCard from "@/components/cards/place-card";
import EventCard from "@/components/cards/event-card";
import DishCard from "@/components/cards/dish-card";
import RestaurantCard from "@/components/cards/restaurant-card";
import {
  DishRailSkeleton,
  ListingSkeletonGrid,
  RestaurantListSkeleton,
} from "@/components/cards/card-skeletons";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Skeleton } from "@/components/ui/skeleton";
import { SECTIONS, sectionThemeVars, type SectionKey } from "@/data/listings";
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
import { usePublicPlaces, type PublicPlace } from "@/hooks/use-places";
import { usePublicEvents, type PublicEventListItem } from "@/hooks/use-events";
import { usePublicMenu, type PublicMenuItem } from "@/hooks/use-menu";
import { useRestaurants } from "@/hooks/use-restaurants";
import { useDebouncedValue } from "@/hooks/use-debounce";

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
  const [page, setPage] = useState(1);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Search runs on the server, so only send it once typing settles.
  const search = useDebouncedValue(query.trim(), 400);

  // Every filter change puts you back on page 1 — page 4 of the old result
  // set is meaningless against the new one. Done in the handlers rather than
  // an effect so the reset lands in the same render as the filter change.
  const handleQuery = (value: string) => {
    setQuery(value);
    setPage(1);
  };

  const handleCategory = (value: string) => {
    setCategory(value);
    setPage(1);
  };

  const handleSort = (value: SortKey) => {
    setSort(value);
    setPage(1);
  };

  // Every filter below is a server query param — nothing is filtered client-side.
  const {
    places,
    count: placesCount,
    lastPage: placesLastPage,
    isLoading: placesLoading,
    isFetching: placesFetching,
  } = usePublicPlaces(
    {
      status: "PUBLISHED",
      placeType: category || undefined,
      search: search || undefined,
      ...PLACE_SORTS[sort],
      page,
      limit: PAGE_SIZE,
    },
    { enabled: section === "places" },
  );

  const {
    events,
    count: eventsCount,
    lastPage: eventsLastPage,
    isLoading: eventsLoading,
    isFetching: eventsFetching,
  } = usePublicEvents(
    {
      status: "ACTIVE",
      isFeatured: category === EVENT_FEATURED_VALUE ? true : undefined,
      frequency:
        category && category !== EVENT_FEATURED_VALUE ? category : undefined,
      search: search || undefined,
      ...EVENT_SORTS[sort],
      page,
      limit: PAGE_SIZE,
    },
    { enabled: section === "events" },
  );

  const {
    menuItems,
    count: menuCount,
    lastPage: menuLastPage,
    isLoading: menuLoading,
    isFetching: menuFetching,
  } = usePublicMenu(
    {
      category: category || undefined,
      search: search || undefined,
      ...MENU_SORTS[sort],
      page,
      limit: PAGE_SIZE,
    },
    { enabled: section === "menu" },
  );

  // The restaurant list sits under the dish rail. It follows the search box
  // but not the dish category/sort — a kitchen doesn't stop existing because
  // you're only looking at breakfast.
  const { restaurants, isLoading: restaurantsLoading } = useRestaurants(
    { search: search || undefined },
    { enabled: section === "menu" },
  );

  // The dish rail drifts on its own until the customer touches it: a click
  // or drag stops it for good, and the loop means it never runs out of road.
  const autoScroll = useMemo(() => {
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    return reduceMotion
      ? []
      : [
          AutoScroll({
            speed: 1.1,
            startDelay: 900,
            stopOnInteraction: true,
            stopOnMouseEnter: false,
          }),
        ];
  }, []);

  const restaurantNames = useMemo(() => {
    const names = new Map<string, string>();
    for (const restaurant of restaurants)
      names.set(restaurant.id, restaurant.name);
    return names;
  }, [restaurants]);

  const handleSection = (s: SectionKey) => {
    setSection(s);
    setCategory("");
    setPage(1);
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handlePage = (next: number) => {
    setPage(next);
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const clearFilters = () => {
    if (page > 1) {
      handlePage(1);
      return;
    }
    setQuery("");
    setCategory("");
  };

  const openPlace = (place: PublicPlace) =>
    router.push(`/preview/places?id=${place.id}`);
  const openEvent = (event: PublicEventListItem) =>
    router.push(`/preview/events?id=${event.id}`);
  // Dishes open inside their restaurant so every add lands in that
  // kitchen's cart and the customer can keep building an order.
  const openDish = (item: PublicMenuItem) =>
    router.push(`/restaurants/${item.userId}?item=${item.id}`);

  const total =
    section === "places"
      ? placesCount
      : section === "events"
        ? eventsCount
        : menuCount;

  const visibleCount =
    section === "places"
      ? places.length
      : section === "events"
        ? events.length
        : menuItems.length;

  // isLoading is true only while the active section has no data yet, so a
  // background refetch never swaps rendered cards for the spinner.
  const isLoading =
    section === "places"
      ? placesLoading
      : section === "events"
        ? eventsLoading
        : menuLoading;

  const lastPage =
    section === "places"
      ? placesLastPage
      : section === "events"
        ? eventsLastPage
        : menuLastPage;

  // True while a *subsequent* page is in flight — the current cards stay on
  // screen and the pager dims, rather than the grid collapsing to skeletons.
  const isPaging =
    !isLoading &&
    (section === "places"
      ? placesFetching
      : section === "events"
        ? eventsFetching
        : menuFetching);

  const activeSection = SECTIONS.find((s) => s.key === section)!;
  const gridKey = `${section}-${category}-${sort}-${search}-${page}`;

  const emptyState = (
    <div className="section-swap flex flex-col items-center gap-3 rounded-3xl border border-dashed border-neutral-accent bg-white/60 py-16 text-center">
      <span className="sec-soft sec-text grid h-14 w-14 place-items-center rounded-full">
        <SearchX className="h-6 w-6" />
      </span>
      <p className="font-display text-lg font-semibold text-primary-text">
        {page > 1 ? "Nothing on this page" : "Nothing found"}
      </p>
      <p className="max-w-xs text-sm text-secondary-text">
        {page > 1
          ? "This page is past the end of the results — they may have changed since you loaded them."
          : "Try a different search term or clear the category filter."}
      </p>
      <button
        onClick={clearFilters}
        className="btn-press sec-bg mt-2 rounded-full px-5 py-2 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_var(--sec-glow)]"
      >
        {page > 1 ? "Back to first page" : "Clear filters"}
      </button>
    </div>
  );

  const pager = !isLoading && visibleCount > 0 && (
    <PaginationBar
      page={page}
      lastPage={lastPage}
      total={total}
      pageSize={PAGE_SIZE}
      onPageChange={handlePage}
      busy={isPaging}
    />
  );

  return (
    <div className="min-h-screen" style={sectionThemeVars(section)}>
      <AuroraBackground />
      <Header />

      <main>
        <Hero query={query} onQuery={handleQuery} />
        <SectionTabs active={section} onChange={handleSection} />

        <div ref={resultsRef} className="scroll-mt-20">
          <CategoryChips
            key={section}
            categories={CATEGORY_OPTIONS[section]}
            active={category}
            onChange={handleCategory}
            sort={sort}
            onSort={handleSort}
          />

          <section className="mx-auto mt-8 max-w-7xl px-4 sm:px-6">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div className="min-w-0">
                <h2 className="font-display flex items-center gap-2.5 text-2xl font-bold text-primary-text sm:text-3xl">
                  <span
                    aria-hidden
                    className="sec-bg h-6 w-1.5 shrink-0 rounded-full"
                  />
                  {section === "menu" ? "Dishes" : activeSection.label}
                </h2>
                <p className="mt-1 text-sm text-secondary-text">
                  {activeSection.blurb}
                </p>
              </div>
              {isLoading ? (
                <Skeleton className="h-[26px] w-20 shrink-0 rounded-full" />
              ) : (
                <span className="sec-soft sec-text shrink-0 rounded-full px-3 py-1 text-xs font-semibold">
                  {total} {total === 1 ? "result" : "results"}
                </span>
              )}
            </div>

            {/* Places */}
            {section === "places" &&
              (isLoading ? (
                <ListingSkeletonGrid variant="profile" />
              ) : places.length > 0 ? (
                <div
                  key={gridKey}
                  className="section-swap grid grid-cols-1 gap-5 pb-6 sm:grid-cols-2 lg:grid-cols-3"
                >
                  {places.map((place, i) => (
                    <PlaceCard
                      key={place.id}
                      place={place}
                      index={i}
                      onOpen={openPlace}
                    />
                  ))}
                </div>
              ) : (
                emptyState
              ))}

            {/* Events */}
            {section === "events" &&
              (isLoading ? (
                <ListingSkeletonGrid />
              ) : events.length > 0 ? (
                <div
                  key={gridKey}
                  className="section-swap grid grid-cols-1 gap-5 pb-6 sm:grid-cols-2 lg:grid-cols-3"
                >
                  {events.map((event, i) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      index={i}
                      onOpen={openEvent}
                    />
                  ))}
                </div>
              ) : (
                emptyState
              ))}

            {/* Restaurants: a rail of dishes, then the kitchens behind them */}
            {section === "menu" && (
              <>
                {isLoading ? (
                  <DishRailSkeleton />
                ) : menuItems.length > 0 ? (
                  <Carousel
                    key={gridKey}
                    opts={{ align: "start", loop: true, dragFree: true }}
                    plugins={autoScroll}
                    className="section-swap"
                  >
                    <CarouselContent className="-ml-4 pb-2">
                      {menuItems.map((item, i) => (
                        <CarouselItem
                          key={item.id}
                          className="basis-[86%] pl-4 sm:basis-[56%] lg:basis-[38%] xl:basis-[29%]"
                        >
                          <DishCard
                            item={item}
                            index={i}
                            restaurantName={restaurantNames.get(item.userId)}
                            onOpen={openDish}
                          />
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <div className="mt-3 flex items-center justify-between">
                      <p className="flex items-center gap-1.5 text-xs text-secondary-text">
                        <UtensilsCrossed className="sec-text h-3.5 w-3.5" />
                        Tap a dish to order from its kitchen · drag to browse
                      </p>
                      <div className="hidden items-center gap-2 sm:flex">
                        <CarouselPrevious
                          variant="outline"
                          className="static h-9 w-9 translate-y-0 rounded-full"
                        />
                        <CarouselNext
                          variant="outline"
                          className="static h-9 w-9 translate-y-0 rounded-full"
                        />
                      </div>
                    </div>
                  </Carousel>
                ) : (
                  emptyState
                )}

                {pager}

                <div className="mb-5 mt-12 flex items-end justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="font-display flex items-center gap-2.5 text-2xl font-bold text-primary-text sm:text-3xl">
                      <span
                        aria-hidden
                        className="sec-bg h-6 w-1.5 shrink-0 rounded-full"
                      />
                      Restaurants
                    </h2>
                    <p className="mt-1 text-sm text-secondary-text">
                      Pick a kitchen, build your order, then pay in one go.
                    </p>
                  </div>
                  {restaurantsLoading ? (
                    <Skeleton className="h-[26px] w-24 shrink-0 rounded-full" />
                  ) : (
                    <span className="sec-soft sec-text flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold">
                      <Store className="h-3.5 w-3.5" />
                      {restaurants.length}{" "}
                      {restaurants.length === 1 ? "kitchen" : "kitchens"}
                    </span>
                  )}
                </div>

                {restaurantsLoading ? (
                  <RestaurantListSkeleton />
                ) : restaurants.length > 0 ? (
                  <div
                    key={`restaurants-${search}`}
                    className="section-swap grid gap-4 pb-6 lg:grid-cols-2"
                  >
                    {restaurants.map((restaurant, i) => (
                      <RestaurantCard
                        key={restaurant.id}
                        restaurant={restaurant}
                        index={i}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="section-swap flex flex-col items-center gap-3 rounded-3xl border border-dashed border-neutral-accent bg-white/60 py-14 text-center">
                    <span className="sec-soft sec-text grid h-14 w-14 place-items-center rounded-full">
                      <Store className="h-6 w-6" />
                    </span>
                    <p className="font-display text-lg font-semibold text-primary-text">
                      No kitchens match
                    </p>
                    <p className="max-w-xs text-sm text-secondary-text">
                      {search
                        ? "No restaurant serves a dish matching your search yet."
                        : "Restaurants appear here as soon as they publish a menu."}
                    </p>
                  </div>
                )}
              </>
            )}

            {section !== "menu" && pager}
          </section>
        </div>
      </main>

      <Footer />
      {/* <BottomNav active={section} onChange={handleSection} /> */}
    </div>
  );
}
