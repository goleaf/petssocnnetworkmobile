"use client"

import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts"

export interface SparklineChartProps {
  data: number[]
  color?: string
}

export function SparklineChart({ data, color = "hsl(var(--primary))" }: SparklineChartProps) {
  // Convert array to format expected by recharts
  const chartData = data.map((value, index) => ({
    day: index,
    value,
  }))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              return (
                <div className="bg-background border rounded-lg p-2 shadow-md">
                  <p className="text-sm font-medium">{payload[0].value} items</p>
                </div>
              )
            }
            return null
          }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

