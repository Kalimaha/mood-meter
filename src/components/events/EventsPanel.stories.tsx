import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import type { TimelineEvent } from '../../domain/types'
import { EventsPanel } from './EventsPanel'

const seed: TimelineEvent[] = [
  { id: '1', label: 'Birthday', startDate: '2026-03-01' },
  {
    id: '2',
    label: 'Review week',
    startDate: '2026-04-01',
    endDate: '2026-04-05',
  },
]

const meta = {
  title: 'Events/EventsPanel',
  component: EventsPanel,
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <div className="max-w-lg p-4" style={{ background: 'var(--mm-bg)' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof EventsPanel>

export default meta
type Story = StoryObj<typeof meta>

export const Controlled: Story = {
  render: function ControlledRender() {
    const [events, setEvents] = useState<TimelineEvent[]>(seed)
    return (
      <EventsPanel
        events={events}
        onEventsChange={setEvents}
        persist={false}
      />
    )
  },
}

export const Empty: Story = {
  args: {
    events: [],
    persist: false,
  },
}
