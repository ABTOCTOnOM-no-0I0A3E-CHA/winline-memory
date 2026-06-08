/* ─── API surface for the game frontend ─────────────────────────────────── */

import { apiRequest } from './client'
import type {
  AnalyticsEvent,
  Bonus,
  GameSession,
  IngestAck,
  UtmParams,
} from './types'

export * from './types'
export { API_BASE_URL, API_CONFIGURED, ApiError } from './client'

/** Read UTM params from the current URL query string. */
export function readUtmParams(): UtmParams {
  const p = new URLSearchParams(window.location.search)
  const pick = (k: string) => p.get(k) ?? undefined
  return {
    utm_source: pick('utm_source'),
    utm_medium: pick('utm_medium'),
    utm_campaign: pick('utm_campaign'),
    utm_content: pick('utm_content'),
    utm_term: pick('utm_term'),
  }
}

/** POST /v1/game:start — create anonymous game session, return its token. */
export function startGame(utm: UtmParams = readUtmParams()): Promise<GameSession | null> {
  return apiRequest<GameSession>('/game:start', { method: 'POST', body: utm })
}

/** POST /v1/analytics/events — bulk-ingest gameplay events. */
export function ingestEvents(
  gameSessionToken: string,
  events: AnalyticsEvent[]
): Promise<IngestAck | null> {
  return apiRequest<IngestAck>('/analytics/events', {
    method: 'POST',
    body: { game_session_token: gameSessionToken, events },
  })
}

/** GET /v1/bonus — current Winline bonus URL. */
export function getBonus(): Promise<Bonus | null> {
  return apiRequest<Bonus>('/bonus', { method: 'GET' })
}
