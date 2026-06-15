/* ─── Backend API DTOs & types (BACKEND_API_SCHEMA.md) ──────────────────── */

/** Tagged response envelope (backend/internal/result.py) */
export interface ApiOk<T> {
  type: 'ok'
  data: T
}

export interface ApiErrInfo {
  code: string | number
  message: string
  status: string
  details?: unknown[]
}

export interface ApiErr {
  type: 'error'
  error: ApiErrInfo
}

export type ApiResult<T> = ApiOk<T> | ApiErr

/* ─── Domain DTOs ───────────────────────────────────────────────────────── */

export interface User {
  id: string
  username: string
  email: string
  active: boolean
  created_at: string
  updated_at: string
}

export interface GameSession {
  id: string
  token: string
  created_at: string
}

export interface IngestAck {
  accepted: number
}

export interface Bonus {
  url: string
}

export interface LevelTimeComparison {
  level: number
  my_avg_duration_ms: number | null
  my_completions: number
  others_avg_duration_ms: number | null
  others_completions: number
}

/* ─── UTM (game:start) ──────────────────────────────────────────────────── */

export interface UtmParams {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
  utm_term?: string
}

/* ─── Analytics events (tagged union, discriminated by `type`) ──────────── */

export type BonusPlacement = 'level_popup' | 'special_popup' | 'final_screen'
export type ShareChannel = 'vk' | 'ok' | 'tg'

export type AnalyticsEvent =
  | { type: 'level_started'; level: number }
  | { type: 'level_completed'; level: number; moves: number; duration_ms: number }
  | { type: 'special_pair_found'; level: number }
  | { type: 'hint_used'; level: number }
  | { type: 'game_completed'; total_moves: number; total_duration_ms: number }
  | { type: 'bonus_clicked'; placement: BonusPlacement }
  | { type: 'replayed' }
  | { type: 'shared'; channel: ShareChannel }

export interface IngestEventsBody {
  game_session_token: string
  events: AnalyticsEvent[]
}
