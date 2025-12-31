// app/api/auth/forgot-password/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"
import { z } from "zod"
import { sendPasswordResetEmail } from "@/lib/email-service1"

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
})

// Role display names
const roleDisplayNames: Record<string, string> = {
  ATTENDEE: "Visitor",
  ORGANIZER: "Organizer",
  EXHIBITOR: "Exhibitor",
  SPEAKER: "Speaker",
  VENUE_MANAGER: "Venue Manager",
  ADMIN: "Admin"
}
const getISTTime = () => {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffset);
  return istTime.toISOString().replace('T', ' ').substring(0, 19) + ' IST';
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const { email } = forgotPasswordSchema.parse(body)
    const emailLower = email.toLowerCase().trim()

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { 
        email: emailLower,
        isActive: true 
      }
    })

    console.log("🔍 Checking user for email:", emailLower)
    console.log("📊 User found:", user ? "Yes" : "No")

    if (!user) {
      // Return error if user doesn't exist
      return NextResponse.json(
        { 
          success: false, 
          error: "No account found with this email address. Please check your email or sign up."
        },
        { status: 404 }
      )
    }

    // Check if user is verified (optional but recommended)
    if (!user.emailVerified) {
      return NextResponse.json(
        { 
          success: false,
          error: "Email not verified. Please verify your email first."
        },
        { status: 403 }
      )
    }

    // Check if user has too many password reset attempts (security measure)
    const maxResetAttempts = 5
    if (user.passwordResetAttempts && user.passwordResetAttempts >= maxResetAttempts) {
      return NextResponse.json(
        { 
          success: false,
          error: "Too many password reset attempts. Please try again later or contact support."
        },
        { status: 429 }
      )
    }

    // Get user role display name
    const userRole = roleDisplayNames[user.role] || user.role

    // Create password reset token
    const resetToken = crypto.randomBytes(32).toString("hex")
    const resetTokenExpiry = new Date(Date.now() + 1 * 60 * 60 * 1000) // 1 hour

    // Save reset token in database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
        loginAttempts: 0, // Reset login attempts
        passwordResetAttempts: {
          increment: 1
        },
        updatedAt: new Date()
      }
    })

    console.log("✅ Reset token generated for user:", {
      email: user.email,
      role: user.role,
      name: `${user.firstName} ${user.lastName}`
    })

    // Send password reset email with user info
    try {
      await sendPasswordResetEmail(
        email, 
        resetToken, 
        user.firstName,
        userRole,
        `${user.firstName} ${user.lastName}`
      )
      console.log("📧 Password reset email sent to:", email)
      console.log(`⏰ Request received at: ${getISTTime()}`);
console.log(`🔍 Checking user for email: ${emailLower}`);
    } catch (emailError) {
      console.error("❌ Failed to send reset email:", emailError)
      
      // If email fails, clear the reset token
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken: null,
          resetTokenExpiry: null,
        }
      })
      
      return NextResponse.json(
        { 
          success: false,
          error: "Failed to send reset email. Please try again later."
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Password reset link has been sent to your email.",
      userInfo: {
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        role: userRole
      }
    })

  } catch (error: any) {
    console.error("❌ Forgot password error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false,
          error: "Validation failed", 
          details: error.errors.map(e => `${e.path.join(".")}: ${e.message}`).join(", ")
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        success: false,
        error: "Failed to process password reset request. Please try again."
      },
      { status: 500 }
    )
  }
}