import type { MoodRating } from './types'

const RATING_DELTA: Record<MoodRating, number> = {
  up: 1,
  flat: 0,
  down: -1,
}

/** Numeric delta used for timeline segment geometry. */
export function ratingDelta(rating: MoodRating): number {
  return RATING_DELTA[rating]
}

/** Slope angle in degrees between consecutive day ratings for the polyline. */
export function segmentAngle(from: MoodRating, to: MoodRating): number {
  const rise = ratingDelta(to) - ratingDelta(from)
  if (rise === 0) return 0
  if (rise > 0) return 45
  return -45
}

export function isMoodRating(value: string): value is MoodRating {
  return value === 'up' || value === 'flat' || value === 'down'
}
