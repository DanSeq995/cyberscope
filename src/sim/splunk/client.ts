/**
 * Interfaccia del client Splunk usata dal gioco.
 * Ricalca (in forma semplificata) l'API reale:
 * - HEC:  POST /services/collector/event            → hecEvent
 * - REST: POST /services/search/jobs                → createSearchJob
 *         GET  /services/search/jobs/{sid}/results  → getResults
 *         GET  /services/alerts/fired_alerts        → firedAlerts
 *
 * Oggi l'unica implementazione è il mock in memoria (`mockSplunk.ts`). Con uno Splunk vero
 * basterà un'implementazione che chiama un backend (mai Splunk direttamente dal browser:
 * i token resterebbero esposti e CORS/certificati lo impediscono).
 */

/** Corpo di POST /services/collector/event. `time` in secondi epoch. */
export interface HecPayload {
  time: number
  host: string
  sourcetype: string
  index: string
  event: {
    src_ip: string
    dest: string
    dest_port: number
    action: string
    user?: string
    rule?: string
  }
}

export interface HecResponse {
  text: string
  code: number
}

export interface SearchJobResponse {
  sid: string
}

export interface SearchMessage {
  type: 'INFO' | 'WARN' | 'ERROR'
  text: string
}

/** Risposta di GET /services/search/jobs/{sid}/results?output_mode=json (valori sempre stringhe). */
export interface SearchResultsResponse {
  preview: boolean
  init_offset: number
  messages: SearchMessage[]
  fields: { name: string }[]
  results: Record<string, string>[]
}

/** Risposta (semplificata) di GET /services/alerts/fired_alerts?output_mode=json. */
export interface FiredAlertsResponse {
  entry: {
    name: string
    content: {
      sid: string
      savedsearch_name: string
      /** Scala Splunk: 3 = warn, 4 = error, 5 = severe. */
      severity: number
      trigger_time: number
      result: { src_ip: string; dest: string; dest_port: string; rule: string; count: string }
    }
  }[]
}

export interface SplunkClient {
  hecEvent(payload: HecPayload): Promise<HecResponse>
  createSearchJob(spl: string): Promise<SearchJobResponse>
  getResults(sid: string, options?: { count?: number }): Promise<SearchResultsResponse>
  firedAlerts(): Promise<FiredAlertsResponse>
}

/** Ricerca usata dalla dashboard per gli ultimi eventi. */
export const RECENT_EVENTS_SPL = 'search index=security | head 100'
