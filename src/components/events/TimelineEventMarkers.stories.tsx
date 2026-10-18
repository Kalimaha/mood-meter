import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import type { TimelineEvent } from '../../domain/types'
import { TimelineEventMarkers } from './TimelineEventMarkers'

const DAY_MS = 86_400_000
const ORIGIN = '2026-04-01'
const DAY_WIDTH = 48

function getXForDate(iso: string): number {
  const start = Date.parse(`${ORIGIN}T00:00:00Z`)
  const day = Date.parse(`${iso}T00:00:00Z`)
  return ((day - start) / DAY_MS) * DAY_WIDTH + DAY_WIDTH / 2
}

const events: TimelineEvent[] = [
  { id: 'pin', label: 'Launch', startDate: '2026-04-03' },
  {
    id: 'band',
    label: 'Review',
    startDate: '2026-04-01',
    endDate: '2026-04-05',
  },
  { id: 'move', label: 'Move', startDate: '2026-04-07' },
]

const meta = {
  title: 'Events/TimelineEventMarkers',
  component: TimelineEventMarkers,
  parameters: {
    layout: 'padded',
  },
  args: {
    events,
    getXForDate,
    height: 56,
    onSelect: fn(),
  },
  decorators: [
    (Story) => (
      <div
        className="overflow-x-auto rounded-[var(--mm-radius)] border border-[var(--mm-border)] p-3"
        style={{ background: 'var(--mm-bg-elevated)', width: 420 }}
      >
        <p className="m-0 mb-2 text-xs text-[var(--mm-fg-muted)]">
          Placeholder timeline track (polyline owned elsewhere)
        </p>
        <div
          className="relative mb-1 h-16 rounded-sm"
          style={{
            width: DAY_WIDTH * 10,
            background:
              'linear-gradient(90deg, transparent 47%, var(--mm-border) 49%, var(--mm-border) 51%, transparent 53%)',
            backgroundSize: `${DAY_WIDTH}px 100%`,
          }}
          aria-hidden="true"
        >
          <svg
            width={DAY_WIDTH * 10}
            height={64}
            className="absolute inset-0"
            aria-hidden="true"
          >
            <polyline
              fill="none"
              stroke="var(--mm-accent)"
              strokeWidth="2"
              points={`24,40 ${24 + DAY_WIDTH},24 ${24 + DAY_WIDTH * 2},40 ${24 + DAY_WIDTH * 3},56 ${24 + DAY_WIDTH * 4},40 ${24 + DAY_WIDTH * 5},24`}
            />
          </svg>
        </div>
        <div style={{ width: DAY_WIDTH * 10 }}>
          <Story />
        </div>
      </div>
    ),
  ],
} satisfies Meta<typeof TimelineEventMarkers>

export default meta
type Story = StoryObj<typeof meta>

export const Mixed: Story = {}

export const PinsOnly: Story = {
  args: {
    events: [
      { id: 'a', label: 'A', startDate: '2026-04-02' },
      { id: 'b', label: 'B', startDate: '2026-04-06' },
    ],
  },
}
