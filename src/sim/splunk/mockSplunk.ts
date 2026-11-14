import { RULES, SEVERITY_TO_SPLUNK } from '../detection'
import type { LogEvent, NotableAlert } from '../types'
import {
  RECENT_EVENTS_SPL,
  type FiredAlertsResponse,
  type HecPayload,
  type HecResponse,
  type SearchJobResponse,
  type SearchResultsResponse,
  type SplunkClient,
} from './client'

const MAX_EVENTS = 5000
const RESULT_FIELDS = ['_time', 'host', 'sourcetype', 'src_ip', 'dest', 'dest_port', 'action', 'user', 'rule']

/** Evento indicizzato → riga di risultato Splunk (valori stringa, _time ISO). */
function toResult(e: LogEvent): Record<string, string> {
  return {
    _cd: e._cd,
    _time: new Date(e._time * 1000).toISOString(),
    host: e.host,
    sourcetype: e.sourcetype,
    src_ip: e.src_ip,
    dest: e.dest,
    dest_port: String(e.dest_port),
    action: e.action,
    ...(e.user ? { user: e.user } : {}),
    ...(e.rule ? { rule: e.rule } : {}),
  }
}

/**
 * Splunk simulato in memoria.
 * Ogni evento ricevuto via HEC viene indicizzato e subito dopo girano le correlation search
 * (come un alert in tempo reale). Supporta solo le ricerche predefinite del gioco.
 */
export class MockSplunk implements SplunkClient {
  private events: LogEvent[] = []
  private alerts: NotableAlert[] = []
  private jobs = new Map<string, SearchResultsResponse>()
  private seq = 0

  /** Solo simulatore: svuota indici e alert (con uno Splunk vero non esiste). */
  reset() {
    this.events = []
    this.alerts = []
    this.jobs.clear()
    this.seq = 0
  }

  async hecEvent(payload: HecPayload): Promise<HecResponse> {
    this.seq += 1
    this.events.push({
      ...payload.event,
      _cd: `0:${this.seq}`,
      _time: payload.time,
      index: payload.index,
      host: payload.host,
      sourcetype: payload.sourcetype,
    })
    if (this.events.length > MAX_EVENTS) this.events.splice(0, this.events.length - MAX_EVENTS)
    this.runCorrelationSearches(payload.time)
    return { text: 'Success', code: 0 }
  }

  async createSearchJob(spl: string): Promise<SearchJobResponse> {
    this.seq += 1
    const sid = `${Math.floor(Date.now() / 1000)}.${this.seq}`
    this.jobs.set(sid, this.execute(spl))
    // Teniamo solo gli ultimi job, come una cache con TTL breve.
    if (this.jobs.size > 20) this.jobs.delete(this.jobs.keys().next().value!)
    return { sid }
  }

  async getResults(sid: string, options: { count?: number } = {}): Promise<SearchResultsResponse> {
    const job = this.jobs.get(sid)
    if (!job) {
      return {
        preview: false,
        init_offset: 0,
        messages: [{ type: 'ERROR', text: `Unknown sid=${sid}` }],
        fields: [],
        results: [],
      }
    }
    return options.count === undefined ? job : { ...job, results: job.results.slice(0, options.count) }
  }

  async firedAlerts(): Promise<FiredAlertsResponse> {
    return {
      entry: this.alerts.map((a) => ({
        name: a.title,
        content: {
          sid: a.sid,
          savedsearch_name: a.rule,
          severity: SEVERITY_TO_SPLUNK[a.severity],
          trigger_time: a.trigger_time,
          result: {
            src_ip: a.src_ip,
            dest: a.dest,
            dest_port: String(a.dest_port),
            rule: a.fw_rule,
            count: String(a.event_count),
          },
        },
      })),
    }
  }

  private execute(spl: string): SearchResultsResponse {
    if (spl !== RECENT_EVENTS_SPL) {
      return {
        preview: false,
        init_offset: 0,
        messages: [{ type: 'ERROR', text: 'Ricerca non supportata dal simulatore' }],
        fields: [],
        results: [],
      }
    }
    return {
      preview: false,
      init_offset: 0,
      messages: [],
      fields: RESULT_FIELDS.map((name) => ({ name })),
      results: this.events.slice(-100).reverse().map(toResult),
    }
  }

  private runCorrelationSearches(now: number) {
    for (const rule of RULES) {
      for (const d of rule.detect(this.events, this.alerts, now)) {
        // Un solo alert per regola + sorgente + bersaglio + porta (throttling).
        const duplicate = this.alerts.some(
          (a) => a.rule === d.rule && a.src_ip === d.src_ip && a.dest === d.dest && a.dest_port === d.dest_port,
        )
        if (duplicate) continue
        this.seq += 1
        this.alerts.push({
          ...d,
          sid: `scheduler__admin__${d.rule}_at_${Math.floor(now)}_${this.seq}`,
          title: rule.title,
          severity: rule.severity,
          trigger_time: now,
          spl: rule.spl,
        })
      }
    }
  }
}
