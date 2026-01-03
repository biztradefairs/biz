"use client"
import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  MapPin,
  Calendar,
  Heart,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Star,
  CalendarDays,
  UserPlus,
  X,
  Share2,
  Bookmark,
  Users,
} from "lucide-react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import AdCard from "@/components/add-card"
import { useToast } from "@/hooks/use-toast"
import { ShareButton } from "@/components/share-button"
import { useSession } from "next-auth/react"

// Import BookmarkButton component
import { BookmarkButton } from "@/components/bookmark-button"

interface Event {
  image: string
  organizer: any
  id: string
  title: string
  description: string
  startDate: string
  endDate: string
  eventType: string
  categories: string[]
  tags: string[]
  images: { url: string }[]
  location: {
    address: string
    city: string
    venue: string
    country?: string
  }
  venue?: {
    venueAddress?: string
    venueCity?: string
    venueCountry?: string
    venueName?: string
  }
  pricing: {
    general: number
  }
  rating: {
    average: number
  }
  featured?: boolean
  status: string
  timings: {
    [x: string]: string
    startDate: string
    endDate: string
  }
  averageRating?: number
  totalReviews?: number
}

interface ApiResponse {
  events: Event[]
}

export default function EventsPageContent() {
  const [activeTab, setActiveTab] = useState("All Events")
  const [selectedFormat, setSelectedFormat] = useState("All Formats")
  const [selectedLocation, setSelectedLocation] = useState("")
  const searchParams = useSearchParams()
  const categoryFromUrl = searchParams.get("category")
  const [selectedCategory, setSelectedCategory] = useState(categoryFromUrl || "All Events")

  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedDateRange, setSelectedDateRange] = useState("")
  const [priceRange, setPriceRange] = useState("")
  const [rating, setRating] = useState("")

  const [calendarOpen, setCalendarOpen] = useState(false)
  const [formatOpen, setFormatOpen] = useState(false)
  const [locationOpen, setLocationOpen] = useState(false)
  const [categoryOpen, setCategoryOpen] = useState(true)
  const [relatedTopicOpen, setRelatedTopicOpen] = useState(true)
  const [entryFeeOpen, setEntryFeeOpen] = useState(false)
  const [categorySearch, setCategorySearch] = useState("")
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedRelatedTopics, setSelectedRelatedTopics] = useState<string[]>([])
  const [showAllCategories, setShowAllCategories] = useState(false)

  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const [currentSlide, setCurrentSlide] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const [visitorCounts, setVisitorCounts] = useState<Record<string, number>>({})
  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem("visitorCounts") : null
      if (raw) setVisitorCounts(JSON.parse(raw))
    } catch (e) {
      console.log("[v0] Failed to load visitorCounts:", e)
    }
  }, [])

  const persistVisitorCounts = (next: Record<string, number>) => {
    setVisitorCounts(next)
    try {
      localStorage.setItem("visitorCounts", JSON.stringify(next))
    } catch (e) {
      console.log("[v0] Failed to persist visitorCounts:", e)
    }
  }

  const incrementVisitorCount = (eventId: string) => {
    if (!eventId) return
    const next = { ...visitorCounts, [eventId]: (visitorCounts[eventId] || 0) + 1 }
    persistVisitorCounts(next)
  }

  const { toast } = useToast()
  const router = useRouter()
  const { data: session } = useSession()

  const DEFAULT_EVENT_IMAGE = "/city/c4.jpg"

  const getEventImage = (event: any) => {
    const image = event.images?.[0] || event.image || DEFAULT_EVENT_IMAGE
    if (typeof image === "string") {
      return image
    } else if (image && typeof image === "object" && image.url) {
      return image.url
    }
    return DEFAULT_EVENT_IMAGE
  }

  const fetchEvents = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch("/api/events")
      if (!response.ok) {
        throw new Error("Failed to fetch events")
      }
      const data: ApiResponse = await response.json()
      const transformedEvents = data.events.map((event: any) => {
        const resolvedId =
          event.id ||
          event._id ||
          (typeof event._id === "object" && event._id.$oid) ||
          (typeof event._id === "string" ? event._id : undefined)
        const avg =
          typeof event?.averageRating === "number" && event.averageRating > 0
            ? event.averageRating
            : typeof event?.rating?.average === "number"
              ? event.rating.average
              : 4.5
        const categories = Array.isArray(event.category)
          ? event.category
          : Array.isArray(event.categories)
            ? event.categories
            : []

        let address = "Address not available"
        let city = "City not specified"
        let venue = "Venue not specified"
        let country = "Country not specified"

        if (event.venue?.venueAddress) {
          address = event.venue.venueAddress
        } else if (event.location?.address) {
          address = event.location.address
        } else if (event.address) {
          address = event.address
        }

        if (event.venue?.venueCity) {
          city = event.venue.venueCity
        } else if (event.location?.city) {
          city = event.location.city
        } else if (event.city) {
          city = event.city
        }

        if (event.venue?.venueName) {
          venue = event.venue.venueName
        } else if (event.location?.venue) {
          venue = event.location.venue
        } else if (event.venue) {
          venue = typeof event.venue === "string" ? event.venue : "Venue"
        }

        if (event.venue?.venueCountry) {
          country = event.venue.venueCountry
        } else if (event.location?.country) {
          country = event.location.country
        } else if (event.country) {
          country = event.country
        }

        return {
          ...event,
          id: String(resolvedId || ""),
          eventType: event.eventType || categories?.[0] || "Other",
          timings: {
            startDate: event.startDate,
            endDate: event.endDate,
          },
          location: {
            address: address,
            city: city,
            venue: venue,
            country: country,
          },
          venue: event.venue || {
            venueAddress: address,
            venueCity: city,
            venueCountry: country,
          },
          featured: event.tags?.includes("featured") || false,
          categories: categories,
          tags: event.tags || [],
          images: event.images || ["/images/gpex.jpg"],
          pricing: event.pricing || { general: 0 },
          rating: { average: avg },
          totalReviews: typeof event?.totalReviews === "number" ? event.totalReviews : undefined,
        }
      })
      setEvents(transformedEvents)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      console.error("[v0] Error fetching events:", err)
      toast({
        title: "Error",
        description: "Failed to load events",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [])

  useEffect(() => {
    if (categoryFromUrl) {
      setSelectedCategory(categoryFromUrl)
    }
    const locationFromUrl = searchParams.get("location")
    if (locationFromUrl) {
      setSelectedLocation(locationFromUrl)
    }
    const countryFromUrl = searchParams.get("country")
    if (countryFromUrl) {
      setSelectedLocation(countryFromUrl)
    }
    const venueFromUrl = searchParams.get("venue")
    if (venueFromUrl) {
      setSelectedLocation(venueFromUrl)
    }
  }, [categoryFromUrl, searchParams])

  const handleVisitClick = async (eventId: string, eventTitle: string) => {
    console.log("[v0] handleVisitClick called with:", { eventId, eventTitle, hasSession: !!session, session })
    if (!eventId) {
      toast({
        title: "Invalid event",
        description: "We could not identify this event. Please refresh and try again.",
        variant: "destructive",
      })
      return
    }

    incrementVisitorCount(eventId)

    if (!session) {
      try {
        alert(`Authentication Required\nPlease log in to visit "${eventTitle}".`)
      } catch {
        toast({
          title: "Authentication required",
          description: "Please log in to continue.",
          variant: "destructive",
        })
      }
      router.push("/login")
      return
    }

    const userId = (session as any)?.user?.id
    if (!userId) {
      toast({
        title: "Session issue",
        description: "Your session is missing an ID. Please log out and log back in.",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch(`/api/events/${eventId}/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "attendee", userId, eventId }),
      })

      if (response.ok) {
        try {
          alert(`Thanks for visiting "${eventTitle}"!`)
        } catch {
          toast({
            title: "Visit recorded",
            description: `Thanks for visiting "${eventTitle}".`,
          })
        }
      } else {
        const problemText = await response.text().catch(() => "")
        console.error("[v0] Visit lead failed:", response.status, problemText)
        toast({
          title: "Error",
          description: "Failed to record your interest. Your local visit counter was still updated.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Visit lead error:", error)
      toast({
        title: "Error",
        description: "Failed to record your interest. Your local visit counter was still updated.",
        variant: "destructive",
      })
    }
  }

  const itemsPerPage = 6

  const categories = useMemo(() => {
    if (!events || events.length === 0) return []
    const categoryMap = new Map<string, number>()
    events.forEach((event) => {
      if (event.categories && Array.isArray(event.categories)) {
        event.categories.forEach((category) => {
          if (category && typeof category === "string") {
            const normalized = category.trim()
            if (normalized) {
              categoryMap.set(normalized, (categoryMap.get(normalized) || 0) + 1)
            }
          }
        })
      }
    })

    if (categoryMap.size > 0) {
      return Array.from(categoryMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
    }

    const hardcodedCategories = [
      "All Events",
      "Education Training",
      "Medical & Pharma",
      "IT & Technology",
      "Banking & Finance",
      "Business Services",
      "Industrial Engineering",
      "Building & Construction",
      "Power & Energy",
      "Entertainment & Media",
      "Wellness, Health & Fitness",
    ]

    return hardcodedCategories
      .map((categoryName) => {
        const count = events.filter((event) => {
          if (!event.categories || !Array.isArray(event.categories)) return false
          return event.categories.some((cat) => {
            if (!cat || typeof cat !== "string") return false
            return cat.toLowerCase().includes(categoryName.toLowerCase())
          })
        }).length
        return { name: categoryName, count }
      })
      .filter((cat) => cat.count > 0)
  }, [events])

  const formats = useMemo(() => {
    const formatMap = new Map<string, number>()
    formatMap.set("All Formats", events.length)
    events.forEach((event) => {
      let formatName = ""
      if (event.eventType && typeof event.eventType === "string") {
        formatName = event.eventType.trim()
      } else if (event.categories && Array.isArray(event.categories) && event.categories.length > 0) {
        const firstCategory = event.categories[0]
        if (typeof firstCategory === "string") {
          formatName = firstCategory.trim()
        }
      }
      if (!formatName) {
        formatName = "Other"
      }
      const normalizedFormat = formatName.toLowerCase()
      if (normalizedFormat.includes("trade show") || normalizedFormat.includes("tradeshow")) {
        formatName = "Trade Show"
      } else if (normalizedFormat.includes("conference")) {
        formatName = "Conference"
      } else if (normalizedFormat.includes("workshop") || normalizedFormat.includes("workshops")) {
        formatName = "Workshops"
      } else if (normalizedFormat.includes("exhibition") || normalizedFormat.includes("expo")) {
        formatName = "Exhibition"
      } else if (normalizedFormat.includes("seminar")) {
        formatName = "Seminar"
      } else if (normalizedFormat.includes("meetup") || normalizedFormat.includes("meeting")) {
        formatName = "Meetup"
      }
      formatMap.set(formatName, (formatMap.get(formatName) || 0) + 1)
    })
    const allFormatsCount = formatMap.get("All Formats") || 0
    formatMap.delete("All Formats")
    const formatArray = Array.from(formatMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
    return [{ name: "All Formats", count: allFormatsCount }, ...formatArray]
  }, [events])

  const locations = useMemo(() => {
    if (!events || events.length === 0) return []
    const locationMap = new Map<string, number>()
    events.forEach((event) => {
      let locationKey = ""
      if (event.venue?.venueCity) {
        locationKey = event.venue.venueCity.trim()
      } else if (event.location?.city) {
        locationKey = event.location.city.trim()
      } else if (event.venue?.venueCountry) {
        locationKey = event.venue.venueCountry.trim()
      } else if (event.location?.address) {
        const addressParts = event.location.address.split(",")
        locationKey = addressParts[0]?.trim() || "Unknown"
      }
      if (locationKey && locationKey !== "Not Added" && locationKey !== "Unknown") {
        locationMap.set(locationKey, (locationMap.get(locationKey) || 0) + 1)
      }
    })
    return Array.from(locationMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => {
        if (b.count !== a.count) {
          return b.count - a.count
        }
        return a.name.localeCompare(b.name)
      })
  }, [events])

  const filteredCategories = useMemo(() => {
    return categories.filter((category) => category.name.toLowerCase().includes(categorySearch.toLowerCase()))
  }, [categories, categorySearch])

  const relatedTopics = useMemo(() => {
    return categories.map((cat) => ({ ...cat, name: `${cat.name} Related` }))
  }, [categories])

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const isEventOnDate = (event: Event, date: Date) => {
    const eventStartDate = new Date(event.timings.startDate)
    const eventEndDate = new Date(event.timings.endDate)
    return (
      date >= new Date(eventStartDate.getFullYear(), eventStartDate.getMonth(), eventStartDate.getDate()) &&
      date <= new Date(eventEndDate.getFullYear(), eventEndDate.getMonth(), eventEndDate.getDate())
    )
  }

  const isSameDay = (date1: Date, date2: Date) => {
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    )
  }

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    setCalendarOpen(false)
  }

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const clearDateFilter = () => {
    setSelectedDate(null)
    setSelectedDateRange("")
  }

  const clearLocationFilter = () => {
    setSelectedLocation("")
  }

  const clearFormatFilter = () => {
    setSelectedFormat("All Formats")
  }

  const isEventInDateRange = (event: any, dateRange: string) => {
    const eventDate = new Date(event.timings.startDate)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    const monthFromNow = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate())

    switch (dateRange) {
      case "today":
        return eventDate >= today && eventDate < tomorrow
      case "tomorrow":
        return eventDate >= tomorrow && eventDate < new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000)
      case "this-week":
        return eventDate >= today && eventDate <= weekFromNow
      case "this-month":
        return eventDate >= today && eventDate <= monthFromNow
      case "next-month":
        const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1)
        const monthAfter = new Date(today.getFullYear(), today.getMonth() + 2, 1)
        return eventDate >= nextMonth && eventDate < monthAfter
      default:
        return true
    }
  }

  const isEventInTab = (event: any, tab: string) => {
    const eventDate = new Date(event.timings.startDate)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    const monthFromNow = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate())

    switch (tab) {
      case "All Events":
        return true
      case "Upcoming":
        return eventDate >= today
      case "Past":
        return eventDate < today
      case "This Week":
        return eventDate >= today && eventDate <= weekFromNow
      case "This Month":
        return eventDate >= today && eventDate <= monthFromNow
      default:
        return true
    }
  }

  const filteredEvents = useMemo(() => {
    let filtered = events

    filtered = filtered.filter((event) => isEventInTab(event, activeTab))

    if (selectedDate) {
      filtered = filtered.filter((event) => isEventOnDate(event, selectedDate))
    }

    if (selectedDateRange && !selectedDate) {
      filtered = filtered.filter((event) => isEventInDateRange(event, selectedDateRange))
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (event) =>
          event.title.toLowerCase().includes(query) ||
          event.description.toLowerCase().includes(query) ||
          event.tags.some((tag) => tag.toLowerCase().includes(query)) ||
          event.categories.some((cat) => cat.toLowerCase().includes(query)) ||
          event.venue?.venueCity?.toLowerCase().includes(query) ||
          event.venue?.venueCountry?.toLowerCase().includes(query) ||
          event.location?.city?.toLowerCase().includes(query),
      )
    }

    if (selectedCategories.length > 0) {
      filtered = filtered.filter((event) =>
        event.categories?.some((cat) =>
          selectedCategories.some((selectedCat) => cat.toLowerCase().trim() === selectedCat.toLowerCase().trim()),
        ),
      )
    } else if (selectedCategory && selectedCategory !== "All Events") {
      filtered = filtered.filter((event) =>
        event.categories?.some((cat) => cat.toLowerCase().trim() === selectedCategory.toLowerCase().trim()),
      )
    }

    if (selectedRelatedTopics.length > 0) {
      const relatedCats = selectedRelatedTopics.map((topic) => topic.replace(" Related", ""))
      filtered = filtered.filter((event) => event.categories.some((cat) => relatedCats.includes(cat)))
    }

    if (selectedLocation) {
      filtered = filtered.filter((event) => {
        const searchTerm = selectedLocation.toLowerCase()
        const venueCity = event.venue?.venueCity?.toLowerCase() || ""
        const venueCountry = event.venue?.venueCountry?.toLowerCase() || ""
        const eventCity = event.location?.city?.toLowerCase() || ""
        const eventAddress = event.location?.address?.toLowerCase() || ""
        return (
          venueCity.includes(searchTerm) ||
          venueCountry.includes(searchTerm) ||
          eventCity.includes(searchTerm) ||
          eventAddress.includes(searchTerm)
        )
      })
    }

    if (selectedFormat && selectedFormat !== "All Formats") {
      filtered = filtered.filter((event) => {
        const eventType = event.eventType || event.categories?.[0] || ""
        const eventTypeStr = String(eventType).toLowerCase().trim()
        const selectedFormatStr = String(selectedFormat).toLowerCase().trim()
        return eventTypeStr === selectedFormatStr
      })
    }

    if (priceRange) {
      filtered = filtered.filter((event) => {
        const price = event.pricing.general
        switch (priceRange) {
          case "free":
            return price === 0
          case "under-1000":
            return price < 1000
          case "1000-5000":
            return price >= 1000 && price <= 5000
          case "above-5000":
            return price > 5000
          default:
            return true
        }
      })
    }

    if (rating) {
      const minRating = Number.parseFloat(rating)
      filtered = filtered.filter((event) => event.rating.average >= minRating)
    }

    return filtered
  }, [
    events,
    activeTab,
    selectedDate,
    selectedDateRange,
    searchQuery,
    selectedCategory,
    selectedCategories,
    selectedRelatedTopics,
    selectedLocation,
    selectedFormat,
    priceRange,
    rating,
  ])

  const getBannerTitle = () => {
    if (selectedDate) {
      return `Events on ${selectedDate.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`
    }
    if (selectedCategories.length > 0) {
      return `${selectedCategories.join(", ")} Events`
    }
    if (selectedCategory) {
      return `${selectedCategory}`
    }
    if (selectedLocation) {
      return `Events in ${selectedLocation}`
    }
    if (searchQuery) {
      return `Search Results for "${searchQuery}"`
    }
    if (activeTab !== "All Events") {
      return `${activeTab} Events`
    }
    return "Education & Training Events" // Changed to match the image
  }

  const getFollowerCount = () => {
    const total = filteredEvents.reduce((sum, ev) => sum + (visitorCounts[ev.id] || 0), 0)
    if (total >= 1000) return `${Math.round(total / 1000)}K+ Followers`
    return `${total}+ Followers`
  }

  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage)
  const paginatedEvents = filteredEvents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const featuredEvents = events.filter((event) => event.featured)

  useEffect(() => {
    if (featuredEvents.length === 0 || isHovered || isTransitioning) return
    const totalSlides = Math.ceil(featuredEvents.length / 3)
    const interval = setInterval(() => {
      setIsTransitioning(true)
      setCurrentSlide((prev) => (prev + 1) % totalSlides)
    }, 3000)
    return () => clearInterval(interval)
  }, [featuredEvents.length, isHovered, isTransitioning])

  useEffect(() => {
    if (isTransitioning) {
      const timer = setTimeout(() => {
        setIsTransitioning(false)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [isTransitioning])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      day: "2-digit",
      month: "short",
    })
  }
  
  // FIXED: Properly calculate hasActiveFilters
  const hasActiveFilters = useMemo(() => {
    const hasSearchQuery = searchQuery.trim().length > 0
    const hasSelectedDate = selectedDate !== null
    const hasSelectedDateRange = selectedDateRange.trim().length > 0
    const hasSelectedLocation = selectedLocation.trim().length > 0
    const hasSelectedFormat = selectedFormat !== "All Formats"
    const hasSelectedCategory = selectedCategory !== "All Events" && selectedCategory.trim().length > 0
    const hasSelectedCategories = selectedCategories.length > 0
    const hasSelectedRelatedTopics = selectedRelatedTopics.length > 0
    const hasPriceRange = priceRange.trim().length > 0
    const hasRating = rating.trim().length > 0
    const hasActiveTab = activeTab !== "All Events"

    return (
      hasSearchQuery ||
      hasSelectedDate ||
      hasSelectedDateRange ||
      hasSelectedLocation ||
      hasSelectedFormat ||
      hasSelectedCategory ||
      hasSelectedCategories ||
      hasSelectedRelatedTopics ||
      hasPriceRange ||
      hasRating ||
      hasActiveTab
    )
  }, [
    searchQuery,
    selectedDate,
    selectedDateRange,
    selectedLocation,
    selectedFormat,
    selectedCategory,
    selectedCategories,
    selectedRelatedTopics,
    priceRange,
    rating,
    activeTab
  ])

  const formatYear = (date: string) =>
    new Date(date).getFullYear()

  const tabs = ["All Events", "Upcoming", "Past", "This Week", "This Month"]

  const handleCategoryToggle = (categoryName: string) => {
    setSelectedCategories((prev) => {
      const newCategories = prev.includes(categoryName)
        ? prev.filter((c) => c !== categoryName)
        : [...prev, categoryName]
      return newCategories
    })
    setCurrentPage(1)
  }

  const handleRelatedTopicToggle = (topicName: string) => {
    setSelectedRelatedTopics((prev) =>
      prev.includes(topicName) ? prev.filter((t) => t !== topicName) : [...prev, topicName],
    )
    setCurrentPage(1)
  }

  const clearAllFilters = () => {
    setSearchQuery("")
    setSelectedCategory("All Events")
    setSelectedCategories([])
    setSelectedRelatedTopics([])
    setSelectedLocation("")
    setSelectedDate(null)
    setSelectedDateRange("")
    setSelectedFormat("All Formats")
    setPriceRange("")
    setRating("")
    setActiveTab("All Events")
    setCurrentPage(1)
    router.push("/event")
  }

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth)
    const firstDayOfMonth = getFirstDayOfMonth(currentMonth)
    const days = []

    const prevMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    const daysInPrevMonth = getDaysInPrevMonth(prevMonth)

    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i
      const date = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), day)
      days.push(
        <div
          key={`prev-${day}`}
          className="h-8 w-8 flex items-center justify-center text-sm text-gray-400 cursor-not-allowed"
        >
          {day}
        </div>,
      )
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
      const hasEvents = events.some((event) => isEventOnDate(event, date))
      const isSelected = selectedDate && isSameDay(date, selectedDate)
      const isToday = isSameDay(date, new Date())

      days.push(
        <button
          key={`current-${day}`}
          onClick={() => handleDateSelect(date)}
          className={`h-8 w-8 flex items-center justify-center text-sm rounded-full relative
            ${isSelected ? "bg-blue-600 text-white" : isToday ? "bg-blue-100 text-blue-600" : "hover:bg-gray-100"}
            ${hasEvents ? "font-semibold" : ""}
          `}
        >
          {day}
          {hasEvents && <div className="absolute bottom-0 w-1 h-1 bg-blue-500 rounded-full"></div>}
        </button>,
      )
    }

    return days
  }

  const getDaysInPrevMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  useEffect(() => {
    setCurrentPage(1)
  }, [
    activeTab,
    searchQuery,
    selectedCategory,
    selectedCategories,
    selectedRelatedTopics,
    selectedLocation,
    selectedFormat,
    selectedDate,
    selectedDateRange,
    priceRange,
    rating,
  ])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2 text-lg font-medium">Loading events...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-red-500 mb-4 text-lg font-semibold">Error: {error}</p>
        <Button onClick={fetchEvents} variant="outline" className="font-medium bg-transparent">
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
      {/* Increased side gaps with wider container padding */}
      <div className="w-full px-2 sm:px-4 md:px-6 lg:px-12 xl:px-16 2xl:px-24 py-6">
        <div className="w-full py-6">
          {/* Tabs Navigation */}
          <div className="flex flex-wrap gap-1 sm:gap-2 mb-6 border-b border-gray-300 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-sm sm:text-base font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === tab
                  ? "border-blue-600 text-blue-700 bg-blue-50"
                  : "border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Active Filters - ALWAYS SHOW CLEAR ALL BUTTON IF ANY FILTER IS ACTIVE */}
          <div className="flex flex-wrap gap-2 mb-6">
            {selectedDate && (
              <Badge variant="secondary" className="flex items-center gap-1 px-3 py-1 text-xs sm:text-sm font-medium">
                <span className="font-bold">Date:</span> {selectedDate.toLocaleDateString()}
                <X className="w-3 h-3 sm:w-4 sm:h-4 cursor-pointer ml-1" onClick={clearDateFilter} />
              </Badge>
            )}
            {selectedLocation && (
              <Badge variant="secondary" className="flex items-center gap-1 px-3 py-1 text-xs sm:text-sm font-medium">
                <span className="font-bold">Location:</span> {selectedLocation}
                <X className="w-3 h-3 sm:w-4 sm:h-4 cursor-pointer ml-1" onClick={clearLocationFilter} />
              </Badge>
            )}
            {selectedFormat !== "All Formats" && (
              <Badge variant="secondary" className="flex items-center gap-1 px-3 py-1 text-xs sm:text-sm font-medium">
                <span className="font-bold">Format:</span> {selectedFormat}
                <X className="w-3 h-3 sm:w-4 sm:h-4 cursor-pointer ml-1" onClick={clearFormatFilter} />
              </Badge>
            )}
            {selectedCategory !== "All Events" && (
              <Badge variant="secondary" className="flex items-center gap-1 px-3 py-1 text-xs sm:text-sm font-medium">
                <span className="font-bold">Category:</span> {selectedCategory}
                <X className="w-3 h-3 sm:w-4 sm:h-4 cursor-pointer ml-1" onClick={() => setSelectedCategory("All Events")} />
              </Badge>
            )}
            {selectedCategories.length > 0 && selectedCategories.map((category) => (
              <Badge variant="secondary" key={category} className="flex items-center gap-1 px-3 py-1 text-xs sm:text-sm font-medium">
                <span className="font-bold">Cat:</span> {category}
                <X className="w-3 h-3 sm:w-4 sm:h-4 cursor-pointer ml-1" onClick={() => handleCategoryToggle(category)} />
              </Badge>
            ))}
            
            {/* ALWAYS SHOW CLEAR ALL BUTTON WHEN THERE ARE ACTIVE FILTERS */}
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllFilters}
                className="text-xs sm:text-sm font-medium bg-transparent border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                Clear All Filters
              </Button>
            )}
          </div>

          {/* Main Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 lg:gap-8">
            {/* Left Sidebar - 3 columns on desktop */}
            <div className="lg:col-span-3 hidden lg:block order-2 lg:order-1">
              <div className="lg:sticky lg:top-6 self-start">
                <Card className="border border-gray-300 shadow-lg bg-white rounded-lg sm:rounded-xl">
                  <CardContent className="p-0">
                    {/* Calendar Section */}
                    <div className="border-b border-gray-200">
                      <button
                        onClick={() => setCalendarOpen(!calendarOpen)}
                        className="w-full flex items-center justify-between p-3 sm:p-4 text-left hover:bg-gray-50 rounded-t-lg sm:rounded-t-xl"
                      >
                        <span className="text-gray-900 font-bold text-sm sm:text-base">📅 Calendar</span>
                        <ChevronDown
                          className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-600 transition-transform ${calendarOpen ? "rotate-180" : ""}`}
                        />
                      </button>
                      {calendarOpen && (
                        <div className="px-3 sm:px-4 pb-4">
                          <div className="grid grid-cols-2 gap-2 mb-4">
                            {[
                              { label: "Today", value: "today" },
                              { label: "Tomorrow", value: "tomorrow" },
                              { label: "This Week", value: "this-week" },
                              { label: "This Month", value: "this-month" },
                            ].map((range) => (
                              <button
                                key={range.value}
                                onClick={() => {
                                  setSelectedDateRange(range.value)
                                  setSelectedDate(null)
                                }}
                                className={`p-2 text-xs text-center rounded border font-bold ${selectedDateRange === range.value
                                  ? "bg-blue-100 border-blue-600 text-blue-800 font-bold"
                                  : "border-gray-300 hover:bg-gray-100 text-gray-700"
                                  }`}
                              >
                                {range.label}
                              </button>
                            ))}
                          </div>

                          <div className="bg-white rounded-lg border border-gray-300 p-3">
                            <div className="flex items-center justify-between mb-3">
                              <button onClick={handlePrevMonth} className="p-1 hover:bg-gray-100 rounded">
                                <ChevronLeft className="w-4 h-4 text-gray-700" />
                              </button>
                              <span className="text-sm font-bold text-gray-900">
                                {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                              </span>
                              <button onClick={handleNextMonth} className="p-1 hover:bg-gray-100 rounded">
                                <ChevronRight className="w-4 h-4 text-gray-700" />
                              </button>
                            </div>

                            <div className="grid grid-cols-7 gap-1 mb-2">
                              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                                <div key={day} className="text-xs font-bold text-gray-600 text-center">
                                  {day}
                                </div>
                              ))}
                            </div>
                            <div className="grid grid-cols-7 gap-1">{renderCalendar()}</div>
                          </div>

                          {selectedDate && (
                            <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200">
                              <p className="text-xs font-medium text-blue-800">
                                Showing events for {selectedDate.toLocaleDateString()}
                              </p>
                              <button
                                onClick={clearDateFilter}
                                className="text-xs font-medium text-blue-600 hover:text-blue-800 mt-1"
                              >
                                Clear date filter
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Format Section */}
                    <div className="border-b border-gray-200">
                      <button
                        onClick={() => setFormatOpen(!formatOpen)}
                        className="w-full flex items-center justify-between p-3 sm:p-4 text-left hover:bg-gray-50"
                      >
                        <span className="text-gray-900 font-bold text-sm sm:text-base">🎯 Format</span>
                        <ChevronDown
                          className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-600 transition-transform ${formatOpen ? "rotate-180" : ""}`}
                        />
                      </button>

                      {formatOpen && (
                        <div className="px-3 sm:px-4 pb-4">
                          <div className="space-y-2">
                            <button
                              onClick={() => setSelectedFormat("All Formats")}
                              className={`w-full text-left p-2 rounded-lg text-xs sm:text-sm flex justify-between items-center font-bold ${selectedFormat === "All Formats"
                                ? "bg-blue-100 text-blue-800 border border-blue-300"
                                : "hover:bg-gray-100 text-gray-700 border border-gray-200"
                                }`}
                            >
                              <span>All Formats</span>
                            </button>

                            {formats.map((format, index) => (
                              <button
                                key={`${format.name}-${index}`}
                                onClick={() => setSelectedFormat(format.name)}
                                className={`w-full text-left p-2 rounded-lg text-xs sm:text-sm flex justify-between items-center font-bold ${selectedFormat === format.name
                                  ? "bg-blue-100 text-blue-800 border border-blue-300"
                                  : "hover:bg-gray-100 text-gray-700 border border-gray-200"
                                  }`}
                              >
                                <span className="truncate">{format.name}</span>
                                <span className="text-xs font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full ml-2 flex-shrink-0">
                                  {format.count}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Location Section */}
                    <div className="border-b border-gray-200">
                      <button
                        onClick={() => setLocationOpen(!locationOpen)}
                        className="w-full flex items-center justify-between p-3 sm:p-4 text-left hover:bg-gray-50"
                      >
                        <span className="text-gray-900 font-bold text-sm sm:text-base">📍 Location</span>
                        <ChevronDown
                          className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-600 transition-transform ${locationOpen ? "rotate-180" : ""}`}
                        />
                      </button>
                      {locationOpen && (
                        <div className="px-3 sm:px-4 pb-4">
                          <div className="relative mb-3">
                            <Input
                              type="text"
                              placeholder="Search locations..."
                              value={selectedLocation}
                              onChange={(e) => setSelectedLocation(e.target.value)}
                              className="text-xs sm:text-sm pr-8 border border-gray-300 rounded-lg py-2 font-bold"
                            />
                            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
                          </div>
                          <div className="space-y-2 max-h-48 sm:max-h-60 overflow-y-auto">
                            {locations.map((location) => (
                              <button
                                key={location.name}
                                onClick={() => setSelectedLocation(location.name)}
                                className={`w-full text-left p-2 rounded-lg text-xs sm:text-sm flex justify-between items-center font-bold ${selectedLocation === location.name
                                  ? "bg-blue-100 text-blue-800 border border-blue-300"
                                  : "hover:bg-gray-100 text-gray-700 border border-gray-200"
                                  }`}
                              >
                                <span className="truncate">{location.name}</span>
                                <span className="text-xs font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full ml-2 flex-shrink-0">
                                  {location.count}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Category Section */}
                    <div className="border-b border-gray-200">
                      <button
                        onClick={() => setCategoryOpen(!categoryOpen)}
                        className="w-full flex items-center justify-between p-3 sm:p-4 text-left hover:bg-gray-50"
                      >
                        <span className="text-gray-900 font-bold text-sm sm:text-base">🏷️ Category</span>
                        <ChevronDown
                          className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-600 transition-transform ${categoryOpen ? "rotate-180" : ""}`}
                        />
                      </button>
                      {categoryOpen && (
                        <div className="px-3 sm:px-4 pb-4">
                          <div className="relative mb-3">
                            <Input
                              type="text"
                              placeholder="Search for Topics..."
                              value={categorySearch}
                              onChange={(e) => setCategorySearch(e.target.value)}
                              className="text-xs sm:text-sm pr-8 border border-gray-300 rounded-lg py-2 font-bold"
                            />
                            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
                          </div>
                          <div className="space-y-3">
                            {filteredCategories
                              .slice(0, showAllCategories ? filteredCategories.length : 8)
                              .map((category) => (
                                <div key={category.name} className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2 sm:space-x-3">
                                    <input
                                      type="checkbox"
                                      checked={selectedCategories.includes(category.name)}
                                      onChange={() => handleCategoryToggle(category.name)}
                                      className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 border border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-xs sm:text-sm font-bold text-gray-800 truncate">
                                      {category.name}
                                    </span>
                                  </div>
                                  <span className="text-xs font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full ml-2 flex-shrink-0">
                                    {category.count}
                                  </span>
                                </div>
                              ))}
                          </div>
                          {filteredCategories.length > 8 && (
                            <button
                              onClick={() => setShowAllCategories(!showAllCategories)}
                              className="w-full mt-3 text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-800"
                            >
                              {showAllCategories ? "View Less" : "View All Categories"}
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Navigation Links */}
                    <div className="p-3 sm:p-4 border-b border-gray-200 hover:bg-gray-50 cursor-pointer">
                      <h3 className="text-red-600 font-bold text-sm sm:text-base mb-1">🔥 Top 100 Events</h3>
                      <p className="text-gray-600 text-xs sm:text-sm font-bold">Discover and track top events</p>
                    </div>

                    <div className="p-3 sm:p-4 border-b border-gray-200 hover:bg-gray-50 cursor-pointer">
                      <h3 className="text-red-600 font-bold text-sm sm:text-base mb-1">🎤 Explore Speaker</h3>
                      <p className="text-gray-600 text-xs sm:text-sm font-bold">Discover and track top events</p>
                    </div>
                    <button
                      onClick={clearAllFilters}
                      className="w-full p-3 sm:p-4 text-left hover:bg-gray-50 transition-colors cursor-pointer rounded-b-lg sm:rounded-b-xl"
                    >
                      <h3 className="text-blue-600 font-bold text-sm sm:text-base">All Events</h3>
                    </button>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Main Content Area - 6 columns on desktop */}
            <div className="lg:col-span-6 order-1 lg:order-2 w-full">
              {/* Dynamic Banner Section - Updated to match the image */}
              <div
                className="flex items-center justify-between mb-8 p-4 sm:p-6 lg:p-8 border border-blue-200 bg-cover bg-center bg-no-repeat relative overflow-hidden rounded-lg sm:rounded-xl lg:rounded-2xl shadow-md"
                style={{
                  backgroundImage: "url('/city/c2.jpg')",
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/60 via-white/40 to-white/20"></div>
                <div className="relative z-10 w-full">
                  <h1 className="font-sans text-[32px] font-extrabold text-gray-600 mb-3 tracking-tight">
                    {getBannerTitle()}
                  </h1>
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    {/* <div className="flex gap-3">
                      <Button className="bg-gray-900 hover:bg-black text-white px-8 py-3 rounded-lg font-black text-lg shadow-lg hover:shadow-xl transition-all duration-300">
                        Follow
                      </Button>
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-black text-lg shadow-lg hover:shadow-xl transition-all duration-300">
                        <Share2 className="w-5 h-5 mr-2" />
                        Share
                      </Button>
                    </div> */}
                  </div>
                </div>
              </div>
              {/* View Toggle and Results Count */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-8">
                <span className="text-xs sm:text-sm font-bold text-gray-700">
                  Showing <span className="text-blue-600">{paginatedEvents.length}</span> of{" "}
                  <span className="text-blue-600">{filteredEvents.length}</span> events
                </span>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="font-bold text-gray-700 border text-xs sm:text-sm"
                  >
                    Previous
                  </Button>
                  {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                    const page = i + 1
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 sm:w-10 sm:h-10 rounded text-xs sm:text-sm font-bold ${currentPage === page
                          ? "bg-blue-600 text-white shadow"
                          : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                          }`}
                      >
                        {page}
                      </button>
                    )
                  })}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="font-bold text-gray-700 border text-xs sm:text-sm"
                  >
                    Next
                  </Button>
                </div>
              </div>

              {/* Events List - Cards with better text alignment */}
              <div className="space-y-6">
                {paginatedEvents.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-lg sm:rounded-xl shadow">
                    <p className="text-gray-500 text-lg sm:text-xl font-bold mb-4">
                      No events found matching your criteria
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4 font-bold text-sm sm:text-base px-4 sm:px-6 py-2 bg-transparent"
                      onClick={clearAllFilters}
                    >
                      Clear All Filters
                    </Button>
                  </div>
                ) : (
                  paginatedEvents.map((event) => (
                    <Link href={`/event/${event.id}`} key={event.id} className="block">
                      <div className="bg-white border border-gray-300 rounded-md overflow-hidden shadow hover:shadow-xl transition-all duration-300 w-full max-w-6xl mx-auto">
                        <CardContent className="p-0">
                          <div className="flex flex-col sm:flex-row">
                            {/* IMAGE SECTION (REDUCED SIZE) */}
                            <div className="relative w-full sm:w-5/12 md:w-[30%] h-[190px]">
                              <img
                                src={getEventImage(event) || "/placeholder.svg"}
                                alt={event.title}
                                className="w-full h-full object-cover rounded-sm p-3 mt-3"
                              />
                            </div>

                            {/* CONTENT SECTION */}
                            <div className="flex-1 flex flex-col justify-between p-4 sm:p-5 relative">
                              {/* RIGHT SIDE BADGES (EDITION + TYPE) */}
                              <div className="absolute top-4 right-4 flex items-center gap-2 bg-white/90 backdrop-blur px-3 py-1 rounded-full shadow-lg">
                                <img
                                  src="/images/VerifiedBadge.png"
                                  alt="Verified"
                                  className="w-5 h-5 object-contain"
                                />
                                <span className="text-xs font-bold text-gray-800">
                                  2nd Edition
                                </span>
                              </div>

                              {/* MAIN CONTENT */}
                              <div className="pr-28">
                                {/* DATE RANGE */}
                                <div className="font-sans text-[14px] font-semibold text-[#212529] mb-1">
                                  {formatDate(event.timings.startDate)}
                                  {event.timings.endDate && <> – {formatDate(event.timings.endDate)}</>}
                                  {" "}{formatYear(event.timings.startDate)}
                                </div>

                                {/* EVENT NAME */}
                                <h3 className="font-sans text-[19.2px] font-semibold text-[#1F5D84] mb-1 line-clamp-2">
                                  {event.title}
                                </h3>

                                {/* LOCATION */}
                                <div className="font-sans text-[14px] font-semibold text-[#212529] mb-2 flex items-center">
                                  <MapPin className="w-4 h-4 mr-1 text-blue-600" />
                                  {event.location?.city ||
                                    event.venue?.venueCity ||
                                    event.location?.address ||
                                    "Location not specified"}
                                </div>

                                {/* CATEGORIES – SINGLE ROW */}
                                {event.categories && event.categories.length > 0 && (
                                  <div className="flex items-center gap-2 mt-2 overflow-hidden whitespace-nowrap">
                                    {event.categories.slice(0, 2).map((category, idx) => (
                                      <span
                                        key={idx}
                                        className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-xs font-bold border truncate max-w-[120px]"
                                        title={category}
                                      >
                                        {category}
                                      </span>
                                    ))}

                                    {event.categories.length > 2 && (
                                      <span className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-xs font-bold border flex-shrink-0">
                                        +{event.categories.length - 2} more
                                      </span>
                                    )}
                                  </div>
                                )}

                                {/* DESCRIPTION */}
                                {event.description && (
                                  <p className="text-[14px] font-medium text-[#495057] mb-2 line-clamp-2 mt-3">
                                    {event.description}
                                  </p>
                                )}
                              </div>

                              {/* DIVIDER */}
                              <div className="border-t border-gray-200 my-3" />

                              {/* BOTTOM ROW */}
                              <div className="flex items-center justify-between gap-4">
                                {/* LEFT ACTIONS */}
                                <div className="flex items-center gap-3">
                                  <ShareButton id={event.id} title={event.title} type="event" />
                                  <BookmarkButton
                                    eventId={event.id}
                                    className="bg-gray-100 hover:bg-white px-3 py-1 rounded-md text-xs"
                                  />
                                </div>

                                {/* RIGHT INFO */}
                                <div className="flex items-center gap-4 text-sm font-bold">
                                  {/* RATING */}
                                  <div className="flex items-center gap-1 text-green-700">
                                    <Star className="w-4 h-4 fill-current" />
                                    {Number.isFinite(event.rating?.average)
                                      ? event.rating.average.toFixed(1)
                                      : "4.5"}
                                  </div>

                                  {/* FREE / PAID */}
                                  <span
                                    className={`px-3 py-1 rounded-full text-xs font-bold ${event.pricing.general === 0
                                      ? "bg-green-100 text-green-800"
                                      : "bg-red-100 text-red-800"
                                      }`}
                                  >
                                    {event.pricing.general === 0 ? "Free Entry" : "Paid Entry"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </div>
                    </Link>
                  ))
                )}
              </div>

              {/* Featured Events */}
              {featuredEvents.length > 0 && (
                <section className="py-10 mt-10">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl sm:text-3xl font-black text-gray-900 underline decoration-blue-600 decoration-4">
                      ✨ Featured Events
                    </h2>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentSlide((prev) => Math.max(0, prev - 1))}
                        className="p-2 border rounded-full"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentSlide((prev) => Math.min(Math.ceil(featuredEvents.length / 3) - 1, prev + 1))
                        }
                        className="p-2 border rounded-full"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {featuredEvents.slice(currentSlide * 3, currentSlide * 3 + 3).map((event) => (
                      <Card
                        key={event.id}
                        className="hover:shadow-xl transition-all duration-300 border border-gray-300 rounded-xl overflow-hidden group"
                      >
                        <div className="relative aspect-video overflow-hidden">
                          <img
                            src={getEventImage(event) || "/placeholder.svg"}
                            alt={event.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute top-3 right-3 bg-white rounded-full p-2 shadow-lg hover:bg-gray-50 cursor-pointer">
                            <Heart className="w-5 h-5 text-gray-700" />
                          </div>
                          <div className="absolute bottom-3 left-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                            Featured ✨
                          </div>
                        </div>
                        <CardContent className="p-5">
                          <h3 className="text-xl font-black text-gray-900 mb-3 line-clamp-2">{event.title}</h3>
                          <div className="flex items-center text-base text-gray-700 mb-2 font-bold">
                            <MapPin className="w-5 h-5 mr-2 text-blue-600 flex-shrink-0" />
                            <span className="truncate">{event.location?.city || "Location TBD"}</span>
                          </div>
                          <div className="flex items-center text-base text-gray-700 mb-4 font-bold">
                            <Calendar className="w-5 h-5 mr-2 text-blue-600 flex-shrink-0" />
                            <span>{formatDate(event.timings.startDate)}</span>
                          </div>
                          <div className="flex items-center justify-between mb-5">
                            <Badge className="bg-blue-100 text-blue-800 text-sm font-bold px-3 py-1.5 border border-blue-200">
                              {event.categories[0] || "Event"}
                            </Badge>
                            <span className="text-lg font-black text-green-700">
                              ⭐ {Number.isFinite(event.rating?.average) ? event.rating.average.toFixed(1) : "4.5"}
                            </span>
                          </div>
                          <button
                            className="w-full bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white py-3 px-4 rounded-lg text-base font-bold shadow-lg hover:shadow-xl transition-all duration-300"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              handleVisitClick(event.id, event.title)
                            }}
                          >
                            Visit Event
                          </button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <div className="flex justify-center mt-6 space-x-2">
                    {Array.from({ length: Math.ceil(featuredEvents.length / 3) }, (_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentSlide(i)}
                        className={`w-3 h-3 rounded-full transition-all duration-300 ${i === currentSlide ? "bg-blue-600 w-8" : "bg-gray-300 hover:bg-gray-400"
                          }`}
                      />
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Right Column - Ads and Trending Events - 3 columns on desktop */}
            <div className="lg:col-span-3 order-3 w-full">
              <div className="lg:sticky lg:top-6 self-start space-y-6">
                {/* Single Ad Card */}
                <div className="w-full">
                  <AdCard />
                </div>

                {/* Trending/Premium Events */}
                <h3 className="text-2xl font-black text-gray-900">🔥 Trending Events</h3>

                {/* Desktop View - Vertical List */}
                <div className="hidden lg:block space-y-4">
                  {events.slice(0, 3).map((event) => (
                    <Link key={event.id} href={`/event/${event.id}`} className="group block">
                      <div className="bg-gradient-to-r from-yellow-100 to-yellow-300 rounded-md p-4 flex gap-4 shadow hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-yellow-200">
                        {/* IMAGE */}
                        <div className="w-20 h-20 flex-shrink-0 rounded-sm overflow-hidden border border-white shadow">
                          <img
                            src={getEventImage(event) || "/placeholder.svg"}
                            alt={event.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        </div>

                        {/* CONTENT */}
                        <div className="flex flex-col flex-1 min-w-0">
                          {/* TITLE — 19.2px system-ui */}
                          <h3 className="font-sans text-[19.2px] font-semibold text-[#1F5D84] mb-1 line-clamp-2">
                            {event.title}
                          </h3>

                          {/* EVENT TYPE / CATEGORY — 14px system-ui */}
                          <p className="font-sans text-[14px] font-medium text-gray-800 mb-2">
                            {event.categories?.[0] || "International Exhibition"}
                          </p>

                          {/* DATE — 14px system-ui */}
                          <div className="flex items-center font-sans text-[14px] font-semibold text-gray-800 mb-1">
                            <CalendarDays className="w-4 h-4 mr-2 text-gray-700" />
                            {formatDate(event.timings.startDate)} {formatYear(event.timings.startDate)}
                          </div>

                          {/* LOCATION — 14px system-ui */}
                          <div className="flex items-center font-sans text-[14px] font-semibold text-gray-800">
                            <MapPin className="w-4 h-4 mr-2 text-blue-700" />
                            {event.location?.city || "Chennai, India"}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Mobile View - Horizontal Scroll */}
                <div className="lg:hidden">
                  <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
                    {events.slice(0, 3).map((event) => (
                      <Link
                        key={event.id}
                        href={`/event/${event.id}`}
                        className="group block flex-shrink-0 w-[320px] sm:w-[360px] snap-start"
                      >
                        <div className="bg-gradient-to-r from-yellow-100 to-yellow-300 rounded-xl p-5 shadow hover:shadow-xl transition-all duration-300 border border-yellow-200 h-full">
                          <div className="w-full aspect-[4/3] rounded-lg overflow-hidden mb-3 border-2 border-white shadow">
                            <img
                              src={getEventImage(event) || "/placeholder.svg"}
                              alt={event.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                          </div>
                          <h3 className="text-lg font-black text-gray-900 mb-2 line-clamp-2">{event.title}</h3>
                          <p className="text-sm text-gray-800 font-bold mb-2">International Exhibition</p>
                          <div className="flex items-center text-sm font-bold text-gray-800 mb-1">
                            <CalendarDays className="w-4 h-4 mr-2 text-gray-700" />
                            {formatDate(event.timings.startDate)}
                          </div>
                          <div className="flex items-center text-sm text-gray-800 font-bold">
                            <MapPin className="w-4 h-4 mr-2 text-blue-700" />
                            {event.location?.city || "Chennai, India"}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <div className="flex justify-center mt-3 space-x-2">
                    {[0, 1, 2].map((index) => (
                      <div key={index} className="w-2 h-2 bg-gray-300 rounded-full" />
                    ))}
                  </div>
                </div>

                {/* Featured Event Card */}
                {featuredEvents[0] && (
                  <Card className="bg-white shadow-xl border border-gray-300 rounded-xl overflow-hidden">
                    <div className="relative aspect-video">
                      <img
                        src={getEventImage(featuredEvents[0]) || "/placeholder.svg"}
                        alt={featuredEvents[0].title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 right-3 bg-white rounded-full p-2 shadow-lg">
                        <Heart className="w-5 h-5 text-gray-700" />
                      </div>
                      <div className="absolute top-3 left-3 flex space-x-2">
                        <Badge className="bg-blue-600 text-white text-sm font-bold px-3 py-1.5 shadow-lg">Expo</Badge>
                        <Badge className="bg-blue-600 text-white text-sm font-bold px-3 py-1.5 shadow-lg">
                          Business
                        </Badge>
                      </div>
                      <div className="absolute bottom-3 right-3 bg-green-100 text-green-800 px-4 py-2 rounded-lg text-sm font-bold shadow-lg">
                        ⭐{" "}
                        {Number.isFinite(featuredEvents[0].rating?.average)
                          ? featuredEvents[0].rating.average.toFixed(1)
                          : "4.5"}
                      </div>
                    </div>
                    <CardContent className="p-5">
                      <h3 className="text-xl font-black text-gray-900 mb-3">{featuredEvents[0].title}</h3>
                      <button
                        className="w-full flex items-center justify-center bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white py-3 px-4 rounded-lg text-base font-bold shadow-lg hover:shadow-xl transition-all duration-300"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleVisitClick(featuredEvents[0].id, featuredEvents[0].title)
                        }}
                      >
                        <UserPlus className="w-5 h-5 mr-2" />
                        Visit Event
                      </button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}