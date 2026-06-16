/* ─── Game backend hook: session, batched analytics, bonus URL ──────────── */

import { useCallback, useEffect, useRef, useState } from 'react'
import { getBonus, getLevelTimeComparison, ingestEvents, startGame } from '../api'
import type { AnalyticsEvent } from '../api'
import { getYMClientId } from './useYM'
import { getSourceFromUTM } from '../utils/utm'

const FLUSH_INTERVAL_MS = 5000

/** Актуальная промо-ссылка с плейсхолдерами sub4/sub5. */
const PROMO_URL = '#'

/**
 * Injects sub4 (UTM-matched source) and sub5 (YM clientId) into the bonus URL.
 *
 * The backend stores the URL with literal placeholders:
 *   …&sub4={source}&sub5={YM_CLIENT_ID}&…
 *
 * We replace them with the actual values. If the URL doesn't contain the
 * placeholders (old backend format), we append sub4/sub5 as extra params.
 */
async function enrichBonusUrl(rawUrl: string): Promise<string> {
  const sub4 = getSourceFromUTM()
  const sub5 = await getYMClientId()

  // Replace literal {source} / {YM_CLIENT_ID} placeholders (URL-encoded or plain)
  let url = rawUrl
    .replace(/%7Bsource%7D/gi, encodeURIComponent(sub4))
    .replace(/{source}/gi, encodeURIComponent(sub4))
    .replace(/%7BYM_CLIENT_ID%7D/gi, encodeURIComponent(sub5))
    .replace(/{YM_CLIENT_ID}/gi, encodeURIComponent(sub5))

  // If no placeholders were found, append the params directly
  if (url === rawUrl) {
    const u = new URL(url)
    if (sub4) u.searchParams.set('sub4', sub4)
    if (sub5) u.searchParams.set('sub5', sub5)
    url = u.toString()
  }

  return url
}

export function useGameBackend() {
  const tokenRef = useRef<string | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const queueRef = useRef<AnalyticsEvent[]>([])
  const flushingRef = useRef(false)
  const [bonusUrl, setBonusUrl] = useState<string>(PROMO_URL)

  // Init: create game session + load bonus url
  useEffect(() => {
    let cancelled = false

    // Enrich the hardcoded promo URL with sub4/sub5 immediately (no backend needed)
    enrichBonusUrl(PROMO_URL).then((enriched) => {
      if (!cancelled) setBonusUrl(enriched)
    })

    startGame()
      .then((session) => {
        if (!cancelled && session) {
          tokenRef.current = session.token
          setToken(session.token)
        }
      })
      .catch((e) => console.warn('[backend] game:start failed', e))

    // Backend may override with a different URL (future-proof)
    getBonus()
      .then(async (bonus) => {
        if (cancelled || !bonus?.url) return
        const enriched = await enrichBonusUrl(bonus.url)
        if (!cancelled) setBonusUrl(enriched)
      })
      .catch((e) => console.warn('[backend] bonus failed', e))

    return () => {
      cancelled = true
    }
  }, [])

  // Flush queued events to the backend.
  const flush = useCallback(async () => {
    if (flushingRef.current) return
    const token = tokenRef.current
    if (!token || queueRef.current.length === 0) return

    flushingRef.current = true
    const batch = queueRef.current
    queueRef.current = []
    try {
      await ingestEvents(token, batch)
    } catch (e) {
      // Re-queue on failure so events aren't lost.
      queueRef.current = [...batch, ...queueRef.current]
      console.warn('[backend] analytics flush failed', e)
    } finally {
      flushingRef.current = false
    }
  }, [])

  // Periodic flush + flush on unload.
  useEffect(() => {
    const id = setInterval(flush, FLUSH_INTERVAL_MS)
    const onHide = () => flush()
    window.addEventListener('beforeunload', onHide)
    document.addEventListener('visibilitychange', onHide)
    return () => {
      clearInterval(id)
      window.removeEventListener('beforeunload', onHide)
      document.removeEventListener('visibilitychange', onHide)
      flush()
    }
  }, [flush])

  /** Queue a gameplay analytics event. */
  const track = useCallback((event: AnalyticsEvent) => {
    queueRef.current.push(event)
  }, [])

  /** Fetch level time comparison from the backend. Requires token to be ready. */
  const fetchLevelTimeComparison = useCallback((level: number) => {
    const t = tokenRef.current
    if (!t) return Promise.resolve(null)
    return getLevelTimeComparison(level, t).catch(() => null)
  }, [])

  return { track, flush, bonusUrl, token, fetchLevelTimeComparison }
}
