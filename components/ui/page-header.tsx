import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { ReactNode } from "react"

interface PageHeaderProps {
  title: string | ReactNode
  description?: string
  icon?: LucideIcon
  className?: string
}

export function PageHeader({ title, description, icon: Icon, className }: PageHeaderProps) {
  return (
    <div className={cn("mb-8", className)}>
      <h1 className="text-4xl font-bold mb-2">{title}</h1>
      {description && <p className="text-muted-foreground text-lg">{description}</p>}
    </div>
  )
}
