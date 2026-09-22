"use client";

import { SECTIONS, SECTION_THEMES, type SectionKey } from "@/data/listings";
import { MapPin, Store, Ticket } from "lucide-react";

export const SECTION_ICONS: Record<SectionKey, React.ReactNode> = {
  places: <MapPin className="h-4 w-4" />,
  events: <Ticket className="h-4 w-4" />,
  menu: <Store className="h-4 w-4" />,
};

interface Props {
  active: SectionKey;
  onChange: (s: SectionKey) => void;
}

export default function SectionTabs({ active, onChange }: Props) {
  const activeIndex = SECTIONS.findIndex((s) => s.key === active);
  const theme = SECTION_THEMES[active];

  return (
    <div
      className="rise-in mx-auto mt-10 flex justify-center px-4"
      style={{ "--d": "300ms" } as React.CSSProperties}
    >
      <div
        role="tablist"
        aria-label="Sections"
        className="relative grid w-full max-w-md grid-cols-3 rounded-full border border-background-light bg-white/70 p-1.5 shadow-[0_8px_30px_-14px_var(--sec-glow)] backdrop-blur-xl"
      >
        {/* The pill slides between tabs and recolours to the section it lands on. */}
        <div
          className="seg-pill absolute inset-y-1.5 left-1.5 w-[calc((100%-0.75rem)/3)] rounded-full transition-[transform,background,box-shadow] duration-500"
          style={{
            transform: `translateX(${activeIndex * 100}%)`,
            background: theme.gradient,
            boxShadow: `0 8px 28px -6px ${theme.glow}`,
          }}
          aria-hidden="true"
        />
        {SECTIONS.map((s) => (
          <button
            key={s.key}
            role="tab"
            aria-selected={active === s.key}
            onClick={() => onChange(s.key)}
            className={`relative z-10 flex items-center justify-center gap-1.5 rounded-full py-2.5 text-sm font-semibold transition-colors duration-300 ${
              active === s.key
                ? "text-white"
                : "text-secondary-text hover:text-primary-text"
            }`}
          >
            {SECTION_ICONS[s.key]}
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
