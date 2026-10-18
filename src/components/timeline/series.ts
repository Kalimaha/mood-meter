import { ratingDelta } from '../../domain/mood'
import type { MoodRating } from '../../domain/types'
import type { TimelineDay } from './types'

const MS_PER_DAY = 86_400_000

/** Horizontal pixels per calendar day in the scrollable chart. */
export const DEFAULT_PX_PER_DAY = 36

/** Fixed plot height (px). */
export const DEFAULT_CHART_HEIGHT = 220

const MONTH_ABBR = [
  'JAN',
  'FEB',
  'MAR',
  'APR',
  'MAY',
  'JUN',
  'JUL',
  'AUG',
  'SEP',
  'OCT',
  'NOV',
  'DEC',
] as const

/** One filled calendar day on the cumulative mood path. */
export interface TimelineSeriesPoint {
  /** ISO date YYYY-MM-DD */
  date: string
  /** Daily contribution: +1 / 0 / −1 (missing days are 0). */
  delta: number
  /** Running sum of deltas; series begins with an origin vertex at 0. */
  cumulative: number
  /** True when this day had a stored rating (not a gap fill). */
  hasEntry: boolean
  rating: MoodRating | null
}

export interface MonthMarker {
  date: string
  /** e.g. `MAR 26` */
  label: string
}

export interface YAxisExtent {
  min: number
  max: number
  /** Horizontal grid values at multiples of 5, including 0. */
  ticks: number[]
}

function utcDayMs(isoDate: string): number {
  return Date.parse(`${isoDate}T00:00:00Z`)
}

function isoFromUtcMs(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10)
}

/** Whole calendar days from `from` to `to` (UTC date strings). */
export function calendarDaysBetween(from: string, to: string): number {
  return Math.round((utcDayMs(to) - utcDayMs(from)) / MS_PER_DAY)
}

/** Format month start as `MAR 26` (abbr + 2-digit year). */
export function formatMonthLabel(isoDate: string): string {
  const [yearStr, monthStr] = isoDate.split('-')
  const year = Number(yearStr)
  const month = Number(monthStr)
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
    return isoDate
  }
  const abbr = MONTH_ABBR[month - 1]
  const yy = String(year % 100).padStart(2, '0')
  return `${abbr} ${yy}`
}

/**
 * Expand sparse ratings into a continuous calendar series.
 * Missing days contribute delta 0.
 *
 * The path always begins at y=0 on day 0 (first calendar day) as an explicit
 * origin vertex, then one end-of-day vertex per calendar day after applying
 * that day's delta. Day 0 therefore appears twice when the first day has a
 * non-zero delta (0 → ±1), which is intentional so the polyline starts at 0.
 */
export function buildCumulativeSeries(
  days: readonly TimelineDay[],
): TimelineSeriesPoint[] {
  if (days.length === 0) return []

  const sorted = [...days].sort((a, b) =>
    a.date < b.date ? -1 : a.date > b.date ? 1 : 0,
  )
  const first = sorted[0]
  const last = sorted[sorted.length - 1]
  if (first === undefined || last === undefined) return []

  const byDate = new Map<string, TimelineDay>()
  for (const day of sorted) {
    byDate.set(day.date, day)
  }

  const points: TimelineSeriesPoint[] = []
  let cumulative = 0
  const startMs = utcDayMs(first.date)
  const endMs = utcDayMs(last.date)

  // Day 0 origin: cumulative path starts at y = 0 on the first calendar day.
  points.push({
    date: first.date,
    delta: 0,
    cumulative: 0,
    hasEntry: false,
    rating: null,
  })

  for (let ms = startMs; ms <= endMs; ms += MS_PER_DAY) {
    const date = isoFromUtcMs(ms)
    const entry = byDate.get(date)
    const delta = entry === undefined ? 0 : ratingDelta(entry.rating)
    cumulative += delta
    points.push({
      date,
      delta,
      cumulative,
      hasEntry: entry !== undefined,
      rating: entry?.rating ?? null,
    })
  }

  return points
}

/** Month boundaries that fall within the series (first of month, labeled). */
export function monthMarkersForSeries(
  series: readonly TimelineSeriesPoint[],
): MonthMarker[] {
  if (series.length === 0) return []

  const markers: MonthMarker[] = []
  const seen = new Set<string>()

  for (const point of series) {
    const key = point.date.slice(0, 7)
    if (seen.has(key)) continue
    seen.add(key)
    // Prefer the 1st of the month when it lies on the series; else the first
    // day of that month that appears (e.g. mid-month start).
    const firstOfMonth = `${key}-01`
    const date =
      series.some((p) => p.date === firstOfMonth) ? firstOfMonth : point.date
    markers.push({ date, label: formatMonthLabel(date) })
  }

  return markers
}

/**
 * Y-axis extent for the cumulative path.
 * Always includes 0 as a first-class bound: when values stay non-negative the
 * axis starts at 0 (not −5 mid-scale); when non-positive it ends at 0.
 * Padded to multiples of 5 so horizontal grid lines every 5 are visible.
 */
export function yAxisExtentForSeries(
  series: readonly TimelineSeriesPoint[],
): YAxisExtent {
  let dataMin = 0
  let dataMax = 0
  for (const point of series) {
    if (point.cumulative < dataMin) dataMin = point.cumulative
    if (point.cumulative > dataMax) dataMax = point.cumulative
  }

  let min = dataMin >= 0 ? 0 : Math.floor(dataMin / 5) * 5
  let max = dataMax <= 0 ? 0 : Math.ceil(dataMax / 5) * 5

  // Ensure at least one 5-unit span so a 0 grid line is never a lone tick.
  if (max - min < 5) {
    if (min === 0) max = 5
    else if (max === 0) min = -5
    else max = min + 5
  }

  const ticks: number[] = []
  for (let v = min; v <= max; v += 5) {
    ticks.push(v)
  }

  return { min, max, ticks }
}

/**
 * Index of `isoDate` in the series, or -1.
 * Prefers the last matching vertex so event pins sit on the end-of-day
 * cumulative (not the day-0 origin when the first date is duplicated).
 */
export function seriesIndexOfDate(
  series: readonly TimelineSeriesPoint[],
  isoDate: string,
): number {
  for (let i = series.length - 1; i >= 0; i -= 1) {
    if (series[i]?.date === isoDate) return i
  }
  return -1
}
