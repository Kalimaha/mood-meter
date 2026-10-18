import { beforeEach, describe, expect, it } from 'vitest'
import {
  DAYS_STORAGE_KEY,
  clearDayEntries,
  getDayEntry,
  loadDayEntries,
  upsertDayEntry,
} from './days'

function memoryStorage(): Storage {
  const map = new Map<string, string>()
  return {
    get length() {
      return map.size
    },
    clear() {
      map.clear()
    },
    getItem(key: string) {
      return map.get(key) ?? null
    },
    key(index: number) {
      return [...map.keys()][index] ?? null
    },
    removeItem(key: string) {
      map.delete(key)
    },
    setItem(key: string, value: string) {
      map.set(key, value)
    },
  }
}

describe('days storage', () => {
  let storage: Storage

  beforeEach(() => {
    storage = memoryStorage()
  })

  it('returns empty map when nothing stored', () => {
    expect(loadDayEntries(storage)).toEqual({})
  })

  it('upserts a rating and reads it back', () => {
    const entry = upsertDayEntry(
      { date: '2026-10-18', rating: 'up', now: '2026-10-18T12:00:00.000Z' },
      storage,
    )
    expect(entry.rating).toBe('up')
    expect(getDayEntry('2026-10-18', storage)?.rating).toBe('up')
    expect(loadDayEntries(storage)['2026-10-18']?.rating).toBe('up')
  })

  it('stores an optional note', () => {
    upsertDayEntry(
      {
        date: '2026-10-18',
        rating: 'flat',
        noteText: '  decent day  ',
        now: '2026-10-18T12:00:00.000Z',
      },
      storage,
    )
    const entry = getDayEntry('2026-10-18', storage)
    expect(entry?.note?.text).toBe('decent day')
  })

  it('preserves existing note when noteText is omitted', () => {
    upsertDayEntry(
      {
        date: '2026-10-18',
        rating: 'up',
        noteText: 'kept',
        now: '2026-10-18T10:00:00.000Z',
      },
      storage,
    )
    upsertDayEntry(
      { date: '2026-10-18', rating: 'down', now: '2026-10-18T11:00:00.000Z' },
      storage,
    )
    expect(getDayEntry('2026-10-18', storage)?.note?.text).toBe('kept')
    expect(getDayEntry('2026-10-18', storage)?.rating).toBe('down')
  })

  it('clears note when noteText is empty string', () => {
    upsertDayEntry(
      {
        date: '2026-10-18',
        rating: 'up',
        noteText: 'gone',
        now: '2026-10-18T10:00:00.000Z',
      },
      storage,
    )
    upsertDayEntry(
      {
        date: '2026-10-18',
        rating: 'up',
        noteText: '   ',
        now: '2026-10-18T11:00:00.000Z',
      },
      storage,
    )
    expect(getDayEntry('2026-10-18', storage)?.note).toBeUndefined()
  })

  it('ignores corrupt storage payloads', () => {
    storage.setItem(DAYS_STORAGE_KEY, '{not-json')
    expect(loadDayEntries(storage)).toEqual({})
  })

  it('clearDayEntries removes the key', () => {
    upsertDayEntry({ date: '2026-10-18', rating: 'up' }, storage)
    clearDayEntries(storage)
    expect(storage.getItem(DAYS_STORAGE_KEY)).toBeNull()
  })
})
