import { Box3, Group, Line, Mesh, Object3D, Vector3 } from 'three'

export const DESK_COMPUTER_GLB = '/models/computer-tastiera.glb'

/** Larghezza pannello monitor (m), allineata al greybox precedente. */
export const TARGET_MONITOR_WIDTH = 0.54
/** Larghezza tastiera ≈ questa frazione del monitor. */
const KEYBOARD_WIDTH_RATIO = 0.9
/** Sopra questa quota (frazione dell'altezza) le mesh sono monitor/cornice. */
const MONITOR_HEIGHT_FRACTION = 0.42
/** Sotto questa quota le mesh sono tasti (per il calcolo larghezza). */
const KEYBOARD_KEY_HEIGHT_FRACTION = 0.16
/** Inset rispetto al bbox monitor per l'area UI. */
const SCREEN_INSET_X = 0.96
const SCREEN_INSET_Y = 0.9
export const SCREEN_PLANE_DEPTH = 0.002
const SCREEN_PLANE_OFFSET = 0.0015

export type Vec2 = [number, number]
export type Vec3 = [number, number, number]

/** Metriche del modello dopo il fit (spazio locale: Y=0 sul piano scrivania, +Z verso l'operatore con facing -1). */
export interface DeskComputerLayout {
  screen: Vec2
  /** Centro del piano schermo UI in coordinate locali del modello. */
  screenLocal: Vec3
}

/**
 * Allineate a `prepareDeskComputer` su `computer-tastiera.glb` (rigenerare se il modello cambia).
 */
export const DESK_COMPUTER_LAYOUT: DeskComputerLayout = {
  screen: [0.5184, 0.2975],
  screenLocal: [0, 0.24, -0.0691],
}

export interface PreparedDeskComputer {
  root: Object3D
  layout: DeskComputerLayout
}

/** Pannello display sul fronte del monitor (una sola mesh). */
function findDisplayMesh(monitorMeshes: Mesh[]): Mesh | null {
  let best: Mesh | null = null
  let bestArea = 0
  for (const mesh of monitorMeshes) {
    const size = new Vector3()
    meshBox(mesh).getSize(size)
    if (size.z > 0.012 || size.x < 0.22 || size.y < 0.12) continue
    const area = size.x * size.y
    if (area > bestArea) {
      bestArea = area
      best = mesh
    }
  }
  return best
}

function unionBox(target: Box3, box: Box3) {
  target.min.min(box.min)
  target.max.max(box.max)
}

function collectMeshes(root: Object3D) {
  const meshes: Mesh[] = []
  root.traverse((obj) => {
    if (obj instanceof Line) obj.visible = false
    if (obj instanceof Mesh) meshes.push(obj)
  })
  return meshes
}

function meshBox(mesh: Mesh, target = new Box3()) {
  return target.setFromObject(mesh)
}

function hideDisplayPanel(monitorMeshes: Mesh[]) {
  const display = findDisplayMesh(monitorMeshes)
  if (display) display.visible = false
}

function scaleKeyboardKeys(root: Object3D, keyMeshes: Mesh[], monitorWidth: number) {
  if (keyMeshes.length === 0) return

  const keyBox = new Box3()
  for (const mesh of keyMeshes) unionBox(keyBox, meshBox(mesh))
  const keyWidth = keyBox.max.x - keyBox.min.x
  if (keyWidth <= 0) return

  const targetKbWidth = monitorWidth * KEYBOARD_WIDTH_RATIO
  const factor = targetKbWidth / keyWidth
  if (Math.abs(factor - 1) < 0.02) return

  const center = new Vector3()
  keyBox.getCenter(center)
  root.worldToLocal(center)
  const pivot = new Group()
  pivot.position.copy(center)
  root.add(pivot)
  for (const mesh of keyMeshes) pivot.attach(mesh)
  pivot.scale.setScalar(factor)
  pivot.updateMatrixWorld(true)
}

function computeLayout(monitorBox: Box3): DeskComputerLayout {
  const size = new Vector3()
  const center = new Vector3()
  monitorBox.getSize(size)
  monitorBox.getCenter(center)
  return {
    screen: [size.x * SCREEN_INSET_X, size.y * SCREEN_INSET_Y],
    screenLocal: [center.x, center.y, monitorBox.max.z + SCREEN_PLANE_OFFSET],
  }
}

/** Scala e allinea il GLB; corregge la tastiera e nasconde il pannello display del modello. */
export function prepareDeskComputer(scene: Object3D): PreparedDeskComputer {
  const root = scene.clone(true)
  const meshes = collectMeshes(root)

  const whole = new Box3()
  for (const mesh of meshes) unionBox(whole, meshBox(mesh))
  const wholeSize = new Vector3()
  whole.getSize(wholeSize)
  const yMonitorMin = whole.min.y + wholeSize.y * MONITOR_HEIGHT_FRACTION
  const yKeyMax = whole.min.y + wholeSize.y * KEYBOARD_KEY_HEIGHT_FRACTION

  const keyboardKeys: Mesh[] = []
  const monitorMeshes: Mesh[] = []
  const center = new Vector3()
  for (const mesh of meshes) {
    const box = meshBox(mesh)
    box.getCenter(center)
    if (center.y > yMonitorMin) monitorMeshes.push(mesh)
    else if (center.y < yKeyMax) keyboardKeys.push(mesh)
  }

  let monitorBox = new Box3()
  for (const mesh of monitorMeshes) unionBox(monitorBox, meshBox(mesh))
  const monitorSize = new Vector3()
  monitorBox.getSize(monitorSize)
  const scale = monitorSize.x > 0 ? TARGET_MONITOR_WIDTH / monitorSize.x : 1
  root.scale.setScalar(scale)
  root.updateMatrixWorld(true)

  monitorBox = new Box3()
  for (const mesh of monitorMeshes) unionBox(monitorBox, meshBox(mesh))
  monitorBox.getSize(monitorSize)

  scaleKeyboardKeys(root, keyboardKeys, monitorSize.x)

  root.updateMatrixWorld(true)
  const fitted = new Box3().setFromObject(root)
  const fitCenter = new Vector3()
  fitted.getCenter(fitCenter)
  root.position.set(-fitCenter.x, -fitted.min.y, -fitCenter.z)
  root.updateMatrixWorld(true)

  monitorBox = new Box3()
  for (const mesh of monitorMeshes) unionBox(monitorBox, meshBox(mesh))
  const layout = computeLayout(monitorBox)
  hideDisplayPanel(monitorMeshes)
  return { root, layout }
}

/**
 * Centro dello schermo nel mondo per una postazione.
 * Origine modello: appoggiato sul piano scrivania; fronte verso +Z locale (operatore con facing -1).
 */
export function deskScreenWorldCenter(
  pcX: number,
  pcZ: number,
  facing: -1 | 1,
  deskHeight: number,
  monitorOffset: number,
  screenLocal: Vec3,
): Vec3 {
  return [
    pcX + screenLocal[0],
    deskHeight + screenLocal[1],
    pcZ + facing * monitorOffset - facing * screenLocal[2],
  ]
}