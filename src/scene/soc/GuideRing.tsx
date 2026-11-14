import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Mesh, MeshBasicMaterial } from 'three'

import type { Vec2 } from '../office/layout'

/** Anello giallo pulsante a terra: indica dove andare per il prossimo passo. */
export function GuideRing({ position: [x, z] }: { position: Vec2 }) {
  const ring = useRef<Mesh>(null)

  useFrame(({ clock }) => {
    if (!ring.current) return
    const pulse = 0.5 + 0.5 * Math.sin(clock.elapsedTime * 4)
    ring.current.scale.setScalar(0.9 + 0.15 * pulse)
    ;(ring.current.material as MeshBasicMaterial).opacity = 0.45 + 0.4 * pulse
  })

  return (
    <mesh ref={ring} position={[x, 0.02, z]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.45, 0.6, 48]} />
      <meshBasicMaterial color="#facc15" transparent depthWrite={false} />
    </mesh>
  )
}
