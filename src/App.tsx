import { useEffect, useState } from 'react'
import RestaurantPage from '@/components/restaurant/RestaurantPage'
import { RESTAURANTS } from '@/data/restaurants'
import Home from '@/pages/Home'

export default function App() {
  const [restaurantId, setRestaurantId] = useState<string | null>(null)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [restaurantId])

  const restaurant = restaurantId
    ? RESTAURANTS.find((r) => r.id === restaurantId) ?? null
    : null

  return restaurant ? (
    <RestaurantPage restaurant={restaurant} onBack={() => setRestaurantId(null)} />
  ) : (
    <Home onOpenRestaurant={setRestaurantId} />
  )
}
