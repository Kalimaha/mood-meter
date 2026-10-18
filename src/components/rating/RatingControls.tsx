import { ArrowDown, ArrowUp, Equal } from 'lucide-react'
import type { MoodRating } from '../../domain/types'

const OPTIONS: ReadonlyArray<{
  rating: MoodRating
  label: string
  Icon: typeof ArrowUp
}> = [
  { rating: 'up', label: 'Up', Icon: ArrowUp },
  { rating: 'flat', label: 'Flat', Icon: Equal },
  { rating: 'down', label: 'Down', Icon: ArrowDown },
]

export interface RatingControlsProps {
  value?: MoodRating | undefined
  onSelect: (rating: MoodRating) => void
  disabled?: boolean
}

export function RatingControls({
  value,
  onSelect,
  disabled = false,
}: RatingControlsProps) {
  return (
    <div
      className="flex flex-wrap gap-2"
      role="group"
      aria-label="Daily mood rating"
    >
      {OPTIONS.map(({ rating, label, Icon }) => {
        const selected = value === rating
        return (
          <button
            key={rating}
            type="button"
            disabled={disabled}
            aria-pressed={selected}
            aria-label={label}
            onClick={() => onSelect(rating)}
            className="inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-[var(--mm-radius)] border px-3 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              borderColor: selected ? 'var(--mm-accent)' : 'var(--mm-border)',
              background: selected
                ? 'var(--mm-accent)'
                : 'var(--mm-bg-elevated)',
              color: selected ? 'var(--mm-accent-fg)' : 'var(--mm-fg)',
              boxShadow: selected ? '0 0 0 3px var(--mm-ring)' : undefined,
            }}
          >
            <Icon className="size-5" aria-hidden="true" />
            <span aria-hidden="true">
              {rating === 'up' ? '⬆️' : rating === 'flat' ? '🟰' : '⬇️'}
            </span>
          </button>
        )
      })}
    </div>
  )
}
