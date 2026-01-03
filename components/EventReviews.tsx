"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Calendar, Users } from "lucide-react"

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
    // Format with commas for thousands (like 110,773)
    return num.toLocaleString('en-US')
  }

  // Get events for the current slide
  const getEventsForCurrentSlide = (): Event[] => {
    if (currentMonthEvents.length === 0) return []
    
    // For now, just return the first 4 events
    // In a real implementation, you might want to show different sets
    return currentMonthEvents.slice(0, 4)
  }

  return (
    <section className="py-12 px-4 max-w-7xl mx-auto">
      {/* Heading */}
      <div className="text-center mb-10">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
          Trending Upcoming Events
        </h2>
        <p className="text-gray-600 max-w-3xl mx-auto">
          Connecting the global B2B trade fair community—where new business opportunities begin every minute.
        </p>
      </div>

      {/* Carousel container */}
      {currentMonthEvents.length > 0 && (
        <div 
          className="relative"
          onMouseEnter={() => setIsAutoScrolling(false)}
          onMouseLeave={() => setIsAutoScrolling(true)}
        >
          {/* Cards grid - always shows 4 cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {getEventsForCurrentSlide().map((event, index) => {
              // Use event.followers if available, otherwise use visitorCounts with a base
              const baseFollowers = event.followers || 110773
              const extraFollowers = visitorCounts[event.id] || 0
              const totalFollowers = baseFollowers + extraFollowers
              const formattedFollowers = formatFollowers(totalFollowers)
              
              return (
                <div
                  key={`${currentSlide}-${event.id || index}`}
                  className="bg-white border border-gray-200 rounded-lg overflow-hidden cursor-pointer hover:border-gray-300 transition-colors duration-200"
                  onClick={() => handleCardClick(event)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e: React.KeyboardEvent) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      handleCardClick(event)
                    }
                  }}
                >
                  {/* Image Container */}
                  <div className="relative h-48 w-full bg-gray-100 overflow-hidden">
                    <img
                      src={event.logo || event.bannerImage || "/herosection-images/food.jpg"}
                      alt={`${event.title} logo`}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Date Badge */}
                    <div className="absolute top-3 left-3">
                      <div className="flex items-center bg-white px-3 py-1.5 rounded shadow-sm">
                        <Calendar className="w-4 h-4 text-gray-600 mr-2" />
                        <span className="text-sm font-medium text-gray-800">
                          {new Date(event.startDate).toLocaleDateString("en-GB", {
                            day: "2-digit",
                          })}
                          {event.endDate
                            ? ` - ${new Date(event.endDate).toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}`
                            : ""}
                        </span>
                      </div>
                    </div>

                    {/* Categories - Optional */}
                    {/* <div className="absolute top-3 right-3 flex gap-2">
                      {event.categories?.slice(0, 2).map((cat, idx) => (
                        <span
                          key={idx}
                          className="bg-white text-gray-700 text-xs px-2 py-1 rounded"
                        >
                          {cat}
                        </span>
                      ))}
                    </div> */}
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    {/* Event Title */}
                    <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                      {event.title || "Event Title"}
                    </h3>

                    {/* Location */}
                    <div className="flex items-center mb-4">
                      <svg className="w-4 h-4 text-gray-400 mr-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                      </svg>
                      <p className="text-gray-600 text-sm">
                        {event.location?.venue ? `${event.location.venue}, ` : ""}
                        {event.location?.city}
                      </p>
                    </div>

                    {/* Display address if available */}
                    {/* {event.location?.address && (
                      <div className="mb-4">
                        <p className="text-gray-600 text-xs line-clamp-2 pl-6">{event.location.address}</p>
                      </div>
                    )} */}

                    {/* Followers Section */}
                    <div className="pt-4 border-t border-gray-100">
                      <div className="flex items-center">
                        <Users className="w-4 h-4 text-gray-500 mr-2" />
                        <div>
                          <span className="text-gray-900 font-semibold">
                            {formattedFollowers}
                          </span>
                          <span className="text-gray-500 text-sm ml-1">Followers</span>
                        </div>
                      </div>
                      
                      {/* Save button - Optional */}
                      {/* <div className="mt-4">
                        <button
                          className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium"
                          aria-label="Save event"
                          onClick={(e) => handleVisitClick(e, event, index)}
                        >
                          <UserPlus className="w-4 h-4 mr-2" />
                          Save Event
                        </button>
                      </div> */}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Carousel indicators (hidden - removed from UI) */}
          {/* Navigation dots are hidden as requested */}
        </div>
      )}

      {/* Fallback message if no current month events */}
      {currentMonthEvents.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600">
            No events scheduled for this month. Check back soon for upcoming events!
          </p>
        </div>
      )}
    </section>
  )
}