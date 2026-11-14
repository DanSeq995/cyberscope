import { isGuestToServer } from '@/sim/detection'
import { useSocStore } from '@/state/soc'

/** Nome in chiaro delle porte di amministrazione. */
const PORT_NAMES: Record<string, string> = {
  '22': 'SSH (terminale remoto)',
  '445': 'SMB (cartelle condivise)',
  '3389': 'Desktop remoto (RDP): permette di controllare il server a distanza',
}

function time(iso: string) {
  return new Date(iso).toLocaleTimeString('it-IT')
}

/** Scheda "Splunk" del browser del portatile: l'alert che ha aperto l'incidente, spiegato campo per campo. */
export function SplunkAlertTab() {
  const alert = useSocStore((s) => s.alerts[0])
  const phase = useSocStore((s) => s.phase)
  const events = useSocStore((s) => s.events)

  if (!alert) {
    return <div className="grid h-full place-items-center bg-slate-950 text-slate-400">Nessun alert notabile.</div>
  }

  const solved = phase === 'resolved'
  const related = events.filter((e) => isGuestToServer(e))
  const fields: [string, string, string][] = [
    ['Tipo di alert', alert.title, 'Correlation search che ha trovato il traffico anomalo'],
    ['src_ip', alert.src_ip, 'Chi: un dispositivo della rete Wi-Fi ospiti (192.168.50.0/24)'],
    ['dest', alert.dest, 'Verso dove: server nella sala server'],
    ['dest_port', String(alert.dest_port), PORT_NAMES[String(alert.dest_port)] ?? 'Porta di destinazione'],
    ['rule', alert.fw_rule, 'Regola del firewall che ha lasciato passare il traffico'],
    ['count', String(alert.event_count), 'Connessioni rilevate quando è scattato l’alert'],
  ]

  return (
    <div data-scroll className="flex h-full flex-col gap-3 overflow-y-auto bg-slate-950 p-4 font-mono text-[13px] text-slate-200">
      <div className="flex items-center gap-2">
        <span className="text-sky-400">Splunk › Alert notabili ›</span>
        <span className="rounded bg-red-600 px-1.5 text-xs font-bold text-white">ALTA</span>
        <span className="font-sans text-base font-semibold text-white">{alert.title}</span>
        <span className="ml-auto text-slate-400">{new Date(alert.trigger_time * 1000).toLocaleTimeString('it-IT')}</span>
        <span
          className={`rounded px-2 py-0.5 text-xs font-bold text-white ${solved ? 'bg-emerald-600' : 'bg-red-600'}`}
        >
          {solved ? 'RISOLTO' : 'APERTO'}
        </span>
      </div>

      <table className="w-full border-collapse overflow-hidden rounded border border-slate-800 text-left">
        <thead className="bg-slate-900 text-xs text-slate-400">
          <tr>
            <th className="px-3 py-1.5">Campo</th>
            <th className="px-3 py-1.5">Valore</th>
            <th className="px-3 py-1.5 font-sans">Cosa significa</th>
          </tr>
        </thead>
        <tbody>
          {fields.map(([name, value, meaning]) => (
            <tr key={name} className="border-t border-slate-800">
              <td className="px-3 py-1.5 text-slate-400">{name}</td>
              <td className="px-3 py-1.5 text-base font-bold text-amber-300">{value}</td>
              <td className="px-3 py-1.5 font-sans text-slate-300">{meaning}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div>
        <div className="mb-1 text-xs text-slate-400">Correlation search (SPL)</div>
        <div className="rounded border border-slate-800 bg-slate-900 px-3 py-2 break-all text-sky-300">{alert.spl}</div>
      </div>

      <div className="min-h-0">
        <div className="mb-1 text-xs text-slate-400">Eventi rete ospiti → server</div>
        <table className="w-full text-left">
          <tbody>
            {related.map((e) => (
              <tr key={e._cd} className="border-t border-slate-900">
                <td className="py-1 pr-3 text-slate-500">{time(e._time)}</td>
                <td className="pr-3">{e.src_ip}</td>
                <td className="pr-3">
                  {e.dest}:{e.dest_port}
                </td>
                <td className={`pr-3 ${e.action === 'blocked' ? 'text-amber-400' : 'text-red-400'}`}>{e.action}</td>
                <td className="text-slate-400">rule={e.rule}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
