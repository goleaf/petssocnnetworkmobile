"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertTriangle, Home, RefreshCw, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application error:", error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-background via-background to-destructive/5">
      <div className="max-w-2xl w-full text-center space-y-8 py-16">
        {/* Error Icon */}
        <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-destructive/10 dark:bg-destructive/20 mb-6">
          <AlertTriangle className="w-16 h-16 text-destructive" strokeWidth={1.5} />
        </div>
        
        {/* Error Message */}
        <div className="space-y-4">
          <h1 className="text-5xl font-bold text-foreground">
            Something Went Wrong
          </h1>
          
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            We're sorry, but something unexpected happened. Don't worry, we're here to help you get back on track.
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
            <AlertTriangle className="w-5 h-5 text-destructive" />
            What happened?
          </h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            An unexpected error occurred while loading this page. This could be due to a temporary issue,
            a problem with the data, or a bug in the application. Your data is safe, and this error has been logged.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
          <Button onClick={reset} size="lg" className="w-full sm:w-auto">
            <RefreshCw className="w-5 h-5 mr-2" />
            Try Again
          </Button>
          
          <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
            <Link href="/">
              <Home className="w-5 h-5 mr-2" />
              Go Home
            </Link>
          </Button>
          
          <Button
            variant="ghost"
            size="lg"
            className="w-full sm:w-auto"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Go Back
          </Button>
        </div>

        {/* Help Section */}
        <div className="pt-8 border-t space-y-2">
          <p className="text-sm text-muted-foreground">
            If this problem persists, please try:
          </p>
          <ul className="text-sm text-muted-foreground space-y-1 text-left max-w-md mx-auto">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Refreshing the page</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Clearing your browser cache</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Waiting a few moments and trying again</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
