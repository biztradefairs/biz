import { headers } from 'next/headers'
import HeroSlideshowClient from "./HeroSlideshowClient"

export const revalidate = 60

export default async function HeroSlideshow() {
  let events = []
  
  try {
    // Get the host from headers to construct the URL
    const headersList = await headers()
    const host = headersList.get('host')
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
    
    const res = await fetch(`${protocol}://${host}/api/events/vip`, {
      next: { revalidate: 60 }
    })

    if (res.ok) {
      const data = await res.json()
      events = data.events.map((event: any) => ({
        ...event,
        startDate: new Date(event.startDate).toISOString(),
        endDate: event.endDate ? new Date(event.endDate).toISOString() : null
      }))
    }
  } catch (error) {
    console.error("Error fetching VIP events:", error)
  }

  return <HeroSlideshowClient initialEvents={events} />
}