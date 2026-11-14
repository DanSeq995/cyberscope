import { useRef, useState } from 'react'

import { CANVAS, PALETTE, TEAM_AREA } from '@/sim/network/scenario'
import type { Device, DeviceKind, Endpoint, Link } from '@/sim/network/types'
import { useWorkStore } from '@/state/work'

import { CheckPanel } from './CheckPanel'
import { DeviceDialog } from './DeviceDialog'
import { DeviceIcon } from './DeviceIcon'

type Tool = 'select' | 'cable' | 'delete'

const TOOLS: { id: Tool; label: string; hint: string }[] = [
  { id: 'select', label: 'Seleziona', hint: 'Trascina un dispositivo per spostarlo, cliccalo per configurarlo.' },
  { id: 'cable', label: 'Cavo', hint: 'Clicca il primo dispositivo e scegli la porta, poi il secondo.' },
  { id: 'delete', label: 'Elimina', hint: 'Clicca un dispositivo o un cavo che hai aggiunto per rimuoverlo.' },
]

/** Spostamento minimo (px) perché una pressione conti come trascinamento e non come click. */
const DRAG_THRESHOLD = 4
const MARGIN = 34

/** Alone bianco dietro le etichette: restano leggibili sopra i cavi. */
const HALO = { stroke: '#fff', strokeWidth: 3, paintOrder: 'stroke', strokeLinejoin: 'round' } as const

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max)

interface PortMenu {
  device: string
  /** Posizione nel contenitore dell'area di lavoro (px). */
  left: number
  top: number
}

/**
 * Simulatore di rete del PC del sistemista: area di lavoro con la rete aziendale già disegnata, palette dei
 * dispositivi, strumento cavo con scelta delle porte e finestre di configurazione (impostazione alla Packet Tracer).
 */
export function NetSim() {
  const topology = useWorkStore((s) => s.topology)
  const editable = useWorkStore((s) => s.phase === 'new' || s.phase === 'design')
  const { addDevice, moveDevice, removeDevice, connect, disconnect } = useWorkStore.getState()

  const [tool, setTool] = useState<Tool>('select')
  const [placing, setPlacing] = useState<DeviceKind | null>(null)
  const [pending, setPending] = useState<Endpoint | null>(null)
  const [menu, setMenu] = useState<PortMenu | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)
  const [mouse, setMouse] = useState<[number, number] | null>(null)

  const area = useRef<HTMLDivElement>(null)
  const svg = useRef<SVGSVGElement>(null)
  const drag = useRef<{ id: string; startX: number; startY: number; dx: number; dy: number; moved: boolean } | null>(null)

  const byId = new Map(topology.devices.map((d) => [d.id, d]))

  /** Coordinate del puntatore nel viewBox dell'area di lavoro. */
  const toCanvas = (e: { clientX: number; clientY: number }): [number, number] => {
    const matrix = svg.current?.getScreenCTM()
    if (!matrix) return [0, 0]
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(matrix.inverse())
    return [p.x, p.y]
  }

  const pickTool = (next: Tool) => {
    setTool(next)
    setPlacing(null)
    setPending(null)
    setMenu(null)
  }

  const cancel = () => {
    setPending(null)
    setMenu(null)
  }

  const clickDevice = (device: Device, e: React.PointerEvent) => {
    if (tool === 'select') setOpenId(device.id)
    else if (tool === 'delete') removeDevice(device.id)
    else if (pending?.device !== device.id) {
      const box = area.current?.getBoundingClientRect()
      if (box) setMenu({ device: device.id, left: e.clientX - box.left, top: e.clientY - box.top })
    }
  }

  const pickPort = (port: string) => {
    if (!menu) return
    const end = { device: menu.device, port }
    setMenu(null)
    if (!pending) {
      setPending(end)
      return
    }
    connect(pending, end)
    setPending(null)
    setTool('select')
  }

  const onDevicePointerDown = (device: Device, e: React.PointerEvent<SVGGElement>) => {
    if (placing) return
    e.currentTarget.setPointerCapture(e.pointerId)
    const [x, y] = toCanvas(e)
    drag.current = { id: device.id, startX: e.clientX, startY: e.clientY, dx: device.x - x, dy: device.y - y, moved: false }
  }

  const onDevicePointerMove = (device: Device, e: React.PointerEvent) => {
    const d = drag.current
    if (!d || d.id !== device.id) return
    if (!d.moved && Math.hypot(e.clientX - d.startX, e.clientY - d.startY) < DRAG_THRESHOLD) return
    d.moved = true
    if (tool !== 'select' || device.locked) return
    const [x, y] = toCanvas(e)
    moveDevice(device.id, clamp(x + d.dx, MARGIN, CANVAS.width - MARGIN), clamp(y + d.dy, MARGIN, CANVAS.height - MARGIN))
  }

  const onDevicePointerUp = (device: Device, e: React.PointerEvent) => {
    const d = drag.current
    drag.current = null
    if (d && d.id === device.id && !d.moved) clickDevice(device, e)
  }

  /** Rilascio sull'area di lavoro: posa il dispositivo scelto dalla palette (click-click o trascinamento). */
  const onCanvasPointerUp = (e: React.PointerEvent) => {
    if (!placing) return
    const [x, y] = toCanvas(e)
    addDevice(placing, clamp(x, MARGIN, CANVAS.width - MARGIN), clamp(y, MARGIN, CANVAS.height - MARGIN))
    setPlacing(null)
  }

  const portBusy = (device: string, port: string) =>
    topology.links.some((l) => [l.a, l.b].some((end) => end.device === device && end.port === port))

  const menuDevice = menu ? byId.get(menu.device) : undefined
  const pendingDevice = pending ? byId.get(pending.device) : undefined
  const hint = !editable
    ? 'Progetto approvato: la rete è in sola lettura. Clicca un dispositivo per vederne la configurazione.'
    : placing
      ? 'Clicca nell’area di lavoro per posare il dispositivo.'
      : pending
        ? `Cavo da ${pendingDevice?.name} (${pending.port}): clicca il dispositivo di arrivo.`
        : TOOLS.find((t) => t.id === tool)?.hint

  return (
    <div className="flex min-h-0 flex-1">
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Barra strumenti */}
        <div className="flex items-center gap-2 border-b border-slate-300 bg-slate-100 px-3 py-1.5 text-sm">
          {TOOLS.map((t) => (
            <button
              key={t.id}
              type="button"
              disabled={!editable && t.id !== 'select'}
              onClick={() => pickTool(t.id)}
              className={`cursor-pointer rounded px-3 py-1 font-medium disabled:cursor-default disabled:opacity-40 ${
                tool === t.id && !placing ? 'bg-sky-700 text-white' : 'bg-white text-slate-700 hover:bg-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
          <span className="ml-2 truncate text-slate-600">{hint}</span>
        </div>

        {/* Area di lavoro */}
        <div ref={area} className="relative min-h-0 flex-1 bg-white">
          <svg
            ref={svg}
            viewBox={`0 0 ${CANVAS.width} ${CANVAS.height}`}
            className={`size-full ${placing ? 'cursor-copy' : tool === 'cable' ? 'cursor-crosshair' : ''}`}
            onPointerUp={onCanvasPointerUp}
            onPointerMove={(e) => pending && setMouse(toCanvas(e))}
          >
            <rect width={CANVAS.width} height={CANVAS.height} fill="#fff" onPointerDown={cancel} />
            <rect
              {...TEAM_AREA}
              rx={10}
              fill="#fefce8"
              stroke="#ca8a04"
              strokeDasharray="6 5"
              onPointerDown={cancel}
            />
            <text x={TEAM_AREA.x + 12} y={TEAM_AREA.y + 22} fontSize={14} fill="#a16207" fontWeight={600} pointerEvents="none">
              Stanza nuovo team
            </text>
            <text x={14} y={CANVAS.height - 14} fontSize={12} fill="#94a3b8" pointerEvents="none">
              Rete aziendale esistente (in produzione, non modificabile)
            </text>

            {topology.links.map((link) => (
              <Cable
                key={link.id}
                link={link}
                a={byId.get(link.a.device)}
                b={byId.get(link.b.device)}
                deletable={editable && tool === 'delete' && !link.locked}
                onDelete={() => disconnect(link.id)}
              />
            ))}

            {pendingDevice && mouse && (
              <line
                x1={pendingDevice.x}
                y1={pendingDevice.y}
                x2={mouse[0]}
                y2={mouse[1]}
                stroke="#0369a1"
                strokeWidth={2}
                strokeDasharray="5 4"
                pointerEvents="none"
              />
            )}

            {topology.devices.map((device) => (
              <g
                key={device.id}
                transform={`translate(${device.x} ${device.y})`}
                className={
                  placing ? '' : tool === 'select' && !device.locked && editable ? 'cursor-grab' : 'cursor-pointer'
                }
                onPointerDown={(e) => onDevicePointerDown(device, e)}
                onPointerMove={(e) => onDevicePointerMove(device, e)}
                onPointerUp={(e) => onDevicePointerUp(device, e)}
              >
                {/* Area di presa più grande dell'icona */}
                <rect x={-32} y={-28} width={64} height={70} fill="transparent" />
                {pending?.device === device.id && <circle r={30} fill="none" stroke="#0369a1" strokeWidth={2} strokeDasharray="4 3" />}
                <g opacity={device.locked ? 0.75 : 1}>
                  <DeviceIcon kind={device.kind} />
                </g>
                <text
                  y={38}
                  fontSize={13}
                  textAnchor="middle"
                  fill="#0f172a"
                  fontWeight={device.locked ? 400 : 700}
                  pointerEvents="none"
                  {...HALO}
                >
                  {device.name}
                </text>
              </g>
            ))}
          </svg>

          {/* Scelta della porta per il cavo */}
          {menu && menuDevice && (
            <div
              style={{ left: menu.left + 8, top: menu.top + 8 }}
              className="absolute z-10 min-w-40 rounded-md border border-slate-300 bg-white py-1 text-sm shadow-xl"
            >
              <div className="px-3 py-1 text-xs font-bold text-slate-500 uppercase">{menuDevice.name} · porta</div>
              {menuDevice.ports.map((port) => {
                const busy = portBusy(menuDevice.id, port.name)
                return (
                  <button
                    key={port.name}
                    type="button"
                    disabled={busy}
                    onClick={() => pickPort(port.name)}
                    className="flex w-full cursor-pointer justify-between gap-4 px-3 py-1 text-left font-mono text-slate-800 hover:bg-sky-100 disabled:cursor-default disabled:text-slate-400 disabled:hover:bg-transparent"
                  >
                    {port.name}
                    <span className="font-sans text-xs">{busy ? 'occupata' : 'libera'}</span>
                  </button>
                )
              })}
            </div>
          )}

          {openId && <DeviceDialog deviceId={openId} onClose={() => setOpenId(null)} />}
        </div>

        {/* Palette dei dispositivi */}
        <div className="flex items-center gap-3 border-t border-slate-300 bg-slate-100 px-3 py-2">
          <span className="text-xs font-bold tracking-wide text-slate-500 uppercase">Dispositivi</span>
          {PALETTE.map((item) => (
            <button
              key={item.kind}
              type="button"
              disabled={!editable}
              onPointerDown={() => {
                pickTool('select')
                setPlacing(item.kind)
              }}
              className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-1 text-sm text-slate-800 disabled:cursor-default disabled:opacity-40 ${
                placing === item.kind ? 'border-sky-600 bg-sky-100' : 'border-slate-300 bg-white hover:bg-slate-200'
              }`}
            >
              <svg viewBox="-28 -24 56 48" className="h-8 w-9">
                <DeviceIcon kind={item.kind} />
              </svg>
              {item.label}
            </button>
          ))}
          <span className="text-xs text-slate-500">Clicca un dispositivo e poi l’area di lavoro, oppure trascinalo.</span>
        </div>
      </div>

      <CheckPanel />
    </div>
  )
}

interface CableProps {
  link: Link
  a?: Device
  b?: Device
  deletable: boolean
  onDelete: () => void
}

/** Cavo tra due dispositivi con le "lucine" di stato alle estremità (verde = porta accesa, rosso = spenta). */
function Cable({ link, a, b, deletable, onDelete }: CableProps) {
  if (!a || !b) return null
  const up = [a, b].map((device, i) => device.ports.find((p) => p.name === (i === 0 ? link.a.port : link.b.port))?.on ?? false)
  const color = up[0] && up[1] ? '#22c55e' : '#ef4444'
  const at = (t: number): [number, number] => [a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t]
  const ends: [number, number, string][] = [
    [...at(0.26), link.a.port],
    [...at(0.74), link.b.port],
  ]
  return (
    <g className={deletable ? 'cursor-pointer' : ''} onPointerDown={deletable ? onDelete : undefined}>
      <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={link.locked ? '#94a3b8' : '#0f172a'} strokeWidth={link.locked ? 1.5 : 2.2} />
      {/* Fascia invisibile più larga per cliccare il cavo */}
      <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="transparent" strokeWidth={14} />
      {ends.map(([x, y, port]) => (
        <g key={port + x} pointerEvents="none">
          <circle cx={x} cy={y} r={4} fill={color} stroke="#fff" strokeWidth={1} />
          {!link.locked && (
            <text x={x + 7} y={y - 6} fontSize={10} fill="#475569" {...HALO}>
              {port}
            </text>
          )}
        </g>
      ))}
    </g>
  )
}
