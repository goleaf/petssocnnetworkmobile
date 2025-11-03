"use client"

import ErrorDisplay from "@/components/error-display"

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return <ErrorDisplay errorType="global" error={error} reset={reset} />
}
