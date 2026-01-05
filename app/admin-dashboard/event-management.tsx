"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Download,
  Edit,
  MoreHorizontal,
  Building2,
  Calendar,
  MapPin,
  Users,
  Star,
  Crown,
  TrendingUp,
  Search,
  Plus,
  Trash2,
  MessageSquare,
  ArrowLeft,
  Upload,
  X,
  Image,
  Video,
  FileText,
  ShieldCheck,
  ShieldOff,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "@/hooks/use-toast"

// ✅ UPDATED Event Interface with verification fields
interface Event {
  id: string
  title: string
  organizer: string
  organizerId: string
  date: string
  endDate: string
  location: string
  venue: string
  status: "Approved" | "Pending Review" | "Flagged" | "Rejected" | "Draft"
  attendees: number
  maxCapacity: number
  revenue: number
  ticketPrice: number
  category: string
  featured: boolean
  vip: boolean
  priority: "High" | "Medium" | "Low"
  description: string
  shortDescription: string
  slug: string
  edition: string
  tags: string[]
  eventType: string
  timezone: string
  currency: string
  createdAt: string
  lastModified: string
  views: number
  registrations: number
  rating: number
  reviews: number
  image: string
  bannerImage: string
  thumbnailImage: string
  images: string[]
  videos: string[]
  brochure: string
  layout: string
  documents: string[]
  promotionBudget: number
  socialShares: number
  
  // ✅ VERIFICATION FIELDS - MAKE SURE THESE ARE INCLUDED
  isVerified: boolean
  verifiedAt: string | null
  verifiedBy: string | null
  verifiedBadgeImage: string | null
}

interface Category {
  id: string
  name: string
  icon?: string
  color?: string
  isActive: boolean
  eventCount?: number
}

// Verification Dialog Component
function VerifyEventDialog({
  event,
  open,
  onOpenChange,
  onVerify,
  loading,
}: {
  event: Event | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onVerify: (verify: boolean, customBadge?: File) => void
  loading: boolean
}) {
  const [customBadgeFile, setCustomBadgeFile] = useState<File | null>(null)

  if (!event || !open) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            {event.isVerified ? "Remove Verification" : "Verify Event"}
          </h3>
          <button onClick={() => onOpenChange(false)} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {!event.isVerified ? (
          <>
            <p className="text-sm text-gray-600 mb-4">
              Verify "{event.title}" and optionally upload a custom badge image.
            </p>
            
            <div className="space-y-4 mb-6">
              <div>
                <Label htmlFor="badge-upload">Custom Badge (Optional)</Label>
                <Input
                  id="badge-upload"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCustomBadgeFile(e.target.files?.[0] || null)}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  PNG, JPG, or SVG. Recommended: 100x100px
                </p>
              </div>

              {customBadgeFile && (
                <div>
                  <Label>Preview:</Label>
                  <div className="mt-2 flex items-center gap-4">
                    <img
                      src={URL.createObjectURL(customBadgeFile)}
                      alt="Custom badge preview"
                      className="w-20 h-20 object-contain border rounded"
                    />
                    <div className="text-sm text-gray-600">
                      <p>Custom badge will be used</p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <Label>Default Badge:</Label>
                <div className="mt-2 flex items-center gap-4">
                  <img
                    src="/badge/VerifiedBADGE (1).png"
                    alt="Default badge"
                    className="w-20 h-20 object-contain border rounded"
                  />
                  <div className="text-sm text-gray-600">
                    <p>Will be used if no custom badge is provided</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-600 mb-6">
            Are you sure you want to remove verification from "{event.title}"?
          </p>
        )}

        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false)
              setCustomBadgeFile(null)
            }}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant={event.isVerified ? "destructive" : "default"}
            onClick={() => {
              onVerify(!event.isVerified, customBadgeFile ?? undefined)

              if (!event.isVerified) {
                setCustomBadgeFile(null)
              }
            }}
            disabled={loading}
          >
            {loading ? "Processing..." : 
              event.isVerified ? "Remove Verification" : "Verify Event"}
          </Button>
        </div>
      </div>
    </div>
  )
}

// Verified Badge Display Component
function VerifiedBadge({ event }: { event: Event }) {
  if (!event.isVerified) return null

  return (
    <Badge className="bg-green-100 text-green-800 border border-green-300">
      {event.verifiedBadgeImage ? (
        <img 
          src={event.verifiedBadgeImage} 
          alt="Verified" 
          className="w-4 h-4 mr-1"
          onError={(e) => {
            e.currentTarget.src = "/badge/VerifiedBADGE (1).png"
          }}
        />
      ) : (
        <ShieldCheck className="w-4 h-4 mr-1" />
      )}
      Verified
    </Badge>
  )
}

// File Upload Component
function FileUpload({
  label,
  accept,
  onFileUpload,
  multiple = false,
  currentFiles = [],
  onFileRemove,
}: {
  label: string
  accept: string
  onFileUpload: (files: File[]) => void
  multiple?: boolean
  currentFiles?: string[]
  onFileRemove?: (index: number) => void
}) {
  const [dragOver, setDragOver] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      onFileUpload(files)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      onFileUpload(files)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => {
    setDragOver(false)
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          dragOver ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => document.getElementById(`file-upload-${label}`)?.click()}
      >
        <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
        <p className="text-sm text-gray-600">
          Drag & drop files here or click to upload
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {accept.includes("image") ? "Images" : accept.includes("video") ? "Videos" : "Documents"} accepted
        </p>
        <input
          id={`file-upload-${label}`}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
      
      {/* Current files preview */}
      {currentFiles && currentFiles.length > 0 && (
        <div className="mt-3">
          <Label className="text-sm">Current Files:</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {currentFiles.map((file, index) => (
              <div key={index} className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 text-sm">
                {file.includes("image") ? (
                  <Image className="w-4 h-4" />
                ) : file.includes("video") ? (
                  <Video className="w-4 h-4" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}
                <span className="truncate max-w-32">
                  {file.split('/').pop()}
                </span>
                {onFileRemove && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onFileRemove(index)
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Image Preview Component
function ImagePreview({ src, onRemove }: { src: string; onRemove: () => void }) {
  return (
    <div className="relative group">
      <img
        src={src}
        alt="Preview"
        className="w-20 h-20 object-cover rounded-lg border"
      />
      <button
        type="button"
        onClick={onRemove}
        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  )
}

// Edit Event Component
function EditEventForm({ 
  event, 
  onSave, 
  onCancel,
  categories 
}: { 
  event: Event
  onSave: (updatedEvent: Event) => void
  onCancel: () => void
  categories: Category[]
}) {
  const [formData, setFormData] = useState<Event>({
    ...event,
    images: event.images || [],
    videos: event.videos || [],
    documents: event.documents || [],
    tags: event.tags || [],
    shortDescription: event.shortDescription || "",
    slug: event.slug || "",
    edition: event.edition || "",
    eventType: event.eventType || "in-person",
    timezone: event.timezone || "UTC",
    currency: event.currency || "USD",
    bannerImage: event.bannerImage || "",
    thumbnailImage: event.thumbnailImage || "",
    brochure: event.brochure || "",
    layout: event.layout || "",
    isVerified: event.isVerified || false,
    verifiedBadgeImage: event.verifiedBadgeImage || null,
    verifiedAt: event.verifiedAt || null,
    verifiedBy: event.verifiedBy || null,
  })

  const [uploading, setUploading] = useState(false)
  const [newImages, setNewImages] = useState<File[]>([])
  const [newVideos, setNewVideos] = useState<File[]>([])
  const [newDocuments, setNewDocuments] = useState<File[]>([])

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })
  }

  const handleImageUpload = async (files: File[]) => {
    setUploading(true)
    try {
      setNewImages(prev => [...prev, ...files])
    } catch (error) {
      console.error("Error processing images:", error)
      alert("Failed to process images")
    } finally {
      setUploading(false)
    }
  }

  const handleVideoUpload = async (files: File[]) => {
    setUploading(true)
    try {
      setNewVideos(prev => [...prev, ...files])
    } catch (error) {
      console.error("Error processing videos:", error)
      alert("Failed to process videos")
    } finally {
      setUploading(false)
    }
  }

  const handleDocumentUpload = async (files: File[]) => {
    setUploading(true)
    try {
      setNewDocuments(prev => [...prev, ...files])
    } catch (error) {
      console.error("Error processing documents:", error)
      alert("Failed to process documents")
    } finally {
      setUploading(false)
    }
  }

  const removeImage = (index: number, isNew: boolean = false) => {
    if (isNew) {
      setNewImages(prev => prev.filter((_, i) => i !== index))
    } else {
      setFormData(prev => ({
        ...prev,
        images: (prev.images || []).filter((_, i) => i !== index)
      }))
    }
  }

  const removeVideo = (index: number, isNew: boolean = false) => {
    if (isNew) {
      setNewVideos(prev => prev.filter((_, i) => i !== index))
    } else {
      setFormData(prev => ({
        ...prev,
        videos: (prev.videos || []).filter((_, i) => i !== index)
      }))
    }
  }

  const removeDocument = (index: number, isNew: boolean = false) => {
    if (isNew) {
      setNewDocuments(prev => prev.filter((_, i) => i !== index))
    } else {
      setFormData(prev => ({
        ...prev,
        documents: (prev.documents || []).filter((_, i) => i !== index)
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploading(true)

    try {
      const imageUploads = Promise.all(newImages.map(fileToBase64))
      const videoUploads = Promise.all(newVideos.map(fileToBase64))
      const documentUploads = Promise.all(newDocuments.map(fileToBase64))

      const [newImageBase64, newVideoBase64, newDocumentBase64] = await Promise.all([
        imageUploads,
        videoUploads,
        documentUploads
      ])

      const updateData = {
        title: formData.title,
        description: formData.description,
        shortDescription: formData.shortDescription,
        slug: formData.slug,
        edition: formData.edition,
        date: formData.date,
        endDate: formData.endDate,
        status: formData.status,
        maxCapacity: formData.maxCapacity,
        currentAttendees: formData.attendees,
        featured: formData.featured,
        vip: formData.vip,
        category: formData.category,
        tags: formData.tags || [],
        eventType: formData.eventType,
        timezone: formData.timezone,
        venue: formData.venue,
        location: formData.location,
        organizer: formData.organizer,
        ticketPrice: formData.ticketPrice,
        currency: formData.currency,
        images: [...(formData.images || []), ...newImageBase64],
        videos: [...(formData.videos || []), ...newVideoBase64],
        documents: [...(formData.documents || []), ...newDocumentBase64],
        brochure: formData.brochure,
        layout: formData.layout,
        bannerImage: formData.bannerImage,
        thumbnailImage: formData.thumbnailImage,
        isVerified: formData.isVerified,
        verifiedBadgeImage: formData.verifiedBadgeImage,
      }

      console.log("Sending update data:", updateData)

      const res = await fetch(`/api/admin/events/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      })
      
      const result = await res.json()
      
      if (!res.ok) {
        throw new Error(result.error || "Failed to update event")
      }
      
      console.log("Update successful:", result)
      
      if (result.event) {
        onSave(result.event)
      } else {
        throw new Error("No event data returned from server")
      }
    } catch (error) {
      console.error("Error updating event:", error)
      alert(error instanceof Error ? error.message : "Failed to update event")
    } finally {
      setUploading(false)
    }
  }

  const currentImages = formData.images || []
  const currentVideos = formData.videos || []
  const currentDocuments = formData.documents || []

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Edit Event</h1>
          <p className="text-gray-600">Update event details</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Event Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter event title"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Slug *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="event-slug"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edition">Edition</Label>
                  <Input
                    id="edition"
                    value={formData.edition}
                    onChange={(e) => setFormData({ ...formData, edition: e.target.value })}
                    placeholder="e.g., 2024, First Edition"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="organizer">Organizer *</Label>
                  <Input
                    id="organizer"
                    value={formData.organizer}
                    onChange={(e) => setFormData({ ...formData, organizer: e.target.value })}
                    placeholder="Enter organizer name"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="shortDescription">Short Description</Label>
                <Textarea
                  id="shortDescription"
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                  placeholder="Brief description (max 200 characters)"
                  rows={2}
                  maxLength={200}
                />
                <p className="text-xs text-gray-500">
                  {formData.shortDescription?.length || 0}/200 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Full Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed event description"
                  rows={4}
                  required
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Date & Time</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="date">Start Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone *</Label>
                  <Select
                    value={formData.timezone}
                    onValueChange={(value) => setFormData({ ...formData, timezone: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="EST">Eastern Time (EST)</SelectItem>
                      <SelectItem value="PST">Pacific Time (PST)</SelectItem>
                      <SelectItem value="CST">Central Time (CST)</SelectItem>
                      <SelectItem value="IST">India Standard Time (IST)</SelectItem>
                      <SelectItem value="GMT">Greenwich Mean Time (GMT)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Location & Venue</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="venue">Venue Name *</Label>
                  <Input
                    id="venue"
                    value={formData.venue}
                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                    placeholder="Enter venue name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Enter event location"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Event Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories
                        .filter(category => category.isActive)
                        .map((category) => (
                          <SelectItem key={category.id} value={category.name}>
                            {category.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="eventType">Event Type</Label>
                  <Select
                    value={formData.eventType}
                    onValueChange={(value) => setFormData({ ...formData, eventType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select event type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in-person">In-Person</SelectItem>
                      <SelectItem value="virtual">Virtual</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) => setFormData({ ...formData, currency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="INR">INR (₹)</SelectItem>
                      <SelectItem value="CAD">CAD (C$)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  value={(formData.tags || []).join(', ')}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean) 
                  })}
                  placeholder="Enter tags separated by commas"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Capacity & Pricing</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="maxCapacity">Max Capacity *</Label>
                  <Input
                    id="maxCapacity"
                    type="number"
                    value={formData.maxCapacity}
                    onChange={(e) => setFormData({ ...formData, maxCapacity: Number(e.target.value) })}
                    placeholder="Enter maximum capacity"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="attendees">Current Attendees</Label>
                  <Input
                    id="attendees"
                    type="number"
                    value={formData.attendees}
                    onChange={(e) => setFormData({ ...formData, attendees: Number(e.target.value) })}
                    placeholder="Current number of attendees"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ticketPrice">Ticket Price ({formData.currency})</Label>
                  <Input
                    id="ticketPrice"
                    type="number"
                    step="0.01"
                    value={formData.ticketPrice}
                    onChange={(e) => setFormData({ ...formData, ticketPrice: Number(e.target.value) })}
                    placeholder="Enter ticket price"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Media & Documents</h3>
              
              <div className="space-y-2">
                <Label>Banner Image</Label>
                <div className="flex items-center gap-4">
                  {formData.bannerImage && (
                    <ImagePreview
                      src={formData.bannerImage}
                      onRemove={() => setFormData({ ...formData, bannerImage: "" })}
                    />
                  )}
                  <FileUpload
                    label="Upload Banner Image"
                    accept="image/*"
                    onFileUpload={async (files) => {
                      if (files.length > 0) {
                        const base64 = await fileToBase64(files[0])
                        setFormData({ ...formData, bannerImage: base64 })
                      }
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Thumbnail Image</Label>
                <div className="flex items-center gap-4">
                  {formData.thumbnailImage && (
                    <ImagePreview
                      src={formData.thumbnailImage}
                      onRemove={() => setFormData({ ...formData, thumbnailImage: "" })}
                    />
                  )}
                  <FileUpload
                    label="Upload Thumbnail Image"
                    accept="image/*"
                    onFileUpload={async (files) => {
                      if (files.length > 0) {
                        const base64 = await fileToBase64(files[0])
                        setFormData({ ...formData, thumbnailImage: base64 })
                      }
                    }}
                  />
                </div>
              </div>

              <FileUpload
                label="Gallery Images"
                accept="image/*"
                multiple={true}
                currentFiles={currentImages}
                onFileUpload={handleImageUpload}
                onFileRemove={(index) => removeImage(index)}
              />
              
              {newImages.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm">New Images to Upload:</Label>
                  <div className="flex flex-wrap gap-2">
                    {newImages.map((file, index) => (
                      <ImagePreview
                        key={index}
                        src={URL.createObjectURL(file)}
                        onRemove={() => removeImage(index, true)}
                      />
                    ))}
                  </div>
                </div>
              )}

              <FileUpload
                label="Videos"
                accept="video/*"
                multiple={true}
                currentFiles={currentVideos}
                onFileUpload={handleVideoUpload}
                onFileRemove={(index) => removeVideo(index)}
              />

              <FileUpload
                label="Documents (Brochure, Layout, etc.)"
                accept=".pdf,.doc,.docx,.ppt,.pptx"
                multiple={true}
                currentFiles={currentDocuments}
                onFileUpload={handleDocumentUpload}
                onFileRemove={(index) => removeDocument(index)}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Brochure</Label>
                  <FileUpload
                    label="Upload Brochure"
                    accept=".pdf,.doc,.docx"
                    onFileUpload={async (files) => {
                      if (files.length > 0) {
                        const base64 = await fileToBase64(files[0])
                        setFormData({ ...formData, brochure: base64 })
                      }
                    }}
                    currentFiles={formData.brochure ? [formData.brochure] : []}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Layout Plan</Label>
                  <FileUpload
                    label="Upload Layout Plan"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onFileUpload={async (files) => {
                      if (files.length > 0) {
                        const base64 = await fileToBase64(files[0])
                        setFormData({ ...formData, layout: base64 })
                      }
                    }}
                    currentFiles={formData.layout ? [formData.layout] : []}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Status & Features</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: Event["status"]) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Approved">Approved</SelectItem>
                      <SelectItem value="Pending Review">Pending Review</SelectItem>
                      <SelectItem value="Flagged">Flagged</SelectItem>
                      <SelectItem value="Rejected">Rejected</SelectItem>
                      <SelectItem value="Draft">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Features</Label>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="featured"
                        checked={formData.featured}
                        onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor="featured" className="cursor-pointer">Featured Event</Label>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="vip"
                        checked={formData.vip}
                        onChange={(e) => setFormData({ ...formData, vip: e.target.checked })}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor="vip" className="cursor-pointer">VIP Event</Label>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="verified"
                        checked={formData.isVerified}
                        onChange={(e) => setFormData({ ...formData, isVerified: e.target.checked })}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor="verified" className="cursor-pointer">Verified Event</Label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-6 border-t">
              <Button 
                type="submit" 
                className="flex-1" 
                disabled={uploading}
              >
                {uploading ? "Uploading..." : "Save Changes"}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel} 
                className="flex-1"
                disabled={uploading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

// Event List Component
function EventList({
  events,
  searchTerm,
  selectedStatus,
  selectedCategory,
  activeTab,
  eventCounts,
  categories,
  onEdit,
  onStatusChange,
  onFeatureToggle,
  onVipToggle,
  onDelete,
  onPromote,
  onVerify,
  onSearchChange,
  onStatusFilterChange,
  onCategoryFilterChange,
  onTabChange,
}: {
  events: Event[]
  searchTerm: string
  selectedStatus: string
  selectedCategory: string
  activeTab: string
  eventCounts: any
  categories: Category[]
  onEdit: (event: Event) => void
  onStatusChange: (eventId: string, status: Event["status"]) => void
  onFeatureToggle: (eventId: string, current: boolean) => void
  onVipToggle: (eventId: string, current: boolean) => void
  onDelete: (eventId: string) => void
  onPromote: (event: Event) => void
  onVerify: (event: Event) => void
  onSearchChange: (value: string) => void
  onStatusFilterChange: (value: string) => void
  onCategoryFilterChange: (value: string) => void
  onTabChange: (value: string) => void
}) {
  const getFilteredEventsByTab = (tab: string) => {
    const filteredEvents = events.filter((event) => {
      const matchesSearch =
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.organizer.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus =
        selectedStatus === "all" ||
        event.status.toLowerCase().replace(" ", "") === selectedStatus
      const matchesCategory =
        selectedCategory === "all" ||
        event.category.toLowerCase() === selectedCategory
      return matchesSearch && matchesStatus && matchesCategory
    })

    switch (tab) {
      case "pending":
        return filteredEvents.filter((e) => e.status === "Pending Review")
      case "approved":
        return filteredEvents.filter((e) => e.status === "Approved")
      case "flagged":
        return filteredEvents.filter((e) => e.status === "Flagged")
      case "featured":
        return filteredEvents.filter((e) => e.featured)
      case "vip":
        return filteredEvents.filter((e) => e.vip)
      case "verified":
        return filteredEvents.filter((e) => e.isVerified)
      default:
        return filteredEvents
    }
  }

  const getStatusColor = (status: Event["status"]) => {
    switch (status) {
      case "Approved":
        return "default"
      case "Pending Review":
        return "secondary"
      case "Flagged":
        return "destructive"
      case "Rejected":
        return "destructive"
      case "Draft":
        return "outline"
      default:
        return "secondary"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Event Management</h1>
        <div className="flex items-center gap-2">
          <Badge className="bg-green-100 text-green-800">
            <ShieldCheck className="w-4 h-4 mr-1" />
            {events.filter(e => e.isVerified).length} Verified
          </Badge>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search events or organizers..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedStatus} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="pendingreview">Pending Review</SelectItem>
            <SelectItem value="flagged">Flagged</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Select value={selectedCategory} onValueChange={onCategoryFilterChange}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories
              .filter(category => category.isActive)
              .map((category) => (
                <SelectItem key={category.id} value={category.name.toLowerCase()}>
                  {category.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="all">All ({eventCounts.all})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({eventCounts.pending})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({eventCounts.approved})</TabsTrigger>
          <TabsTrigger value="flagged">Flagged ({eventCounts.flagged})</TabsTrigger>
          <TabsTrigger value="featured">Featured ({eventCounts.featured})</TabsTrigger>
          <TabsTrigger value="vip">VIP ({eventCounts.vip})</TabsTrigger>
          <TabsTrigger value="verified">
            <ShieldCheck className="w-4 h-4 mr-1" />
            Verified ({eventCounts.verified})
          </TabsTrigger>
        </TabsList>

        {["all", "pending", "approved", "flagged", "featured", "vip", "verified"].map((tab) => (
          <TabsContent key={tab} value={tab} className="space-y-4">
            {getFilteredEventsByTab(tab).map((event) => (
              <div key={event.id} className="hover:shadow-md transition-shadow border-2 rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4 flex-1">
                      <img
                        src={event.thumbnailImage || event.bannerImage || event.image || "/placeholder.svg"}
                        alt={event.title}
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{event.title}</h3>
                          <Badge variant={getStatusColor(event.status)}>{event.status}</Badge>
                          {event.featured && (
                            <Badge className="bg-purple-100 text-purple-800">
                              <Star className="w-3 h-3 mr-1" /> Featured
                            </Badge>
                          )}
                          {event.vip && (
                            <Badge className="bg-yellow-100 text-yellow-800">
                              <Crown className="w-3 h-3 mr-1" /> VIP
                            </Badge>
                          )}
                          {event.isVerified && <VerifiedBadge event={event} />}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-1">
                            <Building2 className="w-4 h-4" />
                            {event.organizer}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {event.date}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {event.location}
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {event.attendees}/{event.maxCapacity}
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Type: {event.eventType || "In-Person"}</span>
                          <span>Category: {event.category}</span>
                          {event.edition && <span>Edition: {event.edition}</span>}
                          {event.isVerified && (
                            <span className="text-green-600 font-semibold">
                              Verified: {event.verifiedAt ? new Date(event.verifiedAt).toLocaleDateString() : "Recently"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(event)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => onStatusChange(event.id, event.status === "Approved" ? "Pending Review" : "Approved")}>
                            <Edit className="w-4 h-4 mr-2" />
                            Change Status
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onFeatureToggle(event.id, event.featured)}>
                            <Star className="w-4 h-4 mr-2" />
                            {event.featured ? "Remove Featured" : "Make Featured"}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onVipToggle(event.id, event.vip)}>
                            <Crown className="w-4 h-4 mr-2" />
                            {event.vip ? "Remove VIP" : "Make VIP"}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onVerify(event)}>
                            {event.isVerified ? (
                              <>
                                <ShieldOff className="w-4 h-4 mr-2" />
                                Remove Verification
                              </>
                            ) : (
                              <>
                                <ShieldCheck className="w-4 h-4 mr-2" />
                                Verify Event
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onPromote(event)}>
                            <TrendingUp className="w-4 h-4 mr-2" />
                            Promote Event
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Contact Organizer
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600" onClick={() => onDelete(event.id)}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Event
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </div>
            ))}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

// Main Component
export default function EventManagement() {
  const [events, setEvents] = useState<Event[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isPromoteDialogOpen, setIsPromoteDialogOpen] = useState(false)
  const [isVerifyDialogOpen, setIsVerifyDialogOpen] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [activeTab, setActiveTab] = useState("all")

  const router = useRouter()

  const fetchEvents = async () => {
    try {
      console.log("Fetching events from /api/admin/events")
      const res = await fetch("/api/admin/events")
      const data = await res.json()
      
      // Debug: Check what data is coming from API
      console.log("Fetched events data:", data)
      console.log("First event verification status:", data.events?.[0]?.isVerified)
      console.log("First event badge image:", data.events?.[0]?.verifiedBadgeImage)
      console.log("Total events:", data.events?.length)
      
      // Ensure verification fields exist
      const eventsWithVerification = data.events?.map((event: any) => ({
        ...event,
        isVerified: event.isVerified || false,
        verifiedAt: event.verifiedAt || null,
        verifiedBy: event.verifiedBy || null,
        verifiedBadgeImage: event.verifiedBadgeImage || null,
      })) || []
      
      setEvents(eventsWithVerification)
    } catch (error) {
      console.error("Error fetching events:", error)
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
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/admin/event-categories?includeCounts=true")
        const data = await res.json()
        
        if (Array.isArray(data)) {
          setCategories(data)
        } else {
          console.error("Unexpected categories response format:", data)
          setCategories([])
        }
      } catch (error) {
        console.error("Error fetching categories:", error)
        setCategories([])
      } finally {
        setCategoriesLoading(false)
      }
    }
    fetchCategories()
  }, [])

  const handleStatusChange = async (eventId: string, newStatus: Event["status"]) => {
    try {
      const res = await fetch(`/api/admin/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      
      const result = await res.json()
      
      if (!res.ok) throw new Error(result.error || "Failed to update status")
      
      // Update the event in state with all fields including verification
      setEvents((prev) => prev.map((e) => {
        if (e.id === eventId) {
          return {
            ...e,
            status: newStatus,
            // Preserve verification fields from result
            isVerified: result.event?.isVerified || e.isVerified,
            verifiedBadgeImage: result.event?.verifiedBadgeImage || e.verifiedBadgeImage,
            verifiedAt: result.event?.verifiedAt || e.verifiedAt,
            verifiedBy: result.event?.verifiedBy || e.verifiedBy,
          }
        }
        return e
      }))
      
      toast({
        title: "Status Updated",
        description: `Event status changed to ${newStatus}`,
      })
    } catch (error) {
      console.error("Failed to update event status:", error)
      toast({
        title: "Error",
        description: "Failed to update event status",
        variant: "destructive",
      })
    }
  }

  const handleFeatureToggle = async (eventId: string, current: boolean) => {
    try {
      const res = await fetch(`/api/admin/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featured: !current }),
      })
      
      const result = await res.json()
      
      if (!res.ok) throw new Error("Failed to toggle featured")
      
      setEvents((prev) => prev.map((e) => {
        if (e.id === eventId) {
          return {
            ...e,
            featured: !current,
            // Preserve verification fields
            isVerified: result.event?.isVerified || e.isVerified,
            verifiedBadgeImage: result.event?.verifiedBadgeImage || e.verifiedBadgeImage,
          }
        }
        return e
      }))
    } catch (error) {
      console.error("Failed to toggle featured:", error)
    }
  }

  const handleVipToggle = async (eventId: string, current: boolean) => {
    try {
      const res = await fetch(`/api/admin/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vip: !current }),
      })
      
      const result = await res.json()
      
      if (!res.ok) throw new Error("Failed to toggle VIP")
      
      setEvents((prev) => prev.map((e) => {
        if (e.id === eventId) {
          return {
            ...e,
            vip: !current,
            // Preserve verification fields
            isVerified: result.event?.isVerified || e.isVerified,
            verifiedBadgeImage: result.event?.verifiedBadgeImage || e.verifiedBadgeImage,
          }
        }
        return e
      }))
    } catch (error) {
      console.error("Failed to toggle VIP:", error)
    }
  }

  const handleVerifyToggle = async (event: Event, verify: boolean, customBadge?: File) => {
    try {
      setVerifying(true)
      
      const formData = new FormData()
      formData.append("isVerified", verify.toString())
      
      if (customBadge && verify) {
        formData.append("badgeFile", customBadge)
      }

      const res = await fetch(`/api/admin/events/${event.id}/verify`, {
        method: "POST",
        body: formData,
      })
      
      const result = await res.json()
      
      if (!res.ok) throw new Error(result.error || "Failed to update verification")
      
      // Update the event in state with all verification fields
      setEvents(prev => prev.map((e) => 
        e.id === event.id ? {
          ...e,
          isVerified: verify,
          verifiedAt: verify ? new Date().toISOString() : null,
          verifiedBy: verify ? result.event?.verifiedBy || "Admin" : null,
          verifiedBadgeImage: verify ? (result.event?.verifiedBadgeImage || "/badge/VerifiedBADGE (1).png") : null,
        } : e
      ))
      
      setIsVerifyDialogOpen(false)
      
      toast({
        title: verify ? "Event Verified" : "Verification Removed",
        description: verify 
          ? "Event has been marked as verified" 
          : "Event verification has been removed",
      })
    } catch (error) {
      console.error("Failed to update verification:", error)
      toast({
        title: "Error",
        description: "Failed to update verification status",
        variant: "destructive",
      })
    } finally {
      setVerifying(false)
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return
    try {
      const res = await fetch(`/api/admin/events/${eventId}`, { 
        method: "DELETE" 
      })
      
      const result = await res.json()
      
      if (!res.ok) {
        throw new Error(result.error || "Failed to delete event")
      }
      
      console.log("Delete successful:", result)
      setEvents((prev) => prev.filter((e) => e.id !== eventId))
      
      toast({
        title: "Event Deleted",
        description: "Event has been deleted successfully",
      })
    } catch (error) {
      console.error("Failed to delete event:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete event",
        variant: "destructive",
      })
    }
  }

  const handleEditEvent = (event: Event) => {
    setSelectedEvent(event)
    setIsEditing(true)
  }

  const handleSaveEvent = (updatedEvent: Event) => {
    setEvents((prev) => prev.map((e) => (e.id === updatedEvent.id ? updatedEvent : e)))
    setIsEditing(false)
    setSelectedEvent(null)
    
    toast({
      title: "Event Updated",
      description: "Event details have been saved successfully",
    })
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setSelectedEvent(null)
  }

  const handleVerifyEvent = (event: Event) => {
    setSelectedEvent(event)
    setIsVerifyDialogOpen(true)
  }

  const eventCounts = {
    all: events.length,
    approved: events.filter((e) => e.status === "Approved").length,
    pending: events.filter((e) => e.status === "Pending Review").length,
    flagged: events.filter((e) => e.status === "Flagged").length,
    featured: events.filter((e) => e.featured).length,
    vip: events.filter((e) => e.vip).length,
    verified: events.filter((e) => e.isVerified).length,
  }

  if (loading || categoriesLoading)
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <p className="text-gray-500">Loading events...</p>
      </div>
    )

  if (isEditing && selectedEvent) {
    return (
      <EditEventForm
        event={selectedEvent}
        onSave={handleSaveEvent}
        onCancel={handleCancelEdit}
        categories={categories}
      />
    )
  }

  return (
    <>
      <EventList
        events={events}
        searchTerm={searchTerm}
        selectedStatus={selectedStatus}
        selectedCategory={selectedCategory}
        activeTab={activeTab}
        eventCounts={eventCounts}
        categories={categories}
        onEdit={handleEditEvent}
        onStatusChange={handleStatusChange}
        onFeatureToggle={handleFeatureToggle}
        onVipToggle={handleVipToggle}
        onDelete={handleDeleteEvent}
        onPromote={(event) => {
          setSelectedEvent(event)
          setIsPromoteDialogOpen(true)
        }}
        onVerify={handleVerifyEvent}
        onSearchChange={setSearchTerm}
        onStatusFilterChange={setSelectedStatus}
        onCategoryFilterChange={setSelectedCategory}
        onTabChange={setActiveTab}
      />

      <VerifyEventDialog
        event={selectedEvent}
        open={isVerifyDialogOpen}
        onOpenChange={setIsVerifyDialogOpen}
        onVerify={(verify, customBadge) => {
          if (selectedEvent) {
            handleVerifyToggle(selectedEvent, verify, customBadge)
          }
        }}
        loading={verifying}
      />
    </>
  )
}