/**
 * Chat di squadra: tre stanze fisse, messaggi e chiamata solo audio.
 * Con `VITE_WEBEX_ACCESS_TOKEN` usa lo SDK Webex (caricato con import dinamico: non entra nel bundle della scena);
 * senza token, o se l'init fallisce, passa alla modalità locale (messaggi in memoria, chiamata simulata). Il resto del gioco vede solo `ChatBackend`.
 *
 * Attenzione: un token in una variabile VITE_ finisce nel bundle del client ed è un solo utente Webex condiviso da
 * tutti i giocatori. Va bene per provare l'integrazione, non per la produzione (serve un backend che emetta token).
 */
import type { WebexMeeting, WebexMessage, WebexMicrophoneStream, WebexSdk } from 'webex'

export type RoomKey = 'blue' | 'red' | 'general'

export interface ChatRoom {
  key: RoomKey
  name: string
  /** Id della room Webex (vuoto se non configurato: modalità locale). */
  id: string
}

export const ROOMS: readonly ChatRoom[] = [
  { key: 'blue', name: 'Blue Team SOC', id: import.meta.env.VITE_WEBEX_ROOM_BLUE ?? '' },
  { key: 'red', name: 'Red Team Ops', id: import.meta.env.VITE_WEBEX_ROOM_RED ?? '' },
  { key: 'general', name: 'Generale', id: import.meta.env.VITE_WEBEX_ROOM_GENERAL ?? '' },
]

export const roomByKey = (key: RoomKey) => ROOMS.find((r) => r.key === key)!

export interface ChatMessage {
  id: string
  room: RoomKey
  author: string
  text: string
  /** Millisecondi epoch. */
  time: number
  own: boolean
}

export interface CallHandlers {
  onRemoteAudio: (stream: MediaStream | null) => void
  onParticipants: (names: string[]) => void
}

export interface CallSession {
  participants: string[]
  setMuted: (muted: boolean) => Promise<void>
  leave: () => Promise<void>
}

export interface ChatBackend {
  mode: 'webex' | 'local'
  history: (room: RoomKey) => Promise<ChatMessage[]>
  send: (room: RoomKey, text: string) => Promise<ChatMessage>
  /** Messaggi nuovi in arrivo (anche i propri: il chiamante deduplica per id). */
  subscribe: (onMessage: (m: ChatMessage) => void) => void
  joinCall: (room: RoomKey, handlers: CallHandlers) => Promise<CallSession>
}

const SELF = 'Tu'

// ---------------------------------------------------------------- locale

function localBackend(): ChatBackend {
  let seq = 0
  const id = () => `local-${++seq}`
  const welcome: Record<RoomKey, string> = {
    blue: 'Benvenuti nel canale del SOC. Segnalate qui alert e indicatori sospetti.',
    red: 'Canale operativo del red team: coordinate le fasi dell’attacco.',
    general: 'Canale comune a entrambe le squadre.',
  }
  const store: Record<RoomKey, ChatMessage[]> = {
    blue: [],
    red: [],
    general: [],
  }
  for (const room of ROOMS) {
    store[room.key].push({ id: id(), room: room.key, author: 'Clara Netroom', text: welcome[room.key], time: Date.now(), own: false })
  }

  return {
    mode: 'local',
    history: async (room) => [...store[room]],
    send: async (room, text) => {
      const m: ChatMessage = { id: id(), room, author: SELF, text, time: Date.now(), own: true }
      store[room].push(m)
      return m
    },
    subscribe: () => {},
    joinCall: async () => {
      await new Promise((r) => setTimeout(r, 500))
      return { participants: [SELF], setMuted: async () => {}, leave: async () => {} }
    },
  }
}

// ---------------------------------------------------------------- webex

function roomKeyOf(roomId: string): RoomKey | null {
  return ROOMS.find((r) => r.id && r.id === roomId)?.key ?? null
}

function withTimeout<T>(p: Promise<T>, ms: number, what: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error(`${what}: timeout`)), ms)),
  ])
}

async function webexBackend(token: string): Promise<ChatBackend> {
  // Lo SDK è scritto per Node/browserify: global, process, Buffer e i moduli builtin arrivano da
  // vite-plugin-node-polyfills (vite.config.ts).
  const mod = await import('webex')
  const Webex = (mod.default ?? mod) as typeof mod.default
  const webex: WebexSdk = Webex.init({ credentials: { access_token: token } })
  // Verifica il token prima di dichiarare la modalità Webex (altrimenti si ricade su quella locale).
  const me = await withTimeout(webex.people.get('me'), 10000, 'people.get(me)')
  let registered: Promise<unknown> | null = null

  const toMessage = (m: WebexMessage, room: RoomKey): ChatMessage => {
    const own = m.personId === me.id
    return {
      id: m.id,
      room,
      author: own ? SELF : (m.personEmail?.split('@')[0] ?? 'Webex'),
      text: m.text ?? '',
      time: m.created ? Date.parse(m.created) : Date.now(),
      own,
    }
  }

  const requireId = (room: RoomKey) => {
    const id = roomByKey(room).id
    if (!id) throw new Error(`Room Webex non configurata per «${roomByKey(room).name}»`)
    return id
  }

  return {
    mode: 'webex',
    history: async (room) => {
      const page = await webex.messages.list({ roomId: requireId(room), max: 50 })
      // L'API restituisce dal più recente: la chat li mostra in ordine cronologico.
      return page.items.map((m) => toMessage(m, room)).reverse()
    },
    send: async (room, text) => toMessage(await webex.messages.create({ roomId: requireId(room), text }), room),
    subscribe: (onMessage) => {
      webex.messages
        .listen()
        .then(() => {
          webex.messages.on('created', (event) => {
            const room = roomKeyOf(event.data.roomId)
            if (room) onMessage(toMessage(event.data, room))
          })
        })
        .catch((err: unknown) => console.warn('[webex] messages.listen fallito', err))
    },
    joinCall: async (room, handlers) => {
      registered ??= webex.meetings.register()
      await registered
      const info = await webex.rooms.get(requireId(room))
      if (!info.sipAddress) throw new Error('La room non ha un indirizzo SIP per le chiamate')
      const meeting: WebexMeeting = await webex.meetings.create(info.sipAddress)
      meeting.on('media:ready', (media) => {
        if (media.type === 'remoteAudio') handlers.onRemoteAudio(media.stream)
      })
      meeting.on('media:stopped', (media) => {
        if (media.type === 'remoteAudio') handlers.onRemoteAudio(null)
      })
      meeting.members.on('members:update', (payload) => {
        const names = Object.values(payload.full)
          .filter((m) => m.isInMeeting)
          .map((m) => (m.isSelf ? SELF : (m.name ?? '?')))
        handlers.onParticipants(names)
      })
      await meeting.join()
      let microphone: WebexMicrophoneStream | null = null
      try {
        microphone = await webex.meetings.mediaHelpers.createMicrophoneStream({
          echoCancellation: true,
          noiseSuppression: true,
        })
        await meeting.addMedia({ localStreams: { microphone }, audioEnabled: true, videoEnabled: false })
      } catch (err) {
        microphone?.stop()
        await meeting.leave().catch(() => {})
        throw err
      }
      return {
        participants: [SELF],
        setMuted: async (muted) => {
          const fn = muted ? meeting.muteAudio : meeting.unmuteAudio
          if (fn) await fn.call(meeting)
          else microphone?.setUserMuted?.(muted)
        },
        leave: async () => {
          try {
            await meeting.leave()
          } finally {
            microphone?.stop()
            handlers.onRemoteAudio(null)
          }
        },
      }
    },
  }
}

/** Webex se c'è un token valido, altrimenti modalità locale. Non lancia mai. */
export async function createChatBackend(): Promise<ChatBackend> {
  const token = import.meta.env.VITE_WEBEX_ACCESS_TOKEN?.trim()
  if (!token) return localBackend()
  try {
    return await webexBackend(token)
  } catch (err) {
    console.warn('[webex] init fallito, chat in modalità locale', err)
    return localBackend()
  }
}
