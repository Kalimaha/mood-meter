import { CalendarRange, Flag, Trash2 } from 'lucide-react'
import { isSingleDayEvent, sortEvents } from '../../domain/events'
import type { TimelineEvent } from '../../domain/types'

export interface EventListProps {
  events: readonly TimelineEvent[]
  onDelete?: (id: string) => void
  emptyMessage?: string
}

function formatSpan(event: TimelineEvent): string {
  if (isSingleDayEvent(event)) return event.startDate
  return `${event.startDate} → ${event.endDate}`
}

export function EventList({
  events,
  onDelete,
  emptyMessage = 'No events yet.',
}: EventListProps) {
  const sorted = sortEvents(events)

  if (sorted.length === 0) {
    return (
      <p className="m-0 text-sm text-[var(--mm-fg-muted)]" role="status">
        {emptyMessage}
      </p>
    )
  }

  return (
    <ul className="m-0 flex list-none flex-col gap-2 p-0" aria-label="Events">
      {sorted.map((event) => {
        const single = isSingleDayEvent(event)
        const Icon = single ? Flag : CalendarRange
        return (
          <li
            key={event.id}
            className="flex items-start justify-between gap-3 border-b border-[var(--mm-border)] py-2 last:border-b-0"
          >
            <div className="flex min-w-0 items-start gap-2">
              <Icon
                className="mt-0.5 size-4 shrink-0 text-[var(--mm-accent)]"
                aria-hidden="true"
              />
              <div className="min-w-0">
                <p className="m-0 truncate font-medium text-[var(--mm-fg)]">
                  {event.label}
                </p>
                <p className="m-0 text-sm text-[var(--mm-fg-muted)]">
                  <span className="sr-only">
                    {single ? 'Single day' : 'Date range'}{' '}
                  </span>
                  {formatSpan(event)}
                </p>
              </div>
            </div>
            {onDelete ? (
              <button
                type="button"
                onClick={() => onDelete(event.id)}
                aria-label={`Delete ${event.label}`}
                className="shrink-0 rounded-md p-1.5 text-[var(--mm-fg-muted)] outline-none hover:bg-[var(--mm-bg)] hover:text-[var(--mm-fg)] focus-visible:ring-2 focus-visible:ring-[var(--mm-ring)]"
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </button>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}
