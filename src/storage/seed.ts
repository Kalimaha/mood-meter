import type { MoodRating, TimelineEvent } from '../domain/types'
import { toIsoDate } from '../domain/dates'
import { createTimelineEvent } from '../domain/events'
import {
  type DayEntriesMap,
  DAYS_STORAGE_KEY,
  loadDayEntries,
} from './days'
import { EVENTS_STORAGE_KEY, loadEvents, saveEvents } from './events'

/**
 * Current demo-seed version flag.
 *
 * **How version bumps work for existing users**
 * - Empty storage (no days/events, no flag) → full v3 seed on first visit.
 * - Prior demo flags (`v1` / `v2` in `LEGACY_SEED_KEYS`) → replace days + events
 *   with this version’s seed, then clear legacy flags and set this key.
 * - Current flag already set → no-op (keeps user edits after the upgrade).
 * - Storage has days/events but no seed flag (manual / pre-seed data) → mark
 *   current flag only; do not overwrite.
 * - `force: true` → always rewrite days + events (tests / reset tooling).
 *
 * Bumping: change `DEMO_SEED_APPLIED_KEY` to the next `vN`, add the previous
 * key to `LEGACY_SEED_KEYS`, and update `buildDemoDayEntries` / `buildDemoEvents`.
 */
export const DEMO_SEED_APPLIED_KEY = 'mood-meter:demo-seed:v3'
const LEGACY_SEED_KEYS = [
  'mood-meter:demo-seed:v1',
  'mood-meter:demo-seed:v2',
] as const

/** Demo mood day count (ends yesterday; today left free to rate). */
export const DEMO_DAY_COUNT = 500

/** Target share of flat (`=`) ratings in the deterministic pattern. */
export const DEMO_FLAT_RATIO = 0.7

/** Fixed PRNG seed so demo moods stay stable across builds/tests. */
const DEMO_PATTERN_SEED = 0x4d6f6f64 // "Mood"

/**
 * Deterministic 500-day mood sequence: ~70% flat, remainder split up/down.
 * Built once at module load for stable exports and tests.
 */
export const DEMO_MOOD_PATTERN: readonly MoodRating[] = buildMoodPattern(
  DEMO_DAY_COUNT,
  DEMO_FLAT_RATIO,
  DEMO_PATTERN_SEED,
)

/** Mulberry32 — tiny deterministic PRNG for shuffle. */
function mulberry32(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function buildMoodPattern(
  count: number,
  flatRatio: number,
  seed: number,
): MoodRating[] {
  const flatCount = Math.round(count * flatRatio)
  const remainder = count - flatCount
  const upCount = Math.floor(remainder / 2)
  const downCount = remainder - upCount

  const ratings: MoodRating[] = [
    ...Array.from({ length: flatCount }, (): MoodRating => 'flat'),
    ...Array.from({ length: upCount }, (): MoodRating => 'up'),
    ...Array.from({ length: downCount }, (): MoodRating => 'down'),
  ]

  const random = mulberry32(seed)
  for (let i = ratings.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))
    const tmp = ratings[i]!
    ratings[i] = ratings[j]!
    ratings[j] = tmp
  }
  return ratings
}

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

function writeDemoSeed(storage: Storage, today: string): DemoSeedResult {
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

/** Build demo day entries ending yesterday (leaves today free to rate). */
export function buildDemoDayEntries(
  todayIso: string = toIsoDate(),
  now: string = new Date().toISOString(),
): DayEntriesMap {
  const entries: DayEntriesMap = {}
  for (let i = 0; i < DEMO_MOOD_PATTERN.length; i += 1) {
    // Oldest first: N days ago … yesterday
    const daysAgo = DEMO_MOOD_PATTERN.length - i
    const date = shiftIsoDate(todayIso, -daysAgo)
    const rating = DEMO_MOOD_PATTERN[i]!
    entries[date] = { date, rating, updatedAt: now }
  }
  return entries
}

/**
 * Several single-day + several range events across the ~500-day window.
 * Some singles/ranges include descriptions (filled timeline dots); some omit them.
 */
export function buildDemoEvents(todayIso: string = toIsoDate()): TimelineEvent[] {
  return [
    // —— single-day ——
    createTimelineEvent({
      id: 'seed-evt-birthday',
      label: 'Birthday',
      description: 'Cake and candles with family',
      startDate: shiftIsoDate(todayIso, -42),
    }),
    createTimelineEvent({
      id: 'seed-evt-dentist',
      label: 'Dentist',
      description: 'Routine checkup at 10am',
      startDate: shiftIsoDate(todayIso, -18),
    }),
    createTimelineEvent({
      id: 'seed-evt-concert',
      label: 'Concert',
      description: 'Indie night at The Forum',
      startDate: shiftIsoDate(todayIso, -95),
    }),
    createTimelineEvent({
      id: 'seed-evt-interview',
      label: 'Job interview',
      startDate: shiftIsoDate(todayIso, -210),
    }),
    createTimelineEvent({
      id: 'seed-evt-lunch',
      label: 'Team lunch',
      startDate: shiftIsoDate(todayIso, -7),
    }),
    createTimelineEvent({
      id: 'seed-evt-race',
      label: '5K race',
      description: 'Personal best — sunny morning',
      startDate: shiftIsoDate(todayIso, -320),
    }),
    // —— ranges ——
    createTimelineEvent({
      id: 'seed-evt-holiday',
      label: 'Long weekend away',
      description: 'Coast trip with friends',
      startDate: shiftIsoDate(todayIso, -60),
      endDate: shiftIsoDate(todayIso, -57),
    }),
    createTimelineEvent({
      id: 'seed-evt-sick',
      label: 'Under the weather',
      startDate: shiftIsoDate(todayIso, -28),
      endDate: shiftIsoDate(todayIso, -25),
    }),
    createTimelineEvent({
      id: 'seed-evt-review',
      label: 'Performance review week',
      description: 'Manager 1:1s and peer feedback',
      startDate: shiftIsoDate(todayIso, -140),
      endDate: shiftIsoDate(todayIso, -134),
    }),
    createTimelineEvent({
      id: 'seed-evt-move',
      label: 'Apartment move',
      startDate: shiftIsoDate(todayIso, -400),
      endDate: shiftIsoDate(todayIso, -393),
    }),
    createTimelineEvent({
      id: 'seed-evt-conference',
      label: 'Dev conference',
      description: 'Talks + hallway track',
      startDate: shiftIsoDate(todayIso, -250),
      endDate: shiftIsoDate(todayIso, -247),
    }),
  ]
}

/**
 * Writes demo moods/events when storage is empty (first visit).
 * Upgrades v1/v2 demo flags by replacing with the current 500-day seed.
 * Tests can set `DEMO_SEED_APPLIED_KEY` to skip without seeding.
 */
export function ensureDemoSeed(options: DemoSeedOptions = {}): DemoSeedResult {
  const storage = options.storage ?? localStorage
  const today = options.today ?? toIsoDate()

  if (!options.force && storage.getItem(DEMO_SEED_APPLIED_KEY)) {
    return { applied: false, dayCount: 0, eventCount: 0 }
  }

  if (options.force) {
    return writeDemoSeed(storage, today)
  }

  const hadLegacy = LEGACY_SEED_KEYS.some((key) => storage.getItem(key))
  const existingDays = loadDayEntries(storage)
  const existingEvents = loadEvents(storage)
  const hasDays = Object.keys(existingDays).length > 0
  const hasEvents = existingEvents.length > 0

  // Prior demo versions → full replace with current seed (500 days + events)
  if (hadLegacy) {
    return writeDemoSeed(storage, today)
  }

  // Non-demo data already present: adopt current flag, do not overwrite
  if (hasDays || hasEvents) {
    storage.setItem(DEMO_SEED_APPLIED_KEY, '1')
    return { applied: false, dayCount: 0, eventCount: 0 }
  }

  return writeDemoSeed(storage, today)
}

/** Clear demo flag + storage keys (tests / reset). */
export function clearDemoSeed(storage: Storage = localStorage): void {
  storage.removeItem(DEMO_SEED_APPLIED_KEY)
  for (const key of LEGACY_SEED_KEYS) storage.removeItem(key)
  storage.removeItem(DAYS_STORAGE_KEY)
  storage.removeItem(EVENTS_STORAGE_KEY)
}
