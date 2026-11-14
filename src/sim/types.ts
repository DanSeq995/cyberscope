/**
 * Tipi di dominio della simulazione SOC.
 * I nomi dei campi seguono le convenzioni Splunk (CIM): _time, sourcetype, src_ip, dest, action…
 */

export type Severity = 'medium' | 'high' | 'critical'

/** Campi di un evento come li invia una sorgente (il campo `event` di un payload HEC). */
export interface EventFields {
  src_ip: string
  dest: string
  dest_port: number
  /** allowed | blocked (firewall), success | failure (login), query (dns). */
  action: string
  user?: string
  /** Regola del firewall che ha deciso (solo sourcetype=firewall). */
  rule?: string
}

/** Evento indicizzato in Splunk (dopo l'ingestione HEC). `_time` in secondi epoch. */
export interface LogEvent extends EventFields {
  _cd: string
  _time: number
  index: string
  host: string
  sourcetype: string
}

export type RuleId = 'EXPOSED_SERVICE'

/** Alert "notable" prodotto da una correlation search. */
export interface NotableAlert {
  sid: string
  rule: RuleId
  title: string
  severity: Severity
  src_ip: string
  dest: string
  dest_port: number
  /** Regola del firewall che ha lasciato passare il traffico. */
  fw_rule: string
  /** Secondi epoch. */
  trigger_time: number
  event_count: number
  spl: string
}
