import { useState } from 'react'

import { DESK_PCS } from '@/scene/office/layout'
import { READING_CAP_GAME, READING_CAP_PAGE, READING_REWARD, READING_STEP_S } from '@/sim/credits'
import { AVAILABLE_LESSONS } from '@/sim/theory/domains'
import { useGameStore } from '@/state/game'

import { BrowserTab } from '../BrowserTab'
import { CloseButton } from '../CloseButton'

import { Manuals } from './Manuals'
import { TrainingLab } from './TrainingLab'
import { useActiveReading, type ReadingStatus } from './useActiveReading'

const STUDY_MONITOR = DESK_PCS.study
const [SCREEN_W, SCREEN_H] = STUDY_MONITOR.screen

/** Stessa forma e occupazione della vista dello schermo 3D a fine zoom. */
const SCREEN_STYLE = {
  height: `min(${STUDY_MONITOR.fill * 100}vh, ${(STUDY_MONITOR.fill * 100 * SCREEN_H) / SCREEN_W}vw)`,
  aspectRatio: `${SCREEN_W} / ${SCREEN_H}`,
  backgroundColor: STUDY_MONITOR.screenColor,
}

type Tab = 'manuals' | 'lab'

/** Si apre sulla lezione che contiene firewall e policy, la più utile per l'incidente. */
const START_INDEX = Math.max(
  AVAILABLE_LESSONS.findIndex((a) => a.lesson.objective === '3.2'),
  0,
)

/** PC Biblioteca (PC di studio): compare in dissolvenza a fine zoom sul monitor e sfuma in chiusura. */
export function StudyTheory() {
  const study = useGameStore((s) => (s.deskPc === 'study' ? s.desk : 'closed'))
  if (study !== 'open' && study !== 'closing') return null
  return <LibraryWindow closing={study === 'closing'} />
}

function LibraryWindow({ closing }: { closing: boolean }) {
  const [tab, setTab] = useState<Tab>('manuals')
  const [index, setIndex] = useState(START_INDEX)
  const page = AVAILABLE_LESSONS[index].lesson.objective
  const reading = useActiveReading(page, tab === 'manuals' && !closing)

  const address = tab === 'manuals' ? `academy.netroom.local/manuali/${page}` : 'academy.netroom.local/training-lab'

  return (
    <div
      style={{ backgroundColor: STUDY_MONITOR.bezelColor }}
      // I click non devono arrivare al documento: drei PointerLockControls ricatturerebbe il mouse.
      onClick={(e) => e.stopPropagation()}
      className={`fixed inset-0 z-40 grid cursor-default place-items-center select-none ${
        closing ? 'animate-out fade-out fill-mode-forwards duration-200' : 'animate-in fade-in duration-300'
      }`}
    >
      <div style={SCREEN_STYLE} className="flex max-w-full flex-col overflow-hidden text-slate-800">
        {/* Barra del browser: schede, indirizzo, lettura attiva */}
        <div className="flex items-end gap-1 bg-slate-200 px-2 pt-1.5">
          <span className="mr-2 mb-2 flex gap-1.5">
            <span className="size-3 rounded-full bg-red-400" />
            <span className="size-3 rounded-full bg-amber-400" />
            <span className="size-3 rounded-full bg-emerald-400" />
          </span>
          <BrowserTab active={tab === 'manuals'} label="Manuali" dot="bg-sky-500" onSelect={() => setTab('manuals')} />
          <BrowserTab
            active={tab === 'lab'}
            label="Cyber Certification · Training Lab"
            dot="bg-amber-500"
            onSelect={() => setTab('lab')}
          />
          <span className="mb-1 ml-auto">
            <CloseButton />
          </span>
        </div>
        <header className="flex items-center gap-4 border-b border-slate-200 bg-white px-3 py-1.5">
          <div className="min-w-0 flex-1 truncate rounded-md bg-slate-100 px-3 py-1 font-mono text-sm text-slate-600">
            🔒 https://{address}
          </div>
          {tab === 'manuals' ? (
            <ReadingBar {...reading} />
          ) : (
            <span className="shrink-0 text-xs text-slate-500">
              <span className="font-semibold text-sky-700">Netroom Academy</span> · Security+ SY0-701
            </span>
          )}
        </header>

        {/* Entrambe le schede restano montate: cambiando scheda non si perde il quesito in corso. */}
        <div className={tab === 'manuals' ? 'flex min-h-0 flex-1 flex-col' : 'hidden'}>
          <Manuals index={index} setIndex={setIndex} active={tab === 'manuals' && !closing} />
        </div>
        <div className={tab === 'lab' ? 'flex min-h-0 flex-1 flex-col' : 'hidden'}>
          <TrainingLab active={tab === 'lab' && !closing} />
        </div>
      </div>
    </div>
  )
}

const STATUS_TEXT: Record<ReadingStatus, string> = {
  reading: `+${READING_REWARD} KC ogni ${READING_STEP_S} s di lettura attiva`,
  idle: 'in pausa: scorri o muovi il mouse per continuare',
  capped: 'pagina completata: prova un’altra lezione o il Training Lab',
}

/** "Analisi Documentazione": avanzamento verso il prossimo premio di lettura e limiti per pagina e giornata. */
function ReadingBar({
  status,
  progress,
  earnedPage,
  earnedGame,
}: {
  status: ReadingStatus
  progress: number
  earnedPage: number
  earnedGame: number
}) {
  const gameDone = earnedGame >= READING_CAP_GAME
  return (
    <div
      className="flex w-[26rem] shrink-0 flex-col gap-0.5"
      title={`Massimo ${READING_CAP_PAGE} KC per pagina e ${READING_CAP_GAME} KC a partita dalla lettura`}
    >
      <div className="flex items-baseline justify-between text-[11px]">
        <span className="font-semibold text-slate-700">Analisi Documentazione</span>
        <span className="font-mono text-slate-500">
          pagina {earnedPage}/{READING_CAP_PAGE} · partita {earnedGame}/{READING_CAP_GAME} KC
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-full rounded-full transition-[width] duration-1000 ease-linear ${
            status === 'reading' ? 'bg-sky-500' : status === 'capped' ? 'bg-emerald-500' : 'bg-slate-400'
          }`}
          style={{ width: `${status === 'capped' ? 100 : progress * 100}%` }}
        />
      </div>
      <span className={`text-[11px] ${status === 'idle' ? 'text-amber-700' : 'text-slate-500'}`}>
        {gameDone ? 'limite della partita raggiunto: i crediti ora si guadagnano nel Training Lab' : STATUS_TEXT[status]}
      </span>
    </div>
  )
}
