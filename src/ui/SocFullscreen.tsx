import { useEffect, useState } from 'react'

import { useGameStore } from '@/state/game'

import { DASHBOARD_HEIGHT, DASHBOARD_WIDTH } from './dashboardSize'
import { SocDashboard } from './SocDashboard'

/** Margine lasciato attorno alla dashboard (frazione della finestra). */
const FILL = 0.94

function fitScale() {
  return Math.min((window.innerWidth * FILL) / DASHBOARD_WIDTH, ((window.innerHeight - 48) * FILL) / DASHBOARD_HEIGHT)
}

/** Dashboard SOC a tutto schermo: stessa UI del video wall, ingrandita per riempire la finestra. */
export function SocFullscreen() {
  const open = useGameStore((s) => s.socFullscreen)
  const [scale, setScale] = useState(fitScale)

  useEffect(() => {
    const onResize = () => setScale(fitScale())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  if (!open) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-black/80 select-none">
      <div style={{ width: DASHBOARD_WIDTH * scale, height: DASHBOARD_HEIGHT * scale }}>
        <div style={{ transform: `scale(${scale})`, transformOrigin: '0 0' }}>
          <SocDashboard />
        </div>
      </div>
      <p className="text-sm text-white/70">
        <kbd className="rounded border border-white/30 bg-white/10 px-1.5 py-0.5 font-mono text-xs">F</kbd> torna
        all’ufficio
      </p>
    </div>
  )
}
