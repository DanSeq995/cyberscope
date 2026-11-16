import { ROOM, SERVER, WING, type Vec2, type Vec3 } from './layout'

const SERVER_DOOR_X = 4

export type DoorId = 'entrance' | 'team' | 'server'

const DOOR_W = 1
const DOOR_H = 2.1
const t = ROOM.wallThickness
const halfW = ROOM.width / 2
const halfD = ROOM.depth / 2
const SERVER_MAX_Z = SERVER.maxZ

export interface DoorSpec {
  id: DoorId
  hinge: Vec3
  /** Centro pannello rispetto alla cerniera (spazio locale pre-rotazione). */
  panelOffset: Vec3
  openAngle: number
  /** Asse del muro lungo cui corre il pannello chiuso (default `x`). */
  axis?: 'x' | 'z'
  interact: Vec2
  radius: number
  width: number
  height: number
  thickness: number
  /** Materiale vetro (sala server). */
  glass?: boolean
  /** Porta che non si apre: con E compare questo messaggio al posto dell'apertura. */
  lockedMessage?: string
}

export const DOORS: DoorSpec[] = [
  {
    id: 'entrance',
    hinge: [-4.5 - DOOR_W / 2, 0, halfD + t / 2 - 0.03],
    panelOffset: [DOOR_W / 2, DOOR_H / 2, 0],
    openAngle: (-Math.PI / 2) * 0.92,
    interact: [-4.5, halfD - 0.35],
    radius: 1.25,
    width: DOOR_W,
    height: DOOR_H,
    thickness: 0.05,
    lockedMessage: 'Oggi mezza giornata?',
  },
  {
    id: 'team',
    hinge: [halfW + t / 2 - 0.03, 0, WING.doorZ - DOOR_W / 2],
    panelOffset: [0, DOOR_H / 2, DOOR_W / 2],
    openAngle: (Math.PI / 2) * 0.92,
    axis: 'z',
    interact: [halfW - 0.35, WING.doorZ],
    radius: 1.25,
    width: DOOR_W,
    height: DOOR_H,
    thickness: 0.05,
  },
  {
    id: 'server',
    hinge: [SERVER_DOOR_X - DOOR_W / 2, 0, SERVER_MAX_Z - 0.03],
    panelOffset: [DOOR_W / 2, DOOR_H / 2, 0],
    openAngle: (-Math.PI / 2) * 0.92,
    interact: [SERVER_DOOR_X, SERVER_MAX_Z + 0.6],
    radius: 1.25,
    width: DOOR_W,
    height: DOOR_H,
    thickness: 0.04,
    glass: true,
  },
]

/** Centro del vano porta sul pavimento (punto medio del pannello chiuso). */
function doorCenter(door: DoorSpec): Vec2 {
  const [hx, , hz] = door.hinge
  return door.axis === 'z' ? [hx, hz + door.width / 2] : [hx + door.width / 2, hz]
}

/** Coseno minimo tra sguardo e direzione della porta (~60°): conta la porta che si sta guardando. */
const LOOK_COS = 0.5
/** Sotto questa distanza dal vano la porta vale anche senza guardarla (si è praticamente sulla soglia). */
const THRESHOLD_RADIUS = 0.6

/**
 * Porta con cui si può interagire: entro il raggio del suo punto di interazione e davanti allo sguardo
 * (`lookX`/`lookZ` = direzione orizzontale della camera, normalizzata). Con più porte vince la più vicina.
 * Senza il vincolo dello sguardo, tra porte vicine (sala server e ala del team) il prompt indicava
 * una porta mentre se ne guardava un'altra.
 */
export function doorAt(x: number, z: number, lookX: number, lookZ: number): DoorId | null {
  let best: DoorId | null = null
  let bestD = Infinity
  for (const door of DOORS) {
    const d = Math.hypot(x - door.interact[0], z - door.interact[1])
    if (d > door.radius || d >= bestD) continue
    const [cx, cz] = doorCenter(door)
    const toX = cx - x
    const toZ = cz - z
    const dist = Math.hypot(toX, toZ)
    if (dist > THRESHOLD_RADIUS && (toX * lookX + toZ * lookZ) / dist < LOOK_COS) continue
    best = door.id
    bestD = d
  }
  return best
}

export const doorById = (id: DoorId) => DOORS.find((d) => d.id === id)!
