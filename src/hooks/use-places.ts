import { SERVER_URL, PLACES_API_URL } from "@/constants";
import api from "@/lib/api/axios-client";
import { useQuery } from "@tanstack/react-query";
import z from "zod";

// Fee tier schema for facilities
export const feeTierSchema = z.object({
  name: z.string().min(2, "Tier name is required"),
  amount: z.number().min(0, "Amount must be positive"),
  description: z.string().optional(),
});

export type FeeTier = z.infer<typeof feeTierSchema>;

// Facility schema
export const facilitySchema = z.object({
  id: z.string().optional(),
  placeId: z.string().min(1, "Place ID is required"),
  name: z.string().min(2, "Facility name must be at least 2 characters"),
  facilityCategory: z.string().min(2, "Facility category is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  fees: z.array(feeTierSchema),
  files: z.array(z.instanceof(File)).optional(),
  accessType: z.enum(["OPEN", "PRICED"]).optional(),
  isGated: z.boolean().optional(),
  images: z.array(z.string()).optional(),
});

export type Facility = z.infer<typeof facilitySchema>;

// Place schema
export const placeSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Place name must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  address: z.string().min(5, "Address is required"),
  landmarks: z.string().optional(),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  country: z.string().min(2, "Country is required"),
  longitude: z.number(),
  latitude: z.number(),
  placeType: z.enum([
    "HOTEL",
    "SHORT_LET",
    "BEACH_RESORT",
    "RECREATION_CENTER",
    "BUSINESS_HUB",
    "STADIUM",
    "SPORT_FACILITY",
    "COUNTRY_CLUB",
    "SPORT_RECREATION_CLUB",
    "HOSPITAL",
    "CLINIC",
    "PHARMACY",
    "SPA_WELLNESS_CENTER",
    "GYM",
    "STUDIO",
    "AIRPORT",
    "RAIL_STATION",
    "ROAD_TRANSPORT_HUB",
    "WATER_TRANSPORT_HUB",
    "RELIGIOUS_CENTRE",
    "POLICE_STATION",
    "COURT",
    "MILITARY_BARRACKS",
    "BANK",
    "STRIP_CLUB",
  ]),
  emails: z
    .array(z.email("Invalid email format"))
    .min(1, "At least one email is required"),
  phoneNumbers: z
    .array(z.string().min(10, "Invalid phone number"))
    .min(1, "At least one phone number is required"),
  environmentalSafetyPolicy: z.instanceof(File).optional().nullable(),
  privacyPolicy: z.instanceof(File).optional().nullable(),
  disclaimers: z.instanceof(File).optional().nullable(),
  ownershipDocument: z.instanceof(File).optional().nullable(),
  ownershipVideo: z.instanceof(File).optional().nullable(),
  status: z.enum(["PUBLISHED", "UNPUBLISHED", "DRAFT", "REJECTED"]).optional(),
  website: z.string().optional(),
  facilities: z.array(facilitySchema).optional(),
  coverImage: z.instanceof(File, { message: "Please upload a cover image" }),
  disclaimersUrl: z.string().optional(),
  environmentalSafetyPolicyUrl: z.string().optional(),
  ownershipDocumentUrl: z.string().optional(),
  ownershipVideoUrl: z.string().optional(),
  privacyPolicyUrl: z.string().optional(),
  userId: z.string().optional(),
  rejectionReason: z.string().optional(),
  operatingHours: z
    .object({
      schedule: z.array(
        z.object({
          day: z.string(),
          isOpen: z.boolean(),
          openingTime: z.string(),
          closingTime: z.string(),
        }),
      ),
      holidays: z.array(
        z.object({
          name: z.string(),
          date: z.string(),
          isRecurring: z.boolean(),
          isOpen: z.boolean(),
          openingTime: z.string(),
          closingTime: z.string(),
        }),
      ),
    })
    .optional(),
  views: z.number().optional(),
  metadata: z
    .object({
      amenities: z.string(),
      rating: z.string(),
      category: z.string(),
    })
    .optional(),
});

export type Place = z.infer<typeof placeSchema>;
export interface SinglePlace extends Omit<Place, "coverImage"> {
  coverImage: string;
  stats: {
    visitors: number;
    facilities: number;
    revenue: number;
    sales: number;
    reservations: number;
  };
}

export interface PublicPlace extends Omit<Place, "coverImage"> {
  coverImage: string;
  images: string[];
}

/**
 * Fetches a single merchant place (with stats) from `GET /places/{id}`.
 */
export function usePlace(placeId: string | null | undefined) {
  const { data, isLoading, error, refetch } = useQuery<SinglePlace | null>({
    queryKey: ["single-place", placeId],
    queryFn: async () => {
      try {
        const response = await api.get(`${SERVER_URL}/places/${placeId}`);
        return response.data.data ?? null;
      } catch (error) {
        console.log("Error fetching place:", error);
        return null;
      }
    },
    enabled: !!placeId,
  });

  return {
    place: data ?? null,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Fetches a place's facilities from `GET /places/{id}/facilities`.
 */
export function usePlaceFacilities(placeId: string | null | undefined) {
  const { data, isLoading, error, refetch } = useQuery<Facility[]>({
    queryKey: ["place-facility", placeId],
    queryFn: async () => {
      try {
        const response = await api.get(
          `${SERVER_URL}/places/${placeId}/facilities`,
        );
        return response.data.data.facilities ?? [];
      } catch (error) {
        console.log("Error fetching facilities:", error);
        return [];
      }
    },
    enabled: !!placeId,
  });

  return {
    facilities: data ?? [],
    isLoading,
    error,
    refetch,
  };
}

/**
 * Fetches a public place (unauthenticated preview/checkout pages)
 * from `GET /places/public/{id}`.
 */
export function usePublicPlace(placeId: string | null | undefined) {
  const { data, isLoading, error, refetch } = useQuery<PublicPlace | null>({
    queryKey: ["public-place", placeId],
    queryFn: async () => {
      try {
        const response = await api.get(
          `${SERVER_URL}/places/public/${placeId}`,
        );
        return response.data.data ?? null;
      } catch (error) {
        console.log("Error fetching public place:", error);
        return null;
      }
    },
    enabled: !!placeId,
  });

  return {
    place: data ?? null,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Fetches public places with optional filtering
 * from `GET /places/public`.
 */
export interface PublicPlacesFilter {
  placeType?: string;
  accessModel?: string;
  status?: string;
  city?: string;
  state?: string;
  country?: string;
  search?: string;
  isPublished?: boolean;
  latitude?: number;
  longitude?: number;
  radius?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface PublicPlacesResponse {
  status: string;
  message: string;
  data: {
    data: PublicPlace[];
    count: number;
    currentpage: number;
    nextpage: number | null;
    prevpage: number | null;
    lastpage: number;
  };
}

const EMPTY_PLACES_PAGE: PublicPlacesResponse["data"] = {
  data: [],
  count: 0,
  currentpage: 1,
  nextpage: null,
  prevpage: null,
  lastpage: 1,
};

export function usePublicPlaces(
  filters?: PublicPlacesFilter,
  options?: { enabled?: boolean },
) {
  const { data, isLoading, isFetching, error, refetch } = useQuery<
    PublicPlacesResponse["data"]
  >({
    queryKey: ["public-places", filters],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();

        if (filters?.placeType) params.append("placeType", filters.placeType);
        if (filters?.accessModel)
          params.append("accessModel", filters.accessModel);
        if (filters?.status) params.append("status", filters.status);
        if (filters?.city) params.append("city", filters.city);
        if (filters?.state) params.append("state", filters.state);
        if (filters?.country) params.append("country", filters.country);
        if (filters?.search) params.append("search", filters.search);
        if (filters?.isPublished !== undefined)
          params.append("isPublished", String(filters.isPublished));
        if (filters?.latitude !== undefined)
          params.append("latitude", String(filters.latitude));
        if (filters?.longitude !== undefined)
          params.append("longitude", String(filters.longitude));
        if (filters?.radius !== undefined)
          params.append("radius", String(filters.radius));
        if (filters?.sortBy) params.append("sortBy", filters.sortBy);
        if (filters?.sortOrder) params.append("sortOrder", filters.sortOrder);
        if (filters?.page !== undefined)
          params.append("page", String(filters.page));
        if (filters?.limit !== undefined)
          params.append("limit", String(filters.limit));

        const url = `${PLACES_API_URL}/places/public${params.toString() ? `?${params.toString()}` : ""}`;
        const response = await api.get(url);

        return response.data.data ?? EMPTY_PLACES_PAGE;
      } catch (error) {
        console.log("Error fetching public places:", error);
        return EMPTY_PLACES_PAGE;
      }
    },
    enabled: options?.enabled ?? true,
  });

  return {
    places: data?.data ?? [],
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
