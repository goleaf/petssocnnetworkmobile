"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { App, URLOpenListenerEvent } from "@capacitor/app"

/**
 * Deep Link Handler Component
 * Handles deep links from Capacitor (mypets://wiki/:slug)
 * and routes them to the appropriate Next.js pages
 */
export function DeepLinkHandler() {
  const router = useRouter()

  useEffect(() => {
    // Only register deep link handler if running in Capacitor
    if (typeof window === "undefined") return

    // Check if Capacitor is available
    const isCapacitor = !!(window as any).Capacitor

    if (!isCapacitor) {
      return
    }

    // Listen for deep link opens
    const listener = App.addListener("appUrlOpen", (event: URLOpenListenerEvent) => {
      try {
        // Parse the URL
        // Example: mypets://wiki/dog-care-guide
        const url = new URL(event.url)

        // Handle mypets://wiki/:slug deep links
        if (url.protocol === "mypets:" && url.hostname === "wiki") {
          // Extract slug from pathname (e.g., "/dog-care-guide" -> "dog-care-guide")
          const slug = url.pathname.replace(/^\//, "") // Remove leading slash

          if (slug) {
            // Navigate to the wiki article page
            router.push(`/wiki/${slug}`)
          } else {
            // No slug provided, go to wiki index
            router.push("/wiki")
          }
        } else {
          // For other deep link patterns, log for debugging
          console.log("Unhandled deep link:", event.url)
        }
      } catch (error) {
        console.error("Error handling deep link:", error)
      }
    })

    // Cleanup listener on unmount
    return () => {
      listener.then((handle) => handle.remove())
    }
  }, [router])

  // This component doesn't render anything
  return null
}

