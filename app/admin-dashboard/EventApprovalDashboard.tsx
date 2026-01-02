"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { 
  Eye, 
  Check, 
  X, 
  Calendar, 
  User, 
  MapPin, 
  Search, 
  Loader2, 
  Filter,
  Clock,
  IndianRupee,
  Users,
  Building2,
  AlertTriangle,
  RefreshCw
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { EventStatusBadge } from "../organizer-dashboard/EventStatusBadge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import EventDetailsPanel from "./EventDetailsModal" // Changed from EventDetailsModal

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
  }
  ticketTypes: Array<{
    id: string
    name: string
    price: number
    quantity: number
  }>
  exhibitionSpaces: Array<{
    id: string
    name: string
    spaceType: string
    basePrice: number
    area: number
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

type TabType = "pending" | "rejected" | "approved"

export default function EventApprovalDashboard() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [selectedEventForView, setSelectedEventForView] = useState<string | null>(null)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const [approving, setApproving] = useState<string | null>(null)
  const [rejecting, setRejecting] = useState<string | null>(null)
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    rejected: 0,
    pending: 0
  })
  const [activeTab, setActiveTab] = useState<TabType>("pending")
  const { toast } = useToast()

  // Add panel state
  const [isViewPanelOpen, setIsViewPanelOpen] = useState(false)

  useEffect(() => {
    fetchStats()
  }, [])

  useEffect(() => {
    setPage(1)
    fetchEvents()
  }, [activeTab, search])

  useEffect(() => {
    fetchEvents()
  }, [page])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      let endpoint = ""
      
      if (activeTab === "pending") {
        endpoint = `/api/admin/events/pending?page=${page}&limit=10&search=${search}`
      } else if (activeTab === "rejected") {
        endpoint = `/api/admin/events/rejected?page=${page}&limit=10&search=${search}`
      } else if (activeTab === "approved") {
        endpoint = `/api/admin/events/approved?page=${page}&limit=10&search=${search}`
      }

      const response = await fetch(endpoint)
      const data = await response.json()
      
      if (data.success) {
        setEvents(data.events)
        setTotalPages(data.pagination.totalPages)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch events",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch events",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/events/stats')
      const data = await response.json()
      if (data.success) {
        setStats(data.stats)
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error)
    }
  }

  // Add view event function
  const handleViewEvent = (eventId: string) => {
    setSelectedEventForView(eventId)
    setIsViewPanelOpen(true)
  }

  const handleApprove = async (eventId: string) => {
    try {
      setApproving(eventId)
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
          variant: "default",
        })
        // Refresh the list and stats
        fetchEvents()
        fetchStats()
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
      setApproving(null)
    }
  }

  const handleReject = async () => {
    if (!selectedEvent) return

    try {
      setRejecting(selectedEvent.id)
      const response = await fetch("/api/admin/events/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          eventId: selectedEvent.id, 
          action: "reject",
          reason: rejectReason 
        })
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Event rejected successfully",
          variant: "default",
        })
        // Refresh the list and stats
        fetchEvents()
        fetchStats()
        setRejectDialogOpen(false)
        setRejectReason("")
        setSelectedEvent(null)
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
      setRejecting(null)
    }
  }

  const handleReapprove = async (eventId: string) => {
    try {
      setApproving(eventId)
      const response = await fetch("/api/admin/events/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, action: "approve" })
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Event re-approved successfully",
          variant: "default",
        })
        fetchEvents()
        fetchStats()
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to re-approve event",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to re-approve event",
        variant: "destructive",
      })
    } finally {
      setApproving(null)
    }
  }

  const openRejectDialog = (event: Event) => {
    setSelectedEvent(event)
    setRejectDialogOpen(true)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: number, currency: string = "USD") => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency || 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getTicketPriceRange = (tickets: any[]) => {
    if (tickets.length === 0) return "Free"
    const prices = tickets.map(t => t.price).filter(p => p > 0)
    if (prices.length === 0) return "Free"
    const min = Math.min(...prices)
    const max = Math.max(...prices)
    return min === max ? formatCurrency(min) : `${formatCurrency(min)} - ${formatCurrency(max)}`
  }

  const getSpacePriceRange = (spaces: any[]) => {
    if (spaces.length === 0) return "N/A"
    const prices = spaces.map(s => s.basePrice).filter(p => p > 0)
    if (prices.length === 0) return "N/A"
    const min = Math.min(...prices)
    const max = Math.max(...prices)
    return min === max ? formatCurrency(min) : `${formatCurrency(min)} - ${formatCurrency(max)}`
  }

  if (loading && events.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-500">Loading events...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6 relative">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Approved</p>
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Check className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Rejected</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <X className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Events</p>
                <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Event Approval Dashboard</CardTitle>
              <CardDescription>
                Review and manage events submitted by organizers
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search events..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 w-full md:w-64"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  fetchEvents()
                  fetchStats()
                }}
                disabled={loading}
              >
                <Filter className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabType)} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pending" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Pending Approval
                {stats.pending > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {stats.pending}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="approved" className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                Approved
                {stats.approved > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {stats.approved}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="rejected" className="flex items-center gap-2">
                <X className="w-4 h-4" />
                Rejected
                {stats.rejected > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {stats.rejected}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Pending Tab Content */}
            <TabsContent value="pending" className="space-y-4">
              {events.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Check className="w-6 h-6 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No pending events
                  </h3>
                  <p className="text-gray-500">
                    All events have been reviewed. Check back later for new submissions.
                  </p>
                </div>
              ) : (
                <EventTable
                  events={events}
                  activeTab={activeTab}
                  formatDate={formatDate}
                  formatDateTime={formatDateTime}
                  formatCurrency={formatCurrency}
                  getTicketPriceRange={getTicketPriceRange}
                  getSpacePriceRange={getSpacePriceRange}
                  handleApprove={handleApprove}
                  openRejectDialog={openRejectDialog}
                  approving={approving}
                  handleViewEvent={handleViewEvent}
                />
              )}
            </TabsContent>

            {/* Rejected Tab Content */}
            <TabsContent value="rejected" className="space-y-4">
              {events.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Check className="w-6 h-6 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No rejected events
                  </h3>
                  <p className="text-gray-500">
                    No events have been rejected yet.
                  </p>
                </div>
              ) : (
                <EventTable
                  events={events}
                  activeTab={activeTab}
                  formatDate={formatDate}
                  formatDateTime={formatDateTime}
                  formatCurrency={formatCurrency}
                  getTicketPriceRange={getTicketPriceRange}
                  getSpacePriceRange={getSpacePriceRange}
                  handleReapprove={handleReapprove}
                  approving={approving}
                  handleViewEvent={handleViewEvent}
                />
              )}
            </TabsContent>

            {/* Approved Tab Content */}
            <TabsContent value="approved" className="space-y-4">
              {events.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Check className="w-6 h-6 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No approved events
                  </h3>
                  <p className="text-gray-500">
                    No events have been approved yet.
                  </p>
                </div>
              ) : (
                <EventTable
                  events={events}
                  activeTab={activeTab}
                  formatDate={formatDate}
                  formatDateTime={formatDateTime}
                  formatCurrency={formatCurrency}
                  getTicketPriceRange={getTicketPriceRange}
                  getSpacePriceRange={getSpacePriceRange}
                  handleViewEvent={handleViewEvent}
                />
              )}
            </TabsContent>
          </Tabs>

          {totalPages > 1 && (
            <div className="mt-6">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setPage(Math.max(1, page - 1))}
                      className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (page <= 3) {
                      pageNum = i + 1
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = page - 2 + i
                    }
                    
                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          onClick={() => setPage(pageNum)}
                          isActive={pageNum === page}
                          className="cursor-pointer"
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  })}
                  
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      className={page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Event Details Panel (inline, not modal) */}
      <EventDetailsPanel
        eventId={selectedEventForView}
        isOpen={isViewPanelOpen}
        onClose={() => {
          setIsViewPanelOpen(false)
          setSelectedEventForView(null)
        }}
        onActionComplete={() => {
          fetchEvents()
          fetchStats()
        }}
      />

      {/* Reject Confirmation Dialog */}
      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Rejection</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject <span className="font-semibold">"{selectedEvent?.title}"</span>?
              This will mark the event as rejected and notify the organizer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4">
            <div className="p-3 bg-gray-50 rounded-md">
              <h4 className="font-medium mb-1">Rejection Reason (Required):</h4>
              <Textarea
                placeholder="Please provide a reason for rejection. This will be sent to the organizer..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
                className="mt-2"
              />
              <p className="text-xs text-gray-500 mt-2">
                The organizer will receive this reason via email and notification.
              </p>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setRejectReason("")
                setSelectedEvent(null)
              }}
              disabled={rejecting === selectedEvent?.id}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              disabled={rejecting === selectedEvent?.id || !rejectReason.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              {rejecting === selectedEvent?.id ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Rejecting...
                </>
              ) : (
                "Confirm Rejection"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// Helper component for the event table
function EventTable({
  events,
  activeTab,
  formatDate,
  formatDateTime,
  formatCurrency,
  getTicketPriceRange,
  getSpacePriceRange,
  handleApprove,
  handleReapprove,
  openRejectDialog,
  approving,
  handleViewEvent,
}: any) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Event Details</TableHead>
            <TableHead>Organizer</TableHead>
            <TableHead>Dates & Location</TableHead>
            <TableHead>Pricing</TableHead>
            <TableHead>Submitted</TableHead>
            {activeTab === "rejected" && <TableHead>Rejection Reason</TableHead>}
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((event: Event) => (
            <TableRow key={event.id}>
              <TableCell>
                <div className="space-y-1">
                  <div className="font-semibold text-gray-900">
                    {event.title}
                  </div>
                  <div className="text-sm text-gray-500 line-clamp-2">
                    {event.shortDescription || event.description.substring(0, 100)}
                    {event.description.length > 100 && "..."}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    <EventStatusBadge status={event.status} />
                    {event.isVirtual && (
                      <Badge variant="outline" className="text-xs">
                        Virtual
                      </Badge>
                    )}
                    {event.leadsCount > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {event.leadsCount} leads
                      </Badge>
                    )}
                  </div>
                </div>
              </TableCell>
              
              <TableCell>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">{event.organizer.name}</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {event.organizer.email}
                  </div>
                  {event.organizer.company && (
                    <div className="text-sm text-gray-500">
                      <Building2 className="w-3 h-3 inline mr-1" />
                      {event.organizer.company}
                    </div>
                  )}
                  {event.organizer.phone && (
                    <div className="text-sm text-gray-500">
                      📱 {event.organizer.phone}
                    </div>
                  )}
                </div>
              </TableCell>
              
              <TableCell>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">
                      {formatDate(event.startDate)} - {formatDate(event.endDate)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">
                      {event.city}, {event.country}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {event.venue}
                  </div>
                </div>
              </TableCell>
              
              <TableCell>
                <div className="space-y-1">
                  <div className="text-sm">
                    <span className="font-medium">Tickets: </span>
                    <span className="text-gray-600">
                      {getTicketPriceRange(event.ticketTypes)}
                    </span>
                  </div>
                  {event.exhibitionSpaces.length > 0 && (
                    <div className="text-sm">
                      <span className="font-medium">Spaces: </span>
                      <span className="text-gray-600">
                        {getSpacePriceRange(event.exhibitionSpaces)}
                      </span>
                    </div>
                  )}
                  <div className="text-xs text-gray-500 mt-1">
                    {event.exhibitionSpaces.length} space types
                  </div>
                </div>
              </TableCell>
              
              <TableCell>
                <div className="space-y-1">
                  <div className="text-sm text-gray-500">
                    {formatDateTime(event.createdAt)}
                  </div>
                  <div className="text-xs text-gray-400">
                    Updated: {formatDateTime(event.updatedAt)}
                  </div>
                  {activeTab === "rejected" && event.rejectedAt && (
                    <div className="text-xs text-red-400">
                      Rejected: {formatDateTime(event.rejectedAt)}
                    </div>
                  )}
                </div>
              </TableCell>
              
              {activeTab === "rejected" && (
                <TableCell>
                  <div className="text-sm text-gray-600 line-clamp-2">
                    {event.rejectionReason || "No reason provided"}
                  </div>
                </TableCell>
              )}
              
              <TableCell>
                <div className="flex flex-col sm:flex-row gap-2 justify-end">
                  {/* View Button */}
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleViewEvent(event.id)}
                    className="w-full sm:w-auto"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  
                  {activeTab === "pending" && (
                    <>
                      <Button 
                        size="sm" 
                        variant="default"
                        onClick={() => handleApprove(event.id)}
                        disabled={approving === event.id}
                        className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
                      >
                        {approving === event.id ? (
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4 mr-1" />
                        )}
                        Approve
                      </Button>
                      
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => openRejectDialog(event)}
                        disabled={approving === event.id}
                        className="w-full sm:w-auto"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </>
                  )}
                  
                  {activeTab === "rejected" && (
                    <Button 
                      size="sm" 
                      variant="default"
                      onClick={() => handleReapprove(event.id)}
                      disabled={approving === event.id}
                      className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
                    >
                      {approving === event.id ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4 mr-1" />
                      )}
                      Re-approve
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}