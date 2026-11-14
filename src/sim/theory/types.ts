/** Tipi dei contenuti del PC di studio (teoria per domini Security+). */

export interface Source {
  title: string
  publisher: string
  url: string
  /** Lingua del documento collegato. */
  lang: 'IT' | 'EN'
}

/** Nei testi, `[n]` rimanda alla fonte n (da 1) della lezione. */
export type LessonBlock =
  | { type: 'p'; text: string }
  | { type: 'list'; items: string[]; ordered?: boolean }
  | { type: 'table'; head: string[]; rows: string[][] }
  | { type: 'example'; title: string; lines: string[] }
  | { type: 'scenario'; text: string }

export interface LessonSection {
  title: string
  blocks: LessonBlock[]
}

export interface Lesson {
  /** Codice dell'obiettivo d'esame, es. '4.4'. */
  objective: string
  title: string
  summary: string
  /** true se aiuta a risolvere l'incidente attuale (badge nell'indice). */
  scenario?: true
  essentials: LessonBlock[]
  deep: LessonSection[]
  sources: Source[]
}

export interface Objective {
  code: string
  title: string
  lesson?: Lesson
}

export interface Domain {
  id: number
  title: string
  /** Peso del dominio nell'esame (%). */
  weight: number
  objectives: Objective[]
}
