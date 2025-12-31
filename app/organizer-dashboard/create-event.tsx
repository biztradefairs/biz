"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import {
  Calendar,
  MapPin,
  Clock,
  IndianRupee,
  Upload,
  X,
  Plus,
  Eye,
  Send,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import Image from "next/image"
import { useToast } from "@/hooks/use-toast"
import AddVenue from "./add-venue"

interface SpaceCost {
  type: string
  description: string
  pricePerSqm?: number
  minArea?: number
  pricePerUnit?: number
  unit?: string
  isFixed: boolean
}

interface TicketType {
  name: string
  price: number
  currency?: string
}

interface EventFormData {
  // Basic Info
  title: string
  slug: string
  description: string
  eventType: string
  categories: string[]
  edition: number
  startDate: string
  endDate: string
  dailyStart: string
  dailyEnd: string
  timezone: string
  venueId: string
  venue: string
  city: string
  address: string

  // Pricing
  currency: string
  generalPrice: number
  studentPrice: number
  vipPrice: number
  groupPrice: number

  // Event Details
  highlights: string[]
  tags: string[]
  dressCode: string
  ageLimit: string
  featured: boolean
  vip: boolean

  // Space Costs
  spaceCosts: SpaceCost[]

  ticketTypes: TicketType[]

  // Media
  images: string[]
  brochure: string
  layoutPlan: string

  // Features
  featuredHotels: Array<{
    name: string
    category: string
    rating: number
    image: string
  }>
  travelPartners: Array<{
    name: string
    category: string
    rating: number
    image: string
    description: string
  }>
  touristAttractions: Array<{
    name: string
    category: string
    rating: number
    image: string
    description: string
  }>

  // Additional Fields
  ageRestriction: string
  accessibility: string
  parking: string
  publicTransport: string
  foodBeverage: string
  wifi: string
  photography: string
  recording: string
  liveStreaming: string
  socialMedia: string
  networking: string
  certificates: string
  materials: string
  followUp: string
}

interface ValidationErrors {
  title?: string
  slug?: string
  description?: string
  eventType?: string
  startDate?: string
  endDate?: string
  venue?: string
  city?: string
  address?: string
  tags?: string
}

// Helper function to convert UTC time to local time string
const convertUTCToLocalTime = (utcDateString: string, timezone: string = "Asia/Kolkata"): string => {
  if (!utcDateString) return "";

  try {
    const date = new Date(utcDateString);

    // Format to local time in HH:mm format
    return date.toLocaleTimeString('en-US', {
      timeZone: timezone,
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error("Error converting UTC to local time:", error);
    return "";
  }
};



// Helper function to convert local time to UTC
const convertLocalToUTC = (localTime: string, dateString: string, timezone: string = "Asia/Kolkata"): string => {
  if (!localTime || !dateString) return "";

  try {
    // Create a date string with the local time
    const localDateTime = `${dateString}T${localTime}:00`;

    // Parse as local time in the specified timezone
    const date = new Date(localDateTime);

    // Convert to UTC string
    return date.toISOString();
  } catch (error) {
    console.error("Error converting local to UTC:", error);
    return "";
  }
};

// Helper function to convert 24-hour time to 12-hour format with AM/PM
const formatTimeTo12Hour = (time24: string): string => {
  if (!time24 || time24.trim() === "") return "";

  try {
    // Extract hours and minutes
    const [hoursStr, minutesStr] = time24.split(':');
    const hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);

    if (isNaN(hours) || isNaN(minutes)) return time24;

    const period = hours >= 12 ? 'pm' : 'am';
    const hours12 = hours % 12 || 12;

    return `${hours12}:${minutes.toString().padStart(2, '0')}${period}`;
  } catch (error) {
    return time24;
  }
};

// Helper function to get date part from ISO string
const getDatePart = (isoString: string): string => {
  if (!isoString) return "";
  return isoString.split('T')[0];
};

// Helper function to get time part from ISO string
const getTimePart = (isoString: string): string => {
  if (!isoString) return "00:00";
  const timePart = isoString.split('T')[1];
  if (!timePart) return "00:00";
  return timePart.substring(0, 5);
};

export default function CreateEvent({ organizerId }: { organizerId: string }) {
  const [activeTab, setActiveTab] = useState("basic")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [completionPercentage, setCompletionPercentage] = useState(0)
  const { toast } = useToast()
  const [showValidationErrors, setShowValidationErrors] = useState(false)
  const [isUploadingImages, setIsUploadingImages] = useState(false)
  const [isUploadingBrochure, setIsUploadingBrochure] = useState(false)
  const [isUploadingLayoutPlan, setIsUploadingLayoutPlan] = useState(false)
  const [selectedVenueId, setSelectedVenueId] = useState<string>("")

  const [formData, setFormData] = useState<EventFormData>({
    title: "",
    slug: "",
    description: "",
    eventType: "",
    categories: [],
    edition: 0,
    startDate: "",
    endDate: "",
    dailyStart: "08:30",
    dailyEnd: "18:30",
    timezone: "Asia/Kolkata",
    venueId: "",
    venue: "",
    city: "",
    address: "",
    currency: "₹",
    generalPrice: 0,
    studentPrice: 0,
    vipPrice: 0,
    groupPrice: 0,
    highlights: [],
    tags: [],
    dressCode: "Business Casual",
    ageLimit: "18+",
    featured: false,
    vip: false,
    ticketTypes: [],
    spaceCosts: [
      {
        type: "Shell Space (Standard Booth)",
        description: "Fully constructed booth with walls, flooring, basic lighting, and standard amenities",
        pricePerSqm: 5000,
        minArea: 9,
        isFixed: true,
      },
      {
        type: "Raw Space",
        description: "Open floor space without any construction or amenities",
        pricePerSqm: 2500,
        minArea: 20,
        isFixed: false,
      },
      {
        type: "2 Side Open Space",
        description: "Space with two sides open for better visibility and accessibility",
        pricePerSqm: 3500,
        minArea: 12,
        isFixed: true,
      },
      {
        type: "3 Side Open Space",
        description: "Premium corner space with three sides open for maximum exposure",
        pricePerSqm: 4200,
        minArea: 15,
        isFixed: true,
      },
      {
        type: "4 Side Open Space",
        description: "Island space with all four sides open for 360-degree visibility",
        pricePerSqm: 5500,
        minArea: 25,
        isFixed: true,
      },
      {
        type: "Mezzanine Charges",
        description: "Additional upper level space for storage or display purposes",
        pricePerSqm: 1500,
        minArea: 10,
        isFixed: true,
      },
      {
        type: "Additional Power",
        description: "Extra electrical power supply for high-consumption equipment",
        pricePerUnit: 800,
        unit: "KW",
        isFixed: true,
      },
      {
        type: "Compressed Air",
        description: "Compressed air supply for machinery demonstration (6 bar pressure)",
        pricePerUnit: 1200,
        unit: "HP",
        isFixed: true,
      },
    ],
    images: [],
    brochure: "",
    layoutPlan: "",
    featuredHotels: [],
    travelPartners: [],
    touristAttractions: [],
    ageRestriction: "",
    accessibility: "",
    parking: "",
    publicTransport: "",
    foodBeverage: "",
    wifi: "",
    photography: "",
    recording: "",
    liveStreaming: "",
    socialMedia: "",
    networking: "",
    certificates: "",
    materials: "",
    followUp: "",
  })

  const [showHotelModal, setShowHotelModal] = useState(false)
  const [showPartnerModal, setShowPartnerModal] = useState(false)
  const [showAttractionModal, setShowAttractionModal] = useState(false)
  const [currentHotel, setCurrentHotel] = useState({ name: "", category: "", rating: 5, image: "" })
  const [currentPartner, setCurrentPartner] = useState({
    name: "",
    category: "",
    rating: 5,
    image: "",
    description: "",
  })
  const [currentAttraction, setCurrentAttraction] = useState({
    name: "",
    category: "",
    rating: 5,
    image: "",
    description: "",
  })

  const [newHighlight, setNewHighlight] = useState("")
  const [newTag, setNewTag] = useState("")
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})
  const [isPublishing, setIsPublishing] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const brochureInputRef = useRef<HTMLInputElement>(null)
  const layoutPlanInputRef = useRef<HTMLInputElement>(null)

  const tabs = [
    { id: "basic", label: "Basic Info" },
    { id: "details", label: "Event Details" },
    { id: "pricing", label: "Pricing & Space" },
    { id: "media", label: "Media & Content" },
    { id: "preview", label: "Preview" },
  ]
  const handleVenueSelect = (venueId: string) => {
    setSelectedVenueId(venueId)
  }
  const handleVenueChange = (venueData: {
    venueId?: string
    venueName: string
    venueAddress: string
    city: string
    state?: string
    country?: string
  }) => {
    setSelectedVenueId(venueData.venueId || "")
    setFormData((prev) => ({
      ...prev,
      venueId: venueData.venueId || "",
      venue: venueData.venueName,
      address: venueData.venueAddress,
      city: venueData.city,
    }))
  }

  const eventTypes = [
    "Conference",
    "Trade Show",
    "Exhibition",
    "Workshop",
    "Seminar",
  ]

  const eventCategories = [
    "Education & Training",
    "Medical & Pharma",
    "IT & Technology",
    "Banking & Finance",
    "Business Services",
    "Industrial Engineering",
    "Building & Construction",
    "Power & Energy",
    "Entertainment & Media",
    "Wellness, Health & Fitness",
    "Science & Research",
    "Environment & Waste",
    "Agriculture & Forestry",
    "Food & Beverages",
    "Logistics & Transportation",
    "Electric & Electronics",
    "Arts & Crafts",
    "Auto & Automotive",
    "Home & Office",
    "Security & Defense",
    "Fashion & Beauty",
    "Travel & Tourism",
    "Telecommunication",
    "Apparel & Clothing",
    "Animals & Pets",
    "Baby, Kids & Maternity",
    "Hospitality",
    "Packing & Packaging",
    "Miscellaneous",
  ]

  const currencies = ["₹", "$", "€", "£", "¥"]

  const addHighlight = () => {
    if (newHighlight.trim()) {
      setFormData((prev) => ({
        ...prev,
        highlights: [...prev.highlights, newHighlight.trim()],
      }))
      setNewHighlight("")
    }
  }

  const removeHighlight = (index: number) => {
    setFormData((prev: EventFormData) => ({
      ...prev,
      highlights: prev.highlights.filter(
        (_: string, i: number) => i !== index
      ),
    }))
  }


  const addTag = () => {
    if (newTag.trim()) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }))
      setNewTag("")
    }
  }

  const removeTag = (index: number) => {
    setFormData((prev: EventFormData) => ({
      ...prev,
      tags: prev.tags.filter(
        (_: string, i: number) => i !== index
      ),
    }))
  }


  const addCustomSpaceCost = () => {
    setFormData((prev) => ({
      ...prev,
      spaceCosts: [
        ...prev.spaceCosts,
        {
          type: "",
          description: "",
          pricePerSqm: 0,
          minArea: 0,
          isFixed: false,
        },
      ],
    }))
  }

  const updateSpaceCost = (index: number, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      spaceCosts: prev.spaceCosts.map((cost, i) => (i === index ? { ...cost, [field]: value } : cost)),
    }))
  }

  const removeSpaceCost = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      spaceCosts: prev.spaceCosts.filter((_, i) => i !== index),
    }))
  }

  const handleCategoryToggle = (category: string) => {
    setFormData((prev) => {
      const currentCategories = prev.categories;

      if (currentCategories.includes(category)) {
        return {
          ...prev,
          categories: currentCategories.filter((c) => c !== category),
        };
      }

      if (currentCategories.length < 2) {
        return {
          ...prev,
          categories: [...currentCategories, category],
        };
      }

      return prev;
    });
  };

  const calculateCompletionPercentage = () => {
    const requiredFields = [
      formData.title,
      formData.slug,
      formData.description,
      formData.eventType,
      formData.startDate,
      formData.endDate,
      formData.venue,
      formData.city,
      formData.address,
    ]

    const optionalFields = [
      formData.categories.length > 0,
      formData.highlights.length > 0,
      formData.tags.length > 0,
      formData.generalPrice > 0,
      formData.images.length > 0,
    ]

    const requiredCompleted = requiredFields.filter((field) => field && field.toString().trim() !== "").length
    const optionalCompleted = optionalFields.filter(Boolean).length

    const requiredPercentage = (requiredCompleted / requiredFields.length) * 80
    const optionalPercentage = (optionalCompleted / optionalFields.length) * 20

    return Math.round(requiredPercentage + optionalPercentage)
  }

  useEffect(() => {
    setCompletionPercentage(calculateCompletionPercentage())
  }, [formData])

  const handleNextTab = () => {
    const currentIndex = tabs.findIndex((tab) => tab.id === activeTab)
    if (currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1].id)
    }
  }

  const handlePreviousTab = () => {
    const currentIndex = tabs.findIndex((tab) => tab.id === activeTab)
    if (currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1].id)
    }
  }

  const handleSaveDraft = async () => {
    setIsSubmitting(true)
    try {
      const eventData = {
        ...formData,
        status: "DRAFT",
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        ticketTypes: [
          { name: "General", price: formData.generalPrice, currency: formData.currency },
          { name: "Student", price: formData.studentPrice, currency: formData.currency },
          { name: "VIP", price: formData.vipPrice, currency: formData.currency },
        ].filter((ticket) => ticket.price > 0),
      }

      const response = await fetch(`/api/organizers/${organizerId}/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventData),
      })

      if (!response.ok) {
        throw new Error("Failed to save draft")
      }

      const result = await response.json()
      toast({
        title: "Draft Saved",
        description: "Your event draft has been saved successfully.",
      })
    } catch (error) {
      console.error("Error saving draft:", error)
      toast({
        title: "Error",
        description: "Failed to save draft. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePublishEvent = async () => {
    if (isUploadingBrochure || isUploadingLayoutPlan || isUploadingImages) {
      toast({
        title: "Please Wait",
        description: "File uploads are still in progress. Please wait for them to complete.",
        variant: "destructive",
      })
      return
    }

    const newValidationErrors: ValidationErrors = {}

    if (!formData.title.trim()) newValidationErrors.title = "Title is required for publishing"
    if (!formData.slug.trim()) newValidationErrors.slug = "Slug is required for publishing"
    if (!formData.description.trim()) newValidationErrors.description = "Description is required for publishing"
    if (!formData.eventType.trim()) newValidationErrors.eventType = "Event type is required for publishing"
    if (!formData.startDate.trim()) newValidationErrors.startDate = "Start date is required for publishing"
    if (!formData.endDate.trim()) newValidationErrors.endDate = "End date is required for publishing"

    if (formData.tags.length === 0) newValidationErrors.tags = "Event tags & keywords are required for publishing"

    setValidationErrors(newValidationErrors)

    if (Object.keys(newValidationErrors).length > 0) {
      return
    }

    setIsPublishing(true)
    try {
      const exhibitionSpaces = formData.spaceCosts
        .filter((cost) => cost.type.trim() !== "")
        .map((cost) => {
          let spaceType
          const spaceName = cost.type?.toLowerCase() || ""

          if (spaceName.includes("shell space") || spaceName.includes("standard booth")) {
            spaceType = "SHELL_SPACE"
          } else if (spaceName.includes("raw space")) {
            spaceType = "RAW_SPACE"
          } else if (spaceName.includes("2 side open")) {
            spaceType = "TWO_SIDE_OPEN"
          } else if (spaceName.includes("3 side open")) {
            spaceType = "THREE_SIDE_OPEN"
          } else if (spaceName.includes("4 side open")) {
            spaceType = "FOUR_SIDE_OPEN"
          } else if (spaceName.includes("mezzanine")) {
            spaceType = "MEZZANINE"
          } else if (spaceName.includes("additional power")) {
            spaceType = "ADDITIONAL_POWER"
          } else if (spaceName.includes("compressed air")) {
            spaceType = "COMPRESSED_AIR"
          } else {
            spaceType = "CUSTOM"
          }

          return {
            spaceType: spaceType,
            name: cost.type,
            description: cost.description || "",
            area: cost.minArea || 0,
            dimensions: cost.minArea ? `${cost.minArea} sq.m` : "",
            location: null,
            basePrice: cost.pricePerSqm || cost.pricePerUnit || 0,
            pricePerSqm: cost.pricePerSqm || null,
            minArea: cost.minArea || null,
            pricePerUnit: cost.pricePerUnit || null,
            unit: cost.unit || null,
            currency: formData.currency,
            powerIncluded: false,
            additionalPowerRate: cost.type.toLowerCase().includes("power") ? cost.pricePerUnit || 0 : null,
            compressedAirRate: cost.type.toLowerCase().includes("air") ? cost.pricePerUnit || 0 : null,
            isFixed: cost.isFixed || false,
            isAvailable: true,
            maxBooths: null,
            bookedBooths: 0,
            setupRequirements: null,
          }
        })

      // FIX: Convert local times to UTC before sending to backend
      const startDateWithTime = convertLocalToUTC(
        formData.dailyStart,
        getDatePart(formData.startDate),
        formData.timezone
      ) || formData.startDate;

      const endDateWithTime = convertLocalToUTC(
        formData.dailyEnd,
        getDatePart(formData.endDate),
        formData.timezone
      ) || formData.endDate;

      const eventData = {
        title: formData.title,
        slug: formData.slug,
        description: formData.description,
        shortDescription: formData.description.substring(0, 200),
        category: formData.categories.length > 0 ? formData.categories.join(", ") : formData.eventType || null,
        edition: formData.edition || null,
        tags: formData.tags,
        startDate: startDateWithTime,
        endDate: endDateWithTime,
        registrationStart: startDateWithTime,
        registrationEnd: endDateWithTime,
        timezone: formData.timezone,
        isVirtual: false,
        address: formData.address,
        location: formData.venue,
        city: formData.city,
        state: "",
        country: "India",
        venue: formData.venueId,
        currency: formData.currency,
        images: formData.images,
        documents: [formData.brochure, formData.layoutPlan].filter(Boolean),
        brochure: formData.brochure || null,
        layoutPlan: formData.layoutPlan || null,
        bannerImage: formData.images[0] || null,
        thumbnailImage: formData.images[0] || null,
        isPublic: true,
        requiresApproval: false,
        allowWaitlist: false,
        status: "published",
        featured: formData.featured,
        vip: formData.vip,
        exhibitionSpaces: exhibitionSpaces,
        eventType: [formData.eventType],
        maxAttendees: null,
        ticketTypes: [
          {
            name: "General",
            description: "General admission ticket",
            price: formData.generalPrice,
            quantity: 1000,
            isActive: formData.generalPrice > 0,
          },
          {
            name: "Student",
            description: "Student discount ticket",
            price: formData.studentPrice,
            quantity: 500,
            isActive: formData.studentPrice > 0,
          },
          {
            name: "VIP",
            description: "VIP access ticket",
            price: formData.vipPrice,
            quantity: 100,
            isActive: formData.vipPrice > 0,
          },
        ].filter((ticket) => ticket.isActive),
      }

      console.log("Publishing event with data:", eventData)
      console.log("Start date (UTC):", startDateWithTime)
      console.log("End date (UTC):", endDateWithTime)
      console.log("Daily start:", formData.dailyStart, "Daily end:", formData.dailyEnd)

      const response = await fetch(`/api/organizers/${organizerId}/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventData),
      })

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.error || "Failed to publish event")
      }

      toast({
        title: "Success",
        description: "Event created successfully with exhibition spaces",
      })

      // Reset form
      setFormData({
        title: "",
        slug: "",
        description: "",
        eventType: "",
        categories: [],
        edition: 0,
        startDate: "",
        endDate: "",
        dailyStart: "08:30",
        dailyEnd: "18:30",
        timezone: "Asia/Kolkata",
        venueId: "",
        venue: "",
        city: "",
        address: "",
        currency: "₹",
        generalPrice: 0,
        studentPrice: 0,
        vipPrice: 0,
        groupPrice: 0,
        highlights: [],
        tags: [],
        dressCode: "Business Casual",
        ageLimit: "18+",
        featured: false,
        vip: false,
        ticketTypes: [],
        spaceCosts: [
          {
            type: "Shell Space (Standard Booth)",
            description: "Fully constructed booth with walls, flooring, basic lighting, and standard amenities",
            pricePerSqm: 5000,
            minArea: 9,
            isFixed: true,
          },
          {
            type: "Raw Space",
            description: "Open floor space without any construction or amenities",
            pricePerSqm: 2500,
            minArea: 20,
            isFixed: false,
          },
          {
            type: "2 Side Open Space",
            description: "Space with two sides open for better visibility and accessibility",
            pricePerSqm: 3500,
            minArea: 12,
            isFixed: true,
          },
          {
            type: "3 Side Open Space",
            description: "Premium corner space with three sides open for maximum exposure",
            pricePerSqm: 4200,
            minArea: 15,
            isFixed: true,
          },
          {
            type: "4 Side Open Space",
            description: "Island space with all four sides open for 360-degree visibility",
            pricePerSqm: 5500,
            minArea: 25,
            isFixed: true,
          },
          {
            type: "Mezzanine Charges",
            description: "Additional upper level space for storage or display purposes",
            pricePerSqm: 1500,
            minArea: 10,
            isFixed: true,
          },
          {
            type: "Additional Power",
            description: "Extra electrical power supply for high-consumption equipment",
            pricePerUnit: 800,
            unit: "KW",
            isFixed: true,
          },
          {
            type: "Compressed Air",
            description: "Compressed air supply for machinery demonstration (6 bar pressure)",
            pricePerUnit: 1200,
            unit: "HP",
            isFixed: true,
          },
        ],
        images: [],
        brochure: "",
        layoutPlan: "",
        featuredHotels: [],
        travelPartners: [],
        touristAttractions: [],
        ageRestriction: "",
        accessibility: "",
        parking: "",
        publicTransport: "",
        foodBeverage: "",
        wifi: "",
        photography: "",
        recording: "",
        liveStreaming: "",
        socialMedia: "",
        networking: "",
        certificates: "",
        materials: "",
        followUp: "",
      })
      setValidationErrors({})
    } catch (error) {
      console.error("Error publishing event:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to publish event",
        variant: "destructive",
      })
    } finally {
      setIsPublishing(false)
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setIsUploadingImages(true)
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("folder", "events")

        const response = await fetch("/api/upload/cloudinary", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to upload image")
        }

        const data = await response.json()
        return data.url
      })

      const uploadedUrls = await Promise.all(uploadPromises)

      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls],
      }))

      toast({
        title: "Success",
        description: `${uploadedUrls.length} image(s) uploaded successfully`,
      })
    } catch (error) {
      console.error("Error uploading images:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload images. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploadingImages(false)
      if (event.target) {
        event.target.value = ""
      }
    }
  }

  const handleBrochureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a PDF, DOC, or DOCX file",
        variant: "destructive",
      })
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "File size must be less than 10MB",
        variant: "destructive",
      })
      return
    }

    setIsUploadingBrochure(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("organizerId", organizerId)

      const eventId = "someEventId"
      if (eventId) {
        formData.append("eventId", eventId)
      }

      const response = await fetch("/api/brochure/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to upload brochure")
      }

      const data = await response.json()

      setFormData((prev) => ({
        ...prev,
        brochure: data.url,
      }))

      toast({
        title: "Success",
        description: "Brochure uploaded successfully",
      })
    } catch (error) {
      console.error("Error uploading brochure:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload brochure. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploadingBrochure(false)
      if (event.target) {
        event.target.value = ""
      }
    }
  }

  const handleLayoutPlanUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const validTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"]
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a PDF, JPG, or PNG file",
        variant: "destructive",
      })
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload a file smaller than 10MB",
        variant: "destructive",
      })
      return
    }

    setIsUploadingLayoutPlan(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("folder", "event-documents")

      const response = await fetch("/api/upload/cloudinary", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to upload layout plan")
      }

      const data = await response.json()

      setFormData((prev) => ({ ...prev, layoutPlan: data.url }))

      toast({
        title: "Success",
        description: "Layout plan uploaded successfully",
      })
    } catch (error) {
      console.error("Error uploading layout plan:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload layout plan. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploadingLayoutPlan(false)
      if (event.target) {
        event.target.value = ""
      }
    }
  }

  const handleAddHotel = () => {
    setShowHotelModal(true)
  }

  const handleAddPartner = () => {
    setShowPartnerModal(true)
  }

  const handleAddAttraction = () => {
    setShowAttractionModal(true)
  }

  const handleImageUploadModal = (file: File, type: "hotel" | "partner" | "attraction") => {
    const imageUrl = URL.createObjectURL(file)
    if (type === "hotel") {
      setCurrentHotel((prev) => ({ ...prev, image: imageUrl }))
    } else if (type === "partner") {
      setCurrentPartner((prev) => ({ ...prev, image: imageUrl }))
    } else if (type === "attraction") {
      setCurrentAttraction((prev) => ({ ...prev, image: imageUrl }))
    }
  }

  const saveHotel = () => {
    if (currentHotel.name && currentHotel.category) {
      setFormData((prev) => ({
        ...prev,
        featuredHotels: [...(prev.featuredHotels || []), currentHotel],
      }))
      setCurrentHotel({ name: "", category: "", rating: 5, image: "" })
      setShowHotelModal(false)
    }
  }

  const savePartner = () => {
    if (currentPartner.name && currentPartner.category && currentPartner.description) {
      setFormData((prev) => ({
        ...prev,
        travelPartners: [...(prev.travelPartners || []), currentPartner],
      }))
      setCurrentPartner({ name: "", category: "", rating: 5, image: "", description: "" })
      setShowPartnerModal(false)
    }
  }

  const saveAttraction = () => {
    if (currentAttraction.name && currentAttraction.category && currentAttraction.description) {
      setFormData((prev) => ({
        ...prev,
        touristAttractions: [...(prev.touristAttractions || []), currentAttraction],
      }))
      setCurrentAttraction({ name: "", category: "", rating: 5, image: "", description: "" })
      setShowAttractionModal(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-card border rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Form Completion</span>
          <span className="text-sm text-muted-foreground">{completionPercentage}%</span>
        </div>
        <Progress value={completionPercentage} className="h-2" />
        <p className="text-xs text-muted-foreground mt-1">
          {completionPercentage < 80 ? "Complete required fields to publish your event" : "Ready to publish!"}
        </p>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Create New Event</h2>
          <p className="text-gray-600">Fill in the details to create your event</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={handlePublishEvent} disabled={isPublishing || completionPercentage < 80}>
            <Send className="w-4 h-4 mr-2" />
            {isPublishing ? "Publishing..." : "Publish Event"}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Basic Info Tab */}
        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <p className="text-sm text-muted-foreground">
                All fields in this section are required for publishing your event.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="title">Event Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter event title"
                  />
                  {showValidationErrors && (!formData.title || formData.title.trim() === "") && (
                    <p className="text-sm text-red-500 mt-1">This field is required for publishing</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="slug">Event Sub Title *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                    placeholder="Enter event sub title"
                  />
                  {showValidationErrors && (!formData.slug || formData.slug.trim() === "") && (
                    <p className="text-sm text-red-500 mt-1">This field is required for publishing</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="edition">Edition</Label>
                  <Input
                    id="edition"
                    type="number"
                    value={formData.edition === 0 ? "" : formData.edition}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        edition: e.target.value === "" ? 0 : Number(e.target.value),
                      }))
                    }
                    placeholder="e.g., 1, 2, 3"
                    min="0"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Optional: Specify the edition number</p>
                </div>

                <div>
                  <Label htmlFor="eventType">Event Type *</Label>
                  <Select
                    value={formData.eventType}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, eventType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select event type" />
                    </SelectTrigger>
                    <SelectContent>
                      {eventTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {showValidationErrors && (!formData.eventType || formData.eventType.trim() === "") && (
                    <p className="text-sm text-red-500 mt-1">This field is required for publishing</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <Label>Event Categories</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mt-2">
                    {eventCategories.map((category) => (
                      <div key={category} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`category-${category}`}
                          checked={formData.categories.includes(category)}
                          onChange={() => handleCategoryToggle(category)}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label
                          htmlFor={`category-${category}`}
                          className="text-sm font-medium text-gray-700 cursor-pointer"
                        >
                          {category}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="description">Event Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your event"
                    rows={4}
                  />
                  {showValidationErrors && (!formData.description || formData.description.trim() === "") && (
                    <p className="text-sm text-red-500 mt-1">This field is required for publishing</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Event Timing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate ? getDatePart(formData.startDate) : ""}
                    onChange={(e) => {
                      const dateValue = e.target.value
                      const timeValue = getTimePart(formData.startDate)
                      const newStartDate = dateValue ? `${dateValue}T${timeValue}:00.000Z` : ""
                      setFormData((prevData) => ({ ...prevData, startDate: newStartDate }))
                    }}
                  />
                  {showValidationErrors && (!formData.startDate || formData.startDate.trim() === "") && (
                    <p className="text-sm text-red-500 mt-1">This field is required for publishing</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="dailyStart">Daily Start Time *</Label>
                  <Input
                    id="dailyStart"
                    type="time"
                    value={formData.dailyStart}
                    onChange={(e) => {
                      const timeValue = e.target.value
                      setFormData((prevData) => ({
                        ...prevData,
                        dailyStart: timeValue
                      }))

                      // Update the startDate with UTC time
                      const dateValue = getDatePart(formData.startDate) || new Date().toISOString().split('T')[0]
                      const utcTime = convertLocalToUTC(timeValue, dateValue, formData.timezone)
                      if (utcTime) {
                        setFormData(prevData => ({
                          ...prevData,
                          startDate: utcTime
                        }))
                      }
                    }}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Time when the event starts each day - Display: {formatTimeTo12Hour(formData.dailyStart)}
                  </p>
                </div>

                <div>
                  <Label htmlFor="endDate">End Date *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate ? getDatePart(formData.endDate) : ""}
                    onChange={(e) => {
                      const dateValue = e.target.value
                      const timeValue = getTimePart(formData.endDate)
                      const newEndDate = dateValue ? `${dateValue}T${timeValue}:00.000Z` : ""
                      setFormData((prevData) => ({ ...prevData, endDate: newEndDate }))
                    }}
                  />
                  {showValidationErrors && (!formData.endDate || formData.endDate.trim() === "") && (
                    <p className="text-sm text-red-500 mt-1">This field is required for publishing</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="dailyEnd">Daily End Time *</Label>
                  <Input
                    id="dailyEnd"
                    type="time"
                    value={formData.dailyEnd}
                    onChange={(e) => {
                      const timeValue = e.target.value
                      setFormData((prevData) => ({
                        ...prevData,
                        dailyEnd: timeValue
                      }))

                      // Update the endDate with UTC time
                      const dateValue = getDatePart(formData.endDate) || new Date().toISOString().split('T')[0]
                      const utcTime = convertLocalToUTC(timeValue, dateValue, formData.timezone)
                      if (utcTime) {
                        setFormData(prevData => ({
                          ...prevData,
                          endDate: utcTime
                        }))
                      }
                    }}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Time when the event ends each day - Display: {formatTimeTo12Hour(formData.dailyEnd)}
                  </p>
                </div>

                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={formData.timezone}
                    onValueChange={(value) => setFormData((prevData) => ({ ...prevData, timezone: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST) UTC+5:30</SelectItem>
                      <SelectItem value="America/New_York">America/New_York (EST) UTC-5</SelectItem>
                      <SelectItem value="Europe/London">Europe/London (GMT) UTC+0</SelectItem>
                      <SelectItem value="Asia/Tokyo">Asia/Tokyo (JST) UTC+9</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Times will be converted to this timezone
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div>
            <AddVenue
              organizerId={organizerId}
              onVenueChange={handleVenueChange}
              selectedVenueId={selectedVenueId}
            />
          </div>
        </TabsContent>

        {/* Event Details Tab */}
        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Event Highlights</CardTitle>
              <p className="text-sm text-muted-foreground">
                Only Event Tags & Keywords are required for publishing in this section.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newHighlight}
                  onChange={(e) => setNewHighlight(e.target.value)}
                  placeholder="Add event highlight"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addHighlight();
                    }
                  }}
                />
                <Button onClick={addHighlight}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.highlights.map((highlight, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="flex items-center gap-1 px-3 py-1.5"
                  >
                    <span>{highlight}</span>
                    <button
                      type="button"
                      onClick={() => removeHighlight(index)}
                      className="ml-1 hover:bg-gray-300 rounded-full p-0.5 transition-colors"
                      aria-label={`Remove ${highlight}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Event Tags & Keywords *</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Event Tags & Keywords *</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.tags.map((tag, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="flex items-center gap-2 px-3 py-1.5"
                      >
                        <span>{tag}</span>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            removeTag(index)
                          }}
                          className="hover:bg-gray-300 rounded-full p-0.5 transition-colors"
                          aria-label={`Remove ${tag}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add tags (press Enter)"
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          addTag()
                        }
                      }}
                    />
                    <Button type="button" onClick={addTag} variant="outline">
                      Add
                    </Button>
                  </div>
                  {showValidationErrors && formData.tags.length === 0 && (
                    <p className="text-sm text-red-500 mt-1">This field is required for publishing</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Event Guidelines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dressCode">Dress Code</Label>
                  <Select
                    value={formData.dressCode}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, dressCode: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Casual">Casual</SelectItem>
                      <SelectItem value="Business Casual">Business Casual</SelectItem>
                      <SelectItem value="Formal">Formal</SelectItem>
                      {/* <SelectItem value="Black Tie">Black Tie</SelectItem> */}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="ageLimit">Age Limit</Label>
                  <Select
                    value={formData.ageLimit}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, ageLimit: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All Ages">All Ages</SelectItem>
                      <SelectItem value="18+">18+</SelectItem>
                      <SelectItem value="21+">21+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
          {/* 
          <Card>
            <CardHeader>
              <CardTitle>Event Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Featured Event</Label>
                  <p className="text-sm text-gray-600">Mark this event as featured</p>
                </div>
                <Switch
                  checked={formData.featured}
                  onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, featured: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>VIP Event</Label>
                  <p className="text-sm text-gray-600">Mark this as a VIP event</p>
                </div>
                <Switch
                  checked={formData.vip}
                  onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, vip: checked }))}
                />
              </div>
            </CardContent>
          </Card> */}
        </TabsContent>

        {/* Pricing & Space Tab */}
        <TabsContent value="pricing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IndianRupee className="w-5 h-5" />
                Ticket Pricing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>Currency</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, currency: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((currency) => (
                        <SelectItem key={currency} value={currency}>
                          {currency}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="generalPrice">General Entry</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={formData.generalPrice === 0 ? "" : formData.generalPrice}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        generalPrice: e.target.value === "" ? 0 : Number(e.target.value),
                      }))
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="studentPrice">Student Price</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={formData.studentPrice === 0 ? "" : formData.studentPrice}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        studentPrice: e.target.value === "" ? 0 : Number(e.target.value),
                      }))
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="vipPrice">VIP Price</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={formData.vipPrice === 0 ? "" : formData.vipPrice}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        vipPrice: e.target.value === "" ? 0 : Number(e.target.value),
                      }))
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Exhibitor Space Costs</CardTitle>
              <p className="text-sm text-gray-600">
                Configure pricing for different types of exhibition spaces and services
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6">
                {formData.spaceCosts.map((cost, index) => (
                  <div key={index} className="p-6 border rounded-lg bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <h4 className="font-semibold text-lg">{cost.type}</h4>
                        {cost.isFixed && (
                          <Badge variant="secondary" className="text-xs">
                            Standard
                          </Badge>
                        )}
                      </div>
                      {!cost.isFixed && (
                        <Button variant="outline" size="sm" onClick={() => removeSpaceCost(index)}>
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Description</Label>
                        <p className="text-sm text-gray-600 mt-1 p-3 bg-white rounded border">{cost.description}</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {cost.isFixed && cost.type !== "Shell Space (Standard Booth)" ? (
                          <>
                            <div>
                              <Label className="text-sm font-medium">Space Type</Label>
                              <Input
                                value={cost.type}
                                onChange={(e) => updateSpaceCost(index, "type", e.target.value)}
                                placeholder="Enter space type"
                                disabled={cost.isFixed}
                                className="bg-gray-100"
                              />
                            </div>
                            <div>
                              <Label className="text-sm font-medium">
                                {cost.unit ? `Price per ${cost.unit}` : "Price per sq.m"}
                              </Label>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500">{formData.currency}</span>
                                <Input
                                  type="number"
                                  value={cost.pricePerSqm || cost.pricePerUnit || 0}
                                  onChange={(e) =>
                                    updateSpaceCost(
                                      index,
                                      cost.unit ? "pricePerUnit" : "pricePerSqm",
                                      Number(e.target.value),
                                    )
                                  }
                                  placeholder="0"
                                />
                              </div>
                            </div>
                            {!cost.unit && (
                              <div>
                                <Label className="text-sm font-medium">Minimum Area (sq.m)</Label>
                                <Input
                                  type="number"
                                  value={cost.minArea || 0}
                                  onChange={(e) => updateSpaceCost(index, "minArea", Number(e.target.value))}
                                  placeholder="0"
                                />
                              </div>
                            )}
                          </>
                        ) : cost.isFixed ? (
                          <>
                            <div>
                              <Label className="text-sm font-medium">Price per sq.m</Label>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500">{formData.currency}</span>
                                <Input
                                  type="number"
                                  value={cost.pricePerSqm || 0}
                                  onChange={(e) => updateSpaceCost(index, "pricePerSqm", Number(e.target.value))}
                                  placeholder="0"
                                />
                              </div>
                            </div>
                            <div>
                              <Label className="text-sm font-medium">Minimum Area (sq.m)</Label>
                              <Input
                                type="number"
                                value={cost.minArea || 0}
                                onChange={(e) => updateSpaceCost(index, "minArea", Number(e.target.value))}
                                placeholder="0"
                              />
                            </div>
                            <div className="flex items-end">
                              <div className="text-sm">
                                <span className="text-gray-600">Total from: </span>
                                <span className="font-semibold text-lg">
                                  {formData.currency}
                                  {((cost.pricePerSqm || 0) * (cost.minArea || 0)).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div>
                              <Label className="text-sm font-medium">Space Type</Label>
                              <Input
                                value={cost.type}
                                onChange={(e) => updateSpaceCost(index, "type", e.target.value)}
                                placeholder="Enter space type"
                              />
                            </div>
                            <div>
                              <Label className="text-sm font-medium">Price per sq.m</Label>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500">{formData.currency}</span>
                                <Input
                                  type="number"
                                  value={cost.pricePerSqm === 0 ? "" : cost.pricePerSqm}
                                  onChange={(e) => updateSpaceCost(index, "pricePerSqm", Number(e.target.value) || 0)}
                                  placeholder="0"
                                />
                              </div>
                            </div>
                            <div>
                              <Label className="text-sm font-medium">Minimum Area (sq.m)</Label>
                              <Input
                                type="number"
                                value={cost.minArea === 0 ? "" : cost.minArea}
                                onChange={(e) => updateSpaceCost(index, "minArea", Number(e.target.value) || 0)}
                                placeholder="0"
                              />
                            </div>
                            <div className="md:col-span-3">
                              <Label className="text-sm font-medium">Description</Label>
                              <Textarea
                                value={cost.description}
                                onChange={(e) => updateSpaceCost(index, "description", e.target.value)}
                                placeholder="Describe this space type"
                                rows={2}
                              />
                            </div>
                          </>
                        )}
                      </div>

                      {cost.unit && (
                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded border border-blue-200">
                          <span className="text-sm text-blue-800">Service pricing per {cost.unit}</span>
                          <span className="font-semibold text-blue-900">
                            {formData.currency}
                            {(cost.pricePerUnit || 0).toLocaleString()} per {cost.unit}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t">
                <Button variant="outline" onClick={addCustomSpaceCost} className="w-full bg-transparent">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Custom Space Type
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Media & Content Tab */}
        <TabsContent value="media" className="space-y-6">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            multiple
            className="hidden"
            disabled={isUploadingImages}
          />
          <input
            type="file"
            ref={brochureInputRef}
            onChange={handleBrochureUpload}
            accept=".pdf,.doc,.docx"
            className="hidden"
            disabled={isUploadingBrochure}
          />
          <input
            type="file"
            ref={layoutPlanInputRef}
            onChange={handleLayoutPlanUpload}
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
            disabled={isUploadingLayoutPlan}
          />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Event Images
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className={`border-2 border-dashed border-gray-300 rounded-lg p-8 text-center ${isUploadingImages ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-gray-400"
                  } transition-colors`}
                onClick={() => !isUploadingImages && fileInputRef.current?.click()}
              >
                {isUploadingImages ? (
                  <>
                    <Loader2 className="w-12 h-12 mx-auto text-gray-400 mb-4 animate-spin" />
                    <p className="text-gray-600 mb-2">Uploading images...</p>
                  </>
                ) : (
                  <>
                    <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 mb-2">Drag and drop images here, or click to browse</p>
                    <Button
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation()
                        fileInputRef.current?.click()
                      }}
                    >
                      Choose Images
                    </Button>
                  </>
                )}
              </div>

              {formData.images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {formData.images.map((image, index) => (
                    <div key={index} className="relative">
                      <Image
                        src={image || "/placeholder.svg"}
                        alt={`Event image ${index + 1}`}
                        width={200}
                        height={150}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            images: prev.images.filter((_, i) => i !== index),
                          }))
                        }
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Event Brochure</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={formData.brochure ? formData.brochure.split("/").pop() || "Uploaded" : ""}
                    placeholder={isUploadingBrochure ? "Uploading..." : "No file selected"}
                    readOnly
                  />
                  <Button
                    variant="outline"
                    onClick={() => brochureInputRef.current?.click()}
                    disabled={isUploadingBrochure}
                  >
                    {isUploadingBrochure ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                {formData.brochure && <p className="text-xs text-green-600 mt-1">✓ Brochure uploaded successfully</p>}
              </div>

              <div>
                <Label>Layout Plan</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={formData.layoutPlan ? formData.layoutPlan.split("/").pop() || "Uploaded" : ""}
                    placeholder={isUploadingLayoutPlan ? "Uploading..." : "No file selected"}
                    readOnly
                  />
                  <Button
                    variant="outline"
                    onClick={() => layoutPlanInputRef.current?.click()}
                    disabled={isUploadingLayoutPlan}
                  >
                    {isUploadingLayoutPlan ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                {formData.layoutPlan && (
                  <p className="text-xs text-green-600 mt-1">✓ Layout plan uploaded successfully</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Event Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-2xl font-bold text-blue-900">{formData.title || "Event Title"}</h3>
                    <div className="flex flex-col gap-2 mt-2 text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {formData.startDate ? getDatePart(formData.startDate) : "Start Date"} - {formData.endDate ? getDatePart(formData.endDate) : "End Date"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>
                          Daily: {formatTimeTo12Hour(formData.dailyStart)} - {formatTimeTo12Hour(formData.dailyEnd)} ({formData.timezone})
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>
                          {formData.venue || "Venue"}, {formData.city || "City"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {formData.categories.map((category) => (
                      <Badge key={category} variant="secondary">
                        {category}
                      </Badge>
                    ))}
                  </div>

                  <p className="text-gray-700">{formData.description || "Event description will appear here..."}</p>

                  {formData.highlights.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Event Highlights:</h4>
                      <div className="space-y-1">
                        {formData.highlights.map((highlight, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-600 rounded-full" />
                            <span className="text-gray-700">{highlight}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <div className="bg-white p-4 rounded-lg border">
                      <h4 className="font-semibold mb-2">General Entry</h4>
                      <p className="text-2xl font-bold text-blue-600">
                        {formData.currency}
                        {formData.generalPrice || 0}
                      </p>
                    </div>

                    {formData.studentPrice > 0 && (
                      <div className="bg-white p-4 rounded-lg border">
                        <h4 className="font-semibold mb-2">Student Price</h4>
                        <p className="text-2xl font-bold text-green-600">
                          {formData.currency}
                          {formData.studentPrice}
                        </p>
                      </div>
                    )}

                    {formData.vipPrice > 0 && (
                      <div className="bg-white p-4 rounded-lg border">
                        <h4 className="font-semibold mb-2">VIP Price</h4>
                        <p className="text-2xl font-bold text-purple-600">
                          {formData.currency}
                          {formData.vipPrice}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Space Costs Preview */}
                  <div className="mt-6">
                    <h4 className="font-semibold mb-4">Exhibition Space Pricing</h4>
                    <div className="grid gap-3">
                      {formData.spaceCosts.map((cost, index) => (
                        <div key={index} className="bg-white p-4 rounded-lg border flex justify-between items-center">
                          <div>
                            <h5 className="font-medium">{cost.type}</h5>
                            <p className="text-sm text-gray-600">{cost.description}</p>
                          </div>
                          <div className="text-right">
                            {cost.unit ? (
                              <p className="font-semibold text-blue-600">
                                {formData.currency}
                                {(cost.pricePerUnit || 0).toLocaleString()} per {cost.unit}
                              </p>
                            ) : (
                              <>
                                <p className="font-semibold text-blue-600">
                                  {formData.currency}
                                  {(cost.pricePerSqm || 0).toLocaleString()} per sq.m
                                </p>
                                <p className="text-sm text-gray-500">Min: {cost.minArea || 0} sq.m</p>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-6 border-t">
        <Button
          variant="outline"
          onClick={handlePreviousTab}
          disabled={activeTab === "basic"}
          className="flex items-center gap-2 bg-transparent"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>

        <div className="flex gap-3">
          {activeTab === "preview" ? (
            <Button onClick={handlePublishEvent} disabled={isPublishing || completionPercentage < 80}>
              <Send className="w-4 h-4 mr-2" />
              {isPublishing ? "Publishing..." : "Publish Event"}
            </Button>
          ) : (
            <Button onClick={handleNextTab} className="flex items-center gap-2">
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Modals remain the same */}
      {showHotelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          {/* Hotel modal content */}
        </div>
      )}

      {showPartnerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          {/* Partner modal content */}
        </div>
      )}

      {showAttractionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          {/* Attraction modal content */}
        </div>
      )}
    </div>
  )
}