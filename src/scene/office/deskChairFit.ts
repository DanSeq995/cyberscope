import { Box3, Line, Mesh, Object3D, Vector3 } from 'three'

import { DESK } from './layout'

export const DESK_CHAIR_GLB = '/models/desk-chair.glb'

/** Sollevamento postazione rispetto al pavimento (m). */
export const DESK_FLOOR_LIFT = 0.2
/** Avvicinamento PC al monitor (m), lato opposto alla sedia. */
export const DESK_PC_TOWARD_MONITOR = 0.1

/** Spessore massimo (m) di un tampo sottilissimo nel GLB sorgente. */
const DESK_TOP_MAX_THICKNESS = 0.003
/** Piano di lavoro visivo: spessore minimo del pannello (m), prima della scala. */
const WORK_SURFACE_MIN_THICKNESS = 0.003
const WORK_SURFACE_MAX_THICKNESS = 0.02
const WORK_SURFACE_MIN_FOOTPRINT = 0.05

export interface DeskChairLayout {
  /** Altezza del piano di lavoro in spazio locale (y=0 = base postazione sul sollevamento). */
  deskTopY: number
  baseYaw: number
  footprint: [number, number]
}

export const DESK_CHAIR_LAYOUT: DeskChairLayout = {
  deskTopY: 0.516,
  baseYaw: Math.PI,
  footprint: [1.6, 1.18],
}

function meshBox(mesh: Mesh, target = new Box3()) {
  return target.setFromObject(mesh)
}

function isThinDeskTop(mesh: Mesh): boolean {
  const size = new Vector3()
  meshBox(mesh).getSize(size)
  if (size.y > DESK_TOP_MAX_THICKNESS || size.y <= 0) return false
  const footprint = Math.max(size.x, size.z)
  const depth = Math.min(size.x, size.z)
  return footprint > 0.015 && footprint / depth >= 1.2
}

/** Pannello orizzontale del piano (esclusi i tamponi sottilissimi sopra al monitor). */
function isWorkSurface(mesh: Mesh): boolean {
  const size = new Vector3()
  meshBox(mesh).getSize(size)
  return (
    size.y >= WORK_SURFACE_MIN_THICKNESS &&
    size.y <= WORK_SURFACE_MAX_THICKNESS &&
    Math.max(size.x, size.z) >= WORK_SURFACE_MIN_FOOTPRINT
  )
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

export interface PreparedDeskChair {
  root: Object3D
  layout: DeskChairLayout
}

/**
 * Scala sul tampo largo a `DESK.width`; piano PC sul pannello di lavoro visivo.
 */
export function prepareDeskChair(scene: Object3D): PreparedDeskChair {
  const root = scene.clone(true)
  const meshes = collectMeshes(root)
  const deskTops = meshes.filter(isThinDeskTop)

  let deskBox = new Box3()
  for (const mesh of deskTops.length > 0 ? deskTops : meshes) unionBox(deskBox, meshBox(mesh))
  const deskSize = new Vector3()
  deskBox.getSize(deskSize)
  const scale = deskSize.x > 0 ? DESK.width / deskSize.x : 1
  root.scale.setScalar(scale)
  root.updateMatrixWorld(true)

  const fitted = new Box3().setFromObject(root)
  const center = new Vector3()
  fitted.getCenter(center)
  root.position.set(-center.x, -fitted.min.y, -center.z)
  root.updateMatrixWorld(true)

  const workSurfaces = meshes.filter(isWorkSurface)
  const surfaceBox = new Box3()
  for (const mesh of workSurfaces.length > 0 ? workSurfaces : deskTops) unionBox(surfaceBox, meshBox(mesh))
  const deskTopY = surfaceBox.max.y

  const footprint = new Vector3()
  new Box3().setFromObject(root).getSize(footprint)

  return {
    root,
    layout: {
      deskTopY,
      baseYaw: Math.PI,
      footprint: [footprint.x, footprint.z],
    },
  }
}

export function deskSurfaceWorldY(deskTopY = DESK_CHAIR_LAYOUT.deskTopY) {
  return DESK_FLOOR_LIFT + deskTopY
}