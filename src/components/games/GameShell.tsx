"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, HelpCircle, Music, Music4, Users, X } from "lucide-react";
import { avatarColor, getDinerNick } from "@/lib/smart-menu";
import { isMusicMuted, startMusic, stopMusic, toggleMusicMuted } from "@/lib/sound";
import { cn } from "@/lib/utils";

/** Everything a game needs from the URL: which kitchen, table and order. */
export function useGameContext() {
  const params = useSearchParams();
  const merchantId = params.get("r") ?? "";
  const table = params.get("t") ?? "";
  const orderId = params.get("order") ?? "";
  const query = `r=${merchantId}&t=${encodeURIComponent(table)}&order=${orderId}`;
  return {
    merchantId,
    table,
    orderId,
    query,
    backTo: orderId ? `/orders/${orderId}` : merchantId ? `/restaurants/${merchantId}` : "/",
    leaderboardTo: `/games/leaderboard?${query}`,
  };
}

export function Avatar({ name, className }: { name: string; className?: string }) {
  return (
    <span
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold text-white",
        className,
      )}
      style={{ background: avatarColor(name) }}
    >
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

interface Props {
  title: string;
  howToPlay: string[];
  children: React.ReactNode;
}

/**
 * Frame shared by every wait-time game: back to the order, who's at the
 * table, a how-to-play sheet and the music toggle. Music only starts after
 * the first tap (browser autoplay rules) and stops when the game unmounts.
 */
export default function GameShell({ title, howToPlay, children }: Props) {
  const { backTo, table } = useGameContext();
  const [helpOpen, setHelpOpen] = useState(false);
  const [muted, setMuted] = useState(true);
  const [nick, setNick] = useState("You");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading browser storage after mount
    setMuted(isMusicMuted());
    setNick(getDinerNick() || "You");
    const kick = () => {
      startMusic();
      window.removeEventListener("pointerdown", kick);
    };
    window.addEventListener("pointerdown", kick);
    return () => {
      window.removeEventListener("pointerdown", kick);
      stopMusic();
    };
  }, []);

  return (
    <div className="mx-auto min-h-dvh max-w-md px-5 pb-10 pt-4">
      <div className="flex items-center justify-between">
        <Link
          href={backTo}
          aria-label="Back"
          className="btn-press flex h-10 w-10 items-center justify-center rounded-full border border-background-light bg-white text-primary-text"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>

        <div className="flex items-center gap-1.5 rounded-full border border-background-light bg-white px-3 py-1.5">
          <Users className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-semibold tabular-nums text-primary-text">
            {table ? `Table ${table}` : "Solo"}
          </span>
          <Avatar name={nick} className="ml-1 h-5 w-5 text-[9px]" />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setHelpOpen(true)}
            aria-label="How to play"
            className="btn-press flex h-10 w-10 items-center justify-center rounded-full border border-background-light bg-white"
          >
            <HelpCircle className="h-5 w-5 text-primary" />
          </button>
          <button
            onClick={() => setMuted(toggleMusicMuted())}
            aria-label={muted ? "Unmute music" : "Mute music"}
            className={cn(
              "btn-press flex h-10 w-10 items-center justify-center rounded-full border",
              muted
                ? "border-background-light bg-white text-secondary-text"
                : "border-primary bg-primary text-white",
            )}
          >
            {muted ? <Music4 className="h-5 w-5" /> : <Music className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <h1 className="font-display mt-4 text-2xl font-bold text-primary-text">{title}</h1>

      <div className="mt-3">{children}</div>

      {helpOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-primary-text/50 p-6 backdrop-blur-sm"
          onClick={() => setHelpOpen(false)}
        >
          <div
            className="pop-in w-full max-w-sm rounded-3xl bg-white p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-primary-text">How to play</h3>
              <button onClick={() => setHelpOpen(false)} aria-label="Close">
                <X className="h-5 w-5 text-secondary-text" />
              </button>
            </div>
            <ul className="mt-4 space-y-3">
              {howToPlay.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-accent text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  <span className="text-primary-text/90">{step}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => setHelpOpen(false)}
              className="btn-press mt-6 w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
