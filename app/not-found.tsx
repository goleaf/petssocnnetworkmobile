"use client"

import Link from "next/link"
import { Home, Search, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-background via-background to-muted/20">
      <div className="max-w-2xl w-full text-center space-y-8 py-16">
        {/* Large 404 Display */}
        <div className="space-y-4">
          <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-destructive/10 dark:bg-destructive/20 mb-6">
            <Search className="w-16 h-16 text-destructive" strokeWidth={1.5} />
          </div>
          
          <h1 className="text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-destructive">
            404
          </h1>
          
          <h2 className="text-3xl font-bold text-foreground">
            Oops! Page Not Found
          </h2>
          
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            The page you're looking for doesn't exist, has been moved, or is temporarily unavailable.
          </p>
        </div>

        {/* Helpful Suggestions */}
        <div className="bg-card border rounded-lg p-6 space-y-4 text-left">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Search className="w-5 h-5" />
            What you can do:
          </h3>
          <ul className="space-y-2 text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Check the URL for typos or spelling errors</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Go back to the previous page using your browser's back button</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Return to the homepage and navigate from there</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Use the search feature to find what you're looking for</span>
            </li>
          </ul>
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

        {/* Popular Links */}
        <div className="pt-8 border-t space-y-3">
          <p className="text-sm text-muted-foreground font-medium">
            Popular pages:
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button asChild variant="ghost" size="sm">
              <Link href="/feed">Feed</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/blog">Blog</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/wiki">Wiki</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/search">Search</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
