import type { Meta, StoryObj } from '@storybook/react-vite'
import { HomeShell } from './HomeShell'

const meta = {
  title: 'Shell/HomeShell',
  component: HomeShell,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof HomeShell>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
