import { Box3, Line, Object3D, Vector3 } from 'three'

import { makeMaterialsStandard } from './gltfOptimize'
import { RACK } from './layout'

export const SERVER_GLB = '/models/server.glb'

/**
 * Armadio rack a pieno volume (come il greybox `RACK`).
 * Spazio locale: base y=0, centrato su x/z (come le coordinate `position` nel layout).
 */
export function prepareRackCabinet(scene: Object3D): Object3D {
  const root = scene.clone(true)
  root.traverse((obj) => {
    if (obj instanceof Line) obj.visible = false
  })
  makeMaterialsStandard(root)

  const box = new Box3().setFromObject(root)
  const size = new Vector3()
  box.getSize(size)
  if (size.x > 0 && size.y > 0 && size.z > 0) {
    root.scale.set(RACK.width / size.x, RACK.height / size.y, RACK.depth / size.z)
  }
  root.updateMatrixWorld(true)

  const fitted = new Box3().setFromObject(root)
  const center = new Vector3()
  fitted.getCenter(center)
  root.position.set(-center.x, -fitted.min.y, -center.z)
  return root
}