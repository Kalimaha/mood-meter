import { beforeEach, describe, expect, it } from 'vitest'
import { todayIso } from '../domain/dates'
import { eventHasDescription, isSingleDayEvent } from '../domain/events'
import { DAYS_STORAGE_KEY, loadDayEntries } from './days'
import { EVENTS_STORAGE_KEY, loadEvents } from './events'
import {
  DEMO_DAY_COUNT,
  DEMO_FLAT_RATIO,
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

  it('builds 500 mood days (~70% flat) and several single + range events', () => {
    const today = '2026-10-18'
    const days = buildDemoDayEntries(today, '2026-10-18T12:00:00.000Z')
    const events = buildDemoEvents(today)

    expect(DEMO_MOOD_PATTERN).toHaveLength(DEMO_DAY_COUNT)
    expect(Object.keys(days)).toHaveLength(DEMO_DAY_COUNT)

    const ratings = Object.values(days).map((d) => d.rating)
    expect(ratings).toEqual([...DEMO_MOOD_PATTERN])

    const flatCount = ratings.filter((r) => r === 'flat').length
    const upCount = ratings.filter((r) => r === 'up').length
    const downCount = ratings.filter((r) => r === 'down').length
    expect(flatCount).toBe(Math.round(DEMO_DAY_COUNT * DEMO_FLAT_RATIO))
    expect(flatCount / DEMO_DAY_COUNT).toBeCloseTo(DEMO_FLAT_RATIO, 2)
    expect(upCount + downCount).toBe(DEMO_DAY_COUNT - flatCount)
    expect(upCount).toBeGreaterThan(0)
    expect(downCount).toBeGreaterThan(0)

    // Window: 500 days ago … yesterday; today left free
    expect(days['2025-06-05']?.rating).toBe(DEMO_MOOD_PATTERN[0])
    expect(days['2026-10-17']?.rating).toBe(
      DEMO_MOOD_PATTERN[DEMO_DAY_COUNT - 1],
    )
    expect(days[today]).toBeUndefined()

    const singles = events.filter(isSingleDayEvent)
    const ranges = events.filter((e) => !isSingleDayEvent(e))
    expect(singles.length).toBeGreaterThanOrEqual(4)
    expect(ranges.length).toBeGreaterThanOrEqual(4)
    expect(ranges.every((e) => e.endDate! > e.startDate)).toBe(true)

    const singlesWithDesc = singles.filter(eventHasDescription)
    const singlesWithoutDesc = singles.filter((e) => !eventHasDescription(e))
    expect(singlesWithDesc.length).toBeGreaterThanOrEqual(2)
    expect(singlesWithoutDesc.length).toBeGreaterThanOrEqual(1)
    expect(ranges.some(eventHasDescription)).toBe(true)
    expect(ranges.some((e) => !eventHasDescription(e))).toBe(true)

    const labels = new Set(events.map((e) => e.label))
    expect(labels.size).toBe(events.length)
  })

  it('applies once when storage is empty', () => {
    const first = ensureDemoSeed({ today: todayIso() })
    expect(first.applied).toBe(true)
    expect(first.dayCount).toBe(DEMO_DAY_COUNT)
    expect(first.eventCount).toBe(buildDemoEvents().length)
    expect(Object.keys(loadDayEntries())).toHaveLength(DEMO_DAY_COUNT)
    expect(loadEvents()).toHaveLength(buildDemoEvents().length)
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
    expect(Object.keys(loadDayEntries())).toHaveLength(DEMO_DAY_COUNT)
  })

  it('upgrades legacy v2 flag by replacing with 500-day seed', () => {
    localStorage.setItem('mood-meter:demo-seed:v2', '1')
    localStorage.setItem(
      DAYS_STORAGE_KEY,
      JSON.stringify({
        '2026-10-01': {
          date: '2026-10-01',
          rating: 'up',
          updatedAt: '2026-10-01T00:00:00.000Z',
        },
      }),
    )
    localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify([]))

    const result = ensureDemoSeed({ today: '2026-10-18' })
    expect(result.applied).toBe(true)
    expect(result.dayCount).toBe(DEMO_DAY_COUNT)
    expect(Object.keys(loadDayEntries())).toHaveLength(DEMO_DAY_COUNT)
    expect(loadEvents().length).toBeGreaterThanOrEqual(8)
    expect(localStorage.getItem(DEMO_SEED_APPLIED_KEY)).toBe('1')
    expect(localStorage.getItem('mood-meter:demo-seed:v2')).toBeNull()
  })

  it('does not overwrite non-demo data without a legacy flag', () => {
    localStorage.setItem(
      DAYS_STORAGE_KEY,
      JSON.stringify({
        '2026-10-01': {
          date: '2026-10-01',
          rating: 'down',
          updatedAt: '2026-10-01T00:00:00.000Z',
        },
      }),
    )

    const result = ensureDemoSeed({ today: '2026-10-18' })
    expect(result.applied).toBe(false)
    expect(Object.keys(loadDayEntries())).toHaveLength(1)
    expect(loadDayEntries()['2026-10-01']?.rating).toBe('down')
    expect(localStorage.getItem(DEMO_SEED_APPLIED_KEY)).toBe('1')
  })
})
