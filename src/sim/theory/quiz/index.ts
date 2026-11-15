/**
 * Quesiti del Training Lab (PC Biblioteca): 5 domini × 20 livelli, letti da `questions.json`.
 *
 * Il JSON viene importato staticamente (entra nel bundle) e normalizzato nello schema interno di `types.ts`.
 * L'adattatore accetta sia i nomi dei campi in inglese sia in italiano, così il file può arrivare in forme diverse:
 * - radice: `{ domains | domini: [...] }` oppure direttamente l'array dei domini;
 * - dominio: `{ id | id_dominio | dominio, questions | quesiti: [...] }` ("1.0" vale 1; senza id vale la posizione 1–5);
 * - quesito: `{ id, difficulty | difficolta | difficoltà | livello, question | domanda, options | answers | risposte }`;
 * - risposta: `{ text | testo | risposta, correct | corretta | isCorrect, explanation | spiegazione }`.
 * Senza id il quesito diventa `D<dominio>_Q<difficoltà a 2 cifre>`.
 */
import raw from './questions.json'
import { DOMAIN_IDS, type DomainId, type QuizOption, type QuizQuestion } from './types'

type Obj = Record<string, unknown>

const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v)

/** Primo campo presente tra gli alias. */
function pick(o: Obj, ...keys: string[]): unknown {
  for (const k of keys) if (o[k] !== undefined) return o[k]
  return undefined
}

const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : [])
const str = (v: unknown) => (typeof v === 'string' ? v.trim() : typeof v === 'number' ? String(v) : '')
const bool = (v: unknown) => v === true || v === 'true' || v === 1 || v === 'si' || v === 'sì'

function toOption(v: unknown): QuizOption {
  const o = isObj(v) ? v : {}
  return {
    text: str(pick(o, 'text', 'testo', 'risposta', 'answer', 'label')),
    correct: bool(pick(o, 'correct', 'corretta', 'isCorrect', 'giusta')),
    explanation: str(pick(o, 'explanation', 'spiegazione', 'feedback')),
  }
}

function toQuestion(v: unknown, domain: DomainId, position: number): QuizQuestion {
  const o = isObj(v) ? v : {}
  const difficulty = Number(pick(o, 'difficulty', 'difficolta', 'difficoltà', 'livello', 'level') ?? position + 1)
  const id = str(o.id) || `D${domain}_Q${String(difficulty).padStart(2, '0')}`
  return {
    id,
    domain,
    difficulty,
    question: str(pick(o, 'question', 'domanda', 'testo', 'text')),
    options: list(pick(o, 'options', 'answers', 'risposte', 'opzioni')).map(toOption),
  }
}

function load(data: unknown): Record<DomainId, QuizQuestion[]> {
  const domains = Array.isArray(data) ? data : isObj(data) ? list(pick(data, 'domains', 'domini')) : []
  const out = { 1: [], 2: [], 3: [], 4: [], 5: [] } as Record<DomainId, QuizQuestion[]>
  domains.forEach((d, i) => {
    const o = isObj(d) ? d : {}
    const id = Math.trunc(Number(pick(o, 'id', 'id_dominio', 'dominio', 'domain') ?? i + 1)) as DomainId
    if (!DOMAIN_IDS.includes(id)) return
    out[id] = list(pick(o, 'questions', 'quesiti', 'domande'))
      .map((q, n) => toQuestion(q, id, n))
      .sort((a, b) => a.difficulty - b.difficulty)
  })
  return out
}

/** Problemi del file (in dev compaiono in console): non bloccano il gioco, ma vanno corretti nel JSON. */
export function validate(byDomain: Record<DomainId, QuizQuestion[]>): string[] {
  const errors: string[] = []
  const ids = new Set<string>()
  for (const d of DOMAIN_IDS) {
    const qs = byDomain[d]
    if (qs.length === 0) errors.push(`Dominio ${d}: nessun quesito`)
    qs.forEach((q, i) => {
      if (ids.has(q.id)) errors.push(`${q.id}: id duplicato`)
      ids.add(q.id)
      if (q.difficulty !== i + 1) errors.push(`${q.id}: difficoltà ${q.difficulty}, attesa ${i + 1} (livelli senza buchi da 1)`)
      if (!q.question) errors.push(`${q.id}: testo della domanda mancante`)
      if (q.options.length !== 3) errors.push(`${q.id}: ${q.options.length} risposte invece di 3`)
      if (q.options.filter((o) => o.correct).length !== 1) errors.push(`${q.id}: serve esattamente una risposta corretta`)
      if (q.options.some((o) => !o.text || !o.explanation)) errors.push(`${q.id}: risposta senza testo o senza spiegazione`)
    })
  }
  return errors
}

export const QUESTIONS_BY_DOMAIN = load(raw)

/** true finché nel file ci sono solo i quesiti segnaposto. */
export const QUIZ_PLACEHOLDER = isObj(raw) && (raw as Obj).placeholder === true

const QUESTIONS_BY_ID = new Map(DOMAIN_IDS.flatMap((d) => QUESTIONS_BY_DOMAIN[d]).map((q) => [q.id, q]))

export const questionById = (id: string) => QUESTIONS_BY_ID.get(id)

if (import.meta.env.DEV) {
  const errors = validate(QUESTIONS_BY_DOMAIN)
  if (errors.length) console.error(`[quiz] questions.json non valido:\n- ${errors.join('\n- ')}`)
}
