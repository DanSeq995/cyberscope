import { NET_HINTS, SPEC } from '@/sim/network/scenario'
import { useKnowledgeStore } from '@/state/knowledge'
import { useWorkStore } from '@/state/work'

import { HintButton } from '../HintButton'

const MARK = {
  ok: { symbol: '✓', color: 'text-emerald-600' },
  fail: { symbol: '✕', color: 'text-red-600' },
  skip: { symbol: '–', color: 'text-slate-400' },
} as const

/** Colonna destra del simulatore: promemoria della richiesta, pulsante Verifica ed esito dei controlli. */
export function CheckPanel() {
  const phase = useWorkStore((s) => s.phase)
  const checks = useWorkStore((s) => s.checks)
  const verify = useWorkStore((s) => s.verify)
  const approved = phase === 'install' || phase === 'done'
  const hints = useKnowledgeStore((s) => s.hints)
  /** L'Analisi Assistita riguarda il primo controllo non superato dell'ultima verifica. */
  const failed = checks?.find((c) => c.status === 'fail')
  const bought = Object.keys(NET_HINTS).filter((id) => hints.includes(`net:${id}`))

  return (
    <aside className="flex w-80 shrink-0 flex-col border-l border-slate-300 bg-slate-50 text-sm">
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        <section>
          <h3 className="mb-1.5 text-xs font-bold tracking-wide text-slate-500 uppercase">Richiesta (dalla mail)</h3>
          <ul className="space-y-1 text-slate-700">
            <li>
              Percorso: <b>{SPEC.coreSwitch} → firewall → router → server</b>
            </li>
            <li>
              Router: lato azienda <b>{SPEC.uplinkIp}</b>, lato stanza <b>{SPEC.lanIp}</b>
            </li>
            <li>
              Server: <b>{SPEC.serverIp}</b>, gateway <b>{SPEC.lanIp}</b>
            </li>
            <li>
              Maschera ovunque: <b>{SPEC.mask}</b>
            </li>
            <li>
              Firewall: solo <b>tcp/{SPEC.service.port}</b> da <b>{SPEC.officeNet}</b> al server
            </li>
          </ul>
        </section>

        <section>
          <h3 className="mb-1.5 text-xs font-bold tracking-wide text-slate-500 uppercase">Verifica</h3>
          {approved ? (
            <p className="rounded-md border border-emerald-300 bg-emerald-50 p-2.5 text-emerald-800">
              <b>Progetto approvato.</b>{' '}
              {phase === 'install'
                ? 'Ora vai nella stanza del nuovo team (porta a est dell’open space) e monta gli apparati nel rack.'
                : 'Gli apparati sono installati e in produzione.'}
            </p>
          ) : checks === null ? (
            <p className="text-slate-500">
              Aggiungi i dispositivi, collegali e configurali, poi premi Verifica: i controlli si fermano al primo
              errore e ti dicono cosa non va.
            </p>
          ) : null}
          {checks && (
            <ol className="mt-2 space-y-1.5">
              {checks.map((c) => (
                <li key={c.id} className="flex gap-2">
                  <span className={`w-4 shrink-0 text-center font-bold ${MARK[c.status].color}`}>{MARK[c.status].symbol}</span>
                  <div className="min-w-0">
                    <div className={c.status === 'skip' ? 'text-slate-400' : 'text-slate-800'}>{c.label}</div>
                    {c.detail && (
                      <div className={`text-xs ${c.status === 'fail' ? 'font-medium text-red-700' : 'text-slate-500'}`}>
                        {c.detail}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>

        {!approved && (
          <section>
            <h3 className="mb-1.5 text-xs font-bold tracking-wide text-slate-500 uppercase">Analisi assistita</h3>
            {failed ? (
              <div className="space-y-1">
                <p className="text-xs text-slate-500">
                  Suggerimento su: <b className="text-slate-700">{failed.label}</b>
                </p>
                <HintButton id={`net:${failed.id}`} label="Richiedi Hint" />
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                Premi Verifica: l’analisi assistita dà un suggerimento sul primo controllo non superato.
              </p>
            )}
            {bought.length > 0 && (
              <ul className="mt-2 space-y-1.5">
                {bought.map((id) => (
                  <li key={id} className="rounded border-l-4 border-amber-500 bg-amber-50 px-2.5 py-1.5 text-xs text-amber-950">
                    {NET_HINTS[id]}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>

      {!approved && (
        <div className="border-t border-slate-300 p-3">
          <button
            type="button"
            onClick={verify}
            className="w-full cursor-pointer rounded-md bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700"
          >
            ▶ Verifica
          </button>
        </div>
      )}
    </aside>
  )
}
