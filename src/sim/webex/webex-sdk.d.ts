/**
 * Tipi minimi dello SDK `webex` (il pacchetto non ne pubblica): solo le parti usate da `webexService.ts`.
 * Tutto ciò che non serve resta `unknown`, così un cambio dello SDK emerge in un punto solo.
 */
declare module 'webex' {
  export interface WebexMessage {
    id: string
    roomId: string
    personId?: string
    personEmail?: string
    text?: string
    created?: string
  }

  export interface WebexMember {
    name?: string
    isInMeeting?: boolean
    isSelf?: boolean
  }

  export interface WebexMicrophoneStream {
    stop(): void
    setUserMuted?(muted: boolean): void
  }

  export interface WebexMeeting {
    on(event: 'media:ready', cb: (media: { type: string; stream: MediaStream }) => void): void
    on(event: 'media:stopped', cb: (media: { type: string }) => void): void
    on(event: string, cb: (payload: unknown) => void): void
    members: {
      on(event: 'members:update', cb: (payload: { full: Record<string, WebexMember> }) => void): void
    }
    join(options?: Record<string, unknown>): Promise<unknown>
    addMedia(options: {
      localStreams: { microphone: WebexMicrophoneStream }
      audioEnabled: boolean
      videoEnabled: boolean
      [key: string]: unknown
    }): Promise<unknown>
    muteAudio?(): Promise<unknown>
    unmuteAudio?(): Promise<unknown>
    leave(): Promise<unknown>
  }

  export interface WebexSdk {
    people: { get(id: string): Promise<{ id: string; displayName?: string; emails?: string[] }> }
    rooms: { get(roomId: string): Promise<{ id: string; title?: string; sipAddress?: string }> }
    messages: {
      list(options: { roomId: string; max?: number }): Promise<{ items: WebexMessage[] }>
      create(options: { roomId: string; text: string }): Promise<WebexMessage>
      listen(): Promise<unknown>
      on(event: 'created', cb: (event: { data: WebexMessage }) => void): void
    }
    meetings: {
      register(): Promise<unknown>
      create(destination: string): Promise<WebexMeeting>
      mediaHelpers: {
        createMicrophoneStream(constraints?: Record<string, unknown>): Promise<WebexMicrophoneStream>
      }
    }
  }

  const Webex: { init(options: { credentials: { access_token: string } }): WebexSdk }
  export default Webex
}
