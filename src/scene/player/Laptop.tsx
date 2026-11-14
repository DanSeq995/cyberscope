import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useRef } from 'react'
import { Color, MathUtils, MeshBasicMaterial, MeshStandardMaterial, PerspectiveCamera, Vector3, type Group } from 'three'

import { useGameStore } from '@/state/game'

import { LAPTOP_D, LAPTOP_W, SCREEN_FILL, SCREEN_H, SCREEN_W } from './laptopScreen'

const W = LAPTOP_W
const D = LAPTOP_D

/**
 * Animazione unica, avanti in apertura e indietro in chiusura (secondi):
 * 0 → RISE_END sale e si apre il coperchio; ZOOM_START → TOTAL si avvicina finché lo schermo riempie la vista.
 */
const RISE_END = 0.6
const ZOOM_START = 0.45
const TOTAL = 1.15
/** In chiusura aspetta che la console HTML sfumi prima di allontanare il portatile. */
const CLOSE_DELAY = 0.2

const LID_OPEN = MathUtils.degToRad(-110)
const TILT_HELD = 0.55
/** Inclinazione che rende lo schermo (coperchio a -110°) perpendicolare allo sguardo. */
const TILT_FACING = Math.atan2(-Math.cos(LID_OPEN), -Math.sin(LID_OPEN))

// depthTest disattivato: il portatile in mano non compenetra mai l'armadio o i muri.
// transparent (con opacità piena) lo mette nella coda dei trasparenti, disegnata dopo: così
// anche le zone colorate semitrasparenti del pavimento non gli finiscono sopra.
const ON_TOP = { depthTest: false, transparent: true } as const
const BODY = new MeshStandardMaterial({ color: '#3f4650', roughness: 0.5, ...ON_TOP })
const KEYS = new MeshStandardMaterial({ color: '#1f242b', roughness: 0.9, ...ON_TOP })
const SCREEN = new MeshBasicMaterial({ color: '#0b1220', ...ON_TOP })
const SCREEN_OFF = new Color('#0b1220')
/** Colore della pagina del browser: a fine zoom lo schermo 3D e la console HTML coincidono. */
const SCREEN_PAGE = new Color('#f1f5f9')

const easeOut = (t: number) => 1 - (1 - t) ** 3
const easeInOut = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2)
const clamp01 = (t: number) => Math.min(Math.max(t, 0), 1)

/** Centro dello schermo nelle coordinate del corpo del portatile, a coperchio aperto. */
const SCREEN_CENTER = new Vector3(0, -0.001, D / 2)
  .applyAxisAngle(new Vector3(1, 0, 0), LID_OPEN)
  .add(new Vector3(0, 0.01, -D / 2))
const X_AXIS = new Vector3(1, 0, 0)
const heldPos = new Vector3()
/**
 * Layer dedicato: la camera lo disegna, ma il raycaster (solo layer 0) lo ignora. Senza, le mesh del
 * portatile, anche invisibili, restano davanti alla camera e l'occlusione di drei nasconde il video wall.
 */
const LAPTOP_LAYER = 1
const zoomPos = new Vector3()

/**
 * Portatile greybox tenuto in mano in prima persona: segue la camera, sale da sotto l'inquadratura,
 * si apre e si avvicina finché lo schermo riempie la vista; poi compare la console HTML in dissolvenza.
 * In chiusura fa lo stesso percorso al contrario.
 */
export function Laptop() {
  const root = useRef<Group>(null)
  const body = useRef<Group>(null)
  const lid = useRef<Group>(null)
  const progress = useRef(0)
  const closingWait = useRef(0)

  useLayoutEffect(() => {
    root.current?.traverse((o) => o.layers.set(LAPTOP_LAYER))
  }, [])

  useFrame(({ camera }, delta) => {
    camera.layers.enable(LAPTOP_LAYER)
    const { view, laptop, setLaptop } = useGameStore.getState()
    const g = root.current
    if (!g || !body.current || !lid.current) return

    if (view !== 'fps' || laptop === 'closed') {
      g.visible = false
      progress.current = 0
      closingWait.current = 0
      return
    }

    if (laptop === 'closing') {
      closingWait.current += delta
      if (closingWait.current >= CLOSE_DELAY) progress.current = Math.max(progress.current - delta, 0)
      if (progress.current === 0) {
        setLaptop('closed')
        return
      }
    } else {
      closingWait.current = 0
      progress.current = Math.min(progress.current + delta, TOTAL)
      if (laptop === 'opening' && progress.current >= TOTAL) setLaptop('open')
    }

    g.visible = true
    g.position.copy(camera.position)
    g.quaternion.copy(camera.quaternion)

    const p = progress.current
    const rise = easeOut(clamp01(p / RISE_END))
    const zoom = easeInOut(clamp01((p - ZOOM_START) / (TOTAL - ZOOM_START)))

    // Posa "in mano": basso e inclinato verso chi guarda.
    heldPos.set(0, MathUtils.lerp(-0.6, -0.24, rise), -0.5)
    // Posa "zoom": schermo centrato davanti agli occhi, alla distanza in cui copre SCREEN_FILL della vista.
    const fov = (camera as PerspectiveCamera).fov ?? 70
    const distance = SCREEN_H / (SCREEN_FILL * 2 * Math.tan(MathUtils.degToRad(fov) / 2))
    zoomPos.set(0, 0, -distance).sub(SCREEN_CENTER.clone().applyAxisAngle(X_AXIS, TILT_FACING))

    body.current.position.lerpVectors(heldPos, zoomPos, zoom)
    body.current.rotation.x = MathUtils.lerp(TILT_HELD, TILT_FACING, zoom)
    lid.current.rotation.x = LID_OPEN * rise
    SCREEN.color.lerpColors(SCREEN_OFF, SCREEN_PAGE, zoom)
  })

  return (
    <group ref={root} visible={false}>
      <group ref={body} position={[0, -0.6, -0.5]} rotation={[TILT_HELD, 0, 0]}>
        <mesh material={BODY} renderOrder={1000}>
          <boxGeometry args={[W, 0.02, D]} />
        </mesh>
        <mesh material={KEYS} renderOrder={1001} position={[0, 0.0105, 0.02]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[W - 0.04, D * 0.55]} />
        </mesh>
        {/* Coperchio incernierato sul bordo posteriore: a 0° è chiuso sopra la tastiera */}
        <group ref={lid} position={[0, 0.01, -D / 2]}>
          <mesh material={BODY} renderOrder={1002} position={[0, 0.006, D / 2]}>
            <boxGeometry args={[W, 0.012, D]} />
          </mesh>
          <mesh material={SCREEN} renderOrder={1003} position={[0, -0.001, D / 2]} rotation={[Math.PI / 2, 0, 0]}>
            <planeGeometry args={[SCREEN_W, SCREEN_H]} />
          </mesh>
        </group>
      </group>
    </group>
  )
}
