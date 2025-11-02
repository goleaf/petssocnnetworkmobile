"use client"

import { QualityDashboard } from "@/components/analytics/QualityDashboard"
import { useAnalyticsCollection } from "@/lib/hooks/use-analytics-collection"

export default function QualityPage() {
  useAnalyticsCollection()
  
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <QualityDashboard />
      </div>
    </div>
  )
}

