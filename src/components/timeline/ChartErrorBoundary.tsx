import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ChartErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ChartErrorBoundaryState {
  error: Error | null
}

/**
 * Isolates chart/render failures so Today / Event forms still mount.
 */
export class ChartErrorBoundary extends Component<
  ChartErrorBoundaryProps,
  ChartErrorBoundaryState
> {
  state: ChartErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ChartErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Mood timeline failed to render', error, info.componentStack)
  }

  render(): ReactNode {
    if (this.state.error !== null) {
      return (
        this.props.fallback ?? (
          <p className="mm-timeline__empty" role="alert">
            Timeline unavailable
          </p>
        )
      )
    }
    return this.props.children
  }
}
