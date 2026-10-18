import type { DayEntriesMap } from './days'
import type { TimelineDay } from '../components/timeline/types'

/** Convert persisted day entries into sorted timeline points. */
export function dayEntriesToTimelineDays(
  entries: DayEntriesMap,
): TimelineDay[] {
  return Object.values(entries)
    .map(
      (entry): TimelineDay => ({
        date: entry.date,
        rating: entry.rating,
      }),
    )
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
}
