import {
  buildCumulativeSeries,
  calendarDaysBetween,
  DEFAULT_PX_PER_DAY,
  seriesIndexOfDate,
  type TimelineSeriesPoint,
} from './series'
import type { Point, TimelineDay, TimelineGeometry } from './types'

/** @deprecated Prefer DEFAULT_PX_PER_DAY — kept for callers expecting step. */
export const DEFAULT_STEP = DEFAULT_PX_PER_DAY

/** Left padding matching ECharts grid.left */
export const CHART_GRID_LEFT = 44

/** Right padding matching ECharts grid.right */
export const CHART_GRID_RIGHT = 12

/** Top padding matching ECharts grid.top */
export const CHART_GRID_TOP = 28

/** Bottom padding matching ECharts grid.bottom */
export const CHART_GRID_BOTTOM = 36

export const DEFAULT_PADDING = CHART_GRID_LEFT

export interface ChartLayout {
  width: number
  height: number
  gridLeft?: number
  gridRight?: number
  gridTop?: number
  gridBottom?: number
  yMin: number
  yMax: number
}

/**
 * Map an ISO date to chart pixel coordinates for HTML event hit targets.
 * Uses the same continuous calendar series as the ECharts path.
 */
export function dateToChartPoint(
  series: readonly TimelineSeriesPoint[],
  isoDate: string,
  layout: ChartLayout,
): Point {
  const gridLeft = layout.gridLeft ?? CHART_GRID_LEFT
  const gridRight = layout.gridRight ?? CHART_GRID_RIGHT
  const gridTop = layout.gridTop ?? CHART_GRID_TOP
  const gridBottom = layout.gridBottom ?? CHART_GRID_BOTTOM

  const plotW = Math.max(layout.width - gridLeft - gridRight, 1)
  const plotH = Math.max(layout.height - gridTop - gridBottom, 1)

  if (series.length === 0) {
    return { x: gridLeft, y: gridTop + plotH / 2 }
  }

  const first = series[0]
  const last = series[series.length - 1]
  if (first === undefined || last === undefined) {
    return { x: gridLeft, y: gridTop + plotH / 2 }
  }

  let index = seriesIndexOfDate(series, isoDate)
  if (index < 0) {
    if (isoDate < first.date) index = 0
    else if (isoDate > last.date) index = series.length - 1
    else {
      // Between series points that somehow missed — interpolate by day
      const fromStart = calendarDaysBetween(first.date, isoDate)
      index = Math.min(Math.max(fromStart, 0), series.length - 1)
    }
  }

  const n = series.length
  const x =
    n === 1
      ? gridLeft
      : gridLeft + (index / (n - 1)) * plotW

  const point = series[index]
  const yVal = point?.cumulative ?? 0
  const yFrac = (layout.yMax - yVal) / (layout.yMax - layout.yMin || 1)
  const y = gridTop + yFrac * plotH

  return { x, y }
}

/** Build padded SVG-style geometry from the cumulative series (tests / legacy). */
export function buildTimelineGeometry(
  days: readonly TimelineDay[],
  options: { step?: number; padding?: number } = {},
): TimelineGeometry {
  const step = options.step ?? DEFAULT_STEP
  const padding = options.padding ?? DEFAULT_PADDING
  const series = buildCumulativeSeries(days)

  if (series.length === 0) {
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

  const raw: Point[] = series.map((p, i) => ({
    x: i * step,
    // Invert y so positive cumulative is visually up (SVG y grows down)
    y: -p.cumulative * step,
  }))

  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  for (const p of raw) {
    if (p.x < minX) minX = p.x
    if (p.x > maxX) maxX = p.x
    if (p.y < minY) minY = p.y
    if (p.y > maxY) maxY = p.y
  }

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

/** @deprecated Angle helpers kept for domain/mood parity tests elsewhere. */
export function ratingAngle(
  rating: TimelineDay['rating'],
): 45 | 0 | -45 {
  switch (rating) {
    case 'up':
      return 45
    case 'flat':
      return 0
    case 'down':
      return -45
  }
}

/** @deprecated Prefer cumulative series deltas. */
export function segmentDeltaY(step: number, angleDeg: number): number {
  if (angleDeg === 0) return 0
  return -step * Math.tan((angleDeg * Math.PI) / 180)
}

/**
 * Cumulative path points: one vertex per filled calendar day.
 * y is cumulative sum (mathematical up = negative SVG y when rendered).
 */
export function buildPoints(
  days: readonly TimelineDay[],
  step: number = DEFAULT_STEP,
): Point[] {
  const series = buildCumulativeSeries(days)
  return series.map((p, i) => ({
    x: i * step,
    y: -p.cumulative * step,
  }))
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
