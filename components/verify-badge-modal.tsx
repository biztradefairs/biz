// components/verify-badge-modal.tsx
"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import { Loader2, Upload, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface VerifyBadgeModalProps {
  isOpen: boolean
  onClose: () => void
  eventId: string
  eventTitle: string
  onVerifyComplete: (isVerified: boolean, badgeImage?: string) => void
  currentStatus: boolean
  currentBadgeImage?: string
}

const BADGE_OPTIONS = [
  {
    id: "default",
    label: "Default Verified Badge",
    imageUrl: "/badge/VerifiedBADGE (1).png",
    description: "Standard verification badge"
  },
  {
    id: "premium",
    label: "Premium Verified Badge",
    imageUrl: "/badge/premium-badge.png", // You can upload this to Cloudinary
    description: "For premium events"
  },
  {
    id: "featured",
    label: "Featured Verified Badge",
    imageUrl: "/badge/featured-badge.png", // You can upload this to Cloudinary
    description: "For featured events"
  },
  {
    id: "custom",
    label: "Upload Custom Badge",
    imageUrl: "",
    description: "Upload your own badge image"
  }
]

export function VerifyBadgeModal({
  isOpen,
  onClose,
  eventId,
  eventTitle,
  onVerifyComplete,
  currentStatus,
  currentBadgeImage
}: VerifyBadgeModalProps) {
  const [selectedOption, setSelectedOption] = useState<string>(
    currentBadgeImage ? "custom" : "default"
  )
  const [customImage, setCustomImage] = useState<File | null>(null)
  const [previewImage, setPreviewImage] = useState<string>(
    currentBadgeImage || "/badge/VerifiedBADGE (1).png"
  )
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please upload an image file",
          variant: "destructive"
        })
        return
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File too large",
          description: "Please upload an image smaller than 5MB",
          variant: "destructive"
        })
        return
      }
      
      setCustomImage(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviewImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleVerify = async () => {
    if (selectedOption === "custom" && !customImage && !currentBadgeImage) {
      toast({
        title: "Custom image required",
        description: "Please upload a custom badge image",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    try {
      let badgeImageUrl = ""

      // If custom image is selected, upload it to Cloudinary
      if (selectedOption === "custom" && customImage) {
        const formData = new FormData()
        formData.append('file', customImage)
        formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'verified_badges')
        
        const uploadResponse = await fetch(
          `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
          {
            method: 'POST',
            body: formData
          }
        )
        
        if (!uploadResponse.ok) {
          throw new Error('Failed to upload image')
        }
        
        const uploadData = await uploadResponse.json()
        badgeImageUrl = uploadData.secure_url
      } else if (selectedOption !== "custom") {
        // Use the selected badge option
        const selectedBadge = BADGE_OPTIONS.find(opt => opt.id === selectedOption)
        badgeImageUrl = selectedBadge?.imageUrl || "/badge/VerifiedBADGE (1).png"
      } else {
        // Keep existing badge image
        badgeImageUrl = currentBadgeImage || ""
      }

      // Call the verification API
      const response = await fetch(`/api/admin/events/${eventId}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isVerified: true,
          badgeImage: badgeImageUrl
        })
      })

      if (!response.ok) {
        throw new Error('Failed to verify event')
      }

      const result = await response.json()
      
      toast({
        title: "Event Verified",
        description: `${eventTitle} has been verified successfully`,
      })

      onVerifyComplete(true, badgeImageUrl)
      onClose()
    } catch (error) {
      console.error('Error verifying event:', error)
      toast({
        title: "Verification Failed",
        description: "Failed to verify the event. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveVerification = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/events/${eventId}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isVerified: false,
          badgeImage: null
        })
      })

      if (!response.ok) {
        throw new Error('Failed to remove verification')
      }

      toast({
        title: "Verification Removed",
        description: `${eventTitle} verification has been removed`,
      })

      onVerifyComplete(false)
      onClose()
    } catch (error) {
      console.error('Error removing verification:', error)
      toast({
        title: "Operation Failed",
        description: "Failed to remove verification. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {currentStatus ? "Update Verification" : "Verify Event"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Preview Section */}
          <div className="flex flex-col items-center justify-center p-4 border rounded-lg">
            <div className="relative mb-4">
              <img
                src={previewImage}
                alt="Badge Preview"
                className="w-24 h-24 object-contain"
                onError={(e) => {
                  e.currentTarget.src = "/badge/VerifiedBADGE (1).png"
                }}
              />
              {currentStatus && (
                <Badge className="absolute -top-2 -right-2 bg-green-500">
                  Currently Verified
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-600 text-center">
              This badge will appear next to your event
            </p>
          </div>

          {/* Badge Options */}
          <div className="space-y-3">
            <Label>Select Badge Type</Label>
            <RadioGroup value={selectedOption} onValueChange={setSelectedOption}>
              {BADGE_OPTIONS.map((option) => (
                <div key={option.id} className="flex items-center space-x-3 space-y-2">
                  <RadioGroupItem value={option.id} id={option.id} />
                  <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{option.label}</p>
                        <p className="text-xs text-gray-500">{option.description}</p>
                      </div>
                      {option.imageUrl && option.id !== "custom" && (
                        <img
                          src={option.imageUrl}
                          alt={option.label}
                          className="w-10 h-10 object-contain"
                        />
                      )}
                    </div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Custom Image Upload */}
          {selectedOption === "custom" && (
            <div className="space-y-2">
              <Label>Upload Custom Badge</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                {customImage || currentBadgeImage ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <img
                        src={previewImage}
                        alt="Custom badge"
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div>
                        <p className="text-sm font-medium truncate">
                          {customImage?.name || "Current Badge"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {customImage ? `${(customImage.size / 1024).toFixed(1)} KB` : "Uploaded"}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setCustomImage(null)
                        setPreviewImage("/badge/VerifiedBADGE (1).png")
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">
                      Click to upload custom badge
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PNG, JPG up to 5MB
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      id="custom-badge-upload"
                    />
                    <Button
                      variant="outline"
                      className="mt-2"
                      onClick={() => document.getElementById('custom-badge-upload')?.click()}
                    >
                      Choose File
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          {currentStatus ? (
            <>
              <Button
                variant="destructive"
                onClick={handleRemoveVerification}
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Remove Verification
              </Button>
              <Button onClick={handleVerify} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Verification
              </Button>
            </>
          ) : (
            <Button onClick={handleVerify} disabled={isLoading} className="w-full">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verify Event
            </Button>
          )}
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}