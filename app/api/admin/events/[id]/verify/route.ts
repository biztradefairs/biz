import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth-options"
import { uploadToCloudinary, Cloudinary } from "@/lib/cloudinary"

// ✅ FIX: Await params properly for Next.js 14 App Router
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

    // ✅ FIX: Await params properly
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
        currentEvent.verifiedBadgeImage !== "/badge/VerifiedBADGE (1).png" &&
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
          if (folderIndex !== -1) {
            fullPublicId = `event-badges/${publicId}`
          }
          
          console.log("Deleting old badge from Cloudinary:", fullPublicId)
          await Cloudinary.uploader.destroy(fullPublicId)
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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // ✅ FIX: Await params properly
    const { id } = await params
    
    if (!id) {
      return NextResponse.json({ 
        error: "Event ID is required" 
      }, { status: 400 })
    }

    const event = await prisma.event.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        isVerified: true,
        verifiedAt: true,
        verifiedBy: true,
        verifiedBadgeImage: true,
      },
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      event,
    })
  } catch (error) {
    console.error("Error fetching verification status:", error)
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to fetch verification status",
      },
      { status: 500 }
    )
  }
}