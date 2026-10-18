import '@testing-library/jest-dom/vitest'
import { createElement } from 'react'
import { vi } from 'vitest'

// ECharts needs a real canvas; stub the React wrapper in unit tests.
vi.mock('echarts-for-react/lib/core', () => ({
  default: function MockECharts() {
    return createElement('div', { 'data-testid': 'mock-echarts' })
  },
}))
vi.mock('echarts-for-react', () => ({
  default: function MockECharts() {
    return createElement('div', { 'data-testid': 'mock-echarts' })
  },
}))
