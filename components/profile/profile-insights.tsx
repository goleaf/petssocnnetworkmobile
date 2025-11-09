"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getProfileStats, ReferrerSource } from '@/lib/profile-analytics'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'

function formatDateLabel(d: string) {
  // Show MM/DD
  const [y, m, day] = d.split('-')
  return `${m}/${day}`
}

export function ProfileInsights({ profileId }: { profileId: string }) {
  const stats = getProfileStats(profileId)
  const refOrder: ReferrerSource[] = ['search', 'direct', 'post', 'profile', 'other']
  const refLabels: Record<ReferrerSource, string> = {
    search: 'Search',
    direct: 'Direct',
    post: 'From post',
    profile: 'From profile',
    other: 'Other',
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Insights</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-md border p-3">
            <div className="text-xs text-muted-foreground">Lifetime Views</div>
            <div className="text-2xl font-bold">{stats.lifetimeTotal}</div>
          </div>
          <div className="rounded-md border p-3">
            <div className="text-xs text-muted-foreground">Unique Visitors</div>
            <div className="text-2xl font-bold">{stats.uniqueVisitors}</div>
          </div>
          <div className="rounded-md border p-3">
            <div className="text-xs text-muted-foreground">Returning Visitors</div>
            <div className="text-2xl font-bold">{stats.returningVisitors}</div>
          </div>
          <div className="rounded-md border p-3">
            <div className="text-xs text-muted-foreground">Last 30 Days Total</div>
            <div className="text-2xl font-bold">{stats.days.reduce((a, b) => a + b.views, 0)}</div>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats.days} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={formatDateLabel} interval={4} />
              <YAxis allowDecimals={false} />
              <Tooltip formatter={(value: any) => [`${value}`, 'Views']} labelFormatter={(label) => label} />
              <Legend />
              <Line type="monotone" dataKey="views" stroke="#3b82f6" dot={false} name="Daily Views" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div>
          <div className="text-sm font-semibold mb-2">Top Referring Sources</div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {refOrder.map((key) => (
              <div key={key} className="rounded-md border p-2 flex items-center justify-between">
                <span className="text-sm">{refLabels[key]}</span>
                <span className="text-sm font-semibold">{stats.refCounts[key] || 0}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

