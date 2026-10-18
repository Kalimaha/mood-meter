import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
    const { container } = render(<TimelineWithEvents days={days} />)
    expect(
      screen.getByRole('region', { name: 'Mood timeline' }),
    ).toBeInTheDocument()
    expect(container.querySelector('svg.mm-timeline__svg')).toBeTruthy()
  })

  it('places filled/hollow event pins on the SVG track', () => {
    const { container } = render(
      <TimelineWithEvents
        days={days}
        events={[
          {
            id: 'bday',
            label: 'Birthday',
            description: 'Cake day',
            startDate: '2026-03-01',
          },
          {
            id: 'empty',
            label: 'Quiet',
            startDate: '2026-03-03',
          },
        ]}
      />,
    )

    const filled = container.querySelector(
      'svg [data-testid="event-pin-bday"].mm-timeline__event-pin--filled',
    )
    const hollow = container.querySelector(
      'svg [data-testid="event-pin-empty"].mm-timeline__event-pin--hollow',
    )
    expect(filled).toBeTruthy()
    expect(hollow).toBeTruthy()
    expect(
      screen.getByRole('button', { name: /Birthday, 2026-03-01/i }),
    ).toBeInTheDocument()
  })

  it('ignores single-day events outside the rated span', () => {
    const { container } = render(
      <TimelineWithEvents
        days={days}
        events={[
          {
            id: 'outside',
            label: 'Far',
            description: 'Off chart',
            startDate: '2026-02-01',
          },
        ]}
      />,
    )
    expect(container.querySelector('[data-testid="event-pin-outside"]')).toBeNull()
  })

  it('shows description when clicking a filled pin or range band', async () => {
    const user = userEvent.setup()
    render(
      <TimelineWithEvents
        days={days}
        events={[
          {
            id: 'bday',
            label: 'Birthday',
            description: 'Cake day',
            startDate: '2026-03-01',
          },
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

    await user.click(screen.getByRole('button', { name: /Birthday, 2026-03-01/i }))
    expect(screen.getByRole('tooltip')).toHaveTextContent('Cake day')

    await user.click(
      screen.getByRole('button', {
        name: /Long weekend, 2026-03-02 to 2026-03-04/i,
      }),
    )
    expect(screen.getByRole('tooltip')).toHaveTextContent('Coast trip')
  })
})
