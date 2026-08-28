'use client'

import { SECTIONS, type SectionKey } from '@/data/listings'
import { CalendarRange, MapPin, UtensilsCrossed } from 'lucide-react'

const ICONS: Record<SectionKey, React.ReactNode> = {
  places: <MapPin className="h-4 w-4" />,
  events: <CalendarRange className="h-4 w-4" />,
  menu: <UtensilsCrossed className="h-4 w-4" />,
}

interface Props {
  active: SectionKey
  onChange: (s: SectionKey) => void
}

export default function SectionTabs({ active, onChange }: Props) {
  const activeIndex = SECTIONS.findIndex((s) => s.key === active)

  return (
    <div className="rise-in mx-auto mt-10 flex justify-center px-4" style={{ '--d': '300ms' } as React.CSSProperties}>
      <div
        role="tablist"
        aria-label="Sections"
        className="relative grid w-full max-w-md grid-cols-3 rounded-full border border-background-light bg-white/70 p-1.5 shadow-[0_8px_30px_-14px_rgba(105,50,226,0.25)] backdrop-blur-xl"
      >
        <div
          className="seg-pill absolute inset-y-1.5 left-1.5 w-[calc((100%-0.75rem)/3)] rounded-full bg-[#6932E2] shadow-[0_8px_28px_-6px_rgba(105,50,226,0.65)]"
          style={{ transform: `translateX(${activeIndex * 100}%)` }}
          aria-hidden="true"
        />
        {SECTIONS.map((s) => (
          <button
            key={s.key}
            role="tab"
            aria-selected={active === s.key}
            onClick={() => onChange(s.key)}
            className={`relative z-10 flex items-center justify-center gap-1.5 rounded-full py-2.5 text-sm font-semibold transition-colors duration-300 ${
              active === s.key ? 'text-white' : 'text-[#6F6D6D] hover:text-[#0F0F0F]'
            }`}
          >
            {ICONS[s.key]}
            {s.label}
          </button>
        ))}
      </div>
    </div>
  )
}
