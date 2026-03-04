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
async function uploadToCloudinary(file: File, folder: string = 'event-badges') {
  try {
    // Convert File to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    // Convert buffer to base64
    const base64String = buffer.toString('base64')
    const dataURI = `data:${file.type};base64,${base64String}`
    
    const result = await Promise.race([
      cloudinary.uploader.upload(dataURI, {
        folder: folder,
        resource_type: 'auto',
        timeout: 30000 // 30 second timeout
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Upload timeout')), 30000)
      )
    ]) as any;
    
    return result
  } catch (error) {
    console.error('Cloudinary upload error:', error)
    throw new Error('Failed to upload file to Cloudinary')
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
      currency: event.currency || "USD", // Ensure valid currency
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
      
      // ✅ Include ALL verification fields
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

// ✅ PATCH Handler - Update event status
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    if (session.user?.role !== "ADMIN" && session.user?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { status } = body

    if (!status) {
      return NextResponse.json(
        { error: "Valid status is required" },
        { status: 400 }
      )
    }

    // Check if event exists
    const existingEvent = await prisma.event.findUnique({
      where: { id }
    })

    if (!existingEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: { status },
      include: {
        organizer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({
      message: "Event status updated successfully",
      event: updatedEvent
    })
  } catch (error) {
    console.error("Error updating event status:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// ✅ POST Handler - Toggle verification (Cloudinary only - no filesystem operations)
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

    // ✅ Await params properly
    const { id } = await params
    
    if (!id) {
      return NextResponse.json({ 
        error: "Event ID is required" 
      }, { status: 400 })
    }

    const formData = await request.formData()
    const isVerified = formData.get("isVerified") === "true"
    const badgeFile = formData.get("badgeFile") as File | null

    let badgeImageUrl = null

    // Handle badge file upload to Cloudinary if provided
    if (badgeFile && badgeFile.size > 0) {
      try {
        console.log("Uploading custom badge to Cloudinary...")
        const uploadResult = await uploadToCloudinary(badgeFile, "event-badges")
        badgeImageUrl = uploadResult.secure_url
        console.log("Badge uploaded to Cloudinary:", badgeImageUrl)
      } catch (uploadError) {
        console.error("Error uploading badge to Cloudinary:", uploadError)
        // Continue with default badge
      }
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

    if (!currentEvent) {
      return NextResponse.json({ 
        error: "Event not found" 
      }, { status: 404 })
    }

    // Delete old badge from Cloudinary if it exists and is not the default
    if (currentEvent?.verifiedBadgeImage && 
        !currentEvent.verifiedBadgeImage.includes('/badge/') && // Check if it's a custom badge (not default)
        !isVerified) {
      try {
        // Extract public_id from Cloudinary URL
        const url = currentEvent.verifiedBadgeImage
        if (url.includes('cloudinary.com')) {
          const parts = url.split('/')
          const publicIdWithExtension = parts[parts.length - 1]
          const publicId = publicIdWithExtension.split('.')[0]
          
          // Get folder from URL if available
          const folderIndex = parts.indexOf('event-badges')
          let fullPublicId = publicId
          if (folderIndex !== -1 && folderIndex + 1 < parts.length) {
            fullPublicId = `event-badges/${publicId}`
          }
          
          console.log("Deleting old badge from Cloudinary:", fullPublicId)
          await cloudinary.uploader.destroy(fullPublicId)
        }
      } catch (deleteError) {
        console.warn("Failed to delete old badge from Cloudinary:", deleteError)
        // Continue even if delete fails
      }
    }

    // Prepare update data
    const updateData: any = {
      isVerified,
    }

    if (isVerified) {
      updateData.verifiedAt = new Date()
      updateData.verifiedBy = session.user.email || "Admin"
      // Use the uploaded Cloudinary URL or default badge
      updateData.verifiedBadgeImage = badgeImageUrl || "/badge/VerifiedBADGE (1).png"
    } else {
      updateData.verifiedAt = null
      updateData.verifiedBy = null
      updateData.verifiedBadgeImage = null
    }

    // Update the event verification status
    const event = await prisma.event.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        title: true,
        isVerified: true,
        verifiedAt: true,
        verifiedBy: true,
        verifiedBadgeImage: true,
        status: true,
        isFeatured: true,
        isVIP: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: isVerified ? "Event verified successfully" : "Verification removed",
      event,
    })
  } catch (error: any) {
    console.error("Error toggling verification:", error)
    
    // Provide more specific error messages
    if (error.code === 'P2025') {
      return NextResponse.json(
        { 
          success: false,
          error: "Event not found",
        },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to update verification",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}