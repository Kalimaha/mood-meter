import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { HomeShell } from './HomeShell'

describe('HomeShell', () => {
  it('renders the product name and scaffold note', () => {
    render(<HomeShell />)
    expect(
      screen.getByRole('heading', { name: 'Mood Meter' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/Phase 1 scaffold/i)).toBeInTheDocument()
  })
})
