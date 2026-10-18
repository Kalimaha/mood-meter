import { useId, useState, type FormEvent } from 'react'
import {
  validateTimelineEvent,
  type CreateTimelineEventInput,
  type TimelineEventValidationError,
} from '../../domain/events'

export interface EventFormProps {
  onSubmit: (input: CreateTimelineEventInput) => void
  disabled?: boolean
  /** Prefill start date (YYYY-MM-DD). */
  defaultStartDate?: string
}

const ERROR_COPY: Record<TimelineEventValidationError, string> = {
  'empty-label': 'Add a short label.',
  'invalid-start': 'Start date must be YYYY-MM-DD.',
  'invalid-end': 'End date must be YYYY-MM-DD.',
  'end-before-start': 'End date cannot be before start.',
}

function todayIso(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function EventForm({
  onSubmit,
  disabled = false,
  defaultStartDate,
}: EventFormProps) {
  const formId = useId()
  const labelId = `${formId}-label`
  const startId = `${formId}-start`
  const endId = `${formId}-end`
  const errorId = `${formId}-error`

  const [label, setLabel] = useState('')
  const [startDate, setStartDate] = useState(defaultStartDate ?? todayIso())
  const [endDate, setEndDate] = useState('')
  const [error, setError] = useState<TimelineEventValidationError | null>(null)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const input: CreateTimelineEventInput = {
      label,
      startDate,
      ...(endDate.trim() !== '' ? { endDate: endDate.trim() } : {}),
    }
    const validation = validateTimelineEvent(input)
    if (validation !== null) {
      setError(validation)
      return
    }
    setError(null)
    onSubmit(input)
    setLabel('')
    setEndDate('')
  }

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={handleSubmit}
      noValidate
      aria-describedby={error ? errorId : undefined}
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor={labelId} className="text-sm text-[var(--mm-fg-muted)]">
          Label
        </label>
        <input
          id={labelId}
          name="label"
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          disabled={disabled}
          placeholder="Birthday, review week…"
          autoComplete="off"
          className="rounded-[var(--mm-radius)] border border-[var(--mm-border)] bg-[var(--mm-bg-elevated)] px-3 py-2 text-[var(--mm-fg)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--mm-ring)]"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={startId} className="text-sm text-[var(--mm-fg-muted)]">
            Start
          </label>
          <input
            id={startId}
            name="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            disabled={disabled}
            required
            className="rounded-[var(--mm-radius)] border border-[var(--mm-border)] bg-[var(--mm-bg-elevated)] px-3 py-2 text-[var(--mm-fg)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--mm-ring)]"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={endId} className="text-sm text-[var(--mm-fg-muted)]">
            End <span className="font-normal">(optional)</span>
          </label>
          <input
            id={endId}
            name="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            disabled={disabled}
            className="rounded-[var(--mm-radius)] border border-[var(--mm-border)] bg-[var(--mm-bg-elevated)] px-3 py-2 text-[var(--mm-fg)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--mm-ring)]"
          />
        </div>
      </div>

      {error !== null ? (
        <p id={errorId} role="alert" className="m-0 text-sm text-red-500">
          {ERROR_COPY[error]}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={disabled}
        className="self-start rounded-[var(--mm-radius)] bg-[var(--mm-accent)] px-4 py-2 text-sm font-semibold text-[var(--mm-accent-fg)] outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[var(--mm-ring)] disabled:opacity-50"
      >
        Add event
      </button>
    </form>
  )
}
