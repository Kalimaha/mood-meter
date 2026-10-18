import { useCallback, useEffect, useId, useState } from 'react'
import { formatIsoDateLabel, todayIso } from '../../domain/dates'
import type { DayMoodEntry, MoodRating } from '../../domain/types'
import { getDayEntry, upsertDayEntry } from '../../storage/days'
import { DayNoteField } from '../notes/DayNoteField'
import { RatingControls } from './RatingControls'

const RATING_LABEL: Record<MoodRating, string> = {
  up: 'up',
  flat: 'flat',
  down: 'down',
}

export interface DayEntryPanelProps {
  /** ISO date to edit; when omitted, uses internal state defaulting to today. */
  date?: string
  /** Called when the user picks a new date in the date picker. */
  onDateChange?: (isoDate: string) => void
  storage?: Storage
  /** Fires after a rating/note is persisted. */
  onChange?: (entry: DayMoodEntry) => void
}

export function DayEntryPanel({
  date: dateProp,
  onDateChange,
  storage = localStorage,
  onChange,
}: DayEntryPanelProps) {
  const dateInputId = useId()
  const isControlled = dateProp !== undefined
  const [internalDate, setInternalDate] = useState(() => dateProp ?? todayIso())
  const date = isControlled ? dateProp : internalDate

  const [rating, setRating] = useState<MoodRating | undefined>()
  const [noteText, setNoteText] = useState('')
  const [status, setStatus] = useState<string | null>(null)

  const isToday = date === todayIso()
  const dayPhrase = isToday ? "today's" : "this day's"
  const forDayPhrase = isToday ? 'for today' : 'for this day'

  useEffect(() => {
    const existing = getDayEntry(date, storage)
    setRating(existing?.rating)
    setNoteText(existing?.note?.text ?? '')
    setStatus(null)
  }, [date, storage])

  const persist = useCallback(
    (nextRating: MoodRating, nextNote: string) => {
      const entry = upsertDayEntry(
        {
          date,
          rating: nextRating,
          noteText: nextNote,
        },
        storage,
      )
      setRating(nextRating)
      setNoteText(nextNote)
      onChange?.(entry)
    },
    [date, onChange, storage],
  )

  const handleDateInputChange = (next: string) => {
    if (!next) {
      return
    }
    if (!isControlled) {
      setInternalDate(next)
    }
    onDateChange?.(next)
  }

  const handleSelect = (next: MoodRating) => {
    if (rating !== undefined && rating !== next) {
      const confirmed = window.confirm(
        `Replace ${dayPhrase} ${RATING_LABEL[rating]} rating with ${RATING_LABEL[next]}?`,
      )
      if (!confirmed) {
        setStatus(`Kept ${RATING_LABEL[rating]} rating.`)
        return
      }
      persist(next, noteText)
      setStatus(
        `Updated rating from ${RATING_LABEL[rating]} to ${RATING_LABEL[next]}.`,
      )
      return
    }

    if (rating === next) {
      setStatus(`Already rated ${RATING_LABEL[next]} ${forDayPhrase}.`)
      return
    }

    persist(next, noteText)
    setStatus(`Saved ${RATING_LABEL[next]} rating ${forDayPhrase}.`)
  }

  const handleNoteBlur = () => {
    if (rating === undefined) {
      setStatus('Pick a rating before saving a note.')
      return
    }
    persist(rating, noteText)
    setStatus(
      noteText.trim().length > 0 ? 'Note saved.' : 'Note cleared.',
    )
  }

  return (
    <section
      className="flex flex-col gap-4 rounded-[var(--mm-radius)] border p-4"
      style={{
        borderColor: 'var(--mm-border)',
        background: 'var(--mm-bg-elevated)',
      }}
      aria-labelledby="day-entry-heading"
    >
      <div className="flex flex-col gap-2">
        <h2
          id="day-entry-heading"
          className="m-0 text-lg font-semibold"
          style={{ color: 'var(--mm-fg)' }}
        >
          Event
        </h2>
        <div className="flex flex-col gap-1.5">
          <input
            id={dateInputId}
            type="date"
            value={date}
            onChange={(e) => handleDateInputChange(e.target.value)}
            aria-label="Date"
            className="min-h-11 rounded-[var(--mm-radius)] border px-3 py-2 text-sm"
            style={{
              borderColor: 'var(--mm-border)',
              background: 'var(--mm-bg)',
              color: 'var(--mm-fg)',
            }}
            aria-describedby="day-entry-date-label"
          />
          <p
            id="day-entry-date-label"
            className="m-0 text-sm"
            style={{ color: 'var(--mm-fg-muted)' }}
          >
            {formatIsoDateLabel(date)}
          </p>
        </div>
      </div>

      <RatingControls value={rating} onSelect={handleSelect} />

      <DayNoteField
        value={noteText}
        onChange={setNoteText}
        onBlur={handleNoteBlur}
        disabled={rating === undefined}
      />

      {status ? (
        <p
          className="m-0 text-sm"
          style={{ color: 'var(--mm-fg-muted)' }}
          role="status"
        >
          {status}
        </p>
      ) : null}
    </section>
  )
}
