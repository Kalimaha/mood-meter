import type { TimelineEvent } from './types'

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

export interface CreateTimelineEventInput {
  label: string
  /** Optional; blank/whitespace is omitted from the stored event. */
  description?: string
  startDate: string
  endDate?: string
  id?: string
}

export type TimelineEventValidationError =
  | 'empty-label'
  | 'invalid-start'
  | 'invalid-end'
  | 'end-before-start'

/** True when `value` is a calendar day in YYYY-MM-DD form. */
export function isIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false
  const [y, m, d] = value.split('-').map(Number) as [number, number, number]
  const date = new Date(Date.UTC(y, m - 1, d))
  return (
    date.getUTCFullYear() === y &&
    date.getUTCMonth() === m - 1 &&
    date.getUTCDate() === d
  )
}

/** Single-day events have no end, or end equal to start. */
export function isSingleDayEvent(event: TimelineEvent): boolean {
  return event.endDate === undefined || event.endDate === event.startDate
}

/** True when the event has a non-empty trimmed description. */
export function eventHasDescription(event: TimelineEvent): boolean {
  return (
    event.description !== undefined && event.description.trim().length > 0
  )
}

export function validateTimelineEvent(
  input: CreateTimelineEventInput,
): TimelineEventValidationError | null {
  if (input.label.trim().length === 0) return 'empty-label'
  if (!isIsoDate(input.startDate)) return 'invalid-start'
  if (input.endDate !== undefined) {
    if (!isIsoDate(input.endDate)) return 'invalid-end'
    if (input.endDate < input.startDate) return 'end-before-start'
  }
  return null
}

function newEventId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `evt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}

/**
 * Build a validated `TimelineEvent`. Throws when input fails validation.
 * Omits `endDate` for single-day events (missing or equal to start).
 */
export function createTimelineEvent(
  input: CreateTimelineEventInput,
): TimelineEvent {
  const error = validateTimelineEvent(input)
  if (error !== null) {
    throw new Error(`Invalid timeline event: ${error}`)
  }

  const label = input.label.trim()
  const description =
    input.description !== undefined ? input.description.trim() : ''
  const startDate = input.startDate
  const endDate =
    input.endDate !== undefined && input.endDate !== startDate
      ? input.endDate
      : undefined

  const event: TimelineEvent = {
    id: input.id ?? newEventId(),
    label,
    startDate,
  }

  if (description.length > 0) {
    event.description = description
  }

  if (endDate !== undefined) {
    event.endDate = endDate
  }

  return event
}

export function compareEventsByStart(
  a: TimelineEvent,
  b: TimelineEvent,
): number {
  if (a.startDate < b.startDate) return -1
  if (a.startDate > b.startDate) return 1
  if (a.label < b.label) return -1
  if (a.label > b.label) return 1
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0
}

export function sortEvents(events: readonly TimelineEvent[]): TimelineEvent[] {
  return [...events].sort(compareEventsByStart)
}

/** Inclusive overlap of event span with [rangeStart, rangeEnd]. */
export function eventOverlapsRange(
  event: TimelineEvent,
  rangeStart: string,
  rangeEnd: string,
): boolean {
  const eventEnd = event.endDate ?? event.startDate
  return event.startDate <= rangeEnd && eventEnd >= rangeStart
}

export function eventsInRange(
  events: readonly TimelineEvent[],
  rangeStart: string,
  rangeEnd: string,
): TimelineEvent[] {
  return sortEvents(
    events.filter((event) => eventOverlapsRange(event, rangeStart, rangeEnd)),
  )
}
