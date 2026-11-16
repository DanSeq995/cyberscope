import { useKeyboardControls } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { CapsuleCollider, RigidBody, type RapierRigidBody } from '@react-three/rapier'
import { useEffect, useRef } from 'react'
import { Vector3 } from 'three'

import { useGameStore } from '@/state/game'

import { doorAt } from '../office/doors'
import { nearVideoWall, PLAYER, SPAWNS, STATIONS, ZONES, type StationId } from '../office/layout'
import type { Control } from './controls'

const HALF_SEGMENT = (PLAYER.height - PLAYER.radius * 2) / 2
const CENTER_Y = PLAYER.height / 2
const EYE_OFFSET = PLAYER.eyeHeight - CENTER_Y

const forward = new Vector3()
const right = new Vector3()
const move = new Vector3()
const look = new Vector3()
const UP = new Vector3(0, 1, 0)

function zoneAt(x: number, z: number) {
  const zone = ZONES.find(
    ({ center: [cx, cz], size: [w, d] }) => Math.abs(x - cx) <= w / 2 && Math.abs(z - cz) <= d / 2,
  )
  return zone?.id ?? null
}

const STATION_LIST = Object.entries(STATIONS) as [StationId, (typeof STATIONS)[StationId]][]

/** Punto di interazione più vicino tra quelli il cui raggio contiene il giocatore. */
function stationAt(x: number, z: number) {
  let best: StationId | null = null
  let bestDistance = Infinity
  for (const [id, { position, radius }] of STATION_LIST) {
    const distance = Math.hypot(x - position[0], z - position[1])
    if (distance <= radius && distance < bestDistance) {
      best = id
      bestDistance = distance
    }
  }
  return best
}

/**
 * Giocatore in prima persona: capsula dinamica con rotazioni bloccate.
 * La direzione segue lo sguardo della camera (solo sul piano orizzontale).
 */
export function Player() {
  const body = useRef<RapierRigidBody>(null)
  const [, getKeys] = useKeyboardControls<Control>()
  const view = useGameStore((s) => s.view)
  const team = useGameStore((s) => s.team)
  const spawn = SPAWNS[team ?? 'blue']

  // Cambio di squadra: la scena resta montata, il giocatore riparte dallo spawn della nuova stanza.
  useEffect(() => {
    const rb = body.current
    if (!rb || !team) return
    rb.setTranslation({ x: SPAWNS[team][0], y: CENTER_Y + 0.1, z: SPAWNS[team][1] }, true)
    rb.setLinvel({ x: 0, y: 0, z: 0 }, true)
  }, [team])

  useFrame(({ camera }) => {
    const rb = body.current
    if (!rb) return

    const { locked, view: currentView, socFullscreen, laptop, desk } = useGameStore.getState()
    const active = currentView === 'fps' && locked && !socFullscreen && laptop === 'closed' && desk === 'closed'
    const keys = getKeys()

    move.set(0, 0, 0)
    if (active) {
      camera.getWorldDirection(forward)
      forward.y = 0
      forward.normalize()
      right.crossVectors(forward, UP)
      if (keys.forward) move.add(forward)
      if (keys.back) move.sub(forward)
      if (keys.right) move.add(right)
      if (keys.left) move.sub(right)
      if (move.lengthSq() > 0) {
        move.normalize().multiplyScalar(keys.run ? PLAYER.runSpeed : PLAYER.walkSpeed)
      }
    }

    const velocity = rb.linvel()
    rb.setLinvel({ x: move.x, y: velocity.y, z: move.z }, true)

    const p = rb.translation()
    // Rete di sicurezza: se cade fuori dal mondo torna allo spawn.
    if (p.y < -5) {
      rb.setTranslation({ x: spawn[0], y: CENTER_Y + 0.1, z: spawn[1] }, true)
      rb.setLinvel({ x: 0, y: 0, z: 0 }, true)
    }

    const game = useGameStore.getState()
    const zone = zoneAt(p.x, p.z)
    if (zone !== game.zone) game.setZone(zone)
    const near = stationAt(p.x, p.z)
    if (near !== game.near) game.setNear(near)
    camera.getWorldDirection(look)
    const lookLen = Math.hypot(look.x, look.z) || 1
    const nearDoor = near ? null : doorAt(p.x, p.z, look.x / lookLen, look.z / lookLen)
    if (nearDoor !== game.nearDoor) game.setNearDoor(nearDoor)
    const nearWall = nearVideoWall(p.x, p.z)
    if (nearWall !== game.nearWall) game.setNearWall(nearWall)

    // Con un PC da scrivania aperto la camera la guida lo zoom sul monitor (DeskCamera).
    if (currentView === 'fps' && desk === 'closed') {
      camera.position.set(p.x, p.y + EYE_OFFSET, p.z)
    }
  })

  return (
    <RigidBody
      ref={body}
      type="dynamic"
      colliders={false}
      position={[spawn[0], CENTER_Y + 0.1, spawn[1]]}
      enabledRotations={[false, false, false]}
      canSleep={false}
    >
      <CapsuleCollider args={[HALF_SEGMENT, PLAYER.radius]} friction={0} />
      {/* Visibile solo in vista pianta, come riferimento di scala */}
      <mesh visible={view === 'map'} castShadow>
        <capsuleGeometry args={[PLAYER.radius, HALF_SEGMENT * 2, 8, 16]} />
        <meshStandardMaterial color="#38bdf8" />
      </mesh>
    </RigidBody>
  )
}
