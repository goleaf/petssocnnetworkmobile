"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, ExternalLink, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Product } from "@/lib/types"
import { getRecallById } from "@/lib/storage-products"

interface RecallBannerProps {
  product: Product
  className?: string
}

export function RecallBanner({ product, className }: RecallBannerProps) {
  if (!product.isRecalled || !product.recallNotice) {
    return null
  }

  const recall = product.recallId ? getRecallById(product.recallId) : null
  
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    } catch {
      return dateString
    }
  }

  return (
    <Alert
      variant="destructive"
      className={cn(
        "mb-6",
        "bg-red-50 dark:bg-red-950 border-red-500",
        className
      )}
    >
      <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
      <AlertTitle className="text-red-900 dark:text-red-100 font-semibold">
        ⚠️ Product Recall Notice
      </AlertTitle>
      <AlertDescription className="text-red-800 dark:text-red-200 mt-2">
        <p className="font-medium mb-2">This product has been recalled.</p>
        <p className="mb-3">{product.recallNotice}</p>
        
        {(recall?.recallDate || recall?.lotNumber) && (
          <div className="space-y-2 mt-3 pt-3 border-t border-red-300 dark:border-red-800">
            {recall.recallDate && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4" />
                <span className="font-medium">Recall Date:</span>
                <span>{formatDate(recall.recallDate)}</span>
              </div>
            )}
            {recall.lotNumber && (
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">Lot Number:</span>
                <span className="font-mono bg-red-100 dark:bg-red-900 px-2 py-1 rounded">
                  {recall.lotNumber}
                </span>
              </div>
            )}
          </div>
        )}
        
        {recall?.link && (
          <a
            href={recall.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-3 text-sm font-medium text-red-700 dark:text-red-300 hover:text-red-900 dark:hover:text-red-100 underline"
          >
            View Full Recall Details
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
      </AlertDescription>
    </Alert>
  )
}

