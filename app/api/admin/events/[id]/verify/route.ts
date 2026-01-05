import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth-options"
import { uploadToCloudinary } from "@/lib/cloudinary"

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
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

    const formData = await request.formData()
    const isVerified = formData.get("isVerified") === "true"
    const badgeFile = formData.get("badgeFile") as File | null

    let badgeUrl: string | null = null

    // ✅ Upload badge to Cloudinary (NO FS)
    if (isVerified && badgeFile) {
      const upload = await uploadToCloudinary(badgeFile, "verified-badges")
      badgeUrl = upload.secure_url
    }

    const event = await prisma.event.update({
      where: { id: params.id },
      data: {
        isVerified,
        verifiedAt: isVerified ? new Date() : null,
        verifiedBy: isVerified ? session.user.email : null,
        verifiedBadgeImage: isVerified
          ? badgeUrl || "/badge/VerifiedBADGE (1).png"
          : null,
      },
    })

    return NextResponse.json({
      success: true,
      event: {
        id: event.id,
        isVerified: event.isVerified,
        verifiedBadgeImage: event.verifiedBadgeImage,
      },
    })
  } catch (error) {
    console.error("VERIFY ERROR:", error)
    return NextResponse.json(
      { error: "Failed to verify event" },
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