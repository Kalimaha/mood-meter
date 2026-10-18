import { useEffect, useId, useMemo, useState } from 'react'
import { eventHasDescription, isSingleDayEvent } from '../../domain/events'
import type { TimelineEvent } from '../../domain/types'
import { TimelineEventMarkers } from '../events/TimelineEventMarkers'
import { dateToTimelineX } from './dateToX'
import {
  buildTimelineGeometry,
  DEFAULT_PADDING,
  DEFAULT_STEP,
} from './geometry'
import type { TimelineDay } from './types'
import './Timeline.css'

export interface TimelineWithEventsProps {
  days: readonly TimelineDay[]
  events?: readonly TimelineEvent[]
  step?: number
  className?: string
  'aria-label'?: string
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/**
 * Scrollable mood polyline with optional event markers in the same
 * horizontal coordinate space.
 *
 * Range events: full-height clickable bands (description on click).
 * Single-day: hollow/filled dots on the track; filled opens description.
 */
export function TimelineWithEvents({
  days,
  events = [],
  step = DEFAULT_STEP,
  className,
  'aria-label': ariaLabel = 'Mood timeline',
}: TimelineWithEventsProps) {
  const geometry = useMemo(
    () => buildTimelineGeometry(days, { step }),
    [days, step],
  )

  const { singleDayEvents, rangeEvents } = useMemo(() => {
    const singles: TimelineEvent[] = []
    const ranges: TimelineEvent[] = []
    for (const event of events) {
      if (isSingleDayEvent(event)) singles.push(event)
      else ranges.push(event)
    }
    return { singleDayEvents: singles, rangeEvents: ranges }
  }, [events])

  const xMin = DEFAULT_PADDING
  const xMax = Math.max(geometry.width - DEFAULT_PADDING, xMin)

  const getXForDate = (isoDate: string) =>
    clamp(dateToTimelineX(days, isoDate, { step }), xMin, xMax)

  const [openRangeId, setOpenRangeId] = useState<string | null>(null)
  const rangePopoverId = useId()

  useEffect(() => {
    if (openRangeId === null) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenRangeId(null)
    }
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return
      if (target.closest('[data-mm-event-band]')) return
      setOpenRangeId(null)
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [openRangeId])

  const hasPath = geometry.pathD.length > 0
  const rootClass = ['mm-timeline', className].filter(Boolean).join(' ')

  return (
    <div className={rootClass} role="region" aria-label={ariaLabel}>
      <div className="mm-timeline__scroll">
        <div className="mm-timeline__track" style={{ width: geometry.width }}>
          {hasPath ? (
            <svg
              className="mm-timeline__svg"
              viewBox={geometry.viewBox}
              width={geometry.width}
              height={geometry.height}
              role="img"
              aria-label={ariaLabel}
            >
              <path
                className="mm-timeline__line"
                d={geometry.pathD}
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
              {geometry.points.map((p, i) => (
                <circle
                  key={i === 0 ? 'start' : (days[i - 1]?.date ?? `p-${i}`)}
                  className="mm-timeline__dot"
                  cx={p.x}
                  cy={p.y}
                  r={3.5}
                />
              ))}
            </svg>
          ) : (
            <p className="mm-timeline__empty">No ratings yet</p>
          )}

          {hasPath && rangeEvents.length > 0 ? (
            <div className="mm-timeline__bands" aria-hidden={false}>
              {rangeEvents.map((event) => {
                const startX = getXForDate(event.startDate)
                const endX = getXForDate(event.endDate ?? event.startDate)
                const left = Math.min(startX, endX)
                const width = Math.max(Math.abs(endX - startX), 2)
                const isOpen = openRangeId === event.id
                const detail = eventHasDescription(event)
                  ? event.description!.trim()
                  : event.label

                return (
                  <button
                    key={event.id}
                    type="button"
                    data-mm-event-band=""
                    data-testid={`event-band-${event.id}`}
                    title={event.label}
                    aria-label={`${event.label}, ${event.startDate} to ${event.endDate}`}
                    aria-expanded={isOpen}
                    aria-controls={
                      isOpen ? `${rangePopoverId}-${event.id}` : undefined
                    }
                    onClick={() => {
                      setOpenRangeId(isOpen ? null : event.id)
                    }}
                    className="mm-timeline__event-band"
                    style={{ left, width }}
                  >
                    {isOpen ? (
                      <span
                        id={`${rangePopoverId}-${event.id}`}
                        role="tooltip"
                        className="mm-event-pin__popover mm-timeline__band-popover"
                      >
                        {detail}
                      </span>
                    ) : null}
                  </button>
                )
              })}
            </div>
          ) : null}

          {singleDayEvents.length > 0 ? (
            <TimelineEventMarkers
              events={singleDayEvents}
              getXForDate={getXForDate}
              className="mm-timeline__markers"
            />
          ) : null}
        </div>
      </div>
    </div>
  )
}
