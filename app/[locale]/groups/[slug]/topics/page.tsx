"use client"

import { use, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function GroupTopicsPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = use(params)
  const router = useRouter()

  // Redirect to the main group page with topics tab
  useEffect(() => {
    router.push(`/groups/${slug}?tab=topics`)
  }, [slug, router])

  return null
}
