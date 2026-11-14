import { useGLTF } from '@react-three/drei'
import { useMemo } from 'react'

import { FLOOR_TILE_GLB, createTiledFloorMaterial } from './floorFit'

useGLTF.preload(FLOOR_TILE_GLB)

interface FloorSurfaceProps {
  width: number
  depth: number
  centerX?: number
  centerZ?: number
}

/** Pavimento continuo con texture dalla piastrella GLB, senza griglia di mesh separate. */
export function FloorSurface({ width, depth, centerX = 0, centerZ = 0 }: FloorSurfaceProps) {
  const { scene } = useGLTF(FLOOR_TILE_GLB)
  const material = useMemo(
    () => createTiledFloorMaterial(scene, width / 1, depth / 1),
    [scene, width, depth],
  )

  return (
    <mesh
      rotation-x={-Math.PI / 2}
      position={[centerX, 0.003, centerZ]}
      receiveShadow
      material={material}
    >
      <planeGeometry args={[width, depth]} />
    </mesh>
  )
}