import { useGLTF } from '@react-three/drei'
import { useMemo } from 'react'

import {
  DESK_COMPUTER_GLB,
  prepareDeskComputer,
  SCREEN_PLANE_DEPTH,
  type DeskComputerLayout,
} from './deskComputerFit'

export { DESK_COMPUTER_GLB }

function DeskComputerScreen({ layout, color }: { layout: DeskComputerLayout; color: string }) {
  const [w, h] = layout.screen
  const [x, y, z] = layout.screenLocal
  return (
    <mesh position={[x, y, z]}>
      <boxGeometry args={[w, h, SCREEN_PLANE_DEPTH]} />
      <meshBasicMaterial color={color} />
    </mesh>
  )
}

/** Modello 3D di monitor e tastiera sul piano scrivania, con piano UI allineato al pannello. */
export function DeskComputerModel({ screenColor }: { screenColor?: string }) {
  const { scene } = useGLTF(DESK_COMPUTER_GLB)
  const { root, layout } = useMemo(() => prepareDeskComputer(scene), [scene])
  return (
    <group>
      <primitive object={root} />
      {screenColor && <DeskComputerScreen layout={layout} color={screenColor} />}
    </group>
  )
}

useGLTF.preload(DESK_COMPUTER_GLB)