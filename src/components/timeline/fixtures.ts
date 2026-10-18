import type { TimelineDay } from './types'

/** All-flat stretch — cumulative path stays at 0. */
export const flatSequence: TimelineDay[] = [
  { date: '2026-03-01', rating: 'flat' },
  { date: '2026-03-02', rating: 'flat' },
  { date: '2026-03-03', rating: 'flat' },
  { date: '2026-03-04', rating: 'flat' },
  { date: '2026-03-05', rating: 'flat' },
]

/** Rising stretch — cumulative climbs by +1/day. */
export const upSequence: TimelineDay[] = [
  { date: '2026-03-01', rating: 'up' },
  { date: '2026-03-02', rating: 'up' },
  { date: '2026-03-03', rating: 'up' },
  { date: '2026-03-04', rating: 'up' },
]

/** Falling stretch — cumulative drops by −1/day. */
export const downSequence: TimelineDay[] = [
  { date: '2026-03-01', rating: 'down' },
  { date: '2026-03-02', rating: 'down' },
  { date: '2026-03-03', rating: 'down' },
  { date: '2026-03-04', rating: 'down' },
]

/** Mixed path covering up / flat / down. */
export const mixedSequence: TimelineDay[] = [
  { date: '2026-03-01', rating: 'flat' },
  { date: '2026-03-02', rating: 'up' },
  { date: '2026-03-03', rating: 'up' },
  { date: '2026-03-04', rating: 'flat' },
  { date: '2026-03-05', rating: 'down' },
  { date: '2026-03-06', rating: 'down' },
  { date: '2026-03-07', rating: 'flat' },
  { date: '2026-03-08', rating: 'up' },
]

/** Long enough to require horizontal scroll in the default story width. */
export const scrollSequence: TimelineDay[] = Array.from(
  { length: 28 },
  (_, i): TimelineDay => {
    const day = i + 1
    const date = `2026-03-${String(day).padStart(2, '0')}`
    const cycle = i % 6
    const rating: TimelineDay['rating'] =
      cycle < 2 ? 'up' : cycle < 4 ? 'flat' : 'down'
    return { date, rating }
  },
)
