import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import type { MoodRating } from '../../domain/types'
import { RatingControls } from './RatingControls'

const meta = {
  title: 'DayEntry/RatingControls',
  component: RatingControls,
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof RatingControls>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {
  args: {
    onSelect: () => undefined,
  },
}

export const SelectedUp: Story = {
  args: {
    value: 'up',
    onSelect: () => undefined,
  },
}

export const Interactive: Story = {
  args: {
    onSelect: () => undefined,
  },
  render: function InteractiveRating() {
    const [value, setValue] = useState<MoodRating | undefined>('flat')
    return <RatingControls value={value} onSelect={setValue} />
  },
}
