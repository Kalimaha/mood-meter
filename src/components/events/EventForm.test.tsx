import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { EventForm } from './EventForm'

describe('EventForm', () => {
  it('has no visible field labels and a full-width Create event button', () => {
    render(<EventForm onSubmit={vi.fn()} defaultStartDate="2026-10-18" />)

    expect(screen.queryByText(/^Label$/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/^Start$/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/^End/i)).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /create event/i }),
    ).toHaveClass('w-full')
  })

  it('submits a single-day event', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<EventForm onSubmit={onSubmit} defaultStartDate="2026-10-18" />)

    await user.type(screen.getByLabelText(/^Label$/i), 'Birthday')
    await user.click(screen.getByRole('button', { name: /create event/i }))

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
    await user.type(screen.getByLabelText(/^Description/i), 'Sprint review week')
    await user.clear(screen.getByLabelText(/^End date$/i))
    await user.type(screen.getByLabelText(/^End date$/i), '2026-04-05')
    await user.click(screen.getByRole('button', { name: /create event/i }))

    expect(onSubmit).toHaveBeenCalledWith({
      label: 'Review',
      description: 'Sprint review week',
      startDate: '2026-04-01',
      endDate: '2026-04-05',
    })
  })

  it('shows validation when label and description are empty', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<EventForm onSubmit={onSubmit} defaultStartDate="2026-10-18" />)

    await user.click(screen.getByRole('button', { name: /create event/i }))
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
