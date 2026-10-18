import { buildTimelineGeometry, DEFAULT_PADDING, DEFAULT_STEP } from './geometry'
import type { Point, TimelineDay } from './types'

const MS_PER_DAY = 86_400_000

function utcDayMs(isoDate: string): number {
  return Date.parse(`${isoDate}T00:00:00Z`)
}

/** Whole calendar days from `from` to `to` (UTC date strings). */
export function calendarDaysBetween(from: string, to: string): number {
  return Math.round((utcDayMs(to) - utcDayMs(from)) / MS_PER_DAY)
}

export interface DateToXOptions {
  step?: number
  padding?: number
}

/** True when `isoDate` falls on or between the first and last rated day. */
export function isDateOnTimeline(
  days: readonly TimelineDay[],
  isoDate: string,
): boolean {
  if (days.length === 0) return false
  const first = days[0]?.date
  const last = days[days.length - 1]?.date
  if (first === undefined || last === undefined) return false
  return isoDate >= first && isoDate <= last
}

/**
 * Map an ISO date onto the timeline x-axis in the same space as
 * `buildTimelineGeometry` (padded SVG user units).
 *
 * Rated days land on that day's end vertex. Other dates interpolate or
 * extrapolate by calendar day using `step`.
 */
export function dateToTimelineX(
  days: readonly TimelineDay[],
  isoDate: string,
  options: DateToXOptions = {},
): number {
  return dateToTimelinePoint(days, isoDate, options).x
}

/**
 * Map an ISO date to an `{x,y}` on the mood polyline (same SVG space).
 * Out-of-range dates clamp to the nearest endpoint (still on the path).
 */
export function dateToTimelinePoint(
  days: readonly TimelineDay[],
  isoDate: string,
  options: DateToXOptions = {},
): Point {
  const step = options.step ?? DEFAULT_STEP
  const padding = options.padding ?? DEFAULT_PADDING
  const geometry = buildTimelineGeometry(days, { step, padding })

  if (days.length === 0 || geometry.points.length === 0) {
    return { x: padding, y: padding }
  }

  const exact = days.findIndex((day) => day.date === isoDate)
  if (exact >= 0) {
    const point = geometry.points[exact + 1]
    return point ?? { x: padding, y: padding }
  }

  let lo = -1
  for (let i = 0; i < days.length; i++) {
    const day = days[i]
    if (day !== undefined && day.date < isoDate) {
      lo = i
    } else {
      break
    }
  }
  const hi = lo + 1

  // Before first day → clamp to first vertex on the path
  if (lo < 0) {
    return geometry.points[1] ?? geometry.points[0] ?? { x: padding, y: padding }
  }

  // After last day → clamp to last vertex
  if (hi >= days.length) {
    return (
      geometry.points[days.length] ??
      geometry.points[geometry.points.length - 1] ?? {
        x: padding,
        y: padding,
      }
    )
  }

  const dayLo = days[lo]
  const dayHi = days[hi]
  const pLo = geometry.points[lo + 1]
  const pHi = geometry.points[hi + 1]
  if (
    dayLo === undefined ||
    dayHi === undefined ||
    pLo === undefined ||
    pHi === undefined
  ) {
    return { x: padding, y: padding }
  }

  const span = calendarDaysBetween(dayLo.date, dayHi.date) || 1
  const t = calendarDaysBetween(dayLo.date, isoDate) / span
  return {
    x: pLo.x + t * (pHi.x - pLo.x),
    y: pLo.y + t * (pHi.y - pLo.y),
  }
}
