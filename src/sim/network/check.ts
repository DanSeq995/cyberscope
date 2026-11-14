/**
 * Verifica del progetto di rete rispetto alla richiesta della mail.
 * Non è un simulatore di pacchetti generico: ricostruisce il percorso sw-core → firewall → router → server
 * seguendo i cavi (qualsiasi porta libera va bene, switch aggiuntivi compresi) e controlla indirizzi e regole.
 * I controlli sono in ordine: dopo il primo fallito i successivi non vengono eseguiti.
 */
import { maskBits, matchesTarget, parsePort, parseTarget, sameSubnet } from './ip'
import { SPEC } from './scenario'
import type { Check, Device, Endpoint, FwProtocol, FwRule, Port, Topology } from './types'

interface Packet {
  protocol: Exclude<FwProtocol, 'ip'>
  source: string
  destination: string
  /** Porta di destinazione (solo tcp/udp). */
  port?: number
}

/** true se tutti i campi della regola sono scritti in modo valido. */
export function ruleIsValid(rule: FwRule) {
  return parseTarget(rule.source) !== null && parseTarget(rule.destination) !== null && parsePort(rule.port) !== null
}

function ruleMatches(rule: FwRule, packet: Packet) {
  if (!ruleIsValid(rule)) return false
  if (rule.protocol !== 'ip' && rule.protocol !== packet.protocol) return false
  if (!matchesTarget(rule.source, packet.source) || !matchesTarget(rule.destination, packet.destination)) return false
  if (rule.protocol === 'ip' || packet.port === undefined) return true
  const port = parsePort(rule.port)
  return port === 0 || port === packet.port
}

/** First match dall'alto; se nessuna regola corrisponde vale il deny implicito (`rule` = null). */
export function evaluate(rules: FwRule[], packet: Packet): { allowed: boolean; rule: number | null } {
  const index = rules.findIndex((r) => ruleMatches(r, packet))
  if (index < 0) return { allowed: false, rule: null }
  return { allowed: rules[index].action === 'permit', rule: index }
}

/** Primo firewall del percorso che blocca il pacchetto, oppure l'ultima regola che lo ha fatto passare. */
function throughFirewalls(firewalls: Device[], packet: Packet) {
  let last: { firewall: Device; rule: number | null } | null = null
  for (const firewall of firewalls) {
    const verdict = evaluate(firewall.rules ?? [], packet)
    last = { firewall, rule: verdict.rule }
    if (!verdict.allowed) return { allowed: false, ...last }
  }
  return { allowed: true, firewall: last?.firewall ?? null, rule: last?.rule ?? null }
}

/** Apparati che inoltrano a livello 2: switch e firewall trasparenti aggiunti dal giocatore. */
const isBridge = (d: Device) => d.kind === 'switch' || (d.kind === 'firewall' && !d.locked)

interface Hop {
  device: Device
  port: Port
  /** Firewall trasparenti attraversati per arrivarci. */
  firewalls: Device[]
}

function otherEnds(topology: Topology, device: string, port?: string): Endpoint[] {
  const ends: Endpoint[] = []
  for (const { a, b } of topology.links) {
    if (a.device === device && (port === undefined || a.port === port)) ends.push(b)
    if (b.device === device && (port === undefined || b.port === port)) ends.push(a)
  }
  return ends
}

/** Porte di apparati di livello 3 raggiungibili a livello 2 da un dispositivo (o da una sua porta). */
function reach(topology: Topology, from: { device: string; port?: string }): Hop[] {
  const byId = new Map(topology.devices.map((d) => [d.id, d]))
  const seen = new Set([from.device])
  const hops: Hop[] = []
  const queue = [{ ends: otherEnds(topology, from.device, from.port), firewalls: [] as Device[] }]
  for (let step = queue.shift(); step; step = queue.shift()) {
    for (const end of step.ends) {
      const device = byId.get(end.device)
      if (!device || seen.has(device.id)) continue
      seen.add(device.id)
      if (isBridge(device)) {
        queue.push({
          ends: otherEnds(topology, device.id),
          firewalls: device.kind === 'firewall' ? [...step.firewalls, device] : step.firewalls,
        })
      } else {
        const port = device.ports.find((p) => p.name === end.port)
        if (port) hops.push({ device, port, firewalls: step.firewalls })
      }
    }
  }
  return hops
}

const LABELS: [id: string, label: string][] = [
  ['devices', 'Apparati presenti'],
  ['cabling', 'Cablaggio'],
  ['router', 'Configurazione del router'],
  ['server', 'Configurazione del server'],
  ['ping', `Ping dal server al gateway ${SPEC.lanIp}`],
  ['https', `${SPEC.officePc.name} (${SPEC.officePc.ip}) → server, HTTPS tcp/${SPEC.service.port}: deve passare`],
  ['guest', `${SPEC.guestPc.name} (${SPEC.guestPc.ip}) → server, HTTPS tcp/${SPEC.service.port}: deve essere bloccato`],
  ['rdp', `${SPEC.officePc.name} → server, RDP tcp/3389: deve essere bloccato`],
]

const address = (port: Port) => `${port.ip || 'nessun IP'} / ${port.mask || 'nessuna maschera'}`
const ruleNumber = (rule: number | null) => (rule === null ? 'il deny implicito' : `la regola n. ${rule + 1}`)

/** Esegue i controlli in ordine; `fail(dettaglio)` interrompe la sequenza. */
export function runChecks(topology: Topology): Check[] {
  const results: Check[] = []
  const ok = (detail: string) => {
    const [id, label] = LABELS[results.length]
    results.push({ id, label, status: 'ok', detail })
  }
  const fail = (detail: string) => {
    const [failedId, failedLabel] = LABELS[results.length]
    results.push({ id: failedId, label: failedLabel, status: 'fail', detail })
    for (const [id, label] of LABELS.slice(results.length)) results.push({ id, label, status: 'skip', detail: '' })
    return results
  }

  // 1. Apparati
  const added = topology.devices.filter((d) => !d.locked)
  const missing = (
    [
      ['router', 'un router'],
      ['firewall', 'un firewall'],
      ['server', 'un server'],
    ] as const
  )
    .filter(([kind]) => !added.some((d) => d.kind === kind))
    .map(([, label]) => label)
  if (missing.length > 0) return fail(`Manca ${missing.join(', ')}: aggiungi i dispositivi dalla palette in basso.`)
  ok(added.map((d) => d.name).join(', '))

  // 2. Cablaggio: sw-core → (firewall) → router → server
  const core = SPEC.coreSwitch
  const uplink = reach(topology, { device: core }).find((h) => h.device.kind === 'router' && !h.device.locked)
  if (!uplink) {
    return fail(
      otherEnds(topology, core).some((end) => added.some((d) => d.id === end.device))
        ? `Da ${core} non si arriva a un router: collega ${core} → firewall → router.`
        : `Nessun cavo collega ${core} ai nuovi apparati: usa una sua porta libera.`,
    )
  }
  const router = uplink.device
  if (uplink.firewalls.length === 0) {
    return fail(`Tra ${core} e ${router.name} non c'è il firewall: va messo in mezzo, così protegge anche il router.`)
  }
  let lan: Hop | undefined
  let lanPort: Port | undefined
  for (const port of router.ports) {
    if (port.name === uplink.port.name) continue
    lan = reach(topology, { device: router.id, port: port.name }).find((h) => h.device.kind === 'server' && !h.device.locked)
    if (lan) {
      lanPort = port
      break
    }
  }
  if (!lan || !lanPort) return fail(`Il server non è collegato all'altra porta di ${router.name}.`)
  const server = lan.device
  const firewalls = [...uplink.firewalls, ...lan.firewalls]
  ok(
    `${core} → ${uplink.firewalls.map((f) => f.name).join(' → ')} → ${router.name} (${uplink.port.name}) · ${router.name} (${lanPort.name}) → ${server.name}`,
  )

  // 3. Router
  const up = uplink.port
  for (const port of [up, lanPort]) {
    if (!port.on) return fail(`La porta ${port.name} di ${router.name} è spenta: accendila (Stato porta: On).`)
  }
  if (up.ip === SPEC.lanIp && lanPort.ip === SPEC.uplinkIp) {
    return fail(
      `Gli indirizzi delle due porte di ${router.name} sono scambiati: ${up.name} è quella collegata alla rete aziendale.`,
    )
  }
  const wanted = (port: Port, ip: string, side: string) =>
    port.ip.trim() === ip && maskBits(port.mask) === maskBits(SPEC.mask)
      ? null
      : `${router.name} ${port.name} guarda ${side}: deve avere ${ip} / ${SPEC.mask} (ora: ${address(port)}).`
  const routerError = wanted(up, SPEC.uplinkIp, 'la rete aziendale') ?? wanted(lanPort, SPEC.lanIp, 'la stanza del nuovo team')
  if (routerError) return fail(routerError)
  ok(`${up.name} ${up.ip} · ${lanPort.name} ${lanPort.ip}`)

  // 4. Server
  const nic = lan.port
  if (nic.ip.trim() !== SPEC.serverIp || maskBits(nic.mask) !== maskBits(SPEC.mask)) {
    return fail(`${server.name} deve avere ${SPEC.serverIp} / ${SPEC.mask} (ora: ${address(nic)}).`)
  }
  const gateway = (server.gateway ?? '').trim()
  if (gateway !== lanPort.ip.trim()) {
    return fail(
      sameSubnet(gateway, nic.ip, nic.mask) || gateway === ''
        ? `Il gateway di ${server.name} deve essere la porta del router nella sua rete: ${lanPort.ip} (ora: ${gateway || 'vuoto'}).`
        : `Il gateway ${gateway} non è nella rete di ${server.name}: senza un gateway raggiungibile non esce dalla sua LAN. Usa ${lanPort.ip}.`,
    )
  }
  ok(`${nic.ip} / ${nic.mask}, gateway ${gateway}`)

  // 5. Ping al gateway (passa da un firewall solo se è stato messo tra server e router)
  const ping = throughFirewalls(lan.firewalls, { protocol: 'icmp', source: nic.ip, destination: lanPort.ip })
  if (!ping.allowed) return fail(`${ping.firewall?.name} è tra server e router e blocca il ping (${ruleNumber(ping.rule)}).`)
  ok(`Risposta da ${lanPort.ip}: byte=32 durata<1ms TTL=255`)

  // 6–8. Prove attraverso il firewall
  const https = { protocol: 'tcp', destination: nic.ip, port: SPEC.service.port } as const
  const office = throughFirewalls(firewalls, { ...https, source: SPEC.officePc.ip })
  if (!office.allowed) {
    return fail(
      office.rule === null
        ? `${office.firewall?.name} blocca la connessione: nessuna regola permit corrisponde, quindi vale il deny implicito.`
        : `${office.firewall?.name} blocca la connessione con la regola n. ${office.rule + 1} (deny), che viene valutata prima.`,
    )
  }
  ok(`Connessione riuscita (${office.firewall?.name}, regola n. ${(office.rule ?? 0) + 1})`)

  const guest = throughFirewalls(firewalls, { ...https, source: SPEC.guestPc.ip })
  if (guest.allowed) {
    return fail(
      `${guest.firewall?.name} lascia passare la rete ospiti: ${ruleNumber(guest.rule)} ha una sorgente troppo larga. Limita la sorgente a ${SPEC.officeNet}.`,
    )
  }
  ok(`Bloccato da ${guest.firewall?.name} (${ruleNumber(guest.rule)})`)

  const rdp = throughFirewalls(firewalls, { ...https, source: SPEC.officePc.ip, port: 3389 })
  if (rdp.allowed) {
    return fail(
      `${rdp.firewall?.name} lascia passare anche il Desktop remoto: ${ruleNumber(rdp.rule)} apre troppe porte. Limita la regola a tcp/${SPEC.service.port}.`,
    )
  }
  ok(`Bloccato da ${rdp.firewall?.name} (${ruleNumber(rdp.rule)})`)

  return results
}

export const allPassed = (checks: Check[]) => checks.every((c) => c.status === 'ok')
