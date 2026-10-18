import { useEffect, useId, useMemo, useState } from 'react'
import { eventHasDescription, isSingleDayEvent } from '../../domain/events'
import type { TimelineEvent } from '../../domain/types'
import {
  dateToTimelinePoint,
  isDateOnTimeline,
} from './dateToX'
import {
  buildTimelineGeometry,
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

interface OpenPopover {
  id: string
  text: string
  x: number
  y: number
}

/**
 * Scrollable mood polyline. Event markers are drawn **in the same SVG**
 * at polyline coordinates (1 CSS px = 1 SVG unit) so they cannot drift
 * above/below the chart. Filled dots + range bands are tappable.
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
      if (isSingleDayEvent(event)) {
        // Only pins that fall on the rated timeline span
        if (isDateOnTimeline(days, event.startDate)) {
          singles.push(event)
        }
      } else if (
        days.length > 0 &&
        event.startDate <= (days[days.length - 1]?.date ?? '') &&
        (event.endDate ?? event.startDate) >= (days[0]?.date ?? '')
      ) {
        ranges.push(event)
      }
    }
    return { singleDayEvents: singles, rangeEvents: ranges }
  }, [days, events])

  const [popover, setPopover] = useState<OpenPopover | null>(null)
  const popoverId = useId()

  useEffect(() => {
    if (popover === null) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPopover(null)
    }
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return
      if (target.closest('[data-mm-timeline-hit]')) return
      if (target.closest('.mm-timeline__popover')) return
      setPopover(null)
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [popover])

  const hasPath = geometry.pathD.length > 0
  const rootClass = ['mm-timeline', className].filter(Boolean).join(' ')

  const openDetail = (event: TimelineEvent, x: number, y: number) => {
    const text = eventHasDescription(event)
      ? event.description!.trim()
      : event.label
    setPopover((prev) =>
      prev?.id === event.id ? null : { id: event.id, text, x, y },
    )
  }

  return (
    <div className={rootClass} role="region" aria-label={ariaLabel}>
      <div className="mm-timeline__scroll">
        <div
          className="mm-timeline__track"
          style={{
            width: geometry.width,
            height: hasPath ? geometry.height : undefined,
          }}
        >
          {hasPath ? (
            <svg
              className="mm-timeline__svg"
              viewBox={geometry.viewBox}
              width={geometry.width}
              height={geometry.height}
              role="img"
              aria-label={ariaLabel}
            >
              {rangeEvents.map((event) => {
                const start = dateToTimelinePoint(days, event.startDate, {
                  step,
                })
                const end = dateToTimelinePoint(
                  days,
                  event.endDate ?? event.startDate,
                  { step },
                )
                const x = Math.min(start.x, end.x)
                const width = Math.max(Math.abs(end.x - start.x), 8)
                const midX = x + width / 2
                const midY = geometry.height / 2

                return (
                  <g key={event.id} data-mm-timeline-hit="">
                    <rect
                      className="mm-timeline__event-band"
                      x={x}
                      y={0}
                      width={width}
                      height={geometry.height}
                      data-testid={`event-band-${event.id}`}
                      role="button"
                      tabIndex={0}
                      aria-label={`${event.label}, ${event.startDate} to ${event.endDate}`}
                      aria-expanded={popover?.id === event.id}
                      onClick={() => openDetail(event, midX, midY)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          openDetail(event, midX, midY)
                        }
                      }}
                    />
                  </g>
                )
              })}

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

              {singleDayEvents.map((event) => {
                const { x, y } = dateToTimelinePoint(days, event.startDate, {
                  step,
                })
                const filled = eventHasDescription(event)
                const isOpen = popover?.id === event.id

                return (
                  <g
                    key={event.id}
                    data-mm-timeline-hit=""
                    data-has-description={filled ? 'true' : 'false'}
                    data-testid={`event-pin-${event.id}`}
                    transform={`translate(${x} ${y})`}
                  >
                    {/* Large invisible hit target for mobile Safari */}
                    {filled ? (
                      <circle
                        className="mm-timeline__event-hit"
                        r={16}
                        role="button"
                        tabIndex={0}
                        aria-label={`${event.label}, ${event.startDate}`}
                        aria-expanded={isOpen}
                        aria-controls={
                          isOpen ? `${popoverId}-${event.id}` : undefined
                        }
                        onClick={() => openDetail(event, x, y)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            openDetail(event, x, y)
                          }
                        }}
                      />
                    ) : (
                      <circle
                        className="mm-timeline__event-hit mm-timeline__event-hit--inert"
                        r={12}
                        aria-label={`${event.label}, ${event.startDate}`}
                      />
                    )}
                    <circle
                      className={
                        filled
                          ? 'mm-timeline__event-pin mm-timeline__event-pin--filled'
                          : 'mm-timeline__event-pin mm-timeline__event-pin--hollow'
                      }
                      r={5}
                      aria-hidden="true"
                    />
                  </g>
                )
              })}
            </svg>
          ) : (
            <p className="mm-timeline__empty">No ratings yet</p>
          )}

          {popover ? (
            <div
              id={`${popoverId}-${popover.id}`}
              role="tooltip"
              className="mm-timeline__popover"
              style={{ left: popover.x, top: popover.y }}
            >
              {popover.text}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
