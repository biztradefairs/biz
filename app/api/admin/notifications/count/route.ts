// app/api/admin/notifications/count/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth-options"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user?.role !== "SUPER_ADMIN" && session.user?.role !== "SUB_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const adminId = session.user.id

    // Count only admin's own notifications
    const unreadCount = await prisma.notification.count({
      where: {
        userId: adminId,
        isRead: false
      }
    })

    return NextResponse.json({
      success: true,
      unreadCount
    })

  } catch (error: any) {
    console.error("Error fetching notification count:", error)
    return NextResponse.json({ 
      success: false,
      error: "Internal server error",
      details: error.message 
    }, { status: 500 })
  }
}