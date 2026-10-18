import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { clearDayEntries } from './storage/days'
import { clearEvents } from './storage/events'
import { DEMO_SEED_APPLIED_KEY, clearDemoSeed } from './storage/seed'

describe('App composition', () => {
  beforeEach(() => {
    clearDayEntries()
    clearEvents()
    localStorage.setItem(DEMO_SEED_APPLIED_KEY, '1')
    vi.stubGlobal(
      'confirm',
      vi.fn(() => true),
    )
  })

  it('renders Today day-entry and separate Event form', () => {
    render(<App />)

    expect(
      screen.getByRole('heading', { name: 'Mood Meter' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Today' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Event' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Save$/i })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /create event/i }),
    ).toBeInTheDocument()
    expect(screen.queryByText(/Sunday,/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/minimal daily mood journal/i)).not.toBeInTheDocument()
    expect(screen.getByText(/No ratings yet/i)).toBeInTheDocument()
  })

  it('feeds the timeline from a saved day rating', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Up' }))
    await user.click(screen.getByRole('button', { name: /^Save$/i }))

    expect(screen.queryByText(/No ratings yet/i)).not.toBeInTheDocument()
    expect(
      screen.getByRole('region', { name: 'Mood timeline' }),
    ).toBeInTheDocument()
  })

  it('auto-seeds demo moods and events on first empty visit', () => {
    clearDemoSeed()
    const { container } = render(<App />)

    expect(screen.queryByText(/No ratings yet/i)).not.toBeInTheDocument()
    expect(
      screen.getByRole('region', { name: 'Mood timeline' }),
    ).toBeInTheDocument()
    expect(
      container.querySelector('[data-has-description="true"]'),
    ).toBeTruthy()
    expect(
      container.querySelector('[data-testid="event-band-seed-evt-holiday"]'),
    ).toBeTruthy()
  })
})
