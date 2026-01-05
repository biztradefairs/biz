import { v2 as cloudinary } from "cloudinary"

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
  secure: true,
})

export const Cloudinary = cloudinary

export interface CloudinaryUploadResult {
  asset_id: string
  public_id: string
  version: number
  version_id: string
  signature: string
  width: number
  height: number
  format: string
  resource_type: string
  created_at: string
  tags: string[]
  bytes: number
  type: string
  etag: string
  placeholder: boolean
  url: string
  secure_url: string
  folder: string
  original_filename: string
}

// Helper function to convert File to base64
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('Failed to convert file to base64'))
      }
    }
    reader.onerror = error => reject(error)
  })
}

export async function uploadToCloudinary(
  file: File,
  folder = "event-badges"
): Promise<CloudinaryUploadResult> {
  try {
    console.log(`Uploading to Cloudinary folder: ${folder}, file size: ${file.size} bytes`)
    
    // Convert File to base64
    const base64Image = await fileToBase64(file)
    
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        base64Image,
        {
          folder,
          resource_type: 'auto',
          allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'],
          transformation: [
            { width: 200, height: 200, crop: 'fill', quality: 'auto:best' }
          ],
          tags: ['event-badge', 'verified'],
          unique_filename: true,
          overwrite: false,
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error)
            reject(new Error(`Cloudinary upload failed: ${error.message}`))
          } else if (result) {
            console.log('Cloudinary upload success:', result.secure_url)
            resolve(result as unknown as CloudinaryUploadResult)
          } else {
            reject(new Error('Cloudinary returned no result'))
          }
        }
      )
    })
  } catch (error) {
    console.error('Error preparing file for upload:', error)
    throw new Error(`Failed to process file: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function deleteFromCloudinary(publicId: string) {
  try {
    console.log(`Deleting from Cloudinary: ${publicId}`)
    const result = await cloudinary.uploader.destroy(publicId)
    console.log('Cloudinary delete result:', result)
    return result
  } catch (error) {
    console.error("Error deleting from Cloudinary:", error)
    throw error
  }
}

// Helper to extract public ID from Cloudinary URL
export function extractPublicIdFromUrl(url: string): string | null {
  try {
    if (!url.includes('cloudinary.com')) return null
    
    const urlParts = url.split('/')
    const uploadIndex = urlParts.indexOf('upload')
    
    if (uploadIndex === -1) return null
    
    // Get the part after version number (e.g., v1234567890)
    const versionPart = urlParts[uploadIndex + 1]
    if (!versionPart.startsWith('v')) return null
    
    // Get everything after the upload/version/ part
    const publicIdWithExtension = urlParts.slice(uploadIndex + 2).join('/')
    
    // Remove file extension
    const publicId = publicIdWithExtension.split('.')[0]
    
    return publicId
  } catch (error) {
    console.error('Error extracting public ID:', error)
    return null
  }
}

// Upload base64 image (useful for client-side uploads)
export async function uploadBase64ToCloudinary(
  base64Image: string,
  folder = "event-badges"
): Promise<CloudinaryUploadResult> {
  try {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        base64Image,
        {
          folder,
          resource_type: 'image',
          allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'],
          transformation: [
            { width: 200, height: 200, crop: 'fill', quality: 'auto:best' }
          ],
          tags: ['event-badge', 'verified'],
          unique_filename: true,
          overwrite: false,
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error)
            reject(new Error(`Cloudinary upload failed: ${error.message}`))
          } else if (result) {
            resolve(result as unknown as CloudinaryUploadResult)
          } else {
            reject(new Error('Cloudinary returned no result'))
          }
        }
      )
    })
  } catch (error) {
    console.error('Error uploading base64 to Cloudinary:', error)
    throw error
  }
}