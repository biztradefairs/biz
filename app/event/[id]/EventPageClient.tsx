"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import EventPageContent from "../EventPageContent"

interface EventPageClientProps {
  params: { id: string }
  initialEvent?: any
  initialError?: string | null
}

export default function EventPageClient({ params, initialEvent, initialError }: EventPageClientProps) {
  const [event, setEvent] = useState<any>(initialEvent)
  const [loading, setLoading] = useState(!initialEvent && !initialError)
  const [error, setError] = useState<string | null>(initialError || null)

  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    // Only fetch if we don't have initial data and no error
    if (!initialEvent && !initialError) {
      fetchEvent()
    }
  }, [params.id])

  useEffect(() => {
    // UPDATE BROWSER TAB TITLE when event data is available
    if (event?.title) {
      document.title = `${event.title} | BizTradeFairs`
      
      // OPTIONAL: Also update the URL in browser address bar (cosmetic only)
      // This doesn't change the actual route, just what users see
      const cleanTitle = event.title
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start
        .replace(/-+$/, '')             // Trim - from end
      
      // Create a clean URL for display
      const displayUrl = `/event/${cleanTitle}`
      
      // Replace browser history state (cosmetic only - doesn't affect routing)
      window.history.replaceState(
        { ...window.history.state, as: displayUrl, url: window.location.pathname },
        '',
        displayUrl
      )
    }
  }, [event])

  const fetchEvent = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/events/${params.id}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Event not found")
        }
        throw new Error(`Failed to fetch event: ${response.status}`)
      }
      
      const data = await response.json()
      setEvent(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      toast({
        title: "Error",
        description: "Failed to load event details",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading event details...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <button 
            onClick={fetchEvent}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Event not found</p>
      </div>
    )
  }

  return <EventPageContent 
    event={event} 
    session={session}
    router={router}
    toast={toast}
  />
}