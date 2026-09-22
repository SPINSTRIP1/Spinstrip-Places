"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { RotateCw } from "lucide-react";
import toast from "react-hot-toast";
import GameShell, { useGameContext } from "@/components/games/GameShell";
import { getDinerNick, submitScore } from "@/lib/smart-menu";
import { now } from "@/lib/clock";
import { playWin } from "@/lib/sound";
import { cn } from "@/lib/utils";

const HOW_TO = [
  "Fill the board with pieces from the tray before time runs out.",
  "Tap a piece, rotate it with the button if needed, then tap a board cell to drop it.",
  "Pieces that don't fit will shake — rotate or pick another cell.",
  "Complete a full row to clear it for +40 bonus points.",
  "Score = fill% × 10 + row bonuses − seconds used. Chill mode removes the move penalty.",
];

type Cell = [number, number];
type Piece = { name: string; cells: Cell[]; color: string; round?: boolean };

const BAG: Piece[] = [
  { name: "bar3", cells: [[0, 0], [1, 0], [2, 0]], color: "#6932E2" },
  { name: "bar4", cells: [[0, 0], [1, 0], [2, 0], [3, 0]], color: "#9B7BEB" },
  { name: "L4", cells: [[0, 0], [0, 1], [0, 2], [1, 2]], color: "#E2328C" },
  { name: "T4", cells: [[0, 0], [1, 0], [2, 0], [1, 1]], color: "#32A8E2" },
  { name: "S4", cells: [[1, 0], [2, 0], [0, 1], [1, 1]], color: "#22B573" },
  { name: "dot2x2", cells: [[0, 0], [1, 0], [0, 1], [1, 1]], color: "#E2A832", round: true },
  { name: "corner3", cells: [[0, 0], [0, 1], [1, 1]], color: "#E24B32" },
];

const N = 8;
const ROW_BONUS = 40;

function rotate(cells: Cell[]): Cell[] {
  const r = cells.map(([x, y]) => [y, -x] as Cell);
  const minX = Math.min(...r.map(([x]) => x));
  const minY = Math.min(...r.map(([, y]) => y));
  return r.map(([x, y]) => [x - minX, y - minY] as Cell);
}

const draw = (): Piece => BAG[Math.floor(Math.random() * BAG.length)];
const emptyGrid = () => Array.from({ length: N }, () => Array<string | null>(N).fill(null));

function PiecePreview({ piece, rot }: { piece: Piece; rot: number }) {
  let cs = piece.cells;
  for (let i = 0; i < rot % 4; i++) cs = rotate(cs);
  const w = Math.max(...cs.map(([x]) => x)) + 1;
  const h = Math.max(...cs.map(([, y]) => y)) + 1;
  return (
    <div
      className="grid gap-0.5"
      style={{ gridTemplateColumns: `repeat(${w}, 10px)`, gridTemplateRows: `repeat(${h}, 10px)` }}
    >
      {Array.from({ length: w * h }).map((_, i) => {
        const x = i % w;
        const y = Math.floor(i / w);
        const on = cs.some(([cx, cy]) => cx === x && cy === y);
        return (
          <div
            key={i}
            style={{
              background: on ? piece.color : "transparent",
              borderRadius: piece.round && on ? "50%" : 2,
            }}
          />
        );
      })}
    </div>
  );
}

export default function Tiles() {
  const { merchantId, leaderboardTo } = useGameContext();
  const [easy, setEasy] = useState(true);
  const TIME = easy ? 120 : 90;
  const [grid, setGrid] = useState<(string | null)[][]>(emptyGrid);
  const [queue, setQueue] = useState<Piece[]>(() => [draw(), draw(), draw()]);
  const [selIdx, setSelIdx] = useState<number | null>(null);
  const [rot, setRot] = useState(0);
  const [moves, setMoves] = useState(0);
  const [bonus, setBonus] = useState(0);
  const [flashRows, setFlashRows] = useState<number[]>([]);
  const [popup, setPopup] = useState<string | null>(null);
  const [shakeCell, setShakeCell] = useState<string | null>(null);
  const [lastPlaced, setLastPlaced] = useState<string[]>([]);
  const [left, setLeft] = useState(120);
  const startRef = useRef(now());
  const submitted = useRef(false);
  const over = left <= 0;

  useEffect(() => {
    if (over) return;
    const t = setInterval(() => {
      const elapsed = Math.floor((now() - startRef.current) / 1000);
      setLeft(Math.max(0, TIME - elapsed));
    }, 500);
    return () => clearInterval(t);
  }, [over, TIME]);

  const filled = useMemo(() => grid.flat().filter(Boolean).length, [grid]);
  const fillPct = Math.round((filled / (N * N)) * 100);
  const score = Math.max(0, fillPct * 10 + bonus - (easy ? 0 : moves * 2) - (TIME - left));

  useEffect(() => {
    if (!over || submitted.current) return;
    submitted.current = true;
    toast(`Time! Final score ${score}`);
    playWin();
    submitScore(merchantId, {
      game: "tiles",
      playerName: getDinerNick() || "Guest",
      score,
      detail: `${fillPct}% filled · ${bonus / ROW_BONUS} rows cleared`,
    });
  }, [over, score, merchantId, fillPct, bonus]);

  const cells = (p: Piece) => {
    let c = p.cells;
    for (let i = 0; i < rot % 4; i++) c = rotate(c);
    return c;
  };

  const place = (gx: number, gy: number) => {
    if (selIdx === null || over) return;
    const p = queue[selIdx];
    const targets = cells(p).map(([x, y]) => [gx + x, gy + y] as Cell);
    if (targets.some(([x, y]) => x < 0 || y < 0 || x >= N || y >= N || grid[y][x])) {
      setShakeCell(`${gx}-${gy}`);
      navigator.vibrate?.(60);
      toast("Doesn't fit there — rotate or try another spot");
      setTimeout(() => setShakeCell(null), 450);
      return;
    }
    let next = grid.map((r) => [...r]);
    for (const [x, y] of targets) next[y][x] = p.color;
    setLastPlaced(targets.map(([x, y]) => `${x}-${y}`));
    setTimeout(() => setLastPlaced([]), 350);

    const fullRows = next.map((r, i) => (r.every(Boolean) ? i : -1)).filter((i) => i >= 0);
    if (fullRows.length > 0) {
      setFlashRows(fullRows);
      setBonus((b) => b + fullRows.length * ROW_BONUS);
      setPopup(`+${fullRows.length * ROW_BONUS} row clear!`);
      navigator.vibrate?.([40, 40, 40]);
      setTimeout(() => {
        setFlashRows([]);
        setPopup(null);
      }, 900);
      next = next.map((r, i) => (fullRows.includes(i) ? Array<string | null>(N).fill(null) : r));
    }

    setGrid(next);
    setQueue((q) => q.map((qq, i) => (i === selIdx ? draw() : qq)));
    setSelIdx(null);
    setRot(0);
    setMoves((m) => m + 1);
  };

  const reset = (nextEasy = easy) => {
    setEasy(nextEasy);
    setGrid(emptyGrid());
    setQueue([draw(), draw(), draw()]);
    setMoves(0);
    setBonus(0);
    setSelIdx(null);
    setRot(0);
    startRef.current = now();
    setLeft(nextEasy ? 120 : 90);
    submitted.current = false;
  };

  return (
    <GameShell title="Polymorphic Tiles" howToPlay={HOW_TO}>
      <div className="mb-3 flex justify-center gap-1.5">
        {([true, false] as const).map((isEasy) => (
          <button
            key={String(isEasy)}
            onClick={() => reset(isEasy)}
            className={cn(
              "btn-press rounded-full px-4 py-1.5 text-xs font-semibold",
              easy === isEasy ? "bg-primary text-white" : "bg-white text-secondary-text border border-background-light",
            )}
          >
            {isEasy ? "Chill · 120s" : "Pro · 90s"}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between text-sm tabular-nums">
        <span className={cn("font-semibold", left <= 10 ? "text-red-500" : "text-primary")}>{left}s</span>
        <span className="text-secondary-text">{fillPct}% filled</span>
        <span className="font-semibold text-primary-text">score {score}</span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-background-light">
        <div
          className={cn("h-full rounded-full transition-all", left <= 10 ? "bg-red-500" : "bg-primary")}
          style={{ width: `${(left / TIME) * 100}%` }}
        />
      </div>

      <div className="relative">
        {popup && (
          <div className="pop-in pointer-events-none absolute inset-x-0 top-1/3 z-10 text-center">
            <span className="rounded-full bg-primary px-4 py-1.5 text-sm font-bold text-white">{popup}</span>
          </div>
        )}
        <div className="mx-auto mt-4 grid w-full max-w-[340px] grid-cols-8 gap-0.5 rounded-xl border border-background-light bg-white p-1.5">
          {grid.map((row, y) =>
            row.map((c, x) => (
              <button
                key={`${x}-${y}`}
                onClick={() => place(x, y)}
                aria-label={`Cell ${x + 1},${y + 1}`}
                className={cn(
                  "aspect-square rounded-[3px] transition-all",
                  flashRows.includes(y) && "scale-75 opacity-30",
                  lastPlaced.includes(`${x}-${y}`) && "place-pop",
                  shakeCell === `${x}-${y}` && "shake",
                )}
                style={{ background: c ?? "#EDE9F7" }}
              />
            )),
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-3">
        {queue.map((p, i) => (
          <button
            key={i}
            onClick={() => {
              setSelIdx(i);
              setRot(0);
            }}
            aria-label={`Piece ${i + 1}`}
            className={cn(
              "flex h-16 w-16 items-center justify-center rounded-xl border bg-white transition-all",
              selIdx === i ? "scale-105 border-primary ring-2 ring-primary/30" : "border-background-light",
            )}
          >
            <PiecePreview piece={p} rot={selIdx === i ? rot : 0} />
          </button>
        ))}
        <button
          onClick={() => setRot((r) => r + 1)}
          disabled={selIdx === null}
          className="btn-press flex h-16 w-12 flex-col items-center justify-center rounded-xl border border-background-light bg-white text-secondary-text disabled:opacity-40"
        >
          <RotateCw className="h-5 w-5" />
          <span className="mt-1 text-[10px]">90°</span>
        </button>
      </div>

      {over && (
        <div className="pop-in mt-5 rounded-2xl border border-primary/40 bg-primary-accent/40 p-5 text-center">
          <p className="font-display text-lg font-bold text-primary">Time! Score {score}</p>
          <p className="mt-1 text-sm text-secondary-text">
            {fillPct}% filled · {bonus / ROW_BONUS} rows cleared · {moves} moves · {easy ? "Chill" : "Pro"}
          </p>
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => reset()}
              className="btn-press flex-1 rounded-xl bg-primary py-3 text-sm font-semibold text-white"
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
