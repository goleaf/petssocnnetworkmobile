import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner />
      </div>
    </div>
  )
}


