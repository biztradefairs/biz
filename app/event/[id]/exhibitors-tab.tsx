// components/exhibitors-tab.tsx
"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useSession } from "next-auth/react"
import Link from "next/link"
import ScheduleMeetingButton from "@/components/ScheduleMeetingButton"

interface Exhibitor {
  id: string
  boothId: string
  company: string
  name: string
  email: string
  phone?: string
  avatar: string
  description?: string
  boothNumber: string
  status: string
  totalCost: number
  totalAppointmentsReceived: number
  spaceReference?: string
  isSample?: boolean
  userId?: string
}

interface ExhibitorsTabProps {
  eventId: string
}

export default function ExhibitorsTab({ eventId }: ExhibitorsTabProps) {
  const [exhibitors, setExhibitors] = useState<Exhibitor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const { data: session } = useSession()

  useEffect(() => {
    const fetchExhibitors = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch(`/api/events/exhibitors?eventId=${eventId}`)
        
        if (!response.ok) {
          throw new Error(`Failed to fetch exhibitors: ${response.statusText}`)
        }

        const data = await response.json()
        console.log("Fetched exhibitors:", data.booths)
        setExhibitors(data.booths || [])
      } catch (err) {
        console.error("Error fetching exhibitors:", err)
        setError(err instanceof Error ? err.message : "Failed to load exhibitors")
      } finally {
        setLoading(false)
      }
    }

    if (eventId) {
      fetchExhibitors()
    }
  }, [eventId])

  // Sample exhibitors with isSample flag
  const fallbackExhibitors: Exhibitor[] = [
    // Your sample exhibitors here...
  ]

  if (loading) {
    return (
      <div className="py-12 flex justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading exhibitors...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-12">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    )
  }

  const displayExhibitors = exhibitors.length > 0 ? exhibitors : fallbackExhibitors
  const hasRealExhibitors = exhibitors.length > 0

  return (
    <div className="py-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-1">Exhibitor List</h2>
        <p className="text-sm text-gray-500">
          {hasRealExhibitors
            ? `${exhibitors.length} Exhibitors of Current Edition`
            : "Sample exhibitors (No registrations yet)"}
        </p>
      </div>

      {!hasRealExhibitors && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-blue-800 text-sm">
            <strong>Demo Mode:</strong> No exhibitors have registered for this event yet. Showing sample exhibitors for
            demonstration. The "Schedule Meeting" button will be disabled for sample data.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-6">
        {displayExhibitors?.map((exhibitor) => (
          <Card
            key={exhibitor.id}
            className="relative border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 p-4 flex flex-col items-center text-center group cursor-pointer hover:border-blue-300"
          >
            {/* Clickable area covering the entire card */}
            <Link 
              href={`/exhibitor/${exhibitor.id}`}
              className="absolute inset-0 z-10"
              aria-label={`View ${exhibitor.company} details`}
            />
            
            {/* Logo Circle */}
            <div className="relative w-28 h-28 -mt-12 bg-white border-4 border-blue-600 rounded-full flex items-center justify-center z-20 group-hover:border-blue-700 transition-colors">
              <Image
                src={exhibitor.avatar || "/Organizers/maxx.png"}
                alt={`${exhibitor.company} logo`}
                width={80}
                height={80}
                className="object-contain rounded-full"
              />
            </div>

            {/* Verified Badge */}
            <div className="absolute top-4 right-4 bg-green-500 text-white rounded-full p-1.5 z-20">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <CardContent className="mt-4 w-full relative z-20">
              {/* Followers Section */}
              <div className="flex justify-center items-center space-x-1 mb-2">
                <div className="flex -space-x-2">
                  <div className="w-6 h-6 rounded-full bg-gray-300 border border-white"></div>
                  <div className="w-6 h-6 rounded-full bg-gray-400 border border-white"></div>
                  <div className="w-6 h-6 rounded-full bg-gray-500 border border-white"></div>
                </div>
                <span className="text-sm text-gray-500 ml-1">{exhibitor.totalAppointmentsReceived} Followers</span>
              </div>

              {/* Company Name */}
              <h3 className="text-lg font-semibold text-gray-800 group-hover:text-blue-600 transition-colors mb-2">
                {exhibitor.company}
              </h3>

              {/* Location & Booth */}
              <div className="flex flex-col items-center mt-2 space-y-1 text-sm text-gray-600 mb-4">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-1 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3H6a1 1 0 100 2h3v3a1 1 0 102 0v-3h3a1 1 0 100-2h-3V7z" clipRule="evenodd" />
                  </svg>
                  <span>{exhibitor.name || "Bangalore"}</span>
                </div>

                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-1 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 21h8M12 17v4m-6-4h12V5a2 2 0 00-2-2H8a2 2 0 00-2 2v12z" />
                  </svg>
                  <span>Booth {exhibitor.boothNumber || "No."}</span>
                </div>
              </div>

              {/* Schedule Meeting Button - positioned above the link */}
              <div className="mt-4 relative z-20" onClick={(e) => e.stopPropagation()}>
                <ScheduleMeetingButton 
                  exhibitor={exhibitor} 
                  eventId={eventId}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {exhibitors.length > 6 && (
        <div className="mt-6 text-center">
          <Button variant="outline" className="px-6 bg-transparent">
            Load More Exhibitors
          </Button>
        </div>
      )}
    </div>
  )
}