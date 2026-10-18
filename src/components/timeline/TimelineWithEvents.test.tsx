import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TimelineWithEvents } from './TimelineWithEvents'
import type { TimelineDay } from './types'

const days: TimelineDay[] = [
  { date: '2026-03-01', rating: 'up' },
  { date: '2026-03-02', rating: 'flat' },
  { date: '2026-03-03', rating: 'down' },
  { date: '2026-03-04', rating: 'up' },
  { date: '2026-03-05', rating: 'flat' },
]

describe('TimelineWithEvents', () => {
  it('renders the polyline for stored days', () => {
    render(<TimelineWithEvents days={days} />)
    expect(
      screen.getByRole('img', { name: 'Mood timeline' }),
    ).toBeInTheDocument()
  })

  it('renders single-day event pins beside the line', () => {
    render(
      <TimelineWithEvents
        days={days}
        events={[
          { id: 'bday', label: 'Birthday', startDate: '2026-03-01' },
        ]}
      />,
    )

    expect(
      screen.getByRole('group', { name: 'Timeline event markers' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Birthday/i }),
    ).toBeInTheDocument()
    expect(screen.queryByText('Birthday')).not.toBeInTheDocument()
  })

  it('draws full-height range bands behind the polyline', () => {
    const { container } = render(
      <TimelineWithEvents
        days={days}
        events={[
          {
            id: 'holiday',
            label: 'Long weekend',
            description: 'Coast trip',
            startDate: '2026-03-02',
            endDate: '2026-03-04',
          },
        ]}
      />,
    )

    const band = container.querySelector(
      '[data-testid="event-band-holiday"]',
    ) as SVGRectElement | null
    expect(band).toBeTruthy()
    expect(band?.getAttribute('y')).toBe('0')
    expect(Number(band?.getAttribute('height'))).toBeGreaterThan(0)
    expect(Number(band?.getAttribute('width'))).toBeGreaterThan(2)
    expect(
      screen.queryByRole('group', { name: 'Timeline event markers' }),
    ).not.toBeInTheDocument()
  })
})
