import {
  CHART_GRID_LEFT,
  dateToChartPoint,
  DEFAULT_PADDING,
  DEFAULT_STEP,
} from './geometry'
import {
  buildCumulativeSeries,
  calendarDaysBetween,
  yAxisExtentForSeries,
} from './series'
import type { Point, TimelineDay } from './types'
import { DEFAULT_CHART_HEIGHT, DEFAULT_PX_PER_DAY } from './series'

export { calendarDaysBetween }

export interface DateToXOptions {
  step?: number
  padding?: number
  width?: number
  height?: number
}

/** True when `isoDate` falls on or between the first and last series day. */
export function isDateOnTimeline(
  days: readonly TimelineDay[],
  isoDate: string,
): boolean {
  const series = buildCumulativeSeries(days)
  if (series.length === 0) return false
  const first = series[0]?.date
  const last = series[series.length - 1]?.date
  if (first === undefined || last === undefined) return false
  return isoDate >= first && isoDate <= last
}

/**
 * Map an ISO date onto the timeline x-axis in chart pixel space.
 */
export function dateToTimelineX(
  days: readonly TimelineDay[],
  isoDate: string,
  options: DateToXOptions = {},
): number {
  return dateToTimelinePoint(days, isoDate, options).x
}

/**
 * Map an ISO date to `{x,y}` on the cumulative mood path (chart pixels).
 * Out-of-range dates clamp to the nearest endpoint.
 */
export function dateToTimelinePoint(
  days: readonly TimelineDay[],
  isoDate: string,
  options: DateToXOptions = {},
): Point {
  const step = options.step ?? DEFAULT_STEP
  const padding = options.padding ?? DEFAULT_PADDING
  const series = buildCumulativeSeries(days)

  if (series.length === 0) {
    return { x: padding, y: padding }
  }

  const yExtent = yAxisExtentForSeries(series)
  const width =
    options.width ??
    Math.max(series.length * (step || DEFAULT_PX_PER_DAY) + 56, 280)
  const height = options.height ?? DEFAULT_CHART_HEIGHT

  return dateToChartPoint(series, isoDate, {
    width,
    height,
    gridLeft: padding === DEFAULT_PADDING ? CHART_GRID_LEFT : padding,
    yMin: yExtent.min,
    yMax: yExtent.max,
  })
}
