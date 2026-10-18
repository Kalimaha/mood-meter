import { describe, expect, it } from 'vitest'
import {
  buildPoints,
  buildTimelineGeometry,
  pointsToPathD,
  ratingAngle,
  segmentDeltaY,
  DEFAULT_STEP,
} from './geometry'
import type { TimelineDay } from './types'

const day = (date: string, rating: TimelineDay['rating']): TimelineDay => ({
  date,
  rating,
})

describe('ratingAngle', () => {
  it('maps up to +45', () => {
    expect(ratingAngle('up')).toBe(45)
  })

  it('maps flat to 0', () => {
    expect(ratingAngle('flat')).toBe(0)
  })

  it('maps down to −45', () => {
    expect(ratingAngle('down')).toBe(-45)
  })
})

describe('segmentDeltaY', () => {
  it('is 0 for a flat segment', () => {
    expect(segmentDeltaY(DEFAULT_STEP, 0)).toBe(0)
  })

  it('moves visually up (negative SVG y) for +45°', () => {
    expect(segmentDeltaY(DEFAULT_STEP, 45)).toBeCloseTo(-DEFAULT_STEP)
  })

  it('moves visually down (positive SVG y) for −45°', () => {
    expect(segmentDeltaY(DEFAULT_STEP, -45)).toBeCloseTo(DEFAULT_STEP)
  })
})

describe('buildPoints', () => {
  it('returns empty for no days', () => {
    expect(buildPoints([])).toEqual([])
  })

  it('starts at origin and adds one vertex per day', () => {
    const points = buildPoints([day('2026-01-01', 'flat')])
    expect(points).toHaveLength(2)
    expect(points[0]).toEqual({ x: 0, y: 0 })
    expect(points[1]).toEqual({ x: DEFAULT_STEP, y: 0 })
  })

  it('keeps y constant across a flat sequence', () => {
    const points = buildPoints([
      day('2026-01-01', 'flat'),
      day('2026-01-02', 'flat'),
      day('2026-01-03', 'flat'),
    ])
    expect(points.every((p) => p.y === 0)).toBe(true)
    expect(points[points.length - 1]?.x).toBe(DEFAULT_STEP * 3)
  })

  it('rises at +45° for an up sequence', () => {
    const points = buildPoints([
      day('2026-01-01', 'up'),
      day('2026-01-02', 'up'),
    ])
    expect(points[1]?.y).toBeCloseTo(-DEFAULT_STEP)
    expect(points[2]?.y).toBeCloseTo(-DEFAULT_STEP * 2)
  })

  it('falls at −45° for a down sequence', () => {
    const points = buildPoints([
      day('2026-01-01', 'down'),
      day('2026-01-02', 'down'),
    ])
    expect(points[1]?.y).toBeCloseTo(DEFAULT_STEP)
    expect(points[2]?.y).toBeCloseTo(DEFAULT_STEP * 2)
  })

  it('combines up, flat, and down segments', () => {
    const points = buildPoints([
      day('2026-01-01', 'up'),
      day('2026-01-02', 'flat'),
      day('2026-01-03', 'down'),
    ])
    expect(points).toHaveLength(4)
    expect(points[1]?.y).toBeCloseTo(-DEFAULT_STEP)
    expect(points[2]?.y).toBeCloseTo(-DEFAULT_STEP)
    expect(points[3]?.y).toBeCloseTo(0)
  })
})

describe('pointsToPathD', () => {
  it('returns empty string for no points', () => {
    expect(pointsToPathD([])).toBe('')
  })

  it('builds an M/L path', () => {
    expect(
      pointsToPathD([
        { x: 0, y: 0 },
        { x: 10, y: -10 },
        { x: 20, y: -10 },
      ]),
    ).toBe('M 0 0 L 10 -10 L 20 -10')
  })
})

describe('buildTimelineGeometry', () => {
  it('returns an empty path and padded box when there are no days', () => {
    const g = buildTimelineGeometry([])
    expect(g.pathD).toBe('')
    expect(g.points).toEqual([])
    expect(g.width).toBeGreaterThan(0)
    expect(g.height).toBeGreaterThan(0)
  })

  it('normalizes points into a padded viewBox', () => {
    const g = buildTimelineGeometry([
      day('2026-01-01', 'up'),
      day('2026-01-02', 'down'),
    ])
    expect(g.pathD.startsWith('M ')).toBe(true)
    expect(g.points.length).toBe(3)
    expect(g.viewBox).toBe(`0 0 ${g.width} ${g.height}`)
    expect(g.points.every((p) => p.x >= 0 && p.y >= 0)).toBe(true)
  })
})
