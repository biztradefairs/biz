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
} from "lucide-react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import AdCard from "@/components/add-card"
import { BookmarkButton } from "@/components/bookmark-button"
import { useToast } from "@/hooks/use-toast"
import { ShareButton } from "@/components/share-button"
import { useSession } from "next-auth/react"

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
  const [selectedCategory, setSelectedCategory] = useState(categoryFromUrl || "")

  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [viewMode, setViewMode] = useState("Trending")
  const [selectedDateRange, setSelectedDateRange] = useState("")
  const [priceRange, setPriceRange] = useState("")
  const [rating, setRating] = useState("")

  // Enhanced sidebar state
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

  // Calendar state
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())

  // Auto-scroll state for featured events
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
    
    // Handle different image formats
    if (typeof image === 'string') {
      return image
    } else if (image && typeof image === 'object' && image.url) {
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

        return {
          ...event,
          id: String(resolvedId || ""),
          eventType: event.eventType || categories?.[0] || "Other",
          timings: {
            startDate: event.startDate,
            endDate: event.endDate,
          },
          location: {
            address: event.venue?.venueAddress || "Not Added",
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

  // Fixed categories with accurate counts
  const categories = useMemo(() => {
    if (!events || events.length === 0) return []

    const categoryMap = new Map<string, number>()
    
    // Count actual categories from events
    events.forEach((event) => {
      if (event.categories && Array.isArray(event.categories)) {
        event.categories.forEach((category) => {
          if (category && typeof category === 'string') {
            const normalized = category.trim()
            if (normalized) {
              categoryMap.set(normalized, (categoryMap.get(normalized) || 0) + 1)
            }
          }
        })
      }
    })
    
    // If we found categories in events, use them
    if (categoryMap.size > 0) {
      return Array.from(categoryMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
    }
    
    // Fallback: use hardcoded categories with accurate counts
    const hardcodedCategories = [
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
      "Science & Research",
      "Environment & Waste",
      "Agriculture & Forestry",
      "Food & Beverages",
      "Logistics & Transportation",
      "Electric & Electronics",
      "Arts & Crafts",
      "Auto & Automotive",
      "Home & Office",
      "Security & Defense",
      "Fashion & Beauty",
      "Travel & Tourism",
      "Telecommunication",
      "Apparel & Clothing",
      "Animals & Pets",
      "Baby, Kids & Maternity",
      "Hospitality",
      "Packing & Packaging",
      "Miscellaneous",
    ]

    return hardcodedCategories.map((categoryName) => {
      const count = events.filter((event) => {
        if (!event.categories || !Array.isArray(event.categories)) return false
        return event.categories.some((cat) => {
          if (!cat || typeof cat !== 'string') return false
          return cat.toLowerCase().includes(categoryName.toLowerCase())
        })
      }).length
      return { name: categoryName, count }
    }).filter(cat => cat.count > 0)
  }, [events])

  // Fixed formats with accurate counts
const formats = useMemo(() => {
  const formatMap = new Map<string, number>()
  
  // Add "All Formats" option
  formatMap.set("All Formats", events.length)
  
  events.forEach((event) => {
    let formatName = ""
    
    // Try to get format from eventType first
    if (event.eventType && typeof event.eventType === 'string') {
      formatName = event.eventType.trim()
    } 
    // Fallback to first category
    else if (event.categories && Array.isArray(event.categories) && event.categories.length > 0) {
      const firstCategory = event.categories[0]
      if (typeof firstCategory === 'string') {
        formatName = firstCategory.trim()
      }
    }
    
    // If still no format name, use "Other"
    if (!formatName) {
      formatName = "Other"
    }
    
    // Normalize common format names
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
    
    // Count the format
    formatMap.set(formatName, (formatMap.get(formatName) || 0) + 1)
  })
  
  // Remove "All Formats" from the count map since we'll add it separately
  const allFormatsCount = formatMap.get("All Formats") || 0
  formatMap.delete("All Formats")
  
  // Convert to array and sort by count
  const formatArray = Array.from(formatMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
  
  // Add "All Formats" at the top
  return [
    { name: "All Formats", count: allFormatsCount },
    ...formatArray
  ]
}, [events])

  // Fixed locations with accurate counts
  const locations = useMemo(() => {
    if (!events || events.length === 0) return []

    const locationMap = new Map<string, number>()
    
    events.forEach((event) => {
      // Create a unique identifier for this event's location
      let locationKey = ""
      
      // Prefer venue city if available
      if (event.venue?.venueCity) {
        locationKey = event.venue.venueCity.trim()
      } 
      // Fall back to location city
      else if (event.location?.city) {
        locationKey = event.location.city.trim()
      }
      // Fall back to venue country
      else if (event.venue?.venueCountry) {
        locationKey = event.venue.venueCountry.trim()
      }
      // Last resort: use address
      else if (event.location?.address) {
        const addressParts = event.location.address.split(',')
        locationKey = addressParts[0]?.trim() || "Unknown"
      }
      
      // Only count if we have a valid location
      if (locationKey && locationKey !== "Not Added" && locationKey !== "Unknown") {
        locationMap.set(locationKey, (locationMap.get(locationKey) || 0) + 1)
      }
    })
    
    // Convert to array and sort by count
    return Array.from(locationMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => {
        // Sort by count descending, then alphabetically
        if (b.count !== a.count) {
          return b.count - a.count
        }
        return a.name.localeCompare(b.name)
      })
  }, [events])

  // Enhanced categories with search functionality
  const filteredCategories = useMemo(() => {
    return categories.filter((category) => category.name.toLowerCase().includes(categorySearch.toLowerCase()))
  }, [categories, categorySearch])

  // Related topics (using same data as categories for demo)
  const relatedTopics = useMemo(() => {
    return categories.map((cat) => ({ ...cat, name: `${cat.name} Related` }))
  }, [categories])

  // Calendar functions
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

  const getEventsOnDate = (date: Date) => {
    return events.filter((event) => isEventOnDate(event, date))
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

  // Helper function to check if event is in date range
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

  // Helper function to check if event matches tab filter
  const isEventInTab = (event: any, tab: string) => {
    const eventDate = new Date(event.timings.startDate)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    const monthFromNow = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate())
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)

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

  // Filter events based on selected criteria
  const filteredEvents = useMemo(() => {
    let filtered = events

    // Tab filter
    filtered = filtered.filter((event) => isEventInTab(event, activeTab))

    // Date filter (specific date selection)
    if (selectedDate) {
      filtered = filtered.filter((event) => isEventOnDate(event, selectedDate))
    }

    // Date range filter
    if (selectedDateRange && !selectedDate) {
      filtered = filtered.filter((event) => isEventInDateRange(event, selectedDateRange))
    }

    // Search filter
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

    // Category filter
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((event) =>
        event.categories?.some((cat) =>
          selectedCategories.some((selectedCat) => 
            cat.toLowerCase().trim() === selectedCat.toLowerCase().trim()
          )
        )
      )
    } else if (selectedCategory) {
      filtered = filtered.filter((event) =>
        event.categories?.some((cat) => 
          cat.toLowerCase().trim() === selectedCategory.toLowerCase().trim()
        )
      )
    }

    // Related topics filter
    if (selectedRelatedTopics.length > 0) {
      const relatedCats = selectedRelatedTopics.map((topic) => topic.replace(" Related", ""))
      filtered = filtered.filter((event) => event.categories.some((cat) => relatedCats.includes(cat)))
    }

    // Location filter
    if (selectedLocation) {
      filtered = filtered.filter((event) => {
        const searchTerm = selectedLocation.toLowerCase()
        
        // Check all possible location fields
        const venueCity = event.venue?.venueCity?.toLowerCase() || ""
        const venueCountry = event.venue?.venueCountry?.toLowerCase() || ""
        const eventCity = event.location?.city?.toLowerCase() || ""
        const eventAddress = event.location?.address?.toLowerCase() || ""
        
        // Return true if any location field contains the search term
        return venueCity.includes(searchTerm) || 
               venueCountry.includes(searchTerm) || 
               eventCity.includes(searchTerm) || 
               eventAddress.includes(searchTerm)
      })
    }

    // Format filter
    if (selectedFormat && selectedFormat !== "All Formats") {
      filtered = filtered.filter((event) => {
        // Ensure we get a string value
        const eventType = event.eventType || event.categories?.[0] || ""
        // Convert to string explicitly and check type
        const eventTypeStr = String(eventType).toLowerCase().trim()
        const selectedFormatStr = String(selectedFormat).toLowerCase().trim()
        return eventTypeStr === selectedFormatStr
      })
    }

    // Price range filter
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

    // Rating filter
    if (rating) {
      const minRating = Number.parseFloat(rating)
      filtered = filtered.filter((event) => event.rating.average >= minRating)
    }

    // Sort based on view mode
    if (viewMode === "Trending") {
      filtered.sort((a, b) => b.rating.average - a.rating.average)
    } else if (viewMode === "Date") {
      filtered.sort((a, b) => new Date(a.timings.startDate).getTime() - new Date(b.timings.startDate).getTime())
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
    viewMode,
  ])

  // Dynamic banner title based on filters
  const getBannerTitle = () => {
    if (selectedDate) {
      return `Events on ${selectedDate.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`
    }
    if (selectedCategories.length > 0) {
      return `${selectedCategories.join(", ")} Events`
    }
    if (selectedCategory) {
      return `${selectedCategory} Events`
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
    return "All Events"
  }

  const getFollowerCount = () => {
    const total = filteredEvents.reduce((sum, ev) => sum + (visitorCounts[ev.id] || 0), 0)
    if (total >= 1000) return `${Math.round(total / 1000)}K+ Followers`
    return `${total} Followers`
  }

  // Pagination
  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage)
  const paginatedEvents = filteredEvents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  // Featured events
  const featuredEvents = events.filter((event) => event.featured)

  // Auto-scroll effect for featured events
  useEffect(() => {
    if (featuredEvents.length === 0 || isHovered || isTransitioning) return

    const totalSlides = Math.ceil(featuredEvents.length / 3)
    const interval = setInterval(() => {
      setIsTransitioning(true)
      setCurrentSlide((prev) => (prev + 1) % totalSlides)
    }, 3000)

    return () => clearInterval(interval)
  }, [featuredEvents.length, isHovered, isTransitioning])

  // Handle transition end
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
      year: "numeric",
    })
  }

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
    setSelectedCategory("")
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

  // Calendar rendering
  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth)
    const firstDayOfMonth = getFirstDayOfMonth(currentMonth)
    const days = []

    // Previous month days
    const prevMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    const daysInPrevMonth = getDaysInMonth(prevMonth)

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

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
      const hasEvents = getEventsOnDate(date).length > 0
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

  // Reset page when filters change
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
        <span className="ml-2">Loading events...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-red-500 mb-4">Error: {error}</p>
        <Button onClick={fetchEvents} variant="outline">
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="w-full px-4 py-6">
          {/* Dynamic Banner Section */}
          <div
            className="flex items-center justify-between mb-6 p-6 border border-blue-200 bg-cover bg-center bg-no-repeat relative overflow-hidden"
            style={{
              backgroundImage: "url('/city/c2.jpg')",
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/40 via-blue-50/30 to-purple-50/40"></div>
            <div className="relative z-10">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{getBannerTitle()}</h1>
              <p className="text-gray-700 text-lg">{getFollowerCount()}</p>
            </div>
          </div>

          {/* Active Filters */}
          <div className="flex flex-wrap gap-2 mb-6">
            {selectedDate && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Date: {selectedDate.toLocaleDateString()}
                <X className="w-3 h-3 cursor-pointer" onClick={clearDateFilter} />
              </Badge>
            )}
            {selectedLocation && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Location: {selectedLocation}
                <X className="w-3 h-3 cursor-pointer" onClick={clearLocationFilter} />
              </Badge>
            )}
            {selectedFormat !== "All Formats" && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Format: {selectedFormat}
                <X className="w-3 h-3 cursor-pointer" onClick={clearFormatFilter} />
              </Badge>
            )}
            {(selectedDate || selectedLocation || selectedFormat !== "All Formats") && (
              <Button variant="outline" size="sm" onClick={clearAllFilters}>
                Clear All
              </Button>
            )}
          </div>

          {/* Tabs Navigation */}
          <div className="flex space-x-1 mb-6 border-b border-gray-200">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex flex-col lg:flex-row items-start gap-6">
            {/* Left Sidebar - Fixed width */}
            <div className="w-full lg:w-80 lg:sticky lg:top-6 self-start flex-shrink-0">
              <Card className="border border-gray-200 shadow-sm bg-white">
                <CardContent className="p-0">
                  {/* Calendar Section */}
                  <div className="border-b border-gray-100">
                    <button
                      onClick={() => setCalendarOpen(!calendarOpen)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
                    >
                      <span className="text-gray-900 font-medium">Calendar</span>
                      <ChevronDown
                        className={`w-4 h-4 text-gray-400 transition-transform ${calendarOpen ? "rotate-180" : ""}`}
                      />
                    </button>
                    {calendarOpen && (
                      <div className="px-4 pb-4">
                        {/* Quick Date Filters */}
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
                              className={`p-2 text-xs text-center rounded border ${
                                selectedDateRange === range.value
                                  ? "bg-blue-100 border-blue-500 text-blue-700"
                                  : "border-gray-200 hover:bg-gray-50"
                              }`}
                            >
                              {range.label}
                            </button>
                          ))}
                        </div>

                        {/* Calendar */}
                        <div className="bg-white rounded-lg border border-gray-200 p-3">
                          {/* Calendar Header */}
                          <div className="flex items-center justify-between mb-4">
                            <button onClick={handlePrevMonth} className="p-1 hover:bg-gray-100 rounded">
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="text-sm font-semibold">
                              {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                            </span>
                            <button onClick={handleNextMonth} className="p-1 hover:bg-gray-100 rounded">
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Calendar Days */}
                          <div className="grid grid-cols-7 gap-1 mb-2">
                            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                              <div key={day} className="text-xs text-gray-500 text-center font-medium">
                                {day}
                              </div>
                            ))}
                          </div>
                          <div className="grid grid-cols-7 gap-1">{renderCalendar()}</div>
                        </div>

                        {selectedDate && (
                          <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200">
                            <p className="text-xs text-blue-700">
                              Showing events for {selectedDate.toLocaleDateString()}
                            </p>
                            <button
                              onClick={clearDateFilter}
                              className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                            >
                              Clear date filter
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Format Section */}
                  <div className="border-b border-gray-100">
                    <button
                      onClick={() => setFormatOpen(!formatOpen)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
                    >
                      <span className="text-gray-900 font-medium">Format</span>
                      <ChevronDown
                        className={`w-4 h-4 text-gray-400 transition-transform ${formatOpen ? "rotate-180" : ""}`}
                      />
                    </button>

                    {formatOpen && (
                      <div className="px-4 pb-4">
                        <div className="space-y-2">
                          {/* All Formats option */}
                          <button
                            onClick={() => setSelectedFormat("All Formats")}
                            className={`w-full text-left p-2 rounded text-sm flex justify-between items-center ${
                              selectedFormat === "All Formats" ? "bg-blue-100 text-blue-700" : "hover:bg-gray-50"
                            }`}
                          >
                            <span>All Formats</span>
                          </button>

                          {/* Dynamic Formats from event.eventType */}
                          {formats.map((format, index) => (
                            <button
                              key={`${format.name || "format"}-${index}`}
                              onClick={() => setSelectedFormat(format.name)}
                              className={`w-full text-left p-2 rounded text-sm flex justify-between items-center ${
                                selectedFormat === format.name ? "bg-blue-100 text-blue-700" : "hover:bg-gray-50"
                              }`}
                            >
                              <span>{format.name || "Unnamed Format"}</span>
                              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                {format.count ?? 0}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Location Section */}
                  <div className="border-b border-gray-100">
                    <button
                      onClick={() => setLocationOpen(!locationOpen)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
                    >
                      <span className="text-gray-900 font-medium">Location</span>
                      <ChevronDown
                        className={`w-4 h-4 text-gray-400 transition-transform ${locationOpen ? "rotate-180" : ""}`}
                      />
                    </button>
                    {locationOpen && (
                      <div className="px-4 pb-4">
                        <div className="relative mb-3">
                          <Input
                            type="text"
                            placeholder="Search locations..."
                            value={selectedLocation}
                            onChange={(e) => setSelectedLocation(e.target.value)}
                            className="text-sm pr-8 border-gray-200"
                          />
                          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        </div>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {locations.map((location) => (
                            <button
                              key={location.name}
                              onClick={() => setSelectedLocation(location.name)}
                              className={`w-full text-left p-2 rounded text-sm flex justify-between items-center ${
                                selectedLocation === location.name ? "bg-blue-100 text-blue-700" : "hover:bg-gray-50"
                              }`}
                            >
                              <span>{location.name}</span>
                              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                {location.count}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Category Section */}
                  <div className="border-b border-gray-100">
                    <button
                      onClick={() => setCategoryOpen(!categoryOpen)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
                    >
                      <span className="text-gray-900 font-medium">Category</span>
                      <ChevronDown
                        className={`w-4 h-4 text-gray-400 transition-transform ${categoryOpen ? "rotate-180" : ""}`}
                      />
                    </button>
                    {categoryOpen && (
                      <div className="px-4 pb-4">
                        <div className="relative mb-3">
                          <Input
                            type="text"
                            placeholder="Search for Topics"
                            value={categorySearch}
                            onChange={(e) => setCategorySearch(e.target.value)}
                            className="text-sm pr-8 border-gray-200"
                          />
                          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        </div>
                        <div className="space-y-3">
                          {filteredCategories
                            .slice(0, showAllCategories ? filteredCategories.length : 10)
                            .map((category) => (
                              <div key={category.name} className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <input
                                    type="checkbox"
                                    checked={selectedCategories.includes(category.name)}
                                    onChange={() => handleCategoryToggle(category.name)}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                  />
                                  <span className="text-sm text-gray-700">{category.name}</span>
                                </div>
                                <span className="text-xs text-gray-500">{category.count}</span>
                              </div>
                            ))}
                        </div>
                        {filteredCategories.length > 10 && (
                          <button
                            onClick={() => setShowAllCategories(!showAllCategories)}
                            className="w-full mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium"
                          >
                            {showAllCategories ? "View Less" : "View All"}
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Navigation Links */}
                  <div className="p-4 border-b border-gray-100">
                    <h3 className="text-red-500 font-medium mb-1">Top 100 Events</h3>
                    <p className="text-sm text-gray-500">Discover and track top events</p>
                  </div>

                  <div className="p-4 border-b border-gray-100">
                    <h3 className="text-red-500 font-medium mb-1">Explore Speaker</h3>
                    <p className="text-sm text-gray-500">Discover and track top events</p>
                  </div>
                  <button
                    onClick={clearAllFilters}
                    className="w-full p-4 border-b border-gray-100 text-left hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <h3 className="text-blue-600 font-medium">All Events</h3>
                  </button>
                </CardContent>
              </Card>
            </div>

            {/* Main Content - Reduced width */}
            <div className="flex-1 w-full max-w-3xl min-w-0 space-y-6">
              {/* View Toggle and Results Count */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">
                    Showing {paginatedEvents.length} of {filteredEvents.length} events
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="text-gray-600"
                  >
                    Previous
                  </Button>
                  {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                    const page = i + 1
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 rounded text-sm font-medium ${
                          currentPage === page
                            ? "bg-blue-600 text-white"
                            : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
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
                    className="text-gray-600"
                  >
                    Next
                  </Button>
                </div>
              </div>

              {/* Events List */}
              <div className="space-y-4">
                {paginatedEvents.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">No events found matching your criteria</p>
                    <Button variant="outline" className="mt-4 bg-transparent" onClick={clearAllFilters}>
                      Clear All Filters
                    </Button>
                  </div>
                ) : (
                  paginatedEvents.map((event) => (
                    <Link href={`/event/${event.id}`} key={event.id} className="block">
                      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all w-full">
                        <CardContent className="p-0 flex">
                          {/* Left Image Section */}
                          <div className="relative w-[80px] h-[100px] sm:w-[100px] sm:h-[120px] md:w-[120px] md:h-[140px] lg:w-[140px] lg:h-[160px] flex-shrink-0">
                            <img
                              src={getEventImage(event) || "/placeholder.svg"}
                              alt={event.title}
                              className="object-cover m-2 rounded-sm w-full h-full"
                            />
                          </div>

                          {/* Right Section */}
                          <div className="flex-1 flex flex-col px-10 py-1 min-w-0">
                            {/* Top Section */}
                            <div className="min-w-0">
                              <div className="flex items-start justify-between min-w-0">
                                <div className="min-w-0 flex-1">
                                  <h3 className="text-xl font-bold text-gray-900 truncate">{event.title}</h3>
                                  <div className="flex items-center text-gray-600 mt-1">
                                    <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                                    <span className="text-xs font-medium truncate">
                                      {event.location?.address || "Address not available"}
                                    </span>
                                  </div>
                                  <div className="flex items-center text-gray-600 mt-1">
                                    <Calendar className="w-3 h-3 mr-1 flex-shrink-0" />
                                    <span className="text-xs font-medium">{formatDate(event.timings.startDate)}</span>
                                  </div>
                                  <div className="flex items-center flex-wrap gap-3 p-2">
                                    <Badge className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs font-medium">
                                      Paid entry
                                    </Badge>
                                    <div className="flex gap-3">
                                      <div className="flex items-center gap-1 bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-xs font-semibold">
                                        <Star className="w-3 h-3 fill-current" />
                                        <span>
                                          {Number.isFinite(event.rating?.average)
                                            ? event.rating.average.toFixed(1)
                                            : "4.5"}
                                        </span>
                                        {event.totalReviews && event.totalReviews > 0 && (
                                          <span className="text-xs text-gray-500 ml-1">({event.totalReviews})</span>
                                        )}
                                      </div>
                                      <div className="flex items-center text-gray-600 text-xs gap-1">
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          className="w-3 h-3 text-gray-400"
                                          fill="none"
                                          viewBox="0 0 24 24"
                                          stroke="currentColor"
                                          strokeWidth={2}
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M17 20h5v-2a4 4 0 00-4-4h-1M9 20H4v-2a4 4 0 014-4h1m4-9a4 4 0 100 8 4 4 0 000-8z"
                                          />
                                        </svg>
                                        {visitorCounts[event.id] || 0} Followers
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-3">
                                  <div className="flex items-center gap-1">
                                    <div className="w-5 h-5">
                                      <img
                                        src="/images/VerifiedBadge.png"
                                        alt="Verified"
                                        className="w-full h-full object-contain"
                                      />
                                    </div>
                                    <span className="text-gray-600 font-medium text-xs">2nd Edition</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-1 mt-2">
                                {event.categories?.slice(0, 2).map((category: string, idx: number) => (
                                  <Badge
                                    key={idx}
                                    className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0"
                                  >
                                    {category}
                                  </Badge>
                                ))}
                              </div>
                            </div>

                            <div className="border-t border-gray-200 mt-3" />

                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-2 text-xs text-gray-600 flex-wrap">
                                <div className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-700 flex-shrink-0 text-xs">
                                  {typeof event.organizer === "string"
                                    ? event.organizer.charAt(0)
                                    : event.organizer?.name?.charAt(0) || "M"}
                                </div>
                                <span className="truncate">
                                  {typeof event.organizer === "string"
                                    ? event.organizer
                                    : event.organizer?.name || "Maxx Business Media Pvt Ltd"}
                                </span>
                              </div>

                              {/* Share + Save + Visit Buttons */}
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <ShareButton id={event.id} title={event.title} type="event" />
                                
                                <BookmarkButton
                                  eventId={event.id}
                                  className="flex items-center bg-red-600 hover:bg-red-700 text-white px-3 py-2 mt-1 rounded-md text-sm shadow-sm"
                                  onClick={(e: React.MouseEvent) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    handleVisitClick(event.id, event.title)
                                  }}
                                >
                                  Save
                                </BookmarkButton>
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
                <section className="py-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 underline">Featured Events</h2>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentSlide((prev) => Math.max(0, prev - 1))}
                        className="p-2 bg-transparent"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentSlide((prev) => Math.min(Math.ceil(featuredEvents.length / 3) - 1, prev + 1))
                        }
                        className="p-2 bg-transparent"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {featuredEvents.slice(currentSlide * 3, currentSlide * 3 + 3).map((event) => (
                      <Card key={event.id} className="hover:shadow-lg transition-shadow bg-white">
                        <div className="relative">
                          <img
                            src={getEventImage(event) || "/placeholder.svg"}
                            alt={event.title}
                            className="w-full h-48 object-cover rounded-t-lg"
                          />
                          <div className="absolute top-3 right-3 bg-white rounded-full p-2 shadow-md">
                            <Heart className="w-4 h-4 text-gray-600" />
                          </div>
                          <div className="absolute bottom-3 left-3 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                            Featured ✨
                          </div>
                        </div>
                        <CardContent className="p-4">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate">{event.title}</h3>
                          <div className="flex items-center text-sm text-gray-600 mb-1">
                            <MapPin className="w-4 h-4 mr-2" />
                            <span>{event.location?.city || "Location TBD"}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600 mb-3">
                            <Calendar className="w-4 h-4 mr-2" />
                            <span>{formatDate(event.timings.startDate)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <Badge className="bg-blue-600 text-white text-xs">{event.categories[0]}</Badge>
                            <span className="text-sm font-bold text-green-600">
                              {Number.isFinite(event.rating?.average) ? event.rating.average.toFixed(1) : "4.5"}
                            </span>
                          </div>
                          <button
                            className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              handleVisitClick(event.id, event.title)
                            }}
                          >
                            Visit
                          </button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <div className="flex justify-center mt-4 space-x-1">
                    {Array.from({ length: Math.ceil(featuredEvents.length / 3) }, (_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentSlide(i)}
                        className={`w-2 h-2 rounded-full ${i === currentSlide ? "bg-blue-600" : "bg-gray-300"}`}
                      />
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Right Column - Fixed width */}
            <div className="w-full lg:w-80 space-y-6 self-start flex-shrink-0">
              <AdCard />

              {featuredEvents[0] && (
                <Card className="bg-white shadow-lg">
                  <div className="relative">
                    <img
                      src={getEventImage(featuredEvents[0]) || "/placeholder.svg"}
                      alt={featuredEvents[0].title}
                      className="w-full h-48 object-cover rounded-t-lg"
                    />
                    <div className="absolute top-3 right-3 bg-white rounded-full p-2 shadow-md">
                      <Heart className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="absolute top-3 left-3 flex space-x-2">
                      <Badge className="bg-blue-600 text-white text-xs">Expo</Badge>
                      <Badge className="bg-blue-600 text-white text-xs">Business Event</Badge>
                    </div>
                    <div className="absolute bottom-3 right-3 bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-semibold">
                      {Number.isFinite(featuredEvents[0].rating?.average)
                        ? featuredEvents[0].rating.average.toFixed(1)
                        : "4.5"}
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <button
                      className="w-full flex items-center justify-center bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md text-sm shadow-sm"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleVisitClick(featuredEvents[0].id, featuredEvents[0].title)
                      }}
                    >
                      <UserPlus className="w-4 h-4 mr-1" />
                      Visit
                    </button>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-5">
                {events.slice(0, 3).map((event) => (
                  <Link key={event.id} href={`/event/${event.id}`} className="group block">
                    <div className="bg-gradient-to-r from-yellow-100 to-yellow-300 rounded-2xl p-4 flex flex-col gap-4 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                      <div className="flex items-start gap-3">
                        <div className="w-[90px] h-[80px] flex-shrink-0 rounded-xl overflow-hidden">
                          <img
                            src={getEventImage(event) || "/placeholder.svg"}
                            alt={event.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex flex-col text-left">
                          <h3 className="text-sm font-bold text-gray-900 leading-tight line-clamp-2">{event.title}</h3>
                          <p className="text-xs text-gray-700 mb-1">International Exhibition</p>
                          <div className="flex items-center text-xs font-semibold text-gray-800">
                            <CalendarDays className="w-3 h-3 mr-1 text-gray-700" />
                            {formatDate(event.timings.startDate)}
                          </div>
                          <div className="flex items-center text-xs text-gray-700 mt-1">
                            <MapPin className="w-3 h-3 mr-1 text-blue-700" />
                            {event.location?.city || "Chennai, India"}
                          </div>
                        </div>
                      </div>
                      <div className="border-t border-gray-300"></div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}