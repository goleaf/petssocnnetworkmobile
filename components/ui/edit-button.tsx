import * as React from "react"
import { Button, type ButtonProps } from "@/components/ui/button"
import { Edit } from "lucide-react"
import { cn } from "@/lib/utils"

interface EditButtonProps extends ButtonProps {
  children?: React.ReactNode
  iconClassName?: string
}

export function EditButton({ children, className, iconClassName, ...props }: EditButtonProps) {
  return (
    <Button
      variant="default"
      className={cn(
        "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-md hover:shadow-lg transition-all",
        className
      )}
      {...props}
    >
      <Edit className={cn("h-4 w-4 mr-2", iconClassName)} />
      {children || "Edit"}
    </Button>
  )
}
