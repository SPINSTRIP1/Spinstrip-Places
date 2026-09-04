"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CheckoutStepsProps {
  /** 1-based index of the active step. */
  current: number;
  steps: string[];
  /** Jump back to an already-completed step. */
  onStepClick?: (step: number) => void;
}

/**
 * Two-step progress header shared by the place and event checkouts, so a
 * customer always knows how far they are and can step back.
 */
export default function CheckoutSteps({
  current,
  steps,
  onStepClick,
}: CheckoutStepsProps) {
  return (
    <ol className="flex items-center gap-x-2">
      {steps.map((label, index) => {
        const step = index + 1;
        const isDone = step < current;
        const isActive = step === current;
        const canGo = isDone && !!onStepClick;

        return (
          <li key={label} className="flex flex-1 items-center gap-x-2">
            <button
              type="button"
              disabled={!canGo}
              onClick={() => canGo && onStepClick?.(step)}
              className={cn(
                "flex min-w-0 flex-1 items-center gap-x-2 rounded-full border px-3 py-2 transition-colors",
                isActive && "border-primary bg-primary-accent/50",
                isDone && "border-primary/30 bg-white",
                !isActive && !isDone && "border-background-light bg-white",
                canGo && "hover:bg-primary-accent/40",
              )}
            >
              <span
                className={cn(
                  "grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] font-bold",
                  isActive || isDone
                    ? "bg-primary text-white"
                    : "bg-background-light text-secondary-text",
                )}
              >
                {isDone ? <Check size={12} strokeWidth={3} /> : step}
              </span>
              <span
                className={cn(
                  "truncate text-xs font-bold",
                  isActive ? "text-primary" : "text-secondary-text",
                )}
              >
                {label}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
