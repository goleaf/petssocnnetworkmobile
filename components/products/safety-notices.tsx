"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ShieldCheck, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Product } from "@/lib/types"

interface SafetyNoticesProps {
  product: Product
  className?: string
}

export function SafetyNotices({ product, className }: SafetyNoticesProps) {
  if (!product.safetyNotices || product.safetyNotices.length === 0) {
    return null
  }

  return (
    <Alert
      variant="default"
      className={cn(
        "mb-6",
        "bg-blue-50 dark:bg-blue-950 border-blue-500",
        className
      )}
    >
      <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
      <AlertTitle className="text-blue-900 dark:text-blue-100 font-semibold">
        Safety Information
      </AlertTitle>
      <AlertDescription className="text-blue-800 dark:text-blue-200 mt-2">
        <ul className="list-disc list-inside space-y-1">
          {product.safetyNotices.map((notice, index) => (
            <li key={index}>{notice}</li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  )
}

