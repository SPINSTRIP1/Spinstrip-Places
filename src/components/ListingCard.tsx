import type { Listing } from '@/data/listings'
import { MapPin, Star } from 'lucide-react'

interface Props {
  listing: Listing
  index: number
  onOpen?: (listing: Listing) => void
}

export default function ListingCard({ listing, index, onOpen }: Props) {
  return (
    <article
      className="listing-card card-in group cursor-pointer overflow-hidden rounded-3xl border border-violet-100 bg-white/90 backdrop-blur-md"
      style={{ '--i': index } as React.CSSProperties}
      onClick={() => onOpen?.(listing)}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={listing.image}
          alt={listing.name}
          loading="lazy"
          className="card-img h-full w-full object-cover"
          draggable={false}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
        <span className="absolute left-3 top-3 rounded-full border border-white/40 bg-white/75 px-2.5 py-1 text-[11px] font-semibold text-violet-700 backdrop-blur-md">
          {listing.category}
        </span>
        {listing.tag && (
          <span className="absolute right-3 top-3 rounded-full bg-gradient-to-r from-[#8c34ea] to-[#af46e8] px-2.5 py-1 text-[11px] font-semibold text-white shadow-[0_6px_20px_-6px_rgba(140,52,234,0.8)]">
            {listing.tag}
          </span>
        )}
        {listing.meta && (
          <span className="absolute bottom-3 left-3 rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-md">
            {listing.meta}
          </span>
        )}
      </div>
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-base font-semibold leading-snug text-[#1c1533] sm:text-lg">
            {listing.name}
          </h3>
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-violet-50 px-2 py-1 text-xs font-semibold text-violet-700">
            <Star className="h-3 w-3 fill-[#8c34ea] text-[#8c34ea]" />
            {listing.rating.toFixed(1)}
          </span>
        </div>
        <p className="mt-1 flex items-center gap-1 text-xs text-[#8c34ea]">
          <MapPin className="h-3.5 w-3.5" />
          {listing.location}
          <span className="text-[#a49fbc]">· {listing.reviews.toLocaleString()} reviews</span>
        </p>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[#6b6480]">
          {listing.description}
        </p>
      </div>
    </article>
  )
}
