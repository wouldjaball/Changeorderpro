import { TrendingUp, TrendingDown } from "lucide-react"

interface DeltaIndicatorProps {
  current: number
  previous: number
}

export function DeltaIndicator({ current, previous }: DeltaIndicatorProps) {
  if (previous === 0) {
    return <span className="text-xs text-muted-foreground">—</span>
  }

  const delta = current - previous
  const percentage = Math.round((delta / previous) * 100)

  if (percentage === 0) {
    return <span className="text-xs text-muted-foreground">—</span>
  }

  const isPositive = percentage > 0

  return (
    <div className={`flex items-center gap-1 text-xs ${
      isPositive ? "text-green-600" : "text-red-600"
    }`}>
      {isPositive ? (
        <TrendingUp className="w-3 h-3" />
      ) : (
        <TrendingDown className="w-3 h-3" />
      )}
      <span>
        {isPositive ? "↑" : "↓"}{Math.abs(percentage)}%
      </span>
    </div>
  )
}