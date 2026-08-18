import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import RestaurantPage from '@/components/restaurant/RestaurantPage'
import { RESTAURANTS } from '@/data/restaurants'

interface PageProps {
  params: Promise<{ id: string }>
}

export function generateStaticParams() {
  return RESTAURANTS.map((r) => ({ id: r.id }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const restaurant = RESTAURANTS.find((r) => r.id === id)
  if (!restaurant) return { title: 'Restaurant not found' }

  return {
    title: restaurant.name,
    description: restaurant.tagline,
    openGraph: {
      title: `${restaurant.name} — SpinStrip Places`,
      description: restaurant.tagline,
      images: [{ url: restaurant.cover }],
    },
  }
}

export default async function Page({ params }: PageProps) {
  const { id } = await params
  const restaurant = RESTAURANTS.find((r) => r.id === id)
  if (!restaurant) notFound()

  return <RestaurantPage restaurant={restaurant} />
}
