import type { ComposeOption } from 'echarts/core'
import type { LineSeriesOption } from 'echarts/charts'
import type {
  GridComponentOption,
  MarkAreaComponentOption,
  MarkLineComponentOption,
  MarkPointComponentOption,
  TooltipComponentOption,
} from 'echarts/components'

type EChartsOption = ComposeOption<
  | LineSeriesOption
  | GridComponentOption
  | TooltipComponentOption
  | MarkLineComponentOption
  | MarkAreaComponentOption
  | MarkPointComponentOption
>
import type { TimelineEvent } from '../../domain/types'
import { eventHasDescription, isSingleDayEvent } from '../../domain/events'
import {
  buildCumulativeSeries,
  DEFAULT_CHART_HEIGHT,
  DEFAULT_PX_PER_DAY,
  monthMarkersForSeries,
  seriesIndexOfDate,
  yAxisExtentForSeries,
  type TimelineSeriesPoint,
} from './series'
import type { TimelineDay } from './types'

export { DEFAULT_CHART_HEIGHT, DEFAULT_PX_PER_DAY } from './series'

export interface BuildMoodChartOptionInput {
  days: readonly TimelineDay[]
  events?: readonly TimelineEvent[]
  /** CSS accent color for the line / pins. */
  accentColor?: string
  /** Muted foreground for axes / grid. */
  mutedColor?: string
  /** Elevated background (for hollow pins). */
  elevatedBg?: string
  /** Foreground text color. */
  fgColor?: string
  pxPerDay?: number
}

export interface MoodChartModel {
  series: TimelineSeriesPoint[]
  option: EChartsOption
  /** Total chart width in CSS px (for horizontal scroll). */
  width: number
  height: number
}

function readCssVar(name: string, fallback: string): string {
  if (typeof window === 'undefined' || typeof getComputedStyle === 'undefined') {
    return fallback
  }
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim()
  return value.length > 0 ? value : fallback
}

/**
 * Build an ECharts option for the cumulative mood path:
 * - y = running sum of daily −1/0/+1 (gaps = 0), origin at 0
 * - horizontal grid every 5
 * - month verticals labeled like `MAR 26`
 * - optional event bands (markArea) and pins (markPoint)
 */
export function buildMoodChartModel(
  input: BuildMoodChartOptionInput,
): MoodChartModel {
  const pxPerDay = input.pxPerDay ?? DEFAULT_PX_PER_DAY
  const series = buildCumulativeSeries(input.days)
  const height = DEFAULT_CHART_HEIGHT

  if (series.length === 0) {
    return {
      series: [],
      option: {},
      width: pxPerDay * 4,
      height,
    }
  }

  const accent = input.accentColor ?? readCssVar('--mm-accent', '#3dcea0')
  const muted = input.mutedColor ?? readCssVar('--mm-fg-muted', '#9aa7b5')
  const elevated =
    input.elevatedBg ?? readCssVar('--mm-bg-elevated', '#1a222c')
  const fg = input.fgColor ?? readCssVar('--mm-fg', '#e8eef4')

  const yExtent = yAxisExtentForSeries(series)
  const months = monthMarkersForSeries(series)
  const dates = series.map((p) => p.date)
  const values = series.map((p) => p.cumulative)
  const width = Math.max(series.length * pxPerDay + 56, 280)

  const events = input.events ?? []
  const firstDate = series[0]?.date ?? ''
  const lastDate = series[series.length - 1]?.date ?? ''

  const markAreaData: Array<
    [{ xAxis: string; itemStyle: { color: string } }, { xAxis: string }]
  > = []
  const markPointData: Array<{
    name: string
    coord: [string, number]
    eventId: string
    hasDescription: boolean
    symbol: 'circle'
    symbolSize: number
    itemStyle: { color: string; borderColor: string; borderWidth: number }
  }> = []

  for (const event of events) {
    if (isSingleDayEvent(event)) {
      if (event.startDate < firstDate || event.startDate > lastDate) continue
      const idx = seriesIndexOfDate(series, event.startDate)
      if (idx < 0) continue
      const y = series[idx]?.cumulative ?? 0
      const filled = eventHasDescription(event)
      markPointData.push({
        name: event.label,
        coord: [event.startDate, y],
        eventId: event.id,
        hasDescription: filled,
        symbol: 'circle',
        symbolSize: filled ? 12 : 10,
        itemStyle: filled
          ? { color: accent, borderColor: accent, borderWidth: 2 }
          : { color: elevated, borderColor: accent, borderWidth: 2 },
      })
    } else {
      const start = event.startDate
      const end = event.endDate ?? event.startDate
      if (end < firstDate || start > lastDate) continue
      const clampedStart = start < firstDate ? firstDate : start
      const clampedEnd = end > lastDate ? lastDate : end
      markAreaData.push([
        {
          xAxis: clampedStart,
          itemStyle: { color: `${accent}38` },
        },
        { xAxis: clampedEnd },
      ])
    }
  }

  const monthMarkLineData = months.map((m) => ({
    xAxis: m.date,
    label: {
      show: true,
      formatter: m.label,
      position: 'start' as const,
      color: muted,
      fontSize: 11,
      fontWeight: 600 as const,
    },
    lineStyle: {
      color: muted,
      type: 'solid' as const,
      width: 1,
      opacity: 0.45,
    },
  }))

  const option: EChartsOption = {
    animation: false,
    backgroundColor: 'transparent',
    grid: {
      left: 44,
      right: 12,
      top: 28,
      bottom: 36,
      containLabel: false,
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: elevated,
      borderColor: muted,
      textStyle: { color: fg, fontSize: 12 },
      formatter: (params) => {
        const list = Array.isArray(params) ? params : [params]
        const first = list[0] as
          | { axisValue?: string; data?: number }
          | undefined
        if (first === undefined) return ''
        const date = String(first.axisValue ?? '')
        const y = typeof first.data === 'number' ? first.data : ''
        return `${date}<br/>Cumulative: ${y}`
      },
    },
    xAxis: {
      type: 'category',
      data: dates,
      boundaryGap: false,
      axisLine: { lineStyle: { color: muted } },
      axisTick: { show: false },
      axisLabel: { show: false },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value',
      min: yExtent.min,
      max: yExtent.max,
      interval: 5,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: muted,
        fontSize: 11,
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: muted,
          opacity: 0.35,
          type: 'solid',
          width: 1,
        },
      },
    },
    series: [],
  }

  const lineSeries: {
    type: 'line'
    name: string
    data: number[]
    showSymbol: true
    symbolSize: number
    lineStyle: { color: string; width: number }
    itemStyle: { color: string; borderColor: string; borderWidth: number }
    markLine: {
      symbol: ['none', 'none']
      silent: true
      animation: false
      data: typeof monthMarkLineData
    }
    markArea?: { silent: true; data: typeof markAreaData }
    markPoint?: {
      data: typeof markPointData
      label: { show: false }
    }
  } = {
    type: 'line',
    name: 'Mood',
    data: values,
    showSymbol: true,
    symbolSize: 6,
    lineStyle: {
      color: accent,
      width: 2.5,
    },
    itemStyle: {
      color: elevated,
      borderColor: accent,
      borderWidth: 2,
    },
    markLine: {
      symbol: ['none', 'none'],
      silent: true,
      animation: false,
      data: monthMarkLineData,
    },
  }

  if (markAreaData.length > 0) {
    lineSeries.markArea = { silent: true, data: markAreaData }
  }
  if (markPointData.length > 0) {
    lineSeries.markPoint = {
      data: markPointData,
      label: { show: false },
    }
  }

  option.series = [lineSeries]

  return { series, option, width, height }
}
