import * as React from "react"
import { Button, type ButtonProps } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface DeleteButtonProps extends ButtonProps {
  children?: React.ReactNode
  iconClassName?: string
  showIcon?: boolean
}

export function DeleteButton({ 
  children, 
  className, 
  iconClassName,
  showIcon = true,
  ...props 
}: DeleteButtonProps) {
  return (
    <Button
      variant="destructive"
      className={cn(
        "bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white shadow-md hover:shadow-lg transition-all",
        className
      )}
      {...props}
    >
      {showIcon && <Trash2 className={cn("h-4 w-4 mr-2", iconClassName)} />}
      {children || "Delete"}
    </Button>
  )
}
