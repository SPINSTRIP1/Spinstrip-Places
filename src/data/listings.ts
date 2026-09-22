import type { CSSProperties } from "react";

export type SectionKey = "places" | "events" | "menu";

export interface SectionMeta {
  key: SectionKey;
  label: string;
  blurb: string;
}

export const SECTIONS: SectionMeta[] = [
  {
    key: "places",
    label: "Places",
    blurb: "Hotels, venues and spots listed by merchants on SpinStrip.",
  },
  {
    key: "events",
    label: "Events",
    blurb: "Experiences you can get tickets to, created on SpinStrip.",
  },
  {
    key: "menu",
    label: "Restaurants",
    blurb: "Dishes to order from kitchens on SpinStrip.",
  },
];

/**
 * One palette for every section — the brand violet — so the page reads as
 * one product whichever tab is open. Sections differ by card *structure*
 * (a place is a profile, an event leads with its date, a dish with its
 * price), not by colour. Components never reference these values
 * directly; `sectionThemeVars` turns them into CSS custom properties and
 * the `.sec-*` utilities in globals.css pick them up, so a section could
 * be given its own accent later without touching any component.
 */
export interface SectionTheme {
  /** Solid accent — buttons, active chips, icons. */
  accent: string;
  /** Darker accent for hover states. */
  accentStrong: string;
  /** Tinted surface behind chips and badges. */
  soft: string;
  /** Border that sits on the tinted surface. */
  softBorder: string;
  /** Gradient for the hero moments (tab pill, primary CTA). */
  gradient: string;
  /** Translucent accent for glows and shadows. */
  glow: string;
}

const BRAND_THEME: SectionTheme = {
  accent: "#6932E2",
  accentStrong: "#5527BF",
  soft: "#EBE2FF",
  softBorder: "#D9CBFB",
  gradient: "linear-gradient(135deg, #6932E2 0%, #9E76F8 100%)",
  glow: "rgba(105, 50, 226, 0.45)",
};

export const SECTION_THEMES: Record<SectionKey, SectionTheme> = {
  places: BRAND_THEME,
  events: BRAND_THEME,
  menu: BRAND_THEME,
};

/** Inline style that themes every `.sec-*` descendant for one section. */
export function sectionThemeVars(section: SectionKey): CSSProperties {
  const theme = SECTION_THEMES[section];
  return {
    "--sec": theme.accent,
    "--sec-strong": theme.accentStrong,
    "--sec-soft": theme.soft,
    "--sec-border": theme.softBorder,
    "--sec-gradient": theme.gradient,
    "--sec-glow": theme.glow,
  } as CSSProperties;
}
