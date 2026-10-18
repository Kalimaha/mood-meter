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
  {
    id: 'pin-desc',
    label: 'Launch',
    description: 'Shipped v1 to prod',
    startDate: '2026-04-02',
  },
  { id: 'pin-empty', label: 'Move', startDate: '2026-04-04' },
  {
    id: 'band',
    label: 'Review',
    startDate: '2026-04-01',
    endDate: '2026-04-05',
  },
]

describe('TimelineEventMarkers', () => {
  it('renders single-day pins only (no always-visible labels)', () => {
    render(
      <TimelineEventMarkers events={events} getXForDate={getXForDate} />,
    )
    expect(
      screen.getByRole('button', { name: /Launch, 2026-04-02/i }),
    ).toBeInTheDocument()
    // Hollow (no description) is not a button
    expect(
      screen.queryByRole('button', { name: /Move, 2026-04-04/i }),
    ).not.toBeInTheDocument()
    expect(screen.getByLabelText(/Move, 2026-04-04/i)).toBeInTheDocument()
    expect(screen.queryByText('Launch')).not.toBeInTheDocument()
    expect(screen.queryByText('Move')).not.toBeInTheDocument()
  })

  it('uses filled vs hollow dots from description presence', () => {
    const { container } = render(
      <TimelineEventMarkers events={events} getXForDate={getXForDate} />,
    )
    expect(
      container.querySelector(
        '[data-has-description="true"] .mm-event-pin__dot--filled',
      ),
    ).toBeTruthy()
    expect(
      container.querySelector(
        '[data-has-description="false"] .mm-event-pin__dot--hollow',
      ),
    ).toBeTruthy()
  })

  it('reveals description only when clicking a filled dot', async () => {
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
    expect(screen.getByRole('tooltip')).toHaveTextContent('Shipped v1 to prod')
  })
})
