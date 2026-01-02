// app/api/admin/events/stats/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth-options"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    // Check if user is admin
    if (!session || (session.user?.role !== "SUPER_ADMIN" && session.user?.role !== "SUB_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const [total, approved, rejected, pending] = await Promise.all([
      prisma.event.count(),
      prisma.event.count({ where: { status: "PUBLISHED" } }),
      prisma.event.count({ where: { status: "REJECTED" } }),
      prisma.event.count({ where: { status: "PENDING_APPROVAL" } })
    ])

    return NextResponse.json({
      success: true,
      stats: {
        total,
        approved,
        rejected,
        pending
      }
    })

  } catch (error: any) {
    console.error("Error fetching stats:", error)
    return NextResponse.json({ 
      success: false,
      error: "Internal server error",
      details: error.message 
    }, { status: 500 })
  }
}