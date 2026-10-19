/** In-app links between the public preview pages. */
export const placeHref = (placeId: string) => `/preview/places?id=${encodeURIComponent(placeId)}`;

export const facilityHref = (placeId: string, facilityId: string) =>
  `/preview/places/facility?place=${encodeURIComponent(placeId)}&id=${encodeURIComponent(facilityId)}`;

/** A restaurant's menu; `item` scrolls to and highlights that dish. */
export const restaurantHref = (merchantUserId: string, itemId?: string) =>
  `/restaurants/${encodeURIComponent(merchantUserId)}${itemId ? `?item=${encodeURIComponent(itemId)}` : ""}`;
