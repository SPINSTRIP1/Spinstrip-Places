"use client";

import {
  Call02Icon,
  Globe02Icon,
  Location01Icon,
  Mail01Icon,
} from "@hugeicons/core-free-icons";
import { Clock3, MapPin } from "lucide-react";
import EmptyState from "@/components/empty-state";
import InfoRow from "@/components/info-row";
import type { RestaurantProfile } from "@/hooks/use-restaurants";
import { cn } from "@/lib/utils";
import { formatClock } from "@/utils";

const card =
  "min-w-0 rounded-3xl border border-background-light bg-white/90 p-5 backdrop-blur-md sm:p-6";

/**
 * The Info tab: weekly hours, contact and location. All of it comes from the
 * merchant's published place, so a kitchen without one gets a short note
 * instead of a page of "Not provided".
 */
export default function RestaurantInfo({ restaurant }: { restaurant: RestaurantProfile }) {
  const place = restaurant.place;

  if (!place) {
    return (
      <EmptyState
        icon={<MapPin size={26} />}
        title="No details yet"
        description={`${restaurant.name} hasn't added its address or opening hours. Serving times are shown on each dish.`}
      />
    );
  }

  const schedule = place.operatingHours?.schedule ?? [];
  const today = new Date().toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
  const mapsUrl = place.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.address)}`
    : undefined;

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      <section className={card}>
        <h2 className="font-display flex items-center gap-2 text-lg font-bold text-primary-text">
          <Clock3 className="sec-text h-5 w-5" /> Opening hours
        </h2>
        {schedule.length > 0 ? (
          <ul className="mt-3 divide-y divide-background-light">
            {schedule.map((entry) => {
              const isToday = entry.day.toLowerCase() === today;
              return (
                <li
                  key={entry.day}
                  className={cn(
                    "flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5 py-2.5 text-sm",
                    isToday ? "font-bold text-primary-text" : "text-secondary-text",
                  )}
                >
                  <span className="flex items-center gap-2">
                    {entry.day}
                    {isToday && (
                      <span className="sec-soft sec-text rounded-full px-2 py-0.5 text-[10px] font-bold">
                        Today
                      </span>
                    )}
                  </span>
                  <span className="tabular-nums">
                    {entry.isOpen
                      ? `${formatClock(entry.openingTime)} – ${formatClock(entry.closingTime)}`
                      : "Closed"}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-secondary-text">
            Hours not published. Serving times are shown on each dish.
          </p>
        )}
      </section>

      <section className={cn(card, "space-y-2")}>
        <h2 className="font-display mb-2 text-lg font-bold text-primary-text">
          Location &amp; contact
        </h2>
        <InfoRow icon={Location01Icon} label="Address" value={place.address} href={mapsUrl} />
        <InfoRow
          icon={Call02Icon}
          label="Call"
          value={place.phoneNumbers?.join(", ")}
          href={place.phoneNumbers?.[0] ? `tel:${place.phoneNumbers[0]}` : undefined}
        />
        <InfoRow
          icon={Mail01Icon}
          label="Email"
          value={place.emails?.join(", ")}
          href={place.emails?.[0] ? `mailto:${place.emails[0]}` : undefined}
        />
        <InfoRow
          icon={Globe02Icon}
          label="Website"
          value={place.website}
          href={place.website || undefined}
        />
        {place.address && (
          <div className="mt-3 h-[200px] overflow-hidden rounded-2xl border border-background-light">
            <iframe
              title={`Map showing ${place.address}`}
              src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${encodeURIComponent(place.address)}`}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        )}
      </section>
    </div>
  );
}
