import { HugeiconsIcon } from "@hugeicons/react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface InfoRowProps {
  // Hugeicons' icon objects are loosely typed in the free package.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any;
  label: string;
  value?: string | null;
  /** When set the whole row becomes a link (tel:, mailto:, https:). */
  href?: string;
  className?: string;
}

/**
 * Address / phone / email / website row used in the contact card on both
 * previews. Renders a muted "Not provided" rather than an empty line when
 * the merchant left the field blank.
 */
export default function InfoRow({
  icon,
  label,
  value,
  href,
  className,
}: InfoRowProps) {
  const hasValue = !!value && value.trim().length > 0;
  const Wrapper = hasValue && href ? "a" : "div";

  return (
    <Wrapper
      {...(hasValue && href
        ? {
            href,
            target: href.startsWith("http") ? "_blank" : undefined,
            rel: href.startsWith("http") ? "noreferrer" : undefined,
          }
        : {})}
      className={cn(
        "flex items-center justify-between gap-x-3 rounded-2xl px-2 py-2.5 transition-colors",
        hasValue && href && "hover:bg-primary-accent/40",
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-x-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-primary shadow-xs">
          <HugeiconsIcon icon={icon} size={20} color="currentColor" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-secondary-text">
            {label}
          </p>
          <p
            className={cn(
              "truncate text-sm",
              hasValue ? "text-primary-text" : "italic text-neutral-accent",
            )}
          >
            {hasValue ? value : "Not provided"}
          </p>
        </div>
      </div>
      {hasValue && href && (
        <ChevronRight size={18} className="shrink-0 text-neutral-accent" />
      )}
    </Wrapper>
  );
}
