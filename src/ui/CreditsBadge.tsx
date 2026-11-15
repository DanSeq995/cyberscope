import { useEffect, useState } from 'react'

import { useGameStore } from '@/state/game'
import { useKnowledgeStore } from '@/state/knowledge'

/** Durata del "+10" / "−30" che sale dal badge. */
const DELTA_MS = 1400

/**
 * Saldo dei Knowledge Credits, sempre visibile per il blue team (anche sopra i PC a tutto schermo, così il
 * premio si vede mentre si legge o si risponde). Ogni variazione fa salire un "+n"/"−n" e accende il bordo.
 */
export function CreditsBadge() {
  const team = useGameStore((s) => s.team)
  const credits = useKnowledgeStore((s) => s.credits)
  const [shown, setShown] = useState<{ amount: number; at: number } | null>(null)

  // Ogni nuova variazione del saldo mostra il "+n"/"−n" per DELTA_MS (iscrizione diretta allo store).
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    const unsubscribe = useKnowledgeStore.subscribe((s, prev) => {
      if (!s.lastDelta || s.lastDelta === prev.lastDelta) return
      setShown(s.lastDelta)
      clearTimeout(timer)
      timer = setTimeout(() => setShown(null), DELTA_MS)
    })
    return () => {
      unsubscribe()
      clearTimeout(timer)
    }
  }, [])

  if (team !== 'blue') return null

  const gain = shown ? shown.amount > 0 : false
  return (
    <div
      title="Knowledge Credits: si guadagnano al PC Biblioteca (manuali e Training Lab), si spendono in suggerimenti"
      className={`pointer-events-none fixed right-4 bottom-4 z-50 rounded-lg border bg-black/70 px-3 py-1.5 font-mono text-sm text-white tabular-nums shadow-lg transition-colors duration-300 ${
        shown ? (gain ? 'border-emerald-400 shadow-emerald-500/30' : 'border-red-400 shadow-red-500/30') : 'border-amber-400/60'
      }`}
    >
      <span className="mr-1.5 font-sans font-semibold text-amber-300">KC</span>
      {credits.toLocaleString('it-IT')}
      {shown && (
        <span
          key={shown.at}
          className={`absolute -top-6 right-2 font-bold animate-out fade-out slide-out-to-top-4 fill-mode-forwards duration-[1400ms] ${
            gain ? 'text-emerald-300' : 'text-red-300'
          }`}
        >
          {gain ? '+' : '−'}
          {Math.abs(shown.amount)}
        </span>
      )}
    </div>
  )
}
