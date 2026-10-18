import { useEffect, useId, useMemo, useRef, useState } from 'react'
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
 * Scrollable mood polyline. Event markers are drawn **in the same SVG**
 * at polyline coordinates (1 CSS px = 1 SVG unit) so they cannot drift
 * off the chart. Popovers portal to document.body so overflow cannot clip them.
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
  const svgRef = useRef<SVGSVGElement>(null)

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
    // Close on next tick's outside tap — listen in bubble phase after our open handler
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [popover])

  const hasPath = geometry.pathD.length > 0
  const rootClass = ['mm-timeline', className].filter(Boolean).join(' ')

  /** Convert SVG user units → viewport CSS px for the portal popover. */
  const svgToViewport = (x: number, y: number): { left: number; top: number } => {
    const svg = svgRef.current
    if (!svg) return { left: 0, top: 0 }
    // Prefer CTM when available (real browsers); fall back for jsdom tests.
    if (typeof svg.createSVGPoint === 'function' && svg.getScreenCTM) {
      const pt = svg.createSVGPoint()
      pt.x = x
      pt.y = y
      const ctm = svg.getScreenCTM()
      if (ctm) {
        const screen = pt.matrixTransform(ctm)
        return { left: screen.x, top: screen.y }
      }
    }
    const rect = svg.getBoundingClientRect()
    const vb = svg.viewBox.baseVal
    const vbW = vb.width || geometry.width || 1
    const vbH = vb.height || geometry.height || 1
    return {
      left: rect.left + (x / vbW) * rect.width,
      top: rect.top + (y / vbH) * rect.height,
    }
  }

  const openDetail = (
    event: TimelineEvent,
    svgX: number,
    svgY: number,
    domEvent?: { stopPropagation: () => void },
  ) => {
    domEvent?.stopPropagation()
    const text = eventHasDescription(event)
      ? event.description!.trim()
      : event.label
    if (popover?.id === event.id) {
      setPopover(null)
      return
    }
    const { left, top } = svgToViewport(svgX, svgY)
    setPopover({ id: event.id, text, left, top })
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
              ref={svgRef}
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
                  <g
                    key={event.id}
                    data-mm-timeline-hit=""
                    data-testid={`event-band-${event.id}`}
                    onPointerUp={(e) => {
                      e.stopPropagation()
                      e.preventDefault()
                      openDetail(event, midX, midY, e)
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <rect
                      className="mm-timeline__event-band"
                      x={x}
                      y={0}
                      width={width}
                      height={geometry.height}
                      role="button"
                      tabIndex={0}
                      aria-label={`${event.label}, ${event.startDate} to ${event.endDate}`}
                      aria-expanded={popover?.id === event.id}
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
                    onPointerUp={
                      filled
                        ? (e) => {
                            e.stopPropagation()
                            e.preventDefault()
                            openDetail(event, x, y, e)
                          }
                        : undefined
                    }
                    style={filled ? { cursor: 'pointer' } : undefined}
                  >
                    {/* Nearly-opaque fill so Safari hit-tests; opacity 0 is unreliable */}
                    <circle
                      className="mm-timeline__event-hit"
                      r={18}
                      fill="#ffffff"
                      fillOpacity={0.01}
                      pointerEvents={filled ? 'all' : 'none'}
                      role={filled ? 'button' : undefined}
                      tabIndex={filled ? 0 : undefined}
                      aria-label={`${event.label}, ${event.startDate}`}
                      aria-expanded={filled ? isOpen : undefined}
                      aria-controls={
                        filled && isOpen ? `${popoverId}-${event.id}` : undefined
                      }
                      onKeyDown={
                        filled
                          ? (e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                openDetail(event, x, y)
                              }
                            }
                          : undefined
                      }
                    />
                    <circle
                      className={
                        filled
                          ? 'mm-timeline__event-pin mm-timeline__event-pin--filled'
                          : 'mm-timeline__event-pin mm-timeline__event-pin--hollow'
                      }
                      r={5}
                      pointerEvents="none"
                      aria-hidden="true"
                    />
                  </g>
                )
              })}
            </svg>
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
