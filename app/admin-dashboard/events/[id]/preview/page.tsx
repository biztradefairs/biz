"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  Calendar, 
  MapPin, 
  User, 
  Building2, 
  Clock,
  IndianRupee,
  Loader2,
  ArrowLeft,
  Eye,
  Check,
  X,
  Mail,
  Phone,
  Users,
  Tag,
  Image as ImageIcon,
  FileText
} from "lucide-react"
import { EventStatusBadge } from "@/app/organizer-dashboard/EventStatusBadge"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"

export default function EventPreviewPage() {
  const { id } = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [event, setEvent] = useState<any>(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (id) {
      fetchEvent()
    }
  }, [id])

  const fetchEvent = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/events/${id}`)
      const data = await response.json()
      
      if (data.success) {
        setEvent(data.event)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch event",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch event",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async () => {
    if (!window.confirm(`Are you sure you want to approve "${event.title}"?`)) return
    
    try {
      setActionLoading(true)
      const response = await fetch("/api/admin/events/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: id, action: "approve" })
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Event approved successfully",
        })
        fetchEvent() // Refresh event data
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
    const reason = window.prompt("Please provide a reason for rejection:")
    if (!reason) return
    
    try {
      setActionLoading(true)
      const response = await fetch("/api/admin/events/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: id, action: "reject", reason })
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Event rejected successfully",
        })
        fetchEvent() // Refresh event data
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-500">Loading event...</span>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Event Not Found
          </h3>
          <Button onClick={() => router.push("/admin-dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Button variant="ghost" onClick={() => router.push("/admin-dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex items-center gap-3 mt-2">
            <h1 className="text-2xl font-bold text-gray-900">
              {event.title}
            </h1>
            <EventStatusBadge status={event.status} />
          </div>
          <p className="text-gray-600 mt-1">
            Preview of event details and organizer information
          </p>
        </div>

        {event.status === "PENDING_APPROVAL" && (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleReject}
              disabled={actionLoading}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <X className="w-4 h-4 mr-2" />
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
                <Check className="w-4 h-4 mr-2" />
              )}
              Approve
            </Button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Event Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Event Information</CardTitle>
              <CardDescription>
                Basic details about the event
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Description</h3>
                <p className="text-gray-600 whitespace-pre-line">{event.description}</p>
              </div>

              {event.shortDescription && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Short Description</h3>
                  <p className="text-gray-600">{event.shortDescription}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-700">Dates & Time</h3>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(event.startDate)} - {formatDate(event.endDate)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>{event.timezone}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-700">Location</h3>
                  <div className="flex items-start gap-2 text-gray-600">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <p>{event.venue}</p>
                      <p className="text-sm">{event.address}</p>
                      <p className="text-sm">{event.city}, {event.state} {event.country}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Categories & Tags */}
              {(event.category?.length > 0 || event.tags?.length > 0) && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-700">Categories & Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {event.category?.map((cat: string) => (
                      <Badge key={cat} variant="secondary" className="flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        {cat}
                      </Badge>
                    ))}
                    {event.tags?.map((tag: string) => (
                      <Badge key={tag} variant="outline">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Organizer Information */}
          <Card>
            <CardHeader>
              <CardTitle>Organizer Information</CardTitle>
              <CardDescription>
                Contact details of the event organizer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{event.organizer?.name}</h3>
                    <p className="text-sm text-gray-600">{event.organizer?.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {event.organizer?.company && (
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium">Company</p>
                        <p className="text-sm text-gray-600">{event.organizer.company}</p>
                      </div>
                    </div>
                  )}

                  {event.organizer?.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium">Phone</p>
                        <p className="text-sm text-gray-600">{event.organizer.phone}</p>
                      </div>
                    </div>
                  )}
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
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">Reason for Rejection</h4>
                    <p className="text-gray-800 bg-red-50 p-3 rounded-md">{event.rejectionReason}</p>
                  </div>
                  
                  {event.rejectedAt && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Rejected on: </span>
                      {formatDateTime(event.rejectedAt)}
                    </div>
                  )}
                  
                  {event.rejectedBy && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Rejected by: </span>
                      {event.rejectedBy.name} ({event.rejectedBy.email})
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Stats & Actions */}
        <div className="space-y-6">
          {/* Event Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Event Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Created</span>
                <span className="font-medium">{formatDate(event.createdAt)}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Last Updated</span>
                <span className="font-medium">{formatDate(event.updatedAt)}</span>
              </div>
              <Separator />
              
              {/* Ticket Information */}
              {event.ticketTypes?.length > 0 && (
                <>
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Ticket Types</h4>
                    <div className="space-y-2">
                      {event.ticketTypes.map((ticket: any) => (
                        <div key={ticket.id} className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">{ticket.name}</span>
                          <span className="font-medium">
                            <IndianRupee className="w-3 h-3 inline mr-1" />
                            {ticket.price}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              {/* Exhibition Spaces */}
              {event.exhibitionSpaces?.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Exhibition Spaces</h4>
                  <div className="space-y-2">
                    {event.exhibitionSpaces.slice(0, 3).map((space: any) => (
                      <div key={space.id} className="text-sm">
                        <span className="text-gray-600">{space.name}</span>
                        <div className="flex justify-between mt-1">
                          <span className="text-gray-500">Price:</span>
                          <span className="font-medium">
                            <IndianRupee className="w-3 h-3 inline mr-1" />
                            {space.basePrice}/sq.m
                          </span>
                        </div>
                      </div>
                    ))}
                    {event.exhibitionSpaces.length > 3 && (
                      <p className="text-xs text-gray-500 mt-1">
                        +{event.exhibitionSpaces.length - 3} more spaces
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => window.open(`/events/${event.slug || event.id}`, '_blank')}
              >
                <Eye className="w-4 h-4 mr-2" />
                View Public Page
              </Button>
              
              {event.organizer?.email && (
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => window.location.href = `mailto:${event.organizer.email}`}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Contact Organizer
                </Button>
              )}
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => router.push(`/admin-dashboard`)}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Approval Dashboard
              </Button>
            </CardContent>
          </Card>

          {/* Event Images */}
          {event.images?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Event Images</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {event.images.slice(0, 4).map((image: string, index: number) => (
                    <div key={index} className="aspect-square relative rounded-md overflow-hidden border">
                      <Image
                        src={image || "/placeholder.svg"}
                        alt={`Event image ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
                {event.images.length > 4 && (
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    +{event.images.length - 4} more images
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}