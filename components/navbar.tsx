"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { ChevronDown, Search, User, MapPin, Mic, Calendar, Menu, X } from "lucide-react"
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showMobileSearch, setShowMobileSearch] = useState(false)

  const router = useRouter()
  const searchRef = useRef<HTMLDivElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)
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
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false)
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
    setMobileMenuOpen(false)
    setShowMobileSearch(false)
  }

  const handleVenueClick = (venueId: string) => {
    router.push(`/venue/${venueId}`)
    setShowSearchResults(false)
    setSearchQuery("")
    setMobileMenuOpen(false)
    setShowMobileSearch(false)
  }

  const handleSpeakerClick = (speakerId: string) => {
    router.push(`/speakers/${speakerId}`)
    setShowSearchResults(false)
    setSearchQuery("")
    setMobileMenuOpen(false)
    setShowMobileSearch(false)
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
        router.push(`/event?search=${encodeURIComponent(searchQuery)}`)
        break
    }
    setShowSearchResults(false)
    setSearchQuery("")
    setMobileMenuOpen(false)
    setShowMobileSearch(false)
  }

  const handleAddevent = async () => {
    if (!session) {
      router.push("/organizer-signup")
      setMobileMenuOpen(false)
      return
    }

    const role = session.user?.role

    if (role === "ORGANIZER") {
      router.push(`/organizer-dashboard/${session.user?.id}`)
      setMobileMenuOpen(false)
      return
    }

    if (role === "superadmin") {
      router.push("/admin-dashboard")
      setMobileMenuOpen(false)
      return
    }

    const confirmed = window.confirm(
      `You are logged in as '${role}'.\n\nPlease login as an organizer to access this page.\n\nClick OK to logout and login as an organizer, or Cancel to stay logged in.`,
    )

    if (confirmed) {
      await signOut({ redirect: false })
      router.push("/organizer-signup")
      setMobileMenuOpen(false)
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
    setMobileMenuOpen(false)
  }

  const handleClick = () => {
    setShowMenu(!showMenu)
  }

  const handleLogin = () => {
    signIn(undefined, { callbackUrl: "/" })
    setMobileMenuOpen(false)
  }

  const handleLogout = () => {
    signOut({ callbackUrl: "/login" })
    setMobileMenuOpen(false)
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

                {(result.type === 'speaker' || result.resultType === 'speaker') && (
                  <p className="text-sm text-gray-600 mt-1">
                    Speaker
                  </p>
                )}

              </div>

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
    <nav className="bg-white shadow-[0_4px_12px_rgba(0,0,0,0.12)] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          {/* Left section: Logo and mobile menu button */}
          <div className="flex items-center space-x-4">
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>

            {/* Logo */}
            <Link href="/" className="inline-block">
              <div className="flex items-center">
                <Image
                  src="/logo/bizlogo.png"
                  alt="BizTradeFairs.com"
                  width={300}
                  height={140}
                  priority
                  className="
    h-auto
    w-auto
    max-h-24
    md:max-h-28
    lg:max-h-32
  "
                />

              </div>
            </Link>
          </div>

          {/* Center section: Search bar - Desktop */}
          <div className="hidden lg:block flex-1 max-w-2xl mx-4">
            <div className="relative" ref={searchRef}>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search events, venues, speakers..."
                  className="w-full py-2 pl-4 pr-12 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-black"
                  value={searchQuery}
                  onChange={(e) => handleSearchInput(e.target.value)}
                  onFocus={() => searchQuery.length >= 2 && setShowSearchResults(true)}
                />
                <Search className="w-5 h-5 absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>

              {showSearchResults && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-50 mt-1">
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
                  {renderSearchResults()}
                </div>
              )}
            </div>
          </div>

          {/* Right section: Desktop navigation */}
          <div className="hidden lg:flex items-center space-x-6">
            <Link href="/event">
              <p className="text-gray-700 hover:text-gray-900 transition-colors">Top 10 Must Visit</p>
            </Link>
            <Link href="/speakers">
              <p className="text-gray-700 hover:text-gray-900 transition-colors">Speakers</p>
            </Link>

            <p onClick={handleAddevent} className="text-gray-700 hover:text-gray-900 transition-colors cursor-pointer">
              Add Event
            </p>

            <div className="relative inline-block text-left">
              <button
                onClick={handleClick}
                className="p-2 rounded-full bg-[#002C71] text-white hover:bg-[#001a48] transition-colors focus:outline-none"
              >
                <User className="w-5 h-5" />
              </button>

              {showMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg z-50">
                  {session ? (
                    <>
                      <div className="px-4 py-3 border-b">
                        <p className="text-sm font-medium text-gray-900">{session.user?.name}</p>
                        <p className="text-xs text-gray-500">{session.user?.email}</p>
                      </div>
                      <button
                        onClick={handleDashboard}
                        className="block w-full px-4 py-3 text-left hover:bg-gray-50 text-gray-700 border-b transition-colors"
                      >
                        Dashboard
                      </button>
                      <button
                        onClick={handleLogout}
                        className="block w-full px-4 py-3 text-left hover:bg-red-50 text-red-600 transition-colors"
                      >
                        Logout
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleLogin}
                      className="block w-full px-4 py-3 text-left hover:bg-blue-50 text-blue-600 transition-colors"
                    >
                      Login / Sign Up
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Mobile search and profile buttons */}
          <div className="flex lg:hidden items-center space-x-4">
            {/* Mobile search button */}
            <button
              onClick={() => setShowMobileSearch(!showMobileSearch)}
              className="p-2 rounded-full text-gray-700 hover:text-gray-900 hover:bg-gray-100"
            >
              <Search className="h-5 w-5" />
            </button>

            {/* Mobile profile button */}
            <div className="relative">
              <button
                onClick={handleClick}
                className="p-2 rounded-full bg-[#002C71] text-white hover:bg-[#001a48]"
              >
                <User className="h-5 w-5" />
              </button>

              {showMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg z-50">
                  {session ? (
                    <>
                      <div className="px-4 py-3 border-b">
                        <p className="text-sm font-medium text-gray-900">{session.user?.name}</p>
                        <p className="text-xs text-gray-500">{session.user?.email}</p>
                      </div>
                      <button
                        onClick={handleDashboard}
                        className="block w-full px-4 py-3 text-left hover:bg-gray-50 text-gray-700 border-b"
                      >
                        Dashboard
                      </button>
                      <button
                        onClick={handleLogout}
                        className="block w-full px-4 py-3 text-left hover:bg-red-50 text-red-600"
                      >
                        Logout
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleLogin}
                      className="block w-full px-4 py-3 text-left hover:bg-blue-50 text-blue-600"
                    >
                      Login / Sign Up
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile search bar */}
        {showMobileSearch && (
          <div className="lg:hidden pb-4 px-2" ref={searchRef}>
            <div className="relative">
              <input
                type="text"
                placeholder="Search events, venues, speakers..."
                className="w-full py-3 pl-4 pr-12 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-black"
                value={searchQuery}
                onChange={(e) => handleSearchInput(e.target.value)}
                onFocus={() => searchQuery.length >= 2 && setShowSearchResults(true)}
              />
              <Search className="w-5 h-5 absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>

            {showSearchResults && (
              <div className="absolute left-4 right-4 bg-white border border-gray-200 rounded-md shadow-lg z-50 mt-1 max-h-80 overflow-y-auto">
                <div className="flex border-b border-gray-200">
                  {(['all', 'events', 'venues', 'speakers'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 px-4 py-3 text-sm font-medium capitalize ${activeTab === tab
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                      {tab} {tab !== 'all' && `(${searchResults[tab as keyof SearchResults]?.length || 0})`}
                    </button>
                  ))}
                </div>
                {renderSearchResults()}
              </div>
            )}
          </div>
        )}

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden pb-4 border-t border-gray-200" ref={mobileMenuRef}>
            <div className="flex flex-col space-y-1 pt-4">
              <Link href="/event">
                <p
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                >
                  Top 10 Must Visit
                </p>
              </Link>
              <Link href="/speakers">
                <p
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                >
                  Speakers
                </p>
              </Link>
              <p
                onClick={handleAddevent}
                className="px-4 py-3 text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Add Event
              </p>

              {/* Auth section in mobile menu */}
              <div className="px-4 py-3 border-t border-gray-200">
                {session ? (
                  <>
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-900">{session.user?.name}</p>
                      <p className="text-xs text-gray-500">{session.user?.email}</p>
                    </div>
                    <button
                      onClick={handleDashboard}
                      className="w-full text-left px-4 py-3 mb-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                    >
                      Dashboard
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-3 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleLogin}
                    className="w-full text-left px-4 py-3 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors"
                  >
                    Login / Sign Up
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}