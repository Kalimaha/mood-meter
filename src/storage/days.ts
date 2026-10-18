import type { DayMoodEntry, DayNote, MoodRating } from '../domain/types'
import { isIsoDate } from '../domain/dates'
import { isMoodRating } from '../domain/mood'

export const DAYS_STORAGE_KEY = 'mood-meter:days:v1'

export type DayEntriesMap = Record<string, DayMoodEntry>

function isDayNote(value: unknown): value is DayNote {
  if (typeof value !== 'object' || value === null) return false
  const note = value as Record<string, unknown>
  return typeof note.text === 'string' && typeof note.updatedAt === 'string'
}

function isDayMoodEntry(value: unknown): value is DayMoodEntry {
  if (typeof value !== 'object' || value === null) return false
  const entry = value as Record<string, unknown>
  if (typeof entry.date !== 'string' || !isIsoDate(entry.date)) return false
  if (typeof entry.rating !== 'string' || !isMoodRating(entry.rating)) return false
  if (typeof entry.updatedAt !== 'string') return false
  if (entry.note !== undefined && !isDayNote(entry.note)) return false
  return true
}

function readRaw(storage: Storage): DayEntriesMap {
  const raw = storage.getItem(DAYS_STORAGE_KEY)
  if (!raw) return {}

  try {
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return {}
    }

    const entries: DayEntriesMap = {}
    for (const [key, value] of Object.entries(parsed)) {
      if (isDayMoodEntry(value) && value.date === key) {
        entries[key] = value
      }
    }
    return entries
  } catch {
    return {}
  }
}

function writeRaw(storage: Storage, entries: DayEntriesMap): void {
  storage.setItem(DAYS_STORAGE_KEY, JSON.stringify(entries))
}

export function loadDayEntries(storage: Storage = localStorage): DayEntriesMap {
  return readRaw(storage)
}

export function getDayEntry(
  date: string,
  storage: Storage = localStorage,
): DayMoodEntry | undefined {
  return readRaw(storage)[date]
}

export interface UpsertDayEntryInput {
  date: string
  rating: MoodRating
  noteText?: string
  now?: string
}

/**
 * Creates or replaces the entry for a date.
 * Empty note text clears the note.
 */
export function upsertDayEntry(
  input: UpsertDayEntryInput,
  storage: Storage = localStorage,
): DayMoodEntry {
  const now = input.now ?? new Date().toISOString()
  const existing = getDayEntry(input.date, storage)
  const trimmed = input.noteText?.trim()

  let note: DayNote | undefined
  if (trimmed !== undefined && trimmed.length > 0) {
    note = { text: trimmed, updatedAt: now }
  } else if (trimmed === undefined && existing?.note) {
    note = existing.note
  }

  const entry: DayMoodEntry = note
    ? {
        date: input.date,
        rating: input.rating,
        note,
        updatedAt: now,
      }
    : {
        date: input.date,
        rating: input.rating,
        updatedAt: now,
      }

  const entries = readRaw(storage)
  entries[input.date] = entry
  writeRaw(storage, entries)
  return entry
}

export function clearDayEntries(storage: Storage = localStorage): void {
  storage.removeItem(DAYS_STORAGE_KEY)
}
