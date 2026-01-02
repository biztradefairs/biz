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

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const skip = (page - 1) * limit
    const unreadOnly = searchParams.get("unreadOnly") === "true"

    const adminId = session.user.id
    const adminRole = session.user.role === "SUPER_ADMIN" ? "SUPER_ADMIN" : "SUB_ADMIN"

    // Build where clause - get only admin's notifications and system admin notifications
    const where: any = {
      OR: [
        // System notifications for admins (with admin roles)
        { 
          userRole: { hasSome: ["SUPER_ADMIN", "SUB_ADMIN"] }
        },
        // Specific admin's notifications
        { userId: adminId }
      ]
    }

    if (unreadOnly) {
      where.isRead = false
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
            }
          }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ 
        where: { 
          ...where,
          isRead: false 
        } 
      })
    ])

    // Format notifications safely
    const formattedNotifications = notifications.map(notification => ({
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      userId: notification.userId,
      user: notification.user ? {
        id: notification.user.id,
        name: `${notification.user.firstName || ''} ${notification.user.lastName || ''}`.trim(),
        email: notification.user.email,
        avatar: notification.user.avatar,
      } : null,
      channels: notification.channels,
      isRead: notification.isRead,
      readAt: notification.readAt?.toISOString(),
      priority: notification.priority,
      metadata: notification.metadata ? JSON.parse(notification.metadata as string) : null,
      createdAt: notification.createdAt.toISOString(),
      userRole: notification.userRole || [],
    }))

    return NextResponse.json({
      success: true,
      notifications: formattedNotifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        unreadCount,
      }
    })

  } catch (error: any) {
    console.error("Error fetching admin notifications:", error)
    return NextResponse.json({ 
      success: false,
      error: "Failed to fetch notifications",
      details: error.message 
    }, { status: 500 })
  }
}

// Mark notifications as read
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user?.role !== "SUPER_ADMIN" && session.user?.role !== "SUB_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { notificationIds, markAllAsRead = false } = body
    const adminId = session.user.id

    if (markAllAsRead) {
      // Mark only admin's own notifications as read
      await prisma.notification.updateMany({
        where: {
          userId: adminId,
          isRead: false
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      })
      
      return NextResponse.json({
        success: true,
        message: "All your notifications marked as read"
      })
    }

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return NextResponse.json({ 
        success: false,
        error: "Notification IDs are required" 
      }, { status: 400 })
    }

    // Only mark admin's own notifications as read
    await prisma.notification.updateMany({
      where: {
        id: { in: notificationIds },
        userId: adminId
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