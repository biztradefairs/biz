import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth-options"
import { v2 as cloudinary } from 'cloudinary'
import { writeFile } from "fs/promises"
import path from "path"
import fs from "fs"

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
      
      // ✅ CRITICAL FIX: Include ALL verification fields
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

// Ensure badges directory exists
const badgesDir = path.join(process.cwd(), 'public', 'badges')
if (!fs.existsSync(badgesDir)) {
  fs.mkdirSync(badgesDir, { recursive: true })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user?.role !== "ADMIN" && session.user?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const formData = await request.formData()
    const isVerified = formData.get("isVerified") === "true"
    const badgeFile = formData.get("badgeFile") as File | null

    let badgeImagePath = null

    // Handle badge file upload if provided
    if (badgeFile && badgeFile.size > 0) {
      const bytes = await badgeFile.arrayBuffer()
      const buffer = Buffer.from(bytes)
      
      // Generate unique filename
      const timestamp = Date.now()
      const originalName = badgeFile.name.replace(/\s+/g, '-')
      const fileName = `badge-${timestamp}-${originalName}`
      
      // Save to public/badges directory
      const filePath = path.join(badgesDir, fileName)
      
      await writeFile(filePath, buffer)
      badgeImagePath = `/badges/${fileName}`
    }

    // Get current event to check for existing badge
    const currentEvent = await prisma.event.findUnique({
      where: { id },
      select: { 
        isVerified: true,
        verifiedBadgeImage: true,
        verifiedAt: true,
        verifiedBy: true
      }
    })

    // Delete old badge if it exists and is not the default
    if (currentEvent?.verifiedBadgeImage && 
        currentEvent.verifiedBadgeImage !== "/badge/VerifiedBADGE (1).png" &&
        !isVerified) {
      const oldPath = path.join(process.cwd(), 'public', currentEvent.verifiedBadgeImage)
      if (fs.existsSync(oldPath)) {
        try {
          fs.unlinkSync(oldPath)
        } catch (error) {
          console.warn("Failed to delete old badge file:", error)
        }
      }
    }

    // Prepare update data
    const updateData: any = {
      isVerified,
    }

    if (isVerified) {
      updateData.verifiedAt = new Date()
      updateData.verifiedBy = session.user.email || "Admin"
      updateData.verifiedBadgeImage = badgeImagePath || "/badge/VerifiedBADGE (1).png"
    } else {
      updateData.verifiedAt = null
      updateData.verifiedBy = null
      updateData.verifiedBadgeImage = null
    }

    // Update the event verification status
    const event = await prisma.event.update({
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

    // Format the response
    const formattedEvent = {
      id: event.id,
      title: event.title,
      isVerified: event.isVerified,
      verifiedAt: event.verifiedAt?.toISOString() || null,
      verifiedBy: event.verifiedBy || null,
      verifiedBadgeImage: event.verifiedBadgeImage || null,
    }

    return NextResponse.json({
      success: true,
      message: isVerified ? "Event verified successfully" : "Verification removed",
      event: formattedEvent,
    })
  } catch (error) {
    console.error("Error toggling verification:", error)
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to update verification",
      },
      { status: 500 }
    )
  }
}