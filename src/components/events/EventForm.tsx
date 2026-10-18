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
  'empty-label': 'Add a short description or label.',
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

const fieldClass =
  'w-full rounded-[var(--mm-radius)] border border-[var(--mm-border)] bg-[var(--mm-bg-elevated)] px-3 py-2 text-[var(--mm-fg)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--mm-ring)]'

/**
 * Create-event form: placeholders only (no visible field labels),
 * full-width submit for phone layouts.
 */
export function EventForm({
  onSubmit,
  disabled = false,
  defaultStartDate,
}: EventFormProps) {
  const formId = useId()
  const labelId = `${formId}-label`
  const descriptionId = `${formId}-description`
  const startId = `${formId}-start`
  const endId = `${formId}-end`
  const errorId = `${formId}-error`

  const [label, setLabel] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState(defaultStartDate ?? todayIso())
  const [endDate, setEndDate] = useState('')
  const [error, setError] = useState<TimelineEventValidationError | null>(null)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const input: CreateTimelineEventInput = {
      label: label.trim() || description.trim() || 'Event',
      startDate,
      ...(endDate.trim() !== '' ? { endDate: endDate.trim() } : {}),
      ...(description.trim() !== ''
        ? { description: description.trim() }
        : {}),
    }
    // Prefer explicit label field; if empty use description as label for validation
    if (!label.trim() && !description.trim()) {
      setError('empty-label')
      return
    }
    const validation = validateTimelineEvent(input)
    if (validation !== null) {
      setError(validation)
      return
    }
    setError(null)
    onSubmit(input)
    setLabel('')
    setDescription('')
    setEndDate('')
  }

  return (
    <form
      className="flex w-full flex-col gap-3"
      onSubmit={handleSubmit}
      noValidate
      aria-describedby={error ? errorId : undefined}
    >
      <input
        id={labelId}
        name="label"
        type="text"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        disabled={disabled}
        placeholder="Label"
        aria-label="Label"
        autoComplete="off"
        className={fieldClass}
      />

      <input
        id={descriptionId}
        name="description"
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        disabled={disabled}
        placeholder="Description (optional)"
        aria-label="Description"
        autoComplete="off"
        className={fieldClass}
      />

      <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
        <input
          id={startId}
          name="startDate"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          disabled={disabled}
          required
          aria-label="Start date"
          className={fieldClass}
        />
        <input
          id={endId}
          name="endDate"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          disabled={disabled}
          aria-label="End date"
          className={fieldClass}
        />
      </div>

      {error !== null ? (
        <p id={errorId} role="alert" className="m-0 text-sm text-red-500">
          {ERROR_COPY[error]}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={disabled}
        className="w-full min-h-11 rounded-[var(--mm-radius)] bg-[var(--mm-accent)] px-4 py-2.5 text-sm font-semibold text-[var(--mm-accent-fg)] outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[var(--mm-ring)] disabled:opacity-50"
      >
        Create event
      </button>
    </form>
  )
}
