/**
 * Regole dei Knowledge Credits (KC), la valuta del blue team: si guadagnano leggendo i manuali e superando i
 * quesiti del Training Lab nel PC Biblioteca, si spendono in suggerimenti nei minigiochi.
 * Solo costanti e funzioni pure: lo stato è in `src/state/knowledge.ts`.
 */

/** Secondi di lettura attiva per un premio. */
export const READING_STEP_S = 15
/** KC per ogni blocco di lettura attiva. */
export const READING_REWARD = 10
/** Massimo di KC da lettura per singola pagina (lezione): spinge a esplorare altre pagine. */
export const READING_CAP_PAGE = 40
/** Massimo di KC da lettura per partita: oltre, i crediti si guadagnano solo con i quesiti. */
export const READING_CAP_GAME = 300
/** Senza attività (mouse, rotella, tasti) per questi secondi il timer di lettura si ferma. */
export const IDLE_TIMEOUT_S = 15

/** Costo di un suggerimento nei minigiochi. */
export const HINT_COST = 30

/** Attesa dopo una risposta sbagliata nel Training Lab. */
export const WRONG_COOLDOWN_S = 5

/** Premio per un quesito superato la prima volta: cresce con la difficoltà (1–20). */
export function questionReward(difficulty: number) {
  return 15 + difficulty * 5
}

/** KC da lettura ancora guadagnabili su una pagina, tenendo conto anche del cap della partita. */
export function readingRoom(earnedPage: number, earnedGame: number) {
  return Math.max(0, Math.min(READING_CAP_PAGE - earnedPage, READING_CAP_GAME - earnedGame))
}

/** Mescola una copia dell'array (Fisher–Yates). */
export function shuffled<T>(items: readonly T[]): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}
