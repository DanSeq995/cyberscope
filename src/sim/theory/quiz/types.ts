/** Id dei 5 domini Security+ SY0-701 (come `Domain.id` in `../domains.ts`). */
export type DomainId = 1 | 2 | 3 | 4 | 5

export const DOMAIN_IDS: DomainId[] = [1, 2, 3, 4, 5]

/** Livelli per dominio: un quesito per livello, in ordine di difficoltà. */
export const LEVELS = 20

export interface QuizOption {
  text: string
  correct: boolean
  /** Perché questa opzione è giusta o sbagliata: si mostra appena viene scelta. */
  explanation: string
}

export interface QuizQuestion {
  /** Es. "D1_Q01". */
  id: string
  domain: DomainId
  /** 1 (facile) … 20 (difficile): è anche il livello nel Training Lab. */
  difficulty: number
  question: string
  options: QuizOption[]
}
