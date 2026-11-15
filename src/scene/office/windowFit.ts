import { Box3, Material, Mesh, MeshBasicMaterial, MeshStandardMaterial, Object3D, Vector3 } from 'three'

import { toOpaqueStandard } from './gltfOptimize'

export const WINDOW_GLB = '/models/finestre.glb'

/** Vetro: lastra quasi trasparente (niente transmission, che rifarebbe il render della scena a ogni frame). */
function glassMaterial(src: MeshStandardMaterial): MeshStandardMaterial {
  return new MeshStandardMaterial({
    name: src.name,
    color: src.color.clone(),
    roughness: 0.05,
    metalness: 0,
    transparent: true,
    opacity: 0.12,
    depthWrite: false,
  })
}

/** Foto dello skyline: non illuminata, così "fuori" sembra giorno anche con le luci attenuate dell'ufficio. */
function viewMaterial(src: MeshStandardMaterial): MeshBasicMaterial {
  return new MeshBasicMaterial({ name: src.name, map: src.map ?? null, color: '#e8e8e8' })
}

/**
 * Finestra a pannello (quattro ante + foto dietro), scalata in modo uniforme a `width` metri.
 * Spazio locale: centrata in x/y, retro (foto) su z = 0, fronte verso +z.
 */
export function prepareWindow(scene: Object3D, width: number): Object3D {
  const root = scene.clone(true)
  const converted = new Map<Material, Material>()
  root.traverse((obj) => {
    if (!(obj instanceof Mesh)) return
    const swap = (m: Material) => {
      let out = converted.get(m)
      if (!out) {
        const std = m as MeshStandardMaterial
        if (std.map) out = viewMaterial(std)
        else if (/vetro/i.test(std.name)) out = glassMaterial(std)
        else out = toOpaqueStandard(std)
        converted.set(m, out)
      }
      return out
    }
    obj.material = Array.isArray(obj.material) ? obj.material.map(swap) : swap(obj.material)
    // Il vetro va disegnato dopo la foto che sta dietro.
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
    if (mats.some((m) => m.transparent)) obj.renderOrder = 1
  })

  const size = new Vector3()
  new Box3().setFromObject(root).getSize(size)
  if (size.x > 0) root.scale.setScalar(width / size.x)
  root.updateMatrixWorld(true)

  const fitted = new Box3().setFromObject(root)
  const center = new Vector3()
  fitted.getCenter(center)
  root.position.set(-center.x, -center.y, -fitted.min.z)
  return root
}
