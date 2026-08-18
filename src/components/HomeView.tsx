'use client'

import { useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import AuroraBackground from '@/components/AuroraBackground'
import BottomNav from '@/components/BottomNav'
import CategoryChips, { type SortKey } from '@/components/CategoryChips'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import Hero from '@/components/Hero'
import ListingCard from '@/components/ListingCard'
import SectionTabs from '@/components/SectionTabs'
import { CATEGORIES, LISTINGS, SECTIONS, type Listing, type SectionKey } from '@/data/listings'
import { RESTAURANTS } from '@/data/restaurants'
import { SearchX } from 'lucide-react'

export default function HomeView() {
  const router = useRouter()
  const [section, setSection] = useState<SectionKey>('places')
  const [category, setCategory] = useState('All')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortKey>('recommended')
  const resultsRef = useRef<HTMLDivElement>(null)

  const handleSection = (s: SectionKey) => {
    setSection(s)
    setCategory('All')
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const visible = useMemo(() => {
    let items = LISTINGS[section]
    if (category !== 'All') items = items.filter((i) => i.category === category)
    const q = query.trim().toLowerCase()
    if (q) {
      items = items.filter((i) =>
        [i.name, i.location, i.description, i.category]
          .join(' ')
          .toLowerCase()
          .includes(q),
      )
    }
    if (sort === 'rating') items = [...items].sort((a, b) => b.rating - a.rating)
    if (sort === 'az') items = [...items].sort((a, b) => a.name.localeCompare(b.name))
    return items
  }, [section, category, query, sort])

  const activeSection = SECTIONS.find((s) => s.key === section)!

  const handleOpen = (listing: Listing) => {
    if (section !== 'menu') return
    const restaurant = RESTAURANTS.find((r) => r.listingId === listing.id)
    if (restaurant) router.push(`/restaurants/${restaurant.id}`)
  }

  return (
    <div className="min-h-screen">
      <AuroraBackground />
      <Header />

      <main>
        <Hero query={query} onQuery={setQuery} />
        <SectionTabs active={section} onChange={handleSection} />

        <div ref={resultsRef} className="scroll-mt-20">
          <CategoryChips
            key={section}
            categories={CATEGORIES[section]}
            active={category}
            onChange={setCategory}
            sort={sort}
            onSort={setSort}
          />

          <section className="mx-auto mt-8 max-w-6xl px-4 sm:px-6">
            <div className="mb-5 flex items-end justify-between">
              <div>
                <h2 className="font-display text-2xl font-bold text-[#1c1533] sm:text-3xl">
                  {activeSection.label}
                </h2>
                <p className="mt-1 text-sm text-[#8a82a0]">{activeSection.blurb}</p>
              </div>
              <span className="shrink-0 rounded-full border border-violet-200 bg-white/70 px-3 py-1 text-xs font-medium text-[#6b6480]">
                {visible.length} {visible.length === 1 ? 'result' : 'results'}
              </span>
            </div>

            {visible.length > 0 ? (
              <div
                key={`${section}-${category}-${sort}`}
                className="section-swap grid grid-cols-1 gap-5 pb-6 sm:grid-cols-2 lg:grid-cols-3"
              >
                {visible.map((l, i) => (
                  <ListingCard key={l.id} listing={l} index={i} onOpen={handleOpen} />
                ))}
              </div>
            ) : (
              <div className="section-swap flex flex-col items-center gap-3 rounded-3xl border border-dashed border-violet-300 bg-white/60 py-16 text-center">
                <SearchX className="h-8 w-8 text-violet-400" />
                <p className="font-display text-lg font-semibold text-[#1c1533]">Nothing found</p>
                <p className="max-w-xs text-sm text-[#8a82a0]">
                  Try a different search term or clear the category filter.
                </p>
                <button
                  onClick={() => { setQuery(''); setCategory('All') }}
                  className="btn-press mt-2 rounded-full bg-[#8c34ea] px-5 py-2 text-sm font-semibold text-white hover:bg-[#9b46f0]"
                >
                  Clear filters
                </button>
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />
      <BottomNav active={section} onChange={handleSection} />
    </div>
  )
}
