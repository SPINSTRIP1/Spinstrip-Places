import {
  AiMicIcon,
  AirportIcon,
  BalanceScaleIcon,
  BankIcon,
  BeachIcon,
  Bus01Icon,
  ChurchIcon,
  ComputerDesk02Icon,
  DepartementIcon,
  Dumbbell02Icon,
  EquipmentGym03Icon,
  FerryBoatIcon,
  FootballPitchIcon,
  GivePillIcon,
  Globe02Icon,
  GolfBallIcon,
  GolfHoleIcon,
  Hospital02Icon,
  HospitalBed02Icon,
  Hotel02Icon,
  House02Icon,
  Leaf01Icon,
  PartyIcon,
  PoliceStationIcon,
} from "@hugeicons/core-free-icons";

export const SERVER_URL = "https://spinstrip-merchant-gateway.fly.dev/api/v1";
export const USER_ACCOUNT_URL = "https://spinstrip-user-account.fly.dev/api/v1";
export const EVENTS_SERVER_URL = "https://spinstrip-events.fly.dev/api/v1";
export const PLACES_API_URL = "https://spinstrip-places.fly.dev/api/v1";
export const PLACE_TYPES = [
  { label: "Hotel", value: "HOTEL", icon: Hotel02Icon },
  { label: "Short Let", value: "SHORT_LET", icon: DepartementIcon },
  { label: "Beach Resort", value: "BEACH_RESORT", icon: BeachIcon },
  // {
  //   label: "Recreation Center",
  //   value: "RECREATION_CENTER",
  //   icon: DepartementIcon,
  // },
  { label: "Business Hub", value: "BUSINESS_HUB", icon: ComputerDesk02Icon },
  { label: "Stadium", value: "STADIUM", icon: FootballPitchIcon },
  { label: "Sport Facility", value: "SPORT_FACILITY", icon: Dumbbell02Icon },
  { label: "Country Club", value: "COUNTRY_CLUB", icon: GolfHoleIcon },
  {
    label: "Sport Recreation Club",
    value: "SPORT_RECREATION_CLUB",
    icon: GolfBallIcon,
  },
  { label: "Hospital", value: "HOSPITAL", icon: Hospital02Icon },
  { label: "Clinic", value: "CLINIC", icon: HospitalBed02Icon },
  { label: "Pharmacy", value: "PHARMACY", icon: GivePillIcon },
  {
    label: "Spa Wellness Center",
    value: "SPA_WELLNESS_CENTER",
    icon: Leaf01Icon,
  },
  { label: "Gym", value: "GYM", icon: EquipmentGym03Icon },
  { label: "Studio", value: "STUDIO", icon: AiMicIcon },
  { label: "Airport", value: "AIRPORT", icon: AirportIcon },
  { label: "Rail Station", value: "RAIL_STATION", icon: Dumbbell02Icon },
  {
    label: "Road Transport Hub",
    value: "ROAD_TRANSPORT_HUB",
    icon: Bus01Icon,
  },
  {
    label: "Water Transport Hub",
    value: "WATER_TRANSPORT_HUB",
    icon: FerryBoatIcon,
  },
  {
    label: "Religious Centre",
    value: "RELIGIOUS_CENTRE",
    icon: ChurchIcon,
  },
  { label: "Police Station", value: "POLICE_STATION", icon: PoliceStationIcon },
  { label: "Court", value: "COURT", icon: BalanceScaleIcon },
  {
    label: "Military Barracks",
    value: "MILITARY_BARRACKS",
    icon: House02Icon,
  },
  { label: "Bank", value: "BANK", icon: BankIcon },
  { label: "Strip Club", value: "STRIP_CLUB", icon: PartyIcon },
  { label: "Other", value: "OTHER", icon: Globe02Icon },
];

export const FALLBACK_IMAGE = "/images/placeholder.svg";

/**
 * Filter chips are driven by real server enums so every filter can be
 * applied server-side. `value` is sent to the API verbatim; an empty
 * value means "no filter".
 */
export interface FilterOption {
  label: string;
  value: string;
}

/**
 * `placeType` values accepted by `GET /places/public`. Anything outside
 * this enum is rejected with a 400, so the "Other" entry in PLACE_TYPES
 * is excluded and RECREATION_CENTER (valid server-side, commented out of
 * PLACE_TYPES) is added back.
 */
const PLACE_TYPE_ENUM = [
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
];

export const PLACE_CATEGORIES: FilterOption[] = [
  { label: "All", value: "" },
  ...PLACE_TYPE_ENUM.map((value) => ({
    value,
    label:
      PLACE_TYPES.find((type) => type.value === value)?.label ??
      value
        .split("_")
        .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
        .join(" "),
  })),
];

/**
 * Events have no category field; the public endpoint filters on
 * `isFeatured` and `frequency` instead.
 */
export const EVENT_FEATURED_VALUE = "FEATURED";

export const EVENT_CATEGORIES: FilterOption[] = [
  { label: "All", value: "" },
  { label: "Featured", value: EVENT_FEATURED_VALUE },
  { label: "One-off", value: "ONE_OFF" },
  { label: "Recurring", value: "RECURRING" },
];

/** `category` values accepted by `GET /menu/public`. */
export const MENU_CATEGORIES: FilterOption[] = [
  { label: "All", value: "" },
  { label: "Breakfast", value: "BREAKFAST" },
  { label: "Lunch", value: "LUNCH" },
  { label: "Dinner", value: "DINNER" },
  { label: "Other", value: "OTHER" },
];

/**
 * Sort options. Each section maps these to the field names its own
 * endpoint accepts:
 *   places  -> name | created | updated | city | state
 *   events  -> name | created | updated | startDate | endDate
 *   menu    -> name | createdAt | updatedAt | price
 * "recommended" sends no sort params and uses the server default.
 */
export type SortKey = "recommended" | "newest" | "az";

export interface SortParams {
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export const PLACE_SORTS: Record<SortKey, SortParams> = {
  recommended: {},
  newest: { sortBy: "created", sortOrder: "desc" },
  az: { sortBy: "name", sortOrder: "asc" },
};

export const EVENT_SORTS: Record<SortKey, SortParams> = {
  recommended: {},
  newest: { sortBy: "created", sortOrder: "desc" },
  az: { sortBy: "name", sortOrder: "asc" },
};

export const MENU_SORTS: Record<SortKey, SortParams> = {
  recommended: {},
  newest: { sortBy: "createdAt", sortOrder: "desc" },
  az: { sortBy: "name", sortOrder: "asc" },
};

/** Page size requested per section (`/menu/public` caps `limit` at 100). */
export const PAGE_SIZE = 12;
