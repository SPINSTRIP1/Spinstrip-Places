/**
 * Placeholder restaurant reviews, shown until the menu service opens its
 * public reviews list. Delete this file once `useMenuReviews` reads the API.
 */

export interface PublicReview {
  id: string;
  name: string;
  stars: number;
  comment: string;
  /** ISO 8601 date-time. */
  createdAt: string;
}

const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString();

export const SAMPLE_REVIEWS: PublicReview[] = [
  {
    id: "sample-1",
    name: "Tolu A.",
    stars: 5,
    comment:
      "Food came out hot and quick, and the portions were generous. Ordering from the table with the QR code made it so easy.",
    createdAt: daysAgo(2),
  },
  {
    id: "sample-2",
    name: "Chinedu O.",
    stars: 4,
    comment:
      "Really tasty, especially the rice. Took a little longer than I expected on a Friday night, but the waiter kept us posted.",
    createdAt: daysAgo(5),
  },
  {
    id: "sample-3",
    name: "Amaka N.",
    stars: 5,
    comment: "My go-to spot for lunch now. Consistent every single time.",
    createdAt: daysAgo(9),
  },
  {
    id: "sample-4",
    name: "Ibrahim S.",
    stars: 3,
    comment:
      "Good flavour but a bit too spicy for me. Would be nice if the menu said how hot each dish is.",
    createdAt: daysAgo(16),
  },
  {
    id: "sample-5",
    name: "Funmi B.",
    stars: 5,
    comment: "Lovely staff and the drinks were spot on. Paying on my phone was painless.",
    createdAt: daysAgo(24),
  },
  {
    id: "sample-6",
    name: "David E.",
    stars: 4,
    comment: "Great value for the price. The small chops are a must.",
    createdAt: daysAgo(38),
  },
];
