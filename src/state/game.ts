import { create } from 'zustand'

import { lockPointer, releasePointer } from '@/lib/pointer'
import type { DoorId } from '@/scene/office/doors'
import type { DeskPcId, StationId, Team } from '@/scene/office/layout'

/** fps = prima persona (gioco), map = vista pianta dall'alto (debug greybox). */
export type ViewMode = 'fps' | 'map'

/**
 * closed = in tasca · opening = animazione 3D (sale, si apre, si avvicina) · open = console a tutto schermo ·
 * closing = la console sfuma e l'animazione 3D torna indietro.
 */
export type LaptopState = 'closed' | 'opening' | 'open' | 'closing'

/** PC da scrivania: stessi stati del portatile (zoom della camera sul monitor, poi pagina HTML). */
export type DeskState = 'closed' | 'opening' | 'open' | 'closing'

interface GameState {
  /** Squadra scelta nella schermata iniziale; null = scelta ancora da fare (la scena non è montata). */
  team: Team | null
  /** true dalla prima scelta in poi: la scena 3D viene montata una volta sola e non più smontata. */
  entered: boolean
  chooseTeam: (team: Team) => void
  /** Torna alla scelta della squadra (lo stato delle due partite resta com'è). */
  leaveTeam: () => void
  view: ViewMode
  /** true quando il puntatore è catturato e il giocatore può muoversi. */
  locked: boolean
  setLocked: (locked: boolean) => void
  /** Zona dell'ufficio in cui si trova il giocatore (id di ZONES), null se in corridoio. */
  zone: string | null
  setZone: (zone: string | null) => void
  /** Punto di interazione (STATIONS) entro cui si trova il giocatore, null se nessuno. */
  near: StationId | null
  setNear: (near: StationId | null) => void
  nearDoor: DoorId | null
  setNearDoor: (nearDoor: DoorId | null) => void
  /** Dashboard SOC a tutto schermo (tasto F): il giocatore resta fermo finché è aperta. */
  socFullscreen: boolean
  toggleSocFullscreen: () => void
  /** Portatile per la console del firewall: il giocatore resta fermo finché non è chiuso. */
  laptop: LaptopState
  setLaptop: (laptop: LaptopState) => void
  /** PC da scrivania: finché non è chiuso la camera è guidata dallo zoom e il giocatore resta fermo. */
  desk: DeskState
  /** Quale PC è (o era per ultimo) in uso: studio = teoria, work = postazione del sistemista. */
  deskPc: DeskPcId
  setDesk: (desk: DeskState) => void
  /** Avvia lo zoom sul monitor del PC indicato. */
  openDesk: (pc: DeskPcId) => void
  /**
   * Mouse liberato di proposito per usare un PC a tutto schermo (cursore visibile e cliccabile).
   * Finché è vero, la perdita del pointer lock non chiude le schermate e non mostra la pausa.
   */
  cursorFree: boolean
  /**
   * Pannello della chat di squadra (tasto C). Libera il mouse come `cursorFree`: la perdita del pointer lock
   * non è una pausa e non chiude le altre schermate. Non fa parte di CLOSED_OVERLAYS (sopravvive al cambio vista).
   */
  chatOpen: boolean
  /** Il mouse era catturato quando la chat è stata aperta: alla chiusura con C va ricatturato. */
  chatRelock: boolean
  openChat: () => void
  /** `relock` = ricattura il mouse (solo dentro un gesto valido: tasto C, non Esc). */
  closeChat: (relock: boolean) => void
  toggleView: () => void
}

/** Stato delle sovrapposizioni da chiudere quando il puntatore viene rilasciato o si cambia vista. */
const CLOSED_OVERLAYS = {
  socFullscreen: false,
  laptop: 'closed' as LaptopState,
  desk: 'closed' as DeskState,
  cursorFree: false,
}

/**
 * Cambio di stato di un PC: aperto a tutto schermo → cursore libero; chiuso → cursore di nuovo al gioco
 * (se il mouse non è stato ricatturato, compare la schermata di pausa).
 */
function screenChange<T extends object>(patch: T, state: LaptopState | DeskState) {
  if (state === 'closed') return { ...patch, cursorFree: false }
  if (state === 'open') return { ...patch, socFullscreen: false, cursorFree: true }
  return { ...patch, socFullscreen: false }
}

export const useGameStore = create<GameState>((set, get) => ({
  team: null,
  entered: false,
  chooseTeam: (team) =>
    set({ team, entered: true, view: 'fps', locked: false, zone: null, near: null, nearDoor: null, ...CLOSED_OVERLAYS, chatOpen: false }),
  leaveTeam: () =>
    set({ team: null, view: 'fps', locked: false, zone: null, near: null, nearDoor: null, ...CLOSED_OVERLAYS, chatOpen: false }),
  view: 'fps',
  locked: false,
  // Esc in gioco rilascia il puntatore (il browser non lo impedisce): chiude anche tutto schermo, portatile e
  // PC da scrivania. Se invece il mouse è stato liberato apposta per un PC (cursorFree) o per la chat, le schermate
  // restano aperte. Un click sulla scena con la chat aperta ricattura il mouse: la chat si chiude e si torna al gioco.
  setLocked: (locked) =>
    set((s) =>
      locked
        ? { locked, cursorFree: false, chatOpen: false }
        : s.cursorFree || s.chatOpen
          ? { locked }
          : { locked, ...CLOSED_OVERLAYS },
    ),
  zone: null,
  setZone: (zone) => set({ zone }),
  near: null,
  setNear: (near) => set({ near }),
  nearDoor: null,
  setNearDoor: (nearDoor) => set({ nearDoor }),
  socFullscreen: false,
  toggleSocFullscreen: () =>
    set((s) => (s.laptop === 'closed' && s.desk === 'closed' ? { socFullscreen: !s.socFullscreen } : {})),
  laptop: 'closed',
  setLaptop: (laptop) => {
    set(screenChange({ laptop }, laptop))
    if (laptop === 'open') releasePointer()
  },
  desk: 'closed',
  deskPc: 'study',
  setDesk: (desk) => {
    set(screenChange({ desk }, desk))
    if (desk === 'open') releasePointer()
  },
  openDesk: (deskPc) => set(screenChange({ desk: 'opening' as DeskState, deskPc }, 'opening')),
  cursorFree: false,
  chatOpen: false,
  chatRelock: false,
  openChat: () => {
    // Prima il flag, poi il rilascio: così setLocked(false) trova la chat aperta e non la legge come pausa.
    set((s) => ({ chatOpen: true, chatRelock: s.locked }))
    releasePointer()
  },
  closeChat: (relock) => {
    if (relock && get().chatRelock) lockPointer()
    set({ chatOpen: false, chatRelock: false })
  },
  toggleView: () =>
    // La chat resta aperta, ma dopo il cambio vista non si ricattura il mouse chiudendola.
    set((s) => ({ view: s.view === 'fps' ? 'map' : 'fps', locked: false, ...CLOSED_OVERLAYS, chatRelock: false })),
}))
