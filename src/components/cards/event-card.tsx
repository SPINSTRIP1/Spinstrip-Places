"use client";

import { CalendarDays, Clock3, MapPin, Repeat, Sparkles, Ticket } from "lucide-react";
import MediaImage from "@/components/media-image";
import type { PublicEventListItem } from "@/hooks/use-events";
import { cn } from "@/lib/utils";
import {
  formatEnumLabel,
  getEventPricing,
  getEventTiming,
  getTicketAvailability,
} from "@/utils";

interface EventCardProps {
  event: PublicEventListItem;
  index?: number;
  onOpen: (event: PublicEventListItem) => void;
}

/**
 * An event is a moment in time, so the date leads: a calendar tile on the
 * artwork, the start time and venue under the name, and the ticket price
 * plus scarcity where a shopper decides.
 */
export default function EventCard({ event, index = 0, onOpen }: EventCardProps) {
  const timing = getEventTiming(event);
  const pricing = getEventPricing(event.ticketTiers);
  const tickets = getTicketAvailability(event.ticketTiers);
  const venue =
    event.location ||
    [event.city, event.state].filter(Boolean).join(", ") ||
    event.country;
  const recurring =
    event.frequency === "RECURRING"
      ? formatEnumLabel(event.recurringPattern ?? "RECURRING")
      : null;
  const ended = timing.phase === "ended";

  return (
    <article
      className={cn(
        "listing-card card-in group flex cursor-pointer flex-col overflow-hidden rounded-3xl border border-background-light bg-white/90 backdrop-blur-md",
        ended && "saturate-[0.6]",
      )}
      style={{ "--i": index } as React.CSSProperties}
      onClick={() => onOpen(event)}
    >
      {/* Artwork */}
      <div className="relative aspect-[4/3] overflow-hidden bg-primary-text">
        <MediaImage
          src={event.images?.[0]}
          alt={event.name}
          className="h-full w-full"
          imgClassName="card-img"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/10" />

        {/* Calendar tile */}
        <div className="absolute left-3 top-3 flex min-w-[52px] flex-col items-center overflow-hidden rounded-2xl bg-white text-center shadow-lg">
          <span className="sec-bg w-full py-0.5 text-[10px] font-bold uppercase tracking-widest text-white">
            {timing.month}
          </span>
          <span className="font-display px-2 py-1 text-xl font-bold leading-none text-primary-text">
            {timing.day}
          </span>
          <span className="pb-1 text-[10px] font-medium text-secondary-text">
            {timing.weekday}
          </span>
        </div>

        {event.isFeatured && (
          <span className="sec-gradient absolute right-3 top-3 flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold text-white shadow-[0_6px_20px_-6px_var(--sec-glow)]">
            <Sparkles className="h-3 w-3" /> Featured
          </span>
        )}

        <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-2">
          {timing.phase === "live" ? (
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/95 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-md">
              <span className="live-dot" /> Happening now
            </span>
          ) : ended ? (
            <span className="rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-md">
              Ended
            </span>
          ) : (
            <span className="flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-md">
              <Clock3 className="h-3 w-3" /> {timing.timeLine}
            </span>
          )}
          {recurring && (
            <span className="flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-md">
              <Repeat className="h-3 w-3" /> {recurring}
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <h3 className="font-display line-clamp-2 text-base font-bold leading-snug text-primary-text sm:text-lg">
          {event.name}
        </h3>
        <div className="mt-2 space-y-1 text-xs text-secondary-text">
          <p className="flex items-center gap-1.5">
            <CalendarDays className="sec-text h-3.5 w-3.5 shrink-0" />
            <span className="truncate">
              {timing.dateLine}
              {!timing.isMultiDay && ` · ${timing.timeLine}`}
            </span>
          </p>
          {venue && (
            <p className="flex items-center gap-1.5">
              <MapPin className="sec-text h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{venue}</span>
            </p>
          )}
        </div>

        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-secondary-text">
              {pricing.isFree ? "Entry" : "Tickets"}
            </p>
            <p className="font-display text-lg font-bold tracking-tight text-primary-text sm:text-xl">
              {pricing.label}
            </p>
            {tickets && !ended && (
              <p
                className={cn(
                  "mt-0.5 text-[11px] font-medium",
                  tickets.soldOut
                    ? "text-red-500"
                    : tickets.sellingFast
                      ? "sec-text"
                      : "text-secondary-text",
                )}
              >
                {tickets.soldOut
                  ? "Sold out"
                  : tickets.sellingFast
                    ? `Selling fast · ${tickets.remaining} left`
                    : `${tickets.remaining.toLocaleString()} tickets left`}
              </p>
            )}
          </div>
          <span className="sec-gradient btn-press flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold text-white shadow-[0_8px_24px_-8px_var(--sec-glow)] transition-transform duration-300 group-hover:scale-[1.03]">
            <Ticket className="h-3.5 w-3.5" />
            {ended ? "View" : tickets?.soldOut ? "Details" : "Get tickets"}
          </span>
        </div>
      </div>
    </article>
  );
}
