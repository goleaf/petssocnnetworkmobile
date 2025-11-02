"use client"

import type { MDXCallout, CalloutType } from "@/lib/types"
import { AlertCircle, CheckCircle2, Info, AlertTriangle, FileText } from "lucide-react"
import { cn } from "@/lib/utils"

// Re-export for convenience
export type { MDXCallout, CalloutType } from "@/lib/types"

interface CalloutProps {
  callout: MDXCallout
  className?: string
}

/**
 * MDX Callout Component
 * Renders different types of callouts: vet tips, safety warnings, checklists, etc.
 */
export function MDXCallout({ callout, className }: CalloutProps) {
  const getIcon = () => {
    switch (callout.type) {
      case "vet-tip":
        return <CheckCircle2 className="h-5 w-5" />
      case "safety-warning":
        return <AlertTriangle className="h-5 w-5" />
      case "checklist":
        return <FileText className="h-5 w-5" />
      case "info":
        return <Info className="h-5 w-5" />
      case "note":
        return <AlertCircle className="h-5 w-5" />
      default:
        return <Info className="h-5 w-5" />
    }
  }

  const getStyles = () => {
    switch (callout.type) {
      case "vet-tip":
        return {
          container: "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800",
          icon: "text-green-600 dark:text-green-400",
          title: "text-green-900 dark:text-green-100",
          content: "text-green-800 dark:text-green-200",
        }
      case "safety-warning":
        return {
          container: "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800",
          icon: "text-red-600 dark:text-red-400",
          title: "text-red-900 dark:text-red-100",
          content: "text-red-800 dark:text-red-200",
        }
      case "checklist":
        return {
          container: "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800",
          icon: "text-blue-600 dark:text-blue-400",
          title: "text-blue-900 dark:text-blue-100",
          content: "text-blue-800 dark:text-blue-200",
        }
      case "info":
        return {
          container: "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800",
          icon: "text-blue-600 dark:text-blue-400",
          title: "text-blue-900 dark:text-blue-100",
          content: "text-blue-800 dark:text-blue-200",
        }
      case "note":
        return {
          container: "bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800",
          icon: "text-yellow-600 dark:text-yellow-400",
          title: "text-yellow-900 dark:text-yellow-100",
          content: "text-yellow-800 dark:text-yellow-200",
        }
      default:
        return {
          container: "bg-gray-50 border-gray-200 dark:bg-gray-950 dark:border-gray-800",
          icon: "text-gray-600 dark:text-gray-400",
          title: "text-gray-900 dark:text-gray-100",
          content: "text-gray-800 dark:text-gray-200",
        }
    }
  }

  const styles = getStyles()

  return (
    <div
      className={cn(
        "rounded-lg border p-4 my-4",
        styles.container,
        className
      )}
    >
      <div className="flex gap-3">
        <div className={cn("flex-shrink-0 mt-0.5", styles.icon)}>
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          {callout.title && (
            <h4 className={cn("font-semibold mb-2", styles.title)}>
              {callout.title}
            </h4>
          )}
          {callout.type === "checklist" && callout.items ? (
            <ul className={cn("space-y-2 list-none", styles.content)}>
              {callout.items.map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle2 className={cn("h-4 w-4 mt-0.5 flex-shrink-0", styles.icon)} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className={cn("prose prose-sm max-w-none", styles.content)}>
              <p className="whitespace-pre-wrap">{callout.content}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Vet Tip Callout (convenience component)
 */
export function VetTip({ title, content, className }: { title?: string; content: string; className?: string }) {
  return (
    <MDXCallout
      callout={{ type: "vet-tip", title, content }}
      className={className}
    />
  )
}

/**
 * Safety Warning Callout (convenience component)
 */
export function SafetyWarning({ title, content, className }: { title?: string; content: string; className?: string }) {
  return (
    <MDXCallout
      callout={{ type: "safety-warning", title, content }}
      className={className}
    />
  )
}

/**
 * Checklist Callout (convenience component)
 */
export function Checklist({ title, items, className }: { title?: string; items: string[]; className?: string }) {
  return (
    <MDXCallout
      callout={{ type: "checklist", title, content: "", items }}
      className={className}
    />
  )
}

/**
 * Render MDX callouts from blog post content
 */
export function MDXCalloutsRenderer({ callouts }: { callouts: MDXCallout[] }) {
  if (!callouts || callouts.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      {callouts.map((callout, index) => (
        <MDXCallout key={index} callout={callout} />
      ))}
    </div>
  )
}

