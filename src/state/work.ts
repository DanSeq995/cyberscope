import { create } from 'zustand'

import { allPassed, runChecks } from '@/sim/network/check'
import { createDevice, initialTopology, MAIL_DONE, MAIL_REQUEST } from '@/sim/network/scenario'
import type { Check, Device, DeviceKind, Endpoint, FwRule, Mail, Port, Topology } from '@/sim/network/types'

/**
 * new = mail non ancora letta · design = progetto nel simulatore di rete · install = verifica superata,
 * resta da montare l'hardware nel rack della nuova stanza · done = apparati installati.
 */
export type WorkPhase = 'new' | 'design' | 'install' | 'done'

interface WorkState {
  phase: WorkPhase
  /** Mail già aperte (id). */
  read: string[]
  topology: Topology
  /** Esito dell'ultima verifica, null se il progetto è cambiato da allora. */
  checks: Check[] | null
  openMail: (id: string) => void
  addDevice: (kind: DeviceKind, x: number, y: number) => void
  moveDevice: (id: string, x: number, y: number) => void
  removeDevice: (id: string) => void
  connect: (a: Endpoint, b: Endpoint) => void
  disconnect: (linkId: string) => void
  setPort: (deviceId: string, port: string, patch: Partial<Omit<Port, 'name'>>) => void
  setGateway: (deviceId: string, gateway: string) => void
  setRules: (deviceId: string, rules: FwRule[]) => void
  /** Esegue i controlli; se passano tutti il progetto è approvato e si passa all'installazione. */
  verify: () => void
  /** Monta gli apparati nel rack della stanza del nuovo team (E davanti al rack). */
  install: () => void
  reset: () => void
}

const initial = () => ({
  phase: 'new' as WorkPhase,
  read: [] as string[],
  topology: initialTopology(),
  checks: null as Check[] | null,
})

let linkCount = 0

/** Il progetto si modifica solo finché non è approvato. */
const editable = (phase: WorkPhase) => phase === 'new' || phase === 'design'

export const useWorkStore = create<WorkState>((set, get) => {
  /** Modifica i dispositivi aggiunti dal giocatore (quelli in produzione sono bloccati) e invalida la verifica. */
  function patchDevice(id: string, change: (device: Device) => Device) {
    const { phase, topology } = get()
    if (!editable(phase)) return
    set({
      checks: null,
      topology: {
        ...topology,
        devices: topology.devices.map((d) => (d.id === id && !d.locked ? change(d) : d)),
      },
    })
  }

  return {
    ...initial(),

    openMail: (id) =>
      set((s) => ({
        read: s.read.includes(id) ? s.read : [...s.read, id],
        phase: s.phase === 'new' && id === MAIL_REQUEST.id ? 'design' : s.phase,
      })),

    addDevice: (kind, x, y) => {
      const { phase, topology } = get()
      if (!editable(phase)) return
      const device = createDevice(kind, x, y, topology.devices)
      set({ checks: null, topology: { ...topology, devices: [...topology.devices, device] } })
    },

    // Solo estetica: non invalida la verifica.
    moveDevice: (id, x, y) =>
      set((s) => ({
        topology: {
          ...s.topology,
          devices: s.topology.devices.map((d) => (d.id === id && !d.locked ? { ...d, x, y } : d)),
        },
      })),

    removeDevice: (id) => {
      const { phase, topology } = get()
      if (!editable(phase) || topology.devices.find((d) => d.id === id)?.locked !== undefined) return
      set({
        checks: null,
        topology: {
          devices: topology.devices.filter((d) => d.id !== id),
          links: topology.links.filter((l) => l.a.device !== id && l.b.device !== id),
        },
      })
    },

    connect: (a, b) => {
      const { phase, topology } = get()
      if (!editable(phase) || a.device === b.device) return
      const busy = (end: Endpoint) =>
        topology.links.some((l) => [l.a, l.b].some((e) => e.device === end.device && e.port === end.port))
      if (busy(a) || busy(b)) return
      linkCount += 1
      set({ checks: null, topology: { ...topology, links: [...topology.links, { id: `cable-${linkCount}`, a, b }] } })
    },

    disconnect: (linkId) => {
      const { phase, topology } = get()
      if (!editable(phase)) return
      set({ checks: null, topology: { ...topology, links: topology.links.filter((l) => l.id !== linkId || l.locked) } })
    },

    setPort: (deviceId, port, patch) =>
      patchDevice(deviceId, (d) => ({ ...d, ports: d.ports.map((p) => (p.name === port ? { ...p, ...patch } : p)) })),
    setGateway: (deviceId, gateway) => patchDevice(deviceId, (d) => ({ ...d, gateway })),
    setRules: (deviceId, rules) => patchDevice(deviceId, (d) => ({ ...d, rules })),

    verify: () => {
      const { phase, topology } = get()
      const checks = runChecks(topology)
      set({ checks, phase: editable(phase) && allPassed(checks) ? 'install' : phase })
    },

    install: () => set((s) => (s.phase === 'install' ? { phase: 'done' } : {})),

    reset: () => set(initial()),
  }
})

/** Mail in arrivo: la richiesta c'è da subito, la conferma arriva a lavoro finito. */
export function inbox(phase: WorkPhase): Mail[] {
  return phase === 'done' ? [MAIL_DONE, MAIL_REQUEST] : [MAIL_REQUEST]
}

export const selectUnread = (s: WorkState) => inbox(s.phase).filter((m) => !s.read.includes(m.id)).length
