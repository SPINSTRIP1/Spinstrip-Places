"use client";

import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CheckoutActionsProps {
  /** Primary button label — "Continue", "Pay ₦20,000", "Register". */
  submitLabel: string;
  onSubmit: () => void;
  submitDisabled?: boolean;
  loading?: boolean;
  loadingLabel?: string;
  /** Omit to render a single full-width primary action (step 1). */
  onBack?: () => void;
  /** Short line above the buttons, e.g. what's missing before continuing. */
  hint?: string;
}

/**
 * Sticky action bar pinned to the bottom of the checkout panel, so the
 * primary action is reachable without scrolling to the end of the form.
 */
export default function CheckoutActions({
  submitLabel,
  onSubmit,
  submitDisabled = false,
  loading = false,
  loadingLabel = "Processing...",
  onBack,
  hint,
}: CheckoutActionsProps) {
  return (
    <div className="sticky bottom-0 z-10 -mx-3 mt-2 border-t border-background-light bg-white/95 px-3 pb-2 pt-3 backdrop-blur-md lg:-mx-4 lg:px-4">
      {hint && (
        <p className="mb-2 text-center text-xs text-secondary-text">{hint}</p>
      )}
      <div className="flex items-center gap-x-3">
        {onBack && (
          <Button
            type="button"
            variant="secondary"
            size="lg"
            disabled={loading}
            onClick={onBack}
            className="btn-press w-[120px] shrink-0"
          >
            <ArrowLeft size={16} />
            Back
          </Button>
        )}
        <Button
          type="button"
          size="lg"
          disabled={submitDisabled || loading}
          onClick={onSubmit}
          className="btn-press flex-1"
        >
          {loading ? loadingLabel : submitLabel}
        </Button>
      </div>
    </div>
  );
}
