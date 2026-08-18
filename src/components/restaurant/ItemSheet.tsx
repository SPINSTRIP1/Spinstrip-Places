import { discounted, formatNaira, type MenuItem } from '@/data/restaurants'
import { AlertTriangle, Flame, Minus, Plus, ShoppingBag, Wheat, X } from 'lucide-react'
import { useEffect, useState } from 'react'

interface Props {
  item: MenuItem
  accent: string
  gradient: string
  onClose: () => void
  onAdd: (item: MenuItem, qty: number) => void
}

export default function ItemSheet({ item, accent, gradient, onClose, onAdd }: Props) {
  const [qty, setQty] = useState(1)
  const price = discounted(item)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="sheet-overlay absolute inset-0 bg-[#1c1533]/50 backdrop-blur-sm" onClick={onClose} />
      <div className="sheet-panel relative flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white sm:rounded-3xl">
        <div className="relative h-52 shrink-0 sm:h-60">
          <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
          <button
            onClick={onClose}
            className="btn-press absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[#1c1533] shadow-md"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          {item.deal && (
            <span
              className="absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-bold text-white shadow-md"
              style={{ background: gradient }}
            >
              {item.deal.percent}% OFF — {item.deal.label}
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-display text-xl font-bold text-[#1c1533]">{item.name}</h3>
            {item.spicy && (
              <span className="flex shrink-0 items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-600">
                <Flame className="h-3.5 w-3.5" /> Spicy
              </span>
            )}
          </div>
          <p className="mt-2 text-sm leading-relaxed text-[#6b6480]">{item.description}</p>

          <div className="mt-5">
            <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#8a82a0]">
              <Wheat className="h-3.5 w-3.5" /> Ingredients
            </h4>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {item.ingredients.map((ing) => (
                <span
                  key={ing}
                  className="rounded-full border border-violet-100 bg-violet-50/60 px-2.5 py-1 text-xs text-[#6b6480]"
                >
                  {ing}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#8a82a0]">
              <AlertTriangle className="h-3.5 w-3.5" /> Allergies
            </h4>
            {item.allergens.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {item.allergens.map((a) => (
                  <span
                    key={a}
                    className="flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700"
                  >
                    <AlertTriangle className="h-3 w-3" /> Contains {a.toLowerCase()}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-xs text-[#8a82a0]">
                No common allergens listed. Ask the kitchen if you have a severe allergy.
              </p>
            )}
          </div>

          <div className="mt-5 flex items-center justify-between rounded-2xl bg-[#faf7fe] p-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="btn-press flex h-9 w-9 items-center justify-center rounded-full border border-violet-200 bg-white text-[#1c1533]"
                aria-label="Decrease quantity"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="font-display w-6 text-center text-lg font-bold text-[#1c1533]">{qty}</span>
              <button
                onClick={() => setQty((q) => Math.min(20, q + 1))}
                className="btn-press flex h-9 w-9 items-center justify-center rounded-full border border-violet-200 bg-white text-[#1c1533]"
                aria-label="Increase quantity"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="text-right">
              {item.deal && (
                <div className="text-xs text-[#a49fbc] line-through">{formatNaira(item.price)}</div>
              )}
              <div className="font-display text-lg font-bold" style={{ color: accent }}>
                {formatNaira(price)}
              </div>
            </div>
          </div>
        </div>

        <div className="shrink-0 border-t border-violet-100 bg-white p-4" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
          <button
            onClick={() => onAdd(item, qty)}
            className="btn-press flex w-full items-center justify-center gap-2 rounded-full py-3.5 font-display text-base font-semibold text-white shadow-lg"
            style={{ background: gradient, boxShadow: `0 10px 30px -8px ${accent}66` }}
          >
            <ShoppingBag className="h-5 w-5" />
            Add {qty} to cart · {formatNaira(price * qty)}
          </button>
        </div>
      </div>
    </div>
  )
}
