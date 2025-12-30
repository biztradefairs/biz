"use client"

import Link from "next/link"
import { MapPin } from "lucide-react"
import HorizontalScroller from "@/components/HorizontalScroller"

interface Venue {
  venueCity?: string | null
  venueCountry?: string | null
}

interface Event {
  id: string
  title: string
  slug?: string | null // ADD THIS
  startDate: string
  endDate?: string | null
  bannerImage?: string | null
  images?: string[] | null
  venue?: Venue | null
}

const EventCard = ({ event }: { event: Event }) => {
  const start = new Date(event.startDate)
  const end = event.endDate ? new Date(event.endDate) : null

  const date = start.getDate()
  const endDate = end && end.getDate() !== date ? end.getDate() : null
  const month = start.toLocaleString("default", { month: "short" })
  const year = start.getFullYear()

  const location = event.venue
    ? [event.venue.venueCity, event.venue.venueCountry].filter(Boolean).join(", ")
    : "Venue coming soon"

  // Generate slug from title if not available
  const eventSlug = event.slug || generateSlug(event.title)

  return (
    <Link href={`/event/${eventSlug}`}>
      <div className="flex-shrink-0 w-80 h-[480px] bg-[#F2F2F2] relative overflow-hidden hover:shadow-xl transition snap-start">
        <img
          src={event.bannerImage || event.images?.[0] || "/herosection-images/food.jpg"}
          alt={event.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-blue-950 to-transparent"></div>

        <div className="absolute bottom-0 p-6">
          <div className="bg-white rounded-sm px-4 py-2 mb-4 inline-block">
            <div className="text-xl font-bold">
              {endDate ? `${date}-${endDate}` : date}
            </div>
            <div className="text-xs uppercase">{month} {year}</div>
          </div>

          <h3 className="text-xl font-bold text-white mb-2">{event.title}</h3>

          <div className="flex items-center text-white/80 text-sm">
            <MapPin className="w-4 h-4 mr-1" />
            {location}
          </div>
        </div>
      </div>
    </Link>
  )
}

// Helper function to generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

export default function HeroSlideshowClient({
  initialEvents
}: {
  initialEvents: Event[]
}) {
  if (!initialEvents.length) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-500">
        No VIP Events Found at the moment
      </div>
    )
  }

  return (
    <div className="bg-white">
      <div className="mx-auto px-4">
        <HorizontalScroller>
          {initialEvents.map(event => (
            <EventCard key={event.id} event={event} />
          ))}
        </HorizontalScroller>
      </div>
    </div>
  )
}