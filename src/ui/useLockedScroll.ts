import { useEffect, useLayoutEffect, useRef } from 'react'

/**
 * Scorrimento dei pannelli HTML a tutto schermo. Col mouse in pointer lock la rotella non arriva ai pannelli
 * (il puntatore è catturato dal canvas): la ascoltiamo sulla finestra e scorriamo a mano l'elemento restituito
 * da `getScroller`. ↑/↓ e PagSu/PagGiù funzionano sempre.
 */
export function useLockedScroll(getScroller: () => HTMLElement | null | undefined) {
  const latest = useRef(getScroller)
  useLayoutEffect(() => {
    latest.current = getScroller
  })

  useEffect(() => {
    // Solo col mouse catturato: a cursore libero la rotella scorre già da sola l'elemento sotto il cursore.
    const onWheel = (e: WheelEvent) => {
      if (document.pointerLockElement) latest.current()?.scrollBy({ top: e.deltaY })
    }
    const onKey = (e: KeyboardEvent) => {
      const el = latest.current()
      if (!el) return
      const page = el.clientHeight * 0.8
      const step = ({ ArrowDown: 60, ArrowUp: -60, PageDown: page, PageUp: -page } as Record<string, number>)[e.code]
      if (step) el.scrollBy({ top: step, behavior: 'smooth' })
    }
    window.addEventListener('wheel', onWheel)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('keydown', onKey)
    }
  }, [])
}
