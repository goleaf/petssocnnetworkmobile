"use client"

import { useEffect, useRef, useState } from "react"
import Router from "next/router"
import { cn } from "@/lib/utils"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

const LOADING_DELAY_MS = 120

export function NavigationLoadingIndicator() {
  const [isVisible, setIsVisible] = useState(false)
  const delayTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const clearDelayTimeout = () => {
      if (delayTimeoutRef.current) {
        clearTimeout(delayTimeoutRef.current)
        delayTimeoutRef.current = null
      }
    }

    const startLoading = () => {
      clearDelayTimeout()
      delayTimeoutRef.current = setTimeout(() => {
        setIsVisible(true)
      }, LOADING_DELAY_MS)
    }

    const stopLoading = () => {
      clearDelayTimeout()
      setIsVisible(false)
    }

    Router.events.on("routeChangeStart", startLoading)
    Router.events.on("routeChangeComplete", stopLoading)
    Router.events.on("routeChangeError", stopLoading)

    return () => {
      Router.events.off("routeChangeStart", startLoading)
      Router.events.off("routeChangeComplete", stopLoading)
      Router.events.off("routeChangeError", stopLoading)
      clearDelayTimeout()
    }
  }, [])

  return (
    <div
      aria-hidden={!isVisible}
      className={cn(
        "pointer-events-none fixed inset-0 z-[1000] flex items-center justify-center transition-opacity duration-200",
        isVisible ? "opacity-100" : "opacity-0",
      )}
    >
      <div className="pointer-events-auto rounded-full border border-border bg-background/80 p-6 shadow-xl backdrop-blur">
        <LoadingSpinner size="lg" />
      </div>
    </div>
  )
}

