import { analyzeWeightTrend } from '@/lib/health/utils'

describe('Weight trend analysis', () => {
  it('detects gain', () => {
    const trend = analyzeWeightTrend([
      { date: '2024-05-01', weight: 10 },
      { date: '2024-06-01', weight: 11 },
    ])
    expect(trend).toBe('gain')
  })

  it('detects loss', () => {
    const trend = analyzeWeightTrend([
      { date: '2024-05-01', weight: 12 },
      { date: '2024-06-01', weight: 10.5 },
    ])
    expect(trend).toBe('loss')
  })

  it('detects stable within threshold', () => {
    const trend = analyzeWeightTrend([
      { date: '2024-05-01', weight: 10 },
      { date: '2024-06-01', weight: 10.2 },
    ], 3)
    expect(trend).toBe('stable')
  })
})

