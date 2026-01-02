// app/api/admin/events/pending/route.ts
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

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""
    const skip = (page - 1) * limit

    const where: any = { 
      status: "PENDING_APPROVAL"
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { organizer: { 
          OR: [
            { firstName: { contains: search, mode: "insensitive" } },
            { lastName: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } }
          ]
        }}
      ]
    }

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
              company: true,
              phone: true,
            }
          },
          venue: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              venueName: true,
              venueAddress: true,
              venueCity: true,
              venueState: true,
              venueCountry: true,
            }
          },
          ticketTypes: {
            select: {
              id: true,
              name: true,
              price: true,
              quantity: true,
            }
          },
          exhibitionSpaces: {
            select: {
              id: true,
              name: true,
              spaceType: true,
              basePrice: true,
              area: true,
            }
          },
          _count: {
            select: {
              leads: true,
            }
          }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.event.count({ where })
    ])

    const transformedEvents = events.map(event => ({
      id: event.id,
      title: event.title,
      description: event.description,
      shortDescription: event.shortDescription,
      startDate: event.startDate.toISOString(),
      endDate: event.endDate.toISOString(),
      registrationStart: event.registrationStart.toISOString(),
      registrationEnd: event.registrationEnd.toISOString(),
      timezone: event.timezone,
      venue: event.venue?.venueName || event.venue?.firstName + " " + (event.venue?.lastName || "") || "Not specified",
      city: event.venue?.venueCity || "Not specified",
      state: event.venue?.venueState || "",
      country: event.venue?.venueCountry || "",
      status: event.status,
      isVirtual: event.isVirtual,
      virtualLink: event.virtualLink,
      maxAttendees: event.maxAttendees,
      currentAttendees: event.currentAttendees,
      currency: event.currency,
      images: event.images,
      bannerImage: event.bannerImage,
      thumbnailImage: event.thumbnailImage,
      organizer: {
        id: event.organizer.id,
        name: `${event.organizer.firstName} ${event.organizer.lastName}`.trim(),
        email: event.organizer.email,
        company: event.organizer.company || "",
        phone: event.organizer.phone || "",
      },
      ticketTypes: event.ticketTypes,
      exhibitionSpaces: event.exhibitionSpaces,
      leadsCount: event._count.leads,
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
    }))

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
    console.error("Error fetching pending events:", error)
    return NextResponse.json({ 
      success: false,
      error: "Internal server error",
      details: error.message 
    }, { status: 500 })
  }
}