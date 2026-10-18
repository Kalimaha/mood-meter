import type { Meta, StoryObj } from '@storybook/react-vite'
import { Timeline } from './Timeline'
import {
  downSequence,
  flatSequence,
  mixedSequence,
  scrollSequence,
  upSequence,
} from './fixtures'

const meta = {
  title: 'Timeline/Timeline',
  component: Timeline,
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
} satisfies Meta<typeof Timeline>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {
  args: {
    days: [],
  },
}

export const FlatSequence: Story = {
  args: {
    days: flatSequence,
  },
}

export const UpSequence: Story = {
  args: {
    days: upSequence,
  },
}

export const DownSequence: Story = {
  args: {
    days: downSequence,
  },
}

export const MixedSequence: Story = {
  args: {
    days: mixedSequence,
  },
}

export const HorizontallyScrollable: Story = {
  args: {
    days: scrollSequence,
  },
}

/** Spans March→April so month verticals read `MAR 26` / `APR 26`. */
export const CrossMonth: Story = {
  args: {
    days: [
      { date: '2026-03-28', rating: 'up' },
      { date: '2026-03-29', rating: 'up' },
      { date: '2026-03-30', rating: 'flat' },
      { date: '2026-03-31', rating: 'down' },
      { date: '2026-04-01', rating: 'up' },
      { date: '2026-04-02', rating: 'up' },
      { date: '2026-04-03', rating: 'flat' },
    ],
  },
}

export const DarkBackground: Story = {
  args: {
    days: mixedSequence,
  },
  globals: {
    backgrounds: { value: 'dark' },
  },
}
