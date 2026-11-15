import { useEffect, useRef } from 'react'

import { DESK_PCS } from '@/scene/office/layout'
import { MAX_SCORE, PLACEHOLDER, STEPS, type AttackOption } from '@/sim/attack'
import { rank, stepScore } from '@/sim/score'
import { useGameStore } from '@/state/game'
import { stepScores, totalScore, useRedStore } from '@/state/red'

import { CloseButton } from '../CloseButton'
import { useLockedScroll } from '../useLockedScroll'

const MONITOR = DESK_PCS.red
const [SCREEN_W, SCREEN_H] = MONITOR.screen

/** Stessa forma e occupazione della vista dello schermo 3D a fine zoom. */
const SCREEN_STYLE = {
  height: `min(${MONITOR.fill * 100}vh, ${(MONITOR.fill * 100 * SCREEN_H) / SCREEN_W}vw)`,
  aspectRatio: `${SCREEN_W} / ${SCREEN_H}`,
  backgroundColor: MONITOR.screenColor,
}

function optionOf(step: number, id: string): AttackOption | undefined {
  return STEPS[step]?.options.find((o) => o.id === id)
}

function Prompt() {
  return <span className="text-emerald-400">red@netroom:~$ </span>
}

/** Schermo del PC del red team: compare in dissolvenza a fine zoom sul monitor e sfuma in chiusura. */
export function RedTerminal() {
  const desk = useGameStore((s) => (s.deskPc === 'red' ? s.desk : 'closed'))
  if (desk !== 'open' && desk !== 'closing') return null
  return <Terminal closing={desk === 'closing'} />
}

function Terminal({ closing }: { closing: boolean }) {
  const step = useRedStore((s) => s.step)
  const attempts = useRedStore((s) => s.attempts)
  const tried = useRedStore((s) => s.tried)
  const history = useRedStore((s) => s.history)
  const order = useRedStore((s) => s.order)
  const best = useRedStore((s) => s.best)
  const answer = useRedStore((s) => s.answer)
  const reset = useRedStore((s) => s.reset)
  const term = useRef<HTMLDivElement>(null)

  const done = step >= STEPS.length
  const scores = stepScores(step, attempts)
  const total = totalScore(scores)
  const current = done ? null : STEPS[step]
  const options = current ? order[step].flatMap((id) => optionOf(step, id) ?? []) : []
  // L'ultimo tentativo è nella fase corrente solo se era sbagliato (quello giusto fa avanzare).
  const last = history[history.length - 1]
  const wrong = current && last?.step === step ? optionOf(step, last.option) : undefined
  const remaining = current ? stepScore(current.points, attempts[step] + 1) : 0

  // Tasti 1–4: scelgono la risposta nell'ordine mostrato.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const match = /^(?:Digit|Numpad)([1-9])$/.exec(e.code)
      if (!match || e.repeat) return
      const s = useRedStore.getState()
      const id = s.order[s.step]?.[Number(match[1]) - 1]
      if (id) s.answer(id)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Il terminale resta in fondo, sull'ultimo comando.
  useEffect(() => {
    term.current?.scrollTo({ top: term.current.scrollHeight })
  }, [history.length])

  useLockedScroll(() => term.current)

  return (
    <div
      style={{ backgroundColor: MONITOR.bezelColor }}
      // I click non devono arrivare al documento: drei PointerLockControls ricatturerebbe il mouse.
      onClick={(e) => e.stopPropagation()}
      className={`fixed inset-0 z-40 grid cursor-default place-items-center select-none ${
        closing ? 'animate-out fade-out fill-mode-forwards duration-200' : 'animate-in fade-in duration-300'
      }`}
    >
      <div style={SCREEN_STYLE} className="flex max-w-full flex-col overflow-hidden text-slate-200">
        <header className="flex items-center justify-between gap-3 border-b border-slate-700 bg-slate-900 px-3 py-1.5">
          <span className="text-sm text-slate-300">PC red team · rete ospiti · MITRE ATT&amp;CK</span>
          <div className="flex items-center gap-4 text-sm">
            <span>
              Punti <b className="text-rose-300 tabular-nums">{total}</b>
              <span className="text-slate-400"> / {MAX_SCORE}</span>
            </span>
            {best !== null && <span className="text-slate-400">Record {best}</span>}
            <CloseButton dark />
          </div>
        </header>

        {PLACEHOLDER && (
          <div className="border-b border-amber-500/40 bg-amber-950/60 px-3 py-1 text-xs text-amber-200">
            Contenuti da completare: domande, risposte e output sono segnaposto (vedi src/sim/attack.ts).
          </div>
        )}

        <div className="flex min-h-0 flex-1">
          {/* Terminale: cronologia dei tentativi */}
          <div ref={term} className="min-w-0 flex-1 overflow-y-auto p-4 font-mono text-[13px] leading-relaxed">
            <div className="text-slate-500">Sessione del red team. Rispondi alle domande a destra: ogni scelta viene eseguita qui.</div>
            {history.map((h, i) => {
              const option = optionOf(h.step, h.option)
              if (!option) return null
              return (
                <div key={i} className="mt-2">
                  <div>
                    <Prompt />
                    <span className="text-slate-100">{option.kind === 'command' ? option.label : `# ${option.label}`}</span>
                  </div>
                  {option.output.map((line, n) => (
                    <div key={n} className="whitespace-pre-wrap text-slate-400">
                      {line}
                    </div>
                  ))}
                  <div className={option.correct ? 'text-emerald-400' : 'text-amber-400'}>
                    # {option.correct ? 'ok' : 'non adatto'}: {option.explanation}
                  </div>
                </div>
              )
            })}
            {!done && (
              <div className="mt-2">
                <Prompt />
                <span className="animate-pulse">▌</span>
              </div>
            )}
          </div>

          {/* Fasi, domanda e risposte */}
          <aside className="flex w-[44%] shrink-0 flex-col gap-3 overflow-y-auto border-l border-slate-700 bg-slate-900/70 p-3 text-sm">
            <ol className="space-y-1">
              {STEPS.map((s, i) => (
                <li
                  key={s.id}
                  className={`flex items-center justify-between gap-2 rounded px-2 py-1 ${
                    i === step ? 'bg-rose-950/70 text-white' : i < step ? 'text-slate-300' : 'text-slate-500'
                  }`}
                >
                  <span className="min-w-0 truncate">
                    {i + 1}. {s.title}
                    <span className="ml-1.5 text-xs opacity-70">
                      {s.tactic}
                      {s.technique ? ` · ${s.technique.id}` : ''}
                    </span>
                  </span>
                  <span className="shrink-0 tabular-nums">
                    {i < step ? scores[i] : '–'} / {s.points}
                  </span>
                </li>
              ))}
            </ol>

            {current ? (
              <div className="rounded-lg border border-slate-700 bg-slate-950/60 p-3">
                <div className="text-xs text-rose-300">
                  <span className="mr-1.5 rounded border border-rose-400/50 px-1 py-px text-[10px] tracking-wide">MITRE ATT&amp;CK</span>
                  {current.tactic}
                  {current.technique ? ` · ${current.technique.id} ${current.technique.name}` : ''}
                </div>
                <p className="mt-1 mb-3 font-medium text-white">{current.question}</p>
                <div className="space-y-2">
                  {options.map((option, i) => {
                    const used = tried.includes(option.id)
                    return (
                      <button
                        key={option.id}
                        type="button"
                        disabled={used}
                        onClick={() => answer(option.id)}
                        className={`flex w-full items-start gap-2 rounded-md border px-2.5 py-2 text-left ${
                          used
                            ? 'border-slate-800 text-slate-600 line-through'
                            : 'cursor-pointer border-slate-600 hover:border-rose-400 hover:bg-rose-950/40'
                        }`}
                      >
                        <kbd className="rounded border border-slate-500 px-1.5 font-mono text-xs">{i + 1}</kbd>
                        <span className={option.kind === 'command' ? 'font-mono text-[13px] break-all' : ''}>{option.label}</span>
                      </button>
                    )
                  })}
                </div>
                {wrong && (
                  <div className="mt-3 rounded-md border border-amber-500/50 bg-amber-950/50 p-2.5 text-amber-100">
                    <b>Non è la scelta giusta.</b> {wrong.explanation}{' '}
                    <span className="text-amber-300">
                      {remaining > 0 ? `Restano ${remaining} punti per questa fase.` : 'Per questa fase non restano punti: trova comunque la risposta giusta.'}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <Summary scores={scores} attempts={attempts} total={total} best={best} onReplay={reset} />
            )}
          </aside>
        </div>
      </div>
    </div>
  )
}

function Summary({
  scores,
  attempts,
  total,
  best,
  onReplay,
}: {
  scores: number[]
  attempts: number[]
  total: number
  best: number | null
  onReplay: () => void
}) {
  const grade = rank(total, MAX_SCORE)
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-950/60 p-3">
      <div className="text-xs text-rose-300">Percorso concluso</div>
      <p className="mt-1 text-lg font-semibold text-white">
        {total} / {MAX_SCORE} · {grade.title}
      </p>
      <p className="mb-3 text-slate-300">{grade.note}</p>
      <table className="w-full text-left text-xs">
        <thead className="text-slate-400">
          <tr>
            <th className="py-1 font-medium">Fase</th>
            <th className="py-1 font-medium">Tentativi</th>
            <th className="py-1 text-right font-medium">Punti</th>
          </tr>
        </thead>
        <tbody>
          {STEPS.map((s, i) => (
            <tr key={s.id} className="border-t border-slate-800">
              <td className="py-1">
                {i + 1}. {s.title}
              </td>
              <td className="py-1 tabular-nums">{attempts[i]}</td>
              <td className="py-1 text-right tabular-nums">
                {scores[i]} / {s.points}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-slate-400">Record della sessione: {best ?? total}</span>
        <button
          type="button"
          onClick={onReplay}
          className="cursor-pointer rounded-md border border-rose-400/70 px-3 py-1 font-medium text-rose-200 hover:bg-rose-950/60"
        >
          Rigioca
        </button>
      </div>
    </div>
  )
}
