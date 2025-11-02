"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SparklineChart } from "@/components/dashboard/sparkline-chart"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export interface DashboardCardProps {
  title: string
  count: number
  trend: number[]
  href: string
  icon: LucideIcon
  className?: string
}

export function DashboardCard({
  title,
  count,
  trend,
  href,
  icon: Icon,
  className,
}: DashboardCardProps) {
  return (
    <Link href={href} className="block">
      <Card className={cn("hover:shadow-lg transition-shadow", className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold mb-2">{count.toLocaleString()}</div>
          <div className="h-[60px]">
            <SparklineChart data={trend} />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

