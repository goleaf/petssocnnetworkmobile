"use client"
import { Shield, ShieldCheck, User } from "lucide-react"
import type { UserRole } from "@/lib/types"
import { Badge } from "@/components/ui/badge"

interface RoleBadgeProps {
  role?: UserRole
  size?: "sm" | "md"
}

export function RoleBadge({ role, size = "sm" }: RoleBadgeProps) {
  if (!role || role === "user") return null

  const roleConfig = {
    admin: {
      icon: ShieldCheck,
      label: "Admin",
      className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
    },
    moderator: {
      icon: Shield,
      label: "Moderator",
      className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    },
  }

  const config = roleConfig[role]
  if (!config) return null

  const Icon = config.icon
  const sizeClasses = size === "sm" ? "h-3 w-3" : "h-4 w-4"

  return (
    <Badge variant="outline" className={`${config.className} text-xs px-1.5 py-0.5 flex items-center gap-1`}>
      <Icon className={sizeClasses} />
      <span>{config.label}</span>
    </Badge>
  )
}



