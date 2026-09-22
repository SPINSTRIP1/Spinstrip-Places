"use client";

import { SECTIONS, SECTION_THEMES, type SectionKey } from "@/data/listings";
import { MapPin, Store, Ticket } from "lucide-react";

const ICONS: Record<SectionKey, React.ReactNode> = {
  places: <MapPin className="h-5 w-5" />,
  events: <Ticket className="h-5 w-5" />,
  menu: <Store className="h-5 w-5" />,
};

interface Props {
  active: SectionKey;
  onChange: (s: SectionKey) => void;
}

export default function BottomNav({ active, onChange }: Props) {
  return (
    <nav
      className="fixed inset-x-3 bottom-3 z-40 rounded-3xl border border-background-light bg-white/85 p-1.5 shadow-[0_-8px_40px_-12px_var(--sec-glow)] backdrop-blur-2xl sm:hidden"
      style={{ paddingBottom: "calc(0.375rem + env(safe-area-inset-bottom))" }}
      aria-label="Sections"
    >
      <div className="grid grid-cols-3">
        {SECTIONS.map((s) => {
          const isActive = active === s.key;
          const theme = SECTION_THEMES[s.key];
          return (
            <button
              key={s.key}
              onClick={() => onChange(s.key)}
              className="bottom-nav-item flex flex-col items-center gap-1 rounded-2xl py-2.5 text-[11px] font-semibold transition-colors"
              style={{ color: isActive ? theme.accent : "#6F6D6D" }}
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300 ${
                  isActive ? "text-white" : ""
                }`}
                style={
                  isActive
                    ? {
                        background: theme.gradient,
                        boxShadow: `0 6px 20px -4px ${theme.glow}`,
                      }
                    : undefined
                }
              >
                {ICONS[s.key]}
              </span>
              {s.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
