// app/api/auth/verify-reset-token/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const verifyTokenSchema = z.object({
  token: z.string().min(1, "Token is required"),
  email: z.string().email("Invalid email address"),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, email } = verifyTokenSchema.parse(body)

    // Find user with valid reset token
    const user = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date() // Token not expired
        },
        isActive: true
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        resetTokenExpiry: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { 
          success: false,
          valid: false, 
          error: "Invalid or expired reset token" 
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      valid: true,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      role: user.role,
      userId: user.id,
      expiresAt: user.resetTokenExpiry
    })

  } catch (error: any) {
    console.error("Verify token error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false,
          valid: false, 
          error: "Validation failed", 
          details: error.errors 
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        success: false,
        valid: false, 
        error: "Failed to verify token" 
      },
      { status: 500 }
    )
  }
}