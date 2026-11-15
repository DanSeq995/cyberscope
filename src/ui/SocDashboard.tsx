import { isGuestToServer } from '@/sim/detection'
import type { Severity } from '@/sim/types'
import { useSocStore } from '@/state/soc'

import { DASHBOARD_HEIGHT, DASHBOARD_WIDTH } from './dashboardSize'

const SEVERITY_STYLE: Record<Severity, string> = {
  medium: 'bg-amber-500 text-black',
  high: 'bg-red-600 text-white',
  critical: 'bg-fuchsia-600 text-white',
}

const SEVERITY_LABEL: Record<Severity, string> = { medium: 'MEDIA', high: 'ALTA', critical: 'CRITICA' }

const ACTION_STYLE: Record<string, string> = {
  blocked: 'text-amber-400',
  failure: 'text-red-400',
}

function clock(epochSeconds: number) {
  return new Date(epochSeconds * 1000).toLocaleTimeString('it-IT')
}

/**
 * Dashboard SIEM del SOC: legge solo lo store (dati arrivati via REST da Splunk, oggi il mock in memoria).
 * Usata sia sul video wall 3D sia nella vista a tutto schermo.
 */
export function SocDashboard() {
  const phase = useSocStore((s) => s.phase)
  const running = phase !== 'idle'
  const events = useSocStore((s) => s.events)
  const alerts = useSocStore((s) => s.alerts)
  const lastHec = useSocStore((s) => s.lastHec)
  const lastRest = useSocStore((s) => s.lastRest)

  const severe = phase === 'incident' && alerts.some((a) => a.severity !== 'medium')
  const newest = events[0] ? Date.parse(events[0]._time) : 0
  const perMinute = events.filter((e) => Date.parse(e._time) > newest - 60_000).length

  return (
    <div
      style={{ width: DASHBOARD_WIDTH, height: DASHBOARD_HEIGHT }}
      className="relative flex flex-col overflow-hidden rounded-sm border-4 border-slate-700 bg-slate-950 font-mono text-[11px] leading-tight text-slate-200"
    >
      {/* Bordo rosso lampeggiante su un livello a parte: il testo resta sempre leggibile */}
      {severe && <div className="absolute inset-0 z-10 animate-pulse border-4 border-red-600" />}
      <header className="flex items-center justify-between bg-slate-900 px-3 py-1.5">
        <span className="text-sm font-bold tracking-wide text-sky-400">Splunk Enterprise Security · SIEM</span>
        <span className="text-slate-400">index=security · {perMinute} eventi/min</span>
        {phase === 'idle' ? (
          <span className="rounded bg-slate-700 px-2 py-0.5">INATTIVO</span>
        ) : phase === 'monitoring' ? (
          <span className="rounded bg-emerald-600 px-2 py-0.5 text-white">NESSUNA ANOMALIA</span>
        ) : phase === 'incident' ? (
          <span className="rounded bg-red-600 px-2 py-0.5 font-bold text-white">INCIDENTE · {alerts.length} ALERT</span>
        ) : (
          <span className="rounded bg-emerald-600 px-2 py-0.5 font-bold text-white">INCIDENTE RISOLTO</span>
        )}
      </header>

      {!running ? (
        <div className="grid flex-1 place-items-center text-center text-base text-slate-400">
          <div>
            Nessuna sorgente attiva.
            <br />
            Premi <span className="rounded border border-slate-500 px-1">T</span> per avviare la simulazione.
          </div>
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] gap-2 p-2">
          <section className="flex min-h-0 min-w-0 flex-col">
            <h2 className="mb-1 text-xs font-bold text-slate-400">ALERT NOTABILI</h2>
            {alerts.length === 0 && <p className="text-slate-500">Le correlation search non hanno trovato anomalie.</p>}
            {phase === 'incident' && (
              <p className="mb-1.5 rounded bg-amber-500/15 px-1.5 py-1 text-amber-300">
                Simulazione in pausa — risolvi dall’armadio di rete in sala server.
              </p>
            )}
            <ul className="space-y-1.5 overflow-hidden">
              {[...alerts].reverse().map((a) => (
                <li key={a.sid} className="rounded border border-slate-700 bg-slate-900 p-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className={`rounded px-1 text-[10px] font-bold ${SEVERITY_STYLE[a.severity]}`}>
                      {SEVERITY_LABEL[a.severity]}
                    </span>
                    <span className="font-bold text-white">{a.title}</span>
                    <span className="ml-auto text-slate-500">{clock(a.trigger_time)}</span>
                  </div>
                  <div className="mt-0.5">
                    {a.src_ip} → {a.dest}:{a.dest_port} · regola {a.fw_rule} · {a.event_count} eventi
                    {phase === 'resolved' && (
                      <span className="ml-1.5 rounded bg-emerald-600 px-1 text-[10px] font-bold text-white">RISOLTO</span>
                    )}
                  </div>
                  <div className="mt-0.5 line-clamp-2 break-all text-[10px] text-sky-300/80">{a.spl}</div>
                </li>
              ))}
            </ul>
          </section>

          <section className="flex min-h-0 min-w-0 flex-col">
            <h2 className="mb-1 text-xs font-bold text-slate-400">EVENTI RECENTI</h2>
            <table className="w-full table-fixed [&_td]:pr-2">
              <tbody>
                {events.slice(0, 16).map((e) => (
                  <tr key={e._cd} className={isGuestToServer(e) ? 'bg-red-950/60' : ''}>
                    <td className="w-14 text-slate-500">{new Date(e._time).toLocaleTimeString('it-IT')}</td>
                    <td className="w-24 truncate">{e.sourcetype}</td>
                    <td className="w-24">{e.src_ip}</td>
                    <td className="w-16 truncate">{e.dest}</td>
                    <td className="w-8 text-right">{e.dest_port}</td>
                    <td className={`pl-2 ${ACTION_STYLE[e.action] ?? 'text-emerald-400'}`}>{e.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      )}

      <footer className="space-y-0.5 border-t border-slate-800 bg-slate-900 px-3 py-1 text-[10px] text-slate-400">
        <div className="truncate">
          <span className="text-emerald-400">HEC</span>{' '}
          {lastHec ? `${lastHec.method} ${lastHec.path} ${lastHec.body}` : 'in attesa di eventi…'}
        </div>
        <div className="truncate">
          <span className="text-sky-400">REST</span>{' '}
          {lastRest ? `${lastRest.method} ${lastRest.path} → ${lastRest.body}` : 'in attesa di polling…'}
        </div>
      </footer>
    </div>
  )
}
