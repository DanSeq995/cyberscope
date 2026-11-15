import { create } from 'zustand'

import type { DoorId } from '@/scene/office/doors'

interface DoorsState {
  open: Record<DoorId, boolean>
  toggle: (id: DoorId) => void
}

export const useDoorsStore = create<DoorsState>((set) => ({
  open: { entrance: false, team: false, server: false },
  toggle: (id) => set((s) => ({ open: { ...s.open, [id]: !s.open[id] } })),
}))