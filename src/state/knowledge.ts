import { create } from 'zustand'

import { HINT_COST, questionReward, READING_REWARD, readingRoom } from '@/sim/credits'
import { questionById } from '@/sim/theory/quiz'
import { LEVELS, type DomainId } from '@/sim/theory/quiz/types'

/** KC da lettura guadagnati nella partita (per i cap per pagina e per partita). */
interface Reading {
  total: number
  perPage: Record<string, number>
}

interface KnowledgeState {
  /** Knowledge Credits del blue team. */
  credits: number
  /** Quesiti già riscattati (id del JSON, es. "D1_Q01"): rifarli non dà altri crediti. */
  answeredQuestions: string[]
  /** Livello massimo sbloccato per dominio (parte da 1). */
  domainProgress: Record<DomainId, number>
  reading: Reading
  /** Suggerimenti già comprati: "fw:fifty", "fw:log", "net:<id controllo>". */
  hints: string[]
  /** Ultima variazione del saldo, per l'animazione del badge. */
  lastDelta: { amount: number; at: number } | null
  /**
   * Risposta a un quesito del Training Lab. Se è corretta e nuova assegna i crediti e sblocca il livello
   * successivo. Restituisce i KC guadagnati (0 se sbagliata o già riscattata).
   */
  answer: (questionId: string, optionText: string) => number
  /** Un blocco di lettura attiva completato sulla pagina indicata. Restituisce i KC guadagnati. */
  addReading: (pageId: string) => number
  /** Compra un suggerimento: false se i crediti non bastano o se è già stato comprato. */
  buyHint: (hintId: string, cost?: number) => boolean
  /** Rende di nuovo acquistabili i suggerimenti che iniziano con il prefisso (es. nuovo incidente). */
  clearHints: (prefix: string) => void
  /** Nuova partita: crediti e progressi a zero. */
  resetAll: () => void
}

const initial = () => ({
  credits: 0,
  answeredQuestions: [] as string[],
  domainProgress: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1 } as Record<DomainId, number>,
  reading: { total: 0, perPage: {} } as Reading,
  hints: [] as string[],
  lastDelta: null as KnowledgeState['lastDelta'],
})

// Le versioni precedenti salvavano i crediti in localStorage: ora valgono una partita sola, il vecchio dato va tolto.
try {
  localStorage.removeItem('netroom.knowledge.v1')
} catch {
  /* storage non disponibile: niente da togliere */
}

/**
 * Crediti e progressi della partita in corso: in memoria, condivisi da tutte le postazioni della stanza 3D e
 * mantenuti cambiando squadra. Ogni partita riparte da zero (caricamento della pagina o "Nuova partita").
 */
export const useKnowledgeStore = create<KnowledgeState>()((set, get) => ({
  ...initial(),

  answer: (questionId, optionText) => {
    const q = questionById(questionId)
    const option = q?.options.find((o) => o.text === optionText)
    const s = get()
    // Un livello ancora bloccato non si può riscattare (la UI non lo propone, ma lo store non si fida).
    if (!q || !option?.correct || s.answeredQuestions.includes(q.id) || q.difficulty > s.domainProgress[q.domain]) {
      return 0
    }
    const reward = questionReward(q.difficulty)
    set({
      credits: s.credits + reward,
      answeredQuestions: [...s.answeredQuestions, q.id],
      domainProgress: {
        ...s.domainProgress,
        [q.domain]: Math.min(LEVELS, Math.max(s.domainProgress[q.domain], q.difficulty + 1)),
      },
      lastDelta: { amount: reward, at: Date.now() },
    })
    return reward
  },

  addReading: (pageId) => {
    const { credits, reading } = get()
    const page = reading.perPage[pageId] ?? 0
    const reward = Math.min(READING_REWARD, readingRoom(page, reading.total))
    if (reward <= 0) return 0
    set({
      credits: credits + reward,
      reading: { total: reading.total + reward, perPage: { ...reading.perPage, [pageId]: page + reward } },
      lastDelta: { amount: reward, at: Date.now() },
    })
    return reward
  },

  buyHint: (hintId, cost = HINT_COST) => {
    const s = get()
    if (s.hints.includes(hintId) || s.credits < cost) return false
    set({ credits: s.credits - cost, hints: [...s.hints, hintId], lastDelta: { amount: -cost, at: Date.now() } })
    return true
  },

  clearHints: (prefix) => set((s) => ({ hints: s.hints.filter((h) => !h.startsWith(prefix)) })),

  resetAll: () => set(initial()),
}))

/** KC da lettura guadagnati nella partita su una pagina. */
export const selectReadPage = (pageId: string) => (s: KnowledgeState) => s.reading.perPage[pageId] ?? 0

/** KC da lettura guadagnati nella partita in totale. */
export const selectReadTotal = (s: KnowledgeState) => s.reading.total
