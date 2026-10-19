"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { isMerchantPreview } from "@/lib/merchant-preview";
import { cn } from "@/lib/utils";

interface BackLinkProps {
  href?: string;
  label?: string;
  className?: string;
}

/**
 * Back to the storefront from a detail page. Hidden inside the merchant
 * dashboard's preview modal, where it would load the storefront in the frame.
 */
export default function BackLink({ href = "/", label = "Back", className }: BackLinkProps) {
  // Framing is only known in the browser, so the first render matches the server's.
  const [framed, setFramed] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading window after hydration
    setFramed(isMerchantPreview());
  }, []);

  if (framed) return null;

  return (
    <Link
      href={href}
      className={cn(
        "inline-flex shrink-0 items-center gap-x-1.5 text-sm font-bold text-secondary-text transition-colors hover:text-primary",
        className,
      )}
    >
      <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
      {label}
    </Link>
  );
}
