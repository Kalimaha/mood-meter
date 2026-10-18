import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { DayNoteField } from './DayNoteField'

const meta = {
  title: 'DayEntry/DayNoteField',
  component: DayNoteField,
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof DayNoteField>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {
  args: {
    value: '',
    onChange: () => undefined,
  },
}

export const Filled: Story = {
  args: {
    value: 'Felt focused after a long walk.',
    onChange: () => undefined,
  },
}

export const Interactive: Story = {
  args: {
    value: '',
    onChange: () => undefined,
  },
  render: function InteractiveNote() {
    const [value, setValue] = useState('')
    return <DayNoteField value={value} onChange={setValue} />
  },
}
