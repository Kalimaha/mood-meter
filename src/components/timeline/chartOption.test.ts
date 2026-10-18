import { describe, expect, it } from 'vitest'
import { buildMoodChartModel } from './chartOption'
import type { TimelineDay } from './types'

const days: TimelineDay[] = [
  { date: '2026-03-01', rating: 'up' },
  { date: '2026-03-02', rating: 'up' },
  { date: '2026-04-01', rating: 'flat' },
]

describe('buildMoodChartModel', () => {
  it('returns empty option when there are no days', () => {
    const model = buildMoodChartModel({ days: [] })
    expect(model.series).toEqual([])
    expect(model.option).toEqual({})
  })

  it('sets y-axis interval 5 and includes month mark lines', () => {
    const model = buildMoodChartModel({
      days,
      accentColor: '#3dcea0',
      mutedColor: '#9aa7b5',
      elevatedBg: '#1a222c',
      fgColor: '#e8eef4',
    })
    expect(model.series.length).toBeGreaterThan(2)
    const yAxis = Array.isArray(model.option.yAxis)
      ? model.option.yAxis[0]
      : model.option.yAxis
    expect(yAxis).toMatchObject({ interval: 5, min: -5 })
    const series0 = Array.isArray(model.option.series)
      ? model.option.series[0]
      : model.option.series
    const markLine = (series0 as { markLine?: { data?: unknown[] } }).markLine
    expect(markLine?.data?.length).toBeGreaterThanOrEqual(2)
  })

  it('sizes width from day count for horizontal scroll', () => {
    const model = buildMoodChartModel({ days, pxPerDay: 40 })
    expect(model.width).toBeGreaterThanOrEqual(model.series.length * 40)
  })
})
