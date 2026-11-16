import { useState, type CSSProperties } from 'react'

import { DESK_PCS } from '@/scene/office/layout'
import { useGameStore } from '@/state/game'
import { selectUnread, useWorkStore } from '@/state/work'

import { CloseButton } from '../CloseButton'

import { MailApp } from './MailApp'
import { NetSim } from './NetSim'

const MONITOR = DESK_PCS.work
const [SCREEN_W, SCREEN_H] = MONITOR.screen

/** Stessa forma e occupazione della vista dello schermo 3D a fine zoom. */
const SCREEN_STYLE = {
  height: `min(${MONITOR.fill * 100}vh, ${(MONITOR.fill * 100 * SCREEN_H) / SCREEN_W}vw)`,
  aspectRatio: `${SCREEN_W} / ${SCREEN_H}`,
}

type App = 'mail' | 'net'

/** Schermo del PC del sistemista: compare in dissolvenza a fine zoom sul monitor e sfuma in chiusura. */
export function WorkDesktop() {
  const desk = useGameStore((s) => (s.deskPc === 'work' ? s.desk : 'closed'))
  if (desk !== 'open' && desk !== 'closing') return null
  return <Desktop closing={desk === 'closing'} />
}

function Desktop({ closing }: { closing: boolean }) {
  return (
    <div
      style={{ backgroundColor: MONITOR.bezelColor }}
      // I click non devono arrivare al documento: drei PointerLockControls ricatturerebbe il mouse.
      onClick={(e) => e.stopPropagation()}
      className={`fixed inset-0 z-40 grid cursor-default place-items-center select-none ${
        closing ? 'animate-out fade-out fill-mode-forwards duration-200' : 'animate-in fade-in duration-300'
      }`}
    >
      <DesktopScreen style={SCREEN_STYLE} />
    </div>
  )
}

/**
 * Contenuto dello schermo del PC del sistemista. `preview` = copia in sola lettura sul monitor 3D: mostra la
 * schermata che si aprirebbe adesso (posta se c'è da leggere, altrimenti simulatore), senza pulsante di chiusura.
 */
export function DesktopScreen({ style, preview = false }: { style: CSSProperties; preview?: boolean }) {
  const unread = useWorkStore(selectUnread)
  // Si apre sulla posta finché c'è qualcosa da leggere, poi direttamente sul simulatore.
  const [chosen, setApp] = useState<App>(() => (selectUnread(useWorkStore.getState()) > 0 ? 'mail' : 'net'))
  const app: App = preview ? (unread > 0 ? 'mail' : 'net') : chosen

  const tab = (id: App, label: string, badge = 0) => (
    <button
      type="button"
      onClick={() => setApp(id)}
      className={`flex cursor-pointer items-center gap-2 rounded-t-md px-4 py-1.5 text-sm font-medium ${
        app === id ? 'bg-white text-slate-900' : 'text-slate-200 hover:bg-white/10'
      }`}
    >
      {label}
      {badge > 0 && <span className="rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">{badge}</span>}
    </button>
  )

  return (
    <div
      style={{ ...style, backgroundColor: MONITOR.screenColor }}
      className="flex max-w-full flex-col overflow-hidden text-slate-800"
    >
      <header className="flex items-end justify-between bg-slate-800 px-3 pt-1.5">
        <div className="flex items-end gap-1">
          <span className="mr-3 pb-1.5 text-sm text-slate-300">PC sistemista · admin@netroom.local</span>
          {tab('mail', 'Posta', unread)}
          {tab('net', 'Simulatore di rete')}
        </div>
        <div className="pb-1">{!preview && <CloseButton dark />}</div>
      </header>
      {app === 'mail' ? <MailApp onOpenSimulator={() => setApp('net')} /> : <NetSim />}
    </div>
  )
}
