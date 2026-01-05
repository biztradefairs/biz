import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth-options"
import { prisma } from "@/lib/prisma"
import { EventStatus, SessionType, SessionStatus, UserRole } from "@prisma/client"
import { ObjectId } from "mongodb"

// Helper function to parse category input
function parseCategory(category: any): string[] {
  if (Array.isArray(category)) {
    return category.filter(Boolean)
  }
  if (typeof category === 'string') {
    return category.split(',').map((cat: string) => cat.trim()).filter(Boolean)
  }
  return []
}

// Helper function to parse space costs with valid enum values
function parseSpaceCosts(spaceCosts: any[], currency: string = "USD") {
  return spaceCosts.map((space, index) => {
    // Map space types to valid ExhibitionSpaceType enum values
    const spaceTypeMap: { [key: string]: string } = {
      'standard': 'SHELL_SPACE',
      'shell': 'SHELL_SPACE', 
      'shell_scheme': 'SHELL_SPACE',
      'shell_space': 'SHELL_SPACE',
      'raw': 'RAW_SPACE',
      'raw_space': 'RAW_SPACE',
      'open': 'TWO_SIDE_OPEN',
      'two_side_open': 'TWO_SIDE_OPEN',
      'premium': 'THREE_SIDE_OPEN',
      'three_side_open': 'THREE_SIDE_OPEN',
      'vip': 'FOUR_SIDE_OPEN',
      'four_side_open': 'FOUR_SIDE_OPEN',
      'mezzanine': 'MEZZANINE',
      'power': 'ADDITIONAL_POWER',
      'additional_power': 'ADDITIONAL_POWER',
      'air': 'COMPRESSED_AIR',
      'compressed_air': 'COMPRESSED_AIR',
      'custom': 'CUSTOM'
    };
    
    const rawSpaceType = (space.spaceType || space.type || 'CUSTOM').toLowerCase();
    let spaceType = spaceTypeMap[rawSpaceType] || 'CUSTOM';
    
    // Validate that the spaceType is a valid ExhibitionSpaceType
    const validSpaceTypes = [
      'SHELL_SPACE', 'RAW_SPACE', 'TWO_SIDE_OPEN', 'THREE_SIDE_OPEN', 
      'FOUR_SIDE_OPEN', 'MEZZANINE', 'ADDITIONAL_POWER', 'COMPRESSED_AIR', 'CUSTOM'
    ];
    
    if (!validSpaceTypes.includes(spaceType)) {
      console.warn(`Invalid space type: ${spaceType}, defaulting to CUSTOM`);
      spaceType = 'CUSTOM';
    }
    
    return {
      id: space.id || new ObjectId().toHexString(),
      spaceType: spaceType,
      name: space.name || space.type || `Space ${index + 1}`,
      description: space.description || "",
      basePrice: space.basePrice || space.pricePerSqm || space.pricePerUnit || 0,
      pricePerSqm: space.pricePerSqm || 0,
      minArea: space.minArea || space.area || 0,
      isFixed: space.isFixed || false,
      additionalPowerRate: space.additionalPowerRate || 0,
      compressedAirRate: space.compressedAirRate || 0,
      unit: space.unit || null,
      area: space.area || space.minArea || 0,
      dimensions: space.dimensions || (space.area ? `${space.area} sq.m` : "3x3"),
      location: space.location || null,
      isAvailable: true,
      maxBooths: space.maxBooths || null,
      bookedBooths: 0,
      setupRequirements: space.setupRequirements || null,
      currency: currency,
      powerIncluded: space.powerIncluded || false,
    }
  })
}

// Helper function to parse speaker sessions
function parseSpeakerSessions(speakerSessions: any[]) {
  return speakerSessions.map(session => ({
    title: session.title || "Presentation",
    description: session.description || "",
    sessionType: (session.sessionType?.toUpperCase() as SessionType) || SessionType.PRESENTATION,
    duration: session.duration || 60,
    startTime: new Date(session.startTime || session.startDate || new Date()),
    endTime: new Date(session.endTime || session.endDate || new Date(Date.now() + 60 * 60 * 1000)),
    room: session.room || null,
    abstract: session.abstract || null,
    learningObjectives: session.learningObjectives || [],
    targetAudience: session.targetAudience || null,
    status: SessionStatus.SCHEDULED,
    speakerId: session.speakerId
  }))
}

// Helper function to create or find user by email and role
async function findOrCreateUser(userData: {
  email: string
  firstName?: string
  lastName?: string
  company?: string
  role: UserRole
  phone?: string
  avatar?: string
  venueName?: string
  venueCity?: string
  venueAddress?: string
  jobTitle?: string
  bio?: string
}) {
  const { email, role, ...data } = userData
  
  // Try to find existing user by email and role
  let user = await prisma.user.findFirst({
    where: {
      email: email.toLowerCase(),
      role: role
    }
  })
  
  if (user) {
    console.log(`Found existing ${role}:`, user.email)
    
    // Update user details if provided
    const updateData: any = {}
    if (data.firstName && data.firstName !== user.firstName) updateData.firstName = data.firstName
    if (data.lastName && data.lastName !== user.lastName) updateData.lastName = data.lastName
    if (data.company && data.company !== user.company) updateData.company = data.company
    if (data.phone && data.phone !== user.phone) updateData.phone = data.phone
    if (data.avatar && data.avatar !== user.avatar) updateData.avatar = data.avatar
    if (data.venueName && data.venueName !== user.venueName) updateData.venueName = data.venueName
    if (data.venueCity && data.venueCity !== user.venueCity) updateData.venueCity = data.venueCity
    if (data.venueAddress && data.venueAddress !== user.venueAddress) updateData.venueAddress = data.venueAddress
    if (data.jobTitle && data.jobTitle !== user.jobTitle) updateData.jobTitle = data.jobTitle
    if (data.bio && data.bio !== user.bio) updateData.bio = data.bio
    
    if (Object.keys(updateData).length > 0) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: updateData
      })
      console.log(`Updated ${role} details:`, user.email)
    }
    
    return user
  }
  
  // Create new user
  console.log(`Creating new ${role}:`, email)
  const newUser = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      firstName: data.firstName || role === "VENUE_MANAGER" ? "Venue" : "User",
      lastName: data.lastName || role === "VENUE_MANAGER" ? "Manager" : "Name",
      company: data.company || "",
      phone: data.phone || "",
      avatar: data.avatar || `/placeholder.svg?height=100&width=100&text=${role.charAt(0)}`,
      venueName: data.venueName,
      venueCity: data.venueCity,
      venueAddress: data.venueAddress,
      jobTitle: data.jobTitle,
      bio: data.bio,
      role: role,
      password: "TEMP_PASSWORD_123!",
      isActive: true
    }
  })
  
  return newUser
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user?.role !== "SUPER_ADMIN" && session.user?.role !== "SUB_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const events = await prisma.event.findMany({
      include: {
        organizer: {
          select: {
            firstName: true,
            lastName: true,
            organizationName: true,
          },
        },
        venue: {
          select: {
            venueName: true,
            venueCity: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform events to match frontend interface
    const formattedEvents = events.map(event => ({
      id: event.id,
      title: event.title,
      organizer: 
        event.organizer?.organizationName ||
        `${event.organizer?.firstName || ""} ${event.organizer?.lastName || ""}`.trim() ||
        "Unknown Organizer",
      organizerId: event.organizerId,
      date: event.startDate.toISOString().split('T')[0],
      endDate: event.endDate.toISOString().split('T')[0],
      location: event.venue?.venueCity || "Virtual",
      venue: event.venue?.venueName || "N/A",
      status: event.status === "PUBLISHED" ? "Approved" :
              event.status === "PENDING_APPROVAL" ? "Pending Review" :
              event.status === "DRAFT" ? "Draft" :
              event.status === "CANCELLED" ? "Flagged" : "Completed",
      attendees: event.currentAttendees || 0,
      maxCapacity: event.maxAttendees || 0,
      revenue: 0,
      ticketPrice: 0,
      category: event.category?.[0] || "Other",
      featured: event.isFeatured || false,
      vip: event.isVIP || false,
      priority: "Medium",
      description: event.description,
      shortDescription: event.shortDescription,
      slug: event.slug,
      edition: event.edition,
      tags: event.tags || [],
      eventType: event.eventType?.[0] || "",
      timezone: event.timezone,
      currency: event.currency,
      createdAt: event.createdAt.toISOString(),
      lastModified: event.updatedAt.toISOString(),
      views: 0,
      registrations: 0,
      rating: 0,
      reviews: 0,
      image: event.bannerImage || "/placeholder.svg",
      bannerImage: event.bannerImage,
      thumbnailImage: event.thumbnailImage,
      images: event.images || [],
      videos: event.videos || [],
      brochure: event.brochure,
      layout: event.layoutPlan,
      documents: event.documents || [],
      promotionBudget: 0,
      socialShares: Math.floor(Math.random() * 1000),
      
      // ✅ CRITICAL FIX: Include ALL verification fields
      isVerified: event.isVerified || false,
      verifiedAt: event.verifiedAt?.toISOString() || null,
      verifiedBy: event.verifiedBy || null,
      verifiedBadgeImage: event.verifiedBadgeImage || null,
    }))

    return NextResponse.json({
      success: true,
      events: formattedEvents
    })
  } catch (error) {
    console.error("Error fetching events:", error)
    return NextResponse.json({ 
      success: false,
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only ADMIN or SUPER_ADMIN can create events
    if (session.user?.role !== "ADMIN" && session.user?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    console.log("Creating event with data:", JSON.stringify(body, null, 2))

    // Basic validation
    const requiredFields = ["title", "description", "startDate", "endDate"]
    const missing = requiredFields.filter((f) => !body[f])
    if (missing.length > 0) {
      return NextResponse.json({ error: `Missing required fields: ${missing.join(", ")}` }, { status: 400 })
    }

    // Prepare arrays / normalized inputs
    const images = Array.isArray(body.images) ? body.images : []
    const videos = Array.isArray(body.videos) ? body.videos : []
    const documents = Array.isArray(body.documents)
      ? body.documents.filter(Boolean)
      : [body.brochure, body.layoutPlan].filter(Boolean)

    // Organizer logic (tries provided organizerId or falls back to find/create)
    let organizerId = session.user.id
    if (body.organizerId) {
      // validate ObjectId-ish string
      organizerId = body.organizerId
    } else if (body.organizerEmail || body.organizerName) {
      const organizer = await findOrCreateUser({
        email: body.organizerEmail || `organizer-${Date.now()}@eventify.com`,
        firstName: (body.organizerName || "Event Organizer").split(" ")[0],
        lastName: (body.organizerName || "Event Organizer").split(" ").slice(1).join(" "),
        company: body.organizationName || body.organizer?.company,
        role: "ORGANIZER"
      })
      organizerId = organizer.id
    }

    // Venue logic (create or use provided venue manager record)
    let venueId: string | null = null
    if (body.venueId) {
      venueId = body.venueId
    } else if (body.venueName || body.city || body.address) {
      const venue = await findOrCreateUser({
        email: body.venueEmail || `venue-${Date.now()}@eventify.com`,
        firstName: "Venue",
        lastName: "Manager",
        role: "VENUE_MANAGER",
        venueName: body.venueName || body.venue,
        venueCity: body.city,
        venueAddress: body.address,
        phone: body.venuePhone
      })
      venueId = venue.id
    }

    // Process speaker sessions -> create any missing speakers and collect speakerId
    const speakerSessionsData = Array.isArray(body.speakerSessions) ? body.speakerSessions : []
    const processedSessions: any[] = []
    for (const s of speakerSessionsData) {
      let speakerId = s.speakerId
      if (!speakerId && (s.speakerEmail || s.speakerName)) {
        const sp = await findOrCreateUser({
          email: s.speakerEmail || `speaker-${Date.now()}@eventify.com`,
          firstName: (s.speakerName || "Speaker").split(" ")[0],
          lastName: (s.speakerName || "Speaker").split(" ").slice(1).join(" "),
          role: "SPEAKER",
          jobTitle: s.speakerTitle,
          bio: s.speakerBio,
          avatar: s.speakerImage
        })
        speakerId = sp.id
      }
      if (speakerId) {
        processedSessions.push({
          ...s,
          speakerId
        })
      }
    }

    // Process exhibitors -> create user accounts if needed and normalize
    const exhibitorBoothsData = Array.isArray(body.exhibitorBooths) ? body.exhibitorBooths : []
    const processedExhibitors: any[] = []
    for (const ex of exhibitorBoothsData) {
      let exhibitorId = ex.exhibitorId
      if (!exhibitorId && (ex.exhibitorEmail || ex.exhibitorName)) {
        const newEx = await findOrCreateUser({
          email: ex.exhibitorEmail || `exhibitor-${Date.now()}@eventify.com`,
          firstName: (ex.exhibitorName || ex.company || "Exhibitor").split(" ")[0],
          lastName: (ex.exhibitorName || ex.company || "Exhibitor").split(" ").slice(1).join(" "),
          role: "EXHIBITOR",
          company: ex.company,
          phone: ex.phone,
          bio: ex.description,
          jobTitle: ex.jobTitle
        })
        exhibitorId = newEx.id
      }

      if (exhibitorId) {
        processedExhibitors.push({
          ...ex,
          exhibitorId,
          companyName: ex.company || ex.companyName || "Unknown Company",
          totalCost: ex.totalCost ?? 0
        })
      }
    }

    // Build base eventData (only schema fields)
    const eventId = new ObjectId().toHexString()
    const eventData: any = {
      id: eventId,
      title: body.title,
      description: body.description,
      shortDescription: body.shortDescription || (body.description ? body.description.substring(0, 200) : null),
      slug: body.slug || body.title?.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
      status: (body.status?.toUpperCase() as EventStatus) || EventStatus.DRAFT,
      category: parseCategory(body.categories || body.category || body.eventCategories),
      tags: Array.isArray(body.tags) ? body.tags : [],
      eventType: body.eventType ? [body.eventType] : [],
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      registrationStart: new Date(body.registrationStart || body.startDate),
      registrationEnd: new Date(body.registrationEnd || body.endDate),
      timezone: body.timezone || "UTC",
      isVirtual: !!body.isVirtual,
      virtualLink: body.virtualLink || null,
      venueId: venueId,
      maxAttendees: body.maxAttendees || body.maxCapacity || null,
      currentAttendees: 0,
      currency: body.currency || "USD",
      images,
      videos,
      documents,
      brochure: body.brochure || null,
      layoutPlan: body.layoutPlan || null,
      bannerImage: body.bannerImage || images[0] || null,
      thumbnailImage: body.thumbnailImage || images[0] || null,
      isPublic: body.isPublic !== false,
      requiresApproval: !!body.requiresApproval,
      allowWaitlist: !!body.allowWaitlist,
      refundPolicy: body.refundPolicy || null,
      metaTitle: body.metaTitle || null,
      metaDescription: body.metaDescription || null,
      isFeatured: !!(body.featured || body.isFeatured),
      isVIP: !!(body.vip || body.isVIP),
      organizerId: organizerId
    }

    // Ticket types: default + optional student/vip/group
    const ticketTypesData: any[] = []
    ticketTypesData.push({
      name: "General Admission",
      description: "General admission ticket",
      price: body.generalPrice ?? body.ticketPrice ?? 0,
      quantity: body.maxAttendees ?? body.maxCapacity ?? 100,
      isActive: true
    })
    if (body.studentPrice > 0) {
      ticketTypesData.push({
        name: "Student",
        description: "Student ticket",
        price: body.studentPrice,
        quantity: Math.floor((body.maxAttendees || body.maxCapacity || 100) * 0.2),
        isActive: true
      })
    }
    if (body.vipPrice > 0) {
      ticketTypesData.push({
        name: "VIP",
        description: "VIP ticket",
        price: body.vipPrice,
        quantity: Math.floor((body.maxAttendees || body.maxCapacity || 100) * 0.1),
        isActive: true
      })
    }
    if (body.groupPrice > 0) {
      ticketTypesData.push({
        name: "Group",
        description: "Group ticket",
        price: body.groupPrice,
        quantity: Math.floor((body.maxAttendees || body.maxCapacity || 100) * 0.15),
        isActive: true
      })
    }

    // Exhibition spaces: use provided spaceCosts OR create a default if exhibitors exist but no spaces
    const hasProvidedSpaces = Array.isArray(body.spaceCosts) && body.spaceCosts.length > 0
    let spacesToCreate: any[] = []
    if (hasProvidedSpaces) {
      spacesToCreate = parseSpaceCosts(body.spaceCosts, eventData.currency)
    } else if (processedExhibitors.length > 0) {
      // create a default shell space (ensure id set so booths can link)
      spacesToCreate = [
        {
          id: new ObjectId().toHexString(),
          spaceType: "SHELL_SPACE",
          name: "Default Exhibition Space",
          description: "Automatically created exhibition space for exhibitors",
          dimensions: "3x3",
          area: 9,
          basePrice: 0,
          currency: eventData.currency,
          isAvailable: true,
          powerIncluded: false
        }
      ]
    }

    // Prepare speakerSessions nested create payload
    const speakerCreatePayload = processedSessions.map((s) => ({
      title: s.title || "Presentation",
      description: s.description || "",
      sessionType: (s.sessionType?.toUpperCase() as SessionType) || SessionType.PRESENTATION,
      duration: s.duration || 60,
      startTime: s.startTime ? new Date(s.startTime) : new Date(),
      endTime: s.endTime ? new Date(s.endTime) : new Date(Date.now() + 60 * 60 * 1000),
      room: s.room || null,
      abstract: s.abstract || null,
      learningObjectives: s.learningObjectives || [],
      targetAudience: s.targetAudience || null,
      status: SessionStatus.SCHEDULED,
      speakerId: s.speakerId
    }))

    // Prepare exhibitor booths payload - MUST include spaceId
    const defaultSpaceId = spacesToCreate.length > 0 ? spacesToCreate[0].id : null
    const exhibitorCreatePayload = processedExhibitors.map((b, idx) => {
      const resolvedSpaceId = b.spaceId || b.space?.id || defaultSpaceId
      if (!resolvedSpaceId) {
        throw new Error(`spaceId is required for exhibitor booth index ${idx}`)
      }

      return {
        boothNumber: b.boothNumber || `B-${100 + idx}`,
        status: b.status || "BOOKED",
        // specialRequirements: b.specialRequirements || [],
        // notes: b.notes || null,
        companyName: b.companyName,
        description: b.description || null,
        additionalPower: b.additionalPower ?? 0,
        compressedAir: b.compressedAir ?? 0,
        setupRequirements: b.setupRequirements || null,
        // specialRequests: b.specialRequests || null,
        totalCost: b.totalCost ?? 0,
        currency: b.currency || eventData.currency,
        exhibitor: { connect: { id: b.exhibitorId } },
        space: { connect: { id: resolvedSpaceId } }, // required relation
        spaceReference: b.spaceReference || null
      }
    })

    // Now create the event with nested creates
    const createdEvent = await prisma.event.create({
      data: {
        ...eventData,
        ticketTypes: ticketTypesData.length > 0 ? { create: ticketTypesData } : undefined,
        exhibitionSpaces: spacesToCreate.length > 0 ? { create: spacesToCreate } : undefined,
        speakerSessions: speakerCreatePayload.length > 0 ? { create: speakerCreatePayload } : undefined,
        exhibitorBooths: exhibitorCreatePayload.length > 0 ? { create: exhibitorCreatePayload } : undefined
      },
      include: {
        organizer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            organizationName: true,
            company: true,
            phone: true
          }
        },
        venue: {
          select: {
            id: true,
            venueName: true,
            venueCity: true,
            venueAddress: true,
            venueState: true,
            venueCountry: true
          }
        },
        exhibitionSpaces: true,
        ticketTypes: true,
        speakerSessions: {
          include: {
            speaker: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                company: true,
                jobTitle: true,
                avatar: true
              }
            }
          }
        },
        exhibitorBooths: {
          include: {
            exhibitor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                company: true,
                phone: true
              }
            },
            space: true
          }
        }
      }
    })

    // Log admin action
    await prisma.adminLog.create({
      data: {
        adminId: session.user.id,
        adminType: session.user.role === "SUPER_ADMIN" ? "SUPER_ADMIN" : "SUB_ADMIN",
        action: "EVENT_CREATED",
        resource: "EVENT",
        resourceId: createdEvent.id,
        details: {
          title: createdEvent.title,
          organizerId: createdEvent.organizerId,
          venueId: createdEvent.venueId,
          speakerCount: createdEvent.speakerSessions?.length || 0,
          exhibitorCount: createdEvent.exhibitorBooths?.length || 0,
          spaceCount: createdEvent.exhibitionSpaces?.length || 0,
          status: createdEvent.status
        },
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown"
      }
    })

    return NextResponse.json(
      {
        success: true,
        message: "Event created successfully with nested entities",
        event: createdEvent
      },
      { status: 201 }
    )
  } catch (err) {
    console.error("Error creating event:", err)
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json(
      { success: false, error: "Internal server error", details: message },
      { status: 500 }
    )
  }
}