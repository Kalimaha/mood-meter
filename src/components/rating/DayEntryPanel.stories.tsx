import type { Meta, StoryObj } from '@storybook/react-vite'
import { DayEntryPanel } from './DayEntryPanel'

const meta = {
  title: 'DayEntry/DayEntryPanel',
  component: DayEntryPanel,
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof DayEntryPanel>

export default meta
type Story = StoryObj<typeof meta>

export const Today: Story = {
  args: {
    date: '2026-10-18',
  },
}

export const OtherDay: Story = {
  args: {
    date: '2026-10-01',
  },
}
