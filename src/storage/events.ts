import {
  createTimelineEvent,
  sortEvents,
  type CreateTimelineEventInput,
} from '../domain/events'
import type { TimelineEvent } from '../domain/types'

export const EVENTS_STORAGE_KEY = 'mood-meter:events'

function defaultStorage(): Storage | null {
  if (typeof globalThis === 'undefined') return null
  try {
    return globalThis.localStorage
  } catch {
    return null
  }
}

function isTimelineEvent(value: unknown): value is TimelineEvent {
  if (typeof value !== 'object' || value === null) return false
  const record = value as Record<string, unknown>
  if (typeof record.id !== 'string' || record.id.length === 0) return false
  if (typeof record.label !== 'string') return false
  if (typeof record.startDate !== 'string') return false
  if (
    record.endDate !== undefined &&
    typeof record.endDate !== 'string'
  ) {
    return false
  }
  try {
    createTimelineEvent({
      id: record.id,
      label: record.label,
      startDate: record.startDate,
      ...(typeof record.endDate === 'string'
        ? { endDate: record.endDate }
        : {}),
    })
    return true
  } catch {
    return false
  }
}

function parseEvents(raw: string | null): TimelineEvent[] {
  if (raw === null || raw.trim() === '') return []
  let parsed: unknown
  try {
    parsed = JSON.parse(raw) as unknown
  } catch {
    return []
  }
  if (!Array.isArray(parsed)) return []
  const events: TimelineEvent[] = []
  for (const item of parsed) {
    if (isTimelineEvent(item)) {
      events.push(
        createTimelineEvent({
          id: item.id,
          label: item.label,
          startDate: item.startDate,
          ...(item.endDate !== undefined ? { endDate: item.endDate } : {}),
        }),
      )
    }
  }
  return sortEvents(events)
}

/** Load persisted events; returns [] when storage is missing or corrupt. */
export function loadEvents(storage: Storage | null = defaultStorage()): TimelineEvent[] {
  if (storage === null) return []
  try {
    return parseEvents(storage.getItem(EVENTS_STORAGE_KEY))
  } catch {
    return []
  }
}

/** Replace the full events list in storage. */
export function saveEvents(
  events: readonly TimelineEvent[],
  storage: Storage | null = defaultStorage(),
): void {
  if (storage === null) return
  storage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(sortEvents(events)))
}

/** Insert or replace by id; returns the updated sorted list. */
export function upsertEvent(
  event: TimelineEvent,
  storage: Storage | null = defaultStorage(),
): TimelineEvent[] {
  const next = loadEvents(storage).filter((item) => item.id !== event.id)
  next.push(event)
  const sorted = sortEvents(next)
  saveEvents(sorted, storage)
  return sorted
}

/** Create from form input, persist, and return the new list. */
export function addEvent(
  input: CreateTimelineEventInput,
  storage: Storage | null = defaultStorage(),
): TimelineEvent[] {
  return upsertEvent(createTimelineEvent(input), storage)
}

/** Remove by id; returns the updated list. */
export function deleteEvent(
  id: string,
  storage: Storage | null = defaultStorage(),
): TimelineEvent[] {
  const next = loadEvents(storage).filter((item) => item.id !== id)
  saveEvents(next, storage)
  return next
}

/** Clear all persisted events. */
export function clearEvents(storage: Storage | null = defaultStorage()): void {
  if (storage === null) return
  storage.removeItem(EVENTS_STORAGE_KEY)
}
