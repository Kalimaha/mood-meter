import { beforeEach, describe, expect, it } from 'vitest'
import { todayIso } from '../domain/dates'
import { eventHasDescription, isSingleDayEvent } from '../domain/events'
import { loadDayEntries } from './days'
import { loadEvents } from './events'
import {
  DEMO_MOOD_PATTERN,
  DEMO_SEED_APPLIED_KEY,
  buildDemoDayEntries,
  buildDemoEvents,
  clearDemoSeed,
  ensureDemoSeed,
} from './seed'

describe('demo seed', () => {
  beforeEach(() => {
    clearDemoSeed()
  })

  it('builds 25 mood days and 5 events (3 single + 2 range)', () => {
    const today = '2026-10-18'
    const days = buildDemoDayEntries(today, '2026-10-18T12:00:00.000Z')
    const events = buildDemoEvents(today)

    expect(Object.keys(days)).toHaveLength(25)
    expect(Object.values(days).map((d) => d.rating)).toEqual([
      ...DEMO_MOOD_PATTERN,
    ])
    expect(days['2026-09-23']?.rating).toBe('up')
    expect(days['2026-10-17']?.rating).toBe('down')
    expect(days[today]).toBeUndefined()

    expect(events).toHaveLength(5)
    const singles = events.filter(isSingleDayEvent)
    const ranges = events.filter((e) => !isSingleDayEvent(e))
    expect(singles).toHaveLength(3)
    expect(ranges).toHaveLength(2)
    expect(ranges.every((e) => e.endDate! > e.startDate)).toBe(true)

    const singlesWithDesc = singles.filter(eventHasDescription)
    const singlesWithoutDesc = singles.filter((e) => !eventHasDescription(e))
    expect(singlesWithDesc.length).toBeGreaterThanOrEqual(1)
    expect(singlesWithoutDesc.length).toBeGreaterThanOrEqual(1)
    expect(ranges.some(eventHasDescription)).toBe(true)
  })

  it('applies once when storage is empty', () => {
    const first = ensureDemoSeed({ today: todayIso() })
    expect(first.applied).toBe(true)
    expect(first.dayCount).toBe(25)
    expect(first.eventCount).toBe(5)
    expect(Object.keys(loadDayEntries())).toHaveLength(25)
    expect(loadEvents()).toHaveLength(5)
    expect(localStorage.getItem(DEMO_SEED_APPLIED_KEY)).toBe('1')

    const second = ensureDemoSeed({ today: todayIso() })
    expect(second.applied).toBe(false)
  })

  it('skips when the applied flag is already set', () => {
    localStorage.setItem(DEMO_SEED_APPLIED_KEY, '1')
    const result = ensureDemoSeed()
    expect(result.applied).toBe(false)
    expect(Object.keys(loadDayEntries())).toHaveLength(0)
  })

  it('force rewrites even when flag is set', () => {
    ensureDemoSeed({ today: '2026-10-18' })
    localStorage.setItem(DEMO_SEED_APPLIED_KEY, '1')
    const result = ensureDemoSeed({ force: true, today: '2026-10-18' })
    expect(result.applied).toBe(true)
    expect(Object.keys(loadDayEntries())).toHaveLength(25)
  })
})
