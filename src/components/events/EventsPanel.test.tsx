import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { EVENTS_STORAGE_KEY } from '../../storage/events'
import { EventsPanel } from './EventsPanel'

describe('EventsPanel', () => {
  it('adds and removes events in controlled mode without storage', async () => {
    const user = userEvent.setup()
    const onEventsChange = vi.fn()
    const { rerender } = render(
      <EventsPanel
        events={[]}
        onEventsChange={onEventsChange}
        persist={false}
      />,
    )

    await user.type(screen.getByLabelText(/^Label$/i), 'Ship')
    const start = screen.getByLabelText(/^Start date$/i)
    await user.clear(start)
    await user.type(start, '2026-05-01')
    await user.click(screen.getByRole('button', { name: /create event/i }))

    expect(onEventsChange).toHaveBeenCalled()
    const next = onEventsChange.mock.calls[0]![0] as Array<{
      label: string
      startDate: string
    }>
    expect(next[0]?.label).toBe('Ship')
    expect(next[0]?.startDate).toBe('2026-05-01')
    expect(localStorage.getItem(EVENTS_STORAGE_KEY)).toBeNull()

    rerender(
      <EventsPanel
        events={[
          { id: 'e1', label: 'Ship', startDate: '2026-05-01' },
        ]}
        onEventsChange={onEventsChange}
        persist={false}
      />,
    )

    await user.click(screen.getByRole('button', { name: /delete ship/i }))
    expect(onEventsChange).toHaveBeenLastCalledWith([])
  })
})
