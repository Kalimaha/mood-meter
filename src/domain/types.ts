/** Three-value daily mood rating. */
export type MoodRating = 'up' | 'flat' | 'down'

/** Optional short comment tied to a day's rating. */
export interface DayNote {
  text: string
  updatedAt: string
}

/** One day's mood entry (rating + optional note). */
export interface DayMoodEntry {
  date: string
  rating: MoodRating
  note?: DayNote
  updatedAt: string
}

/** Personal event marker on the timeline. */
export interface TimelineEvent {
  id: string
  label: string
  /** Optional longer text shown on click when non-empty after trim. */
  description?: string
  /** ISO date (YYYY-MM-DD) for single-day, or range start. */
  startDate: string
  /** ISO date for range end; omit for single-day events. */
  endDate?: string
}
