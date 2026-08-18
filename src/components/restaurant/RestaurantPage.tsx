import CartSheet, { type CartLine } from '@/components/restaurant/CartSheet'
import ItemSheet from '@/components/restaurant/ItemSheet'
import MenuItemCard from '@/components/restaurant/MenuItemCard'
import RestaurantLogo from '@/components/restaurant/RestaurantLogo'
import { discounted, formatNaira, type MenuItem, type Restaurant } from '@/data/restaurants'
import { ArrowLeft, BadgePercent, MapPin, Search, SearchX, ShoppingBag, Star } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

interface Props {
  restaurant: Restaurant
  onBack: () => void
}

export default function RestaurantPage({ restaurant, onBack }: Props) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [openItem, setOpenItem] = useState<MenuItem | null>(null)
  const [cartOpen, setCartOpen] = useState(false)
  const [lines, setLines] = useState<CartLine[]>(() => {
    try {
      const raw = localStorage.getItem(`cart:${restaurant.id}`)
      if (!raw) return []
      const parsed: { id: string; qty: number }[] = JSON.parse(raw)
      return parsed
        .map((p) => {
          const item = restaurant.items.find((i) => i.id === p.id)
          return item ? { item, qty: p.qty } : null
        })
        .filter(Boolean) as CartLine[]
    } catch { return [] }
  })
  const [toast, setToast] = useState('')

  useEffect(() => {
    try {
      localStorage.setItem(
        `cart:${restaurant.id}`,
        JSON.stringify(lines.map((l) => ({ id: l.item.id, qty: l.qty }))),
      )
    } catch { /* ignore */ }
  }, [lines, restaurant.id])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 1800)
    return () => clearTimeout(t)
  }, [toast])

  const addToCart = (item: MenuItem, qty: number) => {
    setLines((prev) => {
      const found = prev.find((l) => l.item.id === item.id)
      if (found) return prev.map((l) => (l.item.id === item.id ? { ...l, qty: Math.min(20, l.qty + qty) } : l))
      return [...prev, { item, qty }]
    })
    setOpenItem(null)
    setToast(`${item.name} added to cart`)
  }

  const changeQty = (itemId: string, delta: number) => {
    setLines((prev) =>
      prev
        .map((l) => (l.item.id === itemId ? { ...l, qty: l.qty + delta } : l))
        .filter((l) => l.qty > 0),
    )
  }

  const deals = restaurant.items.filter((i) => i.deal)

  const visible = useMemo(() => {
    let items = restaurant.items
    if (category !== 'All') items = items.filter((i) => i.category === category)
    const q = query.trim().toLowerCase()
    if (q) {
      items = items.filter((i) =>
        [i.name, i.description, i.category, ...i.ingredients, ...i.allergens]
          .join(' ')
          .toLowerCase()
          .includes(q),
      )
    }
    return items
  }, [restaurant, category, query])

  const cartCount = lines.reduce((s, l) => s + l.qty, 0)
  const cartTotal = lines.reduce((s, l) => s + discounted(l.item) * l.qty, 0)

  return (
    <div className="section-swap min-h-screen pb-32" key={restaurant.id}>
      {/* Top bar */}
      <header className="fixed inset-x-0 top-0 z-40 border-b border-violet-100 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <button
            onClick={onBack}
            className="btn-press flex items-center gap-1.5 rounded-full border border-violet-200 bg-white px-3.5 py-2 text-sm font-semibold text-[#1c1533] hover:border-violet-400"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <div className="flex min-w-0 items-center gap-2">
            <RestaurantLogo monogram={restaurant.monogram} bg={restaurant.logoBg} size={32} className="rounded-xl" />
            <span className="truncate font-display text-sm font-bold text-[#1c1533] sm:text-base">
              {restaurant.name}
            </span>
          </div>
          <button
            onClick={() => setCartOpen(true)}
            className="btn-press relative flex h-10 w-10 items-center justify-center rounded-full border border-violet-200 bg-white text-[#1c1533] hover:border-violet-400"
            aria-label="Open cart"
          >
            <ShoppingBag className="h-5 w-5" />
            {cartCount > 0 && (
              <span
                className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
                style={{ background: restaurant.accent }}
              >
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Branded hero */}
      <section className="relative">
        <div className="relative h-56 overflow-hidden sm:h-72">
          <img src={restaurant.cover} alt={restaurant.name} className="h-full w-full object-cover" />
          <div
            className="absolute inset-0"
            style={{ background: `linear-gradient(to top, rgba(28,21,51,0.72), rgba(28,21,51,0.08) 60%), linear-gradient(135deg, ${restaurant.accent}33, transparent 55%)` }}
          />
        </div>
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="relative -mt-14 rounded-3xl border border-violet-100 bg-white/90 p-5 shadow-[0_20px_50px_-20px_rgba(140,52,234,0.35)] backdrop-blur-xl sm:-mt-16 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <RestaurantLogo monogram={restaurant.monogram} bg={restaurant.logoBg} size={72} className="shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <h1 className="font-display text-2xl font-bold text-[#1c1533]">{restaurant.name}</h1>
                  <span className="flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-xs font-semibold text-violet-700">
                    <Star className="h-3 w-3 fill-[#8c34ea] text-[#8c34ea]" />
                    {restaurant.rating.toFixed(1)}
                    <span className="font-normal text-[#a49fbc]">({restaurant.reviews.toLocaleString()})</span>
                  </span>
                </div>
                <p className="mt-0.5 text-xs font-medium" style={{ color: restaurant.accent }}>{restaurant.handle}</p>
                <p className="mt-1.5 text-sm text-[#6b6480]">{restaurant.tagline}</p>
                <p className="mt-1.5 flex items-center gap-1 text-xs text-[#8a82a0]">
                  <MapPin className="h-3.5 w-3.5" style={{ color: restaurant.accent }} />
                  {restaurant.location}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2 self-start sm:self-center">
                <img src="/logo.png" alt="SpinStrip" className="h-4 w-auto opacity-70" />
                <span className="text-[10px] font-medium uppercase tracking-widest text-[#a49fbc]">on SpinStrip</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search */}
      <div className="mx-auto mt-6 max-w-6xl px-4 sm:px-6">
        <label className="search-shell flex items-center gap-3 rounded-2xl border border-violet-200 bg-white/80 px-4 py-3.5 shadow-sm backdrop-blur-xl">
          <Search className="h-5 w-5 shrink-0" style={{ color: restaurant.accent }} />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search the ${restaurant.name} menu…`}
            enterKeyHint="search"
            className="w-full bg-transparent text-base text-[#1c1533] outline-none placeholder:text-[#a49fbc]"
          />
        </label>
      </div>

      {/* Deals & discounts */}
      {deals.length > 0 && (
        <section className="mx-auto mt-8 max-w-6xl">
          <div className="flex items-center gap-2 px-4 sm:px-6">
            <BadgePercent className="h-5 w-5" style={{ color: restaurant.accent }} />
            <h2 className="font-display text-lg font-bold text-[#1c1533]">Deals & discounts</h2>
          </div>
          <div className="chip-rail mt-3 flex gap-3 overflow-x-auto px-4 pb-2 sm:px-6">
            {deals.map((item) => (
              <button
                key={item.id}
                onClick={() => setOpenItem(item)}
                className="listing-card group flex w-64 shrink-0 items-center gap-3 rounded-3xl border border-violet-100 bg-white/90 p-3 text-left backdrop-blur-md"
              >
                <img src={item.image} alt={item.name} className="h-16 w-16 shrink-0 rounded-2xl object-cover" />
                <div className="min-w-0 flex-1">
                  <span
                    className="inline-block rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                    style={{ background: restaurant.gradient }}
                  >
                    {item.deal!.percent}% OFF
                  </span>
                  <p className="mt-1 truncate text-sm font-semibold text-[#1c1533]">{item.name}</p>
                  <p className="text-xs">
                    <span className="font-bold" style={{ color: restaurant.accent }}>{formatNaira(discounted(item))}</span>
                    {' '}<span className="text-[#a49fbc] line-through">{formatNaira(item.price)}</span>
                  </p>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Categories */}
      <div className="chip-rail mx-auto mt-8 flex max-w-6xl gap-2 overflow-x-auto px-4 py-1 sm:px-6">
        {restaurant.categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`chip shrink-0 rounded-full border px-4 py-2 text-sm font-medium ${
              category === c
                ? 'chip-active border-transparent text-white'
                : 'border-violet-200 bg-white/70 text-[#6b6480] hover:text-[#1c1533]'
            }`}
            style={category === c ? { background: restaurant.accent } : undefined}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Menu grid */}
      <section className="mx-auto mt-6 max-w-6xl px-4 sm:px-6">
        {visible.length > 0 ? (
          <div key={category} className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((item, i) => (
              <MenuItemCard
                key={item.id}
                item={item}
                accent={restaurant.accent}
                index={i}
                onOpen={setOpenItem}
                onQuickAdd={(it) => addToCart(it, 1)}
              />
            ))}
          </div>
        ) : (
          <div className="section-swap flex flex-col items-center gap-3 rounded-3xl border border-dashed border-violet-300 bg-white/60 py-16 text-center">
            <SearchX className="h-8 w-8 text-violet-400" />
            <p className="font-display text-lg font-semibold text-[#1c1533]">No dishes found</p>
            <p className="max-w-xs text-sm text-[#8a82a0]">Try another keyword or a different category.</p>
            <button
              onClick={() => { setQuery(''); setCategory('All') }}
              className="btn-press mt-2 rounded-full px-5 py-2 text-sm font-semibold text-white"
              style={{ background: restaurant.accent }}
            >
              Clear filters
            </button>
          </div>
        )}
      </section>

      {/* Sticky cart bar */}
      {cartCount > 0 && !cartOpen && (
        <div className="fixed inset-x-3 bottom-3 z-40 sm:inset-x-auto sm:right-6 sm:w-96" style={{ bottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}>
          <button
            onClick={() => setCartOpen(true)}
            className="rise-in btn-press flex w-full items-center justify-between rounded-full px-5 py-4 text-white shadow-2xl"
            style={{ background: restaurant.gradient, boxShadow: `0 16px 40px -10px ${restaurant.accent}88` }}
          >
            <span className="flex items-center gap-2 font-display text-sm font-semibold">
              <ShoppingBag className="h-5 w-5" />
              {cartCount} {cartCount === 1 ? 'item' : 'items'}
            </span>
            <span className="font-display text-base font-bold">View cart · {formatNaira(cartTotal)}</span>
          </button>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed left-1/2 top-20 z-50 -translate-x-1/2">
          <div className="rise-in flex items-center gap-2 rounded-full bg-[#1c1533] px-4 py-2.5 text-sm font-medium text-white shadow-xl">
            <ShoppingBag className="h-4 w-4" style={{ color: restaurant.accent }} />
            {toast}
          </div>
        </div>
      )}

      {/* Sheets */}
      {openItem && (
        <ItemSheet
          item={openItem}
          accent={restaurant.accent}
          gradient={restaurant.gradient}
          onClose={() => setOpenItem(null)}
          onAdd={addToCart}
        />
      )}
      {cartOpen && (
        <CartSheet
          restaurant={restaurant}
          lines={lines}
          onClose={() => setCartOpen(false)}
          onQty={changeQty}
          onClear={() => setLines([])}
        />
      )}
    </div>
  )
}
