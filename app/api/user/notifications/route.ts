import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth-options"
import { metadata } from "@/app/layout"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")
    const skip = (page - 1) * limit
    const unreadOnly = searchParams.get("unreadOnly") === "true"

    // Get user's role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    })

    const userRole = user?.role || "ATTENDEE"

    const where: any = {
      OR: [
        // User's specific notifications
        { userId: userId },
        // Role-based notifications for this user
        { userRole: { has: userRole } }
      ]
    }
    
    if (unreadOnly) {
      where.isRead = false
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { ...where, isRead: false } })
    ])

    // Format notifications
    const formattedNotifications = notifications.map(notification => ({
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      channels: notification.channels,
      isRead: notification.isRead,
      readAt: notification.readAt?.toISOString(),
      priority: notification.priority,
      metadata: notification.metadata ?? null,
      createdAt: notification.createdAt.toISOString(),
    }))

    return NextResponse.json({
      success: true,
      notifications: formattedNotifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      unreadCount
    })

  } catch (error: any) {
    console.error("Error fetching user notifications:", error)
    return NextResponse.json({ 
      success: false,
      error: "Internal server error",
      details: error.message 
    }, { status: 500 })
  }
}

// Mark notifications as read
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const body = await request.json()
    const { notificationIds, markAllAsRead = false } = body

    if (markAllAsRead) {
      await prisma.notification.updateMany({
        where: {
          userId,
          isRead: false
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      })
      
      return NextResponse.json({
        success: true,
        message: "All notifications marked as read"
      })
    }

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return NextResponse.json({ 
        success: false,
        error: "Notification IDs are required" 
      }, { status: 400 })
    }

    await prisma.notification.updateMany({
      where: {
        id: { in: notificationIds },
        userId
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: "Notifications marked as read"
    })

  } catch (error: any) {
    console.error("Error marking notifications as read:", error)
    return NextResponse.json({ 
      success: false,
      error: "Internal server error",
      details: error.message 
    }, { status: 500 })
  }
}