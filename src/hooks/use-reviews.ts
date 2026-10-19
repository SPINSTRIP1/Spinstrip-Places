import { useMutation } from "@tanstack/react-query";
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
  });
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
