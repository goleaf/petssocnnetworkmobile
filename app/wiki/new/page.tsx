"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function WikiNewPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the create page
    router.replace("/wiki/create")
  }, [router])

  return <LoadingSpinner fullScreen />
}

