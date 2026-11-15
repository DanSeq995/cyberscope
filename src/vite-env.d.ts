/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Token Webex per la chat di squadra (vuoto = modalità locale). Finisce nel bundle del client. */
  readonly VITE_WEBEX_ACCESS_TOKEN?: string
  readonly VITE_WEBEX_ROOM_BLUE?: string
  readonly VITE_WEBEX_ROOM_RED?: string
  readonly VITE_WEBEX_ROOM_GENERAL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
