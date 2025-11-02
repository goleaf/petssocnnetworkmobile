"use client"

import { BackButton } from "@/components/ui/back-button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RelationshipAnalyticsDashboard } from "@/components/analytics/RelationshipAnalyticsDashboard"

export default function AdminRelationshipAnalyticsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <BackButton href="/admin" />
          <h1 className="mt-4 text-3xl font-bold">Relationship Analytics</h1>
          <p className="mt-2 text-muted-foreground">
            Monitor friendship graph health, mutual connection trends, and pet community growth.
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Why It Matters</CardTitle>
            <CardDescription>
              Use these metrics to spot emerging community clusters, uncover retention risks, and identify
              opportunities to encourage meaningful pet owner interactions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• Track growth of mutual connections over time</p>
              <p>• Highlight isolated users who may need engagement prompts</p>
              <p>• Understand which pet communities drive the most interactions</p>
              <p>• Compare relationship density across species and regions</p>
            </div>
          </CardContent>
        </Card>

        <RelationshipAnalyticsDashboard />
      </div>
    </div>
  )
}

