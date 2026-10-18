import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { formatIsoDateLabel, isIsoDate, toIsoDate, todayIso } from './dates'

describe('toIsoDate', () => {
  it('formats a local calendar date as YYYY-MM-DD', () => {
    expect(toIsoDate(new Date(2026, 9, 18))).toBe('2026-10-18')
  })
})

describe('todayIso', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 9, 18, 15, 30, 0))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns today in ISO form', () => {
    expect(todayIso()).toBe('2026-10-18')
  })
})

describe('formatIsoDateLabel', () => {
  it('returns a readable label for a valid ISO date', () => {
    expect(formatIsoDateLabel('2026-10-18')).toMatch(/2026/)
    expect(formatIsoDateLabel('2026-10-18')).toMatch(/18/)
  })
})

describe('isIsoDate', () => {
  it('accepts YYYY-MM-DD', () => {
    expect(isIsoDate('2026-10-18')).toBe(true)
  })

  it('rejects other shapes', () => {
    expect(isIsoDate('10/18/2026')).toBe(false)
    expect(isIsoDate('')).toBe(false)
  })
})
