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
/** Telaio e maniglia della porta a vetri: senza, il pannello trasparente sembra non muoversi. */
const FRAME = new MeshStandardMaterial({ color: '#3f4650', roughness: 0.4, metalness: 0.6 })
const FRAME_W = 0.06

/** Profili del telaio e maniglia di un pannello a vetri (centrato come il pannello). */
function GlassFrame({ spec, alongZ }: { spec: DoorSpec; alongZ: boolean }) {
  const w = spec.width
  const h = spec.height
  const d = spec.thickness + 0.01
  // [centro lungo il pannello, y, lunghezza lungo il pannello, altezza, spessore]
  const parts: [number, number, number, number, number][] = [
    [-(w - FRAME_W) / 2, 0, FRAME_W, h, d],
    [(w - FRAME_W) / 2, 0, FRAME_W, h, d],
    [0, (h - FRAME_W) / 2, w, FRAME_W, d],
    [0, -(h - FRAME_W * 2) / 2, w, FRAME_W * 2, d],
    // Maniglia verticale sul lato opposto alla cerniera, sporgente da entrambe le facce.
    [w / 2 - 0.14, -0.05, 0.03, 0.45, d + 0.08],
  ]
  return (
    <>
      {parts.map(([along, y, len, hh, depth], i) => (
        <mesh key={i} castShadow material={FRAME} position={alongZ ? [0, y, along] : [along, y, 0]}>
          <boxGeometry args={alongZ ? [depth, hh, len] : [len, hh, depth]} />
        </mesh>
      ))}
    </>
  )
}

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
          {spec.glass && <GlassFrame spec={spec} alongZ={alongZ} />}
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