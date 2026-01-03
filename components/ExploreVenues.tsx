"use client"
import { useState, useEffect } from "react"
import { Star, MapPin, Calendar, ChevronLeft, ChevronRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { getAllVenues } from "@/lib/data/events"
import Link from "next/link"

const venues = getAllVenues()

export default function ExploreVenues() {
  const [organizers, setOrganizers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentSlide, setCurrentSlide] = useState(0)
  const router = useRouter()

  // Configuration
  const venuesPerPage = 6 // 3 columns × 2 rows = 6 venues per slide
  const autoSlideInterval = 5000 // 5 seconds
  const totalPages = Math.ceil((organizers.length || 0) / venuesPerPage)

  useEffect(() => {
    async function fetchOrganizersVenue() {
      try {
        const res = await fetch("api/organizers/venues")
        if (!res.ok) throw new Error("Failed to get data")
        const data = await res.json()
        setOrganizers(data || [])
      } catch (err) {
        console.error("Error fetching organizer: ", err)
        setOrganizers([])
      } finally {
        setLoading(false)
      }
    }
    fetchOrganizersVenue()
  }, [])

  // Auto slide functionality
  useEffect(() => {
    if (totalPages <= 1) return

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalPages)
    }, autoSlideInterval)

    return () => clearInterval(interval)
  }, [totalPages])

  // Navigation functions
  const nextSlide = () => {
    if (totalPages <= 1) return
    setCurrentSlide((prev) => (prev + 1) % totalPages)
  }

  const prevSlide = () => {
    if (totalPages <= 1) return
    setCurrentSlide((prev) => (prev - 1 + totalPages) % totalPages)
  }

  const goToSlide = (index: number) => {
    if (totalPages <= 1 || index === currentSlide) return
    setCurrentSlide(index)
  }

  const handleVenueClick = (venue: (typeof venues)[number]) => {
    router.push(`/venue/${venue.id}`)
  }

  const getVenueImage = (venue: any) => {
    return venue.images?.[0] || "/city/c1.jpg"
  }

  if (loading) return <p className="text-center py-12">Loading venues...</p>

  // Get venues for current slide
  const startIdx = currentSlide * venuesPerPage
  const endIdx = startIdx + venuesPerPage
  const currentVenues = organizers.slice(startIdx, endIdx)

  return (
    <div className="w-full max-w-7xl mx-auto mb-12">
      <div>
        {/* Header with navigation buttons */}
        <div className="px-6 py-6 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-1">
              Explore Venues
            </h2>
          </div>
          
          {/* Navigation Buttons */}
          {/* {totalPages > 1 && (
            <div className="flex gap-2">
              <button
                onClick={prevSlide}
                className="bg-white/80 hover:bg-white border border-gray-300 
                           rounded-full p-2 shadow-md hover:shadow-lg transition-all 
                           disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={totalPages <= 1}
                aria-label="Previous venues"
              >
                <ChevronLeft className="w-5 h-5 text-gray-700" />
              </button>

              <button
                onClick={nextSlide}
                className="bg-white/80 hover:bg-white border border-gray-300 
                           rounded-full p-2 shadow-md hover:shadow-lg transition-all 
                           disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={totalPages <= 1}
                aria-label="Next venues"
              >
                <ChevronRight className="w-5 h-5 text-gray-700" />
              </button>
            </div>
          )} */}
        </div>

        {/* Venues Grid with Fade Effect */}
        <div className="p-2 relative">
          <div className="transition-opacity duration-500 ease-in-out">
            {/* First Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              {Array.from({ length: 3 }).map((_, colIndex) => {
                const venue = currentVenues[colIndex]
                return venue ? (
                  <VenueCard 
                    key={`${venue.id}-${currentSlide}-${colIndex}`}
                    venue={venue}
                    onClick={() => handleVenueClick(venue)}
                    getImage={getVenueImage}
                  />
                ) : (
                  <div key={`empty-${colIndex}`} className="h-0 opacity-0" /> // Empty placeholder
                )
              })}
            </div>

            {/* Second Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, colIndex) => {
                const venue = currentVenues[colIndex + 3]
                return venue ? (
                  <VenueCard 
                    key={`${venue.id}-${currentSlide}-${colIndex + 3}`}
                    venue={venue}
                    onClick={() => handleVenueClick(venue)}
                    getImage={getVenueImage}
                  />
                ) : (
                  <div key={`empty-${colIndex + 3}`} className="h-0 opacity-0" /> // Empty placeholder
                )
              })}
            </div>
          </div>

          {/* Pagination Dots */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              {Array.from({ length: totalPages }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    index === currentSlide
                      ? "bg-blue-600 w-8"
                      : "bg-gray-300 hover:bg-gray-400"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* View All Button */}
        <div className="text-center mt-8">
          <Link href="/venues">
            <button className="px-8 py-3 bg-[#002C71] text-white rounded-lg 
                             hover:bg-blue-700 transition-colors duration-200 
                             font-medium shadow-md hover:shadow-lg">
              View All
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}

// Separate VenueCard component for better organization
function VenueCard({ venue, onClick, getImage }: { 
  venue: any, 
  onClick: () => void,
  getImage: (venue: any) => string 
}) {
  return (
    <button
      onClick={onClick}
      className="group rounded-md p-3 bg-white transition-all duration-200 
                 hover:scale-105 shadow hover:shadow-lg text-left w-full h-full"
    >
      <div className="space-y-2">
        {/* Image */}
        <div className="h-[160px] rounded-md overflow-hidden relative">
          <img
            src={getImage(venue)}
            alt={venue.name}
            className="w-full h-full object-cover opacity-90 
                     group-hover:opacity-100 transition-opacity duration-200"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.src = "/city/c1.jpg"
            }}
          />
          {/* Event Count Badge */}
          {venue.eventCount > 0 && (
            <div className="absolute top-2 right-2 bg-blue-600 text-white 
                          px-2 py-1 rounded-full text-xs font-semibold flex items-center">
              <Calendar className="w-3 h-3 mr-1" />
              {venue.eventCount} events
            </div>
          )}
        </div>

        {/* Venue Info */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-bold text-sm text-black line-clamp-1">
              {venue.name}
            </h3>
            <div className="flex items-center">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 mr-1" />
              <span className="text-xs text-black font-medium">
                {venue.rating ?? "—"}
              </span>
              <span className="text-xs text-gray-600 ml-1">
                ({venue.reviewCount ?? 0})
              </span>
            </div>
          </div>

          <p className="text-xs text-gray-700 mb-1 line-clamp-1">
            {/* {venue.description || "No description available"} */}
          </p>
          <div className="flex justify-between items-center mt-2">
            {/* Left side: Location */}
            <div className="flex items-center max-w-[120px]">
              <MapPin className="w-3 h-3 mr-1 text-black flex-shrink-0" />
              <span className="text-xs text-black truncate">
                {venue.location?.city || "No address"}
              </span>
            </div>

            {/* Right side: Event count */}
            <div className="flex items-center text-xs text-gray-600">
              <Calendar className="w-3 h-3 mr-1" />
              <span>{venue.eventCount ?? 0} events</span>
            </div>
          </div>
        </div>
      </div>
    </button>
  )
}