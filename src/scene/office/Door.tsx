import { CuboidCollider, RigidBody } from '@react-three/rapier'
import { useFrame } from '@react-three/fiber'
import { useRef, useState } from 'react'
import { Group, MathUtils, MeshStandardMaterial } from 'three'

import { useDoorsStore } from '@/state/doors'

import type { DoorSpec } from './doors'

const WOOD = new MeshStandardMaterial({ color: '#9a8b7a', roughness: 0.85 })
const GLASS = new MeshStandardMaterial({
  color: '#c8e8ff',
  transparent: true,
  opacity: 0.35,
  roughness: 0.1,
  metalness: 0.1,
})

export function Door({ spec }: { spec: DoorSpec }) {
  const open = useDoorsStore((s) => s.open[spec.id])
  const pivot = useRef<Group>(null)
  const angle = useRef(0)
  const [closedForPhysics, setClosedForPhysics] = useState(true)

  useFrame((_, dt) => {
    const target = open ? spec.openAngle : 0
    angle.current = MathUtils.lerp(angle.current, target, Math.min(1, dt * 10))
    if (pivot.current) pivot.current.rotation.y = angle.current
    const physics = !open && Math.abs(angle.current) < 0.05
    setClosedForPhysics((prev) => (prev === physics ? prev : physics))
  })
  const material = spec.glass ? GLASS : WOOD
  // Il pannello corre lungo il muro: su un muro lungo z larghezza e spessore si scambiano.
  const alongZ = spec.axis === 'z'
  const sizeX = alongZ ? spec.thickness : spec.width
  const sizeZ = alongZ ? spec.width : spec.thickness

  return (
    <group position={spec.hinge}>
      <group ref={pivot}>
        <group position={spec.panelOffset}>
          <mesh castShadow receiveShadow material={material}>
            <boxGeometry args={[sizeX, spec.height, sizeZ]} />
          </mesh>
          {closedForPhysics && (
            <RigidBody type="fixed" colliders={false}>
              <CuboidCollider
                args={[sizeX / 2 + (alongZ ? 0.02 : 0), spec.height / 2, sizeZ / 2 + (alongZ ? 0 : 0.02)]}
              />
            </RigidBody>
          )}
        </group>
      </group>
    </group>
  )
}