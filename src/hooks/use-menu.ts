import { MENU_API_URL } from "@/constants";
import api from "@/lib/api/axios-client";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

export interface MenuItemOption {
  name: string;
  price: number;
}

export interface MenuItemNutritionAllergen {
  name: string;
  type?: string;
}

export interface MenuItemAvailabilitySchedule {
  days: string[];
  startTime: string;
  endTime: string;
}

export interface PublicMenuItem {
  id: string;
  /** The merchant that owns the item. Orders are placed per merchant. */
  userId: string;
  code: string;
  name: string;
  description: string;
  /** The API returns price as a string, e.g. "4000". */
  price: string;
  /** Portions left. `null` means the merchant doesn't track stock. */
  quantity: number | null;
  category: string;
  status: "AVAILABLE" | "PENDING" | "UNAVAILABLE" | "DRAFT";
  tag: string | null;
  isFeatured: boolean;
  images: string[] | null;
  availabilityType:
    | "ALWAYS_AVAILABLE"
    | "ON_DEMAND"
    | "SPECIFIC_DAYS_TIME"
    | "OTHER"
    | string;
  availabilitySchedule: MenuItemAvailabilitySchedule | null;
  nutritionAllergens: MenuItemNutritionAllergen[] | null;
  addOns: MenuItemOption[] | null;
  sizeOptions: string[] | null;
  extras: MenuItemOption[] | null;
  dealId: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  isHidden: boolean;
}

/**
 * Query params accepted by `GET /menu/public/menu-items`.
 */
export interface PublicMenuFilter {
  page?: number;
  /** Server caps this at 100. */
  limit?: number;
  search?: string;
  category?: string;
  sortBy?: "createdAt" | "updatedAt" | "name" | "price" | string;
  sortOrder?: "asc" | "desc";
  /** Merchant that owns the menu. Omit to list across restaurants. */
  userId?: string;
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
 * from `GET /menu/public/menu-items`.
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
        if (filters?.userId) params.append("userId", filters.userId);

        const url = `${MENU_API_URL}/menu/public/menu-items${params.toString() ? `?${params.toString()}` : ""}`;
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
 * Loads one public menu item plus the rest of its merchant's menu.
 *
 * The menu service has no public single-item endpoint, so this reads the
 * merchant's menu (`userId` filter, max page size) and picks the item out.
 * The full menu is returned too — an order can hold several items, as long
 * as they all belong to the same merchant.
 */
export function usePublicMenuItem(
  itemId: string | null | undefined,
  merchantId: string | null | undefined,
) {
  const { menuItems, isLoading, error, refetch } = usePublicMenu(
    { userId: merchantId ?? undefined, limit: 100 },
    { enabled: !!itemId && !!merchantId },
  );

  return {
    menuItem: menuItems.find((item) => item.id === itemId) ?? null,
    merchantMenu: menuItems,
    isLoading,
    error,
    refetch,
  };
}

/** Whether a customer can add this item to an order right now. */
export function isMenuItemOrderable(item: PublicMenuItem) {
  return (
    item.status === "AVAILABLE" && (item.quantity === null || item.quantity > 0)
  );
}

export type MenuPaymentMethod = "PAYSTACK" | "LEDGER_BLOCK";

/** Body of `POST /menu/public/orders`. The server reprices every line. */
export interface CreateMenuOrderPayload {
  merchantUserId: string;
  restaurantName?: string;
  customerName: string;
  email: string;
  phone: string;
  userId?: string;
  paymentMethod: MenuPaymentMethod;
  callbackUrl?: string;
  items: { menuItemId: string; quantity: number }[];
}

/**
 * The docs don't publish a response schema for order creation, so the
 * fields the checkout reads are optional and probed defensively (the same
 * approach as the places booking response).
 */
export interface CreateMenuOrderResponse {
  status: string;
  message: string;
  data: {
    id?: string;
    orderId?: string;
    reference?: string;
    authorizationUrl?: string;
    totalAmount?: string | number;
    payment?: {
      authorizationUrl?: string;
      accessCode?: string;
      reference?: string;
    };
    order?: { id?: string; reference?: string };
  } | null;
}

export interface VerifyMenuPaymentResponse {
  status: string;
  message: string;
  data: {
    reference?: string;
    status?: string;
    paymentStatus?: string;
    orderId?: string;
    amount?: string | number;
    totalAmount?: string | number;
  } | null;
}
