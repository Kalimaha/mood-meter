import type { DayRating, Point, TimelineDay, TimelineGeometry } from './types'

/** Horizontal step (user units) per day segment. */
export const DEFAULT_STEP = 48

/** Padding around the polyline bounding box. */
export const DEFAULT_PADDING = 16

/** Slope angle in degrees for a day's rating. */
export function ratingAngle(rating: DayRating): number {
  switch (rating) {
    case 'up':
      return 45
    case 'flat':
      return 0
    case 'down':
      return -45
  }
}

/** Vertical delta for a segment of horizontal length `step` at `angleDeg`. */
export function segmentDeltaY(step: number, angleDeg: number): number {
  if (angleDeg === 0) return 0
  // SVG y grows downward; negate so +45° moves visually upward.
  return -step * Math.tan((angleDeg * Math.PI) / 180)
}

/**
 * Build polyline points from daily ratings.
 * Each day contributes an outgoing segment: flat → 0°, up → +45°, down → −45°.
 */
export function buildPoints(
  days: readonly TimelineDay[],
  step: number = DEFAULT_STEP,
): Point[] {
  if (days.length === 0) return []

  const points: Point[] = [{ x: 0, y: 0 }]
  for (const day of days) {
    const prev = points[points.length - 1]
    if (prev === undefined) break
    const angle = ratingAngle(day.rating)
    points.push({
      x: prev.x + step,
      y: prev.y + segmentDeltaY(step, angle),
    })
  }
  return points
}

export function pointsToPathD(points: readonly Point[]): string {
  if (points.length === 0) return ''
  const [first, ...rest] = points
  if (first === undefined) return ''
  let d = `M ${first.x} ${first.y}`
  for (const p of rest) {
    d += ` L ${p.x} ${p.y}`
  }
  return d
}

function bounds(points: readonly Point[]): {
  minX: number
  maxX: number
  minY: number
  maxY: number
} {
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  for (const p of points) {
    if (p.x < minX) minX = p.x
    if (p.x > maxX) maxX = p.x
    if (p.y < minY) minY = p.y
    if (p.y > maxY) maxY = p.y
  }
  return { minX, maxX, minY, maxY }
}

/**
 * Normalize points into a padded viewBox and return geometry for SVG rendering.
 */
export function buildTimelineGeometry(
  days: readonly TimelineDay[],
  options: { step?: number; padding?: number } = {},
): TimelineGeometry {
  const step = options.step ?? DEFAULT_STEP
  const padding = options.padding ?? DEFAULT_PADDING

  const raw = buildPoints(days, step)
  if (raw.length === 0) {
    const width = padding * 2
    const height = padding * 2
    return {
      points: [],
      pathD: '',
      width,
      height,
      viewBox: `0 0 ${width} ${height}`,
    }
  }

  const { minX, maxX, minY, maxY } = bounds(raw)
  const contentW = Math.max(maxX - minX, step)
  const contentH = Math.max(maxY - minY, step)
  const width = contentW + padding * 2
  const height = contentH + padding * 2

  const points = raw.map((p) => ({
    x: p.x - minX + padding,
    y: p.y - minY + padding,
  }))

  return {
    points,
    pathD: pointsToPathD(points),
    width,
    height,
    viewBox: `0 0 ${width} ${height}`,
  }
}
