import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { TimelineEvent } from '../../domain/types'
import { EventList } from './EventList'

const events: TimelineEvent[] = [
  { id: '1', label: 'Birthday', startDate: '2026-03-01' },
  {
    id: '2',
    label: 'Review',
    startDate: '2026-04-01',
    endDate: '2026-04-05',
  },
]

describe('EventList', () => {
  it('renders empty state', () => {
    render(<EventList events={[]} />)
    expect(screen.getByRole('status')).toHaveTextContent(/no events/i)
  })

  it('lists single-day and range events sorted by start', () => {
    render(<EventList events={events} />)
    const items = screen.getAllByRole('listitem')
    expect(items[0]).toHaveTextContent('Birthday')
    expect(items[0]).toHaveTextContent('2026-03-01')
    expect(items[1]).toHaveTextContent('Review')
    expect(items[1]).toHaveTextContent('2026-04-01 → 2026-04-05')
  })

  it('invokes onDelete', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()
    render(<EventList events={events} onDelete={onDelete} />)
    await user.click(screen.getByRole('button', { name: /delete birthday/i }))
    expect(onDelete).toHaveBeenCalledWith('1')
  })
})
