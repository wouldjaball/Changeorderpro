export function formatCurrency(amount: number | null): string {
  if (amount === null) return "—"
  
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount)
}

export function formatRelativeTime(date: string | null): string {
  if (!date) return "Never"
  
  const now = new Date()
  const targetDate = new Date(date)
  const diffMs = now.getTime() - targetDate.getTime()
  
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)
  const diffWeeks = Math.floor(diffDays / 7)
  const diffMonths = Math.floor(diffDays / 30)
  const diffYears = Math.floor(diffDays / 365)
  
  if (diffYears > 0) {
    return `${diffYears}y ago`
  } else if (diffMonths > 0) {
    return `${diffMonths}mo ago`
  } else if (diffWeeks > 0) {
    return `${diffWeeks}w ago`
  } else if (diffDays > 0) {
    return `${diffDays}d ago`
  } else if (diffHours > 0) {
    return `${diffHours}h ago`
  } else if (diffMinutes > 0) {
    return `${diffMinutes}m ago`
  } else {
    return "Just now"
  }
}

export function formatAbsoluteDate(date: string | null): string {
  if (!date) return "—"
  
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date))
}

export function daysSinceDate(dateStr: string | null): number {
  if (!dateStr) return 0
  const d = new Date(dateStr)
  const now = new Date()
  return Math.floor((now.getTime() - d.getTime()) / 86400000)
}

export function calculateDelta(current: number, previous: number): { 
  percentage: number
  direction: "up" | "down" | "flat" 
} {
  if (previous === 0) {
    return { percentage: 0, direction: "flat" }
  }
  
  const delta = current - previous
  const percentage = Math.round((delta / previous) * 100)
  
  if (percentage > 0) {
    return { percentage, direction: "up" }
  } else if (percentage < 0) {
    return { percentage: Math.abs(percentage), direction: "down" }
  } else {
    return { percentage: 0, direction: "flat" }
  }
}