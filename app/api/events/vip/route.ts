import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Cache this route for 60 seconds
export const revalidate = 60

export async function GET() {
  try {
    const events = await prisma.event.findMany({
      where: {
        isPublic: true,
        isVIP: true
      },
      select: {
        id: true,
        title: true,
        slug: true,
        startDate: true,
        endDate: true,
        bannerImage: true,
        thumbnailImage: true,
        venue: {
          select: {
            venueCity: true,
            venueCountry: true
          }
        }
      },
      orderBy: {
        startDate: "asc"
      },
      take: 10 // 🔥 LIMIT IS VERY IMPORTANT
    })

    return NextResponse.json({ events })
  } catch (e) {
    console.error("VIP events error", e)
    return NextResponse.json({ events: [] })
  }
}
