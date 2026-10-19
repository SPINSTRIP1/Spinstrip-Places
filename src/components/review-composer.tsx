"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { StarIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { reviewErrorMessage, useSubmitReview } from "@/hooks/use-reviews";
import { getMyReview, setMyReview, type MyReview, type ReviewTarget } from "@/lib/reviews";
import { getKnownEmails } from "@/lib/smart-menu";
import { cn } from "@/lib/utils";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function StarRow({ value, size, onChange }: { value: number; size: number; onChange?: (stars: number) => void }) {
  return (
    <div className="flex items-center gap-x-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const icon = (
          <HugeiconsIcon
            icon={StarIcon}
            size={size}
            color={star <= value ? "#9E76F8" : "#C8C8C8"}
            fill={star <= value ? "#9E76F8" : "#C8C8C8"}
          />
        );
        return onChange ? (
          <button
            key={star}
            type="button"
            aria-label={`Rate ${star} star${star === 1 ? "" : "s"}`}
            aria-pressed={star === value}
            onClick={() => onChange(star)}
            className="btn-press rounded-full p-1"
          >
            {icon}
          </button>
        ) : (
          <span key={star}>{icon}</span>
        );
      })}
    </div>
  );
}

/**
 * Star rating + optional comment for a place, an event or a restaurant.
 * Guests aren't signed in, so the review carries the checkout email; the
 * service accepts it only if that email has a completed visit / ticket /
 * order, and the form says so when it doesn't.
 */
export default function ReviewComposer({
  target,
  title,
  description,
  defaultEmail,
  className,
}: {
  target: ReviewTarget;
  title: string;
  description: string;
  /** Prefill — e.g. the email just used at checkout. */
  defaultEmail?: string | null;
  className?: string;
}) {
  const [mine, setMine] = useState<MyReview | null>(null);
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");
  const [email, setEmail] = useState(defaultEmail ?? "");
  const submit = useSubmitReview(target);

  // Callers pass `target` inline, so key the effect on its parts.
  const { kind, id } = target;
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading browser storage after mount
    setMine(getMyReview({ kind, id } as ReviewTarget));
    if (!defaultEmail) setEmail((current) => current || getKnownEmails()[0] || "");
  }, [kind, id, defaultEmail]);

  const emailValid = EMAIL.test(email.trim());

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stars || !emailValid) return;
    submit.mutate(
      { stars, comment, email },
      {
        onSuccess: () => {
          const saved = { stars, comment: comment.trim() || undefined };
          setMyReview(target, saved);
          setMine(saved);
          toast.success("Thanks for your review!");
        },
        onError: (error) => toast.error(reviewErrorMessage(target.kind, error)),
      },
    );
  };

  return (
    <div className={cn("rounded-3xl border border-background-light bg-white p-4", className)}>
      <h3 className="text-sm font-bold text-primary-text">{title}</h3>
      {mine ? (
        <div className="mt-2 space-y-1">
          <StarRow value={mine.stars} size={18} />
          <p className="text-sm text-secondary-text">
            Thanks — your review is in{mine.comment ? `: “${mine.comment}”` : "."}
          </p>
        </div>
      ) : (
        <form onSubmit={onSubmit}>
          <p className="mt-1 text-sm text-secondary-text">{description}</p>
          <div className="mt-3">
            <StarRow value={stars} size={24} onChange={setStars} />
          </div>
          <Textarea
            value={comment}
            onChange={(event) => setComment(event.target.value.slice(0, 500))}
            placeholder="Tell others what it was like (optional)"
            className="mt-3 border-background-light bg-background"
            rows={4}
          />
          <Input
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email you booked or ordered with"
            aria-label="Email you booked or ordered with"
            className="mt-3 border-background-light bg-background"
          />
          <Button type="submit" className="mt-4" disabled={!stars || !emailValid || submit.isPending}>
            {submit.isPending ? "Sending…" : "Submit review"}
          </Button>
        </form>
      )}
    </div>
  );
}
