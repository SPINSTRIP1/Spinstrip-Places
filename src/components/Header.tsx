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
      className={`site-header fixed inset-x-0 top-0 z-40 ${
        hidden ? "header-hidden" : ""
      } ${
        scrolled
          ? "border-b border-violet-100 bg-white/80 shadow-[0_4px_30px_-12px_rgba(140,52,234,0.18)] backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/logo.png"
            alt="SpinStrip"
            width={1671}
            height={512}
            priority
            className="h-6 w-auto sm:h-7"
            draggable={false}
          />
          <span className="rounded-full border border-violet-300 bg-violet-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-violet-600">
            Business
          </span>
        </Link>
        <nav className="flex items-center gap-3">
          <a
            href="https://spinstrip.com/"
            target="_blank"
            rel="noreferrer"
            className="hidden text-sm font-medium text-[#6b6480] transition-colors hover:text-[#1c1533] sm:block"
          >
            About SpinStrip
          </a>
          <a
            href="https://merchant.spinstrip.com/"
            target="_blank"
            rel="noreferrer"
            className="btn-press group flex items-center gap-1.5 rounded-full bg-[#8c34ea] px-4 py-2 text-xs font-semibold text-white shadow-[0_8px_28px_-8px_rgba(140,52,234,0.7)] hover:bg-[#9b46f0] sm:text-sm"
          >
            List your business
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
        </nav>
      </div>
    </header>
  );
}
