import * as React from "react"
import { Button, type ButtonProps } from "@/components/ui/button"
import { Plus, PenSquare, Send } from "lucide-react"
import { cn } from "@/lib/utils"

interface CreateButtonProps extends ButtonProps {
  children?: React.ReactNode
  iconType?: "plus" | "pen" | "send" | "none"
  iconClassName?: string
}

export function CreateButton({ 
  children, 
  className, 
  iconType = "plus",
  iconClassName,
  ...props 
}: CreateButtonProps) {
  const getIcon = () => {
    switch (iconType) {
      case "pen":
        return <PenSquare className={cn("h-4 w-4 mr-2", iconClassName)} />
      case "send":
        return <Send className={cn("h-4 w-4 mr-2", iconClassName)} />
      case "plus":
        return <Plus className={cn("h-4 w-4 mr-2", iconClassName)} />
      default:
        return null
    }
  }

  return (
    <Button
      variant="default"
      className={cn(
        "bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white shadow-md hover:shadow-lg transition-all",
        className
      )}
      {...props}
    >
      {getIcon()}
      {children || "Create"}
    </Button>
  )
}
