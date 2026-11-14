import { DESK_PC_TOWARD_MONITOR, deskSurfaceWorldY } from './deskChairFit'
import { DESK_COMPUTER_LAYOUT, deskScreenWorldCenter } from './deskComputerFit'

/**
 * Layout greybox dell'ufficio del blue team.
 * Unità: 1 = 1 metro. Origine al centro del pavimento.
 * Nord = -z (muro con video wall), Sud = +z (ingresso), Est = +x (sala server).
 *
 * Tutto ciò che compone la stanza è descritto qui come dati: in futuro gli stessi
 * elementi serviranno per generare i collider Rapier o per sostituire i box con asset Rodin.
 */

export type Vec3 = [number, number, number]
export type Vec2 = [number, number]

/** static = arredo/struttura, interactive = futuro punto di interazione, glass = vetrata. */
export type Kind = 'static' | 'interactive' | 'glass'

/** Direzione z verso cui guarda l'operatore seduto: -1 = nord, 1 = sud. */
export type Facing = -1 | 1

export interface BoxItem {
  type: 'box'
  id: string
  kind: Kind
  position: Vec3
  size: Vec3
}

export interface CylinderItem {
  type: 'cylinder'
  id: string
  kind: Kind
  position: Vec3
  radius: number
  height: number
}

/** Scrivania singola con postazione (monitor, PC, sedia). */
export interface DeskItem {
  type: 'desk'
  id: string
  position: Vec2
  facing: Facing
  /** PC utilizzabile (monitor acceso), come per le postazioni. */
  pc?: DeskPcId
}

/** Postazione senza piano scrivania (es. sul bancone SOC). */
export interface WorkstationItem {
  type: 'workstation'
  id: string
  position: Vec2
  facing: Facing
  /** PC utilizzabile (monitor acceso): con E la camera va sullo schermo. */
  pc?: DeskPcId
}

/** Squadra scelta all'avvio: le due giocano in stanze non collegate. */
export type Team = 'blue' | 'red'

/** PC da scrivania utilizzabili: teoria (studio), postazione del sistemista (lavoro), terminale del red team. */
export type DeskPcId = 'study' | 'work' | 'red'

/** Punti in cui compare un prompt E. */
export type StationId = 'firewall' | 'study' | 'work' | 'team-rack' | 'red'

/** Rack 42U con switch e patch panel frontali (fronte verso +z). */
export interface RackItem {
  type: 'rack'
  id: string
  position: Vec2
  /** Nome del server ospitato, come compare nei log (campo `dest`). */
  host: string
  /** Rack vuoto: gli apparati compaiono dopo l'installazione (vedi TeamRack). */
  empty?: true
}

export type LayoutItem = BoxItem | CylinderItem | DeskItem | WorkstationItem | RackItem

export interface Zone {
  id: string
  label: string
  color: string
  center: Vec2
  size: Vec2
}

export const ROOM = {
  width: 12,
  depth: 10,
  height: 3,
  wallThickness: 0.2,
} as const

/** Estensione del pavimento sotto i muri per evitare stacchi visivi. */
export const FLOOR_EDGE_BLEED = ROOM.wallThickness + 0.12

export const DESK = { width: 1.6, depth: 0.8, height: 0.75 } as const
export const RACK = { width: 0.6, height: 2.0, depth: 1.0 } as const

export const RACK_FRONT_Z = (rackZ: number) => rackZ + RACK.depth / 2 + 0.01

/** Spostamento visivo lungo z rispetto alla `position` del layout (negativo = verso il muro nord). */
export const RACK_VISUAL_Z_OFFSET = -0.15

/**
 * Stanza del red team: staccata dall'ufficio (a ovest), quattro muri pieni e nessuna porta.
 * Chi sceglie il red team nasce e resta qui.
 */
export const RED_ROOM = { minX: -13.5, maxX: -8.5, minZ: -2, maxZ: 2 } as const

/** Punti di spawn: blue team vicino all'ingresso dell'ufficio, red team al centro della sua stanza. */
export const SPAWNS: Record<Team, Vec2> = {
  blue: [-4.5, 4],
  red: [(RED_ROOM.minX + RED_ROOM.maxX) / 2, 1],
}

/** Centro della vista pianta di ogni squadra. */
export const MAP_TARGETS: Record<Team, Vec2> = {
  blue: [0, 0],
  red: [(RED_ROOM.minX + RED_ROOM.maxX) / 2, (RED_ROOM.minZ + RED_ROOM.maxZ) / 2],
}

/** Giocatore in prima persona: capsula alta 1,75 m, occhi a 1,65 m. */
export const PLAYER = {
  height: 1.75,
  radius: 0.3,
  eyeHeight: 1.65,
  walkSpeed: 3,
  runSpeed: 5.5,
} as const

/** Porte: x del centro (ingresso, muro sud) e della sala server (vetrata sud). */
const DOOR = { width: 1, height: 2.1 }
const ENTRANCE_X = -4.5
const SERVER_DOOR_X = 4
/** Sala server: angolo NE, da x = 2 a 6 e da z = -5 a -1. */
const SERVER = { minX: 2, maxZ: -1 }

const halfW = ROOM.width / 2
const halfD = ROOM.depth / 2
const t = ROOM.wallThickness
const H = ROOM.height
const glassH = 2.8

/**
 * Ala est: stanza del nuovo team, oltre il muro est dell'open space (misure interne 4×5 m).
 * Vi si entra da una porta nel muro est, tra la vetrata della sala server e la stampante.
 */
export const WING = { minX: halfW + t, maxX: halfW + t + 4, minZ: -1.5, maxZ: 3.5, doorZ: 0.5 } as const

/** Rack della stanza del nuovo team (fronte verso +z): qui si installa l'hardware progettato al PC. */
export const TEAM_RACK: { position: Vec2; host: string } = {
  position: [9.4, WING.minZ + RACK.depth / 2 + 0.05],
  host: 'srv-03',
}

/** Video wall del SOC sul muro nord: qui viene proiettata la dashboard SIEM. */
export const VIDEO_WALL: { position: Vec3; size: Vec3 } = {
  position: [-2.5, 1.7, -halfD + 0.05],
  size: [4, 1.8, 0.08],
}

/**
 * z del bancone SOC. Abbastanza lontano dal video wall (~3 m) perché, in piedi dietro le sedie,
 * con FOV verticale 70° il giocatore veda tutto lo schermo sopra i monitor anche su display 4:3.
 */
const SOC_DESK_Z = -1.9

/** Distanza dal centro scrivania del modello monitor verso il bordo lontano. */
export const MONITOR = { offset: 0.2 } as const

interface PcPlace {
  position: Vec2
  facing: Facing
}

/** PC di studio della teoria: la prima postazione del bancone SOC (la più vicina all'ingresso). */
const STUDY_PC: PcPlace = { position: [-4.05, SOC_DESK_Z], facing: -1 }
/** PC di lavoro del sistemista: la postazione accanto (posta e simulatore di rete). */
const WORK_PC: PcPlace = { position: [-2.3, SOC_DESK_Z], facing: -1 }

/** PC del red team: scrivania contro il muro nord della sua stanza. */
const RED_PC: PcPlace = { position: [(RED_ROOM.minX + RED_ROOM.maxX) / 2, RED_ROOM.minZ + DESK.depth / 2 + 0.1], facing: -1 }

/** Centro della faccia frontale del monitor e misure dello schermo (m), per lo zoom della camera. */
function deskMonitor(pc: PcPlace, screenColor: string) {
  return {
    center: deskScreenWorldCenter(
      pc.position[0],
      pc.position[1],
      pc.facing,
      deskSurfaceWorldY(),
      MONITOR.offset + DESK_PC_TOWARD_MONITOR,
      DESK_COMPUTER_LAYOUT.screenLocal,
    ),
    facing: pc.facing,
    screen: DESK_COMPUTER_LAYOUT.screen,
    /** Frazione dell'altezza della vista coperta dallo schermo a fine zoom (uguale all'overlay HTML). */
    fill: 0.95,
    /** Colore dello schermo acceso = sfondo della pagina HTML (il passaggio 3D → HTML non si nota). */
    screenColor,
    /** Cornice del monitor come appare illuminata = sfondo dell'overlay. */
    bezelColor: '#3b4048',
  }
}

export type DeskMonitor = ReturnType<typeof deskMonitor>

export const DESK_PCS: Record<DeskPcId, DeskMonitor> = {
  study: deskMonitor(STUDY_PC, '#f8fafc'),
  work: deskMonitor(WORK_PC, '#e2e8f0'),
  red: deskMonitor(RED_PC, '#0b0f14'),
}

/** Dietro la sedia di un PC: qui compare il prompt E. */
function chairStation(pc: PcPlace) {
  return { position: [pc.position[0], pc.position[1] - pc.facing * 1.3] as Vec2, radius: 0.8 }
}

/**
 * Punti di interazione (prompt E). Se il giocatore è dentro più raggi vince il più vicino.
 * firewall = davanti all'armadio di rete in sala server (portatile per la console di fw-01).
 */
export const STATIONS: Record<StationId, { position: Vec2; radius: number }> = {
  firewall: { position: [5.2, -3.3], radius: 1.2 },
  study: chairStation(STUDY_PC),
  work: chairStation(WORK_PC),
  'team-rack': { position: [TEAM_RACK.position[0], TEAM_RACK.position[1] + RACK.depth / 2 + 0.9], radius: 1 },
  red: chairStation(RED_PC),
}

export const ZONES: Zone[] = [
  { id: 'entrance', label: 'Ingresso', color: '#3b82f6', center: [-4.5, 4], size: [3, 2] },
  { id: 'server', label: 'Sala server', color: '#ef4444', center: [4, -3], size: [4, 4] },
  { id: 'soc', label: 'SOC', color: '#a855f7', center: [-2.5, -2.65], size: [7, 4.7] },
  { id: 'open-space', label: 'Open space', color: '#22c55e', center: [1, 2.5], size: [5, 4] },
  {
    id: 'team-room',
    label: 'Stanza nuovo team',
    color: '#eab308',
    center: [(WING.minX + WING.maxX) / 2, (WING.minZ + WING.maxZ) / 2],
    size: [WING.maxX - WING.minX, WING.maxZ - WING.minZ],
  },
  {
    id: 'red-room',
    label: 'Stanza red team',
    color: '#f43f5e',
    center: MAP_TARGETS.red,
    size: [RED_ROOM.maxX - RED_ROOM.minX, RED_ROOM.maxZ - RED_ROOM.minZ],
  },
]

/** Asse lungo cui corre un muro: x (muri nord/sud) o z (muri est/ovest). */
type Axis = 'x' | 'z'

/** Box di un muro: `along` = centro lungo l'asse del muro, `fixed` = coordinata sull'altro asse. */
function wallBox(
  id: string,
  kind: Kind,
  axis: Axis,
  along: number,
  fixed: number,
  y: number,
  length: number,
  height: number,
  thickness: number,
): BoxItem {
  return axis === 'x'
    ? { type: 'box', id, kind, position: [along, y, fixed], size: [length, height, thickness] }
    : { type: 'box', id, kind, position: [fixed, y, along], size: [thickness, height, length] }
}

/** Segmenti di muro da `from` a `to` lungo `axis`, con un varco porta centrato in `gap` (più sopraluce). */
function wallWithGap(
  idPrefix: string,
  kind: Kind,
  fixed: number,
  from: number,
  to: number,
  gap: number,
  height: number,
  thickness: number,
  axis: Axis = 'x',
): BoxItem[] {
  const gapMin = gap - DOOR.width / 2
  const gapMax = gap + DOOR.width / 2
  const before = gapMin - from
  const after = to - gapMax
  const header =
    height > DOOR.height
      ? [
          wallBox(
            `${idPrefix}-header`,
            kind,
            axis,
            gap,
            fixed,
            (DOOR.height + height) / 2,
            DOOR.width,
            height - DOOR.height,
            thickness,
          ),
        ]
      : []
  return [
    ...header,
    wallBox(`${idPrefix}-a`, kind, axis, from + before / 2, fixed, height / 2, before, height, thickness),
    wallBox(`${idPrefix}-b`, kind, axis, gapMax + after / 2, fixed, height / 2, after, height, thickness),
  ]
}

/** Stipiti e architrave di una porta (punto di interazione): `along` = centro del varco lungo l'asse del muro. */
function doorFrame(id: string, along: number, fixed: number, axis: Axis = 'x'): BoxItem[] {
  const post = 0.08
  const half = DOOR.width / 2 + post / 2
  return [
    wallBox(`${id}-jamb-l`, 'interactive', axis, along - half, fixed, DOOR.height / 2, post, DOOR.height, 0.24),
    wallBox(`${id}-jamb-r`, 'interactive', axis, along + half, fixed, DOOR.height / 2, post, DOOR.height, 0.24),
    wallBox(`${id}-lintel`, 'interactive', axis, along, fixed, DOOR.height + post / 2, DOOR.width + post * 2, post, 0.24),
  ]
}

const walls: LayoutItem[] = [
  // Muri perimetrali (tutti alti 3 m: il gioco è in prima persona)
  {
    type: 'box',
    id: 'wall-north',
    kind: 'static',
    position: [0, H / 2, -halfD - t / 2],
    size: [ROOM.width + t * 2, H, t],
  },
  {
    type: 'box',
    id: 'wall-west',
    kind: 'static',
    position: [-halfW - t / 2, H / 2, 0],
    size: [t, H, ROOM.depth],
  },
  // Muro est con la porta verso la stanza del nuovo team
  ...wallWithGap('wall-east', 'static', halfW + t / 2, -halfD, halfD, WING.doorZ, H, t, 'z'),
  ...doorFrame('door-team', WING.doorZ, halfW + t / 2, 'z'),
  ...wallWithGap('wall-south', 'static', halfD + t / 2, -halfW - t, halfW + t, ENTRANCE_X, H, t),
  ...doorFrame('door-entrance', ENTRANCE_X, halfD + t / 2),
]

const serverRoom: LayoutItem[] = [
  // Vetrata ovest e sud con porta
  {
    type: 'box',
    id: 'glass-west',
    kind: 'glass',
    position: [SERVER.minX, glassH / 2, (-halfD + SERVER.maxZ) / 2],
    size: [0.05, glassH, SERVER.maxZ + halfD],
  },
  ...wallWithGap('glass-south', 'glass', SERVER.maxZ, SERVER.minX, halfW, SERVER_DOOR_X, glassH, 0.05),
  ...doorFrame('door-server', SERVER_DOOR_X, SERVER.maxZ),
  // Due rack 42U in fila, armadio di rete con router
  { type: 'rack', id: 'rack-1', position: [3.0, -4.3], host: 'srv-01' },
  { type: 'rack', id: 'rack-2', position: [3.62, -4.3], host: 'srv-02' },
  { type: 'rack', id: 'network-cabinet', position: [5.2, -4.4], host: 'network' },
]

const wingW = WING.maxX - WING.minX
const wingD = WING.maxZ - WING.minZ
const wingMidX = (WING.minX + WING.maxX + t) / 2
const TEAM_DESK_Z = WING.maxZ - DESK.depth / 2 - 0.1

/** Stanza del nuovo team: tre muri (il quarto è il muro est dell'ufficio), rack vuoto e due scrivanie. */
const teamRoom: LayoutItem[] = [
  { type: 'box', id: 'wing-north', kind: 'static', position: [wingMidX, H / 2, WING.minZ - t / 2], size: [wingW + t, H, t] },
  { type: 'box', id: 'wing-south', kind: 'static', position: [wingMidX, H / 2, WING.maxZ + t / 2], size: [wingW + t, H, t] },
  {
    type: 'box',
    id: 'wing-east',
    kind: 'static',
    position: [WING.maxX + t / 2, H / 2, (WING.minZ + WING.maxZ) / 2],
    size: [t, H, wingD],
  },
  { type: 'rack', id: 'rack-3', ...TEAM_RACK, empty: true },
  { type: 'desk', id: 'team-desk-1', position: [7.3, TEAM_DESK_Z], facing: 1 },
  { type: 'desk', id: 'team-desk-2', position: [9.1, TEAM_DESK_Z], facing: 1 },
]

const redW = RED_ROOM.maxX - RED_ROOM.minX
const redD = RED_ROOM.maxZ - RED_ROOM.minZ
const [redMidX, redMidZ] = MAP_TARGETS.red

/** Stanza del red team: quattro muri senza varchi, la scrivania con il PC e una seconda postazione. */
const redRoom: LayoutItem[] = [
  { type: 'box', id: 'red-north', kind: 'static', position: [redMidX, H / 2, RED_ROOM.minZ - t / 2], size: [redW + t * 2, H, t] },
  { type: 'box', id: 'red-south', kind: 'static', position: [redMidX, H / 2, RED_ROOM.maxZ + t / 2], size: [redW + t * 2, H, t] },
  { type: 'box', id: 'red-west', kind: 'static', position: [RED_ROOM.minX - t / 2, H / 2, redMidZ], size: [t, H, redD] },
  { type: 'box', id: 'red-east', kind: 'static', position: [RED_ROOM.maxX + t / 2, H / 2, redMidZ], size: [t, H, redD] },
  { type: 'desk', id: 'red-desk-1', ...RED_PC, pc: 'red' },
  { type: 'desk', id: 'red-desk-2', position: [redMidX + 1.5, RED_ROOM.maxZ - DESK.depth / 2 - 0.1], facing: 1 },
]

const soc: LayoutItem[] = [
  { type: 'box', id: 'video-wall', kind: 'interactive', ...VIDEO_WALL },
  { type: 'workstation', id: 'soc-1', ...STUDY_PC, pc: 'study' },
  { type: 'workstation', id: 'soc-2', ...WORK_PC, pc: 'work' },
  { type: 'workstation', id: 'soc-3', position: [-0.75, SOC_DESK_Z], facing: -1 },
]

const openSpace: LayoutItem[] = [
  // Isola 2×2: le due file si danno le spalle
  { type: 'desk', id: 'desk-1', position: [0.15, 2.0], facing: 1 },
  { type: 'desk', id: 'desk-2', position: [1.85, 2.0], facing: 1 },
  { type: 'desk', id: 'desk-3', position: [0.15, 3.35], facing: -1 },
  { type: 'desk', id: 'desk-4', position: [1.85, 3.35], facing: -1 },
]

const services: LayoutItem[] = [
  {
    type: 'box',
    id: 'printer',
    kind: 'interactive',
    position: [5.4, 0.5, 2.5],
    size: [0.6, 1.0, 0.6],
  },
  {
    type: 'cylinder',
    id: 'access-point',
    kind: 'interactive',
    position: [0, H - 0.05, 0],
    radius: 0.15,
    height: 0.04,
  },
  {
    type: 'box',
    id: 'locker',
    kind: 'static',
    position: [-halfW + 0.25, 1.0, 2.5],
    size: [0.5, 2.0, 1.2],
  },
]

export const LAYOUT: LayoutItem[] = [...walls, ...serverRoom, ...soc, ...openSpace, ...services, ...teamRoom, ...redRoom]

/** Etichette di oggetti singoli (oltre a quelle di zona). */
export const ITEM_LABELS: { id: string; label: string; position: Vec3 }[] = [
  { id: 'study-pc', label: 'PC studio (teoria)', position: [STUDY_PC.position[0], 1.3, STUDY_PC.position[1]] },
  { id: 'work-pc', label: 'PC sistemista (posta, rete)', position: [WORK_PC.position[0], 1.3, WORK_PC.position[1]] },
  { id: 'red-pc', label: 'PC red team (terminale)', position: [RED_PC.position[0], 1.3, RED_PC.position[1]] },
  { id: 'team-rack', label: 'Rack nuovo team', position: [TEAM_RACK.position[0], 2.35, TEAM_RACK.position[1]] },
  { id: 'access-point', label: 'Access point (soffitto)', position: [0, H + 0.25, 0] },
  { id: 'printer', label: 'Stampante di rete', position: [5.4, 1.4, 2.5] },
  { id: 'firewall', label: 'Firewall fw-01', position: [5.2, 2.35, -4.4] },
]
