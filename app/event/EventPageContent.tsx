"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Star, Mail, MapPin, Clock, IndianRupee, Wifi, Utensils, Car, Tag, Trash2, Calendar, Users, Edit2, Plus, Share2, Bookmark } from "lucide-react"
import EventHero from "@/components/event-hero"
import EventImageGallery from "@/components/event-image-gallery"
import { useEffect, useState } from "react"
import ExhibitorsTab from "./[id]/exhibitors-tab"
import SpeakersTab from "./[id]/speakers-tab"
import AddReviewCard from "@/components/AddReviewCard"
import Link from "next/link"
import EventFollowers from "@/components/EventFollowers"

interface PlaceToVisit {
  name: string;
  category: string;
  image: string;
}

interface TicketType {
  name: string
  price: number
  currency: string
}

interface SpaceCost {
  type: string
  price: number
  currency: string
  description?: string
  minArea?: number
  unit?: string
  pricePerSqm?: number
}

interface EventPageContentProps {
  event: any
  session: any
  router: any
  toast: any
}

// Helper function to get company initials
const getCompanyInitials = (companyName?: string): string => {
  if (!companyName || companyName.trim() === "") return "EV";
  
  // Remove common suffixes and split by spaces
  const cleanedName = companyName
    .replace(/\b(Inc|LLC|Ltd|GmbH|Corp|Co)\b\.?/gi, '')
    .trim();
  
  // Get first two letters from first two words
  const words = cleanedName.split(/\s+/);
  
  if (words.length === 1) {
    // If only one word, take first two characters
    return words[0].substring(0, 2).toUpperCase();
  }
  
  // Take first character from first two words
  return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
};

export default function EventPageContent({ event, session, router, toast }: EventPageContentProps) {
  // ALL useState calls must be at the top, before any conditional logic
  const [isSaved, setIsSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [averageRating, setAverageRating] = useState(event.averageRating || 0)
  const [totalReviews, setTotalReviews] = useState(event.reviewCount || 0)
  const [featuredHotels, setFeaturedHotels] = useState<any[]>([])
  const [hotelsLoading, setHotelsLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [spaceCosts, setSpaceCosts] = useState<SpaceCost[]>([])
  const [isOrganizer, setIsOrganizer] = useState(false)

  useEffect(() => {
    // Set initial values from event
    setAverageRating(event.averageRating || 0)
    setTotalReviews(event.reviewCount || 0)
    
    // Fetch space costs if available
    if (event.id) {
      fetchSpaceCosts(event.id)
    }
    
    // Load featured hotels
    loadFeaturedHotels()
    
    // Check if event is saved and get user role
    if (event?.id && session?.user?.id) {
      checkIfSaved()
      checkUserRole()
      checkIfOrganizer()
    }
  }, [event.id, session?.user?.id])

  const getPlacesToVisit = (city: string): PlaceToVisit[] => {
    const placesByCity: Record<string, PlaceToVisit[]> = {
      "Paris": [
        { name: "Eiffel Tower", category: "Historical places", image: "/places/ifal.jpeg" },
        { name: "Louvre Museum", category: "Museum", image: "/places/ifal.jpeg" },
        { name: "Notre-Dame Cathedral", category: "Historical places", image: "/places/ifal.jpeg" }
      ],
      "Delhi": [
        { name: "Taj Mahal", category: "Historical places", image: "/places/ifal.jpeg" },
        { name: "Red Fort", category: "Historical places", image: "/places/ifal.jpeg" },
        { name: "Qutub Minar", category: "Historical places", image: "/places/ifal.jpeg" }
      ],
      "Sydney": [
        { name: "Sydney Opera House", category: "Beach", image: "/places/ifal.jpeg" },
        { name: "Bondi Beach", category: "Beach", image: "/places/ifal.jpeg" },
        { name: "Harbour Bridge", category: "Landmark", image: "/places/ifal.jpeg" }
      ],
      "New York": [
        { name: "Statue of Liberty", category: "Historical places", image: "/places/ifal.jpeg" },
        { name: "Central Park", category: "Park", image: "/places/ifal.jpeg" },
        { name: "Times Square", category: "Entertainment", image: "/places/ifal.jpeg" }
      ],
      "Tokyo": [
        { name: "Tokyo Tower", category: "Landmark", image: "/places/ifal.jpeg" },
        { name: "Senso-ji Temple", category: "Temple", image: "/places/ifal.jpeg" },
        { name: "Shibuya Crossing", category: "Landmark", image: "/places/ifal.jpeg" }
      ],
      "London": [
        { name: "Big Ben", category: "Historical places", image: "/places/ifal.jpeg" },
        { name: "London Eye", category: "Entertainment", image: "/places/ifal.jpeg" },
        { name: "Tower Bridge", category: "Historical places", image: "/places/ifal.jpeg" }
      ]
    };

    return placesByCity[city] || [
      { name: "Eiffel Tower", category: "Historical places", image: "/places/ifal.jpeg" },
      { name: "Taj Mahal", category: "Historical places", image: "/places/OIP.jpeg" },
      { name: "Sydney Opera House", category: "Beach", image: "/places/th.jpeg" }
    ];
  };

  const fetchSpaceCosts = async (eventId: string) => {
    try {
      const res = await fetch(`/api/events/${eventId}/space-costs`)
      if (res.ok) {
        const data = await res.json()
        if (data.success && Array.isArray(data.spaceCosts)) {
          setSpaceCosts(data.spaceCosts)
        } else {
          // Set default space costs if none available
          setSpaceCosts([
            { type: "Standard Booth", price: 5000, currency: "₹", description: "3x3 meter space" },
            { type: "Premium Booth", price: 8000, currency: "₹", description: "3x3 meter space with premium location" },
            { type: "VIP Booth", price: 12000, currency: "₹", description: "3x3 meter space with prime location" }
          ])
        }
      }
    } catch (error) {
      console.error("Error fetching space costs:", error)
      // Set default space costs on error
      setSpaceCosts([
        { type: "Standard Booth", price: 5000, currency: "₹", description: "3x3 meter space" },
        { type: "Premium Booth", price: 8000, currency: "₹", description: "3x3 meter space with premium location" },
        { type: "VIP Booth", price: 12000, currency: "₹", description: "3x3 meter space with prime location" }
      ])
    }
  }

  const loadFeaturedHotels = async () => {
    if (!event?.id) return
    setHotelsLoading(true)
    const demo: any[] = [
      {
        id: "demo-1",
        name: "Kanazawa Grand Inn Hotel",
        rating: 4.8,
        reviews: 1257,
        locationNote: "Excellent Location",
        price: 48,
        priceNote: "28%",
        dealLabel: "Deal",
        badgeText: "20% OFF",
        image: "/city/c2.jpg",
        amenities: ["Free Wifi", "Food", "Parking"],
      },
    ]
    try {
      const res = await fetch(`/api/featured-hotels?eventId=${event.id}`, { cache: "no-store" })
      if (!res.ok) throw new Error("Failed to load hotels")
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) {
        setFeaturedHotels(data)
      } else {
        setFeaturedHotels(demo)
      }
    } catch (err) {
      console.log("[v0] featured hotels fetch failed, using demo:", (err as Error).message)
      setFeaturedHotels(demo)
    } finally {
      setHotelsLoading(false)
    }
  }

  const checkIfSaved = async () => {
    try {
      const response = await fetch(`/api/events/${event.id}/save`)
      if (response.ok) {
        const data = await response.json()
        setIsSaved(data.isSaved)
      }
    } catch (error) {
      console.error("Error checking saved status:", error)
    }
  }

  const checkUserRole = () => {
    // Get user role from session
    if (session?.user) {
      const userWithRole = session.user as any
      setUserRole(userWithRole.role || null)
    }
  }

  const checkIfOrganizer = () => {
    if (session?.user && event?.organizer) {
      const userId = session.user.id
      const organizerId = event.organizer.id || event.organizer._id

      // Check if the logged-in user is the organizer of this event
      if (userId === organizerId) {
        setIsOrganizer(true)
      } else {
        setIsOrganizer(false)
      }
    } else {
      setIsOrganizer(false)
    }
  }

  const handleSaveEvent = async () => {
    if (!session) {
      alert("Please log in to save events")
      router.push("/login")
      return
    }

    setSaving(true)
    try {
      const method = isSaved ? "DELETE" : "POST"
      const response = await fetch(`/api/events/${event.id}/save`, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        setIsSaved(!isSaved)
        toast({
          title: isSaved ? "Event removed" : "Event saved",
          description: isSaved ? "Event removed from your saved list" : "Event added to your saved events",
        })
      }
    } catch (error) {
      console.error("Error saving event:", error)
      toast({
        title: "Error",
        description: "Failed to save event",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleVisitClick = async () => {
    if (!session) {
      alert("Authentication Required\nPlease log in to express interest in this event")
      router.push("/login")
      return
    }

    try {
      const response = await fetch(`/api/events/${event.id}/leads`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "attendee",
          userId: session.user.id,
          eventId: event.id,
        }),
      })

      if (response.ok) {
        alert("Your visit request has been sent to the organizer successfully!")
      } else {
        throw new Error("Failed to record interest")
      }
    } catch (error) {
      alert("Failed to record your interest. Please try again.")
    }
  }

  const handleExhibitClick = async () => {
    if (!session) {
      alert("Authentication Required\nPlease log in to express interest in exhibiting")
      router.push("/login")
      return
    }

    try {
      const response = await fetch(`/api/events/${event.id}/leads`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "exhibitor",
          userId: session.user.id,
          eventId: event.id,
        }),
      })

      if (response.ok) {
        alert("Your exhibition request has been sent to the organizer successfully!")
      } else {
        throw new Error("Failed to record interest")
      }
    } catch (error) {
      alert("Failed to record your interest. Please try again.")
    }
  }

  // Get address for map - same implementation as venue page
  const getMapAddress = () => {
    if (event?.venue?.location?.coordinates?.lat && event?.venue?.location?.coordinates?.lng) {
      return `${event.venue.location.coordinates.lat},${event.venue.location.coordinates.lng}`
    }
    return encodeURIComponent(event?.venue?.venueAddress || event?.location?.address || "")
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
  }

  const formatDateTimeRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)

    const isSameDay = start.toDateString() === end.toDateString()

    if (isSameDay) {
      return `${formatDate(startDate)}, ${formatTime(startDate)} - ${formatTime(endDate)}`
    } else {
      return `${formatDate(startDate)} ${formatTime(startDate)} - ${formatDate(endDate)} ${formatTime(endDate)}`
    }
  }

  // Get ticket price display
  const getTicketPriceDisplay = () => {
    if (!event.ticketTypes || event.ticketTypes.length === 0) {
      return "Free Entry"
    }

    const ticketTypes = event.ticketTypes as TicketType[]
    return ticketTypes.map(ticket =>
      `${ticket.name}: ${ticket.currency || '₹'}${ticket.price}`
    ).join(" | ")
  }

  // Don't show Visit and Exhibit buttons if the user is the organizer
  const showActionButtons = !isOrganizer

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <EventHero event={event} />

      <div className="max-w-7xl mx-auto py-4">
        <div className="bg-white rounded-sm p-6 mb-8 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">

            {/* LEFT SECTION */}
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-blue-900 mb-3">
                {event.title || "Event Title"}
              </h1>

              <div className="flex items-center gap-2 text-gray-600 mb-4">
                <MapPin className="w-4 h-4" />
                <span>{event?.venue?.venueAddress || event?.location?.address || "Location TBA"}</span>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                  onClick={() => {
                    const query = encodeURIComponent(event.venueAddress || "Location")
                    const address = getMapAddress()
                    window.open(
                      `https://www.google.com/maps/dir/?api=1&destination=${address}`,
                      "_blank",
                    )
                  }}
                >
                  <Plus className="w-4 h-4" />
                  Get Directions
                </Button>

                <div className="flex items-center text-sm">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="ml-1 font-medium">
                    {averageRating > 0 ? averageRating.toFixed(1) : "No ratings"}
                  </span>
                  {totalReviews > 0 && (
                    <span className="ml-1 text-gray-500">
                      ({totalReviews} review{totalReviews !== 1 ? "s" : ""})
                    </span>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSaveEvent}
                  disabled={saving}
                  className={`flex items-center gap-2 ${isSaved ? "text-blue-600" : ""}`}
                >
                  <Bookmark className={`w-4 h-4 ${isSaved ? "fill-current" : ""}`} />
                  {isSaved ? "Saved" : "Save"}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={() => {
                    if (navigator.share) {
                      navigator
                        .share({
                          title: event.title,
                          text: "Check out this event!",
                          url: window.location.href,
                        })
                        .catch((err) => console.error("Error sharing:", err))
                    } else {
                      alert("Sharing is not supported in this browser.")
                    }
                  }}
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </Button>
              </div>
            </div>

            {/* RIGHT SECTION - slightly shifted left */}
            {showActionButtons && (
              <div className="flex flex-col gap-4 lg:-ml-8">
                <p className="text-center lg:text-left text-gray-700 font-medium text-base sm:text-lg">
                  Interested in this Event?
                </p>

                <div className="flex gap-3 flex-col sm:flex-row sm:justify-start">
                  <Button
                    variant="outline"
                    className="sm:w-[180px] w-full border-gray-300 bg-transparent hover:bg-gray-50"
                    onClick={handleVisitClick}
                  >
                    Visit
                  </Button>

                  <Button
                    variant="outline"
                    className="sm:w-[180px] w-full border-blue-300 bg-transparent text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    onClick={handleExhibitClick}
                  >
                    Exhibit
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content - Left Side */}
          <div className="flex-1 min-w-0">
            <Tabs defaultValue="about" className="w-full">
              <div className="bg-white rounded-lg mb-6 shadow-sm border border-gray-200">
                <TabsList className="grid w-full grid-cols-10 h-auto p-0 bg-transparent">
                  <TabsTrigger
                    value="about"
                    className="data-[state=active]:bg-red-600 data-[state=active]:text-white rounded-none py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium truncate"
                  >
                    About
                  </TabsTrigger>
                  <TabsTrigger
                    value="exhibitors"
                    className="data-[state=active]:bg-red-600 data-[state=active]:text-white rounded-none py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium truncate"
                  >
                    Exhibitors
                  </TabsTrigger>
                  <TabsTrigger
                    value="space-cost"
                    className="data-[state=active]:bg-red-600 data-[state=active]:text-white rounded-none py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium truncate"
                  >
                    Space Cost
                  </TabsTrigger>
                  <TabsTrigger
                    value="layout"
                    className="data-[state=active]:bg-red-600 data-[state=active]:text-white rounded-none py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium truncate"
                  >
                    Layout Plan
                  </TabsTrigger>
                  <TabsTrigger
                    value="brochure"
                    className="data-[state=active]:bg-red-600 data-[state=active]:text-white rounded-none py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium truncate"
                  >
                    Brochure
                  </TabsTrigger>
                  <TabsTrigger
                    value="venue"
                    className="data-[state=active]:bg-red-600 data-[state=active]:text-white rounded-none py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium truncate"
                  >
                    Venue
                  </TabsTrigger>
                  <TabsTrigger
                    value="speakers"
                    className="data-[state=active]:bg-red-600 data-[state=active]:text-white rounded-none py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium truncate"
                  >
                    Speakers
                  </TabsTrigger>
                  <TabsTrigger
                    value="organizer"
                    className="data-[state=active]:bg-red-600 data-[state=active]:text-white rounded-none py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium truncate"
                  >
                    Organizer
                  </TabsTrigger>
                  <TabsTrigger
                    value="followers"
                    className="data-[state=active]:bg-red-600 data-[state=active]:text-white rounded-none py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium truncate"
                  >
                    Followers
                  </TabsTrigger>
                  <TabsTrigger
                    value="reviews"
                    className="data-[state=active]:bg-red-600 data-[state=active]:text-white rounded-none py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium truncate"
                  >
                    Review
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="about" className="space-y-6">
                <Card className="shadow-md border border-gray-200 rounded-lg overflow-hidden">
                  <CardHeader className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <CardTitle className="text-lg font-semibold text-gray-800">
                      {event.title || "Event Title"}
                    </CardTitle>
                    <p className="text-gray-600 mt-1 text-sm leading-relaxed">
                      {event.description || event.shortDescription || "Event description not available."}
                    </p>
                  </CardHeader>

                  <CardContent className="px-6 py-4">
                    <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4 mb-4">
                      <h3 className="font-semibold text-gray-800 mb-2">Highlights</h3>
                      <ul className="list-disc list-inside text-gray-700 space-y-1 text-sm">
                        {event.highlights?.map((item: string, i: number) => (
                          <li key={i}>{item}</li>
                        )) || (
                          <>
                            <li>Showcase and sample your favorite products.</li>
                            <li>Be visible to thousands of music lovers.</li>
                            <li>Enjoy trying high-end gadgets and accessories.</li>
                          </>
                        )}
                      </ul>
                    </div>

                    {/* Listed In Section */}
                    <div>
                      <h3 className="font-semibold text-blue-700 mb-2">Listed In</h3>
                      <div className="flex flex-wrap gap-2">
                        {event.tags?.map((tag: string) => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-3 py-1 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-full hover:bg-blue-100 transition-colors duration-200"
                          >
                            #{tag}
                          </span>
                        )) || (
                          <>
                            <span className="inline-flex items-center px-3 py-1 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-full">
                              #{event.category || "Event"}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* UPDATED TIMING AND DETAILS SECTION */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                  {/* Timings / Schedule Section */}
                  <div>
                    {event.registrationStart && event.registrationEnd && (
                      <div>
                        <p className="font-medium text-gray-900">Category:</p>
                        <p className="text-gray-700">{event.category}</p>
                      </div>
                    )}

                    <div>
                      <p className="font-medium text-gray-900">Timezone:</p>
                      <p className="text-blue-600 font-medium">{event.timezone || "Asia/Kolkata"}</p>
                    </div>

                    <div className="mt-4">
                      <h3 className="font-semibold text-gray-800 mb-1">Editions</h3>
                      <p className="text-gray-700">
                        {event.edition || "2nd"} Edition
                        <span className="text-blue-600 ml-2">({event.edition || "2nd"} time organized)</span>
                      </p>
                    </div>
                  </div>

                  {/* Event Type / Official Links Section */}
                  <div>
                    <div className="mb-4">
                      <h3 className="font-semibold text-gray-800 mb-1 flex items-center gap-2">
                        <IndianRupee className="w-4 h-4" />
                        Entry Fees
                      </h3>
                      <p className="text-gray-700 text-sm ml-5">
                        {getTicketPriceDisplay()}
                      </p>
                    </div>

                    <div className="mb-4">
                      <h3 className="font-semibold text-gray-800 mb-1">Event Type</h3>
                      <div className="flex items-center gap-2 text-gray-700">
                        <span className="text-green-600 font-semibold">✓</span>
                        {event.eventType?.map((type: string, index: number) => (
                          <Badge key={index} variant="secondary" className="ml-2">
                            {type}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="mb-4">
                      <h3 className="font-semibold text-gray-800 mb-1">Official Links</h3>
                      <div className="flex gap-2">
                        {event.website && (
                          <a
                            href={event.website}
                            className="px-3 py-1 border border-blue-200 bg-blue-50 text-blue-700 rounded-md text-xs font-medium hover:bg-blue-100"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Website
                          </a>
                        )}
                        <a
                          href="#contact"
                          className="px-3 py-1 border border-pink-200 bg-pink-50 text-pink-700 rounded-md text-xs font-medium hover:bg-pink-100"
                        >
                          Contact
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* UPDATED ORGANIZER CARD - Show company initials */}
                <Card className="border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                  <Link href={`/organizer/${event.organizer?.id}`}>
                    <CardHeader className="border-b border-gray-100 pb-2">
                      <CardTitle className="text-gray-800 text-base font-semibold">Organizer</CardTitle>
                    </CardHeader>

                    <CardContent className="flex flex-col md:flex-row justify-between items-center gap-4 py-4">
                      {/* Left Section: Organizer Info */}
                      <div className="flex items-center gap-4">
                        <div className="relative w-16 h-16 flex items-center justify-center border border-gray-100 rounded-full overflow-hidden bg-blue-50">
                          {event.organizer?.avatar || event.organizer?.companyLogo ? (
                            <Image
                              src={event.organizer.avatar || event.organizer.companyLogo}
                              alt={event.organizer?.company || "Organizer"}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <span className="text-lg font-semibold text-blue-600">
                              {getCompanyInitials(event.organizer?.company)}
                            </span>
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900 text-lg">
                              {event.organizer?.company || "Event Organizer"}
                            </h3>
                            <span className="bg-blue-100 text-blue-700 text-[11px] font-medium px-2 py-[2px] rounded">
                              Top Rated
                            </span>
                          </div>

                          <p className="text-xs text-gray-500 mt-1">
                            {event.organizer?.upcomingEvents
                              ? `${event.organizer.upcomingEvents} Upcoming Events`
                              : "1 Upcoming Event"}{" "}
                          </p>
                        </div>
                      </div>

                      {/* Right Section: Button */}
                      {showActionButtons && (
                        <div className="flex flex-col items-center text-center">
                          <button
                            className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-md shadow"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleVisitClick();
                            }}
                          >
                            Send Stall Book Request  
                          </button>
                        </div>
                      )}
                    </CardContent>
                  </Link>
                </Card>

                {/* MAP SECTION */}
                <Card className="border border-gray-200 rounded-lg shadow-sm">
                  <CardHeader className="border-b border-gray-100 py-4">
                    <CardTitle className="text-gray-800 text-lg font-semibold">Venue Map & Directions</CardTitle>
                  </CardHeader>

                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                      {/* Map Section */}
                      <div className="w-full md:w-2/3 h-80 bg-gray-200 rounded-md overflow-hidden">
                        <iframe
                          src={`https://www.google.com/maps?q=${getMapAddress()}&z=15&output=embed`}
                          width="100%"
                          height="100%"
                          className="border-0"
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                        ></iframe>
                      </div>

                      {/* Venue Details and Buttons */}
                      <div className="w-full md:w-1/3 flex flex-col justify-between space-y-4">
                        {/* Venue Info */}
                        <div>
                          <Link href={`/venue/${event?.venue?.id}`}>
                            <h3 className="font-semibold text-blue-700 text-base hover:underline cursor-pointer">
                              {event?.venue?.venueName || "Venue Name Unavailable"}
                            </h3>
                          </Link>
                          <p className="text-gray-600 text-sm mt-1">{event?.venue?.venueAddress || "Address not provided"}</p>
                          <p className="text-gray-600 text-sm">{event?.venue?.venueZipCode || "Zip code not provided"}</p>
                          <p className="text-gray-600 text-sm">{event?.venue?.venueCountry || "Country not provided"}</p>
                        </div>

                        {/* Buttons */}
                        <div className="space-y-2">
                          <Button
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-md transition-colors"
                            onClick={() => {
                              const address = getMapAddress()
                              window.open(
                                `https://www.google.com/maps/dir/?api=1&destination=${address}`,
                                "_blank",
                              )
                            }}
                          >
                            Get Directions
                          </Button>
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => {
                              const address = getMapAddress()
                              window.open(
                                `https://www.google.com/maps/search/?api=1&query=${address}`,
                                "_blank",
                              )
                            }}
                          >
                            View in Maps
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* EVENT FOLLOWERS SECTION - ADDED HERE */}
                <EventFollowers eventId={event.id} />

                {/* ADD REVIEW CARD */}
                <AddReviewCard eventId={event.id} />
              </TabsContent>

              <TabsContent value="exhibitors">
                <ExhibitorsTab eventId={event.id} />
              </TabsContent>

              {/* UPDATED SPACE COST TAB */}
              <TabsContent value="space-cost">
                <Card>
                  <CardHeader>
                    <CardTitle>Exhibition Space Pricing</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {spaceCosts.length > 0 ? (
                      spaceCosts.map((space, index) => (
                        <div key={index} className="p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border">
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="font-medium">{space.type}</span>
                              <p className="text-sm text-gray-600">{space.description}</p>
                              <p className="text-xs text-gray-500">
                                Minimum area: {space.minArea || "Not specified"} {space.unit || "sqm"}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-lg text-blue-600">
                                {space.currency} {space.price.toLocaleString()}
                              </span>
                              {space.pricePerSqm && space.pricePerSqm > 0 && (
                                <p className="text-sm text-gray-600">
                                  + {space.currency} {space.pricePerSqm}/{space.unit || "sqm"}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-600">No exhibition space information available.</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="layout">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Layout Plan</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-100 h-96 rounded-lg flex items-center justify-center overflow-hidden">
                      {event?.layoutPlan ? (
                        <Image
                          src={event.layoutPlan.startsWith("http")
                            ? event.layoutPlan
                            : `/uploads/${event.layoutPlan}`}
                          alt="Event Layout Plan"
                          width={800}
                          height={600}
                          className="object-contain rounded-lg"
                        />
                      ) : (
                        <div className="text-center">
                          <p className="text-gray-500 mb-4">Floor plan will be displayed here</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="brochure">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Brochure</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {event?.brochure ? (
                        <>
                          <div className="bg-gray-100 rounded-lg border border-gray-300 min-h-[400px] flex flex-col">
                            <div className="flex justify-between items-center p-3 bg-white border-b">
                              <span className="text-sm font-medium">Event Brochure</span>
                            </div>

                            <div className="flex-1 p-4">
                              <iframe
                                src={`https://docs.google.com/gview?url=${encodeURIComponent(event.brochure)}&embedded=true`}
                                className="w-full h-96 border-0"
                                title="PDF Brochure"
                              />
                              <div className="text-center mt-4">
                                <p className="text-sm text-gray-600">
                                  If the PDF doesn't load, use the buttons above to download or open in a new tab.
                                </p>
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="bg-gray-100 h-96 rounded-lg flex flex-col items-center justify-center">
                          <p className="text-gray-600 mb-4">No brochure available</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="venue">
                <Card className="border border-gray-200 rounded-lg shadow-sm">
                  <CardHeader className="border-b border-gray-100 py-4">
                    <CardTitle className="text-gray-800 text-lg font-semibold">Venue Details</CardTitle>
                  </CardHeader>

                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                      {/* Map Section */}
                      <div className="w-full md:w-2/3 h-80 bg-gray-200 rounded-md overflow-hidden">
                        <iframe
                          src={`https://www.google.com/maps?q=${getMapAddress()}&z=15&output=embed`}
                          width="100%"
                          height="100%"
                          className="border-0"
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                        ></iframe>
                      </div>

                      {/* Venue Details and Buttons */}
                      <div className="w-full md:w-1/3 flex flex-col justify-between space-y-4">
                        {/* Venue Info */}
                        <div>
                          <Link href={`/venue/${event?.venue?.id}`}>
                            <h3 className="font-semibold text-blue-700 text-base hover:underline cursor-pointer">
                              {event?.venue?.venueName || "Venue Name Unavailable"}
                            </h3>
                          </Link>
                          <p className="text-gray-600 text-sm mt-1">{event?.venue?.venueAddress || "Address not provided"}</p>
                          <p className="text-gray-600 text-sm">{event?.venue?.venueZipCode || "Zip code not provided"}</p>
                          <p className="text-gray-600 text-sm">{event?.venue?.venueCountry || "Country not provided"}</p>

                          {/* Additional venue details if available */}
                          {event?.venue?.capacity && (
                            <div className="mt-3">
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Capacity:</span> {event.venue.capacity.total || "N/A"}
                              </p>
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Halls:</span> {event.venue.capacity.halls || "N/A"}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Buttons */}
                        <div className="space-y-2">
                          <Button
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-md transition-colors"
                            onClick={() => {
                              const address = getMapAddress()
                              window.open(
                                `https://www.google.com/maps/dir/?api=1&destination=${address}`,
                                "_blank",
                              )
                            }}
                          >
                            Get Directions
                          </Button>
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => {
                              const address = getMapAddress()
                              window.open(
                                `https://www.google.com/maps/search/?api=1&query=${address}`,
                                "_blank",
                              )
                            }}
                          >
                            View in Maps
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="speakers">
                <SpeakersTab eventId={event.id} />
              </TabsContent>

              {/* UPDATED ORGANIZER TAB WITH COMPANY INITIALS */}
              <TabsContent value="organizer">
                <Card>
                  <CardHeader>
                    <CardTitle>Event Organizer</CardTitle>
                  </CardHeader>
                  <Link href={`/organizer/${event.organizer?.id || event.organizer?._id}`}>
                    <CardContent>
                      <div className="flex items-start gap-4">
                        <Avatar className="w-16 h-16">
                          <AvatarImage
                            src={event.organizer?.avatar || event.organizer?.companyLogo}
                            alt={event.organizer?.company || "Organizer"}
                          />
                          <AvatarFallback className="bg-blue-50 text-blue-600 text-lg font-semibold">
                            {getCompanyInitials(event.organizer?.company)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg">
                            {event.organizer?.company || "Event Organizer"}
                          </h4>
                          <p className="text-gray-600 mb-3">
                            Professional event organizer
                          </p>

                          {/* Organizer Stats */}
                          <div className="mt-3 flex gap-4 text-sm text-gray-500">
                            <span>{event.organizer?.totalEvents || 7} Total Events</span>
                            <span>{event.organizer?.averageRating || 4.5} ★ Rating</span>
                            <span>{event.organizer?.totalReviews || 2} Reviews</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              </TabsContent>

              <TabsContent value="followers">
                <EventFollowers eventId={event.id} />
              </TabsContent>

              <TabsContent value="reviews">
                <Card>
                  <CardHeader>
                    <CardTitle>Reviews</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <AddReviewCard eventId={event.id} />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar - Right Side */}
          <div className="w-full lg:w-80 xl:w-96 space-y-6 flex-shrink-0">
            <Card className="hover:shadow-md transition-shadow border border-gray-200 rounded-lg h-60">
              <CardHeader className="pb-3"></CardHeader>
              <CardContent className="space-y-4"></CardContent>
            </Card>

            {/* Featured Hotels Card */}
            <div className="hover:shadow-md transition-shadow border border-gray-200 rounded-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold">Featured Hotels</CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                {hotelsLoading ? (
                  <div className="text-center py-4">
                    <p className="text-gray-600 text-sm">Loading featured hotels…</p>
                  </div>
                ) : featuredHotels.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-gray-600 text-sm">No featured hotels available.</p>
                  </div>
                ) : (
                  <div className="space-y-4 mb-4">
                    {featuredHotels.map((h: any) => (
                      <div
                        key={h.id}
                        className="w-full bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden"
                      >
                        <div className="flex flex-col sm:flex-row">
                          {/* Image Section */}
                          <div className="sm:w-1/3 relative h-40 sm:h-32">
                            <Image
                              src={h.image || "/api/placeholder/200/128?text=Hotel"}
                              alt={h.name || "Featured Hotel"}
                              fill
                              className="object-cover m-2"
                              sizes="(max-width: 640px) 100vw, 33vw"
                            />
                            {h.badgeText && (
                              <span className="absolute bottom-2 left-2 rounded-full bg-green-500 px-2 py-1 text-xs font-semibold text-white">
                                {h.badgeText}
                              </span>
                            )}
                          </div>

                          {/* Content Section */}
                          <div className="sm:w-2/3 p-3">
                            <div className="flex flex-col h-full">
                              {/* Header */}
                              <div className="flex justify-between items-start gap-2 mb-2">
                                <div className="flex-1 min-w-0">
                                  <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-1">
                                    {h.name}
                                  </h3>

                                  {/* Rating and Location */}
                                  <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
                                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                    <span className="font-medium">{(h.rating ?? 0).toFixed(1)}</span>
                                    <span>({(h.reviews || 0).toLocaleString()})</span>
                                    <span className="mx-1">•</span>
                                    <span className="truncate">{h.locationNote || "Excellent Location"}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Amenities */}
                              <div className="flex flex-wrap gap-1 mb-3">
                                {h.amenities?.includes("Free Wifi") || h.amenities?.includes("wifi") ? (
                                  <span className="inline-flex items-center gap-1 bg-gray-50 px-2 py-1 rounded text-xs text-gray-600">
                                    <Wifi className="h-3 w-3" />
                                    WiFi
                                  </span>
                                ) : null}
                                {h.amenities?.includes("Food") || h.amenities?.includes("food") ? (
                                  <span className="inline-flex items-center gap-1 bg-gray-50 px-2 py-1 rounded text-xs text-gray-600">
                                    <Utensils className="h-3 w-3" />
                                    Food
                                  </span>
                                ) : null}
                                {h.amenities?.includes("Parking") || h.amenities?.includes("parking") ? (
                                  <span className="inline-flex items-center gap-1 bg-gray-50 px-2 py-1 rounded text-xs text-gray-600">
                                    <Car className="h-3 w-3" />
                                    Parking
                                  </span>
                                ) : null}
                              </div>

                              {/* Price and Booking */}
                              <div className="flex items-center justify-between gap-2 mt-auto">
                                <div className="flex items-center gap-2">
                                  <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                                    {h.dealLabel || "Deal"}
                                  </span>
                                  <div className="flex items-baseline gap-1">
                                    <span className="text-lg font-bold text-gray-900">
                                      {h.currency || "$"}
                                      {h.price}
                                    </span>
                                    <span className="text-xs text-gray-500 hidden sm:inline">
                                      {h.priceNote || "28% less than usual"}
                                    </span>
                                  </div>
                                </div>

                                <Button
                                  className="rounded-full bg-blue-600 px-3 py-1 text-white hover:bg-blue-700 text-xs font-medium whitespace-nowrap flex-shrink-0"
                                  size="sm"
                                >
                                  Book Now
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </div>

            {/* Featured Travel Partners */}
            <Card className="hover:shadow-md transition-shadow border border-gray-200 rounded-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold">Featured Travel Partners</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <p className="text-gray-600 text-sm">No travel partners available.</p>
                </div>
              </CardContent>
            </Card>

            {/* Places to Visit */}
            <Card className="border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold">
                  Places to Visit in {event.city || "the area"}
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-5">
                {getPlacesToVisit(event.city).map((place, index) => (
                  <div key={index} className="rounded-xl overflow-hidden border border-gray-100 bg-white">
                    {/* Image with overlayed title and gradient */}
                    <div className="relative w-full h-48">
                      <Image
                        src={place.image}
                        alt={place.name}
                        fill
                        sizes="(max-width: 640px) 100vw, 600px"
                        className="object-cover"
                      />

                      {/* Gradient overlay for better text visibility */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>

                      {/* Title overlay */}
                      <div className="absolute left-4 bottom-4 pr-4">
                        <h3 className="text-white text-lg font-semibold drop-shadow-md">
                          {place.name}
                        </h3>
                      </div>
                    </div>

                    {/* White area under image: category on left, button on right */}
                    <div className="px-4 py-3 flex items-center justify-between">
                      <p className="text-gray-600 text-sm">{place.category}</p>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        aria-label={`More details about ${place.name}`}
                      >
                        More details →
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}