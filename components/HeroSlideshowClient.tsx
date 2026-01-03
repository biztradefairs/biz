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
  slug?: string | null
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

  // Truncate location if too long
  const truncateLocation = (text: string, maxLength: number = 28) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + "..."
  }

  // Generate slug from title if not available
  const eventSlug = event.slug || generateSlug(event.title)

  return (
    <Link href={`/event/${eventSlug}`}>
      <div className="flex-shrink-0 w-full sm:w-64 md:w-72 lg:w-80 h-[400px] md:h-[440px] lg:h-[480px] bg-[#F2F2F2] relative overflow-hidden group transition-all duration-300 ease-out snap-start hover:scale-105 hover:z-10 hover:shadow-2xl">
        <img
          src={event.bannerImage || event.images?.[0] || "/herosection-images/food.jpg"}
          alt={event.title}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-blue-950/90 via-blue-950/40 to-transparent group-hover:from-blue-950/95 group-hover:via-blue-950/50 transition-all duration-300"></div>

        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 transform transition-transform duration-300 group-hover:-translate-y-2">
          <div className="bg-white rounded-sm px-3 py-2 md:px-4 md:py-2 mb-3 md:mb-4 inline-block transform transition-transform duration-300 group-hover:scale-105">
            <div className="text-lg md:text-xl font-bold">
              {endDate ? `${date}-${endDate}` : date}
            </div>
            <div className="text-xs uppercase">{month} {year}</div>
          </div>

          <h3 className="text-lg md:text-xl font-bold text-white mb-2 line-clamp-2 min-h-[3.5rem] md:min-h-[3rem] transform transition-transform duration-300 group-hover:translate-y-1">
            {event.title}
          </h3>

          <div className="flex items-center text-white/80 text-sm truncate transform transition-transform duration-300 group-hover:translate-y-1">
            <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
            <span className="truncate">{truncateLocation(location)}</span>
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
    .replace(/-+$/, '')
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