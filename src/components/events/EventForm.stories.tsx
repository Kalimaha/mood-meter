import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { EventForm } from './EventForm'

const meta = {
  title: 'Events/EventForm',
  component: EventForm,
  parameters: {
    layout: 'padded',
  },
  args: {
    onSubmit: fn(),
    defaultStartDate: '2026-10-18',
  },
  decorators: [
    (Story) => (
      <div className="max-w-md p-4" style={{ background: 'var(--mm-bg)' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof EventForm>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Disabled: Story = {
  args: {
    disabled: true,
  },
}
