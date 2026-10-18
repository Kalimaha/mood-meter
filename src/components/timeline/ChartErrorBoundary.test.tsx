import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ChartErrorBoundary } from './ChartErrorBoundary'

function Boom(): never {
  throw new Error('chart boom')
}

describe('ChartErrorBoundary', () => {
  it('renders fallback when a child throws and does not crash siblings', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <div>
        <ChartErrorBoundary>
          <Boom />
        </ChartErrorBoundary>
        <h2>Today</h2>
      </div>,
    )

    expect(screen.getByRole('alert')).toHaveTextContent('Timeline unavailable')
    expect(screen.getByRole('heading', { name: 'Today' })).toBeInTheDocument()
  })
})
