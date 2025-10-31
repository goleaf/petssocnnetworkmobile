"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertCircle, Home, RefreshCw } from "lucide-react"
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

  return (
    <html lang="en">
      <body className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-background via-background to-destructive/5">
        <div className="max-w-2xl w-full text-center space-y-8 py-16">
          {/* Error Icon */}
          <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-destructive/10 dark:bg-destructive/20 mb-6">
            <AlertCircle className="w-16 h-16 text-destructive" strokeWidth={1.5} />
          </div>
          
          {/* Error Message */}
          <div className="space-y-4">
            <h1 className="text-5xl font-bold text-foreground">
              Critical Error Occurred
            </h1>
            
            <p className="text-lg text-muted-foreground max-w-md mx-auto">
              A critical error has occurred that prevented the application from loading properly.
              We apologize for the inconvenience.
            </p>
          </div>

          {/* Error Details (only in development) */}
          {process.env.NODE_ENV === "development" && error.message && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-left">
              <p className="text-sm font-semibold text-destructive mb-2">Error Details (Development Only):</p>
              <p className="text-sm text-muted-foreground font-mono break-all">
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
          <div className="bg-card border rounded-lg p-6 space-y-4 text-left">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              What happened?
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              A critical error occurred that prevented the entire application from loading. This is a root-level
              error that affects the core functionality. The error has been logged and our team will investigate.
              Your data is safe.
            </p>
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

          {/* Help Section */}
          <div className="pt-8 border-t space-y-2">
            <p className="text-sm text-muted-foreground">
              Please try reloading the application. If the problem persists:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 text-left max-w-md mx-auto">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Refresh your browser completely (Ctrl+F5 or Cmd+Shift+R)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Clear your browser cache and cookies</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Try using a different browser</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Wait a few minutes and try again</span>
              </li>
            </ul>
          </div>
        </div>
      </body>
    </html>
  )
}
