'use client'

import { MapPin, Search, Sparkles } from 'lucide-react'

interface HeroProps {
  query: string
  onQuery: (q: string) => void
}

export default function Hero({ query, onQuery }: HeroProps) {
  return (
    <section className="relative mx-auto max-w-6xl px-4 pt-28 sm:px-6 sm:pt-36">
      <div className="rise-in mx-auto max-w-2xl text-center" style={{ '--d': '0ms' } as React.CSSProperties}>
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/70 px-3.5 py-1.5 text-xs font-medium text-violet-700 shadow-sm backdrop-blur-sm">
          <Sparkles className="glow-dot h-3.5 w-3.5 text-[#8c34ea]" />
          The SME discovery platform by SpinStrip
        </div>
        <h1 className="font-display text-4xl font-bold leading-[1.08] tracking-tight text-[#1c1533] sm:text-6xl">
          Discover what
          <span className="bg-gradient-to-r from-[#da82eb] via-[#af46e8] to-[#8c34ea] bg-clip-text text-transparent">
            {' '}moves you
          </span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-balance text-sm leading-relaxed text-[#6b6480] sm:text-base">
          Explore vibrant places, unforgettable events and the menus people love —
          listed by the small businesses around you, all in one platform.
        </p>
      </div>

      <div
        className="rise-in mx-auto mt-8 max-w-xl"
        style={{ '--d': '120ms' } as React.CSSProperties}
      >
        <label className="search-shell flex items-center gap-3 rounded-2xl border border-violet-200 bg-white/80 px-4 py-3.5 shadow-[0_8px_30px_-14px_rgba(140,52,234,0.25)] backdrop-blur-xl sm:rounded-full sm:py-4">
          <Search className="h-5 w-5 shrink-0 text-[#8c34ea]" />
          <input
            type="search"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Search places, events, dishes…"
            enterKeyHint="search"
            className="w-full bg-transparent text-base text-[#1c1533] outline-none placeholder:text-[#a49fbc]"
          />
          <span className="hidden shrink-0 items-center gap-1 rounded-full border border-violet-100 bg-violet-50 px-2.5 py-1 text-[11px] text-violet-600 sm:flex">
            <MapPin className="h-3 w-3" /> Lagos
          </span>
        </label>
      </div>

      <div
        className="rise-in mx-auto mt-6 flex max-w-xl flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-[#8a82a0]"
        style={{ '--d': '220ms' } as React.CSSProperties}
      >
        <span><strong className="font-display text-[#1c1533]">140+</strong> places listed</span>
        <span className="h-1 w-1 rounded-full bg-violet-400" />
        <span><strong className="font-display text-[#1c1533]">60+</strong> events created</span>
        <span className="h-1 w-1 rounded-full bg-violet-400" />
        <span><strong className="font-display text-[#1c1533]">2k+</strong> dishes on menus</span>
      </div>
    </section>
  )
}
