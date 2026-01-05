import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth-options"
import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Helper function to upload files to Cloudinary with timeout
async function uploadToCloudinary(file: string, folder: string = 'events') {
  try {
    const result = await Promise.race([
      cloudinary.uploader.upload(file, {
        folder: folder,
        resource_type: 'auto',
        timeout: 30000 // 30 second timeout
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Upload timeout')), 30000)
      )
    ]) as any;
    
    return result.secure_url
  } catch (error) {
    console.error('Cloudinary upload error:', error)
    throw new Error('Failed to upload file to Cloudinary')
  }
}

// Helper function to parse category input
function parseCategory(category: any): string[] {
  if (Array.isArray(category)) {
    return category.filter(Boolean)
  }
  if (typeof category === 'string') {
    return category.split(',').map((cat: string) => cat.trim()).filter(Boolean)
  }
  return []
}

// Helper function to parse tags
function parseTags(tags: any): string[] {
  if (Array.isArray(tags)) {
    return tags.filter(Boolean)
  }
  if (typeof tags === 'string') {
    return tags.split(',').map((tag: string) => tag.trim()).filter(Boolean)
  }
  return []
}

// Helper function to check if string is base64
function isBase64(str: string): boolean {
  if (typeof str !== 'string') return false
  if (str.startsWith('http')) return false
  if (str.startsWith('data:')) return true
  try {
    return btoa(atob(str)) === str
  } catch (err) {
    return false
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user?.role !== "SUPER_ADMIN" && session.user?.role !== "SUB_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const events = await prisma.event.findMany({
      include: {
        organizer: {
          select: {
            firstName: true,
            lastName: true,
            organizationName: true,
          },
        },
        venue: {
          select: {
            venueName: true,
            venueCity: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform events to match frontend interface
    const formattedEvents = events.map(event => ({
      id: event.id,
      title: event.title,
      organizer: 
        event.organizer?.organizationName ||
        `${event.organizer?.firstName || ""} ${event.organizer?.lastName || ""}`.trim() ||
        "Unknown Organizer",
      organizerId: event.organizerId,
      date: event.startDate.toISOString().split('T')[0],
      endDate: event.endDate.toISOString().split('T')[0],
      location: event.venue?.venueCity || "Virtual",
      venue: event.venue?.venueName || "N/A",
      status: event.status === "PUBLISHED" ? "Approved" :
              event.status === "PENDING_APPROVAL" ? "Pending Review" :
              event.status === "DRAFT" ? "Draft" :
              event.status === "CANCELLED" ? "Flagged" : "Completed",
      attendees: event.currentAttendees || 0,
      maxCapacity: event.maxAttendees || 0,
      revenue: 0,
      ticketPrice: 0,
      category: event.category?.[0] || "Other",
      featured: event.isFeatured || false,
      vip: event.isVIP || false,
      priority: "Medium",
      description: event.description,
      shortDescription: event.shortDescription,
      slug: event.slug,
      edition: event.edition,
      tags: event.tags || [],
      eventType: event.eventType?.[0] || "",
      timezone: event.timezone,
      currency: event.currency,
      createdAt: event.createdAt.toISOString(),
      lastModified: event.updatedAt.toISOString(),
      views: 0,
      registrations: 0,
      rating: 0,
      reviews: 0,
      image: event.bannerImage || "/placeholder.svg",
      bannerImage: event.bannerImage,
      thumbnailImage: event.thumbnailImage,
      images: event.images || [],
      videos: event.videos || [],
      brochure: event.brochure,
      layout: event.layoutPlan,
      documents: event.documents || [],
      promotionBudget: 0,
      socialShares: Math.floor(Math.random() * 1000),
      
      // ✅ CRITICAL FIX: Include verification fields
      isVerified: event.isVerified || false,
      verifiedAt: event.verifiedAt?.toISOString() || null,
      verifiedBy: event.verifiedBy || null,
      verifiedBadgeImage: event.verifiedBadgeImage || null,
    }))

    return NextResponse.json({
      success: true,
      events: formattedEvents
    })
  } catch (error) {
    console.error("Error fetching events:", error)
    return NextResponse.json({ 
      success: false,
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}


export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (
      session.user?.role !== "ADMIN" &&
      session.user?.role !== "SUPER_ADMIN"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const data = await request.json()

    const updateData: any = {}

    // -----------------------------
    // BASIC FIELDS
    // -----------------------------
    if (data.title !== undefined) updateData.title = data.title
    if (data.description !== undefined) updateData.description = data.description
    if (data.shortDescription !== undefined)
      updateData.shortDescription = data.shortDescription
    if (data.slug !== undefined) updateData.slug = data.slug
    if (data.edition !== undefined)
      updateData.edition = data.edition.toString()

    // -----------------------------
    // DATE FIELDS
    // -----------------------------
    if (data.date !== undefined)
      updateData.startDate = new Date(data.date)
    if (data.endDate !== undefined)
      updateData.endDate = new Date(data.endDate)

    // -----------------------------
    // CAPACITY
    // -----------------------------
    if (data.maxCapacity !== undefined)
      updateData.maxAttendees = data.maxCapacity
    if (data.attendees !== undefined)
      updateData.currentAttendees = data.attendees

    // -----------------------------
    // FLAGS
    // -----------------------------
    if (data.featured !== undefined)
      updateData.isFeatured = data.featured
    if (data.vip !== undefined)
      updateData.isVIP = data.vip

    // -----------------------------
    // STATUS
    // -----------------------------
    if (data.status !== undefined) {
      const statusMap: Record<string, string> = {
        Approved: "PUBLISHED",
        "Pending Review": "PENDING_APPROVAL",
        Flagged: "CANCELLED",
        Rejected: "CANCELLED",
        Draft: "DRAFT",
      }

      updateData.status = statusMap[data.status] || "DRAFT"
    }

    // -----------------------------
    // UPDATE EVENT
    // -----------------------------
    const updatedEvent = await prisma.event.update({
      where: { id },
      data: updateData,
      include: {
        organizer: {
          select: {
            firstName: true,
            lastName: true,
            organizationName: true,
          },
        },
        venue: {
          select: {
            venueName: true,
            venueCity: true,
          },
        },
      },
    })

    // -----------------------------
    // ✅ IMPORTANT FIX IS HERE
    // verifiedBadgeImage MUST be returned
    // -----------------------------
    const formattedEvent = {
      id: updatedEvent.id,
      title: updatedEvent.title,

      organizer:
        updatedEvent.organizer?.organizationName ||
        `${updatedEvent.organizer?.firstName ?? ""} ${updatedEvent.organizer?.lastName ?? ""}`.trim(),

      date: updatedEvent.startDate.toISOString().split("T")[0],
      endDate: updatedEvent.endDate.toISOString().split("T")[0],
      location: updatedEvent.venue?.venueCity || "Virtual",
      venue: updatedEvent.venue?.venueName || "N/A",

      status:
        updatedEvent.status === "PUBLISHED"
          ? "Approved"
          : updatedEvent.status === "PENDING_APPROVAL"
          ? "Pending Review"
          : updatedEvent.status === "CANCELLED"
          ? "Flagged"
          : "Draft",

      attendees: updatedEvent.currentAttendees || 0,
      maxCapacity: updatedEvent.maxAttendees || 0,

      featured: updatedEvent.isFeatured || false,
      vip: updatedEvent.isVIP || false,

      // ✅ THIS LINE FIXES YOUR ISSUE
      verifiedBadgeImage: updatedEvent.verifiedBadgeImage || null,

      bannerImage: updatedEvent.bannerImage,
      thumbnailImage: updatedEvent.thumbnailImage,
      images: updatedEvent.images || [],
      videos: updatedEvent.videos || [],
      brochure: updatedEvent.brochure,
      layout: updatedEvent.layoutPlan,
      documents: updatedEvent.documents || [],

      slug: updatedEvent.slug,
      edition: updatedEvent.edition,
      tags: updatedEvent.tags || [],
      eventType: updatedEvent.eventType?.[0] || "",
      timezone: updatedEvent.timezone,
      currency: updatedEvent.currency,

      organizerId: updatedEvent.organizerId,
    }

    return NextResponse.json({
      success: true,
      event: formattedEvent,
    })
  } catch (error) {
    console.error("PATCH EVENT ERROR:", error)
    return NextResponse.json(
      { error: "Failed to update event" },
      { status: 500 }
    )
  }
}
