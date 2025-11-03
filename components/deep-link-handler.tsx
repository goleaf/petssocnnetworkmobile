"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

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

    let listenerPromise: Promise<{ remove: () => void }> | null = null

    // Dynamically import Capacitor App to avoid SSR issues
    import("@capacitor/app")
      .then(({ App }) => {
        // Listen for deep link opens
        listenerPromise = App.addListener("appUrlOpen", (event: { url: string }) => {
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
      })
      .catch((error) => {
        // Capacitor not available, silently fail
        if (process.env.NODE_ENV === "development") {
          console.log("Capacitor App plugin not available:", error)
        }
      })

    // Cleanup listener on unmount
    return () => {
      if (listenerPromise) {
        listenerPromise.then((handle) => handle.remove()).catch(() => {
          // Ignore cleanup errors
        })
      }
    }
  }, [router])

  // This component doesn't render anything
  return null
}

