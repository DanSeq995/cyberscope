import { useEffect, useRef, useState } from 'react'

import { questionReward, shuffled, WRONG_COOLDOWN_S } from '@/sim/credits'
import { DOMAINS } from '@/sim/theory/domains'
import { QUESTIONS_BY_DOMAIN, QUIZ_PLACEHOLDER } from '@/sim/theory/quiz'
import { DOMAIN_IDS, type DomainId, type QuizOption, type QuizQuestion } from '@/sim/theory/quiz/types'
import { useKnowledgeStore } from '@/state/knowledge'

import { isTyping } from '../computer'
import { useLockedScroll } from '../useLockedScroll'

import { Key } from './Manuals'

const DIGITS = ['Digit1', 'Digit2', 'Digit3', 'Numpad1', 'Numpad2', 'Numpad3']

const domainTitle = (id: DomainId) => DOMAINS.find((d) => d.id === id)?.title ?? `Dominio ${id}`

/** Livello da proporre: il primo sbloccato e non ancora superato (o l'ultimo se il dominio è finito). */
function nextLevel(domain: DomainId, progress: number) {
  return Math.min(progress, Math.max(QUESTIONS_BY_DOMAIN[domain].length, 1))
}

/**
 * Scheda Training Lab del PC Biblioteca: quesiti Security+ per dominio, in ordine di difficoltà.
 * Un livello si sblocca rispondendo bene al precedente; la prima risposta giusta a ogni quesito dà Knowledge Credits.
 */
export function TrainingLab({ active }: { active: boolean }) {
  const progress = useKnowledgeStore((s) => s.domainProgress)
  const answered = useKnowledgeStore((s) => s.answeredQuestions)
  const [domain, setDomain] = useState<DomainId>(1)
  const [level, setLevel] = useState(() => nextLevel(1, useKnowledgeStore.getState().domainProgress[1]))
  const content = useRef<HTMLDivElement>(null)

  useLockedScroll(() => (active ? content.current : null))

  const questions = QUESTIONS_BY_DOMAIN[domain]
  const question = questions[level - 1]

  const pickDomain = (d: DomainId) => {
    setDomain(d)
    setLevel(nextLevel(d, progress[d]))
  }

  return (
    <>
      <div className="flex min-h-0 flex-1">
        <nav className="flex w-72 shrink-0 flex-col overflow-y-auto border-r border-slate-200 bg-slate-100 p-3">
          <h3 className="mb-2 px-1 text-xs font-bold tracking-wide text-slate-500 uppercase">Domini</h3>
          <ul className="space-y-1">
            {DOMAIN_IDS.map((d) => {
              const total = QUESTIONS_BY_DOMAIN[d].length
              const done = QUESTIONS_BY_DOMAIN[d].filter((q) => answered.includes(q.id)).length
              const current = d === domain
              return (
                <li key={d}>
                  <button
                    type="button"
                    onClick={() => pickDomain(d)}
                    className={`w-full cursor-pointer rounded-md px-2.5 py-2 text-left text-sm ${
                      current ? 'bg-sky-600 text-white shadow' : 'text-slate-700 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-medium">
                        <span className={`mr-1.5 font-mono text-xs ${current ? 'text-sky-100' : 'text-slate-500'}`}>{d}</span>
                        {domainTitle(d)}
                      </span>
                      <span className={`shrink-0 font-mono text-xs ${current ? 'text-sky-100' : 'text-slate-500'}`}>
                        {done}/{total}
                      </span>
                    </div>
                    <div className={`mt-1.5 h-1 overflow-hidden rounded-full ${current ? 'bg-white/30' : 'bg-slate-200'}`}>
                      <div
                        className={`h-full rounded-full ${current ? 'bg-white' : 'bg-emerald-500'}`}
                        style={{ width: `${total ? (done / total) * 100 : 0}%` }}
                      />
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
          <p className="mt-auto pt-3 text-[11px] leading-snug text-slate-500">
            Ogni quesito superato la prima volta vale <b>15 + 5 × livello</b> KC. I crediti si spendono in suggerimenti
            alla console del firewall e nel simulatore di rete.
          </p>
        </nav>

        <div ref={content} className="min-w-0 flex-1 overflow-y-auto px-8 py-5">
          <div className="mb-1 text-xs font-semibold text-sky-700">Training Lab · Dominio {domain}</div>
          <h1 className="mb-3 text-2xl font-bold text-slate-900">{domainTitle(domain)}</h1>

          {QUIZ_PLACEHOLDER && (
            <p className="mb-3 max-w-3xl rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Quesiti di prova: il banco definitivo (20 livelli per dominio) arriverà con il file dei quesiti.
            </p>
          )}

          <div className="mb-5 flex max-w-3xl flex-wrap gap-1.5">
            {questions.map((q) => {
              const locked = q.difficulty > progress[domain]
              const done = answered.includes(q.id)
              const current = q.difficulty === level
              return (
                <button
                  key={q.id}
                  type="button"
                  disabled={locked}
                  title={locked ? 'Rispondi bene al livello precedente per sbloccarlo' : `Livello ${q.difficulty}`}
                  onClick={() => setLevel(q.difficulty)}
                  className={`size-9 cursor-pointer rounded-md border font-mono text-sm font-semibold disabled:cursor-not-allowed ${
                    current
                      ? 'border-sky-600 bg-sky-600 text-white'
                      : done
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                        : locked
                          ? 'border-slate-200 bg-slate-100 text-slate-300'
                          : 'border-slate-300 bg-white text-slate-700 hover:border-sky-400'
                  }`}
                >
                  {locked ? '🔒' : done && !current ? '✓' : q.difficulty}
                </button>
              )
            })}
          </div>

          {question ? (
            <QuestionCard
              // Rimontata a ogni quesito: scelta, attesa e ordine delle risposte ripartono da capo.
              key={question.id}
              question={question}
              active={active}
              last={level >= questions.length}
              onNext={() => setLevel((l) => Math.min(l + 1, questions.length))}
            />
          ) : (
            <p className="text-slate-500">Nessun quesito disponibile per questo dominio.</p>
          )}
        </div>
      </div>

      <footer className="flex items-center gap-3 border-t border-slate-200 bg-white px-5 py-2 text-xs text-slate-500">
        <span>
          clic su una risposta o <Key>1</Key> <Key>2</Key> <Key>3</Key> · dopo un errore {WRONG_COOLDOWN_S} s di attesa e
          risposte rimescolate
        </span>
        <span className="ml-auto">
          <Key>E</Key> o <b>✕ Chiudi</b> per tornare all’ufficio
        </span>
      </footer>
    </>
  )
}

function QuestionCard({
  question,
  active,
  last,
  onNext,
}: {
  question: QuizQuestion
  active: boolean
  last: boolean
  onNext: () => void
}) {
  const answered = useKnowledgeStore((s) => s.answeredQuestions.includes(question.id))
  const answer = useKnowledgeStore((s) => s.answer)
  const [order, setOrder] = useState<QuizOption[]>(() => shuffled(question.options))
  const [picked, setPicked] = useState<QuizOption | null>(null)
  const [earned, setEarned] = useState<number | null>(null)
  const [cooldown, setCooldown] = useState(0)
  /** Già riscattato prima di aprire il quesito: rifarlo è solo ripasso. */
  const [review] = useState(answered)

  const solved = picked?.correct === true

  // Conto alla rovescia dopo un errore; allo zero le risposte si rimescolano.
  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => {
      if (cooldown === 1) setOrder(shuffled(question.options))
      setCooldown(cooldown - 1)
    }, 1000)
    return () => clearTimeout(timer)
  }, [cooldown, question.options])

  const choose = (option: QuizOption) => {
    if (solved || cooldown > 0) return
    setPicked(option)
    if (option.correct) setEarned(answer(question.id, option.text))
    else setCooldown(WRONG_COOLDOWN_S)
  }
  const chooseRef = useRef(choose)
  useEffect(() => {
    chooseRef.current = choose
  })

  useEffect(() => {
    if (!active) return
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || isTyping(e)) return
      const i = DIGITS.indexOf(e.code)
      if (i >= 0) chooseRef.current(order[i % 3])
      else if (e.code === 'Enter' && solved && !last) onNext()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active, order, solved, last, onNext])

  const locked = solved || cooldown > 0

  return (
    <div className="max-w-3xl rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
      <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-slate-500">
        Livello {question.difficulty}
        {review ? (
          <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-emerald-800">già riscattato · ripasso</span>
        ) : answered ? (
          <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-emerald-800">✓ riscattato</span>
        ) : (
          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-amber-900">+{questionReward(question.difficulty)} KC</span>
        )}
      </div>
      <p className="mb-3 text-lg font-semibold text-slate-900">{question.question}</p>

      <ol className="space-y-1.5">
        {order.map((o, i) => {
          const isPicked = picked === o
          return (
            <li key={o.text}>
              <button
                type="button"
                disabled={locked && !isPicked}
                onClick={() => choose(o)}
                className={`flex w-full items-center gap-2 rounded border px-3 py-2 text-left ${
                  isPicked && o.correct
                    ? 'border-emerald-400 bg-emerald-50'
                    : isPicked && cooldown > 0
                      ? 'border-red-300 bg-red-50'
                      : 'border-slate-200'
                } ${locked ? 'cursor-default text-slate-500' : 'cursor-pointer hover:border-sky-400 hover:bg-sky-50'}`}
              >
                <Key>{i + 1}</Key>
                <span>{o.text}</span>
              </button>
            </li>
          )
        })}
      </ol>

      {picked && (
        <div
          className={`mt-3 rounded px-3 py-2 ${picked.correct ? 'bg-emerald-100 text-emerald-900' : 'bg-red-100 text-red-900'}`}
        >
          {!picked.correct && cooldown === 0 && (
            <span className="font-semibold">Ultima risposta: “{picked.text}”. </span>
          )}
          {picked.explanation}
          {!picked.correct &&
            (cooldown > 0 ? (
              <span className="font-semibold"> Puoi riprovare tra {cooldown} s.</span>
            ) : (
              <span className="font-semibold"> Le risposte sono state rimescolate: riprova.</span>
            ))}
        </div>
      )}

      {solved && (
        <div className="mt-3 flex items-center gap-3">
          <span className="text-sm font-semibold text-emerald-700">
            {earned ? `+${earned} KC guadagnati` : 'Quesito già riscattato: nessun credito, ma ottimo ripasso.'}
          </span>
          {!last && (
            <button
              type="button"
              onClick={onNext}
              className="ml-auto cursor-pointer rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
            >
              Livello successivo → <span className="ml-1 text-xs font-normal text-sky-100">Invio</span>
            </button>
          )}
          {last && <span className="ml-auto text-sm text-slate-500">Dominio completato: prova un altro dominio.</span>}
        </div>
      )}
    </div>
  )
}
