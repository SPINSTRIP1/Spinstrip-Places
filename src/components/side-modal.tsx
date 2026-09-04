"use client";

import { X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface SideModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Shown in the sticky panel header. */
  title?: string;
  /** Muted line under the title. */
  subtitle?: string;
  className?: string;
}

/** Must match the exit animation duration in globals.css. */
const EXIT_MS = 280;

export default function SideModal({
  isOpen,
  onClose,
  children,
  title,
  subtitle,
  className,
}: SideModalProps) {
  // `rendered` only keeps the panel mounted through its slide-out. Everything
  // visible is derived straight from `isOpen`, and the slide-in is a CSS
  // keyframe that plays on insertion — so the panel is always painted in its
  // final position and can never get stuck off-screen behind a transparent,
  // click-blocking overlay.
  const [rendered, setRendered] = useState(isOpen);
  if (isOpen && !rendered) setRendered(true);

  useEffect(() => {
    if (isOpen) return;
    const id = setTimeout(() => setRendered(false), EXIT_MS);
    return () => clearTimeout(id);
  }, [isOpen]);

  // Held in a ref so the scroll lock below doesn't re-run every time the
  // parent passes a fresh inline `onClose`.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Escape closes the panel, and the page behind it stops scrolling while
  // the panel is open.
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  if (!rendered) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title ?? "Panel"}
      onClick={onClose}
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-end bg-primary-text/50 backdrop-blur-sm",
        isOpen ? "side-overlay-in" : "side-overlay-out",
      )}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className={cn(
          "scrollbar-hide relative flex h-screen w-full max-w-[94vw] flex-col overflow-y-auto rounded-l-3xl bg-white shadow-2xl lg:max-w-[720px]",
          isOpen ? "side-panel-in" : "side-panel-out",
          className,
        )}
      >
        <div className="sticky top-0 z-20 flex items-center gap-x-3 border-b border-background-light bg-white/95 px-3 py-3 backdrop-blur-md lg:px-4">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-background text-primary-text transition-colors hover:bg-background-light"
          >
            <X size={18} />
          </button>
          {(title || subtitle) && (
            <div className="min-w-0">
              {title && (
                <p className="truncate text-sm font-bold text-primary-text">
                  {title}
                </p>
              )}
              {subtitle && (
                <p className="truncate text-xs text-secondary-text">
                  {subtitle}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex-1 px-3 pb-3 pt-4 lg:px-4">{children}</div>
      </div>
    </div>
  );
}
