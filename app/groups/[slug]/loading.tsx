import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function GroupLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex justify-center items-center py-20">
        <LoadingSpinner />
      </div>
    </div>
  )
}

