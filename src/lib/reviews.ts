/**
 * Guest reviews. Each service decides who may review — a completed visit
 * (places), a completed ticket purchase (events) or a confirmed order (menu)
 * — by matching the email on the review to the one used at checkout. There is
 * no public list of reviews yet, so the storefront only collects them.
 */

export type ReviewTarget =
  | { kind: "place"; id: string }
  | { kind: "event"; id: string }
  /** Menu reviews are per merchant, so `id` is the merchant's user id. */
  | { kind: "menu"; id: string };

/** What the success page needs after a payment round-trip: the thing booked and the checkout email. */
export interface ReviewContext {
  kind: ReviewTarget["kind"];
  id: string;
  name: string;
  email: string;
}

const CONTEXT_KEY = "spinstrip:review-context";
const reviewedKey = (target: ReviewTarget) => `spinstrip:reviewed:${target.kind}:${target.id}`;

/** Called by the checkouts just before handing off to the payment page. */
export function saveReviewContext(context: ReviewContext) {
  try {
    sessionStorage.setItem(CONTEXT_KEY, JSON.stringify(context));
  } catch {
    // Storage can be blocked (private mode); the success page just won't prompt.
  }
}

export function readReviewContext(kind: ReviewContext["kind"]): ReviewContext | null {
  try {
    const raw = sessionStorage.getItem(CONTEXT_KEY);
    const context = raw ? (JSON.parse(raw) as ReviewContext) : null;
    return context?.kind === kind && context.id ? context : null;
  } catch {
    return null;
  }
}

/** This phone's review, so a reload shows "You rated" instead of the form again (the API has no such flag). */
export interface MyReview {
  stars: number;
  comment?: string;
}

export function getMyReview(target: ReviewTarget): MyReview | null {
  try {
    const raw = localStorage.getItem(reviewedKey(target));
    return raw ? (JSON.parse(raw) as MyReview) : null;
  } catch {
    return null;
  }
}

export function setMyReview(target: ReviewTarget, review: MyReview) {
  try {
    localStorage.setItem(reviewedKey(target), JSON.stringify(review));
  } catch {
    // Not critical — the form simply shows again after a reload.
  }
}
