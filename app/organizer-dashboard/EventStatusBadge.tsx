// app/components/organizer/EventStatusBadge.tsx
"use client"

import { Badge } from "@/components/ui/badge"
import { Clock, CheckCircle, XCircle, AlertCircle, Eye, Loader2 } from "lucide-react"

interface EventStatusBadgeProps {
  status: string
  className?: string
}

export function EventStatusBadge({ status, className = "" }: EventStatusBadgeProps) {
  const getStatusConfig = (status: string) => {
    switch (status.toUpperCase()) {
      case "DRAFT":
        return {
          label: "Draft",
          variant: "outline" as const,
          icon: <Eye className="w-3 h-3 mr-1" />,
          color: "text-gray-600"
        }
      case "PENDING_APPROVAL":
        return {
          label: "Pending Approval",
          variant: "secondary" as const,
          icon: <Clock className="w-3 h-3 mr-1 animate-pulse" />,
          color: "text-yellow-600"
        }
      case "PUBLISHED":
        return {
          label: "Published",
          variant: "default" as const,
          icon: <CheckCircle className="w-3 h-3 mr-1" />,
          color: "text-green-600"
        }
      case "REJECTED":
        return {
          label: "Rejected",
          variant: "destructive" as const,
          icon: <XCircle className="w-3 h-3 mr-1" />,
          color: "text-red-600"
        }
      case "CANCELLED":
        return {
          label: "Cancelled",
          variant: "destructive" as const,
          icon: <XCircle className="w-3 h-3 mr-1" />,
          color: "text-red-600"
        }
      case "COMPLETED":
        return {
          label: "Completed",
          variant: "default" as const,
          icon: <CheckCircle className="w-3 h-3 mr-1" />,
          color: "text-blue-600"
        }
      default:
        return {
          label: status.replace("_", " "),
          variant: "outline" as const,
          icon: <AlertCircle className="w-3 h-3 mr-1" />,
          color: "text-gray-600"
        }
    }
  }

  const config = getStatusConfig(status)

  return (
    <Badge 
      variant={config.variant} 
      className={`flex items-center ${className}`}
    >
      {config.icon}
      {config.label}
    </Badge>
  )
}