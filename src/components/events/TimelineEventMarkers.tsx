import { useEffect, useId, useState } from 'react'
import {
  eventHasDescription,
  isSingleDayEvent,
} from '../../domain/events'
import type { TimelineEvent } from '../../domain/types'

export interface TimelineEventMarkersProps {
  events: readonly TimelineEvent[]
  /**
   * Map an ISO date (YYYY-MM-DD) to an x position in the same coordinate
   * space as the timeline track. Provided by the timeline owner — this
   * component does not compute mood polyline geometry.
   */
  getXForDate: (isoDate: string) => number
  /** Height of the marker layer in CSS pixels (used for vertical centering). */
  height?: number
  className?: string
  onSelect?: (event: TimelineEvent) => void
}

/**
 * Single-day event pins on the timeline.
 * Hollow dots = no description; filled = has description.
 * Labels/descriptions appear only in a click popover (not always under the dot).
 * Range events are ignored here — full-height bands live in TimelineWithEvents.
 */
export function TimelineEventMarkers({
  events,
  getXForDate,
  height = 48,
  className,
  onSelect,
}: TimelineEventMarkersProps) {
  const [openId, setOpenId] = useState<string | null>(null)
  const popoverId = useId()
  const singles = events.filter(isSingleDayEvent)

  useEffect(() => {
    if (openId === null) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenId(null)
    }
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return
      if (target.closest('[data-mm-event-pin]')) return
      setOpenId(null)
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [openId])

  return (
    <div
      className={className}
      role="group"
      aria-label="Timeline event markers"
      style={{ position: 'relative', height, width: '100%' }}
    >
      {singles.map((event) => {
        const startX = getXForDate(event.startDate)
        const hasDescription = eventHasDescription(event)
        const isOpen = openId === event.id
        const detail = hasDescription
          ? event.description!.trim()
          : event.label

        return (
          <button
            key={event.id}
            type="button"
            data-mm-event-pin=""
            data-has-description={hasDescription ? 'true' : 'false'}
            title={event.label}
            aria-label={`${event.label}, ${event.startDate}`}
            aria-expanded={isOpen}
            aria-controls={isOpen ? `${popoverId}-${event.id}` : undefined}
            onClick={() => {
              setOpenId(isOpen ? null : event.id)
              onSelect?.(event)
            }}
            className="mm-event-pin absolute top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center border-0 bg-transparent p-0 outline-none focus-visible:ring-2 focus-visible:ring-[var(--mm-ring)]"
            style={{ left: startX }}
          >
            <span
              className={
                hasDescription
                  ? 'mm-event-pin__dot mm-event-pin__dot--filled'
                  : 'mm-event-pin__dot mm-event-pin__dot--hollow'
              }
              aria-hidden="true"
            />
            {isOpen ? (
              <span
                id={`${popoverId}-${event.id}`}
                role="tooltip"
                className="mm-event-pin__popover"
              >
                {detail}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
