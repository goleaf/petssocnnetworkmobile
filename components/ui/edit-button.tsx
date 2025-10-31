import * as React from "react"
import { Button, type ButtonProps } from "@/components/ui/button"
import { Edit } from "lucide-react"
import { cn } from "@/lib/utils"

interface EditButtonProps extends ButtonProps {
  iconClassName?: string
}

export function EditButton({ children, className, iconClassName, asChild, ...props }: EditButtonProps) {
  // When asChild is true, we need to wrap children in a single element
  // because Slot (used by Button with asChild) requires exactly one child
  if (asChild) {
    const icon = <Edit className={cn("h-4 w-4 mr-2", iconClassName)} />
    
    return (
      <Button
        variant="default"
        className={cn(
          "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-md hover:shadow-lg transition-all",
          className
        )}
        asChild={asChild}
        {...props}
      >
        {React.Children.count(children) === 1 && React.isValidElement(children) ? (
          // If there's a single valid child (like Link), clone it and add the icon before its children
          React.cloneElement(children as React.ReactElement, {
            children: (
              <>
                {icon}
                {(children as React.ReactElement).props.children}
              </>
            ),
          })
        ) : (
          // If multiple children or no valid child, wrap in a span
          <span>
            {icon}
            {children || "Edit"}
          </span>
        )}
      </Button>
    )
  }

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
