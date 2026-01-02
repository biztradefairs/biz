"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { 
  Calendar, 
  MapPin, 
  User, 
  Building2, 
  Clock,
  IndianRupee,
  X,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
  Mail,
  Phone,
  ArrowLeft,
  Loader2
} from "lucide-react"
import { EventStatusBadge } from "../organizer-dashboard/EventStatusBadge"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"

interface EventDetailsPanelProps {
  eventId: string | null
  isOpen: boolean
  onClose: () => void
  onActionComplete?: () => void
}

interface EventDetails {
  id: string
  title: string
  description: string
  shortDescription: string
  startDate: string
  endDate: string
  registrationStart: string
  registrationEnd: string
  timezone: string
  venue: string
  address: string
  city: string
  state: string
  country: string
  status: string
  category: string[]
  tags: string[]
  organizer: {
    id: string
    name: string
    email: string
    company: string
    phone: string
  }
  ticketTypes: Array<{
    id: string
    name: string
    price: number
    quantity: number
    sold: number
  }>
  exhibitionSpaces: Array<{
    id: string
    name: string
    spaceType: string
    basePrice: number
    area: number
    minArea: number
  }>
  images: string[]
  rejectionReason?: string
  rejectedAt?: string
  rejectedBy?: {
    id: string
    name: string
    email: string
  }
  createdAt: string
  updatedAt: string
}

export default function EventDetailsPanel({ 
  eventId, 
  isOpen, 
  onClose,
  onActionComplete 
}: EventDetailsPanelProps) {
  const [event, setEvent] = useState<EventDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen && eventId) {
      fetchEventDetails()
    } else {
      setEvent(null)
    }
  }, [isOpen, eventId])

  const fetchEventDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/events/${eventId}`)
      const data = await response.json()
      
      if (data.success) {
        setEvent(data.event)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch event details",
          variant: "destructive",
        })
        onClose()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch event details",
        variant: "destructive",
      })
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async () => {
    if (!eventId || !event) return
    
    if (!window.confirm(`Are you sure you want to approve "${event.title}"?`)) return
    
    try {
      setActionLoading(true)
      const response = await fetch("/api/admin/events/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, action: "approve" })
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Event approved successfully",
        })
        
        if (onActionComplete) {
          onActionComplete()
        }
        
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
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    if (!eventId || !event) return
    
    const reason = window.prompt("Please provide a reason for rejection:")
    if (!reason) return
    
    try {
      setActionLoading(true)
      const response = await fetch("/api/admin/events/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, action: "reject", reason })
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Event rejected successfully",
        })
        
        if (onActionComplete) {
          onActionComplete()
        }
        
        onClose()
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to reject event",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject event",
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
      {/* Modal Container - Fixed positioning for proper scrolling */}
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl my-8 h-[calc(100vh-4rem)] flex flex-col">
        {/* Header - Fixed */}
        <div className="border-b bg-white p-6 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-8 w-8 p-0 mr-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 line-clamp-2">
                    {event?.title || "Event Details"}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    {event && <EventStatusBadge status={event.status} />}
                    <span className="text-sm text-gray-600">
                      Event Details Preview
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <ScrollArea className="flex-1 overflow-auto">
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center p-12">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading event details...</p>
                </div>
              </div>
            ) : event ? (
              <div className="space-y-8">
                {/* Event Description */}
                <Card>
                  <CardHeader>
                    <CardTitle>Event Description</CardTitle>
                    <CardDescription>
                      Complete details about the event
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Full Description</h3>
                      <p className="text-gray-700 whitespace-pre-line bg-gray-50 p-4 rounded-lg">
                        {event.description}
                      </p>
                    </div>
                    
                    {event.shortDescription && (
                      <div>
                        <h4 className="font-medium text-gray-700 mb-1">Short Description</h4>
                        <p className="text-gray-600">{event.shortDescription}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Event Images */}
                {event.images?.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Event Images</CardTitle>
                      <CardDescription>
                        Gallery of event promotional images
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {event.images.map((image, index) => (
                          <div 
                            key={index} 
                            className="aspect-square relative rounded-lg overflow-hidden border bg-gray-100 group cursor-pointer"
                            onClick={() => window.open(image, '_blank')}
                          >
                            {/* Using img tag instead of Next.js Image for dynamic images */}
                            <img
                              src={image || "/placeholder.svg"}
                              alt={`Event image ${index + 1}`}
                              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-200"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Event Details Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Dates & Time Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Dates & Time</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Calendar className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-700">Event Dates</p>
                            <p className="text-gray-600">
                              {formatDate(event.startDate)} - {formatDate(event.endDate)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <Clock className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-700">Registration Period</p>
                            <p className="text-gray-600">
                              {formatDate(event.registrationStart)} to {formatDate(event.registrationEnd)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-purple-100 rounded-lg">
                            <Clock className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-700">Timezone</p>
                            <p className="text-gray-600">{event.timezone}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Location Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Location</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-red-100 rounded-lg">
                          <MapPin className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">{event.venue}</p>
                          <p className="text-gray-600 mt-1">{event.address}</p>
                          <p className="text-gray-600">
                            {event.city}, {event.state} {event.country}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Categories & Tags */}
                {(event.category?.length > 0 || event.tags?.length > 0) && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Categories & Tags</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {event.category?.length > 0 && (
                          <div>
                            <h4 className="font-medium text-gray-700 mb-2">Categories</h4>
                            <div className="flex flex-wrap gap-2">
                              {event.category.map((cat) => (
                                <Badge key={cat} variant="secondary" className="px-3 py-1.5">
                                  {cat}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {event.tags?.length > 0 && (
                          <div>
                            <h4 className="font-medium text-gray-700 mb-2">Tags</h4>
                            <div className="flex flex-wrap gap-2">
                              {event.tags.map((tag) => (
                                <Badge key={tag} variant="outline" className="px-3 py-1.5">
                                  #{tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Ticket Types */}
                {event.ticketTypes?.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Ticket Types</CardTitle>
                      <CardDescription>
                        Pricing and availability information
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {event.ticketTypes.map((ticket) => (
                          <div 
                            key={ticket.id} 
                            className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex justify-between items-start mb-3">
                              <h4 className="font-semibold text-gray-900">{ticket.name}</h4>
                              <span className="font-bold text-blue-600 text-lg">
                                <IndianRupee className="w-4 h-4 inline mr-1" />
                                {ticket.price}
                              </span>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Available:</span>
                                <span className="font-medium">{ticket.quantity}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Sold:</span>
                                <span className="font-medium">{ticket.sold}</span>
                              </div>
                              <Separator />
                              <div className="flex justify-between text-sm font-medium">
                                <span>Remaining:</span>
                                <span className={ticket.quantity - ticket.sold <= 10 ? "text-red-600" : "text-green-600"}>
                                  {ticket.quantity - ticket.sold}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Exhibition Spaces */}
                {event.exhibitionSpaces?.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Exhibition Spaces</CardTitle>
                      <CardDescription>
                        Space types and pricing for exhibitors
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-3 px-4 font-medium text-gray-700">Space Type</th>
                              <th className="text-left py-3 px-4 font-medium text-gray-700">Name</th>
                              <th className="text-left py-3 px-4 font-medium text-gray-700">Price</th>
                              <th className="text-left py-3 px-4 font-medium text-gray-700">Area</th>
                              <th className="text-left py-3 px-4 font-medium text-gray-700">Min Area</th>
                            </tr>
                          </thead>
                          <tbody>
                            {event.exhibitionSpaces.map((space) => (
                              <tr key={space.id} className="border-b hover:bg-gray-50">
                                <td className="py-3 px-4">
                                  <Badge variant="outline" className="capitalize">
                                    {space.spaceType.toLowerCase().replace('_', ' ')}
                                  </Badge>
                                </td>
                                <td className="py-3 px-4 font-medium">{space.name}</td>
                                <td className="py-3 px-4">
                                  <span className="font-bold text-blue-600">
                                    <IndianRupee className="w-3 h-3 inline mr-1" />
                                    {space.basePrice}/sq.m
                                  </span>
                                </td>
                                <td className="py-3 px-4">{space.area} sq.m</td>
                                <td className="py-3 px-4">{space.minArea} sq.m</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Organizer Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Organizer Information</CardTitle>
                    <CardDescription>
                      Contact details of the event organizer
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-blue-50 rounded-xl p-6">
                      <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                        <div className="p-3 bg-white rounded-lg shadow-sm">
                          <User className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 mb-2">{event.organizer.name}</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-gray-400" />
                                <a 
                                  href={`mailto:${event.organizer.email}`}
                                  className="text-blue-600 hover:underline font-medium"
                                >
                                  {event.organizer.email}
                                </a>
                              </div>
                              
                              {event.organizer.phone && (
                                <div className="flex items-center gap-2">
                                  <Phone className="w-4 h-4 text-gray-400" />
                                  <a 
                                    href={`tel:${event.organizer.phone}`}
                                    className="text-blue-600 hover:underline font-medium"
                                  >
                                    {event.organizer.phone}
                                  </a>
                                </div>
                              )}
                            </div>
                            
                            {event.organizer.company && (
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <Building2 className="w-4 h-4 text-gray-400" />
                                  <span className="font-medium text-gray-700">Company</span>
                                </div>
                                <p className="text-gray-600 ml-6">{event.organizer.company}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Rejection Details (if rejected) */}
                {event.status === "REJECTED" && event.rejectionReason && (
                  <Card className="border-red-200">
                    <CardHeader className="bg-red-50">
                      <CardTitle className="text-red-700">Rejection Details</CardTitle>
                      <CardDescription className="text-red-600">
                        This event was rejected by an admin
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-semibold text-red-700 mb-2">Reason for Rejection</p>
                            <p className="text-gray-800 bg-red-50 p-4 rounded-lg">{event.rejectionReason}</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          {event.rejectedAt && (
                            <div>
                              <span className="font-medium text-gray-700">Rejected on: </span>
                              <span className="text-gray-600">{formatDateTime(event.rejectedAt)}</span>
                            </div>
                          )}
                          
                          {event.rejectedBy && (
                            <div>
                              <span className="font-medium text-gray-700">Rejected by: </span>
                              <span className="text-gray-600">{event.rejectedBy.name} ({event.rejectedBy.email})</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Event Timeline */}
                <Card>
                  <CardHeader>
                    <CardTitle>Event Timeline</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-gray-600">Created</span>
                        <span className="font-medium">{formatDateTime(event.createdAt)}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-gray-600">Last Updated</span>
                        <span className="font-medium">{formatDateTime(event.updatedAt)}</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-gray-600">Event ID</span>
                        <code className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">
                          {event.id}
                        </code>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="p-12 text-center">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Event Not Found
                </h3>
                <p className="text-gray-600 mb-4">
                  The event details could not be loaded.
                </p>
                <Button onClick={onClose}>
                  Close
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer - Fixed at bottom */}
        {event && (
          <div className="border-t bg-gray-50 p-6 flex-shrink-0">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <EventStatusBadge status={event.status} />
                <span className="text-sm text-gray-600">
                  {event.status === "PENDING_APPROVAL" 
                    ? "Pending approval" 
                    : event.status === "REJECTED"
                    ? "Rejected"
                    : "Approved"}
                </span>
              </div>
              
              <div className="flex flex-wrap gap-3 justify-center sm:justify-end">
                {event.status === "PENDING_APPROVAL" && (
                  <>
                    <Button
                      variant="outline"
                      onClick={handleReject}
                      disabled={actionLoading}
                      className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                    >
                      {actionLoading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <XCircle className="w-4 h-4 mr-2" />
                      )}
                      Reject
                    </Button>
                    <Button
                      onClick={handleApprove}
                      disabled={actionLoading}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {actionLoading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4 mr-2" />
                      )}
                      Approve
                    </Button>
                  </>
                )}
                
                {event.status === "REJECTED" && (
                  <Button
                    onClick={handleApprove}
                    disabled={actionLoading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {actionLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4 mr-2" />
                    )}
                    Re-approve
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  onClick={() => {
                    window.open(`/event/${event.id}`, '_blank')
                  }}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Public Page
                </Button>
                
                <Button onClick={onClose}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}