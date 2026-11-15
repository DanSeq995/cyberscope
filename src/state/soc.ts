import { create } from 'zustand'

import { RULES_BY_ID, SEVERITY_RANK } from '@/sim/detection'
import { FIX_POLICY, INITIAL_POLICIES, type FirewallPolicy } from '@/sim/firewall'
import { dueEvents, GUEST_DEVICE_IP, RDP_PORT, TARGET_HOST } from '@/sim/redteam'
import { RECENT_EVENTS_SPL, type HecPayload, type HecResponse } from '@/sim/splunk/client'
import { MockSplunk } from '@/sim/splunk/mockSplunk'
import { useKnowledgeStore } from '@/state/knowledge'
import type { NotableAlert, RuleId } from '@/sim/types'

/** Unico punto da cambiare per usare uno Splunk vero (tramite un backend). */
const splunk = new MockSplunk()

/** Ogni quanti secondi la dashboard SOC interroga Splunk (come il refresh di una dashboard). */
export const POLL_INTERVAL = 1

/**
 * idle = simulazione spenta · monitoring = traffico in corso · incident = primo alert arrivato,
 * simulazione in pausa finché il giocatore non risolve · resolved = policy corretta applicata.
 */
export type SocPhase = 'idle' | 'monitoring' | 'incident' | 'resolved'

export interface ApiCall {
  method: 'GET' | 'POST'
  path: string
  body: string
}

interface SocState {
  phase: SocPhase
  /** Secondi di simulazione dall'avvio. */
  elapsed: number
  /** Epoch (s) dell'avvio: il _time degli eventi è startedAt + offset. */
  startedAt: number
  /** Ultimi 100 eventi letti via REST (righe risultato Splunk, valori stringa). */
  events: Record<string, string>[]
  alerts: NotableAlert[]
  /** Alert che ha aperto l'incidente, per il toast HUD. */
  notice: NotableAlert | null
  lastHec: ApiCall | null
  lastRest: ApiCall | null
  /** Policy attuali del firewall fw-01 (first match, dall'alto). */
  policies: FirewallPolicy[]
  toggle: () => void
  tick: (dt: number) => void
  poll: () => Promise<void>
  /** Risposta giusta: inserisce la policy di blocco in cima e verifica con un nuovo tentativo. */
  applyFix: () => void
  dismissNotice: () => void
}

/** Incrementato a ogni avvio/reset: le risposte arrivate dopo un reset vengono scartate. */
let generation = 0

const initial = {
  phase: 'idle' as SocPhase,
  elapsed: 0,
  startedAt: 0,
  events: [],
  alerts: [],
  notice: null,
  lastHec: null,
  lastRest: null,
  policies: INITIAL_POLICIES,
}

function truncate(text: string, max = 180) {
  return text.length > max ? `${text.slice(0, max)}…` : text
}

export const useSocStore = create<SocState>((set, get) => {
  /** Invia un evento via HEC e registra la chiamata per il footer della dashboard. */
  function sendHec(body: HecPayload) {
    const gen = generation
    void splunk.hecEvent(body).then((res: HecResponse) => {
      if (gen !== generation) return
      set({
        lastHec: {
          method: 'POST',
          path: '/services/collector/event',
          body: `${truncate(JSON.stringify(body.event), 110)} → ${JSON.stringify(res)}`,
        },
      })
    })
  }

  return {
    ...initial,

    // T: avvia la simulazione, o la ferma e azzera tutto se è già partita.
    toggle: () => {
      generation += 1
      splunk.reset()
      // Ogni nuova simulazione è un nuovo incidente: i suggerimenti della console firewall si ricomprano.
      useKnowledgeStore.getState().clearHints('fw:')
      if (get().phase !== 'idle') set({ ...initial })
      else set({ ...initial, phase: 'monitoring', startedAt: Date.now() / 1000 })
    },

    // Solo in monitoring: invia via HEC gli eventi previsti nell'intervallo appena trascorso.
    tick: (dt) => {
      const { phase, elapsed, startedAt } = get()
      if (phase !== 'monitoring') return
      const next = elapsed + dt
      set({ elapsed: next })
      for (const { at, payload } of dueEvents(elapsed, next)) sendHec({ ...payload, time: startedAt + at })
    },

    // Il SOC legge da Splunk via REST: ultimi eventi e alert scattati.
    poll: async () => {
      if (get().phase === 'idle') return
      const gen = generation
      const { sid } = await splunk.createSearchJob(RECENT_EVENTS_SPL)
      const results = await splunk.getResults(sid, { count: 100 })
      const fired = await splunk.firedAlerts()
      if (gen !== generation) return

      const alerts: NotableAlert[] = fired.entry.map(({ name, content }) => {
        const rule = RULES_BY_ID[content.savedsearch_name as RuleId]
        return {
          sid: content.sid,
          rule: rule.id,
          title: name,
          severity: rule.severity,
          src_ip: content.result.src_ip,
          dest: content.result.dest,
          dest_port: Number(content.result.dest_port),
          fw_rule: content.result.rule,
          trigger_time: content.trigger_time,
          event_count: Number(content.result.count),
          spl: rule.spl,
        }
      })

      // Al primo alert la simulazione si ferma: parte la fase di risoluzione.
      const opensIncident = get().phase === 'monitoring' && alerts.length > 0

      set({
        events: results.results,
        alerts,
        ...(opensIncident ? { phase: 'incident' as SocPhase, notice: alerts[0] } : {}),
        lastRest: {
          method: 'GET',
          path: '/services/alerts/fired_alerts?output_mode=json',
          body: truncate(JSON.stringify(fired)),
        },
      })
    },

    applyFix: () => {
      const { phase, policies, startedAt, elapsed } = get()
      if (phase !== 'incident') return
      set({ phase: 'resolved', notice: null, policies: [FIX_POLICY, ...policies] })
      // Verifica: lo stesso ospite riprova e ora il firewall lo blocca con R0.
      sendHec({
        time: startedAt + elapsed + 1,
        host: 'fw-01',
        sourcetype: 'firewall',
        index: 'security',
        event: { src_ip: GUEST_DEVICE_IP, dest: TARGET_HOST, dest_port: RDP_PORT, action: 'blocked', rule: FIX_POLICY.id },
      })
      void get().poll()
    },

    dismissNotice: () => set({ notice: null }),
  }
})

/** true se un host ha un alert di gravità alta o critica non ancora risolto. */
export function selectHostAlarmed(host: string) {
  return (s: SocState) =>
    s.phase !== 'resolved' &&
    s.alerts.some((a) => a.dest === host && SEVERITY_RANK[a.severity] >= SEVERITY_RANK.high)
}
