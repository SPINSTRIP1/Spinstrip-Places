import { FALLBACK_IMAGE, PLACE_TYPES } from "@/constants";

// Security utility functions (same as your auth manager)
export const encrypt = (text: string): string => {
  try {
    const salt = "spinstrip2024";
    const combined = salt + text + salt;
    return btoa(combined);
  } catch (error) {
    console.error("Encryption error:", error);
    return text;
  }
};

export const decrypt = (encrypted: string): string => {
  try {
    const decoded = atob(encrypted);
    const salt = "spinstrip2024";
    return decoded.slice(salt.length, -salt.length);
  } catch (error) {
    console.error("Decryption error:", error);
    return encrypted;
  }
};

// Format amount to Nigerian Naira
export const formatAmount = (amount: number | string): string => {
  const numericAmount =
    typeof amount === "string" ? parseFloat(amount) : amount;
  return `₦${numericAmount.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

// Format ISO date string to DD/MM/YYYY
export const formatISODate = (isoString: string): string => {
  const date = new Date(isoString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

// Format ISO date string to YYYY-MM-DD for date inputs
export const formatDateForInput = (isoString: string): string => {
  if (!isoString) return "";
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Format ISO date string to "31 Dec 2025" format
export const formatDateDisplay = (isoString: string): string => {
  if (!isoString) return "";
  const date = new Date(isoString);
  const day = date.getDate();
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

export const capitalizeFirstLetter = (str: string | undefined): string => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Turns a server enum value ("SHORT_LET") into a display label
 * ("Short Let").
 */
export const formatEnumLabel = (value: string | undefined): string => {
  if (!value) return "";
  return value
    .split("_")
    .map((part) => capitalizeFirstLetter(part))
    .join(" ");
};

/**
 * Transform API PublicPlace to Listing format for HomeView
 */
export const transformPlaceToListing = (
  place: any,
): import("@/data/listings").Listing => {
  const location = place.city
    ? `${place.city}${place.state ? ", " + place.state : ""}`
    : place.address || undefined;

  const placeTypeLabel =
    PLACE_TYPES.find((type) => type.value === place.placeType)?.label ??
    formatEnumLabel(place.placeType);

  const facilityCount = place.facilities?.length ?? 0;

  return {
    id: place.id,
    name: place.name || "Unnamed Place",
    location,
    description: place.description || "",
    image:
      place?.metadata?.logoUrl ||
      place.coverImage ||
      place.images?.[0] ||
      FALLBACK_IMAGE,
    category: placeTypeLabel || "Place",
    meta: facilityCount
      ? `${facilityCount} ${facilityCount === 1 ? "facility" : "facilities"}`
      : undefined,
    tag: place.status === "PUBLISHED" ? "Published" : undefined,
  };
};

/**
 * Transform API PublicEvent to Listing format for HomeView
 */
export const transformEventToListing = (
  event: any,
): import("@/data/listings").Listing => {
  const location = event.city
    ? `${event.city}${event.state ? ", " + event.state : ""}`
    : event.location || undefined;

  const prices: number[] = (event.ticketTiers ?? [])
    .map((tier: any) =>
      typeof tier?.price === "number" ? tier.price : tier?.price?.amount,
    )
    .filter((amount: unknown): amount is number => typeof amount === "number");

  const date = event.startDate ? formatDateDisplay(event.startDate) : "";
  const price = prices.length
    ? `from ${formatAmount(Math.min(...prices))}`
    : "";
  const meta = [date, price].filter(Boolean).join(" · ");

  return {
    id: event.id,
    name: event.name || "Unnamed Event",
    location,
    description: event.description || "",
    image: event.images?.[0] || FALLBACK_IMAGE,
    category: formatEnumLabel(event.frequency) || "Event",
    meta: meta || undefined,
    tag: event.isFeatured ? "Featured" : undefined,
  };
};

/**
 * Transform API PublicMenuItem to Listing format for HomeView
 */
export const transformMenuItemToListing = (
  item: any,
): import("@/data/listings").Listing => {
  const price =
    item.price !== undefined && item.price !== null && item.price !== ""
      ? formatAmount(item.price)
      : "";
  const availability =
    item.status && item.status !== "AVAILABLE"
      ? formatEnumLabel(item.status)
      : "";
  const meta = [price, availability].filter(Boolean).join(" · ");

  return {
    id: item.id,
    name: item.name || "Unnamed Item",
    description: item.description || "",
    image: item.images?.[0] || FALLBACK_IMAGE,
    category: formatEnumLabel(item.category) || "Other",
    meta: meta || undefined,
    tag: item.tag?.trim() || (item.isFeatured ? "Featured" : undefined),
  };
};
