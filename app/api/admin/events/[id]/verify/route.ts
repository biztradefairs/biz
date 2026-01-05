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

    const { id } = params   // ✅ NOW id IS VALID

    const formData = await request.formData()
    const isVerified = formData.get("isVerified") === "true"

    const event = await prisma.event.update({
      where: { id },        // ✅ VALID
      data: {
        isVerified,
        verifiedAt: isVerified ? new Date() : null,
        verifiedBy: isVerified ? session.user.email : null,
        verifiedBadgeImage: "/badge/VerifiedBADGE (1).png",
      },
    })

    return NextResponse.json({ success: true, event })
  } catch (error) {
    console.error("VERIFY ERROR:", error)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
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