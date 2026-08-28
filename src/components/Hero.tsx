'use client'

import { useCallback, useEffect, useState } from 'react'
import { MapPin, Search, Sparkles } from 'lucide-react'

interface HeroProps {
  query: string
  onQuery: (q: string) => void
}

// Same rotating headline as the hero on spinstrip.com
const HERO_TEXTS = [
  'what moves you',
  'your vibe',
  "what's trending",
  'places around you',
  'restaurants near you',
  'events around you',
]

export default function Hero({ query, onQuery }: HeroProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  const cycleText = useCallback(() => {
    setIsAnimating(true)
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % HERO_TEXTS.length)
      setIsAnimating(false)
    }, 500)
  }, [])

  useEffect(() => {
    const interval = setInterval(cycleText, 3000)
    return () => clearInterval(interval)
  }, [cycleText])

  return (
    <section className="relative mx-auto max-w-6xl px-4 pt-28 sm:px-6 sm:pt-36">
      <div className="rise-in mx-auto max-w-5xl text-center" style={{ '--d': '0ms' } as React.CSSProperties}>
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-background-light bg-white/70 px-3.5 py-1.5 text-xs font-medium text-[#6932E2] shadow-sm backdrop-blur-sm">
          <Sparkles className="glow-dot h-3.5 w-3.5 text-[#6932E2]" />
          The SME discovery platform by SpinStrip
        </div>
        <h1 className="font-display flex flex-col items-center justify-center gap-x-3 text-4xl font-medium leading-[1.08] tracking-tight text-[#6932E2] sm:flex-row sm:items-baseline sm:text-6xl">
          Discover
          <span className="inline-block overflow-hidden pb-2 align-bottom text-[#0F0F0F] sm:whitespace-nowrap">
            <span
              className={`inline-block transition-all duration-500 ease-in-out ${
                isAnimating
                  ? '-translate-y-full opacity-0'
                  : 'translate-y-0 opacity-100'
              }`}
            >
              {HERO_TEXTS[currentIndex]}
            </span>
          </span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-balance text-sm leading-relaxed text-[#6F6D6D] sm:text-base">
          Explore vibrant places, unforgettable events and the menus people love —
          listed by the small businesses around you, all in one platform.
        </p>
      </div>

      <div
        className="rise-in mx-auto mt-8 max-w-xl"
        style={{ '--d': '120ms' } as React.CSSProperties}
      >
        <label className="search-shell flex items-center gap-3 rounded-2xl border border-background-light bg-white/80 px-4 py-3.5 shadow-[0_8px_30px_-14px_rgba(105,50,226,0.25)] backdrop-blur-xl sm:rounded-full sm:py-4">
          <Search className="h-5 w-5 shrink-0 text-[#6932E2]" />
          <input
            type="search"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Search places, events, dishes…"
            enterKeyHint="search"
            className="w-full bg-transparent text-base text-[#0F0F0F] outline-none placeholder:text-[#C8C8C8]"
          />
          <span className="hidden shrink-0 items-center gap-1 rounded-full border border-background-light bg-primary-accent px-2.5 py-1 text-[11px] text-[#6932E2] sm:flex">
            <MapPin className="h-3 w-3" /> Lagos
          </span>
        </label>
      </div>

      <div
        className="rise-in mx-auto mt-6 flex max-w-xl flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-[#6F6D6D]"
        style={{ '--d': '220ms' } as React.CSSProperties}
      >
        <span><strong className="font-display text-[#0F0F0F]">140+</strong> places listed</span>
        <span className="h-1 w-1 rounded-full bg-primary-light" />
        <span><strong className="font-display text-[#0F0F0F]">60+</strong> events created</span>
        <span className="h-1 w-1 rounded-full bg-primary-light" />
        <span><strong className="font-display text-[#0F0F0F]">2k+</strong> dishes on menus</span>
      </div>
    </section>
  )
}
