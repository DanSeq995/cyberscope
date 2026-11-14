import { MeshStandardMaterial } from 'three'

import { useWorkStore } from '@/state/work'

import { GreyBox } from '../office/GreyBox'
import { RACK_FRONT_Z, STATIONS, TEAM_RACK } from '../office/layout'
import { GuideRing } from '../soc/GuideRing'

/** Frontali degli apparati installati (blu) e cavi di collegamento (gialli). */
const DEVICE_MATERIAL = new MeshStandardMaterial({ color: '#1d4ed8', roughness: 0.5 })
const CABLE_MATERIAL = new MeshStandardMaterial({ color: '#eab308', roughness: 0.7 })

const [X, Z] = TEAM_RACK.position
const FRONT = RACK_FRONT_Z(Z)

/** Dall'alto: firewall (1U), router (1U), server (2U) — lo stesso ordine del percorso sw-core → fw → rt → srv. */
const UNITS = [
  { id: 'fw-02', y: 1.5, height: 0.09 },
  { id: 'rt-02', y: 1.34, height: 0.09 },
  { id: 'srv-03', y: 1.1, height: 0.18 },
]

/**
 * Rack della stanza del nuovo team: anello guida quando il progetto è approvato; dopo l'installazione
 * compaiono gli apparati con i LED accesi e i cavi (solo mesh visive, il collider è quello del rack).
 */
export function TeamRack() {
  const phase = useWorkStore((s) => s.phase)

  if (phase === 'install') return <GuideRing position={STATIONS['team-rack'].position} />
  if (phase !== 'done') return null

  return (
    <group>
      {UNITS.map((unit) => (
        <group key={unit.id}>
          <GreyBox material={DEVICE_MATERIAL} position={[X, unit.y, FRONT]} size={[0.48, unit.height, 0.02]} />
          <mesh position={[X - 0.2, unit.y, FRONT + 0.012]}>
            <boxGeometry args={[0.02, 0.02, 0.004]} />
            <meshBasicMaterial color="#4ade80" />
          </mesh>
        </group>
      ))}
      {/* Cavi: uplink dal firewall verso il soffitto (rete aziendale), poi firewall → router → server */}
      <GreyBox material={CABLE_MATERIAL} position={[X + 0.2, 1.77, FRONT + 0.012]} size={[0.012, 0.46, 0.012]} />
      <GreyBox material={CABLE_MATERIAL} position={[X + 0.14, 1.42, FRONT + 0.012]} size={[0.012, 0.16, 0.012]} />
      <GreyBox material={CABLE_MATERIAL} position={[X + 0.08, 1.22, FRONT + 0.012]} size={[0.012, 0.24, 0.012]} />
    </group>
  )
}
