"use client"

import ErrorDisplay from "@/components/error-display"

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  return <ErrorDisplay errorType="500" error={error} reset={reset} />
}
