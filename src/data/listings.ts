export type SectionKey = "places" | "events" | "menu";

export interface Listing {
  id: string;
  name: string;
  description: string;
  image: string;
  category: string;
  /** Only set for sections whose API exposes a location. */
  location?: string;
  meta?: string; // price, date, distance...
  tag?: string;
}

export const SECTIONS: { key: SectionKey; label: string; blurb: string }[] = [
  {
    key: "places",
    label: "Places",
    blurb: "Every spot already listed by merchants on SpinStrip.",
  },
  {
    key: "events",
    label: "Events",
    blurb: "Experiences and happenings created on SpinStrip.",
  },
  {
    key: "menu",
    label: "Menu",
    blurb: "Dishes and drinks served up by merchants on SpinStrip.",
  },
];
