"use client"

import { SearchAnalyticsDashboard } from "@/components/analytics/SearchAnalyticsDashboard"
import { BackButton } from "@/components/ui/back-button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function AdminSearchAnalyticsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <BackButton href="/admin" />
          <h1 className="mt-4 text-3xl font-bold">Search Analytics</h1>
          <p className="mt-2 text-muted-foreground">
            Track queries, zero-result searches, and engagement metrics across the network.
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Analytics Overview</CardTitle>
            <CardDescription>
              Search telemetry is privacy-first. All personal identifiers are scrubbed and event payloads are
              anonymized before storage.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• Event schema supports backward-compatible versioning</p>
              <p>• Session data uses rotating anonymous identifiers</p>
              <p>• Result IDs are hashed prior to ingestion</p>
              <p>• Zero-result tracking highlights gaps in content coverage</p>
              <p>• CTR monitoring surfaces relevancy issues</p>
            </div>
          </CardContent>
        </Card>

        <SearchAnalyticsDashboard />
      </div>
    </div>
  )
}

