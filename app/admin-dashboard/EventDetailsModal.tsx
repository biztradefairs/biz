"use client"

import { useEffect, useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Calendar, 
  MapPin, 
  User, 
  Building2, 
  Mail, 
  Phone, 
  Globe, 
  Clock,
  IndianRupee,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  XCircle
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { EventStatusBadge } from "../organizer-dashboard/EventStatusBadge"

interface EventDetailsPanelProps {
  eventId: string | null
  isOpen: boolean
  onClose: () => void
  onActionComplete?: () => void
}

interface Event {
  id: string
  title: string
  description: string
  shortDescription: string
  startDate: string
  endDate: string
  venue: string
  city: string
  state: string
  country: string
  status: string
  isVirtual: boolean
  currency: string
  organizer: {
    id: string
    name: string
    email: string
    company: string
    phone: string
    website?: string
  }
  ticketTypes: Array<{
    id: string
    name: string
    price: number
    quantity: number
    description?: string
  }>
  exhibitionSpaces: Array<{
    id: string
    name: string
    spaceType: string
    basePrice: number
    area: number
    description?: string
    quantity?: number
  }>
  leadsCount: number
  images: string[]
  createdAt: string
  updatedAt: string
  rejectionReason?: string
  rejectedAt?: string
  rejectedBy?: {
    id: string
    name: string
    email: string
  }
}

export default function EventDetailsPanel({ 
  eventId, 
  isOpen, 
  onClose,
  onActionComplete 
}: EventDetailsPanelProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [event, setEvent] = useState<Event | null>(null)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const { toast } = useToast()

  useEffect(() => {
    if (eventId && isOpen) {
      console.log("Fetching event details for ID:", eventId)
      fetchEventDetails()
    }
  }, [eventId, isOpen])

  const fetchEventDetails = async () => {
    if (!eventId) return
    
    try {
      setLoading(true)
      setError(null)
      
      console.log("Making API call to:", `/api/admin/events/${eventId}`)
      
      const response = await fetch(`/api/admin/events/${eventId}`)
      console.log("API Response status:", response.status)
      
      const data = await response.json()
      console.log("API Response data:", data)
      
      if (data.success) {
        // Check if the API returns an array or a single event
        if (data.events && Array.isArray(data.events)) {
          // If it returns an array, find the event with matching ID
          const foundEvent = data.events.find((e: Event) => e.id === eventId)
          if (foundEvent) {
            console.log("Event found in array:", foundEvent)
            setEvent(foundEvent)
          } else {
            console.error("Event not found in array")
            setError("Event not found")
          }
        } else if (data.event) {
          // If it returns a single event object
          console.log("Event details fetched successfully:", data.event)
          setEvent(data.event)
        } else {
          console.error("Unexpected API response format:", data)
          setError("Unexpected API response format")
        }
      } else {
        console.error("Failed to fetch event details:", data.error)
        setError(data.error || "Failed to fetch event details")
        toast({
          title: "Error",
          description: data.error || "Failed to fetch event details",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to fetch event details:", error)
      setError("Failed to fetch event details. Please check your connection.")
      toast({
        title: "Error",
        description: "Failed to fetch event details",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: number, currency: string = "INR") => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const handleApprove = async () => {
    if (!event) return

    try {
      const response = await fetch("/api/admin/events/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: event.id, action: "approve" })
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Event approved successfully",
        })
        onActionComplete?.()
        onClose()
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to approve event",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve event",
        variant: "destructive",
      })
    }
  }

  // Listen for reject dialog event from parent
  useEffect(() => {
    const handleOpenRejectDialog = (e: CustomEvent) => {
      if (e.detail && e.detail.id === event?.id) {
        onClose()
      }
    }

    window.addEventListener('openRejectDialog' as any, handleOpenRejectDialog)
    return () => {
      window.removeEventListener('openRejectDialog' as any, handleOpenRejectDialog)
    }
  }, [event, onClose])

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-3xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Event Details</SheetTitle>
          <SheetDescription>
            {eventId ? `Viewing event: ${eventId}` : 'View complete information about this event'}
          </SheetDescription>
        </SheetHeader>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
            <p className="text-gray-500">Loading event details...</p>
            <p className="text-gray-400 text-sm mt-2">Event ID: {eventId}</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="bg-red-100 p-3 rounded-full mb-4">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <p className="text-red-600 font-medium mb-2">Error Loading Event</p>
            <p className="text-gray-500 text-sm mb-4">{error}</p>
            <p className="text-gray-400 text-xs mb-4">Event ID: {eventId}</p>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={fetchEventDetails}
              >
                Try Again
              </Button>
              <Button 
                variant="ghost" 
                onClick={onClose}
              >
                Close
              </Button>
            </div>
          </div>
        ) : event ? (
          <div className="mt-6 space-y-6">
            {/* Event Images */}
            {event.images && event.images.length > 0 ? (
              <div className="space-y-2">
                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={event.images[activeImageIndex]}
                    alt={event.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x400?text=Event+Image+Not+Found'
                    }}
                  />
                </div>
                {event.images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {event.images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setActiveImageIndex(index)}
                        className={`flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-colors ${
                          activeImageIndex === index 
                            ? 'border-primary' 
                            : 'border-transparent hover:border-gray-300'
                        }`}
                      >
                        <img
                          src={image}
                          alt={`${event.title} ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80x80?text=Error'
                          }}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                <ImageIcon className="w-12 h-12 text-gray-400" />
                <span className="ml-2 text-gray-500">No images available</span>
              </div>
            )}

            {/* Basic Info */}
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{event.title}</h2>
                  <p className="text-gray-500 mt-1">{event.shortDescription || 'No short description'}</p>
                </div>
                <EventStatusBadge status={event.status} />
              </div>
              <p className="text-gray-700 mt-4 whitespace-pre-wrap">{event.description}</p>
            </div>

            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="organizer">Organizer</TabsTrigger>
                <TabsTrigger value="tickets">Tickets</TabsTrigger>
                <TabsTrigger value="spaces">Spaces</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm font-medium">Start Date:</span>
                    </div>
                    <p>{formatDate(event.startDate)}</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm font-medium">End Date:</span>
                    </div>
                    <p>{formatDate(event.endDate)}</p>
                  </div>
                  <div className="space-y-2 col-span-2">
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm font-medium">Location:</span>
                    </div>
                    <p>
                      {event.venue}, {event.city}, {event.state}, {event.country}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Globe className="w-4 h-4" />
                      <span className="text-sm font-medium">Event Type:</span>
                    </div>
                    <Badge variant={event.isVirtual ? "secondary" : "outline"}>
                      {event.isVirtual ? "Virtual" : "Physical"}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm font-medium">Leads:</span>
                    </div>
                    <p>{event.leadsCount} leads</p>
                  </div>
                </div>

                {/* Rejection Info */}
                {event.status === 'rejected' && event.rejectionReason && (
                  <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
                    <h3 className="font-semibold text-red-800 mb-2">Rejection Details</h3>
                    <p className="text-red-700 text-sm">{event.rejectionReason}</p>
                    {event.rejectedAt && (
                      <p className="text-red-600 text-xs mt-2">
                        Rejected on: {formatDate(event.rejectedAt)}
                      </p>
                    )}
                    {event.rejectedBy && (
                      <p className="text-red-600 text-xs">
                        By: {event.rejectedBy.name} ({event.rejectedBy.email})
                      </p>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="organizer" className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg mt-4">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{event.organizer.name}</p>
                        <p className="text-sm text-gray-500">Organizer</p>
                      </div>
                    </div>
                    
                    {event.organizer.company && (
                      <div className="flex items-center gap-3">
                        <Building2 className="w-5 h-5 text-gray-400" />
                        <span>{event.organizer.company}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <a href={`mailto:${event.organizer.email}`} className="text-primary hover:underline">
                        {event.organizer.email}
                      </a>
                    </div>
                    
                    {event.organizer.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="w-5 h-5 text-gray-400" />
                        <a href={`tel:${event.organizer.phone}`} className="text-primary hover:underline">
                          {event.organizer.phone}
                        </a>
                      </div>
                    )}
                    
                    {event.organizer.website && (
                      <div className="flex items-center gap-3">
                        <Globe className="w-5 h-5 text-gray-400" />
                        <a href={event.organizer.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          {event.organizer.website}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="tickets" className="space-y-4">
                {event.ticketTypes && event.ticketTypes.length > 0 ? (
                  <div className="space-y-3 mt-4">
                    {event.ticketTypes.map((ticket) => (
                      <div key={ticket.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold">{ticket.name}</h4>
                            {ticket.description && (
                              <p className="text-sm text-gray-500 mt-1">{ticket.description}</p>
                            )}
                          </div>
                          <Badge variant="secondary">{ticket.quantity} available</Badge>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <IndianRupee className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">
                            {formatCurrency(ticket.price, event.currency)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">No ticket types available</p>
                )}
              </TabsContent>

              <TabsContent value="spaces" className="space-y-4">
                {event.exhibitionSpaces && event.exhibitionSpaces.length > 0 ? (
                  <div className="space-y-3 mt-4">
                    {event.exhibitionSpaces.map((space) => (
                      <div key={space.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold">{space.name}</h4>
                            <p className="text-sm text-gray-500 mt-1">{space.spaceType}</p>
                            {space.description && (
                              <p className="text-sm text-gray-500 mt-1">{space.description}</p>
                            )}
                          </div>
                          {space.quantity && (
                            <Badge variant="secondary">{space.quantity} available</Badge>
                          )}
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          <div className="flex items-center gap-2">
                            <IndianRupee className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">
                              {formatCurrency(space.basePrice, event.currency)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Area:</span>
                            <span className="font-medium">{space.area} sq ft</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">No exhibition spaces available</p>
                )}
              </TabsContent>
            </Tabs>

            {/* Metadata */}
            <div className="border-t pt-4">
              <p className="text-xs text-gray-400">
                Created: {formatDate(event.createdAt)}
              </p>
              <p className="text-xs text-gray-400">
                Last Updated: {formatDate(event.updatedAt)}
              </p>
            </div>

            {/* Action Buttons for Pending Events */}
            {event.status === 'pending' && (
              <div className="flex gap-3 pt-4 border-t">
                <Button 
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={handleApprove}
                >
                  Approve Event
                </Button>
                <Button 
                  variant="destructive" 
                  className="flex-1"
                  onClick={() => {
                    onClose()
                    // This will trigger the reject dialog in the parent
                    setTimeout(() => {
                      window.dispatchEvent(new CustomEvent('openRejectDialog', { detail: event }))
                    }, 100)
                  }}
                >
                  Reject Event
                </Button>
              </div>
            )}

            {event.status === 'rejected' && (
              <div className="flex gap-3 pt-4 border-t">
                <Button 
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  onClick={handleApprove}
                >
                  Re-approve Event
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No event found with ID: {eventId}</p>
            <p className="text-gray-400 text-sm mt-2">Please check if the event exists</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}