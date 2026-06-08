declare global {
  interface Window {
    ym?: (id: number, action: string, goal: string, params?: Record<string, unknown>) => void
  }
}

const YM_ID = 109646669

export function ym(goal: string, params?: Record<string, unknown>): void {
  window.ym?.(YM_ID, 'reachGoal', goal, params)
}
