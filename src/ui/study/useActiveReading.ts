import { useEffect, useRef, useState } from 'react'

import { IDLE_TIMEOUT_S, READING_STEP_S, readingRoom } from '@/sim/credits'
import { selectReadPage, selectReadTotal, useKnowledgeStore } from '@/state/knowledge'

export type ReadingStatus = 'reading' | 'idle' | 'capped'

/**
 * Lettura attiva nei Manuali del PC Biblioteca: il tempo conta solo se `enabled` (finestra aperta, scheda
 * Manuali attiva), la scheda del browser reale è visibile e c'è stata attività (mouse, rotella, tasti) negli
 * ultimi IDLE_TIMEOUT_S secondi. Ogni READING_STEP_S secondi assegna i crediti alla pagina `pageId`.
 */
export function useActiveReading(pageId: string, enabled: boolean) {
  const earnedPage = useKnowledgeStore(selectReadPage(pageId))
  const earnedGame = useKnowledgeStore(selectReadTotal)
  const capped = readingRoom(earnedPage, earnedGame) === 0

  /** Secondi accumulati verso il prossimo premio, legati alla pagina: cambiando pagina si riparte da zero. */
  const [tick, setTick] = useState({ page: pageId, seconds: 0 })
  const [idle, setIdle] = useState(false)
  const elapsed = useRef({ page: pageId, seconds: 0 })
  const lastActivity = useRef(0)

  // Qualsiasi interazione col PC conta come attività (in pointer lock mousemove arriva lo stesso).
  useEffect(() => {
    const mark = () => {
      lastActivity.current = Date.now()
    }
    mark()
    const events = ['mousemove', 'wheel', 'keydown', 'pointerdown'] as const
    events.forEach((e) => window.addEventListener(e, mark, { passive: true }))
    return () => events.forEach((e) => window.removeEventListener(e, mark))
  }, [])

  useEffect(() => {
    if (!enabled || capped) return
    const timer = setInterval(() => {
      const away =
        document.visibilityState !== 'visible' || Date.now() - lastActivity.current > IDLE_TIMEOUT_S * 1000
      setIdle(away)
      if (away) return
      const e = elapsed.current
      if (e.page !== pageId) elapsed.current = { page: pageId, seconds: 0 }
      elapsed.current.seconds += 1
      if (elapsed.current.seconds >= READING_STEP_S) {
        elapsed.current.seconds = 0
        useKnowledgeStore.getState().addReading(pageId)
      }
      setTick({ ...elapsed.current })
    }, 1000)
    return () => clearInterval(timer)
  }, [enabled, capped, pageId])

  const seconds = tick.page === pageId ? tick.seconds : 0
  const status: ReadingStatus = capped ? 'capped' : idle ? 'idle' : 'reading'
  return { status, progress: seconds / READING_STEP_S, earnedPage, earnedGame }
}
