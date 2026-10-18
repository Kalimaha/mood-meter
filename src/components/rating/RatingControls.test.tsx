import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { RatingControls } from './RatingControls'

describe('RatingControls', () => {
  it('renders three rating buttons', () => {
    render(<RatingControls onSelect={() => undefined} />)
    expect(screen.getByRole('button', { name: 'Up' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Flat' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Down' })).toBeInTheDocument()
  })

  it('marks the selected rating as pressed', () => {
    render(<RatingControls value="flat" onSelect={() => undefined} />)
    expect(screen.getByRole('button', { name: 'Flat' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: 'Up' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  it('calls onSelect when a rating is chosen', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<RatingControls onSelect={onSelect} />)
    await user.click(screen.getByRole('button', { name: 'Down' }))
    expect(onSelect).toHaveBeenCalledWith('down')
  })

  it('does not render emoji markers on rating buttons', () => {
    const { container } = render(<RatingControls onSelect={() => undefined} />)
    expect(container.textContent ?? '').not.toContain('⬆️')
    expect(container.textContent ?? '').not.toContain('🟰')
    expect(container.textContent ?? '').not.toContain('⬇️')
    for (const button of screen.getAllByRole('button')) {
      expect(button.querySelector('span')).toBeNull()
    }
  })
})

