import { create } from 'zustand'

import { STEPS } from '@/sim/attack'
import { stepScore } from '@/sim/score'

/** Un tentativo: opzione scelta in una fase (giusta o sbagliata), nell'ordine in cui è stata provata. */
export interface Attempt {
  step: number
  option: string
}

interface RedState {
  /** Indice della fase corrente; uguale a STEPS.length a percorso concluso. */
  step: number
  /** Tentativi usati in ogni fase (compreso quello giusto). */
  attempts: number[]
  /** Opzioni sbagliate già provate nella fase corrente: restano disattivate. */
  tried: string[]
  history: Attempt[]
  /** Ordine a schermo delle opzioni di ogni fase, mescolato a ogni partita. */
  order: string[][]
  /** Miglior punteggio della sessione (sopravvive a `reset`). */
  best: number | null
  answer: (optionId: string) => void
  reset: () => void
}

function shuffle<T>(items: T[]) {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

const initial = () => ({
  step: 0,
  attempts: STEPS.map(() => 0),
  tried: [] as string[],
  history: [] as Attempt[],
  order: STEPS.map((s) => shuffle(s.options.map((o) => o.id))),
})

/** Punti ottenuti in ogni fase: quelle non ancora concluse valgono 0. */
export function stepScores(step: number, attempts: number[]) {
  return STEPS.map((s, i) => (i < step ? stepScore(s.points, attempts[i]) : 0))
}

export const totalScore = (scores: number[]) => scores.reduce((sum, n) => sum + n, 0)

export const useRedStore = create<RedState>((set, get) => ({
  ...initial(),
  best: null,

  answer: (optionId) => {
    const { step, attempts, tried, history, best } = get()
    const option = STEPS[step]?.options.find((o) => o.id === optionId)
    if (!option || tried.includes(optionId)) return
    const nextAttempts = attempts.map((n, i) => (i === step ? n + 1 : n))
    const nextHistory = [...history, { step, option: optionId }]
    if (!option.correct) {
      set({ attempts: nextAttempts, tried: [...tried, optionId], history: nextHistory })
      return
    }
    const nextStep = step + 1
    const total = totalScore(stepScores(nextStep, nextAttempts))
    set({
      step: nextStep,
      attempts: nextAttempts,
      tried: [],
      history: nextHistory,
      ...(nextStep >= STEPS.length ? { best: Math.max(best ?? 0, total) } : {}),
    })
  },

  reset: () => set(initial()),
}))
