/**
 * Punteggio dei quiz a tentativi (oggi: percorso del red team). Logica pura, riusabile per altre challenge.
 *
 * Bilanciamento: la risposta giusta al primo colpo vale tutto, al secondo il 40%, dal terzo niente.
 * Rispondendo a caso si ottiene in media il 47% su una domanda a 3 opzioni e il 35% su una a 4:
 * meno della soglia del primo grado utile (50%), quindi tirare a indovinare non paga.
 */

/** Quota dei punti in base al tentativo con cui arriva la risposta giusta (1° e 2°; dal 3° vale 0). */
const ATTEMPT_FACTORS = [1, 0.4]

/** Punti ottenuti in una domanda da `max` punti risolta al tentativo numero `attempts` (1 = al primo colpo). */
export function stepScore(max: number, attempts: number) {
  return Math.round(max * (ATTEMPT_FACTORS[attempts - 1] ?? 0))
}

export interface Rank {
  /** Quota minima del punteggio massimo (0–1). */
  min: number
  title: string
  note: string
}

/** Dal grado più alto al più basso. */
export const RANKS: Rank[] = [
  { min: 0.9, title: 'Operatore red team', note: 'Hai scelto quasi sempre la risposta giusta al primo colpo.' },
  { min: 0.7, title: 'Penetration tester', note: 'Buon metodo: rivedi le fasi in cui hai sbagliato il primo tentativo.' },
  { min: 0.5, title: 'Analista junior', note: 'Le basi ci sono: rileggi le spiegazioni delle risposte scartate.' },
  { min: 0, title: 'Da ripassare', note: 'Rileggi le spiegazioni e riprova: al PC di studio del blue team trovi la teoria.' },
]

export function rank(total: number, max: number): Rank {
  const ratio = max > 0 ? total / max : 0
  return RANKS.find((r) => ratio >= r.min) ?? RANKS[RANKS.length - 1]
}
