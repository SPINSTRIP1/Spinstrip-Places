import { SERVER_URL, USER_ACCOUNT_URL } from "@/constants";
import api from "@/lib/api/axios-client";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import z from "zod";

export const ticketTierSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Tier name is required"),
  description: z.string().optional(),
  price: z.number().min(0, "Price must be positive"),
  quantityAvailable: z.number().min(1, "Quantity must be at least 1"),
  sortOrder: z.number().optional(),
});

export type TicketTier = z.infer<typeof ticketTierSchema>;
export const ticketSalesBreakdownSchema = z.object({
  ticketTierId: z.string(),
  ticketTierName: z.string(),
  status: z.string(),
  count: z.number(),
  totalAmount: z.string(),
});

export const eventSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Event name must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  frequency: z.enum(["ONE_OFF", "RECURRING"]),
  recurringPattern: z
    .enum(["WEEKLY", "BIWEEKLY", "MONTHLY", "CUSTOM"])
    .optional(),
  customRecurrenceDays: z.number().optional(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  timezone: z.string().min(1, "Timezone is required"),
  location: z.string().min(5, "Location is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  country: z.string().min(2, "Country is required"),
  contactPhone: z.string().min(10, "Invalid phone number"),
  contactEmail: z.string().email("Invalid email format"),
  expectedGuests: z.number().min(1, "Expected guests must be at least 1"),
  soldOutThreshold: z.number().optional(),
  isFeatured: z.boolean().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "DRAFT"]).optional(),
  dealId: z.string().optional(),
  formId: z.string().optional(),
  placeId: z.string().optional(),
  ticketTiers: z.array(ticketTierSchema).optional(),
  files: z
    .array(z.instanceof(File))
    .min(1, "At least one image file is required"),
  images: z.array(z.string()).optional(),
  totalImpressions: z.number().optional(),
  totalTransactions: z.number().optional(),
  ticketSalesBreakdown: z.array(ticketSalesBreakdownSchema).optional(),
  dropOffRate: z.number().optional(),
  tagline: z.string().optional(),
  // coverImageUrl: z.string().optional(),
});

export type Event = z.infer<typeof eventSchema>;

export interface EventStatsResponse {
  total: number;
  active: number;
  inactive: number;
  upcoming: number;
  past: number;
}

export interface PublicTicketTier {
  id: string;
  name: string;
  description: string;
  price: number;
  quantityAvailable: number;
}

export interface PublicEvent {
  id: string;
  name: string;
  description: string;
  city: string;
  state: string;
  country: string;
  location: string;
  contactEmail: string;
  contactPhone: string;
  startDate: string;
  endDate: string;
  timezone: string;
  frequency: "ONE_OFF" | "RECURRING";
  recurringPattern: string | null;
  customRecurrenceDays: number | null;
  images: string[];
  videos: string[] | null;
  expectedGuests: number;
  soldOutThreshold: number;
  status: "ACTIVE" | "INACTIVE" | "DRAFT";
  isFeatured: boolean;
  impressions: number;
  totalImpressions: number;
  totalRegistrations: number;
  ticketTiers: PublicTicketTier[];
  userId: string;
  placeId: string | null;
  dealId: string | null;
  formId: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

/**
 * Fetches a single event (with ticket tiers, impressions and sales
 * breakdown) from `GET /events/{id}`.
 */
export function useEvent(eventId: string | null | undefined) {
  const { data, isLoading, error, refetch } = useQuery<Event | null>({
    queryKey: ["single-event", eventId],
    queryFn: async () => {
      try {
        const response = await api.get(`${SERVER_URL}/events/${eventId}`);
        return response.data.data ?? null;
      } catch (error) {
        console.log("Error fetching event:", error);
        return null;
      }
    },
    enabled: !!eventId,
  });

  return {
    event: data ?? null,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Fetches the merchant's event counts (total/active/inactive/upcoming/past)
 * from `GET /events/stats`.
 */
export function useEventStats() {
  const { data, isLoading, error, refetch } = useQuery<EventStatsResponse>({
    queryKey: ["events-stats"],
    queryFn: async () => {
      try {
        const response = await api.get(SERVER_URL + "/events/stats");
        return response.data.data as EventStatsResponse;
      } catch (error) {
        console.log("Error fetching event stats:", error);
        toast.error("Failed to fetch event statistics.");
        return { total: 0, active: 0, inactive: 0, upcoming: 0, past: 0 };
      }
    },
  });

  return {
    stats: data,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Fetches a public event (unauthenticated preview/checkout pages)
 * from `GET /events/public/{id}`.
 */
export function usePublicEvent(eventId: string | null | undefined) {
  const { data, isLoading, error, refetch } = useQuery<PublicEvent | null>({
    queryKey: ["public-event", eventId],
    queryFn: async () => {
      try {
        const response = await api.get(
          `${SERVER_URL}/events/public/${eventId}`,
        );
        return response.data.data ?? null;
      } catch (error) {
        console.log("Error fetching public event:", error);
        return null;
      }
    },
    enabled: !!eventId,
  });

  return {
    event: data ?? null,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Query params accepted by `GET /events/public`.
 */
export interface PublicEventsFilter {
  status?: string;
  frequency?: string;
  isFeatured?: boolean;
  search?: string;
  city?: string;
  placeId?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface PublicEventPrice {
  currency: string;
  amount: number;
}

export interface PublicEventListTicketTier
  extends Omit<PublicTicketTier, "price"> {
  eventId: string;
  price: PublicEventPrice;
  quantitySold: number;
  sortOrder: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface PublicEventListItem
  extends Omit<PublicEvent, "ticketTiers" | "deletedAt"> {
  ticketTiers: PublicEventListTicketTier[];
}

export interface PublicEventsResponse {
  success: boolean;
  message: string;
  data: {
    data: PublicEventListItem[];
    count: number;
    currentpage: number;
    nextpage: number | null;
    prevpage: number | null;
    lastpage: number;
  };
}

/**
 * Fetches public events with optional filtering/pagination
 * from `GET /events/public`.
 */
export function usePublicEvents(
  filters?: PublicEventsFilter,
  options?: { enabled?: boolean },
) {
  const { data, isLoading, isFetching, error, refetch } = useQuery<
    PublicEventsResponse["data"]
  >({
    queryKey: ["public-events", filters],
    queryFn: async () => {
      const empty = {
        data: [],
        count: 0,
        currentpage: 1,
        nextpage: null,
        prevpage: null,
        lastpage: 1,
      };

      try {
        const params = new URLSearchParams();

        if (filters?.status) params.append("status", filters.status);
        if (filters?.frequency) params.append("frequency", filters.frequency);
        if (filters?.isFeatured !== undefined)
          params.append("isFeatured", String(filters.isFeatured));
        if (filters?.search) params.append("search", filters.search);
        if (filters?.city) params.append("city", filters.city);
        if (filters?.placeId) params.append("placeId", filters.placeId);
        if (filters?.sortBy) params.append("sortBy", filters.sortBy);
        if (filters?.sortOrder) params.append("sortOrder", filters.sortOrder);
        if (filters?.page !== undefined)
          params.append("page", String(filters.page));
        if (filters?.limit !== undefined)
          params.append("limit", String(filters.limit));

        const url = `${USER_ACCOUNT_URL}/events/public${params.toString() ? `?${params.toString()}` : ""}`;
        const response = await api.get(url);

        return response.data.data ?? empty;
      } catch (error) {
        console.log("Error fetching public events:", error);
        return empty;
      }
    },
    enabled: options?.enabled ?? true,
  });

  return {
    events: data?.data ?? [],
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
