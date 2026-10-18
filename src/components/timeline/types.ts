import type { MoodRating } from '../../domain/types'

/** Alias of domain `MoodRating` — prefer importing MoodRating for new code. */
export type DayRating = MoodRating

/** One day on the timeline polyline. */
export interface TimelineDay {
  /** ISO date YYYY-MM-DD */
  date: string
  rating: MoodRating
}

export interface Point {
  x: number
  y: number
}

export interface TimelineGeometry {
  /** Polyline vertices: start + one end-point per day. */
  points: Point[]
  /** SVG path `d` for the polyline. */
  pathD: string
  /** Content width in user units (for viewBox / scroll). */
  width: number
  /** Content height in user units. */
  height: number
  /** viewBox string. */
  viewBox: string
}
