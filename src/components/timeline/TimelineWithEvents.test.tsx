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
    render(<TimelineWithEvents days={days} />)
    expect(
      screen.getByRole('img', { name: 'Mood timeline' }),
    ).toBeInTheDocument()
  })

  it('renders single-day event pins on the track', () => {
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

  it('draws clickable range bands that reveal description', async () => {
    const user = userEvent.setup()
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
    ) as HTMLButtonElement | null
    expect(band).toBeTruthy()
    expect(band?.tagName).toBe('BUTTON')

    await user.click(
      screen.getByRole('button', { name: /Long weekend, 2026-03-02 to 2026-03-04/i }),
    )
    expect(screen.getByRole('tooltip')).toHaveTextContent('Coast trip')
  })
})
