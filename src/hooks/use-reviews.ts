import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { EVENTS_SERVER_URL, MENU_API_URL, PLACES_API_URL } from "@/constants";
import apiClient from "@/lib/api/axios-client";
import { handleAxiosError } from "@/lib/api/handle-axios-error";
import type { ReviewTarget } from "@/lib/reviews";

export interface ReviewInput {
  stars: number;
  comment?: string;
  /** The email used at checkout — the services check it against the booking / ticket / order. */
  email: string;
}

/**
 * Posts a guest review straight to the owning service (the gateway requires
 * a signed-in user for this):
 *   POST /places/{placeId}/reviews   POST /events/{eventId}/reviews   POST /menu/reviews
 */
export function useSubmitReview(target: ReviewTarget) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ stars, comment, email }: ReviewInput) => {
      const note = comment?.trim();
      const body = { stars, email: email.trim().toLowerCase(), ...(note ? { comment: note } : {}) };
      if (target.kind === "place") {
        await apiClient.post(`${PLACES_API_URL}/places/${target.id}/reviews`, body);
      } else if (target.kind === "event") {
        await apiClient.post(`${EVENTS_SERVER_URL}/events/${target.id}/reviews`, body);
      } else {
        await apiClient.post(`${MENU_API_URL}/menu/reviews`, { ...body, merchantUserId: target.id });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: reviewsKey(target) }),
  });
}

/** A review as the public lists return it. Reviewer identity is never included. */
export interface PublicReview {
  id: string;
  stars: number;
  comment?: string | null;
  /** ISO 8601 date-time. */
  createdAt: string;
}

interface ReviewPage {
  data: PublicReview[];
  count: number;
  nextpage: number | null;
}

const reviewsKey = (target: ReviewTarget) => ["public-reviews", target.kind, target.id];

function reviewsUrl(target: ReviewTarget, page: number) {
  const query = `page=${page}&limit=${REVIEW_PAGE_SIZE}`;
  if (target.kind === "place") return `${PLACES_API_URL}/places/public/${target.id}/reviews?${query}`;
  if (target.kind === "event") return `${EVENTS_SERVER_URL}/events/public/${target.id}/reviews?${query}`;
  return `${MENU_API_URL}/menu/public/reviews?merchantUserId=${target.id}&${query}`;
}

/** The lists cap `limit` at 100. */
const REVIEW_PAGE_SIZE = 100;
/** Stop after this many pages so a very popular listing can't stall the page. */
const MAX_REVIEW_PAGES = 5;

/**
 * Public reviews, newest first, from the unauthenticated lists:
 *   GET /places/public/{placeId}/reviews   GET /events/public/{eventId}/reviews
 *   GET /menu/public/reviews?merchantUserId=
 * The API returns no average, so pages are read until the end (up to
 * MAX_REVIEW_PAGES) and the summary is worked out here. `count` is the
 * server's total, which can exceed `reviews.length` past that cap.
 */
export function usePublicReviews(target: ReviewTarget | null) {
  const { data, isLoading, error } = useQuery({
    queryKey: target ? reviewsKey(target) : ["public-reviews", "none"],
    queryFn: async () => {
      const reviews: PublicReview[] = [];
      let count = 0;
      let page: number | null = 1;
      for (let read = 0; page && read < MAX_REVIEW_PAGES; read++) {
        const response = await apiClient.get(reviewsUrl(target!, page));
        const body = response.data.data as ReviewPage;
        reviews.push(...(body.data ?? []));
        count = body.count ?? reviews.length;
        page = body.nextpage;
      }
      return { reviews, count };
    },
    enabled: !!target?.id,
  });

  const reviews = data?.reviews ?? [];
  const average = reviews.length
    ? reviews.reduce((sum, review) => sum + review.stars, 0) / reviews.length
    : 0;

  return { reviews, count: data?.count ?? 0, average, isLoading, error };
}

const NOT_ELIGIBLE: Record<ReviewTarget["kind"], string> = {
  place: "Reviews open after your visit. Use the email you booked with.",
  event: "Only ticket holders can review this event. Use the email you bought your ticket with.",
  menu: "Reviews open once you've had a paid order here. Use the email you ordered with.",
};

/** A friendly reason a review was turned down. */
export function reviewErrorMessage(kind: ReviewTarget["kind"], error: unknown) {
  const status = (error as AxiosError)?.response?.status;
  if (status === 403) return NOT_ELIGIBLE[kind];
  return handleAxiosError(error as AxiosError);
}
