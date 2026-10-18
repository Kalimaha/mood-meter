import type { MoodRating, TimelineEvent } from '../domain/types'
import { toIsoDate } from '../domain/dates'
import { createTimelineEvent } from '../domain/events'
import {
  type DayEntriesMap,
  DAYS_STORAGE_KEY,
  loadDayEntries,
} from './days'
import { EVENTS_STORAGE_KEY, loadEvents, saveEvents } from './events'

/** Set after demo seed runs (or to skip seed in tests). */
export const DEMO_SEED_APPLIED_KEY = 'mood-meter:demo-seed:v2'
const LEGACY_SEED_KEYS = [
  'mood-meter:demo-seed:v1',
] as const

/** 25 mood samples: mix of up (+), flat (=), down (−). */
export const DEMO_MOOD_PATTERN: readonly MoodRating[] = [
  'up',
  'up',
  'flat',
  'down',
  'down',
  'flat',
  'up',
  'flat',
  'down',
  'up',
  'flat',
  'flat',
  'up',
  'down',
  'up',
  'down',
  'flat',
  'up',
  'up',
  'down',
  'flat',
  'down',
  'up',
  'flat',
  'down',
] as const

function shiftIsoDate(iso: string, deltaDays: number): string {
  const [y, m, d] = iso.split('-').map(Number) as [number, number, number]
  const date = new Date(y, m - 1, d)
  date.setDate(date.getDate() + deltaDays)
  return toIsoDate(date)
}

export interface DemoSeedOptions {
  /** When true, overwrite existing days/events. */
  force?: boolean
  /** Anchor “today” for relative dates (tests). Default: real today. */
  today?: string
  storage?: Storage
}

export interface DemoSeedResult {
  applied: boolean
  dayCount: number
  eventCount: number
}

/** Build 25 day entries ending yesterday (leaves today free to rate). */
export function buildDemoDayEntries(
  todayIso: string = toIsoDate(),
  now: string = new Date().toISOString(),
): DayEntriesMap {
  const entries: DayEntriesMap = {}
  for (let i = 0; i < DEMO_MOOD_PATTERN.length; i += 1) {
    // Oldest first: 25 days ago … yesterday
    const daysAgo = DEMO_MOOD_PATTERN.length - i
    const date = shiftIsoDate(todayIso, -daysAgo)
    const rating = DEMO_MOOD_PATTERN[i]!
    entries[date] = { date, rating, updatedAt: now }
  }
  return entries
}

/** 3 single-day + 2 range events aligned to the demo mood window. */
export function buildDemoEvents(todayIso: string = toIsoDate()): TimelineEvent[] {
  return [
    createTimelineEvent({
      id: 'seed-evt-dentist',
      label: 'Dentist',
      description: 'Routine checkup at 10am',
      startDate: shiftIsoDate(todayIso, -5),
    }),
    createTimelineEvent({
      id: 'seed-evt-lunch',
      label: 'Team lunch',
      startDate: shiftIsoDate(todayIso, -12),
    }),
    createTimelineEvent({
      id: 'seed-evt-concert',
      label: 'Concert',
      description: 'Indie night at The Forum',
      startDate: shiftIsoDate(todayIso, -20),
    }),
    createTimelineEvent({
      id: 'seed-evt-holiday',
      label: 'Long weekend away',
      description: 'Coast trip with friends',
      startDate: shiftIsoDate(todayIso, -18),
      endDate: shiftIsoDate(todayIso, -15),
    }),
    createTimelineEvent({
      id: 'seed-evt-sick',
      label: 'Under the weather',
      startDate: shiftIsoDate(todayIso, -8),
      endDate: shiftIsoDate(todayIso, -6),
    }),
  ]
}

/**
 * Writes demo moods/events when storage is empty (first visit).
 * Migrates v1 → v2 by refreshing events (so described singles show filled dots).
 * Tests can set `DEMO_SEED_APPLIED_KEY` to skip without seeding.
 */
export function ensureDemoSeed(options: DemoSeedOptions = {}): DemoSeedResult {
  const storage = options.storage ?? localStorage
  const today = options.today ?? toIsoDate()

  if (!options.force && storage.getItem(DEMO_SEED_APPLIED_KEY)) {
    return { applied: false, dayCount: 0, eventCount: 0 }
  }

  const hadLegacy = LEGACY_SEED_KEYS.some((key) => storage.getItem(key))
  const existingDays = loadDayEntries(storage)
  const existingEvents = loadEvents(storage)
  const hasDays = Object.keys(existingDays).length > 0
  const hasEvents = existingEvents.length > 0

  // Upgrade legacy seed: keep days, replace events with described singles + ranges
  if (!options.force && hadLegacy && hasDays) {
    const events = buildDemoEvents(today)
    saveEvents(events, storage)
    for (const key of LEGACY_SEED_KEYS) storage.removeItem(key)
    storage.setItem(DEMO_SEED_APPLIED_KEY, '1')
    return { applied: true, dayCount: Object.keys(existingDays).length, eventCount: events.length }
  }

  if (!options.force && (hasDays || hasEvents)) {
    storage.setItem(DEMO_SEED_APPLIED_KEY, '1')
    return { applied: false, dayCount: 0, eventCount: 0 }
  }

  const days = buildDemoDayEntries(today)
  const events = buildDemoEvents(today)
  storage.setItem(DAYS_STORAGE_KEY, JSON.stringify(days))
  saveEvents(events, storage)
  for (const key of LEGACY_SEED_KEYS) storage.removeItem(key)
  storage.setItem(DEMO_SEED_APPLIED_KEY, '1')

  return {
    applied: true,
    dayCount: Object.keys(days).length,
    eventCount: events.length,
  }
}

/** Clear demo flag + storage keys (tests / reset). */
export function clearDemoSeed(storage: Storage = localStorage): void {
  storage.removeItem(DEMO_SEED_APPLIED_KEY)
  for (const key of LEGACY_SEED_KEYS) storage.removeItem(key)
  storage.removeItem(DAYS_STORAGE_KEY)
  storage.removeItem(EVENTS_STORAGE_KEY)
}
