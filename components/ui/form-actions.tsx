"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface FormActionsProps {
  onCancel?: () => void
  onSubmit?: () => void
  cancelLabel?: string
  submitLabel?: string
  isSubmitting?: boolean
  submittingLabel?: string
  disabled?: boolean
  className?: string
  align?: "left" | "right" | "center" | "between"
  fullWidth?: boolean
  showCancel?: boolean
}

export function FormActions({
  onCancel,
  onSubmit,
  cancelLabel = "Cancel",
  submitLabel = "Save Changes",
  isSubmitting = false,
  submittingLabel,
  disabled = false,
  className,
  align = "right",
  fullWidth = false,
  showCancel = true,
}: FormActionsProps) {
  const alignClasses = {
    left: "justify-start",
    right: "justify-end",
    center: "justify-center",
    between: "justify-between",
  }

  const submittingText = submittingLabel || (submitLabel.includes("Save") ? "Saving..." : "Submitting...")

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row gap-3",
        alignClasses[align],
        fullWidth && "w-full",
        className
      )}
    >
      {showCancel && onCancel && (
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting || disabled}
          className={cn(fullWidth ? "w-full" : "w-full sm:w-auto")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {cancelLabel}
        </Button>
      )}
      <Button
        type={onSubmit ? "button" : "submit"}
        onClick={onSubmit}
        disabled={isSubmitting || disabled}
        className={cn(fullWidth ? "w-full" : "w-full sm:w-auto")}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            {submittingText}
          </>
        ) : (
          <>
            <Save className="h-4 w-4 mr-2" />
            {submitLabel}
          </>
        )}
      </Button>
    </div>
  )
}

