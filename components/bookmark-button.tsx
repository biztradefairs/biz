"use client"

import { useState, useEffect, ReactNode } from "react"
import { Bookmark } from "lucide-react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

interface BookmarkButtonProps {
  eventId: string
  className?: string
  children?: ReactNode
  onClick?: (e: React.MouseEvent) => void
}

export function BookmarkButton({ 
  eventId, 
  className = "", 
  children,
  onClick 
}: BookmarkButtonProps) {
  const [isSaved, setIsSaved] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { data: session } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (session?.user?.id) {
      checkSavedStatus()
    }
  }, [eventId, session])

  const checkSavedStatus = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/save`)
      if (response.ok) {
        const data = await response.json()
        setIsSaved(data.isSaved)
      }
    } catch (error) {
      console.error("Error checking saved status:", error)
    }
  }

  const handleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault() // Prevent default behavior
    e.stopPropagation() // Stop event from bubbling up to parent

    // Call custom onClick handler if provided
    if (onClick) {
      onClick(e)
    }

    if (!session?.user?.id) {
      alert("Please log in to Follow this event")
      router.push("/login")
      return
    }

    setIsLoading(true)
    try {
      if (isSaved) {
        // Remove from saved
        await fetch(`/api/events/${eventId}/save`, {
          method: "DELETE",
        })
        setIsSaved(false)
      } else {
        // Add to saved
        await fetch(`/api/events/${eventId}/save`, {
          method: "POST",
        })
        setIsSaved(true)
      }
    } catch (error) {
      console.error("Error updating bookmark:", error)
      alert("Failed to save event")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleBookmark}
      disabled={isLoading}
      className={`transition-colors duration-200 ${
        isSaved ? "text-blue-600 hover:text-blue-700" : "text-gray-700 hover:text-gray-900"
      } ${className}`}
      title={isSaved ? "Remove from saved" : "Save event"}
    >
      {children || <Bookmark className={`w-4 h-4 ${isSaved ? "fill-current" : ""}`} />}
    </button>
  )
}