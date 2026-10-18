import { useEffect, useId, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
// ESM entry — CJS `lib/core` default-imports as a module object under Vite and
// crashes React with "Element type is invalid ... got: object".
import ReactECharts from 'echarts-for-react/esm/core'
import { eventHasDescription, isSingleDayEvent } from '../../domain/events'
import type { TimelineEvent } from '../../domain/types'
import { ChartErrorBoundary } from './ChartErrorBoundary'
import { buildMoodChartModel, DEFAULT_PX_PER_DAY } from './chartOption'
import echarts from './echarts'
import { dateToChartPoint } from './geometry'
import { isDateOnTimeline } from './dateToX'
import { yAxisExtentForSeries } from './series'
import type { TimelineDay } from './types'
import './Timeline.css'

export interface TimelineWithEventsProps {
  days: readonly TimelineDay[]
  events?: readonly TimelineEvent[]
  pxPerDay?: number
  /** @deprecated Alias of pxPerDay. */
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
 * Cumulative mood chart (ECharts) with event bands/pins.
 * Interactive hit targets are HTML overlays so mobile Safari gets reliable taps;
 * popovers portal to document.body.
 */
export function TimelineWithEvents({
  days,
  events = [],
  pxPerDay,
  step,
  className,
  'aria-label': ariaLabel = 'Mood timeline',
}: TimelineWithEventsProps) {
  const perDay = pxPerDay ?? step ?? DEFAULT_PX_PER_DAY

  const model = useMemo(
    () => buildMoodChartModel({ days, events, pxPerDay: perDay }),
    [days, events, perDay],
  )

  const yExtent = useMemo(
    () => yAxisExtentForSeries(model.series),
    [model.series],
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
        model.series.length > 0 &&
        event.startDate <= (model.series[model.series.length - 1]?.date ?? '') &&
        (event.endDate ?? event.startDate) >= (model.series[0]?.date ?? '')
      ) {
        ranges.push(event)
      }
    }
    return { singleDayEvents: singles, rangeEvents: ranges }
  }, [days, events, model.series])

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
    const timer = window.setTimeout(() => {
      document.addEventListener('pointerdown', onPointerDown)
    }, 0)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [popover])

  const hasPath = model.series.length > 0
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

  const layout = {
    width: model.width,
    height: model.height,
    yMin: yExtent.min,
    yMax: yExtent.max,
  }

  return (
    <div className={rootClass} role="region" aria-label={ariaLabel}>
      <div className="mm-timeline__scroll">
        <ChartErrorBoundary>
          <div
            className="mm-timeline__track"
            style={{
              width: model.width,
              height: hasPath ? model.height : undefined,
            }}
          >
            {hasPath ? (
              <>
                <div
                  className="mm-timeline__chart"
                  data-testid="mood-timeline-chart"
                  aria-hidden="true"
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

                <div className="mm-timeline__hits" aria-hidden={false}>
                  {rangeEvents.map((event) => {
                    const start = dateToChartPoint(
                      model.series,
                      event.startDate,
                      layout,
                    )
                    const end = dateToChartPoint(
                      model.series,
                      event.endDate ?? event.startDate,
                      layout,
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
                        style={{ left, width, height: model.height }}
                        aria-label={`${event.label}, ${event.startDate} to ${event.endDate}`}
                        aria-expanded={popover?.id === event.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          const rect = e.currentTarget.getBoundingClientRect()
                          openDetail(
                            event,
                            rect.left + rect.width / 2,
                            rect.top + rect.height / 2,
                          )
                        }}
                      />
                    )
                  })}
                  {singleDayEvents.map((event) => {
                    const { x, y } = dateToChartPoint(
                      model.series,
                      event.startDate,
                      layout,
                    )
                    const filled = eventHasDescription(event)
                    if (!filled) {
                      return (
                        <span
                          key={event.id}
                          data-mm-timeline-hit=""
                          data-testid={`event-pin-${event.id}`}
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
                        data-testid={`event-pin-${event.id}`}
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
                          const rect = e.currentTarget.getBoundingClientRect()
                          openDetail(
                            event,
                            rect.left + rect.width / 2,
                            rect.top,
                          )
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
        </ChartErrorBoundary>
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
