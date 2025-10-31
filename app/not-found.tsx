"use client"

import Link from "next/link"
import { Home, Search, ArrowLeft, Info } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-background via-background to-muted/20">
      <div className="max-w-4xl w-full space-y-8 py-4 md:py-8">
        {/* Header with Icon on Left */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-3 md:gap-4">
          {/* Error Icon */}
          <div className="flex-shrink-0 inline-flex items-center justify-center w-24 h-24 md:w-32 md:h-32 rounded-full bg-destructive/10 dark:bg-destructive/20">
            <Search className="w-12 h-12 md:w-16 md:h-16 text-destructive" strokeWidth={1.5} />
          </div>
          
          {/* Error Message */}
          <div className="flex-1 text-center md:text-left space-y-4">
            <h1 className="text-6xl md:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-destructive">
              404
            </h1>
            
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              Oops! Page Not Found
            </h2>
            
            <p className="text-base md:text-lg text-muted-foreground">
              The page you're looking for doesn't exist, has been moved, or is temporarily unavailable.
            </p>
          </div>
        </div>

        {/* Helpful Suggestions */}
        <div className="bg-card border rounded-lg p-4 md:p-6 space-y-4 text-left">
          <h3 className="text-base md:text-lg font-semibold text-foreground flex items-center gap-2">
            <Search className="w-5 h-5 text-destructive" />
            What you can do:
          </h3>
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <ul className="space-y-3 text-sm md:text-base text-muted-foreground flex-1">
              <li className="flex items-start gap-3">
                <span className="text-primary mt-0.5">•</span>
                <span>Check the URL for typos or spelling errors</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary mt-0.5">•</span>
                <span>Go back to the previous page using your browser's back button</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary mt-0.5">•</span>
                <span>Return to the homepage and navigate from there</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary mt-0.5">•</span>
                <span>Use the search feature to find what you're looking for</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/">
              <Home className="w-5 h-5 mr-2" />
              Go Home
            </Link>
          </Button>
          
          <Button 
            variant="outline" 
            size="lg" 
            className="w-full sm:w-auto" 
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    </div>
  )
}
