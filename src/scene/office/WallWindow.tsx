import { useGLTF } from '@react-three/drei'
import { useMemo } from 'react'

import { WALL_WINDOW } from './layout'
import { prepareWindow, WINDOW_GLB } from './windowFit'

useGLTF.preload(WINDOW_GLB)

/** Finestra appoggiata al muro sud (solo grafica, vedi `WALL_WINDOW`). */
export function WallWindow() {
  const { scene } = useGLTF(WINDOW_GLB)
  const model = useMemo(() => prepareWindow(scene, WALL_WINDOW.width), [scene])

  return (
    <group position={WALL_WINDOW.position} rotation={[0, WALL_WINDOW.yaw, 0]}>
      <primitive object={model} />
    </group>
  )
}
