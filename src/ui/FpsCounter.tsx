import { usePerfStore } from '@/state/perf'

function tone(fps: number) {
  if (fps >= 55) return 'text-emerald-300'
  if (fps >= 35) return 'text-amber-300'
  return 'text-red-300'
}

/** FPS dal loop Three.js (angolo in alto a destra). */
export function FpsCounter() {
  const fps = usePerfStore((s) => s.fps)
  const ms = usePerfStore((s) => s.ms)

  if (fps === 0) return null

  return (
    <div
      className="pointer-events-none fixed top-3 right-3 z-20 rounded bg-black/55 px-2.5 py-1 font-mono text-xs text-white/90 tabular-nums"
      title="FPS mediati sul render WebGL (ultimi ~250 ms)"
    >
      <span className={tone(fps)}>{fps}</span>
      <span className="text-white/50"> fps</span>
      <span className="ml-2 text-white/60">{ms} ms</span>
    </div>
  )
}