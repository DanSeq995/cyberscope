import { useCallback, useEffect, useRef, useState } from 'react'

import { doorById } from '@/scene/office/doors'

import { useChatStore } from '@/state/chat'
import { useDoorsStore } from '@/state/doors'
import { useGameStore } from '@/state/game'
import { useSocStore } from '@/state/soc'
import { useWorkStore, type WorkPhase } from '@/state/work'

import { closeComputer, isTyping } from './computer'
import { NewGameButton } from './NewGameButton'

function Key({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-white/30 bg-white/10 px-1.5 py-0.5 font-mono text-xs">
      {children}
    </kbd>
  )
}

/** In prima persona, col mouse catturato e senza altre schermate aperte. */
function isFree() {
  const g = useGameStore.getState()
  return g.view === 'fps' && g.locked && g.laptop === 'closed' && g.desk === 'closed' && !g.socFullscreen
}

/** Durata del messaggio temporaneo dell'HUD (ms). */
const NOTE_MS = 2500

/** Il portatile si apre solo durante un incidente, davanti all'armadio di rete. */
function canOpenLaptop() {
  return isFree() && useGameStore.getState().near === 'firewall' && useSocStore.getState().phase === 'incident'
}

/** Obiettivo della richiesta al sistemista, mostrato in alto a sinistra finché non è conclusa. */
const WORK_GOAL: Record<WorkPhase, string | null> = {
  new: 'Nuova mail: vai al PC del sistemista (SOC, secondo schermo acceso)',
  design: 'Progetta la rete nel Simulatore di rete (PC del sistemista) e verificala',
  install: 'Progetto approvato: monta gli apparati nel rack della stanza del nuovo team (porta a est)',
  done: null,
}

/** Overlay 2D: schermata "clicca per entrare", mirino e suggerimenti comandi. */
export function Hud() {
  const view = useGameStore((s) => s.view)
  const locked = useGameStore((s) => s.locked)
  const toggleView = useGameStore((s) => s.toggleView)
  const toggleSocFullscreen = useGameStore((s) => s.toggleSocFullscreen)
  const laptop = useGameStore((s) => s.laptop)
  const near = useGameStore((s) => s.near)
  const nearDoor = useGameStore((s) => s.nearDoor)
  const nearWall = useGameStore((s) => s.nearWall)
  const doorOpen = useDoorsStore((s) => (nearDoor ? s.open[nearDoor] : false))
  const desk = useGameStore((s) => s.desk)
  const workPhase = useWorkStore((s) => s.phase)
  const socFullscreen = useGameStore((s) => s.socFullscreen)
  const cursorFree = useGameStore((s) => s.cursorFree)
  const chatOpen = useGameStore((s) => s.chatOpen)
  const unread = useChatStore((s) => s.unread)
  const team = useGameStore((s) => s.team)
  const leaveTeam = useGameStore((s) => s.leaveTeam)
  const red = team === 'red'
  const phase = useSocStore((s) => s.phase)
  const toggleSimulation = useSocStore((s) => s.toggle)
  // Messaggio temporaneo al centro dello schermo (es. porta d'ingresso chiusa).
  const [note, setNote] = useState<string | null>(null)
  const noteTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const showNote = useCallback((text: string) => {
    clearTimeout(noteTimer.current)
    setNote(text)
    noteTimer.current = setTimeout(() => setNote(null), NOTE_MS)
  }, [])
  useEffect(() => () => clearTimeout(noteTimer.current), [])

  // V alterna prima persona / vista pianta, T avvia o azzera la simulazione, F apre/chiude
  // la dashboard SOC a tutto schermo, E apre/chiude il portatile davanti al firewall e i PC da scrivania,
  // oppure installa gli apparati davanti al rack della nuova stanza.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return
      const game = useGameStore.getState()
      // Schermata di scelta della squadra: nessun comando di gioco.
      if (!game.team) return
      // Chat aperta: Esc la chiude lasciando il mouse libero (compare la pausa). Prima di isTyping: vale anche nel campo.
      if (e.code === 'Escape' && game.chatOpen) {
        game.closeChat(false)
        return
      }
      // Cursore libero su un PC: Esc lo chiude e porta alla pausa (il browser non ricattura il mouse con Esc).
      if (e.code === 'Escape' && game.cursorFree) {
        closeComputer(false)
        return
      }
      // Si sta scrivendo in un campo di un PC: le lettere non sono comandi di gioco.
      if (isTyping(e)) return
      // C apre/chiude la chat da qualunque punto; chiudendola si ricattura il mouse dentro il gesto (tasto ≠ Esc).
      if (e.code === 'KeyC') {
        if (game.chatOpen) game.closeChat(true)
        else game.openChat()
        return
      }
      // M = microfono della chiamata in corso, da qualsiasi punto della partita.
      if (e.code === 'KeyM') {
        useChatStore.getState().toggleMute()
        return
      }
      if (e.code === 'KeyV') {
        if (document.pointerLockElement) document.exitPointerLock()
        toggleView()
      } else if (e.code === 'KeyF' && game.socFullscreen) {
        // Chiusura della dashboard a tutto schermo: sempre possibile.
        toggleSocFullscreen()
      } else if ((game.team === 'red' || !game.nearWall) && (e.code === 'KeyT' || e.code === 'KeyF')) {
        // Simulazione dell'incidente e dashboard SOC: solo blue team e solo davanti al video wall di Splunk.
        return
      } else if (e.code === 'KeyT') {
        if (game.laptop !== 'closed') game.setLaptop('closed')
        toggleSimulation()
      } else if (e.code === 'KeyF') {
        toggleSocFullscreen()
      } else if (e.code === 'KeyE') {
        // Chiusura animata, ricatturando subito il mouse (E è un gesto valido per il pointer lock).
        if (closeComputer(true)) return
        if (!isFree()) return
        if (canOpenLaptop()) game.setLaptop('opening')
        else if (game.near === 'study' || game.near === 'work' || game.near === 'red') game.openDesk(game.near)
        else if (game.near === 'team-rack') useWorkStore.getState().install()
        else if (game.nearDoor) {
          // Porta che non si apre (ingresso): al posto dell'apertura compare il suo messaggio.
          const message = doorById(game.nearDoor).lockedMessage
          if (message) showNote(message)
          else useDoorsStore.getState().toggle(game.nearDoor)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toggleView, toggleSimulation, toggleSocFullscreen, showNote])

  // E compare solo nel prompt contestuale; T e F solo davanti al video wall di Splunk (blue team).
  const simHint =
    !red && nearWall ? (
      <>
        {' · '}
        <Key>T</Key> {phase === 'idle' ? 'avvia simulazione' : 'azzera simulazione'} · <Key>F</Key> SOC a tutto schermo
      </>
    ) : null
  const idle = locked && laptop === 'closed' && desk === 'closed' && !socFullscreen
  const prompt = !idle
    ? null
    : near === 'firewall' && phase === 'incident'
      ? 'apri il portatile e accedi al firewall'
      : near === 'study'
        ? 'studia la teoria'
        : near === 'work'
          ? 'usa il PC del sistemista (posta e simulatore di rete)'
          : near === 'team-rack' && workPhase === 'install'
            ? 'monta srv-03, rt-02 e fw-02 nel rack e collegali'
            : near === 'red'
              ? 'usa il PC del red team (percorso d’attacco a fasi)'
              : nearDoor
                ? doorOpen
                  ? 'chiudi la porta'
                  : 'apri la porta'
                : null
  const goal = red ? null : WORK_GOAL[workPhase]

  if (view === 'map') {
    return (
      <div className="pointer-events-none fixed bottom-4 left-4 z-10 rounded bg-black/60 px-3 py-2 text-sm text-white">
        Vista pianta · trascina per ruotare · <Key>V</Key> torna in prima persona · <Key>C</Key> chat{simHint}
      </div>
    )
  }

  // PC a tutto schermo o chat con il cursore libero: niente mirino né schermata di pausa.
  if (cursorFree || chatOpen) return null

  if (locked) {
    return (
      <>
        <div className="pointer-events-none fixed top-1/2 left-1/2 z-10 size-1.5 -translate-1/2 rounded-full bg-white/80" />
        {note && (
          <div className="pointer-events-none fixed top-[42%] left-1/2 z-10 -translate-x-1/2 animate-in rounded-lg border border-white/20 bg-black/75 px-5 py-2.5 text-lg font-medium text-white fade-in zoom-in-95 duration-200">
            {note}
          </div>
        )}
        {prompt && (
          <div className="pointer-events-none fixed top-[60%] left-1/2 z-10 -translate-x-1/2 rounded-lg bg-black/70 px-4 py-2 text-white">
            <Key>E</Key> {prompt}
          </div>
        )}
        {!red && unread > 0 && (
          <div className="pointer-events-none fixed top-14 right-4 z-10 max-w-xs rounded-lg border border-sky-400/60 bg-black/60 px-3 py-2 text-sm text-white">
            <span className="mr-1.5 font-semibold text-sky-300">Analista SOC</span>
            ha scritto in Blue Team SOC · <Key>C</Key> chat
          </div>
        )}
        {goal && idle && (
          <div className="pointer-events-none fixed top-4 left-4 z-10 max-w-xs rounded-lg border border-amber-400/60 bg-black/60 px-3 py-2 text-sm text-white">
            <span className="mr-1.5 font-semibold text-amber-300">Richiesta IT</span>
            {goal}
          </div>
        )}
        <div className="pointer-events-none fixed bottom-4 left-4 z-10 rounded bg-black/40 px-3 py-2 text-xs text-white/80">
          <Key>Esc</Key> pausa · <Key>V</Key> vista pianta · <Key>C</Key> chat{simHint}
        </div>
      </>
    )
  }

  // Il click ovunque cattura il puntatore (PointerLockControls ascolta sul documento).
  return (
    <div className="fixed inset-0 z-10 grid cursor-pointer place-items-center bg-black/50">
      <div className="max-w-sm rounded-lg bg-neutral-900/90 p-6 text-center text-white shadow-xl">
        <h1 className="mb-1 text-xl font-semibold">Clara Netroom</h1>
        <p className="mb-4 text-sm text-white/70">
          {red ? 'Red team · clicca per entrare nella tua stanza' : 'Blue team · clicca per entrare nell’ufficio'}
        </p>
        <ul className="space-y-1.5 text-left text-sm">
          <li>
            <Key>W</Key> <Key>A</Key> <Key>S</Key> <Key>D</Key> o frecce — muoviti
          </li>
          <li>Mouse — guardati intorno</li>
          <li>
            <Key>Shift</Key> — corri
          </li>
          <li>
            <Key>Esc</Key> — pausa
          </li>
          <li>
            <Key>V</Key> — vista pianta
          </li>
          <li>
            <Key>C</Key> — chat di squadra e chiamata audio (<Key>M</Key> microfono)
          </li>
          {/* Comandi legati agli oggetti: solo quando si è vicini (E compare nel prompt contestuale). */}
          {!red && nearWall && (
            <>
              <li>
                <Key>T</Key> — avvia/azzera la simulazione (guarda il video wall del SOC)
              </li>
              <li>
                <Key>F</Key> — dashboard SOC a tutto schermo (di nuovo <Key>F</Key> per chiuderla)
              </li>
            </>
          )}
        </ul>
        {/* I click non devono arrivare al documento: ricatturerebbero il mouse invece di agire sui pulsanti. */}
        <div className="mt-4 flex flex-wrap justify-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={leaveTeam}
            className="cursor-pointer rounded-md border border-white/30 px-3 py-1 text-sm text-white/80 hover:bg-white/10"
          >
            Cambia squadra
          </button>
          <NewGameButton />
        </div>
      </div>
    </div>
  )
}
