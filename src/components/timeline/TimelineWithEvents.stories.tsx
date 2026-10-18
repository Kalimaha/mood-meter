import type { Meta, StoryObj } from '@storybook/react-vite'
import { TimelineWithEvents } from './TimelineWithEvents'
import { mixedSequence, scrollSequence } from './fixtures'

const meta = {
  title: 'Timeline/TimelineWithEvents',
  component: TimelineWithEvents,
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: '28rem' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TimelineWithEvents>

export default meta
type Story = StoryObj<typeof meta>

export const WithPinsAndBand: Story = {
  args: {
    days: mixedSequence,
    events: [
      {
        id: 'bday',
        label: 'Birthday',
        description: 'Cake day',
        startDate: '2026-03-02',
      },
      {
        id: 'quiet',
        label: 'Quiet',
        startDate: '2026-03-05',
      },
      {
        id: 'trip',
        label: 'Coast trip',
        description: 'Long weekend away',
        startDate: '2026-03-04',
        endDate: '2026-03-06',
      },
    ],
  },
}

export const WideScroll: Story = {
  args: {
    days: scrollSequence,
    events: [
      {
        id: 'mid',
        label: 'Mid-month',
        description: 'Halfway mark',
        startDate: '2026-03-14',
      },
    ],
  },
}

export const DarkBackground: Story = {
  args: {
    days: mixedSequence,
    events: [
      {
        id: 'bday',
        label: 'Birthday',
        description: 'Cake day',
        startDate: '2026-03-02',
      },
    ],
  },
  globals: {
    backgrounds: { value: 'dark' },
  },
}
