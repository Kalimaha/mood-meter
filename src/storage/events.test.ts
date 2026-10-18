import { beforeEach, describe, expect, it } from 'vitest'
import { createTimelineEvent } from '../domain/events'
import {
  EVENTS_STORAGE_KEY,
  addEvent,
  clearEvents,
  deleteEvent,
  loadEvents,
  saveEvents,
  upsertEvent,
} from './events'

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
      return map.has(key) ? map.get(key)! : null
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

describe('events storage', () => {
  let storage: Storage

  beforeEach(() => {
    storage = memoryStorage()
  })

  it('round-trips events through localStorage', () => {
    const first = createTimelineEvent({
      id: '1',
      label: 'Birthday',
      description: 'Cake at noon',
      startDate: '2026-03-01',
    })
    const second = createTimelineEvent({
      id: '2',
      label: 'Review',
      startDate: '2026-04-01',
      endDate: '2026-04-05',
    })

    saveEvents([second, first], storage)
    expect(loadEvents(storage)).toEqual([first, second])
    expect(storage.getItem(EVENTS_STORAGE_KEY)).toContain('Birthday')
    expect(storage.getItem(EVENTS_STORAGE_KEY)).toContain('Cake at noon')
  })

  it('upserts, adds, and deletes by id', () => {
    const list = addEvent(
      { id: 'a', label: 'One', startDate: '2026-01-01' },
      storage,
    )
    expect(list).toHaveLength(1)

    const updated = upsertEvent(
      createTimelineEvent({
        id: 'a',
        label: 'One updated',
        startDate: '2026-01-02',
      }),
      storage,
    )
    expect(updated[0]?.label).toBe('One updated')
    expect(updated[0]?.startDate).toBe('2026-01-02')

    expect(deleteEvent('a', storage)).toEqual([])
    expect(loadEvents(storage)).toEqual([])
  })

  it('ignores corrupt payloads and null storage', () => {
    storage.setItem(EVENTS_STORAGE_KEY, '{not-json')
    expect(loadEvents(storage)).toEqual([])

    storage.setItem(
      EVENTS_STORAGE_KEY,
      JSON.stringify([{ id: 'x', label: '', startDate: 'bad' }, 'nope']),
    )
    expect(loadEvents(storage)).toEqual([])

    expect(loadEvents(null)).toEqual([])
    saveEvents(
      [createTimelineEvent({ id: 'z', label: 'Z', startDate: '2026-01-01' })],
      null,
    )
    expect(deleteEvent('z', null)).toEqual([])
  })

  it('clears the storage key', () => {
    addEvent({ id: 'a', label: 'One', startDate: '2026-01-01' }, storage)
    clearEvents(storage)
    expect(storage.getItem(EVENTS_STORAGE_KEY)).toBeNull()
  })
})
