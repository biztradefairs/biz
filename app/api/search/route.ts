import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * Optimized Navbar Search API
 * Target response time: 150–300ms
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const rawQuery = searchParams.get("q") || ""
    const query = rawQuery.trim()
    const limit = Number(searchParams.get("limit") || 5)

    // ❌ Do not hit DB for empty or short queries
    if (!query || query.length < 2) {
      return NextResponse.json({
        events: [],
        venues: [],
        speakers: [],
        allResults: []
      })
    }

    /**
     * Run all queries in parallel
     * Keep queries SIMPLE & INDEX-FRIENDLY
     */
    const [events, venues, speakers] = await Promise.all([
      // 🔹 EVENTS (title only – fast)
      prisma.event.findMany({
        where: {
          isPublic: true,
          title: { contains: query, mode: "insensitive" }
        },
        select: {
          id: true,
          title: true,
          startDate: true,
          isVIP: true,
          isFeatured: true,
          venue: {
            select: {
              venueCity: true,
              venueCountry: true
            }
          }
        },
        orderBy: { startDate: "asc" },
        take: limit
      }),

      // 🔹 VENUES (name only – fast)
      prisma.user.findMany({
        where: {
          role: "VENUE_MANAGER",
          isActive: true,
          venueName: { contains: query, mode: "insensitive" }
        },
        select: {
          id: true,
          venueName: true,
          venueCity: true,
          venueCountry: true
        },
        take: limit
      }),

      // 🔹 SPEAKERS (first + last name only)
      prisma.user.findMany({
        where: {
          role: "SPEAKER",
          isActive: true,
          OR: [
            { firstName: { contains: query, mode: "insensitive" } },
            { lastName: { contains: query, mode: "insensitive" } }
          ]
        },
        select: {
          id: true,
          firstName: true,
          lastName: true
        },
        take: limit
      })
    ])

    /**
     * Normalize response
     */
    const eventResults = events.map(event => ({
      id: event.id,
      title: event.title,
      startDate: event.startDate,
      isVIP: event.isVIP,
      isFeatured: event.isFeatured,
      venue: event.venue,
      type: "event"
    }))

    const venueResults = venues.map(venue => ({
      id: venue.id,
      venueName: venue.venueName,
      location: [venue.venueCity, venue.venueCountry].filter(Boolean).join(", "),
      type: "venue"
    }))

    const speakerResults = speakers.map(speaker => ({
      id: speaker.id,
      displayName: `${speaker.firstName} ${speaker.lastName}`,
      type: "speaker"
    }))

    return NextResponse.json(
      {
        events: eventResults,
        venues: venueResults,
        speakers: speakerResults,
        allResults: [
          ...eventResults.map(e => ({ ...e, resultType: "event" })),
          ...venueResults.map(v => ({ ...v, resultType: "venue" })),
          ...speakerResults.map(s => ({ ...s, resultType: "speaker" }))
        ]
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Search API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
