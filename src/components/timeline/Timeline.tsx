import { buildTimelineGeometry, DEFAULT_STEP } from './geometry'
import type { TimelineDay } from './types'
import './Timeline.css'

export interface TimelineProps {
  days: readonly TimelineDay[]
  /** Horizontal pixels (user units) per day segment. */
  step?: number
  className?: string
  'aria-label'?: string
}

/**
 * Horizontally scrollable mood timeline polyline.
 * Each day draws an outgoing segment: flat → 0°, up → +45°, down → −45°.
 */
export function Timeline({
  days,
  step = DEFAULT_STEP,
  className,
  'aria-label': ariaLabel = 'Mood timeline',
}: TimelineProps) {
  const geometry = buildTimelineGeometry(days, { step })
  const hasPath = geometry.pathD.length > 0

  const rootClass = ['mm-timeline', className].filter(Boolean).join(' ')

  return (
    <div className={rootClass} role="region" aria-label={ariaLabel}>
      <div className="mm-timeline__scroll">
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
  )
}
