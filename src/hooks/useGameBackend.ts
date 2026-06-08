/* ─── Game backend hook: session, batched analytics, bonus URL ──────────── */

import { useCallback, useEffect, useRef, useState } from 'react'
import { getBonus, ingestEvents, startGame } from '../api'
import type { AnalyticsEvent } from '../api'

const FLUSH_INTERVAL_MS = 5000
const DEFAULT_BONUS_URL = 'https://winline.ru'

export function useGameBackend() {
  const tokenRef = useRef<string | null>(null)
  const queueRef = useRef<AnalyticsEvent[]>([])
  const flushingRef = useRef(false)
  const [bonusUrl, setBonusUrl] = useState<string>(DEFAULT_BONUS_URL)

  // Init: create game session + load bonus url
  useEffect(() => {
    let cancelled = false

    startGame()
      .then((session) => {
        if (!cancelled && session) tokenRef.current = session.token
      })
      .catch((e) => console.warn('[backend] game:start failed', e))

    getBonus()
      .then((bonus) => {
        if (!cancelled && bonus?.url) setBonusUrl(bonus.url)
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

  return { track, flush, bonusUrl }
}
