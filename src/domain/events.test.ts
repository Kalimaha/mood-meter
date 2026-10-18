import { describe, expect, it } from 'vitest'
import {
  compareEventsByStart,
  createTimelineEvent,
  eventOverlapsRange,
  eventsInRange,
  isIsoDate,
  isSingleDayEvent,
  sortEvents,
  validateTimelineEvent,
} from './events'
import type { TimelineEvent } from './types'

describe('isIsoDate', () => {
  it('accepts valid calendar days', () => {
    expect(isIsoDate('2026-10-18')).toBe(true)
    expect(isIsoDate('2024-02-29')).toBe(true)
  })

  it('rejects malformed or impossible dates', () => {
    expect(isIsoDate('2026-10-18T00:00:00Z')).toBe(false)
    expect(isIsoDate('2026/10/18')).toBe(false)
    expect(isIsoDate('2026-02-30')).toBe(false)
    expect(isIsoDate('')).toBe(false)
  })
})

describe('validateTimelineEvent / createTimelineEvent', () => {
  it('rejects empty labels and bad dates', () => {
    expect(
      validateTimelineEvent({ label: '  ', startDate: '2026-01-01' }),
    ).toBe('empty-label')
    expect(
      validateTimelineEvent({ label: 'Trip', startDate: 'nope' }),
    ).toBe('invalid-start')
    expect(
      validateTimelineEvent({
        label: 'Trip',
        startDate: '2026-01-10',
        endDate: 'bad',
      }),
    ).toBe('invalid-end')
    expect(
      validateTimelineEvent({
        label: 'Trip',
        startDate: '2026-01-10',
        endDate: '2026-01-01',
      }),
    ).toBe('end-before-start')
  })

  it('creates a single-day event without endDate', () => {
    const event = createTimelineEvent({
      id: 'e1',
      label: ' Birthday ',
      startDate: '2026-03-01',
    })
    expect(event).toEqual({
      id: 'e1',
      label: 'Birthday',
      startDate: '2026-03-01',
    })
    expect(isSingleDayEvent(event)).toBe(true)
  })

  it('creates a range event and treats end===start as single-day', () => {
    const range = createTimelineEvent({
      id: 'e2',
      label: 'Review',
      startDate: '2026-04-01',
      endDate: '2026-04-05',
    })
    expect(range.endDate).toBe('2026-04-05')
    expect(isSingleDayEvent(range)).toBe(false)

    const collapsed = createTimelineEvent({
      id: 'e3',
      label: 'Same',
      startDate: '2026-04-01',
      endDate: '2026-04-01',
    })
    expect(collapsed.endDate).toBeUndefined()
    expect(isSingleDayEvent(collapsed)).toBe(true)
  })

  it('throws on invalid create input', () => {
    expect(() =>
      createTimelineEvent({ label: '', startDate: '2026-01-01' }),
    ).toThrow(/empty-label/)
  })
})

describe('sort / range helpers', () => {
  const events: TimelineEvent[] = [
    { id: 'b', label: 'Beta', startDate: '2026-02-01' },
    { id: 'a', label: 'Alpha', startDate: '2026-01-15', endDate: '2026-01-20' },
    { id: 'c', label: 'Gamma', startDate: '2026-03-01' },
  ]

  it('sorts by start date then label', () => {
    expect(sortEvents(events).map((e) => e.id)).toEqual(['a', 'b', 'c'])
    expect(compareEventsByStart(events[0]!, events[1]!)).toBeGreaterThan(0)
  })

  it('detects inclusive range overlap', () => {
    expect(
      eventOverlapsRange(events[1]!, '2026-01-20', '2026-01-25'),
    ).toBe(true)
    expect(
      eventOverlapsRange(events[1]!, '2026-01-21', '2026-01-25'),
    ).toBe(false)
    expect(eventOverlapsRange(events[0]!, '2026-02-01', '2026-02-01')).toBe(
      true,
    )
  })

  it('filters and sorts events in range', () => {
    expect(eventsInRange(events, '2026-01-01', '2026-02-15').map((e) => e.id)).toEqual(
      ['a', 'b'],
    )
  })
})
