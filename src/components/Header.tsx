"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export default function Header() {
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 12);
      if (y > lastY.current && y > 140) setHidden(true);
      else setHidden(false);
      lastY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`site-header fixed inset-x-0 top-0 z-40 flex w-full items-center justify-center px-2 pt-2 lg:px-4 ${
        hidden ? "header-hidden" : ""
      }`}
    >
      {/* liquid-glass pill — same navbar treatment as spinstrip.com */}
      <div
        className={`liquid-glass relative mx-auto flex h-16 w-full max-w-6xl items-center justify-between rounded-3xl px-4 py-3 sm:px-6 ${
          scrolled ? "shadow-[0_12px_40px_-18px_rgba(105,50,226,0.35)]" : ""
        }`}
      >
        <Link href="/" className="relative z-10 flex items-center gap-2.5">
          <Image
            src="/logo.png"
            alt="SpinStrip"
            width={1671}
            height={512}
            priority
            className="h-6 w-auto sm:h-7"
            draggable={false}
          />
          <span className="rounded-full border border-neutral-accent bg-primary-accent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-[#6932E2]">
            Business
          </span>
        </Link>
        <nav className="relative z-10 flex items-center gap-3">
          <a
            href="https://spinstrip.com/"
            target="_blank"
            rel="noreferrer"
            className="hidden text-sm font-medium text-[#6F6D6D] transition-colors hover:text-[#0F0F0F] sm:block"
          >
            About SpinStrip
          </a>
          <a
            href="https://merchant.spinstrip.com/"
            target="_blank"
            rel="noreferrer"
            className="btn-press group flex items-center gap-1.5 rounded-3xl bg-[#6932E2] px-4 py-2 text-xs font-bold text-white shadow-[0_8px_28px_-8px_rgba(105,50,226,0.7)] hover:bg-[#7C4BE8] sm:text-sm"
          >
            List your business
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
        </nav>
      </div>
    </header>
  );
}
