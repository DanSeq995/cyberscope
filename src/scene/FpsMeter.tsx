import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'

import { usePerfStore } from '@/state/perf'

/** Campiona il delta del render loop WebGL (non il solo rAF della pagina). */
export function FpsMeter() {
  const acc = useRef({ frames: 0, time: 0 })

  useFrame((_, delta) => {
    acc.current.frames += 1
    acc.current.time += delta
    if (acc.current.time < 0.25) return
    const fps = Math.round(acc.current.frames / acc.current.time)
    const ms = Math.round((acc.current.time / acc.current.frames) * 1000)
    usePerfStore.getState().setSample(fps, ms)
    acc.current.frames = 0
    acc.current.time = 0
  })

  return null
}