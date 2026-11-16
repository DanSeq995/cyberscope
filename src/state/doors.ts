import { create } from 'zustand'

import { doorById, type DoorId } from '@/scene/office/doors'

interface DoorsState {
  open: Record<DoorId, boolean>
  toggle: (id: DoorId) => void
}

export const useDoorsStore = create<DoorsState>((set) => ({
  open: { entrance: false, team: false, server: false },
  // Le porte con lockedMessage (ingresso) restano chiuse.
  toggle: (id) => {
    if (doorById(id).lockedMessage) return
    set((s) => ({ open: { ...s.open, [id]: !s.open[id] } }))
  },
}))