import { Fragment, useEffect, useRef, useState } from 'react'

import { AVAILABLE_LESSONS, DOMAINS, OFFICIAL_OBJECTIVES_URL } from '@/sim/theory/domains'
import type { LessonBlock, Source } from '@/sim/theory/types'

import { useLockedScroll } from '../useLockedScroll'

const TOTAL_OBJECTIVES = DOMAINS.reduce((n, d) => n + d.objectives.length, 0)

/** Rimando a una fonte della lezione (numerata da 1). */
type Cite = (n: number) => void

export function Key({ children }: { children: React.ReactNode }) {
  return <kbd className="rounded border border-slate-300 bg-white px-1.5 py-0.5 font-mono text-xs text-slate-700">{children}</kbd>
}

/**
 * Scheda Manuali del PC Biblioteca: indice per domini e lezione corrente. La lezione scelta è dello schermo
 * (`index`), perché la barra di lettura nell'intestazione sa su quale pagina si sta leggendo.
 */
export function Manuals({
  index,
  setIndex,
  active,
}: {
  index: number
  setIndex: (update: (i: number) => number) => void
  /** Scheda visibile: solo allora frecce e rotella agiscono su questa pagina. */
  active: boolean
}) {
  const [flash, setFlash] = useState<number | null>(null)
  const content = useRef<HTMLElement>(null)
  const { domain, lesson } = AVAILABLE_LESSONS[index]

  useLockedScroll(() => (active ? content.current : null))

  // ← → lezione precedente/successiva tra quelle disponibili.
  useEffect(() => {
    if (!active) return
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return
      if (e.code === 'ArrowRight') setIndex((i) => Math.min(i + 1, AVAILABLE_LESSONS.length - 1))
      else if (e.code === 'ArrowLeft') setIndex((i) => Math.max(i - 1, 0))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active, setIndex])

  /** Cambio lezione: si riparte dall'inizio della pagina. */
  const goTo = (i: number) => {
    setIndex(() => i)
    setFlash(null)
  }
  useEffect(() => {
    content.current?.scrollTo({ top: 0 })
  }, [index])

  /** Nota [n]: scorre fino alla fonte n (dentro la pagina, senza cambiare indirizzo) e la evidenzia. */
  const cite: Cite = (n) => {
    content.current?.querySelector(`#fonte-${n}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setFlash(n)
  }

  const prev = AVAILABLE_LESSONS[index - 1]
  const next = AVAILABLE_LESSONS[index + 1]

  return (
    <>
      <div className="flex min-h-0 flex-1">
        <nav className="flex w-72 shrink-0 flex-col overflow-y-auto border-r border-slate-200 bg-slate-100">
          <div className="flex-1 space-y-3 p-3">
            {DOMAINS.map((d) => (
              <section key={d.id}>
                <div className="mb-1 flex items-baseline justify-between px-1">
                  <h3 className="text-xs font-bold tracking-wide text-slate-500 uppercase">
                    Dominio {d.id} · {d.title}
                  </h3>
                  <span className="ml-2 shrink-0 text-[10px] text-slate-400">{d.weight}%</span>
                </div>
                <ul className="space-y-0.5">
                  {d.objectives.map((o) => {
                    const target = AVAILABLE_LESSONS.findIndex((a) => a.objective.code === o.code)
                    if (target < 0) {
                      return (
                        <li key={o.code} title={o.title} className="flex items-center gap-2 px-2 py-1 text-sm text-slate-400">
                          <span className="w-7 shrink-0 font-mono text-xs">{o.code}</span>
                          <span className="truncate">{o.title}</span>
                          <span className="ml-auto shrink-0 text-[10px] italic">in arrivo</span>
                        </li>
                      )
                    }
                    const active = target === index
                    return (
                      <li key={o.code}>
                        <button
                          type="button"
                          title={o.title}
                          onClick={() => goTo(target)}
                          className={`flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-left text-sm ${
                            active ? 'bg-sky-600 text-white shadow' : 'text-slate-700 hover:bg-white'
                          }`}
                        >
                          <span className={`w-7 shrink-0 font-mono text-xs ${active ? 'text-sky-100' : 'text-slate-500'}`}>
                            {o.code}
                          </span>
                          <span className="truncate font-medium">{o.title}</span>
                          {o.lesson?.scenario && (
                            <span
                              title="Utile per l’incidente"
                              className={`ml-auto shrink-0 rounded px-1 text-[10px] font-bold ${
                                active ? 'bg-white/25 text-white' : 'bg-amber-200 text-amber-900'
                              }`}
                            >
                              incidente
                            </span>
                          )}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </section>
            ))}
          </div>
          <p className="border-t border-slate-200 p-3 text-[11px] leading-snug text-slate-500">
            Basato sugli obiettivi d’esame CompTIA Security+ SY0-701 (V7). Testi originali, non materiale ufficiale
            CompTIA.{' '}
            <a href={OFFICIAL_OBJECTIVES_URL} target="_blank" rel="noopener noreferrer" className="text-sky-700 underline">
              Pagina ufficiale ↗
            </a>
          </p>
        </nav>

        <article ref={content} className="min-w-0 flex-1 overflow-y-auto px-8 py-5">
          <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-sky-700">
            Dominio {domain.id} · Obiettivo {lesson.objective}
            {lesson.scenario && (
              <span className="rounded bg-amber-200 px-1.5 py-0.5 text-[11px] text-amber-900">Utile per l’incidente</span>
            )}
          </div>
          <h1 className="mb-1 text-2xl font-bold text-slate-900">{lesson.title}</h1>
          <p className="mb-4 text-slate-500">{lesson.summary}</p>

          <div className="max-w-3xl space-y-3 leading-relaxed">
            <h2 className="text-sm font-bold tracking-wide text-slate-500 uppercase">Essenziale</h2>
            {lesson.essentials.map((block, i) => (
              <Block key={i} block={block} cite={cite} />
            ))}

            {lesson.deep.map((section) => (
              <Fragment key={section.title}>
                <h2 className="pt-3 text-lg font-bold text-slate-900">
                  <span className="mr-2 text-xs font-semibold tracking-wide text-sky-600 uppercase">Approfondimento</span>
                  {section.title}
                </h2>
                {section.blocks.map((block, i) => (
                  <Block key={i} block={block} cite={cite} />
                ))}
              </Fragment>
            ))}

            <h2 className="pt-4 text-lg font-bold text-slate-900">Fonti e link</h2>
            <p className="text-xs text-slate-500">I link si aprono in una nuova scheda del browser; il gioco resta aperto.</p>
            <ol className="space-y-1.5">
              {lesson.sources.map((source, i) => (
                <SourceItem key={source.url} n={i + 1} source={source} highlight={flash === i + 1} />
              ))}
            </ol>
          </div>

          <div className="mt-6 flex max-w-3xl justify-between border-t border-slate-200 pt-4">
            {prev ? (
              <PagerButton onClick={() => goTo(index - 1)} label={`← ${prev.lesson.objective} ${prev.lesson.title}`} />
            ) : (
              <span />
            )}
            {next && (
              <PagerButton onClick={() => goTo(index + 1)} label={`${next.lesson.objective} ${next.lesson.title} →`} primary />
            )}
          </div>
        </article>
      </div>

      <footer className="flex items-center gap-3 border-t border-slate-200 bg-white px-5 py-2 text-xs text-slate-500">
        <span>
          clic sull’indice o <Key>←</Key> <Key>→</Key> per cambiare lezione · clic su <b>[n]</b> per la fonte
        </span>
        <span>rotella per scorrere</span>
        <span>
          {AVAILABLE_LESSONS.length} lezioni disponibili su {TOTAL_OBJECTIVES} obiettivi
        </span>
        <span className="ml-auto">
          <Key>E</Key> o <b>✕ Chiudi</b> per tornare all’ufficio
        </span>
      </footer>
    </>
  )
}

/** Testo con note: `[n]` diventa un piccolo rimando cliccabile. */
function Text({ text, cite }: { text: string; cite: Cite }) {
  const parts = text.split(/\[(\d+)\]/)
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <sup key={i}>
            <button
              type="button"
              onClick={() => cite(Number(part))}
              className="cursor-pointer px-0.5 font-semibold text-sky-700 hover:underline"
            >
              [{part}]
            </button>
          </sup>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  )
}

function SourceItem({ n, source, highlight }: { n: number; source: Source; highlight: boolean }) {
  return (
    <li
      id={`fonte-${n}`}
      className={`flex items-start gap-2 rounded px-2 py-1 text-sm transition-colors ${highlight ? 'bg-amber-100' : ''}`}
    >
      <span className="w-6 shrink-0 font-mono text-slate-500">[{n}]</span>
      <span className="min-w-0">
        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="cursor-pointer font-medium text-sky-700 underline decoration-sky-300 hover:decoration-sky-700"
        >
          {source.title} ↗
        </a>
        <span className="text-slate-500"> — {source.publisher}</span>
        <span
          className={`ml-2 rounded px-1 text-[10px] font-bold ${
            source.lang === 'IT' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
          }`}
        >
          {source.lang}
        </span>
      </span>
    </li>
  )
}

function PagerButton({ label, onClick, primary }: { label: string; onClick: () => void; primary?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`cursor-pointer rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
        primary ? 'bg-sky-600 text-white hover:bg-sky-700' : 'text-slate-600 hover:bg-slate-200'
      }`}
    >
      {label}
    </button>
  )
}

function Block({ block, cite }: { block: LessonBlock; cite: Cite }) {
  switch (block.type) {
    case 'p':
      return (
        <p>
          <Text text={block.text} cite={cite} />
        </p>
      )
    case 'list': {
      const List = block.ordered ? 'ol' : 'ul'
      return (
        <List className={`space-y-1 pl-6 ${block.ordered ? 'list-decimal' : 'list-disc'}`}>
          {block.items.map((item) => (
            <li key={item}>
              <Text text={item} cite={cite} />
            </li>
          ))}
        </List>
      )
    }
    case 'table':
      return (
        <table className="w-full overflow-hidden rounded border border-slate-200 bg-white text-left text-sm">
          <thead className="bg-slate-100 text-xs text-slate-500 uppercase">
            <tr>
              {block.head.map((h) => (
                <th key={h} className="px-3 py-1.5">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row) => (
              <tr key={row.join('|')} className="border-t border-slate-100">
                {row.map((cell, i) => (
                  <td key={i} className={`px-3 py-1.5 align-top ${i === 0 ? 'font-mono font-semibold' : ''}`}>
                    <Text text={cell} cite={cite} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )
    case 'example':
      return (
        <div className="rounded-lg border border-slate-200 bg-slate-900 p-3 text-sm">
          <div className="mb-1.5 font-sans text-xs font-semibold text-slate-400 uppercase">{block.title}</div>
          {block.lines.map((line) => (
            <div key={line} className="font-mono whitespace-pre-wrap text-slate-100">
              {line}
            </div>
          ))}
        </div>
      )
    case 'scenario':
      return (
        <div className="rounded-lg border-l-4 border-amber-500 bg-amber-50 px-4 py-2.5 text-amber-950">
          <span className="font-semibold">Nello scenario: </span>
          <Text text={block.text} cite={cite} />
        </div>
      )
  }
}
