import { Badge } from "@/components/ui/badge"
import { Mail, MessageSquare, MinusCircle } from "lucide-react"

interface ChannelBadgeProps {
  channel: "email" | "sms" | "both" | "none"
}

export function ChannelBadge({ channel }: ChannelBadgeProps) {
  const getChannelConfig = (channel: "email" | "sms" | "both" | "none") => {
    switch (channel) {
      case "email":
        return {
          icon: <Mail className="w-3 h-3" />,
          label: "Email"
        }
      case "sms":
        return {
          icon: <MessageSquare className="w-3 h-3" />,
          label: "SMS"
        }
      case "both":
        return {
          icon: (
            <>
              <Mail className="w-3 h-3" />
              <MessageSquare className="w-3 h-3" />
            </>
          ),
          label: "Email & SMS"
        }
      case "none":
        return {
          icon: <MinusCircle className="w-3 h-3" />,
          label: "None"
        }
    }
  }

  const config = getChannelConfig(channel)

  return (
    <Badge variant="outline" className="gap-1.5">
      {config.icon}
      {config.label}
    </Badge>
  )
}