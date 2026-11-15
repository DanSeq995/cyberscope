import { create } from 'zustand'

import { DIALOGUE_ID_PREFIX, SOC_DIALOGUE, typingDuration } from '@/sim/webex/socDialogue'
import {
  createChatBackend,
  type CallSession,
  type ChatBackend,
  type ChatMessage,
  type RoomKey,
} from '@/sim/webex/webexService'

import { useGameStore } from './game'
import { useSocStore } from './soc'

export type ChatMode = 'off' | 'loading' | 'webex' | 'local'
export type CallStatus = 'idle' | 'joining' | 'active' | 'leaving'

interface ChatState {
  /** off = backend non ancora caricato (si carica alla prima apertura della chat). */
  mode: ChatMode
  room: RoomKey
  messages: Record<RoomKey, ChatMessage[]>
  /** Errore dell'ultima operazione, mostrato nel pannello. */
  error: string | null
  call: { status: CallStatus; room: RoomKey | null; muted: boolean; participants: string[] }
  /** Audio remoto della chiamata, assegnato all'<audio> sempre montato. */
  remoteStream: MediaStream | null
  init: () => void
  selectRoom: (room: RoomKey) => void
  send: (text: string) => void
  joinCall: () => void
  toggleMute: () => void
  leaveCall: () => void
  /** Battute del dialogo SOC non ancora lette (notifica nell'HUD a chat chiusa). */
  unread: number
  /** Aggiunge un messaggio locale (dialogo scriptato): non passa dal backend. */
  addLocal: (m: ChatMessage) => void
  /** Toglie il dialogo SOC (simulazione azzerata). */
  clearDialogue: () => void
  markRead: () => void
  /**
   * Battuta del dialogo in corso di scrittura: se `own` il pannello la scrive lettera per lettera nel campo
   * di testo (animazione, non il giocatore), altrimenti mostra «<autore> sta scrivendo…».
   */
  typing: { room: RoomKey; author: string; own: boolean; text: string; start: number; duration: number } | null
}

// Fuori dallo store: oggetti dello SDK, non stato da renderizzare.
let backend: ChatBackend | null = null
let ready: Promise<ChatBackend> | null = null
let session: CallSession | null = null
const loaded = new Set<RoomKey>()

const IDLE_CALL = { status: 'idle' as CallStatus, room: null, muted: false, participants: [] }

const message = (err: unknown) => (err instanceof Error ? err.message : String(err))

export const useChatStore = create<ChatState>((set, get) => {
  /** Aggiunge un messaggio alla sua stanza, ignorando i doppioni (create + evento listen). */
  const add = (m: ChatMessage) =>
    set((s) =>
      s.messages[m.room].some((x) => x.id === m.id)
        ? {}
        : { messages: { ...s.messages, [m.room]: [...s.messages[m.room], m].sort((a, b) => a.time - b.time) } },
    )

  const loadHistory = (room: RoomKey) => {
    if (!backend || loaded.has(room)) return
    loaded.add(room)
    backend
      .history(room)
      .then((list) => list.forEach(add))
      .catch((err: unknown) => {
        loaded.delete(room)
        set({ error: message(err) })
      })
  }

  return {
    unread: 0,
    typing: null,
    addLocal: (m) => {
      add(m)
      const game = useGameStore.getState()
      const seen = game.chatOpen && get().room === m.room
      if (!m.own && !seen) set((s) => ({ unread: s.unread + 1 }))
    },
    clearDialogue: () =>
      set((s) => ({
        unread: 0,
        typing: null,
        messages: { ...s.messages, blue: s.messages.blue.filter((m) => !m.id.startsWith(DIALOGUE_ID_PREFIX)) },
      })),
    markRead: () => set((s) => (s.unread ? { unread: 0 } : {})),
    mode: 'off',
    room: 'general',
    messages: { blue: [], red: [], general: [] },
    error: null,
    call: IDLE_CALL,
    remoteStream: null,
    init: () => {
      if (ready) return
      set({ mode: 'loading' })
      ready = createChatBackend()
      void ready.then((b) => {
        backend = b
        set({ mode: b.mode })
        b.subscribe(add)
        loadHistory(get().room)
      })
    },
    selectRoom: (room) => {
      set({ room, error: null })
      loadHistory(room)
    },
    send: (text) => {
      const body = text.trim()
      if (!backend || !body) return
      backend
        .send(get().room, body)
        .then(add)
        .catch((err: unknown) => set({ error: message(err) }))
    },
    joinCall: () => {
      if (!backend || get().call.status !== 'idle') return
      const room = get().room
      set({ call: { ...IDLE_CALL, status: 'joining', room }, error: null })
      backend
        .joinCall(room, {
          onRemoteAudio: (remoteStream) => set({ remoteStream }),
          onParticipants: (participants) => set((s) => ({ call: { ...s.call, participants } })),
        })
        .then((s) => {
          session = s
          set((st) => ({ call: { ...st.call, status: 'active', participants: s.participants } }))
        })
        .catch((err: unknown) => set({ call: IDLE_CALL, remoteStream: null, error: `Chiamata: ${message(err)}` }))
    },
    toggleMute: () => {
      const { call } = get()
      if (!session || call.status !== 'active') return
      const muted = !call.muted
      set({ call: { ...call, muted } })
      session.setMuted(muted).catch((err: unknown) => {
        set((s) => ({ call: { ...s.call, muted: !muted }, error: `Microfono: ${message(err)}` }))
      })
    },
    leaveCall: () => {
      const s = session
      if (!s || get().call.status !== 'active') return
      session = null
      set((st) => ({ call: { ...st.call, status: 'leaving' } }))
      s.leave()
        .catch((err: unknown) => set({ error: `Chiamata: ${message(err)}` }))
        .finally(() => set({ call: IDLE_CALL, remoteStream: null }))
    },
  }
})

// Dialogo Analista SOC ↔ Amministratore di rete: parte da solo al primo alert, si toglie quando T azzera.
let dialogueTimers: ReturnType<typeof setTimeout>[] = []
let dialogueRun = 0

const unsubscribeSoc = useSocStore.subscribe((soc, prev) => {
  if (soc.phase === prev.phase) return
  if (soc.phase === 'incident') {
    const run = ++dialogueRun
    dialogueTimers = SOC_DIALOGUE.flatMap((line, i) => {
      // La scrittura comincia solo dopo l'invio della battuta precedente: se il testo è lungo si scrive più veloce.
      const previous = i > 0 ? SOC_DIALOGUE[i - 1].delay + 300 : 0
      const start = Math.max(line.delay - typingDuration(line), previous)
      const duration = line.delay - start
      const startTyping = setTimeout(() => {
        useChatStore.setState({
          typing: { room: 'blue', author: line.author, own: line.own, text: line.text, start: Date.now(), duration },
        })
      }, start)
      const sendLine = setTimeout(() => {
        useChatStore.setState({ typing: null })
        useChatStore.getState().addLocal({
          id: `${DIALOGUE_ID_PREFIX}${run}-${i}`,
          room: 'blue',
          author: line.author,
          text: line.text,
          time: Date.now(),
          own: line.own,
        })
      }, line.delay)
      return [startTyping, sendLine]
    })
  } else if (soc.phase === 'idle') {
    dialogueTimers.forEach(clearTimeout)
    dialogueTimers = []
    useChatStore.getState().clearDialogue()
  }
})

// Ricaricamento a caldo in sviluppo: senza questo il vecchio modulo resterebbe iscritto e il dialogo partirebbe due volte.
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    unsubscribeSoc()
    dialogueTimers.forEach(clearTimeout)
  })
}
