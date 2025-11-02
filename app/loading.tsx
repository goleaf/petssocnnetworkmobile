import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function RootLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-full min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    </div>
  )
}

