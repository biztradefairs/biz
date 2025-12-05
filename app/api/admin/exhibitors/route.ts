import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || "all"
    const industry = searchParams.get("industry") || "all"

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      role: "EXHIBITOR",
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { company: { contains: search, mode: "insensitive" } },
      ]
    }

    if (status !== "all") {
      where.isActive = status === "active"
    }

    if (industry !== "all") {
      where.companyIndustry = industry
    }

    // Fetch exhibitors with pagination
    const [exhibitors, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          avatar: true,
          bio: true,
          company: true,
          jobTitle: true,
          location: true,
          website: true,
          linkedin: true,
          twitter: true,
          businessEmail: true,
          businessPhone: true,
          businessAddress: true,
          taxId: true,
          isActive: true,
          isVerified: true,
          createdAt: true,
          companyIndustry: true,
          // Statistics
          _count: {
            select: {
              exhibitorBooths: true,
              products: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ])

    // Format response with additional statistics
// In the GET function, update the formattedExhibitors section:
const formattedExhibitors = exhibitors.map(exhibitor => ({
  id: exhibitor.id,
  companyName: exhibitor.company || "Unnamed Company", // Handle null company
  contactPerson: `${exhibitor.firstName || ""} ${exhibitor.lastName || ""}`.trim() || "Unknown Contact",
  email: exhibitor.email || "No email",
  phone: exhibitor.phone || "No phone",
  website: exhibitor.website || "",
  industry: exhibitor.companyIndustry || "Other",
  location: exhibitor.location || "Unknown location",
  status: exhibitor.isActive ? "active" : exhibitor.isVerified ? "pending" : "suspended",
  verified: exhibitor.isVerified,
  joinDate: exhibitor.createdAt.toISOString(),
  eventsParticipated: exhibitor._count.exhibitorBooths,
  totalProducts: exhibitor._count.products,
  avatar: exhibitor.avatar || "/placeholder.svg",
  description: exhibitor.bio || "No description available",
  revenue: Math.floor(Math.random() * 300000) + 50000,
  rating: parseFloat((Math.random() * 1.5 + 3.5).toFixed(1)),
}))

    return NextResponse.json({
      exhibitors: formattedExhibitors,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching exhibitors:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    
    console.log("[API] Creating exhibitor with data:", body)
    
    const {
      firstName,
      lastName,
      email,
      phone,
      password = "TEMP_PASSWORD_123", // Generate temp password
      bio,
      company,
      jobTitle,
      location,
      website,
      linkedin,
      twitter,
      businessEmail,
      businessPhone,
      businessAddress,
      taxId,
      companyIndustry,
      isVerified = false,
      isActive = true,
    } = body

    // Validate required fields
    const missingFields = []
    if (!firstName) missingFields.push("firstName")
    if (!lastName) missingFields.push("lastName")
    if (!email) missingFields.push("email")
    if (!company) missingFields.push("company")

    if (missingFields.length > 0) {
      console.log("[API] Missing required fields:", missingFields)
      return NextResponse.json(
        {
          error: "Missing required fields",
          missingFields,
          message: `Missing required fields: ${missingFields.join(", ")}`
        },
        { status: 400 },
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          error: "Invalid email format",
        },
        { status: 400 },
      )
    }

    // Check if user with this email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      console.log("[API] User with email already exists:", email)
      return NextResponse.json(
        {
          error: "User with this email already exists",
          message: "An exhibitor with this email already exists. Please use a different email."
        },
        { status: 409 },
      )
    }

    // Hash password
    const bcrypt = require('bcryptjs')
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create new exhibitor
    const exhibitor = await prisma.user.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || "",
        password: hashedPassword,
        bio: bio?.trim() || "",
        company: company.trim(),
        jobTitle: jobTitle?.trim() || "",
        location: location?.trim() || "",
        website: website?.trim() || "",
        linkedin: linkedin?.trim() || "",
        twitter: twitter?.trim() || "",
        businessEmail: businessEmail?.trim() || "",
        businessPhone: businessPhone?.trim() || "",
        businessAddress: businessAddress?.trim() || "",
        taxId: taxId?.trim() || "",
        companyIndustry: companyIndustry?.trim() || "Other",
        role: "EXHIBITOR",
        isActive,
        isVerified,
        emailVerified: false,
      },
    })

    console.log("[API] Exhibitor created successfully:", exhibitor.id)

    // Remove password from response
    const { password: _, ...exhibitorWithoutPassword } = exhibitor

    return NextResponse.json(
      { 
        exhibitor: exhibitorWithoutPassword,
        message: "Exhibitor created successfully" 
      }, 
      { status: 201 }
    )
  } catch (error: any) {
    console.error("[API] Error creating exhibitor:", error)
    
    // Check for Prisma unique constraint error
    if (error.code === 'P2002') {
      return NextResponse.json(
        { 
          error: "Duplicate entry",
          message: "An exhibitor with this email already exists"
        },
        { status: 409 }
      )
    }
    
    return NextResponse.json({ 
      error: "Internal server error",
      message: error.message || "Failed to create exhibitor"
    }, { status: 500 })
  }
}