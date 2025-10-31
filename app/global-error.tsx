"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertCircle, Home, RefreshCw, RefreshCcw, Trash2, Clock, Info, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Global application error:", error)
  }, [error])

  useEffect(() => {
    // Auto-refresh every second
    const interval = setInterval(() => {
      window.location.reload()
    }, 1000)

    // Cleanup interval on unmount
    return () => clearInterval(interval)
  }, [])

  return (
    <html lang="en">
      <body className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-background via-background to-destructive/5">
        <div className="max-w-4xl w-full space-y-8 py-4 md:py-8">
          {/* Header with Icon on Left */}
          <div className="flex flex-col md:flex-row items-center md:items-start gap-3 md:gap-4">
            {/* Error Icon */}
            <div className="flex-shrink-0 inline-flex items-center justify-center w-24 h-24 md:w-32 md:h-32 rounded-full bg-destructive/10 dark:bg-destructive/20">
              <AlertCircle className="w-12 h-12 md:w-16 md:h-16 text-destructive" strokeWidth={1.5} />
            </div>
            
            {/* Error Message */}
            <div className="flex-1 text-center md:text-left space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold text-foreground">
                Critical Error Occurred
              </h1>
              
              <p className="text-base md:text-lg text-muted-foreground">
                A critical error has occurred that prevented the application from loading properly.
                We apologize for the inconvenience.
              </p>
            </div>
          </div>

          {/* Error Details (only in development) */}
          {process.env.NODE_ENV === "development" && error.message && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 md:p-6 text-left">
              <p className="text-sm md:text-base font-semibold text-destructive mb-2">Error Details (Development Only):</p>
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

          {/* What Happened Section */}
          <div className="bg-card border rounded-lg p-4 md:p-6 space-y-4 text-left">
            <h3 className="text-base md:text-lg font-semibold text-foreground flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              What happened?
            </h3>
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                A critical error occurred that prevented the entire application from loading. This is a root-level
                error that affects the core functionality. The error has been logged and our team will investigate.
                Your data is safe.
              </p>
            </div>
          </div>

          {/* Help Section */}
          <div className="bg-card border rounded-lg p-4 md:p-6 space-y-4 text-left">
            <h3 className="text-base md:text-lg font-semibold text-foreground flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              If this problem persists, try:
            </h3>
            <ul className="space-y-3 text-sm md:text-base text-muted-foreground">
              <li className="flex items-start gap-3">
                <RefreshCcw className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span>Refresh your browser completely (Ctrl+F5 or Cmd+Shift+R)</span>
              </li>
              <li className="flex items-start gap-3">
                <Trash2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span>Clear your browser cache and cookies</span>
              </li>
              <li className="flex items-start gap-3">
                <Globe className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span>Try using a different browser</span>
              </li>
              <li className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span>Wait a few minutes and try again</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button onClick={reset} size="lg" className="w-full sm:w-auto">
              <RefreshCw className="w-5 h-5 mr-2" />
              Reload Application
            </Button>
            
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
              <Link href="/">
                <Home className="w-5 h-5 mr-2" />
                Go to Homepage
              </Link>
            </Button>
          </div>
        </div>
      </body>
    </html>
  )
}
