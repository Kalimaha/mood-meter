import { useCallback, useState } from 'react'
import {
  createTimelineEvent,
  type CreateTimelineEventInput,
} from '../../domain/events'
import type { TimelineEvent } from '../../domain/types'
import {
  addEvent,
  deleteEvent,
  loadEvents,
} from '../../storage/events'
import { EventForm } from './EventForm'
import { EventList } from './EventList'

export interface EventsPanelProps {
  /** When set, panel is controlled and does not touch localStorage. */
  events?: readonly TimelineEvent[]
  onEventsChange?: (events: TimelineEvent[]) => void
  /** Persist via localStorage when uncontrolled. Default true. */
  persist?: boolean
  title?: string
}

/**
 * Simple add/list panel for timeline events.
 * Uncontrolled mode loads/saves through `src/storage/events`.
 */
export function EventsPanel({
  events: controlledEvents,
  onEventsChange,
  persist = true,
  title = 'Events',
}: EventsPanelProps) {
  const isControlled = controlledEvents !== undefined
  const [internalEvents, setInternalEvents] = useState<TimelineEvent[]>(() =>
    isControlled || !persist ? [] : loadEvents(),
  )

  const events = isControlled ? controlledEvents : internalEvents

  const commit = useCallback(
    (next: TimelineEvent[]) => {
      if (!isControlled) {
        setInternalEvents(next)
      }
      onEventsChange?.(next)
    },
    [isControlled, onEventsChange],
  )

  const handleSubmit = useCallback(
    (input: CreateTimelineEventInput) => {
      if (isControlled || !persist) {
        const created = createTimelineEvent(input)
        commit([
          ...events.filter((item) => item.id !== created.id),
          created,
        ])
        return
      }
      commit(addEvent(input))
    },
    [commit, events, isControlled, persist],
  )

  const handleDelete = useCallback(
    (id: string) => {
      if (isControlled || !persist) {
        commit(events.filter((item) => item.id !== id))
        return
      }
      commit(deleteEvent(id))
    },
    [commit, events, isControlled, persist],
  )

  return (
    <section
      className="flex flex-col gap-4"
      aria-labelledby="events-panel-heading"
    >
      <h2
        id="events-panel-heading"
        className="m-0 text-lg font-semibold tracking-tight text-[var(--mm-fg)]"
      >
        {title}
      </h2>
      <EventForm onSubmit={handleSubmit} />
      <EventList events={events} onDelete={handleDelete} />
    </section>
  )
}
