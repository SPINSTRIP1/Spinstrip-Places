import Image from 'next/image'
import { ArrowUpRight } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="relative mt-20 border-t border-violet-100 bg-white/60 pb-28 pt-12 backdrop-blur-sm sm:pb-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-8 sm:flex-row sm:items-center">
          <div>
            <Image src="/logo.png" alt="SpinStrip" width={1671} height={512} className="h-7 w-auto" draggable={false} />
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-[#6b6480]">
              SpinStrip Places helps small and medium businesses get found — list your
              place, host events and publish your menu where customers are already looking.
            </p>
          </div>
          <a
            href="https://places.spinstrip.com/"
            target="_blank"
            rel="noreferrer"
            className="btn-press group flex items-center gap-2 rounded-full border border-violet-300 bg-violet-50 px-5 py-3 text-sm font-semibold text-violet-700 hover:bg-violet-100"
          >
            Open the Merchant Suite
            <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
        </div>
        <div className="mt-10 flex flex-col gap-3 border-t border-violet-100 pt-6 text-xs text-[#8a82a0] sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 SpinStrip. Discover what moves you.</span>
          <div className="flex gap-5">
            <a href="https://spinstrip.com/" target="_blank" rel="noreferrer" className="transition-colors hover:text-[#1c1533]">About</a>
            <a href="https://places.spinstrip.com/" target="_blank" rel="noreferrer" className="transition-colors hover:text-[#1c1533]">Merchant login</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
