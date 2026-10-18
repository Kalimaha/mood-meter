import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { EventForm } from './EventForm'

describe('EventForm', () => {
  it('submits a single-day event', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<EventForm onSubmit={onSubmit} defaultStartDate="2026-10-18" />)

    await user.type(screen.getByLabelText(/^Label$/i), 'Birthday')
    await user.click(screen.getByRole('button', { name: /add event/i }))

    expect(onSubmit).toHaveBeenCalledWith({
      label: 'Birthday',
      startDate: '2026-10-18',
    })
  })

  it('submits a range when end is set', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<EventForm onSubmit={onSubmit} defaultStartDate="2026-04-01" />)

    await user.type(screen.getByLabelText(/^Label$/i), 'Review')
    await user.clear(screen.getByLabelText(/End/i))
    await user.type(screen.getByLabelText(/End/i), '2026-04-05')
    await user.click(screen.getByRole('button', { name: /add event/i }))

    expect(onSubmit).toHaveBeenCalledWith({
      label: 'Review',
      startDate: '2026-04-01',
      endDate: '2026-04-05',
    })
  })

  it('shows validation when label is empty', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<EventForm onSubmit={onSubmit} defaultStartDate="2026-10-18" />)

    await user.click(screen.getByRole('button', { name: /add event/i }))
    expect(screen.getByRole('alert')).toHaveTextContent(/label/i)
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
