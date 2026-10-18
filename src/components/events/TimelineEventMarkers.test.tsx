import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { TimelineEvent } from '../../domain/types'
import { TimelineEventMarkers } from './TimelineEventMarkers'

const DAY_MS = 86_400_000

function getXForDate(iso: string): number {
  const start = Date.parse('2026-04-01T00:00:00Z')
  const day = Date.parse(`${iso}T00:00:00Z`)
  return ((day - start) / DAY_MS) * 40
}

const events: TimelineEvent[] = [
  { id: 'pin', label: 'Launch', startDate: '2026-04-02' },
  {
    id: 'band',
    label: 'Review',
    startDate: '2026-04-01',
    endDate: '2026-04-05',
  },
]

describe('TimelineEventMarkers', () => {
  it('renders pin and range markers from props', () => {
    render(
      <TimelineEventMarkers events={events} getXForDate={getXForDate} />,
    )
    expect(
      screen.getByRole('button', { name: /Launch, 2026-04-02/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', {
        name: /Review, 2026-04-01 to 2026-04-05/i,
      }),
    ).toBeInTheDocument()
  })

  it('calls onSelect for a marker', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(
      <TimelineEventMarkers
        events={events}
        getXForDate={getXForDate}
        onSelect={onSelect}
      />,
    )
    await user.click(screen.getByRole('button', { name: /Launch/i }))
    expect(onSelect).toHaveBeenCalledWith(events[0])
  })
})
