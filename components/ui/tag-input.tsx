"use client"

import { useCallback, useRef, useEffect, useState } from "react"
import dynamic from "next/dynamic"

// Dynamic import to avoid build issues with Tagify JSX
const Tags = dynamic(() => import("@yaireo/tagify/react").then((mod) => mod.default), {
  ssr: false,
  loading: () => (
    <div className="w-full h-10 border border-input rounded-md bg-background animate-pulse" />
  ),
})

interface TagInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function TagInput({ value, onChange, placeholder, className }: TagInputProps) {
  const tagifyRef = useRef<any>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleChange = useCallback(
    (e: any) => {
      const tagify = e.detail.tagify
      const tagsArray = tagify.value.map((tag: any) => tag.value).join(", ")
      onChange(tagsArray)
    },
    [onChange]
  )

  if (!mounted) {
    return (
      <div className={`w-full h-10 border border-input rounded-md bg-background animate-pulse ${className || ""}`} />
    )
  }

  return (
    <div className={`border border-input rounded-md bg-background ${className || ""}`}>
      <Tags
        tagifyRef={tagifyRef}
        whitelist={[]}
        placeholder={placeholder || "Add tags"}
        settings={{
          duplicates: false,
          maxTags: 20,
          trim: true,
        }}
        defaultValue={value}
        onChange={handleChange}
      />
    </div>
  )
}

