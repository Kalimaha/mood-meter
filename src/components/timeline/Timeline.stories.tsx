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

export const DarkBackground: Story = {
  args: {
    days: mixedSequence,
  },
  globals: {
    backgrounds: { value: 'dark' },
  },
}
