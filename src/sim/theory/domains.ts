import { DOMAIN3_LESSONS } from './domain3'
import { DOMAIN4_LESSONS } from './domain4'
import type { Domain, Lesson, Objective } from './types'

/**
 * Indice della teoria: i 5 domini e i 28 obiettivi di CompTIA Security+ SY0-701 (V7), nell'ordine e con i pesi
 * pubblicati da CompTIA. Titoli tradotti e parafrasati; i testi delle lezioni sono originali.
 * Le lezioni si aggiungono a tappe: un obiettivo senza `lesson` compare come "in arrivo".
 */

export const OFFICIAL_OBJECTIVES_URL = 'https://www.comptia.org/en-us/certifications/security/v7/'

const LESSONS: Lesson[] = [...DOMAIN3_LESSONS, ...DOMAIN4_LESSONS]

function objectives(list: [string, string][]): Objective[] {
  return list.map(([code, title]) => ({ code, title, lesson: LESSONS.find((l) => l.objective === code) }))
}

export const DOMAINS: Domain[] = [
  {
    id: 1,
    title: 'Concetti generali di sicurezza',
    weight: 12,
    objectives: objectives([
      ['1.1', 'Tipi di controlli di sicurezza'],
      ['1.2', 'Concetti fondamentali di sicurezza'],
      ['1.3', 'Gestione dei cambiamenti'],
      ['1.4', 'Soluzioni crittografiche'],
    ]),
  },
  {
    id: 2,
    title: 'Minacce, vulnerabilità e mitigazioni',
    weight: 22,
    objectives: objectives([
      ['2.1', 'Attori delle minacce e motivazioni'],
      ['2.2', 'Vettori di minaccia e superfici di attacco'],
      ['2.3', 'Tipi di vulnerabilità'],
      ['2.4', 'Indicatori di attività malevola'],
      ['2.5', 'Tecniche di mitigazione'],
    ]),
  },
  {
    id: 3,
    title: 'Architettura di sicurezza',
    weight: 18,
    objectives: objectives([
      ['3.1', 'Modelli architetturali'],
      ['3.2', 'Infrastruttura aziendale sicura'],
      ['3.3', 'Protezione dei dati'],
      ['3.4', 'Resilienza e ripristino'],
    ]),
  },
  {
    id: 4,
    title: 'Operazioni di sicurezza',
    weight: 28,
    objectives: objectives([
      ['4.1', 'Sicurezza delle risorse di calcolo'],
      ['4.2', 'Gestione degli asset'],
      ['4.3', 'Gestione delle vulnerabilità'],
      ['4.4', 'Alerting e monitoraggio'],
      ['4.5', 'Potenziare le difese aziendali'],
      ['4.6', 'Gestione delle identità e degli accessi'],
      ['4.7', 'Automazione e orchestrazione'],
      ['4.8', 'Risposta agli incidenti'],
      ['4.9', 'Fonti di dati per le indagini'],
    ]),
  },
  {
    id: 5,
    title: 'Gestione e supervisione del programma di sicurezza',
    weight: 20,
    objectives: objectives([
      ['5.1', 'Governance della sicurezza'],
      ['5.2', 'Gestione del rischio'],
      ['5.3', 'Rischio delle terze parti'],
      ['5.4', 'Conformità normativa'],
      ['5.5', 'Audit e valutazioni'],
      ['5.6', 'Consapevolezza della sicurezza'],
    ]),
  },
]

/** Lezioni disponibili nell'ordine dell'indice (per ← → e Precedente/Successiva). */
export const AVAILABLE_LESSONS: { domain: Domain; objective: Objective; lesson: Lesson }[] = DOMAINS.flatMap(
  (domain) => domain.objectives.flatMap((objective) => (objective.lesson ? [{ domain, objective, lesson: objective.lesson }] : [])),
)
