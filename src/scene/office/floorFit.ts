import { Box3, Mesh, MeshPhysicalMaterial, MeshStandardMaterial, Object3D, RepeatWrapping, Vector3 } from 'three'

export const FLOOR_TILE_GLB = '/models/floor-tile.glb'

/** Lato logico di una ripetizione texture (m). */
export const FLOOR_TILE_SIZE = 1

function sourceFootprint(scene: Object3D): { x: number; z: number } {
  const box = new Box3().setFromObject(scene)
  const size = new Vector3()
  box.getSize(size)
  return { x: Math.max(size.x, 0.001), z: Math.max(size.z, 0.001) }
}

function findFloorSourceMaterial(scene: Object3D): MeshStandardMaterial | MeshPhysicalMaterial | null {
  let found: MeshStandardMaterial | MeshPhysicalMaterial | null = null
  scene.traverse((obj) => {
    if (found || !(obj instanceof Mesh)) return
    const materials = Array.isArray(obj.material) ? obj.material : [obj.material]
    for (const mat of materials) {
      if (mat instanceof MeshStandardMaterial || mat instanceof MeshPhysicalMaterial) {
        found = mat
        return
      }
    }
  })
  return found
}

/**
 * Materiale del pavimento con texture ripetuta su un piano continuo (niente fughe né vuoti).
 * `repeatU` / `repeatV` = numero di piastrelle sulle dimensioni del piano in metri.
 */
export function createTiledFloorMaterial(
  scene: Object3D,
  repeatU: number,
  repeatV: number,
): MeshStandardMaterial {
  const src = findFloorSourceMaterial(scene)
  if (!src) {
    return new MeshStandardMaterial({ color: '#b4b8bf', roughness: 1 })
  }

  const mat = src.clone()
  mat.transparent = false
  mat.opacity = 1
  mat.depthWrite = true
  if (mat instanceof MeshPhysicalMaterial) {
    mat.transmission = 0
  }

  if (mat.map) {
    mat.map = mat.map.clone()
    mat.map.wrapS = RepeatWrapping
    mat.map.wrapT = RepeatWrapping
    const footprint = sourceFootprint(scene)
    mat.map.repeat.set(
      repeatU * (FLOOR_TILE_SIZE / footprint.x),
      repeatV * (FLOOR_TILE_SIZE / footprint.z),
    )
    mat.map.needsUpdate = true
  }

  mat.needsUpdate = true
  return mat
}