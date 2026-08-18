import Link from 'next/link'
import AuroraBackground from '@/components/AuroraBackground'
import { Compass } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <AuroraBackground />
      <Compass className="h-10 w-10 text-violet-400" />
      <h1 className="font-display mt-4 text-3xl font-bold text-[#1c1533]">
        We couldn&apos;t find that spot
      </h1>
      <p className="mt-2 max-w-sm text-sm text-[#6b6480]">
        The page you were looking for has moved, closed or never existed.
      </p>
      <Link
        href="/"
        className="btn-press mt-6 rounded-full bg-[#8c34ea] px-6 py-3 text-sm font-semibold text-white hover:bg-[#9b46f0]"
      >
        Back to discovery
      </Link>
    </div>
  )
}
