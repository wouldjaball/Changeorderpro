import { Badge } from "@/components/ui/badge"

interface PlanBadgeProps {
  plan: string | null
}

export function PlanBadge({ plan }: PlanBadgeProps) {
  const formatPlan = (plan: string | null) => {
    if (!plan) return "No plan"
    
    switch (plan.toLowerCase()) {
      case "starter":
        return "Starter"
      case "growth":
        return "Growth"
      case "pro":
        return "Pro"
      case "enterprise":
        return "Enterprise"
      case "free_trial":
        return "Free Trial"
      default:
        return plan.charAt(0).toUpperCase() + plan.slice(1).toLowerCase()
    }
  }

  return (
    <Badge variant="outline">
      {formatPlan(plan)}
    </Badge>
  )
}