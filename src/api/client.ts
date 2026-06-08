/* ─── HTTP client (Result-envelope aware) ───────────────────────────────── */

import type { ApiResult } from './types'

/**
 * Base URL of the backend, e.g. "https://api.example.com/v1".
 * Set VITE_API_URL in .env when the backend is available.
 * Empty string → "offline mode": requests are skipped (logged to console).
 */
export const API_BASE_URL: string = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

export const API_CONFIGURED = API_BASE_URL.length > 0

export class ApiError extends Error {
  code: string | number
  status: string
  constructor(code: string | number, status: string, message: string) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT'
  body?: unknown
  query?: Record<string, string | undefined>
  signal?: AbortSignal
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  // Absolute base ("https://…/v1") → use directly.
  // Relative base ("/v1", for the Vite dev proxy) → resolve against current origin.
  const raw = API_BASE_URL + path
  const url = /^https?:\/\//.test(raw) ? new URL(raw) : new URL(raw, window.location.origin)
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v != null) url.searchParams.set(k, v)
    }
  }
  return url.toString()
}

/**
 * Core request. Returns parsed `data` on success, throws `ApiError` on `Err`.
 * When the API isn't configured, resolves to `null` (no-op) so the app keeps
 * working without a backend.
 */
export async function apiRequest<T>(
  path: string,
  opts: RequestOptions = {}
): Promise<T | null> {
  if (!API_CONFIGURED) {
    // eslint-disable-next-line no-console
    console.info(`[api:offline] ${opts.method ?? 'GET'} ${path}`, opts.body ?? '')
    return null
  }

  const res = await fetch(buildUrl(path, opts.query), {
    method: opts.method ?? 'GET',
    headers: opts.body ? { 'Content-Type': 'application/json' } : undefined,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    credentials: 'include', // session cookie for admin routes
    signal: opts.signal,
  })

  // /health returns a raw dict; everything else is the Result envelope.
  const json = (await res.json()) as ApiResult<T> | T

  if (json && typeof json === 'object' && 'type' in json) {
    const env = json as ApiResult<T>
    if (env.type === 'ok') return env.data
    throw new ApiError(env.error.code, env.error.status, env.error.message)
  }

  // Non-enveloped response (e.g. /health)
  if (!res.ok) {
    throw new ApiError(res.status, 'HTTP_ERROR', res.statusText)
  }
  return json as T
}
