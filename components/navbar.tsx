"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { ChevronDown, Search, User, MapPin, Mic, Calendar } from "lucide-react"
import { signIn, signOut, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

interface SearchEvent {
  id: string
  title: string
  slug: string
  category: string
  startDate: string
  venue?: {
    venueCity: string
    venueCountry: string
  }
  isFeatured: boolean
  isVIP: boolean
  type: string
}

interface SearchVenue {
  id: string
  venueName: string
  venueAddress: string
  venueCity: string
  venueState: string
  venueCountry: string
  maxCapacity: number
  amenities: string[]
  averageRating: number
  type: string
  displayName: string
  location: string
}

interface SearchSpeaker {
  id: string
  firstName: string
  lastName: string
  company: string
  jobTitle: string
  specialties: string[]
  averageRating: number
  totalEvents: number
  type: string
  displayName: string
  expertise: string[]
}

interface SearchResults {
  events: SearchEvent[]
  venues: SearchVenue[]
  speakers: SearchSpeaker[]
  allResults: any[]
}

export default function Navbar() {
  const [exploreOpen, setExploreOpen] = useState(false)
  const [country, setCountry] = useState("IND")
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResults>({
    events: [],
    venues: [],
    speakers: [],
    allResults: []
  })
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'events' | 'venues' | 'speakers'>('all')

  const router = useRouter()
  const searchRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  const toggleExplore = () => setExploreOpen((prev) => !prev)

  const { data: session } = useSession()
  const [showMenu, setShowMenu] = useState(false)

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Search function
  const handleSearchInput = (value: string) => {
    setSearchQuery(value)

    const query = value.trim()

    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    // Cancel previous request
    if (abortRef.current) {
      abortRef.current.abort()
    }

    if (query.length < 2) {
      setSearchResults({
        events: [],
        venues: [],
        speakers: [],
        allResults: []
      })
      setShowSearchResults(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      abortRef.current = new AbortController()
      setIsSearching(true)

      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(query)}&limit=5`,
          { signal: abortRef.current.signal }
        )

        if (!res.ok) return

        const data = await res.json()
        setSearchResults(data)
        setShowSearchResults(true)
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Search error:", err)
        }
      } finally {
        setIsSearching(false)
      }
    }, 500) // 🔥 debounce delay
  }


  // Navigation handlers
  const handleEventClick = (eventId: string) => {
    router.push(`/event/${eventId}`)
    setShowSearchResults(false)
    setSearchQuery("")
  }

  const handleVenueClick = (venueId: string) => {
    router.push(`/venue/${venueId}`) // Updated to match your venue page structure
    setShowSearchResults(false)
    setSearchQuery("")
  }

  const handleSpeakerClick = (speakerId: string) => {
    router.push(`/speakers/${speakerId}`) // Updated to match your speaker page structure
    setShowSearchResults(false)
    setSearchQuery("")
  }

  // UPDATED: Navigate to existing pages with search query
  const handleViewAllResults = (type: string = 'all') => {
    switch (type) {
      case 'events':
        router.push(`/event?search=${encodeURIComponent(searchQuery)}`)
        break
      case 'venues':
        router.push(`/venues?search=${encodeURIComponent(searchQuery)}`)
        break
      case 'speakers':
        router.push(`/speakers?search=${encodeURIComponent(searchQuery)}`)
        break
      default:
        // For 'all', you might want to choose a default page or show a message
        router.push(`/event?search=${encodeURIComponent(searchQuery)}`)
        break
    }
    setShowSearchResults(false)
    setSearchQuery("")
  }

  const handleAddevent = async () => {
    if (!session) {
      alert("You are not logged in. Please login as an organizer.")
      router.push("/organizer-signup")
      return
    }

    const role = session.user?.role

    if (role == "ORGANIZER") {
      router.push(`/organizer-dashboard/${session.user?.id}`)
    } else {
      const confirmed = window.confirm(
        `You are logged in as '${role}'.\n\nPlease login as an organizer to access this page.\n\nClick OK to logout and login as an organizer, or Cancel to stay logged in.`,
      )
      if (confirmed) {
        await signOut({ redirect: false })
        router.push("/login")
      }
    }
  }

  const handleDashboard = () => {
    const role = session?.user?.role

    if (role === "ORGANIZER") {
      router.push(`/organizer-dashboard/${session?.user?.id}`)
    } else if (role === "superadmin") {
      router.push("/admin-dashboard")
    } else if (role === "ATTENDEE") {
      router.push(`/dashboard/${session?.user?.id}`)
    } else {
      router.push("/login")
    }
  }

  const handleClick = () => {
    setShowMenu(!showMenu)
  }

  const handleLogin = () => {
    signIn(undefined, { callbackUrl: "/" })
  }

  const handleLogout = () => {
    signOut({ callbackUrl: "/login" })
  }

  // Helper function to render search results
  const renderSearchResults = () => {
    const resultsToShow = activeTab === 'all'
      ? searchResults.allResults
      : activeTab === 'events'
        ? searchResults.events
        : activeTab === 'venues'
          ? searchResults.venues
          : searchResults.speakers

    if (isSearching) {
      return <div className="p-4 text-center text-gray-500">Searching...</div>
    }

    if (resultsToShow.length === 0) {
      return (
        <div className="p-4 text-center text-gray-500">
          No {activeTab === 'all' ? 'results' : activeTab} found. Try different keywords.
        </div>
      )
    }

    return (
      <div className="max-h-96 overflow-y-auto">
        {resultsToShow.map((result: any) => (
          <div
            key={`${result.type}-${result.id}`}
            className="p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
            onClick={() => {
              if (result.type === 'event' || result.resultType === 'event') {
                handleEventClick(result.id)
              } else if (result.type === 'venue' || result.resultType === 'venue') {
                handleVenueClick(result.id)
              } else if (result.type === 'speaker' || result.resultType === 'speaker') {
                handleSpeakerClick(result.id)
              }
            }}
          >
            <div className="flex items-start gap-3">
              {/* Icon based on type */}
              <div className="flex-shrink-0 mt-1">
                {result.type === 'event' || result.resultType === 'event' ? (
                  <Calendar className="w-4 h-4 text-blue-600" />
                ) : result.type === 'venue' || result.resultType === 'venue' ? (
                  <MapPin className="w-4 h-4 text-green-600" />
                ) : (
                  <Mic className="w-4 h-4 text-purple-600" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 truncate">
                  {result.title || result.displayName || result.venueName || `${result.firstName} ${result.lastName}`}
                </h4>

                {/* Event specific info */}
                {(result.type === 'event' || result.resultType === 'event') && (
                  <>
                    <p className="text-sm text-gray-600 mt-1">
                      {result.venue?.venueCity && result.venue?.venueCountry
                        ? `${result.venue.venueCity}, ${result.venue.venueCountry}`
                        : 'Online Event'
                      }
                    </p>
                    <div className="flex items-center mt-1 space-x-2">
                      {result.isVIP && (
                        <span className="inline-block px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                          VIP
                        </span>
                      )}
                      {result.isFeatured && (
                        <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                          Featured
                        </span>
                      )}
                      <span className="text-xs text-gray-500">
                        {new Date(result.startDate).toLocaleDateString()}
                      </span>
                    </div>
                  </>
                )}

                {/* Venue specific info */}
                {(result.type === 'venue' || result.resultType === 'venue') && (
                  <>
                    <p className="text-sm text-gray-600 mt-1">{result.location}</p>
                    <div className="flex items-center mt-1 space-x-2">
                      {result.maxCapacity && (
                        <span className="text-xs text-gray-500">
                          Capacity: {result.maxCapacity.toLocaleString()}
                        </span>
                      )}
                      {result.averageRating > 0 && (
                        <span className="text-xs text-gray-500">
                          ⭐ {result.averageRating.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </>
                )}

                {/* Speaker specific info */}
                {(result.type === 'speaker' || result.resultType === 'speaker') && (
                  <p className="text-sm text-gray-600 mt-1">
                    Speaker
                  </p>
                )}

              </div>

              {/* Type badge */}
              <div className="flex-shrink-0">
                <span className={`inline-block px-2 py-1 text-xs rounded capitalize ${result.type === 'event' || result.resultType === 'event'
                    ? 'bg-blue-100 text-blue-800'
                    : result.type === 'venue' || result.resultType === 'venue'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-purple-100 text-purple-800'
                  }`}>
                  {result.type || result.resultType}
                </span>
              </div>
            </div>
          </div>
        ))}

        {/* View All Results Button */}
        <div className="p-3 border-t border-gray-100">
          <button
            onClick={() => handleViewAllResults(activeTab)}
            className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            View all {activeTab === 'all' ? 'events' : activeTab} →
          </button>
        </div>
      </div>
    )
  }

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-1xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="flex justify-between h-20 items-center">
          {/* Left group: logo + Explore */}
          <div className="flex items-center space-x-6">
            <Link href="/" className="inline-block">
              <div className="flex items-center ">
                <Image
                  src="/logo/bizlogo.png"
                  alt="BizTradeFairs.com"
                  width={160}
                  height={80}
                  className="h-42 w-auto "
                />
              </div>
            </Link>

            <div className="relative">
              {exploreOpen && (
                <div className="absolute left-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                  <ul className="py-1">
                    <li>
                      <Link href="/trade-fairs">
                        <p className="block px-4 py-2 hover:bg-gray-100">Trade Fairs</p>
                      </Link>
                    </li>
                    <li>
                      <Link href="/conferences">
                        <p className="block px-4 py-2 hover:bg-gray-100">Conferences</p>
                      </Link>
                    </li>
                    <li>
                      <Link href="/webinars">
                        <p className="block px-4 py-2 hover:bg-gray-100">Webinars</p>
                      </Link>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Center group: search bar */}
          <div className="w-full max-w-md flex-1 bg-gray-200 relative" ref={searchRef}>
            <div className="relative">
              <input
                type="text"
                placeholder="Search events, venues, speakers..."
                className="w-full text-black py-2 pl-10 pr-12"
                value={searchQuery}
                onChange={(e) => handleSearchInput(e.target.value)}

                onFocus={() => searchQuery.length >= 2 && setShowSearchResults(true)}
              />
              <Search className="w-5 h-5 absolute right-5 top-1/2 transform -translate-y-1/2" />

              {/* Enhanced Search Results Dropdown */}
              {showSearchResults && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-50 mt-1">
                  {/* Search Tabs */}
                  <div className="flex border-b border-gray-200">
                    {(['all', 'events', 'venues', 'speakers'] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 px-4 py-2 text-sm font-medium capitalize ${activeTab === tab
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-500 hover:text-gray-700'
                          }`}
                      >
                        {tab} {tab !== 'all' && `(${searchResults[tab as keyof SearchResults]?.length || 0})`}
                      </button>
                    ))}
                  </div>

                  {/* Search Results */}
                  {renderSearchResults()}
                </div>
              )}
            </div>
          </div>

          {/* Right group: links + country selector + profile */}
          <div className="flex items-center space-x-6">
            <Link href="/event">
              <p className="text-gray-700 hover:text-gray-900">Top 10 Must Visit</p>
            </Link>
            <Link href="/speakers">
              <p className="text-gray-700 hover:text-gray-900">Speakers</p>
            </Link>

            <p onClick={handleAddevent} className="text-gray-700 hover:text-gray-900  cursor-pointer">
              Add Event
            </p>

            <div className="relative inline-block text-left">
              <button
                onClick={handleClick}
                className="p-2 rounded-full bg-[#002C71] text-white hover:bg-gray-100 focus:outline-none"
              >
                <User className="w-4 h-4" />
              </button>

              {showMenu && (
                <div className="absolute right-0 mt-2 w-32 bg-white border rounded shadow-md z-50">
                  {session ? (
                    <>
                      <button
                        onClick={handleDashboard}
                        className="block w-full px-4 py-2 text-sm text-left hover:bg-gray-100 text-gray-800"
                      >
                        Dashboard
                      </button>
                      <button
                        onClick={handleLogout}
                        className="block w-full px-4 py-2 text-sm text-left hover:bg-red-100 text-red-600"
                      >
                        Logout
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleLogin}
                      className="block w-full px-4 py-2 text-sm text-left hover:bg-blue-100 text-blue-600"
                    >
                      Login
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}