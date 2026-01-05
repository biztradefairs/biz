import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth-options"
import { writeFile } from "fs/promises"
import path from "path"
import fs from "fs"

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
      select: { verifiedBadgeImage: true }
    })

    // Delete old badge if it exists and is not the default
    if (currentEvent?.verifiedBadgeImage && 
        currentEvent.verifiedBadgeImage !== "/badge/VerifiedBADGE (1).png" &&
        !isVerified) {
      const oldPath = path.join(process.cwd(), 'public', currentEvent.verifiedBadgeImage)
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath)
      }
    }

    // Update the event verification status
    const event = await prisma.event.update({
      where: { id },
      data: {
        isVerified,
        verifiedAt: isVerified ? new Date() : null,
        verifiedBy: isVerified ? session.user.email : null,
        verifiedBadgeImage: isVerified ? 
          (badgeImagePath || "/badge/VerifiedBADGE (1).png") : 
          null,
      },
    })

    return NextResponse.json({
      success: true,
      message: isVerified ? "Event verified successfully" : "Verification removed",
      event: {
        id: event.id,
        title: event.title,
        isVerified: event.isVerified,
        verifiedAt: event.verifiedAt,
        verifiedBy: event.verifiedBy,
        verifiedBadgeImage: event.verifiedBadgeImage,
      },
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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
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