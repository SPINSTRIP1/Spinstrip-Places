import { cn } from "@/lib/utils";

interface ImpressionsStackProps {
  impressions: number;
  /** `light` sits on photography, `default` on the page background. */
  tone?: "default" | "light";
}

/** Brand tints for the stacked viewer bubbles. */
const BUBBLE_TINTS = ["#6932E2", "#9E76F8", "#CCBAF5", "#EBE2FF"];

const formatCount = (count: number) => {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}m`;
  if (count >= 1000) return `${(count / 1000).toFixed(count >= 10_000 ? 0 : 1)}k`;
  return count.toString();
};

/**
 * Compact "N people viewed this" indicator. The bubbles are brand tints
 * rather than avatars — the public endpoints return a count, not the
 * viewers, so showing stock faces would be inventing people.
 */
export default function ImpressionsStack({
  impressions,
  tone = "default",
}: ImpressionsStackProps) {
  const shell =
    tone === "light"
      ? "border-white/30 bg-white/15 text-white backdrop-blur-md"
      : "border-background-light bg-white/80 text-secondary-text backdrop-blur-sm";

  if (!impressions || impressions <= 0) {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-medium",
          shell,
        )}
      >
        No views yet
      </span>
    );
  }

  const bubbles = BUBBLE_TINTS.slice(0, Math.min(impressions, 4));

  return (
    <span
      className={cn(
        "inline-flex items-center gap-x-2 rounded-full border py-1.5 pl-2 pr-3 text-xs font-medium",
        shell,
      )}
    >
      <span className="flex items-center">
        {bubbles.map((tint, index) => (
          <span
            key={tint}
            style={{ backgroundColor: tint }}
            className={cn(
              "h-4 w-4 rounded-full border-2",
              tone === "light" ? "border-white/70" : "border-white",
              index > 0 && "-ml-1.5",
            )}
          />
        ))}
      </span>
      {formatCount(impressions)} {impressions === 1 ? "view" : "views"}
    </span>
  );
}
