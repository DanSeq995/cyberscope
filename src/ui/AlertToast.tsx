import { useEffect } from 'react'

import { useGameStore } from '@/state/game'
import { useSocStore } from '@/state/soc'

const TOAST_MS = 6000

/** Avviso per l'alert che apre l'incidente, mostrato solo se il giocatore non sta guardando il SOC (né a tutto schermo). */
export function AlertToast() {
  const notice = useSocStore((s) => s.notice)
  const dismiss = useSocStore((s) => s.dismissNotice)
  const watching = useGameStore((s) => s.socFullscreen || s.laptop !== 'closed' || s.desk !== 'closed' || (s.zone === 'soc' && s.view === 'fps'))

  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(dismiss, TOAST_MS)
    return () => clearTimeout(timer)
  }, [notice, dismiss])

  const blue = useGameStore((s) => s.team === 'blue')

  if (!notice || watching || !blue) return null

  return (
    <div className="pointer-events-none fixed top-4 left-1/2 z-20 -translate-x-1/2 rounded-lg border border-red-500 bg-red-950/90 px-4 py-2 text-sm text-white shadow-lg">
      <span className="mr-2 font-bold text-red-400">Nuovo alert SOC</span>
      {notice.title}: {notice.src_ip} → {notice.dest}:{notice.dest_port} — vai all’armadio di rete in sala server
      (<b>F</b> per i dettagli)
    </div>
  )
}
