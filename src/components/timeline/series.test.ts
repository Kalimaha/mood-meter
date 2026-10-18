import { describe, expect, it } from 'vitest'
import {
  buildCumulativeSeries,
  formatMonthLabel,
  monthMarkersForSeries,
  yAxisExtentForSeries,
} from './series'
import type { TimelineDay } from './types'

const day = (date: string, rating: TimelineDay['rating']): TimelineDay => ({
  date,
  rating,
})

describe('formatMonthLabel', () => {
  it('formats as MAR 26', () => {
    expect(formatMonthLabel('2026-03-01')).toBe('MAR 26')
    expect(formatMonthLabel('2026-04-15')).toBe('APR 26')
  })
})

describe('buildCumulativeSeries', () => {
  it('returns empty for no days', () => {
    expect(buildCumulativeSeries([])).toEqual([])
  })

  it('maps ratings to ±1/0 and accumulates from 0', () => {
    const series = buildCumulativeSeries([
      day('2026-03-01', 'up'),
      day('2026-03-02', 'flat'),
      day('2026-03-03', 'down'),
    ])
    expect(series.map((p) => p.delta)).toEqual([1, 0, -1])
    expect(series.map((p) => p.cumulative)).toEqual([1, 1, 0])
  })

  it('fills missing calendar days as delta 0', () => {
    const series = buildCumulativeSeries([
      day('2026-03-01', 'up'),
      day('2026-03-04', 'up'),
    ])
    expect(series).toHaveLength(4)
    expect(series.map((p) => p.date)).toEqual([
      '2026-03-01',
      '2026-03-02',
      '2026-03-03',
      '2026-03-04',
    ])
    expect(series.map((p) => p.delta)).toEqual([1, 0, 0, 1])
    expect(series.map((p) => p.cumulative)).toEqual([1, 1, 1, 2])
    expect(series[1]?.hasEntry).toBe(false)
    expect(series[3]?.hasEntry).toBe(true)
  })
})

describe('yAxisExtentForSeries', () => {
  it('always includes at least ±5 and ticks every 5', () => {
    const extent = yAxisExtentForSeries(
      buildCumulativeSeries([day('2026-03-01', 'up')]),
    )
    expect(extent.min).toBe(-5)
    expect(extent.max).toBe(5)
    expect(extent.ticks).toEqual([-5, 0, 5])
  })

  it('expands to next multiples of 5 for larger cumulative swings', () => {
    const days: TimelineDay[] = Array.from({ length: 12 }, (_, i) =>
      day(`2026-03-${String(i + 1).padStart(2, '0')}`, 'up'),
    )
    const extent = yAxisExtentForSeries(buildCumulativeSeries(days))
    expect(extent.min).toBe(-5)
    expect(extent.max).toBe(15)
    expect(extent.ticks).toContain(0)
    expect(extent.ticks).toContain(10)
    expect(extent.ticks).toContain(15)
  })
})

describe('monthMarkersForSeries', () => {
  it('labels month starts like MAR 26', () => {
    const series = buildCumulativeSeries([
      day('2026-03-28', 'flat'),
      day('2026-04-02', 'flat'),
    ])
    const markers = monthMarkersForSeries(series)
    expect(markers.map((m) => m.label)).toEqual(['MAR 26', 'APR 26'])
    expect(markers[1]?.date).toBe('2026-04-01')
  })
})
