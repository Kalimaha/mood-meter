import { describe, expect, it } from 'vitest'
import type { DayEntriesMap } from './days'
import { dayEntriesToTimelineDays } from './timelineDays'

describe('dayEntriesToTimelineDays', () => {
  it('maps and sorts entries by date', () => {
    const entries: DayEntriesMap = {
      '2026-03-03': {
        date: '2026-03-03',
        rating: 'down',
        updatedAt: 't',
      },
      '2026-03-01': {
        date: '2026-03-01',
        rating: 'up',
        updatedAt: 't',
      },
    }

    expect(dayEntriesToTimelineDays(entries)).toEqual([
      { date: '2026-03-01', rating: 'up' },
      { date: '2026-03-03', rating: 'down' },
    ])
  })
})
