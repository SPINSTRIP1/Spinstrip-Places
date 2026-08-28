'use client'

import { SECTIONS, type SectionKey } from '@/data/listings'
import { CalendarRange, MapPin, UtensilsCrossed } from 'lucide-react'

const ICONS: Record<SectionKey, React.ReactNode> = {
  places: <MapPin className="h-5 w-5" />,
  events: <CalendarRange className="h-5 w-5" />,
  menu: <UtensilsCrossed className="h-5 w-5" />,
}

interface Props {
  active: SectionKey
  onChange: (s: SectionKey) => void
}

export default function BottomNav({ active, onChange }: Props) {
  return (
    <nav
      className="fixed inset-x-3 bottom-3 z-40 rounded-3xl border border-background-light bg-white/85 p-1.5 shadow-[0_-8px_40px_-12px_rgba(105,50,226,0.3)] backdrop-blur-2xl sm:hidden"
      style={{ paddingBottom: 'calc(0.375rem + env(safe-area-inset-bottom))' }}
      aria-label="Sections"
    >
      <div className="grid grid-cols-3">
        {SECTIONS.map((s) => {
          const isActive = active === s.key
          return (
            <button
              key={s.key}
              onClick={() => onChange(s.key)}
              className={`bottom-nav-item flex flex-col items-center gap-1 rounded-2xl py-2.5 text-[11px] font-semibold ${
                isActive ? 'text-[#6932E2]' : 'text-[#6F6D6D]'
              }`}
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300 ${
                  isActive
                    ? 'bg-[#6932E2] text-white shadow-[0_6px_20px_-4px_rgba(105,50,226,0.7)]'
                    : ''
                }`}
              >
                {ICONS[s.key]}
              </span>
              {s.label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
