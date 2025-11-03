"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { 
  AlertTriangle, 
  Home, 
  RefreshCw, 
  ArrowLeft, 
  RefreshCcw, 
  Trash2, 
  Clock, 
  Info, 
  Loader2,
  AlertCircle,
  Search,
  Globe,
  LucideIcon
} from "lucide-react"
import { Button } from "@/components/ui/button"

export type ErrorType = "500" | "404" | "global"

export interface ErrorConfig {
  type: ErrorType
  code: string
  title: string
  description: string
  icon: LucideIcon
  suggestions: {
    title: string
    items: Array<{
      icon?: LucideIcon
      text: string
    }>
  }
  whatHappened?: {
    title: string
    text: string
  }
  showReset?: boolean
  showGoBack?: boolean
}

const errorConfigs: Record<ErrorType, ErrorConfig> = {
  "500": {
    type: "500",
    code: "500",
    title: "Internal Server Error",
    description: "We're sorry, but something unexpected happened on our end. Don't worry, we're here to help you get back on track.",
    icon: AlertTriangle,
    suggestions: {
      title: "What you can do:",
      items: [
        { text: "Try refreshing the page - this often resolves temporary issues" },
        { text: "Clear your browser cache and cookies, then try again" },
        { text: "Wait a few moments and try again - the issue might be temporary" },
        { text: "Return to the homepage and navigate from there" }
      ]
    },
    showReset: true,
    showGoBack: true
  },
  "404": {
    type: "404",
    code: "404",
    title: "Oops! Page Not Found",
    description: "The page you're looking for doesn't exist, has been moved, or is temporarily unavailable.",
    icon: Search,
    suggestions: {
      title: "What you can do:",
      items: [
        { text: "Check the URL for typos or spelling errors" },
        { text: "Go back to the previous page using your browser's back button" },
        { text: "Return to the homepage and navigate from there" },
        { text: "Use the search feature to find what you're looking for" }
      ]
    },
    showGoBack: true
  },
  "global": {
    type: "global",
    code: "",
    title: "Critical Error Occurred",
    description: "A critical error has occurred that prevented the application from loading properly. We apologize for the inconvenience.",
    icon: AlertCircle,
    suggestions: {
      title: "If this problem persists, try:",
      items: [
        { icon: RefreshCcw, text: "Refresh your browser completely (Ctrl+F5 or Cmd+Shift+R)" },
        { icon: Trash2, text: "Clear your browser cache and cookies" },
        { icon: Globe, text: "Try using a different browser" },
        { icon: Clock, text: "Wait a few minutes and try again" }
      ]
    },
    whatHappened: {
      title: "What happened?",
      text: "A critical error occurred that prevented the entire application from loading. This is a root-level error that affects the core functionality. The error has been logged and our team will investigate. Your data is safe."
    },
    showReset: true
  }
}

interface ErrorDisplayProps {
  errorType: ErrorType
  error?: Error & { digest?: string }
  reset?: () => void
}

export default function ErrorDisplay({ errorType, error, reset }: ErrorDisplayProps) {
  const [countdown, setCountdown] = useState(10)
  const config = errorConfigs[errorType]
  const IconComponent = config.icon

  useEffect(() => {
    if (error) {
      // Log the error to an error reporting service
      console.error(`${errorType} error:`, error)
    }
  }, [error, errorType])

  useEffect(() => {
    // Countdown timer
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 0) {
          return 10
        }
        return prev - 1
      })
    }, 1000)

    // Auto-refresh every 10 seconds
    const refreshInterval = setInterval(() => {
      window.location.reload()
    }, 10000)

    // Cleanup intervals on unmount
    return () => {
      clearInterval(countdownInterval)
      clearInterval(refreshInterval)
    }
  }, [])

  const renderContent = () => (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-background via-background to-muted/20">
      <div className="max-w-4xl w-full space-y-8 py-4 md:py-8">
        {/* Header with Icon on Left */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-3 md:gap-4">
          {/* Error Icon */}
          <div className="flex-shrink-0 inline-flex items-center justify-center w-24 h-24 md:w-32 md:h-32 rounded-full bg-destructive/10 dark:bg-destructive/20">
            <IconComponent className="w-12 h-12 md:w-16 md:h-16 text-destructive" strokeWidth={1.5} />
          </div>
          
          {/* Error Message */}
          <div className="flex-1 text-center md:text-left space-y-4">
            {config.code && (
              <h1 className={`font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-destructive ${
                errorType === "500" || errorType === "404" 
                  ? "text-6xl md:text-8xl" 
                  : "text-4xl md:text-5xl"
              }`}>
                {config.code}
              </h1>
            )}
            
            <h2 className={`font-bold text-foreground ${
              errorType === "500" || errorType === "404" 
                ? "text-2xl md:text-3xl" 
                : "text-xl md:text-2xl"
            }`}>
              {config.title}
            </h2>
            
            <p className="text-base md:text-lg text-muted-foreground">
              {config.description}
            </p>
            
            <div className="flex items-center gap-2 text-sm md:text-base text-primary">
              {countdown === 0 ? (
                <>
                  <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
                  <span>Refreshing... Please wait</span>
                </>
              ) : (
                <>
                  <Clock className="w-4 h-4 md:w-5 md:h-5" />
                  <span>Auto-refreshing in {countdown} seconds...</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Error Details (only in development) */}
        {process.env.NODE_ENV === "development" && error?.message && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 md:p-6 text-left">
            <p className="text-sm md:text-base font-semibold text-destructive mb-2">
              Error Details (Development Only):
            </p>
            <p className="text-xs md:text-sm text-muted-foreground font-mono break-all">
              {error.message}
            </p>
            {error.digest && (
              <p className="text-xs text-muted-foreground mt-2">
                Error ID: {error.digest}
              </p>
            )}
          </div>
        )}

        {/* What Happened Section (for global errors) */}
        {config.whatHappened && (
          <div className="bg-card border rounded-lg p-4 md:p-6 space-y-4 text-left">
            <h3 className="text-base md:text-lg font-semibold text-foreground flex items-center gap-2">
              <IconComponent className="w-5 h-5 text-destructive" />
              {config.whatHappened.title}
            </h3>
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                {config.whatHappened.text}
              </p>
            </div>
          </div>
        )}

        {/* Helpful Suggestions */}
        <div className="bg-card border rounded-lg p-4 md:p-6 space-y-4 text-left">
          <h3 className="text-base md:text-lg font-semibold text-foreground flex items-center gap-2">
            <IconComponent className="w-5 h-5 text-destructive" />
            {config.suggestions.title}
          </h3>
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <ul className="space-y-3 text-sm md:text-base text-muted-foreground flex-1">
              {config.suggestions.items.map((item, index) => {
                const ItemIcon = item.icon
                return (
                  <li key={index} className="flex items-start gap-3">
                    {ItemIcon ? (
                      <ItemIcon className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    ) : (
                      <span className="text-primary mt-0.5">•</span>
                    )}
                    <span>{item.text}</span>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
          {config.showReset && reset && (
            <Button onClick={reset} size="lg" className="w-full sm:w-auto">
              <RefreshCw className="w-5 h-5 mr-2" />
              {errorType === "global" ? "Reload Application" : "Try Again"}
            </Button>
          )}
          
          <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
            <Link href="/">
              <Home className="w-5 h-5 mr-2" />
              {errorType === "global" ? "Go to Homepage" : "Go Home"}
            </Link>
          </Button>
          
          {config.showGoBack && (
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Go Back
            </Button>
          )}
        </div>
      </div>
    </div>
  )

  // Global error needs html/body wrapper
  if (errorType === "global") {
    return (
      <html lang="en">
        <body className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-background via-background to-destructive/5">
          {renderContent()}
        </body>
      </html>
    )
  }

  return renderContent()
}

