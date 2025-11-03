"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"

export default function FeedPage() {
  const { isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Redirect to home (/) which now shows the feed
    router.push("/")
  }, [router, isAuthenticated])

  return null
}
