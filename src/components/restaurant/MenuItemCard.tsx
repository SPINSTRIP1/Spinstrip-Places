'use client'

import Image from 'next/image'
import { discounted, formatNaira, type MenuItem } from '@/data/restaurants'
import { Flame, Plus } from 'lucide-react'

interface Props {
  item: MenuItem
  accent: string
  index: number
  onOpen: (item: MenuItem) => void
  onQuickAdd: (item: MenuItem) => void
}

export default function MenuItemCard({ item, accent, index, onOpen, onQuickAdd }: Props) {
  const price = discounted(item)
  return (
    <article
      className="listing-card card-in group cursor-pointer overflow-hidden rounded-3xl border border-violet-100 bg-white/90 backdrop-blur-md"
      style={{ '--i': index } as React.CSSProperties}
      onClick={() => onOpen(item)}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={item.image}
          alt={item.name}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="card-img object-cover"
          draggable={false}
        />
        {item.deal && (
          <span
            className="absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-bold text-white shadow-md"
            style={{ background: accent }}
          >
            -{item.deal.percent}% · {item.deal.label}
          </span>
        )}
        {item.spicy && (
          <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/45 px-2 py-1 text-[11px] font-medium text-white backdrop-blur-md">
            <Flame className="h-3 w-3 text-orange-400" /> Spicy
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-display text-base font-semibold leading-snug text-[#1c1533]">
          {item.name}
        </h3>
        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-[#6b6480]">
          {item.description}
        </p>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-lg font-bold text-[#1c1533]">{formatNaira(price)}</span>
            {item.deal && (
              <span className="text-xs text-[#a49fbc] line-through">{formatNaira(item.price)}</span>
            )}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onQuickAdd(item) }}
            className="btn-press flex h-9 w-9 items-center justify-center rounded-full text-white shadow-md"
            style={{ background: accent }}
            aria-label={`Add ${item.name} to cart`}
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </div>
    </article>
  )
}
