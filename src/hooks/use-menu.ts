import { USER_ACCOUNT_URL } from "@/constants";
import api from "@/lib/api/axios-client";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

export interface MenuItemOption {
  name: string;
  price: number;
}

export interface MenuItemNutritionAllergen {
  name: string;
  type: string;
}

export interface MenuItemAvailabilitySchedule {
  days: string[];
  startTime: string;
  endTime: string;
}

export interface PublicMenuItem {
  id: string;
  userId: string;
  code: string;
  name: string;
  description: string;
  /** The API returns price as a string, e.g. "4000". */
  price: string;
  quantity: number;
  category: string;
  status: "AVAILABLE" | "PENDING" | "UNAVAILABLE";
  tag: string | null;
  isFeatured: boolean;
  images: string[];
  availabilityType:
    | "ALWAYS_AVAILABLE"
    | "ON_DEMAND"
    | "SPECIFIC_DAYS_TIME"
    | string;
  availabilitySchedule: MenuItemAvailabilitySchedule;
  nutritionAllergens: MenuItemNutritionAllergen[];
  addOns: MenuItemOption[];
  sizeOptions: string[];
  extras: MenuItemOption[];
  dealId: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  isHidden: boolean;
}

/**
 * Query params accepted by `GET /menu/public`.
 */
export interface PublicMenuFilter {
  page?: number;
  /** Server caps this at 100. */
  limit?: number;
  search?: string;
  category?: string;
  sortBy?: "createdAt" | "updatedAt" | "name" | "price" | string;
  sortOrder?: "asc" | "desc";
}

export interface PublicMenuResponse {
  status: string;
  message: string;
  data: {
    data: PublicMenuItem[];
    count: number;
    currentpage: number;
    nextpage: number | null;
    prevpage: number | null;
    lastpage: number;
  };
}

const EMPTY_PAGE: PublicMenuResponse["data"] = {
  data: [],
  count: 0,
  currentpage: 1,
  nextpage: null,
  prevpage: null,
  lastpage: 1,
};

/**
 * Fetches public menu items with optional filtering/pagination
 * from `GET /menu/public`.
 */
export function usePublicMenu(
  filters?: PublicMenuFilter,
  options?: { enabled?: boolean },
) {
  const { data, isLoading, isFetching, error, refetch } = useQuery<
    PublicMenuResponse["data"]
  >({
    queryKey: ["public-menu", filters],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();

        if (filters?.page !== undefined)
          params.append("page", String(filters.page));
        if (filters?.limit !== undefined)
          params.append("limit", String(filters.limit));
        if (filters?.search) params.append("search", filters.search);
        if (filters?.category) params.append("category", filters.category);
        if (filters?.sortBy) params.append("sortBy", filters.sortBy);
        if (filters?.sortOrder) params.append("sortOrder", filters.sortOrder);

        const url = `${USER_ACCOUNT_URL}/menu/public${params.toString() ? `?${params.toString()}` : ""}`;
        const response = await api.get(url);

        return response.data.data ?? EMPTY_PAGE;
      } catch (error) {
        console.log("Error fetching public menu:", error);
        return EMPTY_PAGE;
      }
    },
    enabled: options?.enabled ?? true,
    // Paging keeps the current page on screen while the next one
    // loads, so the grid never collapses back to skeletons.
    placeholderData: keepPreviousData,
  });

  return {
    menuItems: data?.data ?? [],
    count: data?.count ?? 0,
    currentPage: data?.currentpage ?? 1,
    lastPage: data?.lastpage ?? 1,
    nextPage: data?.nextpage ?? null,
    prevPage: data?.prevpage ?? null,
    isLoading,
    isFetching,
    error,
    refetch,
  };
}

/**
 * Fetches a single public menu item from `GET /menu/public/{id}`.
 */
export function usePublicMenuItem(itemId: string | null | undefined) {
  const { data, isLoading, error, refetch } = useQuery<PublicMenuItem | null>({
    queryKey: ["public-menu-item", itemId],
    queryFn: async () => {
      try {
        const response = await api.get(`${USER_ACCOUNT_URL}/menu/public/${itemId}`);
        return response.data.data ?? null;
      } catch (error) {
        console.log("Error fetching public menu item:", error);
        return null;
      }
    },
    enabled: !!itemId,
  });

  return {
    menuItem: data ?? null,
    isLoading,
    error,
    refetch,
  };
}
