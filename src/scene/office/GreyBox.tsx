import { MeshStandardMaterial } from 'three'

import type { Kind, Vec3 } from './layout'

/** Materiali condivisi della greybox: grigio = statico, arancio = interazione, azzurro = vetro. */
const MATERIALS: Record<Kind, MeshStandardMaterial> = {
  static: new MeshStandardMaterial({ color: '#8a8f98', roughness: 0.9 }),
  interactive: new MeshStandardMaterial({ color: '#f97316', roughness: 0.6 }),
  glass: new MeshStandardMaterial({
    color: '#9ec5e8',
    transparent: true,
    opacity: 0.25,
    depthWrite: false,
  }),
}

/** Variante più scura per corpi tecnici (rack, monitor) che restano statici. */
export const DARK_MATERIAL = new MeshStandardMaterial({ color: '#4b5059', roughness: 0.8 })

/** Server sotto attacco: rosso emissivo, l'intensità pulsa (animata da SocDriver). */
export const ALARM_MATERIAL = new MeshStandardMaterial({
  color: '#7f1d1d',
  emissive: '#ef4444',
  emissiveIntensity: 1,
  roughness: 0.6,
})

interface GreyBoxProps {
  position: Vec3
  size: Vec3
  kind?: Kind
  material?: MeshStandardMaterial
}

export function GreyBox({ position, size, kind = 'static', material }: GreyBoxProps) {
  const isGlass = kind === 'glass'
  return (
    <mesh position={position} castShadow={!isGlass} receiveShadow material={material ?? MATERIALS[kind]}>
      <boxGeometry args={size} />
    </mesh>
  )
}

interface GreyCylinderProps {
  position: Vec3
  radius: number
  height: number
  kind?: Kind
  material?: MeshStandardMaterial
}

export function GreyCylinder({ position, radius, height, kind = 'static', material }: GreyCylinderProps) {
  return (
    <mesh position={position} castShadow receiveShadow material={material ?? MATERIALS[kind]}>
      <cylinderGeometry args={[radius, radius, height, 16]} />
    </mesh>
  )
}
