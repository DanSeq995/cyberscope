import { ruleIsValid } from '@/sim/network/check'
import { maskBits, parseIp, parsePort, parseTarget } from '@/sim/network/ip'
import { KIND_LABEL } from '@/sim/network/scenario'
import type { Device, FwAction, FwProtocol, FwRule } from '@/sim/network/types'
import { useWorkStore } from '@/state/work'

interface FieldProps {
  value: string
  onChange: (value: string) => void
  /** Valore scritto ma non valido: bordo rosso. */
  invalid?: boolean
  disabled?: boolean
  placeholder?: string
  className?: string
}

function Field({ value, onChange, invalid, disabled, placeholder, className = 'w-36' }: FieldProps) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      placeholder={placeholder}
      spellCheck={false}
      autoComplete="off"
      className={`${className} rounded border bg-white px-2 py-1 font-mono text-sm text-slate-900 select-text outline-none focus:border-sky-500 disabled:bg-slate-100 disabled:text-slate-500 ${
        invalid ? 'border-red-500' : 'border-slate-300'
      }`}
    />
  )
}

const badIp = (v: string) => v !== '' && parseIp(v) === null
const badMask = (v: string) => v !== '' && maskBits(v) === null

let ruleCount = 0

const SELECT = 'rounded border border-slate-300 bg-white px-1.5 py-1 text-sm text-slate-900 disabled:bg-slate-100'

function Rules({ device, readOnly }: { device: Device; readOnly: boolean }) {
  const setRules = useWorkStore((s) => s.setRules)
  const rules = device.rules ?? []
  const update = (index: number, patch: Partial<FwRule>) =>
    setRules(device.id, rules.map((r, i) => (i === index ? { ...r, ...patch } : r)))
  const move = (index: number, by: number) => {
    const next = [...rules]
    const [rule] = next.splice(index, 1)
    next.splice(index + by, 0, rule)
    setRules(device.id, next)
  }
  const add = () => {
    ruleCount += 1
    setRules(device.id, [
      ...rules,
      { id: `rule-${ruleCount}`, action: 'permit', protocol: 'tcp', source: '', destination: '', port: '' },
    ])
  }

  return (
    <div>
      <p className="mb-2 text-xs text-slate-500">
        Le regole si valutano dall’alto: vince la prima che corrisponde. Sorgente e destinazione: <code>any</code>, un
        indirizzo (<code>10.0.60.10</code>) o una rete (<code>10.0.1.0/24</code>). Porta: <code>any</code> o un numero.
      </p>
      <table className="w-full text-left text-sm">
        <thead className="text-xs text-slate-500 uppercase">
          <tr>
            <th className="w-6 py-1">#</th>
            <th>Azione</th>
            <th>Protocollo</th>
            <th>Sorgente</th>
            <th>Destinazione</th>
            <th>Porta</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rules.map((rule, i) => {
            const portless = rule.protocol === 'ip' || rule.protocol === 'icmp'
            return (
              <tr key={rule.id} className={ruleIsValid(rule) ? '' : 'bg-red-50'}>
                <td className="py-1 text-slate-500">{i + 1}</td>
                <td>
                  <select
                    className={SELECT}
                    value={rule.action}
                    disabled={readOnly}
                    onChange={(e) => update(i, { action: e.target.value as FwAction })}
                  >
                    <option value="permit">permit</option>
                    <option value="deny">deny</option>
                  </select>
                </td>
                <td>
                  <select
                    className={SELECT}
                    value={rule.protocol}
                    disabled={readOnly}
                    onChange={(e) => {
                      const protocol = e.target.value as FwProtocol
                      update(i, { protocol, port: protocol === 'ip' || protocol === 'icmp' ? 'any' : rule.port })
                    }}
                  >
                    <option value="tcp">tcp</option>
                    <option value="udp">udp</option>
                    <option value="icmp">icmp</option>
                    <option value="ip">ip (tutti)</option>
                  </select>
                </td>
                <td>
                  <Field
                    value={rule.source}
                    onChange={(source) => update(i, { source })}
                    invalid={parseTarget(rule.source) === null}
                    disabled={readOnly}
                    placeholder="any"
                  />
                </td>
                <td>
                  <Field
                    value={rule.destination}
                    onChange={(destination) => update(i, { destination })}
                    invalid={parseTarget(rule.destination) === null}
                    disabled={readOnly}
                    placeholder="any"
                  />
                </td>
                <td>
                  <Field
                    className="w-20"
                    value={rule.port}
                    onChange={(port) => update(i, { port })}
                    invalid={parsePort(rule.port) === null}
                    disabled={readOnly || portless}
                    placeholder="any"
                  />
                </td>
                <td className="text-right whitespace-nowrap">
                  {!readOnly && (
                    <>
                      <IconButton label="Sposta su" disabled={i === 0} onClick={() => move(i, -1)}>
                        ↑
                      </IconButton>
                      <IconButton label="Sposta giù" disabled={i === rules.length - 1} onClick={() => move(i, 1)}>
                        ↓
                      </IconButton>
                      <IconButton label="Elimina regola" onClick={() => setRules(device.id, rules.filter((_, j) => j !== i))}>
                        ✕
                      </IconButton>
                    </>
                  )}
                </td>
              </tr>
            )
          })}
          <tr className="text-slate-400 italic">
            <td className="py-1.5">—</td>
            <td>deny</td>
            <td>ip (tutti)</td>
            <td>any</td>
            <td>any</td>
            <td>any</td>
            <td className="text-right text-xs">implicita</td>
          </tr>
        </tbody>
      </table>
      {!readOnly && (
        <button
          type="button"
          onClick={add}
          className="mt-2 cursor-pointer rounded border border-slate-300 bg-white px-3 py-1 text-sm text-slate-700 hover:bg-slate-100"
        >
          + Aggiungi regola
        </button>
      )}
    </div>
  )
}

function IconButton(props: { label: string; disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={props.label}
      aria-label={props.label}
      disabled={props.disabled}
      onClick={props.onClick}
      className="ml-1 size-7 cursor-pointer rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:cursor-default disabled:opacity-30"
    >
      {props.children}
    </button>
  )
}

/** Finestra di configurazione di un dispositivo (come la scheda Config di Packet Tracer). */
export function DeviceDialog({ deviceId, onClose }: { deviceId: string; onClose: () => void }) {
  const device = useWorkStore((s) => s.topology.devices.find((d) => d.id === deviceId))
  const links = useWorkStore((s) => s.topology.links)
  const devices = useWorkStore((s) => s.topology.devices)
  const approved = useWorkStore((s) => s.phase === 'install' || s.phase === 'done')
  const setPort = useWorkStore((s) => s.setPort)
  const setGateway = useWorkStore((s) => s.setGateway)
  if (!device) return null

  const readOnly = device.locked === true || approved
  const addressed = device.kind === 'router' || device.kind === 'server' || device.kind === 'pc' || device.locked === true
  const hasAddresses = addressed && device.kind !== 'switch' && device.kind !== 'cloud'
  const showRules = device.kind === 'firewall' && !device.locked

  /** Nome del dispositivo e della porta all'altro capo del cavo. */
  const peer = (port: string) => {
    for (const { a, b } of links) {
      const other = a.device === device.id && a.port === port ? b : b.device === device.id && b.port === port ? a : null
      if (other) return `${devices.find((d) => d.id === other.device)?.name ?? '?'} (${other.port})`
    }
    return null
  }

  return (
    <div className="absolute inset-0 z-20 grid place-items-center bg-slate-900/30" onPointerDown={onClose}>
      <div
        className="max-h-[90%] w-[46rem] max-w-[95%] overflow-y-auto rounded-lg border border-slate-300 bg-slate-50 shadow-2xl"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-slate-300 bg-white px-4 py-2.5">
          <div>
            <span className="font-semibold text-slate-900">{device.name}</span>
            <span className="text-slate-500"> · {KIND_LABEL[device.kind]}</span>
            {device.locked && <span className="ml-2 rounded bg-slate-200 px-1.5 py-0.5 text-xs text-slate-600">in produzione · sola lettura</span>}
          </div>
          <button type="button" onClick={onClose} className="cursor-pointer rounded px-2 py-1 text-sm text-slate-600 hover:bg-slate-200">
            ✕ Chiudi
          </button>
        </header>

        <div className="space-y-4 p-4">
          {device.note && <p className="text-sm text-slate-600">{device.note}</p>}

          <table className="w-full text-left text-sm">
            <thead className="text-xs text-slate-500 uppercase">
              <tr>
                <th className="py-1">Porta</th>
                <th>Collegata a</th>
                {device.kind === 'router' && <th>Stato porta</th>}
                {hasAddresses && <th>Indirizzo IP</th>}
                {hasAddresses && <th>Maschera</th>}
              </tr>
            </thead>
            <tbody>
              {device.ports.map((port) => (
                <tr key={port.name}>
                  <td className="py-1 font-mono text-slate-800">{port.name}</td>
                  <td className="text-slate-600">{peer(port.name) ?? <span className="text-slate-400">libera</span>}</td>
                  {device.kind === 'router' && (
                    <td>
                      <label className="flex cursor-pointer items-center gap-1.5 text-slate-700">
                        <input
                          type="checkbox"
                          checked={port.on}
                          disabled={readOnly}
                          onChange={(e) => setPort(device.id, port.name, { on: e.target.checked })}
                        />
                        {port.on ? 'On' : 'Off'}
                      </label>
                    </td>
                  )}
                  {hasAddresses && (
                    <td>
                      <Field
                        value={port.ip}
                        onChange={(ip) => setPort(device.id, port.name, { ip })}
                        invalid={badIp(port.ip)}
                        disabled={readOnly}
                        placeholder="0.0.0.0"
                      />
                    </td>
                  )}
                  {hasAddresses && (
                    <td>
                      <Field
                        value={port.mask}
                        onChange={(mask) => setPort(device.id, port.name, { mask })}
                        invalid={badMask(port.mask)}
                        disabled={readOnly}
                        placeholder="255.255.255.0"
                      />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {device.gateway !== undefined && (
            <label className="flex items-center gap-3 text-sm text-slate-700">
              Gateway predefinito
              <Field
                value={device.gateway}
                onChange={(gateway) => setGateway(device.id, gateway)}
                invalid={badIp(device.gateway)}
                disabled={readOnly}
                placeholder="0.0.0.0"
              />
            </label>
          )}

          {showRules && <Rules device={device} readOnly={readOnly} />}
        </div>
      </div>
    </div>
  )
}
