import { describe, expect, it } from 'vitest'
import { calendarDaysBetween, dateToTimelineX } from './dateToX'
import { DEFAULT_PADDING } from './geometry'
import type { TimelineDay } from './types'

const days: TimelineDay[] = [
  { date: '2026-03-01', rating: 'flat' },
  { date: '2026-03-02', rating: 'up' },
  { date: '2026-03-04', rating: 'down' },
]

describe('calendarDaysBetween', () => {
  it('counts whole days', () => {
    expect(calendarDaysBetween('2026-03-01', '2026-03-04')).toBe(3)
  })
})

describe('dateToTimelineX', () => {
  it('returns padding when there are no days', () => {
    expect(dateToTimelineX([], '2026-03-01')).toBe(DEFAULT_PADDING)
  })

  it('maps dates monotonically along the filled series', () => {
    const x1 = dateToTimelineX(days, '2026-03-01')
    const x2 = dateToTimelineX(days, '2026-03-02')
    const x3 = dateToTimelineX(days, '2026-03-03')
    const x4 = dateToTimelineX(days, '2026-03-04')
    expect(x1).toBeLessThan(x2)
    expect(x2).toBeLessThan(x3)
    expect(x3).toBeLessThan(x4)
  })

  it('clamps before the first day to the first vertex', () => {
    const firstX = dateToTimelineX(days, '2026-03-01')
    expect(dateToTimelineX(days, '2026-02-28')).toBe(firstX)
  })

  it('places a gap day between neighbors', () => {
    const x2 = dateToTimelineX(days, '2026-03-02')
    const x3 = dateToTimelineX(days, '2026-03-03')
    const x4 = dateToTimelineX(days, '2026-03-04')
    expect(x3).toBeGreaterThan(x2)
    expect(x3).toBeLessThan(x4)
  })
})
