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
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user?.role !== "SUPER_ADMIN" && session.user?.role !== "SUB_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        organizer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            company: true,
            phone: true,
          }
        },
        venue: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            venueName: true,
            venueAddress: true,
            venueCity: true,
            venueState: true,
            venueCountry: true,
          }
        },
        ticketTypes: {
          select: {
            id: true,
            name: true,
            price: true,
            quantity: true,
            sold: true,
          }
        },
        exhibitionSpaces: {
          select: {
            id: true,
            name: true,
            spaceType: true,
            basePrice: true,
            area: true,
            minArea: true,
          }
        },
        rejectedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!event) {
      return NextResponse.json({ 
        success: false,
        error: "Event not found" 
      }, { status: 404 })
    }

    // Transform event data
    const transformedEvent = {
      id: event.id,
      title: event.title,
      description: event.description,
      shortDescription: event.shortDescription,
      slug: event.slug,
      startDate: event.startDate.toISOString(),
      endDate: event.endDate.toISOString(),
      registrationStart: event.registrationStart.toISOString(),
      registrationEnd: event.registrationEnd.toISOString(),
      timezone: event.timezone,
      venue: event.venue?.venueName || 
             (event.venue?.firstName ? `${event.venue.firstName} ${event.venue.lastName || ""}`.trim() : "Virtual Event"),
      address: event.venue?.venueAddress || "",
      city: event.venue?.venueCity || "",
      state: event.venue?.venueState || "",
      country: event.venue?.venueCountry || "",
      status: event.status,
      category: event.category || [],
      tags: event.tags || [],
      edition: event.edition,
      eventType: event.eventType || [],
      isVirtual: event.isVirtual,
      virtualLink: event.virtualLink,
      maxAttendees: event.maxAttendees,
      currentAttendees: event.currentAttendees,
      currency: event.currency,
      images: event.images || [],
      bannerImage: event.bannerImage,
      thumbnailImage: event.thumbnailImage,
      brochure: event.brochure,
      layoutPlan: event.layoutPlan,
      documents: event.documents || [],
      isFeatured: event.isFeatured,
      isVIP: event.isVIP,
      isPublic: event.isPublic,
      requiresApproval: event.requiresApproval,
      allowWaitlist: event.allowWaitlist,
      refundPolicy: event.refundPolicy,
      metaTitle: event.metaTitle,
      metaDescription: event.metaDescription,
      averageRating: event.averageRating,
      totalReviews: event.totalReviews,
      
      // Organizer info
      organizer: {
        id: event.organizer.id,
        name: `${event.organizer.firstName} ${event.organizer.lastName}`.trim(),
        email: event.organizer.email,
        company: event.organizer.company || "",
        phone: event.organizer.phone || "",
      },
      
      // Ticket types
      ticketTypes: event.ticketTypes.map(ticket => ({
        id: ticket.id,
        name: ticket.name,
        price: ticket.price,
        quantity: ticket.quantity,
        sold: ticket.sold,
      })),
      
      // Exhibition spaces
      exhibitionSpaces: event.exhibitionSpaces.map(space => ({
        id: space.id,
        name: space.name,
        spaceType: space.spaceType,
        basePrice: space.basePrice,
        area: space.area,
        minArea: space.minArea,
      })),
      
      // Rejection info (if rejected)
      rejectionReason: event.rejectionReason,
      rejectedAt: event.rejectedAt?.toISOString(),
      rejectedBy: event.rejectedBy ? {
        id: event.rejectedBy.id,
        name: event.rejectedBy.name || "Unknown Admin",
        email: event.rejectedBy.email
      } : null,
      
      // Timestamps
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
    }

    return NextResponse.json({
      success: true,
      event: transformedEvent
    })

  } catch (error: any) {
    console.error("Error fetching event:", error)
    return NextResponse.json({ 
      success: false,
      error: "Internal server error",
      details: error.message 
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

    // Check if user is admin
    if (session.user?.role !== "ADMIN" && session.user?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const data = await request.json()
    
    console.log("Updating event:", id, data)

    // Map frontend fields to Prisma schema
    const updateData: any = {}
    
    // Basic text fields
    if (data.title !== undefined) updateData.title = data.title
    if (data.description !== undefined) updateData.description = data.description
    if (data.shortDescription !== undefined) updateData.shortDescription = data.shortDescription
    if (data.slug !== undefined) updateData.slug = data.slug
    if (data.edition !== undefined) updateData.edition = data.edition.toString()
    
    // Date fields
    if (data.date !== undefined) updateData.startDate = new Date(data.date)
    if (data.endDate !== undefined) updateData.endDate = new Date(data.endDate)
    
    // Capacity fields
    if (data.maxCapacity !== undefined) updateData.maxAttendees = data.maxCapacity
    if (data.attendees !== undefined) updateData.currentAttendees = data.attendees
    
    // Boolean fields
    if (data.featured !== undefined) updateData.isFeatured = data.featured
    if (data.vip !== undefined) updateData.isVIP = data.vip
    
    // Categorical fields
    if (data.category !== undefined) updateData.category = parseCategory(data.category)
    if (data.tags !== undefined) updateData.tags = parseTags(data.tags)
    if (data.eventType !== undefined) updateData.eventType = [data.eventType]
    
    // Location and venue fields
    if (data.timezone !== undefined) updateData.timezone = data.timezone
    if (data.currency !== undefined) updateData.currency = data.currency
    
    // Handle status mapping
    if (data.status !== undefined) {
      updateData.status = data.status === "Approved" ? "PUBLISHED" 
        : data.status === "Pending Review" ? "DRAFT"
        : data.status === "Flagged" ? "CANCELLED" 
        : data.status === "Rejected" ? "CANCELLED" 
        : data.status === "Draft" ? "DRAFT"
        : "DRAFT"
    }

    // Handle file uploads to Cloudinary - only upload new base64 files
    const fileUploads: Promise<void>[] = []
    
    // Upload banner image if provided (base64 only)
    if (data.bannerImage && isBase64(data.bannerImage)) {
      fileUploads.push(
        uploadToCloudinary(data.bannerImage, 'events/banners')
          .then(url => { updateData.bannerImage = url })
          .catch(error => { 
            console.error('Failed to upload banner image:', error)
            // Keep original if upload fails
            updateData.bannerImage = data.bannerImage 
          })
      )
    } else if (data.bannerImage !== undefined) {
      updateData.bannerImage = data.bannerImage
    }
    
    // Upload thumbnail image if provided (base64 only)
    if (data.thumbnailImage && isBase64(data.thumbnailImage)) {
      fileUploads.push(
        uploadToCloudinary(data.thumbnailImage, 'events/thumbnails')
          .then(url => { updateData.thumbnailImage = url })
          .catch(error => { 
            console.error('Failed to upload thumbnail image:', error)
            updateData.thumbnailImage = data.thumbnailImage 
          })
      )
    } else if (data.thumbnailImage !== undefined) {
      updateData.thumbnailImage = data.thumbnailImage
    }
    
    // Handle multiple images - only upload new base64 images
    if (data.images && Array.isArray(data.images)) {
      const imageUploads = data.images.map(async (image: string) => {
        if (isBase64(image)) {
          try {
            return await uploadToCloudinary(image, 'events/gallery')
          } catch (error) {
            console.error('Failed to upload image:', error)
            return image // Return original if upload fails
          }
        }
        return image
      })
      
      fileUploads.push(
        Promise.all(imageUploads)
          .then(urls => { updateData.images = urls })
          .catch(error => { 
            console.error('Failed to upload images:', error)
            updateData.images = data.images 
          })
      )
    }
    
    // Handle videos - only upload new base64 videos
    if (data.videos && Array.isArray(data.videos)) {
      const videoUploads = data.videos.map(async (video: string) => {
        if (isBase64(video)) {
          try {
            return await uploadToCloudinary(video, 'events/videos')
          } catch (error) {
            console.error('Failed to upload video:', error)
            return video
          }
        }
        return video
      })
      
      fileUploads.push(
        Promise.all(videoUploads)
          .then(urls => { updateData.videos = urls })
          .catch(error => { 
            console.error('Failed to upload videos:', error)
            updateData.videos = data.videos 
          })
      )
    }
    
    // Handle documents - only upload new base64 documents
    if (data.brochure && isBase64(data.brochure)) {
      fileUploads.push(
        uploadToCloudinary(data.brochure, 'events/documents')
          .then(url => { updateData.brochure = url })
          .catch(error => { 
            console.error('Failed to upload brochure:', error)
            updateData.brochure = data.brochure 
          })
      )
    } else if (data.brochure !== undefined) {
      updateData.brochure = data.brochure
    }
    
    if (data.layout && isBase64(data.layout)) {
      fileUploads.push(
        uploadToCloudinary(data.layout, 'events/documents')
          .then(url => { updateData.layoutPlan = url })
          .catch(error => { 
            console.error('Failed to upload layout:', error)
            updateData.layoutPlan = data.layout 
          })
      )
    } else if (data.layout !== undefined) {
      updateData.layoutPlan = data.layout
    }
    
    // Handle multiple documents - only upload new base64 documents
    if (data.documents && Array.isArray(data.documents)) {
      const documentUploads = data.documents.map(async (doc: string) => {
        if (isBase64(doc)) {
          try {
            return await uploadToCloudinary(doc, 'events/documents')
          } catch (error) {
            console.error('Failed to upload document:', error)
            return doc
          }
        }
        return doc
      })
      
      fileUploads.push(
        Promise.all(documentUploads)
          .then(urls => { updateData.documents = urls })
          .catch(error => { 
            console.error('Failed to upload documents:', error)
            updateData.documents = data.documents 
          })
      )
    }

    // Wait for all file uploads to complete
    if (fileUploads.length > 0) {
      await Promise.all(fileUploads)
    }

    // Handle venue update
    if (data.venue || data.location) {
      console.log("Processing venue update:", { venue: data.venue, location: data.location })
      
      // Try to find existing venue by name (case insensitive)
      const existingVenue = await prisma.user.findFirst({
        where: {
          role: "VENUE_MANAGER",
          OR: [
            { venueName: { equals: data.venue, mode: 'insensitive' } },
            { venueName: { contains: data.venue, mode: 'insensitive' } }
          ]
        }
      })

      if (existingVenue) {
        console.log("Found existing venue:", existingVenue.venueName)
        // Connect to existing venue
        updateData.venue = {
          connect: { id: existingVenue.id }
        }
        
        // Also update venue city if provided
        if (data.location && data.location !== existingVenue.venueCity) {
          await prisma.user.update({
            where: { id: existingVenue.id },
            data: { venueCity: data.location }
          })
        }
      } else {
        console.log("No existing venue found, creating new venue...")
        // Create a new venue user
        const newVenue = await prisma.user.create({
          data: {
            venueName: data.venue || "Unknown Venue",
            venueCity: data.location || "Unknown Location",
            firstName: "Venue",
            lastName: "Manager",
            email: `venue-${Date.now()}@example.com`,
            password: "TEMP_PASSWORD",
            role: "VENUE_MANAGER"
          }
        })
        console.log("Created new venue:", newVenue.venueName)
        
        // Connect to the new venue
        updateData.venue = {
          connect: { id: newVenue.id }
        }
      }
    }

    // Update the event with all the data
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
        promotions: {
          select: { amount: true },
        },
        reviews: true,
        analytics: {
          select: {
            totalRevenue: true,
            totalRegistrations: true,
            pageViews: true,
          },
        },
        ticketTypes: {
          select: {
            price: true,
          },
        },
      },
    })

    console.log("Updated event successfully:", updatedEvent.id)

    // Format the response to match frontend expectations
    const formattedEvent = {
      id: updatedEvent.id,
      title: updatedEvent.title,
      organizer:
        updatedEvent.organizer?.organizationName ||
        `${updatedEvent.organizer?.firstName ?? ""} ${updatedEvent.organizer?.lastName ?? ""}`.trim() ||
        "Unknown Organizer",
      date: updatedEvent.startDate.toISOString().split('T')[0],
      endDate: updatedEvent.endDate.toISOString().split('T')[0],
      location: updatedEvent.venue?.venueCity || data.location || "Virtual",
      venue: updatedEvent.venue?.venueName || data.venue || "N/A",
      status:
        updatedEvent.status === "PUBLISHED"
          ? "Approved"
          : updatedEvent.status === "DRAFT"
          ? "Pending Review"
          : updatedEvent.status === "CANCELLED"
          ? "Flagged"
          : "Completed",
      attendees: updatedEvent.currentAttendees || 0,
      maxCapacity: updatedEvent.maxAttendees || 0,
      revenue: updatedEvent.analytics?.[0]?.totalRevenue || 0,
      ticketPrice: updatedEvent.ticketTypes?.[0]?.price || 0,
      category: updatedEvent.category?.[0] || "Other",
      featured: updatedEvent.isFeatured || false,
      vip: updatedEvent.isVIP || false,
      priority: "Medium",
      description: updatedEvent.description,
      shortDescription: updatedEvent.shortDescription,
      slug: updatedEvent.slug,
      edition: updatedEvent.edition,
      tags: updatedEvent.tags,
      eventType: updatedEvent.eventType?.[0] || "",
      timezone: updatedEvent.timezone,
      currency: updatedEvent.currency,
      createdAt: updatedEvent.createdAt.toISOString(),
      lastModified: updatedEvent.updatedAt.toISOString(),
      views: updatedEvent.analytics?.[0]?.pageViews || 0,
      registrations: updatedEvent.analytics?.[0]?.totalRegistrations || 0,
      rating: updatedEvent.averageRating,
      reviews: updatedEvent.totalReviews,
      image: updatedEvent.bannerImage || "/placeholder.svg",
      bannerImage: updatedEvent.bannerImage,
      thumbnailImage: updatedEvent.thumbnailImage,
      images: updatedEvent.images || [],
      videos: updatedEvent.videos || [],
      brochure: updatedEvent.brochure,
      layout: updatedEvent.layoutPlan,
      documents: updatedEvent.documents || [],
      promotionBudget:
        updatedEvent.promotions.reduce((acc, p) => acc + (p.amount || 0), 0) || 0,
      socialShares: Math.floor(Math.random() * 1000),
      organizerId: updatedEvent.organizerId,
    }

    // Log the admin action
    await prisma.adminLog.create({
      data: {
        adminId: session.user.id,
        adminType: session.user.role === "SUPER_ADMIN" ? "SUPER_ADMIN" : "SUB_ADMIN",
        action: "EVENT_UPDATED",
        resource: "EVENT",
        resourceId: updatedEvent.id,
        details: {
          title: updatedEvent.title,
          updatedFields: Object.keys(data),
          hasFileUploads: fileUploads.length > 0
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    })

    return NextResponse.json({ 
      success: true, 
      event: formattedEvent
    })
  } catch (error) {
    console.error("Error updating event:", error)
    return NextResponse.json({ 
      error: "Failed to update event",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}