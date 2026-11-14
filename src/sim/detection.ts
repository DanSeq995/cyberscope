import type { LogEvent, NotableAlert, RuleId, Severity } from './types'

/** Alert prodotto da una regola, prima che Splunk gli assegni sid e orario. */
export type Detection = Pick<NotableAlert, 'rule' | 'src_ip' | 'dest' | 'dest_port' | 'fw_rule' | 'event_count'>

export interface Rule {
  id: RuleId
  title: string
  severity: Severity
  /** Query SPL equivalente, mostrata al giocatore a scopo didattico. */
  spl: string
  /** `now` = _time dell'evento più recente; `alerts` = alert già scattati. */
  detect(events: LogEvent[], alerts: NotableAlert[], now: number): Detection[]
}

/** Rete Wi-Fi ospiti: non deve mai raggiungere i servizi di amministrazione dei server. */
export const GUEST_NET_PREFIX = '192.168.50.'
/** Porte di amministrazione: SSH, SMB, Desktop remoto (RDP). */
const ADMIN_PORTS = new Set([22, 445, 3389])

/** Traffico dalla rete ospiti verso un server: quello che la regola EXPOSED_SERVICE cerca. */
export function isGuestToServer(e: { src_ip?: string; dest?: string }) {
  return (e.src_ip ?? '').startsWith(GUEST_NET_PREFIX) && (e.dest ?? '').startsWith('srv-')
}

function within(events: LogEvent[], now: number, seconds: number) {
  return events.filter((e) => e._time > now - seconds && e._time <= now)
}

export const RULES: Rule[] = [
  {
    id: 'EXPOSED_SERVICE',
    title: 'Servizio interno esposto alla rete ospiti',
    severity: 'high',
    spl: 'index=security sourcetype=firewall action=allowed src_ip=192.168.50.0/24 dest=srv-* dest_port IN (22,445,3389) | stats count BY src_ip, dest, dest_port, rule',
    detect(events, _alerts, now) {
      const hits = within(events, now, 60).filter(
        (e) =>
          e.sourcetype === 'firewall' &&
          e.action === 'allowed' &&
          e.src_ip.startsWith(GUEST_NET_PREFIX) &&
          e.dest.startsWith('srv-') &&
          ADMIN_PORTS.has(e.dest_port),
      )
      const groups = new Map<string, LogEvent[]>()
      for (const e of hits) {
        const key = `${e.src_ip}|${e.dest}|${e.dest_port}`
        groups.set(key, [...(groups.get(key) ?? []), e])
      }
      return [...groups.values()].map((group) => ({
        rule: 'EXPOSED_SERVICE' as const,
        src_ip: group[0].src_ip,
        dest: group[0].dest,
        dest_port: group[0].dest_port,
        fw_rule: group[0].rule ?? '?',
        event_count: group.length,
      }))
    },
  },
]

export const RULES_BY_ID = Object.fromEntries(RULES.map((r) => [r.id, r])) as Record<RuleId, Rule>

export const SEVERITY_RANK: Record<Severity, number> = { medium: 1, high: 2, critical: 3 }

/** Gravità nella scala numerica degli alert Splunk. */
export const SEVERITY_TO_SPLUNK: Record<Severity, number> = { medium: 3, high: 4, critical: 5 }
