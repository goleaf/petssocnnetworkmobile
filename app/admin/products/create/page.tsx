"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function CreateProductPage() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace("/admin/products/create/edit")
  }, [router])

  return null
}
