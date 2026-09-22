import { useMemo } from "react";
import {
  isMenuItemOrderable,
  usePublicMenu,
  type PublicMenuItem,
} from "@/hooks/use-menu";
import { usePublicPlaces, type PublicPlace } from "@/hooks/use-places";
import { formatEnumLabel, monogramFor } from "@/utils";

/**
 * A restaurant as the storefront understands it.
 *
 * The menu service has no restaurant entity — every dish only carries the
 * merchant's `userId`. A restaurant is therefore *derived*: the set of public
 * dishes that share a merchant, enriched with that merchant's published place
 * (name, logo, address, hours) when one exists. Merchants without a place
 * fall back to a generated "Kitchen XXXX" name; that only improves once the
 * backend exposes a merchant profile.
 */
export interface RestaurantProfile {
  /** The merchant user id — also the route param and the order's `merchantUserId`. */
  id: string;
  name: string;
  /** Whether `name` came from a real place record or was generated. */
  isNamed: boolean;
  monogram: string;
  logo: string | null;
  /** Best available hero image: place cover, else the first dish photo. */
  cover: string | null;
  location: string | null;
  place: PublicPlace | null;
  /** Human-readable cuisine/category labels, most common first. */
  categories: string[];
  items: PublicMenuItem[];
  dishCount: number;
  orderableCount: number;
  minPrice: number | null;
  /** Featured or tagged dishes, for "popular" rails. */
  highlights: PublicMenuItem[];
}

/** Server pages cap at 100 — enough for today's catalogue, revisit when it grows. */
const CATALOGUE_LIMIT = 100;

export function buildRestaurantProfile(
  merchantId: string,
  items: PublicMenuItem[],
  places: PublicPlace[],
): RestaurantProfile {
  const visible = items.filter(
    (item) => item.userId === merchantId && !item.isHidden,
  );
  const place =
    places.find((candidate) => candidate.userId === merchantId) ?? null;

  const name = place?.name?.trim() || `Kitchen ${merchantId.slice(0, 4).toUpperCase()}`;

  const categoryCounts = new Map<string, number>();
  for (const item of visible) {
    const label = formatEnumLabel(item.category) || "Other";
    categoryCounts.set(label, (categoryCounts.get(label) ?? 0) + 1);
  }
  const categories = [...categoryCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label]) => label);

  const prices = visible
    .map((item) => parseFloat(item.price))
    .filter((price) => !Number.isNaN(price) && price > 0);

  const firstPhoto =
    visible.find((item) => item.images?.length)?.images?.[0] ?? null;

  const highlights = visible.filter(
    (item) => isMenuItemOrderable(item) && (item.isFeatured || item.tag),
  );

  return {
    id: merchantId,
    name,
    isNamed: !!place?.name,
    monogram: monogramFor(name),
    logo: place?.metadata?.logoUrl ?? null,
    cover: place?.coverImage || place?.images?.[0] || firstPhoto,
    location: place
      ? [place.city, place.state].filter(Boolean).join(", ") ||
        place.address ||
        null
      : null,
    place,
    categories,
    items: visible,
    dishCount: visible.length,
    orderableCount: visible.filter(isMenuItemOrderable).length,
    minPrice: prices.length ? Math.min(...prices) : null,
    highlights,
  };
}

/** Published places, fetched once and shared by every restaurant lookup. */
function usePlaceDirectory(enabled: boolean) {
  return usePublicPlaces(
    { status: "PUBLISHED", limit: CATALOGUE_LIMIT },
    { enabled },
  );
}

/**
 * Every restaurant with at least one public dish, newest kitchens first.
 * `search` matches dish names/descriptions server-side, so a search for
 * "jollof" returns only the kitchens that serve it.
 */
export function useRestaurants(
  filters?: { search?: string },
  options?: { enabled?: boolean },
) {
  const enabled = options?.enabled ?? true;
  const menu = usePublicMenu(
    {
      search: filters?.search || undefined,
      limit: CATALOGUE_LIMIT,
      sortBy: "createdAt",
      sortOrder: "desc",
    },
    { enabled },
  );
  const directory = usePlaceDirectory(enabled);

  const restaurants = useMemo(() => {
    const merchantIds: string[] = [];
    for (const item of menu.menuItems) {
      if (!item.isHidden && !merchantIds.includes(item.userId)) {
        merchantIds.push(item.userId);
      }
    }
    return merchantIds.map((id) =>
      buildRestaurantProfile(id, menu.menuItems, directory.places),
    );
  }, [menu.menuItems, directory.places]);

  return {
    restaurants,
    // The list is usable as soon as the dishes arrive; place details fill in
    // when the directory lands, without blocking the section.
    isLoading: menu.isLoading,
    isFetching: menu.isFetching || directory.isFetching,
    refetch: menu.refetch,
  };
}

/** One restaurant and its full menu, for the storefront page. */
export function useRestaurant(merchantId: string | null | undefined) {
  const menu = usePublicMenu(
    { userId: merchantId ?? undefined, limit: CATALOGUE_LIMIT },
    { enabled: !!merchantId },
  );
  const directory = usePlaceDirectory(!!merchantId);

  const restaurant = useMemo(() => {
    if (!merchantId || menu.isLoading) return null;
    const profile = buildRestaurantProfile(
      merchantId,
      menu.menuItems,
      directory.places,
    );
    return profile.dishCount > 0 ? profile : null;
  }, [merchantId, menu.menuItems, menu.isLoading, directory.places]);

  return {
    restaurant,
    isLoading: menu.isLoading,
    isPlaceLoading: directory.isLoading,
    error: menu.error,
    refetch: menu.refetch,
  };
}
