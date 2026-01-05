import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth-options"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const { isVerified } = await request.json()

    // Update the event verification status
    const event = await prisma.event.update({
      where: { id },
      data: {
        isVerified,
        verifiedAt: isVerified ? new Date() : null,
        verifiedBy: isVerified ? session.user.email : null,
        verifiedBadgeImage: isVerified ? "/badge/VerifiedBADGE (1).png" : null,
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