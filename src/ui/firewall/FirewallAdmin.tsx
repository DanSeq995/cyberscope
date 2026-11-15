import { useEffect, useRef, useState } from 'react'

import { BEZEL_COLOR, SCREEN_FILL, SCREEN_H, SCREEN_W } from '@/scene/player/laptopScreen'
import {
  DEFAULT_POLICY,
  FIFTY_TARGET,
  FIX_POLICY,
  LOG_HINT,
  OPTIONS,
  QUESTION,
  TAKEAWAY,
  type FirewallPolicy,
} from '@/sim/firewall'
import { useGameStore } from '@/state/game'
import { useKnowledgeStore } from '@/state/knowledge'
import { useSocStore } from '@/state/soc'

import { BrowserTab } from '../BrowserTab'
import { CloseButton } from '../CloseButton'
import { HintButton } from '../HintButton'
import { useLockedScroll } from '../useLockedScroll'

import { SplunkAlertTab } from './SplunkAlertTab'

type Step = 'loading' | 'login' | 'console'
type Tab = 'firewall' | 'splunk'

const USER = 'admin'
const PASSWORD_LENGTH = 10

/** Sequenza automatica: caricamento → login digitato da solo → console. Tempi in ms. */
const T_LOGIN = 500
const T_USER_CHAR = 70
const T_PASS_START = T_LOGIN + USER.length * T_USER_CHAR + 150
const T_PASS_CHAR = 45
const T_SUBMIT = T_PASS_START + PASSWORD_LENGTH * T_PASS_CHAR + 150
const T_CONSOLE = T_SUBMIT + 350

/** Lo schermo HTML ha la stessa forma e la stessa occupazione della vista dello schermo 3D a fine zoom. */
const SCREEN_STYLE = {
  height: `min(${SCREEN_FILL * 100}vh, ${(SCREEN_FILL * 100 * SCREEN_H) / SCREEN_W}vw)`,
  aspectRatio: `${SCREEN_W} / ${SCREEN_H}`,
}

function Key({ children }: { children: React.ReactNode }) {
  return <kbd className="rounded border border-slate-400 bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-700">{children}</kbd>
}

/**
 * Browser del portatile a tutto schermo, con due schede: console del firewall e alert Splunk.
 * Compare in dissolvenza quando lo schermo 3D riempie la vista e sfuma in chiusura.
 */
export function FirewallAdmin() {
  const laptop = useGameStore((s) => s.laptop)
  if (laptop !== 'open' && laptop !== 'closing') return null
  // Montata a ogni apertura: la sequenza di login riparte da capo.
  return <AdminWindow closing={laptop === 'closing'} />
}

function AdminWindow({ closing }: { closing: boolean }) {
  const [step, setStep] = useState<Step>('loading')
  const [tab, setTab] = useState<Tab>('firewall')
  const [typedUser, setTypedUser] = useState(0)
  const [typedPass, setTypedPass] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const splunkTab = useRef<HTMLDivElement>(null)
  const firewallTab = useRef<HTMLDivElement>(null)
  const alertSid = useSocStore((s) => s.alerts[0]?.sid ?? '')

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep('login'), T_LOGIN),
      ...[...USER].map((_, i) => setTimeout(() => setTypedUser(i + 1), T_LOGIN + (i + 1) * T_USER_CHAR)),
      ...Array.from({ length: PASSWORD_LENGTH }, (_, i) =>
        setTimeout(() => setTypedPass(i + 1), T_PASS_START + (i + 1) * T_PASS_CHAR),
      ),
      setTimeout(() => setSubmitting(true), T_SUBMIT),
      setTimeout(() => setStep('console'), T_CONSOLE),
    ]
    return () => timers.forEach(clearTimeout)
  }, [])

  // Rotella e frecce scorrono la scheda attiva (il mouse è in pointer lock sul canvas).
  useLockedScroll(() =>
    (tab === 'splunk' ? splunkTab : firewallTab).current?.querySelector<HTMLElement>('[data-scroll]'),
  )

  // Tab alterna le schede (senza spostare il focus della pagina).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Tab') return
      e.preventDefault()
      if (!e.repeat) setTab((t) => (t === 'firewall' ? 'splunk' : 'firewall'))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const address =
    tab === 'splunk'
      ? `splunk.netroom.local/app/search/alert?sid=${alertSid}`
      : `fw-01.netroom.local/${step === 'console' ? 'admin/policies' : 'admin/login'}`

  return (
    <div
      style={{ backgroundColor: BEZEL_COLOR }}
      // I click non devono arrivare al documento: drei PointerLockControls ricatturerebbe il mouse.
      onClick={(e) => e.stopPropagation()}
      className={`fixed inset-0 z-40 grid cursor-default place-items-center select-none ${
        closing ? 'animate-out fade-out fill-mode-forwards duration-200' : 'animate-in fade-in duration-300'
      }`}
    >
      <div style={SCREEN_STYLE} className="flex max-w-full flex-col overflow-hidden bg-slate-100">
        {/* Barra del browser con le due schede */}
        <div className="flex items-end gap-1 bg-slate-200 px-2 pt-1.5">
          <span className="mr-2 mb-2 flex gap-1.5">
            <span className="size-3 rounded-full bg-red-400" />
            <span className="size-3 rounded-full bg-amber-400" />
            <span className="size-3 rounded-full bg-emerald-400" />
          </span>
          <BrowserTab active={tab === 'splunk'} label="Splunk ES · Alert" dot="bg-red-500" onSelect={() => setTab('splunk')} />
          <BrowserTab active={tab === 'firewall'} label="Cisco Secure Firewall · fw-01" dot="bg-sky-500" onSelect={() => setTab('firewall')} />
          <span className="mb-1.5 ml-auto text-xs text-slate-500">
            clic sulle schede o <Key>Tab</Key>
          </span>
          <span className="mb-1 ml-2">
            <CloseButton />
          </span>
        </div>
        <div className="border-b border-slate-200 bg-white px-3 py-1.5">
          <div className="truncate rounded-md bg-slate-100 px-3 py-1 font-mono text-sm text-slate-600">🔒 https://{address}</div>
        </div>

        <div className="relative min-h-0 flex-1 overflow-hidden bg-slate-50 text-slate-800">
          {/* Entrambe le schede restano montate: cambiando scheda non si perdono i tentativi. */}
          <div ref={splunkTab} className={tab === 'splunk' ? 'h-full' : 'hidden'}>
            <SplunkAlertTab />
          </div>
          <div ref={firewallTab} className={tab === 'firewall' ? 'h-full' : 'hidden'}>
            {step === 'loading' && (
              <div className="grid h-full place-items-center text-slate-500">
                <div className="flex items-center gap-3">
                  <span className="size-5 animate-spin rounded-full border-2 border-slate-300 border-t-sky-600" />
                  Connessione a fw-01…
                </div>
              </div>
            )}
            {step === 'login' && <LoginForm typedUser={typedUser} typedPass={typedPass} submitting={submitting} />}
            {step === 'console' && <PolicyConsole active={tab === 'firewall' && !closing} />}
          </div>
        </div>
      </div>
    </div>
  )
}

function LoginForm({ typedUser, typedPass, submitting }: { typedUser: number; typedPass: number; submitting: boolean }) {
  return (
    <div className="grid h-full place-items-center">
      <div className="w-80 rounded-lg border border-slate-200 bg-white p-6 shadow">
        <p className="text-xs font-medium tracking-wide text-sky-700">Cisco Secure Firewall Management Center</p>
        <h2 className="mb-1 text-lg font-semibold">fw-01 · Accesso amministratore</h2>
        <p className="mb-4 text-xs text-slate-500">fw-01 · firewall perimetrale · sede Netroom</p>
        <label className="mb-1 block text-xs text-slate-500">Utente</label>
        <div className="mb-3 h-9 rounded border border-slate-300 px-2 py-1.5 font-mono">
          {USER.slice(0, typedUser)}
          {typedUser < USER.length && <span className="animate-pulse">|</span>}
        </div>
        <label className="mb-1 block text-xs text-slate-500">Password</label>
        <div className="mb-4 h-9 rounded border border-slate-300 px-2 py-1.5 font-mono tracking-widest">
          {'•'.repeat(typedPass)}
        </div>
        <div
          className={`rounded py-2 text-center font-semibold text-white transition-colors ${submitting ? 'bg-sky-800' : 'bg-sky-600'}`}
        >
          {submitting ? 'Accesso in corso…' : 'Accedi'}
        </div>
      </div>
    </div>
  )
}

function PolicyConsole({ active }: { active: boolean }) {
  const phase = useSocStore((s) => s.phase)
  const policies = useSocStore((s) => s.policies)
  const applyFix = useSocStore((s) => s.applyFix)
  const [wrong, setWrong] = useState<string[]>([])
  const [lastPick, setLastPick] = useState<string | null>(null)
  const result = useRef<HTMLDivElement>(null)
  // Analisi Assistita comprata con i Knowledge Credits (vale per l'incidente in corso).
  const fifty = useKnowledgeStore((s) => s.hints.includes('fw:fifty'))
  const logHint = useKnowledgeStore((s) => s.hints.includes('fw:log'))
  const eliminated = fifty ? FIFTY_TARGET : null

  const solved = phase === 'resolved'

  /** Stessa logica per clic e tasti 1/2/3: le risposte sbagliate già provate sono disattivate. */
  const choose = (option: (typeof OPTIONS)[number]) => {
    if (solved || wrong.includes(option.id) || option.id === eliminated) return
    setLastPick(option.id)
    if (option.correct) applyFix()
    else setWrong((w) => [...w, option.id])
  }
  const chooseRef = useRef(choose)
  useEffect(() => {
    chooseRef.current = choose
  })

  useEffect(() => {
    if (!active) return
    const onKey = (e: KeyboardEvent) => {
      const index = ['Digit1', 'Digit2', 'Digit3', 'Numpad1', 'Numpad2', 'Numpad3'].indexOf(e.code) % 3
      if (index < 0 || e.repeat) return
      chooseRef.current(OPTIONS[index])
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active])

  const picked = OPTIONS.find((o) => o.id === lastPick)

  // Dopo una scelta la pagina scorre da sola fino all'esito.
  useEffect(() => {
    if (lastPick) result.current?.scrollIntoView({ block: 'end', behavior: 'smooth' })
  }, [lastPick, wrong.length, solved])

  return (
    <div data-scroll className="flex h-full flex-col gap-2 overflow-y-auto p-3 text-sm">
      <p className="text-xs font-medium tracking-wide text-sky-700">
        Cisco Secure Firewall Management Center · fw-01 · firewall perimetrale · sede Netroom
      </p>
      <Situation solved={solved} />

      <p className="flex items-center gap-2 text-xs text-slate-600">
        <span className="text-base leading-none text-sky-600">↓</span>
        <span>
          Il firewall legge le policy <b>dall’alto verso il basso</b> e applica <b>la prima che corrisponde</b>: le
          regole sotto non vengono più guardate.
        </span>
      </p>
      <PolicyTable policies={policies} solved={solved} />

      <div className="rounded-lg border border-slate-300 bg-white p-3 shadow-sm">
        <p className="mb-2 font-semibold">{QUESTION}</p>
        <ol className="space-y-1.5">
          {OPTIONS.map((o, i) => {
            const isWrong = wrong.includes(o.id)
            const isOut = o.id === eliminated && !isWrong
            const isRight = solved && o.correct
            const clickable = !solved && !isWrong && !isOut
            return (
              <li
                key={o.id}
                onClick={() => choose(o)}
                className={`flex items-center gap-2 rounded border px-2 py-1 ${
                  isRight
                    ? 'border-emerald-400 bg-emerald-50'
                    : isWrong
                      ? 'border-red-200 bg-red-50 text-slate-400 line-through'
                      : isOut
                        ? 'border-dashed border-amber-300 bg-amber-50/60 text-slate-400 line-through'
                        : 'border-slate-200'
                } ${clickable ? 'cursor-pointer hover:border-sky-400 hover:bg-sky-50' : ''}`}
              >
                <Key>{i + 1}</Key>
                <code className="font-mono">{o.policy}</code>
                <span className="text-slate-500">— {o.position}</span>
                {isOut && <span className="ml-auto text-xs font-semibold inline-block text-amber-700">esclusa dall’analisi</span>}
              </li>
            )
          })}
        </ol>

        {picked && (
          <div
            className={`mt-2 rounded px-3 py-2 ${picked.correct ? 'bg-emerald-100 text-emerald-900' : 'bg-red-100 text-red-900'}`}
          >
            {picked.explanation}
            {!picked.correct && <span className="font-semibold"> Riprova.</span>}
          </div>
        )}

        {!solved && (
          <div className="mt-3 border-t border-slate-200 pt-2">
            <div className="mb-1.5 text-xs font-bold tracking-wide text-slate-500 uppercase">Analisi assistita</div>
            <div className="flex flex-wrap items-start gap-2">
              <HintButton
                id="fw:fifty"
                label="50/50: escludi una risposta sbagliata"
                // Dopo un errore resta una sola risposta sbagliata: il 50/50 non avrebbe senso.
                disabled={wrong.length > 0}
              />
              <HintButton id="fw:log" label="Indizio sul log" />
            </div>
            {logHint && (
              <p className="mt-2 rounded border-l-4 border-amber-500 bg-amber-50 px-3 py-1.5 text-amber-950">
                <span className="font-semibold">Indizio: </span>
                {LOG_HINT}
              </p>
            )}
          </div>
        )}

        {solved ? (
          <div className="mt-2 space-y-1">
            <div className="rounded bg-slate-900 px-3 py-1.5 font-mono text-xs text-emerald-300">
              Test: 192.168.50.23 → srv-01:3389 … BLOCCATO da {FIX_POLICY.id}
            </div>
            <p className="text-xs text-slate-600">
              {TAKEAWAY} · <Key>E</Key> o <b>✕ Chiudi</b> per chiudere il portatile.
            </p>
          </div>
        ) : (
          <p className="mt-2 text-xs text-slate-500">
            Clic su una risposta (o <Key>1</Key> <Key>2</Key> <Key>3</Key>) · scheda <b>Splunk</b> per rivedere l’alert ·{' '}
            <Key>E</Key> o <b>✕ Chiudi</b> per chiudere
          </p>
        )}
        <div ref={result} />
      </div>
    </div>
  )
}

/** Quadro generale: cosa è successo, perché è un problema, cosa fare, con un mini schema di rete. */
function Situation({ solved }: { solved: boolean }) {
  const alert = useSocStore((s) => s.alerts[0])
  const ip = alert?.src_ip ?? '192.168.50.23'
  return (
    <section
      className={`grid grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-4 rounded-lg border p-3 ${
        solved ? 'border-emerald-300 bg-emerald-50' : 'border-red-300 bg-red-50'
      }`}
    >
      <div className="space-y-1">
        <h2 className={`font-semibold ${solved ? 'text-emerald-800' : 'text-red-800'}`}>
          {solved ? 'Incidente risolto' : 'Situazione'}
        </h2>
        <p>
          <b>Cosa è successo:</b> un dispositivo della Wi-Fi ospiti (<code className="font-mono">{ip}</code>) ha aperto il
          Desktop remoto di <b>srv-01</b>.
        </p>
        <p>
          <b>Perché è un problema:</b> gli ospiti devono solo navigare su Internet; con il Desktop remoto si controlla il
          server.
        </p>
        <p>
          <b>Cosa devi fare:</b> aggiungere una policy che blocchi <i>solo</i> quel traffico, senza fermare uffici e ospiti.
        </p>
      </div>
      <div className="space-y-1.5 self-center font-mono text-xs">
        <Flow
          from="Wi-Fi ospiti"
          to="srv-01:3389"
          verdict={solved ? 'bloccato da R0' : 'consentito da R4'}
          ok={solved}
          highlight
        />
        <Flow from="Uffici" to="Server" verdict="consentito da R1" ok />
        <Flow from="Wi-Fi ospiti" to="Internet" verdict="consentito da R3" ok />
      </div>
    </section>
  )
}

function Flow({ from, to, verdict, ok, highlight }: { from: string; to: string; verdict: string; ok: boolean; highlight?: boolean }) {
  const color = ok ? 'text-emerald-700' : 'text-red-700'
  return (
    <div className={`flex items-center gap-1.5 ${highlight ? 'font-bold' : ''}`}>
      <span className="w-28 shrink-0 rounded border border-slate-300 bg-white px-1.5 py-0.5 text-center whitespace-nowrap">{from}</span>
      <span className={color}>→</span>
      <span className="shrink-0 rounded bg-slate-700 px-1.5 py-0.5 text-white">fw-01</span>
      <span className={color}>{ok ? '→' : '⇢'}</span>
      <span className="w-28 shrink-0 rounded border border-slate-300 bg-white px-1.5 py-0.5 text-center whitespace-nowrap">{to}</span>
      <span className={`${color} truncate`}>
        {ok ? '✓' : '✗'} {verdict}
      </span>
    </div>
  )
}

function PolicyTable({ policies, solved }: { policies: FirewallPolicy[]; solved: boolean }) {
  return (
    <table className="w-full border-collapse overflow-hidden rounded border border-slate-200 bg-white text-left">
      <thead className="bg-slate-100 text-xs text-slate-500 uppercase">
        <tr>
          <th className="px-2 py-1">#</th>
          <th className="px-2 py-1">Azione</th>
          <th className="px-2 py-1">Sorgente</th>
          <th className="px-2 py-1">Destinazione</th>
          <th className="px-2 py-1">Servizio</th>
          <th className="px-2 py-1">Descrizione</th>
          <th className="px-2 py-1 text-right">Hit</th>
        </tr>
      </thead>
      <tbody>
        {[...policies, DEFAULT_POLICY].map((p) => {
          const culprit = p.id === 'R4'
          return (
            <tr
              key={p.id}
              className={`border-t border-slate-100 ${
                p.id === FIX_POLICY.id ? 'animate-in fade-in bg-emerald-50 duration-500' : culprit && !solved ? 'bg-red-50' : ''
              }`}
            >
              <td className="px-2 py-1 font-mono font-semibold">{p.id}</td>
              <td className="px-2 py-1">
                <span
                  className={`rounded px-1.5 py-0.5 text-xs font-bold ${p.action === 'permit' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}
                >
                  {p.action.toUpperCase()}
                </span>
              </td>
              <td className="px-2 py-1 whitespace-nowrap">{p.source}</td>
              <td className="px-2 py-1">{p.destination}</td>
              <td className="px-2 py-1 font-mono text-xs whitespace-nowrap">{p.service}</td>
              <td className="px-2 py-1 text-slate-600">
                {p.note}
                {culprit && !solved && (
                  // Su una riga a sé e senza a capo: dentro la cella stretta l'etichetta non si spezza.
                  <span className="mt-1 block w-fit rounded bg-red-600 px-1.5 py-0.5 text-xs font-semibold whitespace-nowrap text-white">
                    ← ha lasciato passare l’ospite
                  </span>
                )}
                {p.id === FIX_POLICY.id && (
                  <span className="mt-1 block w-fit rounded bg-emerald-600 px-1.5 py-0.5 text-xs font-semibold whitespace-nowrap text-white">
                    nuova · ora blocca l’ospite
                  </span>
                )}
              </td>
              <td className="px-2 py-1 text-right font-mono text-xs">{p.hits.toLocaleString('it-IT')}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
