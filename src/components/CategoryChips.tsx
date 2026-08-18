'use client'

import { ArrowDownAZ, ArrowUpDown, Star } from 'lucide-react'

export type SortKey = 'recommended' | 'rating' | 'az'

interface Props {
  categories: string[]
  active: string
  onChange: (c: string) => void
  sort: SortKey
  onSort: (s: SortKey) => void
}

const SORTS: { key: SortKey; label: string; icon: React.ReactNode }[] = [
  { key: 'recommended', label: 'Recommended', icon: <ArrowUpDown className="h-3.5 w-3.5" /> },
  { key: 'rating', label: 'Top rated', icon: <Star className="h-3.5 w-3.5" /> },
  { key: 'az', label: 'A – Z', icon: <ArrowDownAZ className="h-3.5 w-3.5" /> },
]

export default function CategoryChips({ categories, active, onChange, sort, onSort }: Props) {
  return (
    <div className="mt-8">
      <div className="chip-rail flex gap-2 overflow-x-auto px-4 py-1 sm:justify-center sm:px-6">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => onChange(c)}
            className={`chip shrink-0 rounded-full border px-4 py-2 text-sm font-medium ${
              active === c
                ? 'chip-active border-transparent bg-[#8c34ea] text-white'
                : 'border-violet-200 bg-white/70 text-[#6b6480] hover:border-violet-400 hover:text-[#1c1533]'
            }`}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-center gap-1.5">
        {SORTS.map((s) => (
          <button
            key={s.key}
            onClick={() => onSort(s.key)}
            className={`chip flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${
              sort === s.key ? 'bg-violet-100 text-violet-700' : 'text-[#8a82a0] hover:text-[#1c1533]'
            }`}
          >
            {s.icon}
            {s.label}
          </button>
        ))}
      </div>
    </div>
  )
}
