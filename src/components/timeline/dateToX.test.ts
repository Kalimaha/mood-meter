import { describe, expect, it } from 'vitest'
import { calendarDaysBetween, dateToTimelineX } from './dateToX'
import { buildTimelineGeometry, DEFAULT_PADDING, DEFAULT_STEP } from './geometry'
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

  it('maps a rated day to its end vertex', () => {
    const geometry = buildTimelineGeometry(days)
    expect(dateToTimelineX(days, '2026-03-01')).toBe(geometry.points[1]?.x)
    expect(dateToTimelineX(days, '2026-03-04')).toBe(geometry.points[3]?.x)
  })

  it('extrapolates before the first day by step', () => {
    const firstX = dateToTimelineX(days, '2026-03-01')
    expect(dateToTimelineX(days, '2026-02-28')).toBe(firstX - DEFAULT_STEP)
  })

  it('interpolates between rated days by calendar', () => {
    const x2 = dateToTimelineX(days, '2026-03-02')
    const x4 = dateToTimelineX(days, '2026-03-04')
    expect(dateToTimelineX(days, '2026-03-03')).toBeCloseTo((x2 + x4) / 2)
  })
})
