import { HINT_COST } from '@/sim/credits'
import { useKnowledgeStore } from '@/state/knowledge'

export const NO_CREDITS = 'Crediti insufficienti. Consulta i manuali o completa i test sul PC Biblioteca'

/**
 * Pulsante "Richiedi Hint / Analisi Assistita" dei minigiochi: spende Knowledge Credits una sola volta per `id`.
 * Senza crediti sufficienti è disattivato e spiega dove guadagnarli.
 */
export function HintButton({
  id,
  label = 'Richiedi Hint / Analisi Assistita',
  cost = HINT_COST,
  disabled = false,
  onBuy,
}: {
  id: string
  label?: string
  cost?: number
  /** Disattivato per motivi del minigioco (es. nessuna risposta da eliminare). */
  disabled?: boolean
  /** Chiamato subito dopo un acquisto riuscito. */
  onBuy?: () => void
}) {
  const credits = useKnowledgeStore((s) => s.credits)
  const used = useKnowledgeStore((s) => s.hints.includes(id))
  const buyHint = useKnowledgeStore((s) => s.buyHint)
  const poor = !used && credits < cost

  if (used) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-100 px-3 py-1.5 text-sm text-slate-500">
        ✓ {label} · usato
      </span>
    )
  }

  return (
    // Il tooltip sta sul contenitore: un pulsante disattivato non riceve l'hover in tutti i browser.
    <span title={poor ? NO_CREDITS : undefined} className="inline-flex flex-col items-start gap-0.5">
      <button
        type="button"
        disabled={poor || disabled}
        onClick={() => {
          if (buyHint(id, cost)) onBuy?.()
        }}
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-amber-400 bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-900 hover:bg-amber-100 disabled:pointer-events-none disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
      >
        💡 {label} <span className="font-mono">(−{cost} KC)</span>
      </button>
      {poor && <span className="text-[11px] text-slate-500">{NO_CREDITS}</span>}
    </span>
  )
}
