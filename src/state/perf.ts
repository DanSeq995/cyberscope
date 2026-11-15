import { create } from 'zustand'

interface PerfState {
  fps: number
  ms: number
  setSample: (fps: number, ms: number) => void
}

export const usePerfStore = create<PerfState>((set) => ({
  fps: 0,
  ms: 0,
  setSample: (fps, ms) => set({ fps, ms }),
}))