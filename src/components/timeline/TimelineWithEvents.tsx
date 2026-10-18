import { useEffect, useId, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
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
  left: number
  top: number
}

/**
 * Mood polyline in SVG (1 CSS px = 1 SVG unit).
 * Interactive hit targets are HTML overlays at the same coordinates so
 * mobile Safari gets reliable taps; popovers portal to document.body.
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

  const openDetail = (event: TimelineEvent, clientX: number, clientY: number) => {
    const text = eventHasDescription(event)
      ? event.description!.trim()
      : event.label
    setPopover((prev) =>
      prev?.id === event.id
        ? null
        : { id: event.id, text, left: clientX, top: clientY },
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
            <>
              <svg
                className="mm-timeline__svg"
                viewBox={geometry.viewBox}
                width={geometry.width}
                height={geometry.height}
                aria-hidden="true"
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
                  return (
                    <rect
                      key={`band-vis-${event.id}`}
                      className="mm-timeline__event-band"
                      x={x}
                      y={0}
                      width={width}
                      height={geometry.height}
                      pointerEvents="none"
                    />
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
                  return (
                    <circle
                      key={`pin-vis-${event.id}`}
                      className={
                        filled
                          ? 'mm-timeline__event-pin mm-timeline__event-pin--filled'
                          : 'mm-timeline__event-pin mm-timeline__event-pin--hollow'
                      }
                      cx={x}
                      cy={y}
                      r={5}
                      data-has-description={filled ? 'true' : 'false'}
                      data-testid={`event-pin-${event.id}`}
                    />
                  )
                })}
              </svg>

              {/* HTML hit layer — same px space as SVG; reliable on iOS Safari */}
              <div className="mm-timeline__hits" aria-hidden={false}>
                {rangeEvents.map((event) => {
                  const start = dateToTimelinePoint(days, event.startDate, {
                    step,
                  })
                  const end = dateToTimelinePoint(
                    days,
                    event.endDate ?? event.startDate,
                    { step },
                  )
                  const left = Math.min(start.x, end.x)
                  const width = Math.max(Math.abs(end.x - start.x), 8)
                  return (
                    <button
                      key={event.id}
                      type="button"
                      data-mm-timeline-hit=""
                      data-testid={`event-band-${event.id}`}
                      className="mm-timeline__hit-band"
                      style={{ left, width, height: geometry.height }}
                      aria-label={`${event.label}, ${event.startDate} to ${event.endDate}`}
                      aria-expanded={popover?.id === event.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        openDetail(event, e.clientX, e.clientY)
                      }}
                    />
                  )
                })}
                {singleDayEvents.map((event) => {
                  const { x, y } = dateToTimelinePoint(days, event.startDate, {
                    step,
                  })
                  const filled = eventHasDescription(event)
                  if (!filled) {
                    return (
                      <span
                        key={event.id}
                        data-mm-timeline-hit=""
                        className="mm-timeline__hit-pin mm-timeline__hit-pin--inert"
                        style={{ left: x, top: y }}
                        aria-label={`${event.label}, ${event.startDate}`}
                      />
                    )
                  }
                  return (
                    <button
                      key={event.id}
                      type="button"
                      data-mm-timeline-hit=""
                      data-has-description="true"
                      className="mm-timeline__hit-pin"
                      style={{ left: x, top: y }}
                      aria-label={`${event.label}, ${event.startDate}`}
                      aria-expanded={popover?.id === event.id}
                      aria-controls={
                        popover?.id === event.id
                          ? `${popoverId}-${event.id}`
                          : undefined
                      }
                      onClick={(e) => {
                        e.stopPropagation()
                        openDetail(event, e.clientX, e.clientY)
                      }}
                    />
                  )
                })}
              </div>
            </>
          ) : (
            <p className="mm-timeline__empty">No ratings yet</p>
          )}
        </div>
      </div>

      {popover
        ? createPortal(
            <div
              id={`${popoverId}-${popover.id}`}
              role="tooltip"
              className="mm-timeline__popover"
              style={{ left: popover.left, top: popover.top }}
            >
              {popover.text}
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}
