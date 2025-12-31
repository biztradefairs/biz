// app/api/auth/reset-password/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  email: z.string().email("Invalid email address"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, email, password } = resetPasswordSchema.parse(body)

    // Find user with valid reset token
    const user = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date() // Token not expired
        },
        isActive: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { 
          success: false,
          error: "Invalid or expired reset token. Please request a new password reset." 
        },
        { status: 400 }
      )
    }

    // Check if new password is same as old password (optional)
    const isSamePassword = await bcrypt.compare(password, user.password)
    if (isSamePassword) {
      return NextResponse.json(
        { 
          success: false,
          error: "New password cannot be the same as old password" 
        },
        { status: 400 }
      )
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Update user password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
        loginAttempts: 0,
        passwordResetAttempts: 0,
        lastPasswordChange: new Date(),
        updatedAt: new Date()
      }
    })

    console.log("✅ Password reset successful for:", user.email)

    // Send password changed notification
    await sendPasswordChangedNotification(email, user.firstName, user.role)

    return NextResponse.json({
      success: true,
      message: "Password has been reset successfully. You can now login with your new password."
    })

  } catch (error: any) {
    console.error("❌ Reset password error:", error)

    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map((err: any) => 
        `${err.path.join(".")}: ${err.message}`
      ).join(", ")
      
      return NextResponse.json(
        { 
          success: false,
          error: "Validation failed", 
          details: errorMessages 
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        success: false,
        error: "Failed to reset password. Please try again." 
      },
      { status: 500 }
    )
  }
}

async function sendPasswordChangedNotification(email: string, firstName: string, role: string) {
  console.log(`✅ Password changed for ${role}: ${email} (${firstName})`)
  // You can implement email notification here if needed
}