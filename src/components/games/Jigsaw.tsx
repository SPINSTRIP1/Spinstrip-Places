"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Lightbulb } from "lucide-react";
import toast from "react-hot-toast";
import GameShell, { useGameContext } from "@/components/games/GameShell";
import { getDinerNick, getLeaderboard, submitScore } from "@/lib/smart-menu";
import { now } from "@/lib/clock";
import { playWin } from "@/lib/sound";
import { cn } from "@/lib/utils";

/** Brand scene, sliced into tiles. */
const SCENE = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
  <rect width="400" height="400" fill="#ffffff"/>
  <rect x="40" y="40" width="320" height="90" rx="18" fill="#6932E2"/>
  <text x="200" y="98" font-family="monospace" font-size="34" font-weight="bold" text-anchor="middle" fill="#ffffff">SPINSTRIP</text>
  <circle cx="200" cy="235" r="75" fill="#F4F0FB"/>
  <circle cx="200" cy="235" r="52" fill="#6932E2"/>
  <circle cx="200" cy="235" r="14" fill="#ffffff"/>
  <rect x="80" y="330" width="240" height="12" rx="6" fill="#6932E2" opacity="0.5"/>
  <text x="200" y="378" font-family="monospace" font-size="17" text-anchor="middle" fill="#6932E2">good food, zero waiting</text>
</svg>`)}`;

const HOW_TO = [
  "The picture is sliced into tiles and shuffled.",
  "Tap one tile, then tap another — they swap. No rotation.",
  "A purple ring means that tile is already in the right spot. Stuck? Hit the 💡 hint.",
  "Finish the picture to land on the weekly board. Lower score wins: seconds + 3 per move.",
];

function shuffled(n: number): number[] {
  const a = Array.from({ length: n * n }, (_, i) => i);
  do {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
  } while (a.every((v, i) => v === i));
  return [...a];
}

export default function Jigsaw() {
  const { merchantId, leaderboardTo } = useGameContext();

  const [size, setSize] = useState<3 | 4>(3);
  const [tiles, setTiles] = useState<number[]>(() => shuffled(3));
  const [sel, setSel] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [secs, setSecs] = useState(0);
  const [hints, setHints] = useState(3);
  const [hintPair, setHintPair] = useState<[number, number] | null>(null);
  const [peek, setPeek] = useState(false);
  const [justPlaced, setJustPlaced] = useState<number[]>([]);
  const [confetti, setConfetti] = useState<number[]>([]);
  const [best, setBest] = useState<number | null>(null);
  const startRef = useRef(now());
  const submitted = useRef(false);
  const won = tiles.every((v, i) => v === i);

  const reset = (n: 3 | 4) => {
    setSize(n);
    setTiles(shuffled(n));
    setMoves(0);
    setSel(null);
    setSecs(0);
    setHints(3);
    setHintPair(null);
    setJustPlaced([]);
    setConfetti([]);
    submitted.current = false;
    startRef.current = now();
  };

  useEffect(() => {
    if (won) return;
    const t = setInterval(
      () => setSecs(Math.floor((now() - startRef.current) / 1000)),
      1000,
    );
    return () => clearInterval(t);
  }, [won]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading local scores after mount
    setBest(getLeaderboard(merchantId, "jigsaw", 1)[0]?.score ?? null);
  }, [merchantId]);

  const score = Math.max(1, secs + moves * 3 + (size === 4 ? -30 : 0));

  useEffect(() => {
    if (!won || submitted.current) return;
    submitted.current = true;
    submitScore(merchantId, {
      game: "jigsaw",
      playerName: getDinerNick() || "Guest",
      score,
      detail: `${size}×${size} · ${secs}s · ${moves} moves`,
    });
    playWin();
    setConfetti(Array.from({ length: 28 }, (_, i) => i));
    toast.success("Puzzle complete! 🎉");
  }, [won, merchantId, score, size, secs, moves]);

  const tap = (pos: number) => {
    if (won || peek) return;
    setHintPair(null);
    if (sel === null) return setSel(pos);
    if (sel === pos) return setSel(null);
    const next = [...tiles];
    [next[sel], next[pos]] = [next[pos], next[sel]];
    const placed = [sel, pos].filter((p) => next[p] === p);
    if (placed.length) {
      setJustPlaced(placed);
      navigator.vibrate?.(30);
      setTimeout(() => setJustPlaced([]), 400);
    }
    setTiles(next);
    setMoves((m) => m + 1);
    setSel(null);
  };

  const useHint = () => {
    if (won) return;
    if (hints <= 0) {
      toast("No hints left — you've got this!");
      return;
    }
    const from = tiles.findIndex((v, i) => v !== i);
    if (from === -1) return;
    setHints((h) => h - 1);
    setHintPair([from, tiles[from]]);
    toast("The two glowing tiles should swap");
    setTimeout(() => setHintPair(null), 2600);
  };

  const solved = useMemo(() => tiles.filter((v, i) => v === i).length, [tiles]);

  return (
    <GameShell title="Restaurant Puzzle" howToPlay={HOW_TO}>
      {confetti.length > 0 && (
        <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
          {confetti.map((i) => (
            <span
              key={i}
              className="absolute top-0 block h-3 w-2"
              style={{
                left: `${(i * 37) % 100}%`,
                background: ["#6932E2", "#E2328C", "#32A8E2", "#E2A832"][i % 4],
                animation: `confetti-fall ${1.8 + (i % 5) * 0.4}s ease-in ${(i % 7) * 0.15}s forwards`,
              }}
            />
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-2 rounded-2xl border border-background-light bg-white p-2.5">
        <div className="flex gap-1.5">
          {([3, 4] as const).map((n) => (
            <button
              key={n}
              onClick={() => reset(n)}
              className={cn(
                "btn-press rounded-full px-4 py-1.5 text-sm font-semibold",
                size === n ? "bg-primary text-white" : "bg-background text-secondary-text",
              )}
            >
              {n}×{n}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={useHint}
            className={cn(
              "btn-press flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold",
              hints > 0 ? "bg-primary-accent text-primary" : "bg-background text-secondary-text",
            )}
          >
            <Lightbulb className="h-3.5 w-3.5" /> {hints}
          </button>
          <button
            onPointerDown={() => setPeek(true)}
            onPointerUp={() => setPeek(false)}
            onPointerLeave={() => setPeek(false)}
            className="btn-press flex items-center gap-1 rounded-full bg-background px-3 py-1.5 text-xs font-semibold text-secondary-text"
          >
            {peek ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />} Peek
          </button>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-sm tabular-nums">
        <span className="font-semibold text-primary">{secs}s</span>
        <span className="text-secondary-text">
          {moves} moves · {solved}/{size * size} placed
        </span>
        {best !== null && <span className="text-xs text-secondary-text">best {best}</span>}
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-background-light">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${(solved / (size * size)) * 100}%` }}
        />
      </div>

      <div
        className="relative mx-auto mt-4 grid w-full max-w-[340px] gap-1 rounded-2xl border border-background-light bg-white p-1.5"
        style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}
      >
        {peek && (
          // eslint-disable-next-line @next/next/no-img-element -- inline SVG data URI
          <img
            src={SCENE}
            alt="Full picture"
            className="pop-in absolute inset-0 z-10 h-full w-full rounded-2xl border-2 border-primary object-cover"
          />
        )}
        {tiles.map((tileIdx, pos) => {
          const correct = tileIdx === pos;
          const hinted = hintPair?.includes(pos);
          return (
            <button
              key={pos}
              onClick={() => tap(pos)}
              aria-label={`Tile ${pos + 1}`}
              className={cn(
                "aspect-square rounded-lg transition-all duration-200 active:scale-95",
                sel === pos && "scale-90 ring-2 ring-primary",
                correct && !won && "ring-1 ring-primary/60",
                hinted && "scale-95 animate-pulse ring-2 ring-primary",
                justPlaced.includes(pos) && "place-pop",
                won && "rounded-none",
              )}
              style={{
                backgroundImage: `url("${SCENE}")`,
                backgroundSize: `${size * 100}% ${size * 100}%`,
                backgroundPosition: `${((tileIdx % size) / (size - 1)) * 100}% ${(Math.floor(tileIdx / size) / (size - 1)) * 100}%`,
              }}
            />
          );
        })}
      </div>

      {won && (
        <div className="pop-in mt-5 rounded-2xl border border-primary/40 bg-primary-accent/40 p-5 text-center">
          <p className="font-display text-lg font-bold text-primary">Puzzle complete!</p>
          <p className="mt-1 text-sm text-secondary-text">
            Score {score} · {secs}s · {moves} moves · {size}×{size}
          </p>
          <div className="mt-4 flex gap-2">
            <button
              className="btn-press flex-1 rounded-xl bg-primary py-3 text-sm font-semibold text-white"
              onClick={() => reset(size)}
            >
              Play again
            </button>
            <Link
              href={leaderboardTo}
              className="flex-1 rounded-xl border border-background-light bg-white py-3 text-center text-sm font-medium text-primary-text"
            >
              Leaderboard
            </Link>
          </div>
        </div>
      )}
    </GameShell>
  );
}
