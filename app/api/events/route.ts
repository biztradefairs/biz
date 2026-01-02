// app/api/events/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "12")
    const category = searchParams.get("category")
    const search = searchParams.get("search") || ""
    const location = searchParams.get("location")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const featured = searchParams.get("featured")
    const sort = searchParams.get("sort") || "newest"
    
    const skip = (page - 1) * limit

    // Build where clause - ONLY PUBLISHED EVENTS
    const where: any = {
      status: "PUBLISHED",
      isPublic: true,
    }

    if (category) {
      where.category = { has: category }
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { shortDescription: { contains: search, mode: "insensitive" } },
        { tags: { has: search } }
      ]
    }

    if (location) {
      where.venue = {
        OR: [
          { venueCity: { contains: location, mode: "insensitive" } },
          { venueState: { contains: location, mode: "insensitive" } },
          { venueCountry: { contains: location, mode: "insensitive" } }
        ]
      }
    }

    if (startDate) {
      where.startDate = { gte: new Date(startDate) }
    }

    if (endDate) {
      where.endDate = { lte: new Date(endDate) }
    }

    if (featured === "true") {
      where.isFeatured = true
    }

    // Build orderBy clause
    let orderBy: any = {}
    switch (sort) {
      case "newest":
        orderBy = { createdAt: "desc" }
        break
      case "oldest":
        orderBy = { createdAt: "asc" }
        break
      case "soonest":
        orderBy = { startDate: "asc" }
        break
      case "popular":
        orderBy = { currentAttendees: "desc" }
        break
      case "featured":
        orderBy = [{ isFeatured: "desc" }, { createdAt: "desc" }]
        break
      default:
        orderBy = { createdAt: "desc" }
    }

    // Get events with pagination
    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        include: {
          organizer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
            }
          },
          venue: {
            select: {
              id: true,
              venueName: true,
              venueCity: true,
              venueState: true,
              venueCountry: true,
              venueAddress: true,
            }
          },
          ticketTypes: {
            where: { isActive: true },
            select: {
              id: true,
              name: true,
              price: true,
              quantity: true,
            },
            orderBy: { price: "asc" },
            take: 1
          },
          _count: {
            select: {
              registrations: {
                where: { status: "CONFIRMED" }
              },
              reviews: true
            }
          },
          reviews: {
            select: {
              rating: true
            }
          }
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.event.count({ where })
    ])

    // Transform events
    const transformedEvents = events.map(event => {
      const avgRating = event.reviews.length > 0
        ? event.reviews.reduce((sum, review) => sum + review.rating, 0) / event.reviews.length
        : 0

      const cheapestTicket = event.ticketTypes[0]?.price || 0

      return {
        id: event.id,
        title: event.title,
        description: event.description,
        shortDescription: event.shortDescription,
        slug: event.slug,
        startDate: event.startDate.toISOString(),
        endDate: event.endDate.toISOString(),
        timezone: event.timezone,
        location: event.venue?.venueName || "Virtual Event",
        city: event.venue?.venueCity || "",
        state: event.venue?.venueState || "",
        country: event.venue?.venueCountry || "",
        address: event.venue?.venueAddress || "",
        isVirtual: event.isVirtual,
        virtualLink: event.virtualLink,
        status: event.status,
        category: event.category || [],
        tags: event.tags || [],
        eventType: event.eventType || [],
        isFeatured: event.isFeatured,
        isVIP: event.isVIP,
        attendees: event._count.registrations,
        totalReviews: event._count.reviews,
        averageRating: avgRating,
        cheapestTicket,
        currency: event.currency,
        images: event.images,
        bannerImage: event.bannerImage,
        thumbnailImage: event.thumbnailImage,
        organizer: {
          id: event.organizer.id,
          name: `${event.organizer.firstName} ${event.organizer.lastName}`.trim(),
          email: event.organizer.email,
          avatar: event.organizer.avatar,
        },
        createdAt: event.createdAt.toISOString(),
        updatedAt: event.updatedAt.toISOString(),
      }
    })

    return NextResponse.json({
      success: true,
      events: transformedEvents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      }
    })

  } catch (error: any) {
    console.error("Error fetching events:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to fetch events",
      details: error.message
    }, { status: 500 })
  }
}