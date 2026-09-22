"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Trophy } from "lucide-react";
import { useGameContext } from "@/components/games/GameShell";
import {
  avatarColor,
  getLeaderboard,
  timeAgo,
  type GameId,
  type GameScore,
} from "@/lib/smart-menu";
import { cn } from "@/lib/utils";

const GAMES: { id: GameId; label: string; hint: string }[] = [
  { id: "jigsaw", label: "Puzzle", hint: "lowest score wins" },
  { id: "tiles", label: "Tiles", hint: "highest score wins" },
  { id: "spinanza", label: "Spin-to-Build", hint: "highest score wins" },
];

/**
 * This week's scores for one kitchen. Scores live on this phone for now;
 * when the backend gets a scores table this reads from there instead and
 * becomes a real per-restaurant board.
 */
export default function Leaderboard() {
  const { merchantId, backTo } = useGameContext();
  const [game, setGame] = useState<GameId>("jigsaw");
  const [scores, setScores] = useState<GameScore[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading browser storage after mount
    setScores(getLeaderboard(merchantId, game));
  }, [merchantId, game]);

  return (
    <div className="mx-auto min-h-dvh max-w-md px-5 pb-10 pt-4">
      <div className="flex items-center gap-3">
        <Link
          href={backTo}
          aria-label="Back"
          className="btn-press flex h-10 w-10 items-center justify-center rounded-full border border-background-light bg-white text-primary-text"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="font-display text-xl font-bold text-primary-text">Leaderboard · this week</h1>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-1 rounded-full border border-background-light bg-white p-1">
        {GAMES.map((g) => (
          <button
            key={g.id}
            onClick={() => setGame(g.id)}
            className={cn(
              "rounded-full py-2 text-sm font-medium transition-colors",
              game === g.id ? "bg-primary text-white" : "text-secondary-text",
            )}
          >
            {g.label}
          </button>
        ))}
      </div>
      <p className="mt-2 text-center text-xs text-secondary-text">
        {GAMES.find((g) => g.id === game)?.hint} · rewards are house vouchers, awarded by the restaurant
      </p>

      <div className="mt-4 space-y-2">
        {scores.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <Trophy className="h-8 w-8 text-primary-light" />
            <p className="text-sm text-secondary-text">No scores yet this week — be the first.</p>
          </div>
        )}
        {scores.map((s, i) => (
          <div
            key={s.id}
            className="flex items-center justify-between rounded-xl border border-background-light bg-white px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <span className={cn("w-6 font-semibold tabular-nums", i === 0 ? "text-primary" : "text-secondary-text")}>
                {i + 1}
              </span>
              <span
                className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ background: avatarColor(s.playerName) }}
              >
                {s.playerName.slice(0, 1).toUpperCase()}
              </span>
              <div>
                <p className="text-sm font-medium text-primary-text">{s.playerName}</p>
                <p className="text-xs text-secondary-text">
                  {s.detail} · {timeAgo(s.createdAt)}
                </p>
              </div>
            </div>
            <span className="font-semibold tabular-nums text-primary">{s.score}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
