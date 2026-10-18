import { useMemo } from 'react'
// ESM entry — CJS `lib/core` default-imports as a module object under Vite and
// crashes React with "Element type is invalid ... got: object".
import ReactECharts from 'echarts-for-react/esm/core'
import { ChartErrorBoundary } from './ChartErrorBoundary'
import { buildMoodChartModel, DEFAULT_PX_PER_DAY } from './chartOption'
import echarts from './echarts'
import type { TimelineDay } from './types'
import './Timeline.css'

export interface TimelineProps {
  days: readonly TimelineDay[]
  /** Horizontal pixels per calendar day. */
  pxPerDay?: number
  /** @deprecated Alias of pxPerDay for older stories. */
  step?: number
  className?: string
  'aria-label'?: string
}

/**
 * Horizontally scrollable cumulative mood timeline (Apache ECharts).
 * Daily values: up=+1, flat=0, down=−1; missing days=0; y is running sum from 0.
 */
export function Timeline({
  days,
  pxPerDay,
  step,
  className,
  'aria-label': ariaLabel = 'Mood timeline',
}: TimelineProps) {
  const perDay = pxPerDay ?? step ?? DEFAULT_PX_PER_DAY
  const model = useMemo(
    () => buildMoodChartModel({ days, pxPerDay: perDay }),
    [days, perDay],
  )
  const hasPath = model.series.length > 0
  const rootClass = ['mm-timeline', className].filter(Boolean).join(' ')

  return (
    <div className={rootClass} role="region" aria-label={ariaLabel}>
      <div className="mm-timeline__scroll">
        <ChartErrorBoundary>
          {hasPath ? (
            <div
              className="mm-timeline__track"
              style={{ width: model.width, height: model.height }}
              data-testid="mood-timeline-chart"
            >
              <ReactECharts
                echarts={echarts}
                option={model.option}
                style={{ width: model.width, height: model.height }}
                opts={{ renderer: 'canvas' }}
                notMerge
                lazyUpdate
              />
            </div>
          ) : (
            <p className="mm-timeline__empty">No ratings yet</p>
          )}
        </ChartErrorBoundary>
      </div>
    </div>
  )
}
