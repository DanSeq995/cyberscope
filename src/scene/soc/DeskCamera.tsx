import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { MathUtils, Matrix4, PerspectiveCamera, Quaternion, Vector3 } from 'three'

import { useGameStore } from '@/state/game'

import { DESK_PCS } from '../office/layout'

/** Durata dello zoom (s) e attesa in chiusura perché la pagina HTML sfumi prima di muovere la camera. */
const DURATION = 0.9
const CLOSE_DELAY = 0.2

const easeInOut = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2)

const UP = new Vector3(0, 1, 0)
const center = new Vector3()
const startPos = new Vector3()
const startQuat = new Quaternion()
const targetPos = new Vector3()
const targetQuat = new Quaternion()
const lookAt = new Matrix4()

/**
 * Zoom della camera sul monitor di un PC da scrivania (studio o lavoro). All'apertura salva la posa (occhi del
 * giocatore), scivola davanti allo schermo finché lo riempie, poi passa alla pagina HTML; in chiusura torna
 * esattamente indietro. Il Player smette di muovere la camera finché il PC non è chiuso.
 */
export function DeskCamera() {
  const active = useRef(false)
  const progress = useRef(0)
  const closingWait = useRef(0)

  useFrame(({ camera }, delta) => {
    const { desk, deskPc, setDesk } = useGameStore.getState()

    if (desk === 'closed') {
      // Chiusura brusca (Esc, cambio vista): torna allo sguardo di prima, la posizione la rimette il Player.
      if (active.current) camera.quaternion.copy(startQuat)
      active.current = false
      progress.current = 0
      closingWait.current = 0
      return
    }

    if (!active.current) {
      active.current = true
      startPos.copy(camera.position)
      startQuat.copy(camera.quaternion)
      const fov = (camera as PerspectiveCamera).fov ?? 70
      const monitor = DESK_PCS[deskPc]
      const distance = monitor.screen[1] / (monitor.fill * 2 * Math.tan(MathUtils.degToRad(fov) / 2))
      center.set(...monitor.center)
      targetPos.copy(center).add(new Vector3(0, 0, -monitor.facing * distance))
      targetQuat.setFromRotationMatrix(lookAt.lookAt(targetPos, center, UP))
    }

    if (desk === 'closing') {
      closingWait.current += delta
      if (closingWait.current >= CLOSE_DELAY) progress.current = Math.max(progress.current - delta, 0)
      if (progress.current === 0) {
        camera.position.copy(startPos)
        camera.quaternion.copy(startQuat)
        active.current = false
        setDesk('closed')
        return
      }
    } else {
      progress.current = Math.min(progress.current + delta, DURATION)
      if (desk === 'opening' && progress.current >= DURATION) setDesk('open')
    }

    // Riscritta ogni frame: i movimenti del mouse davanti al PC vengono ignorati.
    const t = easeInOut(progress.current / DURATION)
    camera.position.lerpVectors(startPos, targetPos, t)
    camera.quaternion.slerpQuaternions(startQuat, targetQuat, t)
  })

  return null
}
