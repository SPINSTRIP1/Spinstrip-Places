import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Loader from "@/components/loader";
import AuroraBackground from "@/components/AuroraBackground";
import Jigsaw from "@/components/games/Jigsaw";
import Tiles from "@/components/games/Tiles";
import Spinanza from "@/components/games/Spinanza";
import Leaderboard from "@/components/games/Leaderboard";

const GAMES = {
  jigsaw: { title: "Restaurant Puzzle", Component: Jigsaw },
  tiles: { title: "Polymorphic Tiles", Component: Tiles },
  spinanza: { title: "Spin-to-Build", Component: Spinanza },
  leaderboard: { title: "Leaderboard", Component: Leaderboard },
} as const;

type GameKey = keyof typeof GAMES;

interface PageProps {
  params: Promise<{ game: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { game } = await params;
  const entry = GAMES[game as GameKey];
  return { title: entry ? `${entry.title} · Smart Menu` : "Game" };
}

/**
 * Wait-time games, reached from an order page with `?r=<merchant>&t=<table>&order=<id>`.
 * Each game reads those params itself, which is why the Suspense boundary sits here.
 */
export default async function GamePage({ params }: PageProps) {
  const { game } = await params;
  const entry = GAMES[game as GameKey];
  if (!entry) notFound();
  const { Component } = entry;

  return (
    <>
      <AuroraBackground />
      <Suspense fallback={<Loader label="Loading the game…" />}>
        <Component />
      </Suspense>
    </>
  );
}
