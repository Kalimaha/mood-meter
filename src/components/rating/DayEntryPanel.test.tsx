import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getDayEntry } from '../../storage/days'
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
})
