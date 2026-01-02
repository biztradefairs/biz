import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth-options"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Check if user is admin
    if (!session || (session.user?.role !== "SUPER_ADMIN" && session.user?.role !== "SUB_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { eventId, action, reason = "" } = body

    if (!eventId || !action) {
      return NextResponse.json({ error: "Event ID and action are required" }, { status: 400 })
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { 
        organizer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        } 
      }
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    const adminId = session.user?.id
    if (!adminId) {
      return NextResponse.json({ error: "Admin ID not found" }, { status: 401 })
    }

    let updatedEvent
    let message = ""

    if (action === "approve") {
      updatedEvent = await prisma.event.update({
        where: { id: eventId },
        data: { 
          status: "PUBLISHED",
          isPublic: true,
          rejectionReason: null,
          rejectedAt: null,
          rejectedById: null
        }
      })
      message = "Event approved and published successfully"
      
      // Send notification to organizer
      if (event.organizer?.id) {
        await sendEventApprovalNotification(
          event.organizer.id,
          event.organizer.email!, 
          event.title, 
          true, 
          ""
        )
      }
      
      // Send notification to admin who approved
      await notifyAdminAboutEventUpdate(event.title, "approved", adminId)
    } 
    else if (action === "reject") {
      // Update status to REJECTED
      updatedEvent = await prisma.event.update({
        where: { id: eventId },
        data: { 
          status: "REJECTED",
          isPublic: false,
          rejectionReason: reason,
          rejectedAt: new Date(),
          rejectedById: adminId
        }
      })
      message = "Event rejected successfully"

      // Send notification to organizer
      if (event.organizer?.id) {
        await sendEventApprovalNotification(
          event.organizer.id,
          event.organizer.email!, 
          event.title, 
          false, 
          reason
        )
      }
      
      // Send notification to admin who rejected
      await notifyAdminAboutEventUpdate(event.title, "rejected", adminId)

      // Log the rejection
      await prisma.adminLog.create({
        data: {
          adminId: adminId,
          adminType: session.user?.role === "SUPER_ADMIN" ? "SUPER_ADMIN" : "SUB_ADMIN",
          action: "EVENT_REJECTED",
          resource: "EVENT",
          resourceId: eventId,
          details: JSON.stringify({
            eventTitle: event.title,
            organizer: event.organizer?.email || "Unknown",
            reason,
            rejectedAt: new Date()
          }),
          ipAddress: request.headers.get("x-forwarded-for") || "unknown",
          userAgent: request.headers.get("user-agent") || "unknown",
          ...(session.user?.role === "SUPER_ADMIN" 
            ? { superAdminId: adminId }
            : { subAdminId: adminId })
        }
      })
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message,
      event: updatedEvent
    })

  } catch (error: any) {
    console.error("Event approval error:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      details: error.message 
    }, { status: 500 })
  }
}

// Fixed: Send notification to organizer
async function sendEventApprovalNotification(
  organizerId: string,
  organizerEmail: string, 
  eventTitle: string, 
  approved: boolean, 
  reason: string
) {
  try {
    // Create notification for organizer
    await prisma.notification.create({
      data: {
        userId: organizerId,
        type: approved ? "EVENT_APPROVED" : "EVENT_REJECTED",
        title: `Event ${approved ? 'Approved' : 'Rejected'}: ${eventTitle}`,
        message: approved 
          ? `🎉 Great news! Your event "${eventTitle}" has been approved and is now live on the platform.` 
          : `ℹ️ Your event "${eventTitle}" has been reviewed. Reason: ${reason || "Please check the event details and resubmit."}`,
        channels: ["PUSH", "EMAIL"],
        priority: "HIGH",
        metadata: JSON.stringify({
          eventTitle,
          reason,
          date: new Date().toISOString(),
          status: approved ? "approved" : "rejected"
        }),
        userRole: ["ORGANIZER"]
      }
    })
    
    console.log(`Event ${approved ? 'approved' : 'rejected'} notification sent to organizer ${organizerEmail}`)
    
  } catch (error) {
    console.error('Failed to send notification to organizer:', error)
  }
}

// Fixed: Notify only the admin who performed the action
async function notifyAdminAboutEventUpdate(eventTitle: string, action: "approved" | "rejected", adminId: string) {
  try {
    // Get admin details
    let admin
    const adminType = adminId.includes('super') ? "SUPER_ADMIN" : "SUB_ADMIN"
    
    if (adminType === "SUPER_ADMIN") {
      admin = await prisma.superAdmin.findUnique({
        where: { id: adminId },
        select: { id: true, email: true, name: true }
      })
    } else {
      admin = await prisma.subAdmin.findUnique({
        where: { id: adminId },
        select: { id: true, email: true, name: true }
      })
    }
    
    if (!admin) return

    // Create notification for the admin who performed the action
    await prisma.notification.create({
      data: {
        userId: admin.id,
        type: action === "approved" ? "EVENT_APPROVED" : "EVENT_REJECTED",
        title: `Event ${action}: ${eventTitle}`,
        message: `You ${action} the event "${eventTitle}".`,
        channels: ["PUSH"],
        priority: "MEDIUM",
        metadata: JSON.stringify({
          eventTitle,
          action,
          timestamp: new Date().toISOString()
        }),
        userRole: adminType === "SUPER_ADMIN" ? ["SUPER_ADMIN"] : ["SUB_ADMIN"]
      }
    })

    console.log(`Event ${action} notification sent to admin ${admin.email}`)

  } catch (error) {
    console.error("Failed to notify admin:", error)
  }
}