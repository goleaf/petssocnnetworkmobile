"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getFollowerDemographics, getFollowerActivityHeatmap, getFollowerGrowthSeries } from '@/lib/profile-audience'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RTooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, ReferenceDot } from 'recharts'

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#94a3b8']

export function AudienceInsights({ profileId }: { profileId: string }) {
  const demo = getFollowerDemographics(profileId)
  const heat = getFollowerActivityHeatmap(profileId)
  const growth = getFollowerGrowthSeries(profileId, 30)

  const genderData = Object.entries(demo.gender).map(([name, count]) => ({ name, value: count }))
  const ageData = Object.entries(demo.ages).map(([name, count]) => ({ name, value: count }))
  const countryData = demo.topCountries.map((d) => ({ name: d.name, value: d.count }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Audience Insights</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Demographics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-64">
            <div className="text-sm font-semibold mb-2">Gender Distribution</div>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={genderData} dataKey="value" nameKey="name" outerRadius={80} label>
                  {genderData.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                </Pie>
                <RTooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="h-64">
            <div className="text-sm font-semibold mb-2">Age Ranges</div>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={ageData} dataKey="value" nameKey="name" outerRadius={80} label>
                  {ageData.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                </Pie>
                <RTooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="h-64">
            <div className="text-sm font-semibold mb-2">Top Countries</div>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={countryData} dataKey="value" nameKey="name" outerRadius={80} label>
                  {countryData.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                </Pie>
                <RTooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Cities */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-64 md:col-span-1">
            <div className="text-sm font-semibold mb-2">Top Cities</div>
            {demo.topCities.length === 0 ? (
              <div className="text-sm text-muted-foreground">No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={demo.topCities.map((d) => ({ name: d.name, value: d.count }))} dataKey="value" nameKey="name" outerRadius={80} label>
                    {demo.topCities.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                  </Pie>
                  <RTooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="md:col-span-2">
            <div className="text-sm font-semibold mb-2">Top Cities (list)</div>
            {demo.topCities.length === 0 ? (
              <div className="text-sm text-muted-foreground">No data yet</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {demo.topCities.map((c, i) => (
                  <div key={i} className="rounded border p-2 text-sm flex items-center justify-between">
                    <span className="truncate mr-2" title={c.name}>{c.name}</span>
                    <span className="font-semibold">{c.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Best time to post */}
        <div className="space-y-2">
          <div className="text-sm font-semibold">Best Time to Post</div>
          <div className="text-xs text-muted-foreground">Based on when your followers are most active (local time)</div>
          <HeatmapGrid grid={heat.grid} />
        </div>

        {/* Growth */}
        <div className="space-y-2">
          <div className="text-sm font-semibold">Follower Growth (30 days)</div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growth.series} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" interval={4} />
                <YAxis allowDecimals={false} />
                <RTooltip />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" dot={false} name="Followers" />
                {growth.milestones.map((m, i) => (
                  <ReferenceDot key={i} x={m.date} y={m.count} r={4} stroke="#ef4444" fill="#ef4444" />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
          {growth.milestones.length > 0 && (
            <div className="text-xs text-muted-foreground">
              Milestones: {growth.milestones.map((m) => `${m.label}`).join(', ')}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function HeatmapGrid({ grid }: { grid: number[][] }) {
  // Normalize to 0..1 for colors
  const max = Math.max(1, ...grid.flat())
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[900px]">
        <div className="grid grid-cols-[60px_repeat(24,1fr)] gap-1">
          <div />
          {Array.from({ length: 24 }).map((_, h) => (
            <div key={h} className="text-[10px] text-center text-muted-foreground">{h}</div>
          ))}
          {grid.map((row, d) => (
            <React.Fragment key={d}>
              <div className="text-[10px] text-right pr-2 text-muted-foreground flex items-center">{days[d]}</div>
              {row.map((val, h) => {
                const t = val / max
                const bg = heatColor(t)
                return <div key={`${d}-${h}`} className="h-6 rounded" style={{ background: bg }} title={`${days[d]} ${h}:00 — ${val} active`} />
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  )
}

function heatColor(t: number): string {
  // t in [0,1]; map to a blue->green->yellow->red gradient
  const clamp = (x: number) => Math.max(0, Math.min(1, x))
  const r = Math.floor(255 * clamp(Math.max(0, t * 2 - 0.2)))
  const g = Math.floor(255 * clamp(Math.min(1, t * 2)))
  const b = Math.floor(255 * (1 - clamp(t)))
  return `rgb(${r}, ${g}, ${b})`
}
