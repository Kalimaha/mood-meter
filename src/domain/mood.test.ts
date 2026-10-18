import { describe, expect, it } from 'vitest'
import { isMoodRating, ratingDelta, segmentAngle } from './mood'

describe('ratingDelta', () => {
  it('maps up to +1', () => {
    expect(ratingDelta('up')).toBe(1)
  })

  it('maps flat to 0', () => {
    expect(ratingDelta('flat')).toBe(0)
  })

  it('maps down to -1', () => {
    expect(ratingDelta('down')).toBe(-1)
  })
})

describe('segmentAngle', () => {
  it('returns 0 for equal ratings', () => {
    expect(segmentAngle('flat', 'flat')).toBe(0)
    expect(segmentAngle('up', 'up')).toBe(0)
  })

  it('returns +45 when rising', () => {
    expect(segmentAngle('down', 'flat')).toBe(45)
    expect(segmentAngle('flat', 'up')).toBe(45)
  })

  it('returns -45 when falling', () => {
    expect(segmentAngle('up', 'flat')).toBe(-45)
    expect(segmentAngle('flat', 'down')).toBe(-45)
  })
})

describe('isMoodRating', () => {
  it('accepts valid ratings', () => {
    expect(isMoodRating('up')).toBe(true)
    expect(isMoodRating('flat')).toBe(true)
    expect(isMoodRating('down')).toBe(true)
  })

  it('rejects other strings', () => {
    expect(isMoodRating('maybe')).toBe(false)
    expect(isMoodRating('')).toBe(false)
  })
})
