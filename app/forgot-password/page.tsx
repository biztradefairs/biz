// app/forgot-password/page.tsx
"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Mail, ArrowLeft, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Basic validation
    if (!email.trim()) {
      setError("Please enter your email address")
      return
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address")
      return
    }

    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim() }),
      })

      const data = await response.json()

      if (response.ok) {
        if (data.success) {
          setSuccess(data.message || "Password reset link sent successfully!")
          setIsSubmitted(true)
        } else {
          setError(data.error || "Something went wrong. Please try again.")
        }
      } else {
        // Handle different error statuses
        if (response.status === 404) {
          setError("No account found with this email address.")
        } else if (response.status === 403) {
          setError("Email not verified. Please verify your email first.")
        } else if (response.status === 429) {
          setError("Too many reset attempts. Please try again later.")
        } else if (response.status === 400) {
          setError(data.details || "Invalid email format.")
        } else {
          setError(data.error || "Failed to send reset link. Please try again.")
        }
      }
    } catch (err) {
      console.error("Forgot password error:", err)
      setError("Network error. Please check your connection and try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleTryAgain = () => {
    setIsSubmitted(false)
    setError("")
    setSuccess("")
    setEmail("")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center py-12 px-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="text-center pb-4 space-y-2">
          <Link 
            href="/login" 
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Login
          </Link>
          
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-gray-900">
              {isSubmitted ? "Check Your Email" : "Forgot Password?"}
            </h1>
            
            <p className="text-sm text-gray-600">
              {isSubmitted
                ? "We've sent password reset instructions to your email."
                : "Enter your email to receive a password reset link."}
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {!isSubmitted ? (
            <>
              {/* Error Alert */}
              {error && (
                <Alert variant="destructive" className="animate-in fade-in">
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Success Alert (from previous attempts) */}
              {success && !isSubmitted && (
                <Alert className="bg-green-50 border-green-200 animate-in fade-in">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    {success}
                  </AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email Field */}
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      name="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        setError("") // Clear error when user types
                      }}
                      className="pl-10"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-2.5 transition-all"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Checking Email...
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>
              </form>

              {/* Additional Info */}
              <div className="text-center space-y-2">
                <p className="text-xs text-gray-500">
                  Make sure to enter the email address associated with your account.
                </p>
              </div>
            </>
          ) : (
            <div className="space-y-4 animate-in fade-in">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                
                {/* Success Message */}
                {success && (
                  <Alert className="mb-4 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                    <AlertDescription className="text-green-800 text-center">
                      {success}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <Mail className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-blue-900">Email sent to:</p>
                      <p className="text-sm text-blue-700 break-all">{email}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 text-left">
                  <div className="flex items-start space-x-2">
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    </div>
                    <p className="text-sm text-gray-600">
                      Check your inbox for the password reset email
                    </p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    </div>
                    <p className="text-sm text-gray-600">
                      The link will expire in 1 hour for security
                    </p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    </div>
                    <p className="text-sm text-gray-600">
                      Didn't receive it? Check your spam folder
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                <button
                  onClick={handleTryAgain}
                  className="w-full text-center text-blue-600 hover:text-blue-800 font-medium transition-colors"
                >
                  Try with a different email
                </button>
                
                <div className="text-center pt-2 border-t">
                  <Link 
                    href="/login" 
                    className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Remember your password? <span className="font-medium">Sign in</span>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Back to Login Link (when not submitted) */}
          {!isSubmitted && (
            <div className="text-center pt-4 border-t">
              <p className="text-sm text-gray-600">
                Remember your password?{" "}
                <Link 
                  href="/login" 
                  className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}