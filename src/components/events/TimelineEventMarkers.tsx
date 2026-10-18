import { isSingleDayEvent } from '../../domain/events'
import type { TimelineEvent } from '../../domain/types'

export interface TimelineEventMarkersProps {
  events: readonly TimelineEvent[]
  /**
   * Map an ISO date (YYYY-MM-DD) to an x position in the same coordinate
   * space as the timeline track. Provided by the timeline owner — this
   * component does not compute mood polyline geometry.
   */
  getXForDate: (isoDate: string) => number
  /** Height of the marker layer in CSS pixels. */
  height?: number
  className?: string
  onSelect?: (event: TimelineEvent) => void
}

/**
 * Props-driven overlay of event pins (single-day) and range bands.
 * Intended to sit above/beside a timeline polyline without owning that line.
 */
export function TimelineEventMarkers({
  events,
  getXForDate,
  height = 48,
  className,
  onSelect,
}: TimelineEventMarkersProps) {
  return (
    <div
      className={className}
      role="group"
      aria-label="Timeline event markers"
      style={{ position: 'relative', height, width: '100%' }}
    >
      {events.map((event) => {
        const startX = getXForDate(event.startDate)
        const endX = getXForDate(event.endDate ?? event.startDate)
        const left = Math.min(startX, endX)
        const width = Math.max(Math.abs(endX - startX), 2)
        const single = isSingleDayEvent(event)

        if (single) {
          return (
            <button
              key={event.id}
              type="button"
              title={event.label}
              aria-label={`${event.label}, ${event.startDate}`}
              onClick={() => onSelect?.(event)}
              className="absolute top-1 flex -translate-x-1/2 flex-col items-center gap-0.5 border-0 bg-transparent p-0 text-[var(--mm-accent)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--mm-ring)]"
              style={{ left: startX }}
            >
              <span
                className="block size-2.5 rounded-full bg-[var(--mm-accent)]"
                aria-hidden="true"
              />
              <span className="max-w-20 truncate text-[0.65rem] leading-tight text-[var(--mm-fg-muted)]">
                {event.label}
              </span>
            </button>
          )
        }

        return (
          <button
            key={event.id}
            type="button"
            title={`${event.label} (${event.startDate} → ${event.endDate})`}
            aria-label={`${event.label}, ${event.startDate} to ${event.endDate}`}
            onClick={() => onSelect?.(event)}
            className="absolute top-2 overflow-hidden rounded-sm border-0 bg-[var(--mm-accent)]/25 px-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--mm-ring)]"
            style={{ left, width, height: Math.max(height - 16, 20) }}
          >
            <span className="block truncate text-[0.65rem] font-medium leading-tight text-[var(--mm-fg)]">
              {event.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
