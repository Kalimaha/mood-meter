import { useMemo } from 'react'
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

/**
 * Scrollable mood polyline with optional event markers in the same
 * horizontal coordinate space.
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

  const markerWidth = useMemo(() => {
    if (events.length === 0) return geometry.width
    let maxX = geometry.width
    for (const event of events) {
      maxX = Math.max(
        maxX,
        dateToTimelineX(days, event.startDate, { step }) + DEFAULT_PADDING,
        dateToTimelineX(days, event.endDate ?? event.startDate, { step }) +
          DEFAULT_PADDING,
      )
    }
    return maxX
  }, [days, events, geometry.width, step])

  const getXForDate = (isoDate: string) =>
    dateToTimelineX(days, isoDate, { step })

  const hasPath = geometry.pathD.length > 0
  const rootClass = ['mm-timeline', className].filter(Boolean).join(' ')

  return (
    <div className={rootClass} role="region" aria-label={ariaLabel}>
      <div className="mm-timeline__scroll">
        <div
          className="mm-timeline__track"
          style={{ width: Math.max(markerWidth, geometry.width) }}
        >
          {events.length > 0 ? (
            <TimelineEventMarkers
              events={events}
              getXForDate={getXForDate}
              height={48}
              className="mm-timeline__markers"
            />
          ) : null}

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
        </div>
      </div>
    </div>
  )
}
