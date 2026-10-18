import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import type { TimelineEvent } from '../../domain/types'
import { EventList } from './EventList'

const sample: TimelineEvent[] = [
  { id: '1', label: 'Birthday', startDate: '2026-03-01' },
  {
    id: '2',
    label: 'Performance review',
    startDate: '2026-04-01',
    endDate: '2026-04-05',
  },
  { id: '3', label: 'Move day', startDate: '2026-06-15' },
]

const meta = {
  title: 'Events/EventList',
  component: EventList,
  parameters: {
    layout: 'padded',
  },
  args: {
    events: sample,
    onDelete: fn(),
  },
  decorators: [
    (Story) => (
      <div className="max-w-md p-4" style={{ background: 'var(--mm-bg)' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof EventList>

export default meta
type Story = StoryObj<typeof meta>

export const Populated: Story = {}

export const Empty: Story = {
  args: {
    events: [],
  },
}

export const ReadOnly: Story = {
  render: () => <EventList events={sample} />,
}
