import { PLACE_TYPES } from "@/constants";
import type { PublicEventListItem } from "@/hooks/use-events";
import type { PublicMenuItem } from "@/hooks/use-menu";
import type { PublicPlace } from "@/hooks/use-places";

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
 * Whole-naira price for cards ("₦7,000"). Decimals only appear when the
 * amount actually has them, unlike `formatAmount` which always shows two.
 */
export const formatPrice = (
  amount: number | string | null | undefined,
): string => {
  const value = typeof amount === "string" ? parseFloat(amount) : amount;
  if (value === null || value === undefined || Number.isNaN(value)) return "";
  const isWhole = Number.isInteger(value);
  return `₦${value.toLocaleString("en-NG", {
    minimumFractionDigits: isWhole ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
};

/** Display label for a place type enum, using the curated names first. */
export const placeTypeLabel = (placeType: string | undefined): string =>
  PLACE_TYPES.find((type) => type.value === placeType)?.label ??
  formatEnumLabel(placeType);

/* ────────────────────────────── Places ────────────────────────────── */

/** "09:00" → "9AM", "17:30" → "5:30PM". */
const formatClock = (time: string): string => {
  const [h, m] = time.split(":").map(Number);
  if (Number.isNaN(h)) return time;
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return m
    ? `${hour12}:${String(m).padStart(2, "0")}${period}`
    : `${hour12}${period}`;
};

const toMinutes = (time: string): number => {
  const [h, m] = time.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

export interface OpenStatus {
  isOpen: boolean;
  /** Badge copy: "Open 24 hours", "Open · closes 10PM", "Closed · opens 9AM". */
  label: string;
  /** Shortest form: "Open", "Closed", "24 hours". */
  short: string;
}

/**
 * Whether a place is open right now, from its weekly schedule. Returns null
 * when the place hasn't published hours, so callers hide the badge rather
 * than guess.
 */
export const getOpenStatus = (
  operatingHours: PublicPlace["operatingHours"] | null | undefined,
  now: Date = new Date(),
): OpenStatus | null => {
  const schedule = operatingHours?.schedule;
  if (!schedule?.length) return null;

  const dayName = now.toLocaleDateString("en-US", { weekday: "long" });
  const today = schedule.find(
    (entry) => entry.day.toLowerCase() === dayName.toLowerCase(),
  );
  if (!today) return null;

  const minutesNow = now.getHours() * 60 + now.getMinutes();
  const opens = toMinutes(today.openingTime);
  const closes = toMinutes(today.closingTime);
  const allDay = today.isOpen && opens === 0 && closes >= 23 * 60 + 59;

  if (allDay) {
    return { isOpen: true, label: "Open 24 hours", short: "24 hours" };
  }

  if (today.isOpen && minutesNow >= opens && minutesNow < closes) {
    return {
      isOpen: true,
      label: `Open · closes ${formatClock(today.closingTime)}`,
      short: "Open",
    };
  }

  if (today.isOpen && minutesNow < opens) {
    return {
      isOpen: false,
      label: `Closed · opens ${formatClock(today.openingTime)}`,
      short: "Closed",
    };
  }

  return { isOpen: false, label: "Closed today", short: "Closed" };
};

/** Lowest paid access fee across a place's facilities; null when free or unknown. */
export const getPlaceStartingPrice = (place: PublicPlace): number | null => {
  const amounts = (place.facilities ?? [])
    .flatMap((facility) => facility.fees ?? [])
    .map((fee) => parseFloat(fee.amount))
    .filter((amount) => !Number.isNaN(amount) && amount > 0);
  return amounts.length ? Math.min(...amounts) : null;
};

/* ────────────────────────────── Events ────────────────────────────── */

const safeFormatter = (
  timeZone: string | undefined,
  options: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormat => {
  try {
    return new Intl.DateTimeFormat("en-GB", { ...options, timeZone });
  } catch {
    // Unknown IANA zone in the data — fall back to the viewer's clock.
    return new Intl.DateTimeFormat("en-GB", options);
  }
};

export type EventPhase = "upcoming" | "live" | "ended";

export interface EventTiming {
  phase: EventPhase;
  /** Calendar-tile parts, in the event's own timezone. */
  month: string;
  day: string;
  weekday: string;
  /** "Sun 20 Sep" or, for a multi-day event, "20 Sep – 7 Oct". */
  dateLine: string;
  /** Start time in the event's timezone, e.g. "15:00". */
  timeLine: string;
  isMultiDay: boolean;
}

export const getEventTiming = (
  event: Pick<PublicEventListItem, "startDate" | "endDate" | "timezone">,
  now: Date = new Date(),
): EventTiming => {
  const start = new Date(event.startDate);
  const end = new Date(event.endDate);
  const tz = event.timezone || undefined;

  const phase: EventPhase =
    end.getTime() < now.getTime()
      ? "ended"
      : start.getTime() <= now.getTime()
        ? "live"
        : "upcoming";

  const dayMonth = (date: Date) =>
    safeFormatter(tz, { day: "numeric", month: "short" }).format(date);
  const weekday = safeFormatter(tz, { weekday: "short" }).format(start);
  const isMultiDay = dayMonth(start) !== dayMonth(end);

  return {
    phase,
    month: safeFormatter(tz, { month: "short" }).format(start).toUpperCase(),
    day: safeFormatter(tz, { day: "numeric" }).format(start),
    weekday,
    dateLine: isMultiDay
      ? `${dayMonth(start)} – ${dayMonth(end)}`
      : `${weekday} ${dayMonth(start)}`,
    timeLine: safeFormatter(tz, {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(start),
    isMultiDay,
  };
};

export interface EventPricing {
  min: number | null;
  isFree: boolean;
  /** "From ₦1,000", "₦1,000" (single tier) or "Free". */
  label: string;
}

/** Ticket prices arrive as strings, numbers or `{ amount }` depending on the endpoint. */
const tierAmount = (tier: { price: unknown }): number | null => {
  const raw = tier.price as
    | number
    | string
    | { amount?: number | string }
    | null
    | undefined;
  const value =
    typeof raw === "object" && raw !== null ? raw.amount : (raw ?? null);
  const parsed = typeof value === "string" ? parseFloat(value) : value;
  return typeof parsed === "number" && !Number.isNaN(parsed) ? parsed : null;
};

export const getEventPricing = (
  tiers: PublicEventListItem["ticketTiers"] | null | undefined,
): EventPricing => {
  const amounts = (tiers ?? [])
    .map(tierAmount)
    .filter((amount): amount is number => amount !== null);
  if (!amounts.length) return { min: null, isFree: false, label: "Tickets" };
  const min = Math.min(...amounts);
  if (min === 0 && Math.max(...amounts) === 0) {
    return { min: 0, isFree: true, label: "Free" };
  }
  const distinct = new Set(amounts).size;
  return {
    min,
    isFree: false,
    label: distinct > 1 ? `From ${formatPrice(min)}` : formatPrice(min),
  };
};

export interface TicketAvailability {
  total: number;
  sold: number;
  remaining: number;
  soldOut: boolean;
  /** At least 70% gone but not sold out. */
  sellingFast: boolean;
}

export const getTicketAvailability = (
  tiers: PublicEventListItem["ticketTiers"] | null | undefined,
): TicketAvailability | null => {
  if (!tiers?.length) return null;
  const total = tiers.reduce(
    (sum, tier) => sum + (tier.quantityAvailable ?? 0),
    0,
  );
  const sold = tiers.reduce((sum, tier) => sum + (tier.quantitySold ?? 0), 0);
  const remaining = Math.max(0, total - sold);
  return {
    total,
    sold,
    remaining,
    soldOut: total > 0 && remaining === 0,
    sellingFast: total > 0 && remaining > 0 && sold / total >= 0.7,
  };
};

/* ────────────────────────────── Menu ────────────────────────────── */

/** One-line summary of when the kitchen serves this item. */
export const describeAvailability = (item: PublicMenuItem): string => {
  switch (item.availabilityType) {
    case "ON_DEMAND":
      return "Made to order";
    case "SPECIFIC_DAYS_TIME": {
      const schedule = item.availabilitySchedule;
      if (!schedule?.days?.length) return "Selected days";
      const days = schedule.days.map((day) => day.slice(0, 3)).join(", ");
      const hours =
        schedule.startTime && schedule.endTime
          ? `${schedule.startTime}–${schedule.endTime}`
          : "";
      return [days, hours].filter(Boolean).join(" · ");
    }
    default:
      return "Available all day";
  }
};

/** "In stock", "3 left", "Sold out", or the non-available status. */
export const menuStockLabel = (item: PublicMenuItem): string => {
  if (item.status !== "AVAILABLE") return formatEnumLabel(item.status);
  if (item.quantity === null) return "In stock";
  if (item.quantity <= 0) return "Sold out";
  return `${item.quantity.toLocaleString()} left`;
};

/** Two-letter monogram for a restaurant without a logo ("Canton Cuisine" → "CC"). */
export const monogramFor = (name: string): string => {
  const words = name
    .replace(/[^\p{L}\p{N} ]/gu, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const letters =
    words.length >= 2 ? words[0][0] + words[1][0] : name.trim().slice(0, 2);
  return letters.toUpperCase();
};
