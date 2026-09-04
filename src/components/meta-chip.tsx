import React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@/lib/utils";

interface MetaChipProps {
  // Hugeicons' icon objects are loosely typed in the free package.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon?: any;
  children: React.ReactNode;
  /** `light` sits on photography, `default` on the page background. */
  tone?: "default" | "light" | "accent";
  className?: string;
}

/** Small icon + label pill used for location, hours, dates and categories. */
export default function MetaChip({
  icon,
  children,
  tone = "default",
  className,
}: MetaChipProps) {
  const tones = {
    default:
      "border-background-light bg-white/80 text-secondary-text backdrop-blur-sm",
    light: "border-white/30 bg-white/15 text-white backdrop-blur-md",
    accent: "border-transparent bg-primary-accent text-primary",
  } as const;

  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-x-1.5 rounded-full border px-3 py-1.5 text-xs font-medium",
        tones[tone],
        className,
      )}
    >
      {icon && (
        <HugeiconsIcon
          icon={icon}
          size={16}
          className="shrink-0"
          color="currentColor"
        />
      )}
      <span className="truncate">{children}</span>
    </span>
  );
}
