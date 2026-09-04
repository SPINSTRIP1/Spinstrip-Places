"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { MinusSignIcon, PlusSignIcon } from "@hugeicons/core-free-icons";

interface QuantityStepperProps {
  value: number;
  onChange: (delta: number) => void;
  min?: number;
  max?: number;
  label?: string;
}

/** −/+ control for ticket quantities. */
export default function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = Infinity,
  label = "Quantity",
}: QuantityStepperProps) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-white px-3 py-2">
      <span className="text-xs font-bold uppercase tracking-wide text-secondary-text">
        {label}
      </span>
      <div className="flex items-center gap-x-3">
        <button
          type="button"
          aria-label="Decrease quantity"
          onClick={() => onChange(-1)}
          disabled={value <= min}
          className="grid h-7 w-7 place-items-center rounded-full bg-background-light text-primary-text transition-colors hover:bg-neutral-accent disabled:cursor-not-allowed disabled:opacity-40"
        >
          <HugeiconsIcon icon={MinusSignIcon} size={14} color="currentColor" />
        </button>
        <span className="w-6 text-center text-sm font-bold text-primary-text">
          {value}
        </span>
        <button
          type="button"
          aria-label="Increase quantity"
          onClick={() => onChange(1)}
          disabled={value >= max}
          className="grid h-7 w-7 place-items-center rounded-full bg-background-light text-primary-text transition-colors hover:bg-neutral-accent disabled:cursor-not-allowed disabled:opacity-40"
        >
          <HugeiconsIcon icon={PlusSignIcon} size={14} color="currentColor" />
        </button>
      </div>
    </div>
  );
}
