import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function GroupsLoading() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex justify-center items-center py-20">
        <LoadingSpinner />
      </div>
    </div>
  )
}

