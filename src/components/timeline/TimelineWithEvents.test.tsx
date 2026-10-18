import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TimelineWithEvents } from './TimelineWithEvents'
import type { TimelineDay } from './types'

const days: TimelineDay[] = [
  { date: '2026-03-01', rating: 'up' },
  { date: '2026-03-02', rating: 'flat' },
]

describe('TimelineWithEvents', () => {
  it('renders the polyline for stored days', () => {
    render(<TimelineWithEvents days={days} />)
    expect(
      screen.getByRole('img', { name: 'Mood timeline' }),
    ).toBeInTheDocument()
  })

  it('renders event markers beside the line', () => {
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
  })
})
