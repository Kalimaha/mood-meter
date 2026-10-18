import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DayNoteField } from './DayNoteField'

describe('DayNoteField', () => {
  it('renders a labeled textarea', () => {
    render(<DayNoteField value="" onChange={() => undefined} />)
    expect(screen.getByLabelText('Note')).toBeInTheDocument()
  })

  it('calls onChange as the user types', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<DayNoteField value="" onChange={onChange} />)
    await user.type(screen.getByLabelText('Note'), 'hi')
    expect(onChange).toHaveBeenCalled()
  })
})
