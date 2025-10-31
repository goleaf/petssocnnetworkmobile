"use client"

import { Card, CardContent } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  iconBgColor?: string
  iconColor?: string
  valueColor?: string
  className?: string
}

export function StatCard({
  label,
  value,
  icon: Icon,
  iconBgColor = "bg-gray-100 dark:bg-gray-900/20",
  iconColor = "text-gray-600 dark:text-gray-400",
  valueColor,
  className,
}: StatCardProps) {
  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-lg", iconBgColor)}>
            <Icon className={cn("h-5 w-5", iconColor)} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className={cn("text-2xl font-bold", valueColor)}>
              {typeof value === "number" ? value.toLocaleString() : value}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
