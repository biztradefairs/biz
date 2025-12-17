"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Calendar, UserPlus, Users, ChevronLeft, ChevronRight } from "lucide-react"

export interface Venue {
  id: string
  venueName: string
  venueCity: string
  venueCountry: string
  venueState?: string
  venueAddress?: string
}

export interface Event {
  id: string
  title: string
  leads: string
  bannerImage?: string
  logo?: string
  edition?: string
  categories?: string[]
  followers?: number
  startDate: string
  endDate?: string
  venueId?: string
  venue?: Venue
  location?: {
    city: string
    venue?: string
    country?: string
    address?: string
  }
  slug?: string
}

export default function EventReviews() {
  const [currentMonthEvents, setCurrentMonthEvents] = useState<Event[]>([])
  const [visitorCounts, setVisitorCounts] = useState<Record<string, number>>({})
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAutoScrolling, setIsAutoScrolling] = useState(true)
  const autoScrollRef = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()

  const isEventInCurrentMonth = (event: Event): boolean => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    
    const eventStartDate = new Date(event.startDate)
    const eventEndDate = event.endDate ? new Date(event.endDate) : eventStartDate
    
    // Check if event occurs during the current month
    return (
      (eventStartDate.getMonth() === currentMonth && eventStartDate.getFullYear() === currentYear) ||
      (eventEndDate.getMonth() === currentMonth && eventEndDate.getFullYear() === currentYear) ||
      (eventStartDate <= now && eventEndDate >= now)
    )
  }

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch("/api/events")
        const data = await response.json()
        
        if (data.events && Array.isArray(data.events)) {
          const eventsWithLocation = data.events.map((event: Event) => ({
            ...event,
            location: event.venue
              ? {
                  venue: event.venue.venueName,
                  city: event.venue.venueCity,
                  country: event.venue.venueCountry,
                  address: event.venue.venueAddress,
                }
              : undefined,
          }))
          
          // Filter events to only show current month events
          const currentMonthOnly = eventsWithLocation.filter(isEventInCurrentMonth)
          
          // Always show exactly 4 cards, duplicate if needed
          let limitedEvents = currentMonthOnly.slice(0, 4)
          
          // If we have less than 4 events in current month, pad with random events
          if (limitedEvents.length < 4 && eventsWithLocation.length > 0) {
            const needed = 4 - limitedEvents.length
            const randomEvents = eventsWithLocation
              .filter((e: Event) => !limitedEvents.some((le: Event) => le.id === e.id))
              .sort(() => 0.5 - Math.random())
              .slice(0, needed)
            limitedEvents = [...limitedEvents, ...randomEvents]
          }
          
          setCurrentMonthEvents(limitedEvents)
        }
      } catch (error) {
        console.error("Error fetching events:", error)
      }
    }
    fetchEvents()
  }, [])

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem("visitorCounts") : null
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, number>
        setVisitorCounts(parsed)
      }
    } catch {
      // ignore parse errors
    }
  }, [])

  // Auto-scroll functionality
  useEffect(() => {
    const startAutoScroll = () => {
      if (currentMonthEvents.length <= 1 || !isAutoScrolling) return
      
      autoScrollRef.current = setInterval(() => {
        setCurrentSlide((prevSlide) => {
          const nextSlide = (prevSlide + 1) % currentMonthEvents.length
          return nextSlide
        })
      }, 3000) // Change slide every 3 seconds
    }

    if (isAutoScrolling && currentMonthEvents.length > 1) {
      startAutoScroll()
    }

    return () => {
      if (autoScrollRef.current) {
        clearInterval(autoScrollRef.current)
      }
    }
  }, [currentMonthEvents.length, isAutoScrolling])

  const handlePrevClick = () => {
    setIsAutoScrolling(false)
    setCurrentSlide((prevSlide) => {
      return prevSlide === 0 ? currentMonthEvents.length - 1 : prevSlide - 1
    })
    
    // Resume auto-scroll after 10 seconds
    setTimeout(() => setIsAutoScrolling(true), 10000)
  }

  const handleNextClick = () => {
    setIsAutoScrolling(false)
    setCurrentSlide((prevSlide) => {
      return (prevSlide + 1) % currentMonthEvents.length
    })
    
    // Resume auto-scroll after 10 seconds
    setTimeout(() => setIsAutoScrolling(true), 10000)
  }

  const handleVisitClick = (e: React.MouseEvent<HTMLButtonElement>, event: Event, index: number) => {
    e.preventDefault()
    e.stopPropagation()
    const id = event.id || String(index)
    setVisitorCounts((prev) => {
      const next = { ...prev, [id]: (prev[id] || 0) + 1 }
      try {
        localStorage.setItem("visitorCounts", JSON.stringify(next))
      } catch {
        // ignore storage errors
      }
      return next
    })
    alert("Thank you for showing interest in this event!")
  }

  const handleCardClick = (event: Event) => {
    router.push(`/event/${event.id}`)
  }

  const formatFollowers = (num: number) => {
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M"
    if (num >= 1_000) return (num / 1_000).toFixed(1) + "K"
    return num.toString()
  }

  // Get events for the current slide
  const getEventsForCurrentSlide = (): Event[] => {
    if (currentMonthEvents.length === 0) return []
    
    // For now, just return the first 4 events
    // In a real implementation, you might want to show different sets
    return currentMonthEvents.slice(0, 4)
  }

  return (
    <section className="py-12 px-6 bg-white max-w-6xl mx-auto">
      {/* Heading */}
      <div className="text-center mb-10">
        <h2 className="text-2xl md:text-3xl font-bold text-[#0A2B61]">
          We are the world's largest eventgoer community
        </h2>
        <p className="text-gray-600 mt-2">Every minute 570 people are finding new opportunities at events</p>
      </div>

      {/* Carousel container */}
      {currentMonthEvents.length > 0 && (
        <div 
          className="relative"
          onMouseEnter={() => setIsAutoScrolling(false)}
          onMouseLeave={() => setIsAutoScrolling(true)}
        >
        

          {/* Cards grid - always shows 4 cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[15px] max-w-7xl mx-auto">
            {getEventsForCurrentSlide().map((event, index) => (
              <div
                key={`${currentSlide}-${event.id || index}`}
                className="bg-white shadow-md overflow-hidden hover:shadow-xl border border-gray-100 text-center cursor-pointer transition-all duration-300 hover:scale-105"
                onClick={() => handleCardClick(event)}
                role="button"
                tabIndex={0}
                onKeyDown={(e: React.KeyboardEvent) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleCardClick(event)
                  }
                }}
              >
                {/* Gradient Top Banner */}
                <div className="relative h-40 w-full overflow-hidden">
                  <img
                    src={event.logo || event.bannerImage || "/herosection-images/food.jpg"}
                    alt={`${event.title} logo`}
                    className="absolute inset-0 w-full h-full object-cover"
                  />

                  {/* Edition Tag */}
                  <div className="absolute top-2 left-2 flex items-center z-10">
                    <span className="bg-red-600 text-white text-sm font-bold px-1.5 py-0.5 rounded-sm mr-1">
                      {event.edition || "2 Edition"}
                    </span>
                  </div>

                  {/* Categories */}
                  <div className="absolute top-2 right-2 flex gap-2 z-10">
                    {event.categories?.slice(0, 2).map((cat, idx) => (
                      <span
                        key={idx}
                        className="bg-white text-gray-700 text-xs px-2 py-0.5 rounded-full shadow-sm"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex justify-center items-center gap-4 mb-3">
                    <span className="text-gray-700 text-sm flex items-center gap-1">
                      <Users size={18} className="text-gray-500" />
                      {formatFollowers(visitorCounts[event.id] || 0)} Followers
                    </span>

                    <button
                      className="flex items-center bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm shadow-sm"
                      aria-label="Save event"
                      onClick={(e) => handleVisitClick(e, event, index)}
                    >
                      <UserPlus className="w-4 h-4 mr-1" />
                      Save
                    </button>
                  </div>

                  <h3 className="font-extrabold text-base text-black line-clamp-2 min-h-[2.5rem]">
                    {event.title || "DIEMEX 2025"}
                  </h3>

                  {/* Updated location display with address */}
                  <p className="flex justify-center items-center font-bold text-gray-700 text-xs mt-1 text-center line-clamp-2 min-h-[2rem]">
                    {event.location?.venue ? `${event.location.venue}, ` : ""}
                    {event.location?.city}, {event.location?.country}
                  </p>

                  {/* Display address if available */}
                  {event.location?.address && (
                    <p className="text-gray-600 text-xs mt-1 line-clamp-2">{event.location.address}</p>
                  )}

                  <p className="flex justify-center items-center text-gray-900 font-bold mt-2 text-sm">
                    <Calendar className="w-4 h-4 mr-1 text-gray-600" />
                    {new Date(event.startDate).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                    {event.endDate
                      ? ` - ${new Date(event.endDate).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}`
                      : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Carousel indicators (hidden - removed from UI) */}
          {/* Navigation dots are hidden as requested */}
        </div>
      )}

      {/* Fallback message if no current month events */}
      {currentMonthEvents.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">
            No events scheduled for this month. Check back soon for upcoming events!
          </p>
        </div>
      )}
    </section>
  )
}