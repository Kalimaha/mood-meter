export interface DayNoteFieldProps {
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  disabled?: boolean
  id?: string
  placeholder?: string
}

export function DayNoteField({
  value,
  onChange,
  onBlur,
  disabled = false,
  id = 'day-note',
  placeholder = 'Optional note for today…',
}: DayNoteFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-sm font-medium"
        style={{ color: 'var(--mm-fg-muted)' }}
      >
        Note
      </label>
      <textarea
        id={id}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        rows={3}
        maxLength={280}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        className="w-full resize-y rounded-[var(--mm-radius)] border px-3 py-2 text-sm outline-none"
        style={{
          borderColor: 'var(--mm-border)',
          background: 'var(--mm-bg-elevated)',
          color: 'var(--mm-fg)',
        }}
      />
    </div>
  )
}
