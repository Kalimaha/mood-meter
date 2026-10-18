import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getDayEntry, upsertDayEntry } from '../../storage/days'
import { DayEntryPanel } from './DayEntryPanel'

function memoryStorage(): Storage {
  const map = new Map<string, string>()
  return {
    get length() {
      return map.size
    },
    clear() {
      map.clear()
    },
    getItem(key: string) {
      return map.get(key) ?? null
    },
    key(index: number) {
      return [...map.keys()][index] ?? null
    },
    removeItem(key: string) {
      map.delete(key)
    },
    setItem(key: string, value: string) {
      map.set(key, value)
    },
  }
}

describe('DayEntryPanel', () => {
  let storage: Storage

  beforeEach(() => {
    storage = memoryStorage()
    vi.stubGlobal(
      'confirm',
      vi.fn(() => true),
    )
  })

  it('saves a first rating for the day', async () => {
    const user = userEvent.setup()
    render(<DayEntryPanel date="2026-10-18" storage={storage} />)

    await user.click(screen.getByRole('button', { name: 'Up' }))

    expect(getDayEntry('2026-10-18', storage)?.rating).toBe('up')
    expect(screen.getByRole('status')).toHaveTextContent(/Saved up rating/i)
  })

  it('confirms before overwriting an existing rating', async () => {
    const user = userEvent.setup()
    const confirm = vi.mocked(window.confirm)
    confirm.mockReturnValueOnce(true)

    render(<DayEntryPanel date="2026-10-18" storage={storage} />)
    await user.click(screen.getByRole('button', { name: 'Up' }))
    await user.click(screen.getByRole('button', { name: 'Down' }))

    expect(confirm).toHaveBeenCalled()
    expect(confirm.mock.calls[0]?.[0]).toMatch(/this day's|today's/)
    expect(getDayEntry('2026-10-18', storage)?.rating).toBe('down')
    expect(screen.getByRole('status')).toHaveTextContent(
      /Updated rating from up to down/i,
    )
  })

  it('keeps the prior rating when overwrite is cancelled', async () => {
    const user = userEvent.setup()
    const confirm = vi.mocked(window.confirm)
    confirm.mockReturnValueOnce(false)

    render(<DayEntryPanel date="2026-10-18" storage={storage} />)
    await user.click(screen.getByRole('button', { name: 'Flat' }))
    await user.click(screen.getByRole('button', { name: 'Up' }))

    expect(getDayEntry('2026-10-18', storage)?.rating).toBe('flat')
    expect(screen.getByRole('status')).toHaveTextContent(/Kept flat rating/i)
  })

  it('saves a note after a rating exists', async () => {
    const user = userEvent.setup()
    render(<DayEntryPanel date="2026-10-18" storage={storage} />)

    await user.click(screen.getByRole('button', { name: 'Up' }))
    const note = screen.getByLabelText('Note')
    await user.clear(note)
    await user.type(note, 'Good focus')
    await user.tab()

    expect(getDayEntry('2026-10-18', storage)?.note?.text).toBe('Good focus')
    expect(screen.getByRole('status')).toHaveTextContent(/Note saved/i)
  })

  it('exposes an accessible date picker bound to the entry date', () => {
    render(<DayEntryPanel date="2026-10-17" storage={storage} />)

    const dateInput = screen.getByLabelText('Date')
    expect(dateInput).toHaveAttribute('type', 'date')
    expect(dateInput).toHaveValue('2026-10-17')
    expect(screen.getByRole('heading', { name: 'Entry' })).toBeInTheDocument()
  })

  it('calls onDateChange and reloads the entry for the selected date', () => {
    upsertDayEntry(
      { date: '2026-10-17', rating: 'up', noteText: 'Yesterday' },
      storage,
    )
    upsertDayEntry(
      { date: '2026-10-18', rating: 'down', noteText: 'Today note' },
      storage,
    )

    function ControlledPanel() {
      const [date, setDate] = useState('2026-10-17')
      return (
        <DayEntryPanel
          date={date}
          onDateChange={setDate}
          storage={storage}
        />
      )
    }

    render(<ControlledPanel />)

    expect(screen.getByRole('button', { name: 'Up' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByLabelText('Note')).toHaveValue('Yesterday')

    fireEvent.change(screen.getByLabelText('Date'), {
      target: { value: '2026-10-18' },
    })

    expect(screen.getByLabelText('Date')).toHaveValue('2026-10-18')
    expect(screen.getByRole('button', { name: 'Down' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByLabelText('Note')).toHaveValue('Today note')
  })

  it('allows uncontrolled date changes when date and onDateChange are omitted', () => {
    render(<DayEntryPanel storage={storage} />)

    const dateInput = screen.getByLabelText('Date')
    fireEvent.change(dateInput, { target: { value: '2026-10-15' } })

    expect(dateInput).toHaveValue('2026-10-15')
    expect(screen.getByRole('heading', { name: 'Entry' })).toBeInTheDocument()
  })

  it('uses this-day copy when confirming overwrite for a non-today date', async () => {
    const user = userEvent.setup()
    const confirm = vi.mocked(window.confirm)
    confirm.mockReturnValueOnce(true)

    render(<DayEntryPanel date="2026-10-01" storage={storage} />)
    await user.click(screen.getByRole('button', { name: 'Up' }))
    await user.click(screen.getByRole('button', { name: 'Flat' }))

    expect(confirm.mock.calls[0]?.[0]).toBe(
      "Replace this day's up rating with flat?",
    )
  })
})
