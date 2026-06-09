declare global {
  interface Window {
    // overload 1 — reachGoal / hit
    ym?(
      id: number,
      action: 'reachGoal',
      goal: string,
      params?: Record<string, unknown>
    ): void
    // overload 2 — getClientID (async, calls callback with the ID)
    ym?(
      id: number,
      action: 'getClientID',
      callback: (clientId: string) => void
    ): void
  }
}

export const YM_ID = 109646669

export function ym(goal: string, params?: Record<string, unknown>): void {
  window.ym?.(YM_ID, 'reachGoal', goal, params)
}

/**
 * Returns the Yandex Metrika ClientID for sub5 injection.
 *
 * Strategy:
 *  1. Ask YM directly via getClientID (official, async).
 *  2. Fallback: read the _ym_uid cookie synchronously (same value).
 *  3. Fallback: return empty string (YM not loaded yet).
 */
export function getYMClientId(): Promise<string> {
  return new Promise((resolve) => {
    // Give YM up to 3 s to init, then fall back to cookie.
    const timeout = setTimeout(() => resolve(readYMCookie()), 3000)

    try {
      window.ym?.(YM_ID, 'getClientID', (clientId: string) => {
        clearTimeout(timeout)
        resolve(clientId || readYMCookie())
      })

      // If window.ym is not defined yet, the optional-chain silently no-ops
      // and the timeout will fire — cookie fallback kicks in.
      if (!window.ym) {
        clearTimeout(timeout)
        resolve(readYMCookie())
      }
    } catch {
      clearTimeout(timeout)
      resolve(readYMCookie())
    }
  })
}

/** Read _ym_uid cookie — Metrika stores the same clientId there. */
function readYMCookie(): string {
  const match = document.cookie.match(/_ym_uid=(\d+)/)
  return match ? match[1] : ''
}
