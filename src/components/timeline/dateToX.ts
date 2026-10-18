import { buildTimelineGeometry, DEFAULT_PADDING, DEFAULT_STEP } from './geometry'
import type { TimelineDay } from './types'

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
  const step = options.step ?? DEFAULT_STEP
  const padding = options.padding ?? DEFAULT_PADDING
  const geometry = buildTimelineGeometry(days, { step, padding })

  if (days.length === 0) {
    return padding
  }

  const exact = days.findIndex((day) => day.date === isoDate)
  if (exact >= 0) {
    return geometry.points[exact + 1]?.x ?? padding
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

  if (lo < 0) {
    const first = days[0]
    const firstX = geometry.points[1]?.x
    if (first === undefined || firstX === undefined) return padding
    return firstX - calendarDaysBetween(isoDate, first.date) * step
  }

  if (hi >= days.length) {
    const last = days[days.length - 1]
    const lastX = geometry.points[days.length]?.x
    if (last === undefined || lastX === undefined) return padding
    return lastX + calendarDaysBetween(last.date, isoDate) * step
  }

  const dayLo = days[lo]
  const dayHi = days[hi]
  const xLo = geometry.points[lo + 1]?.x
  const xHi = geometry.points[hi + 1]?.x
  if (
    dayLo === undefined ||
    dayHi === undefined ||
    xLo === undefined ||
    xHi === undefined
  ) {
    return padding
  }

  const span = calendarDaysBetween(dayLo.date, dayHi.date) || 1
  const t = calendarDaysBetween(dayLo.date, isoDate) / span
  return xLo + t * (xHi - xLo)
}
