import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  status: string
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const getStatusStyles = (status: string) => {
    switch (status.toLowerCase()) {
      case "trialing":
        return "bg-amber-100 text-amber-800 hover:bg-amber-100/80"
      case "active":
        return "bg-green-100 text-green-800 hover:bg-green-100/80"
      case "past_due":
        return "bg-orange-100 text-orange-800 hover:bg-orange-100/80"
      case "canceled":
        return "bg-gray-100 text-gray-800 hover:bg-gray-100/80"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100/80"
    }
  }

  const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
  }

  return (
    <Badge 
      variant="secondary" 
      className={cn(getStatusStyles(status))}
    >
      {formatStatus(status)}
    </Badge>
  )
}