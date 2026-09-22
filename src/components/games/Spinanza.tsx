"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import GameShell, { useGameContext } from "@/components/games/GameShell";
import { avatarColor, getDinerNick, submitScore } from "@/lib/smart-menu";
import { playWin } from "@/lib/sound";
import { cn } from "@/lib/utils";

const HOW_TO = [
  "2–4 players pass the phone and take turns spinning the wheel.",
  "The wheel grants castle pieces: foundation, walls, towers, roof, flag — or a surprise.",
  "“Any piece” fills your next missing part. “Lose a piece” drops one at random. “Spin again” gives another turn.",
  "First player to complete all 7 castle parts wins. Fewer spins = higher score.",
];

const PARTS = ["foundation", "wall", "wall", "tower", "tower", "roof", "flag"] as const;
type Part = (typeof PARTS)[number];

const WHEEL = [
  { label: "+ Wall", give: "wall" as Part },
  { label: "+ Tower", give: "tower" as Part },
  { label: "+ Roof", give: "roof" as Part },
  { label: "+ Foundation", give: "foundation" as Part },
  { label: "+ Flag", give: "flag" as Part },
  { label: "+ Wall 2", give: "wall" as Part },
  { label: "Any piece", give: "any" as const },
  { label: "Lose a piece", give: "lose" as const },
  { label: "Any 2nd", give: "any" as const },
  { label: "Spin again", give: "again" as const },
];

type Player = { name: string; parts: Part[]; spins: number };

function castleDone(p: Player) {
  const need: Record<string, number> = {};
  for (const part of PARTS) need[part] = (need[part] ?? 0) + 1;
  for (const part of p.parts) need[part] -= 1;
  return Object.values(need).every((n) => n <= 0);
}

/** Progressive castle — parts appear as they're earned. */
function Castle({ parts, color }: { parts: Part[]; color: string }) {
  const count = (p: Part) => parts.filter((x) => x === p).length;
  const has = (p: Part, n = 1) => count(p) >= n;
  return (
    <svg viewBox="0 0 100 90" className="bounce-in mx-auto h-24 w-full">
      <ellipse cx="50" cy="84" rx="34" ry="4" fill="#EDE9F7" />
      {has("foundation") && <rect x="22" y="72" width="56" height="10" rx="2" fill={color} />}
      {has("wall", 1) && <rect x="28" y="56" width="18" height="16" rx="1.5" fill={color} opacity="0.85" />}
      {has("wall", 2) && <rect x="54" y="56" width="18" height="16" rx="1.5" fill={color} opacity="0.85" />}
      {has("tower", 1) && <rect x="22" y="38" width="14" height="34" rx="1.5" fill={color} opacity="0.7" />}
      {has("tower", 2) && <rect x="64" y="38" width="14" height="34" rx="1.5" fill={color} opacity="0.7" />}
      {has("roof") && <path d="M20 38 L29 26 L38 38 Z M62 38 L71 26 L80 38 Z" fill={color} />}
      {has("flag") && (
        <>
          <line x1="50" y1="56" x2="50" y2="22" stroke={color} strokeWidth="2" />
          <path d="M50 22 L64 26 L50 31 Z" fill={color} />
        </>
      )}
    </svg>
  );
}

export default function Spinanza() {
  const { merchantId, leaderboardTo } = useGameContext();
  const [players, setPlayers] = useState<Player[] | null>(null);
  const [names, setNames] = useState<string[]>(["Player 1", "Player 2"]);
  const [turn, setTurn] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [angle, setAngle] = useState(0);
  const [last, setLast] = useState<string | null>(null);
  const [winner, setWinner] = useState<number | null>(null);
  const angleRef = useRef(0);

  useEffect(() => {
    const nick = getDinerNick();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading browser storage after mount
    if (nick) setNames((n) => [nick, ...n.slice(1)]);
  }, []);

  const start = () => {
    setPlayers(names.map((n) => ({ name: n.trim() || "Player", parts: [], spins: 0 })));
    setTurn(0);
    setWinner(null);
    setLast(null);
  };

  const spin = () => {
    if (!players || spinning || winner !== null) return;
    setSpinning(true);
    setLast(null);
    const seg = Math.floor(Math.random() * WHEEL.length);
    const segAngle = 360 / WHEEL.length;
    const target = 360 * 6 + (360 - seg * segAngle - segAngle / 2);
    angleRef.current += target - (angleRef.current % 360);
    setAngle(angleRef.current);

    setTimeout(() => {
      const res = WHEEL[seg];
      const ps = players.map((p) => ({ ...p, parts: [...p.parts] }));
      const me = ps[turn];
      me.spins += 1;
      const msg = `${me.name}: ${res.label}`;
      if (res.give === "again") {
        setPlayers(ps);
        setLast(msg + " — go again!");
        toast("Free spin! 🎡");
        setSpinning(false);
        return;
      } else if (res.give === "lose") {
        if (me.parts.length > 0) {
          me.parts.splice(Math.floor(Math.random() * me.parts.length), 1);
          toast(`${me.name} lost a piece 😬`);
        } else {
          toast(`${me.name} had nothing to lose — lucky!`);
        }
      } else if (res.give === "any") {
        const missing = PARTS.filter(
          (pt) => me.parts.filter((x) => x === pt).length < PARTS.filter((x) => x === pt).length,
        );
        if (missing.length) {
          me.parts.push(missing[0]);
          toast.success(`${me.name} got a ${missing[0]}!`);
        }
      } else {
        me.parts.push(res.give);
        toast.success(`${me.name} got a ${res.give}!`);
      }
      navigator.vibrate?.(40);
      setPlayers(ps);
      if (castleDone(me)) {
        setWinner(turn);
        toast.success(`🏰 ${me.name} wins!`);
        playWin();
        submitScore(merchantId, {
          game: "spinanza",
          playerName: me.name,
          score: Math.max(10, 1000 - me.spins * 10),
          detail: `castle in ${me.spins} spins`,
        });
      } else {
        setTurn((turn + 1) % ps.length);
      }
      setLast(msg);
      setSpinning(false);
    }, 2600);
  };

  const segAngle = 360 / WHEEL.length;
  const wheelBg = useMemo(
    () =>
      `conic-gradient(${WHEEL.map(
        (_, i) => `${i % 2 ? "#F4F0FB" : "#EDE9F7"} ${i * segAngle}deg ${(i + 1) * segAngle}deg`,
      ).join(",")})`,
    [segAngle],
  );

  return (
    <GameShell title="Spin-to-Build" howToPlay={HOW_TO}>
      {!players ? (
        <div className="mt-4">
          <p className="text-sm text-secondary-text">
            Pass-and-play on one phone. Enter everyone&apos;s nickname — avatars and castles are drawn for each player.
          </p>
          <div className="mt-4 space-y-2">
            {names.map((n, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-2xl border border-background-light bg-white p-2.5 pl-3"
              >
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ background: avatarColor(n || `P${i + 1}`) }}
                >
                  {(n || `P${i + 1}`).slice(0, 1).toUpperCase()}
                </span>
                <input
                  value={n}
                  onChange={(e) => setNames(names.map((x, xi) => (xi === i ? e.target.value : x)))}
                  placeholder={`Player ${i + 1} nickname`}
                  className="h-10 flex-1 rounded-xl border border-background-light bg-background px-3 text-sm outline-none focus:border-primary"
                />
                {names.length > 2 && (
                  <button
                    onClick={() => setNames(names.filter((_, xi) => xi !== i))}
                    aria-label="Remove player"
                    className="px-2 text-lg text-secondary-text"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => names.length < 4 && setNames([...names, `Player ${names.length + 1}`])}
              disabled={names.length >= 4}
              className="btn-press flex-1 rounded-xl border border-background-light bg-white py-3 text-sm font-medium text-primary-text disabled:opacity-40"
            >
              + Add player ({names.length}/4)
            </button>
            <button
              onClick={start}
              className="btn-press flex-1 rounded-xl bg-primary py-3 text-sm font-semibold text-white shadow-[0_8px_28px_-8px_rgba(105,50,226,0.6)]"
            >
              Start game
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="relative mx-auto mt-2 h-56 w-56">
            <div className="absolute left-1/2 top-[-8px] z-10 -translate-x-1/2 text-lg text-primary">▼</div>
            <div
              className="h-full w-full rounded-full border-4 border-primary/20 transition-transform duration-[2400ms] ease-out"
              style={{ background: wheelBg, transform: `rotate(${angle}deg)` }}
            >
              {WHEEL.map((w, i) => (
                <span
                  key={i}
                  className="absolute left-1/2 top-1/2 origin-left text-[9px] font-medium text-primary-text/70"
                  style={{ transform: `rotate(${i * segAngle + segAngle / 2 - 90}deg) translateX(58px)`, width: 60 }}
                >
                  {w.label}
                </span>
              ))}
            </div>
            <div className="absolute inset-0 m-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
              SPIN
            </div>
          </div>

          {last && <p className="mt-3 text-center text-sm font-medium text-primary">{last}</p>}

          {winner === null ? (
            <button
              onClick={spin}
              disabled={spinning}
              className="btn-press mt-4 w-full rounded-2xl bg-primary py-4 font-semibold text-white shadow-[0_8px_28px_-8px_rgba(105,50,226,0.6)] disabled:opacity-50"
            >
              {spinning ? "Spinning…" : `${players[turn].name} — spin!`}
            </button>
          ) : (
            <div className="pop-in mt-4 rounded-2xl border border-primary/40 bg-primary-accent/40 p-5 text-center">
              <p className="font-display text-lg font-bold text-primary">
                🏰 {players[winner].name} completed the castle!
              </p>
              <p className="mt-1 text-sm text-secondary-text">{players[winner].spins} spins</p>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={start}
                  className="btn-press flex-1 rounded-xl bg-primary py-3 text-sm font-semibold text-white"
                >
                  Rematch
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

          <div className="mt-5 grid grid-cols-2 gap-3">
            {players.map((p, i) => (
              <div
                key={i}
                className={cn(
                  "rounded-2xl border bg-white p-3.5 transition-all",
                  winner === i
                    ? "border-primary bg-primary-accent/40"
                    : i === turn && winner === null
                      ? "border-primary ring-1 ring-primary/30"
                      : "border-background-light",
                )}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ background: avatarColor(p.name) }}
                  >
                    {p.name.slice(0, 1).toUpperCase()}
                  </span>
                  <p className="truncate text-sm font-semibold text-primary-text">
                    {p.name}
                    {i === turn && winner === null && (
                      <span className="ml-1 text-[10px] text-primary">← turn</span>
                    )}
                  </p>
                </div>
                <Castle key={p.parts.length} parts={p.parts} color={avatarColor(p.name)} />
                <p className="text-center text-[10px] tabular-nums text-secondary-text">
                  {p.parts.length}/{PARTS.length} parts · {p.spins} spins
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </GameShell>
  );
}
