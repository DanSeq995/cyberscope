import { Mic, MicOff, Phone, PhoneOff } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'

import { ROOMS, roomByKey, type RoomKey } from '@/sim/webex/webexService'
import { useChatStore } from '@/state/chat'
import { useGameStore } from '@/state/game'

/** I click non devono arrivare al documento: PointerLockControls ricatturerebbe il mouse. */
const stop = (e: React.SyntheticEvent) => e.stopPropagation()

const time = (ms: number) => new Date(ms).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })

/**
 * Testo della battuta del dialogo scritto lettera per lettera (calcolato dall'ora di inizio: riaprendo la chat
 * a metà riprende dal punto giusto). null = nessuna scrittura automatica, il campo è del giocatore.
 */
function useTypewriter(typing: { text: string; start: number; duration: number } | null) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!typing) return
    const id = setInterval(() => setNow(Date.now()), 30)
    return () => clearInterval(id)
  }, [typing])
  if (!typing) return null
  const progress = Math.min(1, Math.max(0, (now - typing.start) / typing.duration))
  return typing.text.slice(0, Math.round(progress * typing.text.length))
}

function MuteButton({ compact = false }: { compact?: boolean }) {
  const muted = useChatStore((s) => s.call.muted)
  const toggleMute = useChatStore((s) => s.toggleMute)
  const Icon = muted ? MicOff : Mic
  return (
    <button
      type="button"
      onClick={toggleMute}
      title="Microfono (M)"
      className={`flex cursor-pointer items-center gap-1.5 rounded-md border px-2 py-1 text-xs ${
        muted ? 'border-red-400/60 bg-red-500/20 text-red-200' : 'border-white/30 hover:bg-white/10'
      }`}
    >
      <Icon className="size-3.5" />
      {!compact && (muted ? 'Microfono spento' : 'Microfono')}
    </button>
  )
}

function LeaveButton({ compact = false }: { compact?: boolean }) {
  const leaveCall = useChatStore((s) => s.leaveCall)
  return (
    <button
      type="button"
      onClick={leaveCall}
      title="Chiudi chiamata"
      className="flex cursor-pointer items-center gap-1.5 rounded-md border border-red-400/60 bg-red-600/80 px-2 py-1 text-xs hover:bg-red-600"
    >
      <PhoneOff className="size-3.5" />
      {!compact && 'Chiudi chiamata'}
    </button>
  )
}

function Panel() {
  const team = useGameStore((s) => s.team)
  const mode = useChatStore((s) => s.mode)
  const room = useChatStore((s) => s.room)
  const messages = useChatStore((s) => s.messages[s.room])
  const error = useChatStore((s) => s.error)
  const call = useChatStore((s) => s.call)
  const { init, selectRoom, send, joinCall } = useChatStore.getState()
  const [draft, setDraft] = useState('')
  const typing = useChatStore((s) => (s.typing?.room === s.room ? s.typing : null))
  const autoText = useTypewriter(typing?.own ? typing : null)
  const listRef = useRef<HTMLDivElement>(null)

  // Alla prima apertura carica il backend; a ogni apertura seleziona la stanza della squadra.
  useEffect(() => {
    init()
    if (team) selectRoom(team)
  }, [init, selectRoom, team])

  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
    // Stanza del SOC aperta: il dialogo dell'incidente è letto.
    if (room === 'blue') useChatStore.getState().markRead()
  }, [messages, room, typing])

  // Il campo si allarga col testo (fino a ~6 righe) e resta in fondo mentre la battuta si scrive.
  const composerRef = useRef<HTMLTextAreaElement>(null)
  const shown = autoText ?? draft
  useLayoutEffect(() => {
    const el = composerRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
    el.scrollTop = el.scrollHeight
  }, [shown])

  const submit = (e: { preventDefault: () => void }) => {
    e.preventDefault()
    send(draft)
    setDraft('')
  }

  const busy = mode === 'off' || mode === 'loading'
  const inCall = call.status !== 'idle'

  return (
    <div
      onClick={stop}
      onPointerDown={stop}
      onMouseDown={stop}
      className="fixed right-6 bottom-16 z-[45] flex h-[480px] max-h-[calc(100vh-5rem)] w-[360px] max-w-[calc(100vw-2rem)] flex-col rounded-lg border border-white/30 bg-neutral-900/90 text-sm text-white shadow-xl"
    >
      <header className="space-y-2 border-b border-white/20 p-3">
        <div className="flex items-center gap-2">
          <select
            value={room}
            onChange={(e) => selectRoom(e.target.value as RoomKey)}
            aria-label="Stanza"
            className="min-w-0 flex-1 cursor-pointer rounded border border-white/30 bg-neutral-800 px-2 py-1 font-semibold"
          >
            {/* Solo la stanza della propria squadra e quella comune: blue e red non si vedono a vicenda. */}
            {ROOMS.filter((r) => r.key === team || r.key === 'general').map((r) => (
              <option key={r.key} value={r.key}>
                {r.name}
              </option>
            ))}
          </select>
          {busy && <span className="text-xs text-white/60">Connessione…</span>}
        </div>
        <p className="text-[11px] tracking-wide text-white/50">Cisco Webex · Messaging &amp; Meetings</p>
        <button
          type="button"
          onClick={joinCall}
          disabled={busy || inCall}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-emerald-400/60 bg-emerald-600/70 px-3 py-1.5 text-xs font-medium hover:bg-emerald-600 disabled:cursor-default disabled:opacity-40"
        >
          <Phone className="size-3.5" />
          {call.status === 'joining' ? 'Connessione alla chiamata…' : 'Avvia / Unisciti alla chiamata'}
        </button>
      </header>

      <div ref={listRef} className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
        {messages.length === 0 && <p className="text-center text-xs text-white/50">Nessun messaggio.</p>}
        {messages.map((m) => (
          <div key={m.id} className={m.own ? 'text-right' : ''}>
            <div className="text-[11px] text-white/50">
              {m.author} · {time(m.time)}
            </div>
            <div
              className={`inline-block max-w-[85%] rounded-lg px-2.5 py-1.5 text-left break-words whitespace-pre-wrap ${
                m.own ? 'bg-sky-600/60' : 'bg-white/10'
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        {/* Gli altri «scrivono» nell'elenco, a sinistra: il campo di testo è solo dell'Amministratore (il giocatore). */}
        {typing && !typing.own && (
          <div>
            <div className="text-[11px] text-white/50">{typing.author}</div>
            <div className="inline-block rounded-lg bg-white/10 px-2.5 py-1.5 text-white/60 italic">sta scrivendo…</div>
          </div>
        )}
      </div>

      {error && <p className="border-t border-red-400/40 px-3 py-1.5 text-xs text-red-300">{error}</p>}

      {(call.status === 'active' || call.status === 'leaving') && (
        <section className="space-y-2 border-t border-white/20 p-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="size-2 rounded-full bg-emerald-400" />
            <span className="font-medium">Chiamata · {call.room ? roomByKey(call.room).name : ''}</span>
          </div>
          <ul className="flex flex-wrap gap-1 text-xs">
            {call.participants.map((p, i) => (
              <li key={`${p}-${i}`} className="rounded bg-white/10 px-1.5 py-0.5">
                {p}
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <MuteButton />
            <LeaveButton />
          </div>
        </section>
      )}

      <form onSubmit={submit} className="flex items-end gap-2 border-t border-white/20 p-3">
        <textarea
          ref={composerRef}
          rows={1}
          value={shown}
          onKeyDown={(e) => {
            // Invio manda, Shift+Invio va a capo.
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              if (autoText === null) submit(e)
            }
          }}
          onChange={(e) => setDraft(e.target.value)}
          readOnly={autoText !== null}
          disabled={busy}
          placeholder="Scrivi un messaggio…"
          aria-label="Messaggio"
          className="max-h-36 min-w-0 flex-1 resize-none overflow-y-auto rounded border border-white/30 bg-neutral-800 px-2 py-1 leading-snug placeholder:text-white/40"
        />
        <button
          type="submit"
          disabled={busy || autoText !== null || !draft.trim()}
          className="cursor-pointer rounded-md border border-white/30 px-3 py-1 text-xs hover:bg-white/10 disabled:cursor-default disabled:opacity-40"
        >
          Invia
        </button>
      </form>
      <p className="px-3 pb-2 text-[11px] text-white/50">
        C chiude (fuori dal campo di testo) · Esc pausa · M microfono
      </p>
    </div>
  )
}

/** Striscia minima durante una chiamata a pannello chiuso: niente pulsante per riaprire (si usa C). */
function CallStrip() {
  return (
    <div
      onClick={stop}
      onPointerDown={stop}
      onMouseDown={stop}
      className="fixed right-6 bottom-16 z-[45] flex items-center gap-2 rounded-lg border border-white/30 bg-black/70 px-2.5 py-1.5 text-white"
    >
      <span className="size-2 rounded-full bg-emerald-400" title="In chiamata" />
      <MuteButton compact />
      <LeaveButton compact />
    </div>
  )
}

/** Chat di squadra (tasto C) e chiamata audio. L'<audio> resta montato anche a pannello chiuso. */
export function WebexPanel() {
  const team = useGameStore((s) => s.team)
  const chatOpen = useGameStore((s) => s.chatOpen)
  const callStatus = useChatStore((s) => s.call.status)
  const remoteStream = useChatStore((s) => s.remoteStream)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    if (audioRef.current) audioRef.current.srcObject = remoteStream
  }, [remoteStream])

  return (
    <>
      <audio ref={audioRef} autoPlay className="hidden" />
      {team && chatOpen && <Panel />}
      {team && !chatOpen && callStatus === 'active' && <CallStrip />}
    </>
  )
}
