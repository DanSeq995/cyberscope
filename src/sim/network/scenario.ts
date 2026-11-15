/**
 * Scenario della prima richiesta al sistemista: un server per il nuovo team, dietro un router protetto
 * da un firewall. Indirizzi coerenti con l'incidente SOC (LAN uffici 10.0.1.0/24, ospiti 192.168.50.0/24).
 */
import type { Device, DeviceKind, Link, Mail, Port, Topology } from './types'

/** Area di lavoro del simulatore (unità del viewBox SVG). */
export const CANVAS = { width: 1000, height: 520 } as const

/** Riquadro in cui va disegnata la nuova stanza (solo guida visiva). */
export const TEAM_AREA = { x: 600, y: 40, width: 380, height: 440 } as const

/** Valori richiesti dalla mail. */
export const SPEC = {
  coreSwitch: 'sw-core',
  officeNet: '10.0.1.0/24',
  uplinkIp: '10.0.1.254',
  lanIp: '10.0.60.1',
  serverIp: '10.0.60.10',
  mask: '255.255.255.0',
  service: { protocol: 'tcp', port: 443 },
  officePc: { name: 'pc-01', ip: '10.0.1.20' },
  guestPc: { name: 'pc-ospite', ip: '192.168.50.23' },
} as const

const MASK = SPEC.mask

function port(name: string, ip = '', mask = '', on = true): Port {
  return { name, on, ip, mask }
}

const switchPorts = (count: number) => Array.from({ length: count }, (_, i) => port(`Fa0/${i + 1}`))

/** Rete aziendale esistente: non modificabile, ma consultabile. */
const EXISTING: Device[] = [
  { id: 'internet', kind: 'cloud', name: 'Internet', x: 70, y: 70, locked: true, ports: [port('Eth0')] },
  {
    id: 'rt-01',
    kind: 'router',
    name: 'rt-01',
    x: 200,
    y: 70,
    locked: true,
    ports: [port('G0/0', '203.0.113.2', '255.255.255.252'), port('G0/1', '10.0.0.1', '255.255.255.252')],
    note: 'Router di bordo verso il provider.',
  },
  {
    id: 'fw-01',
    kind: 'firewall',
    name: 'fw-01',
    x: 330,
    y: 170,
    locked: true,
    ports: [
      port('wan', '10.0.0.2', '255.255.255.252'),
      port('lan', '10.0.1.1', MASK),
      port('server', '10.0.2.1', MASK),
      port('ospiti', '192.168.50.1', MASK),
    ],
    note: 'Firewall perimetrale: le policy si gestiscono dalla sua console (armadio di rete in sala server). Rotta statica già presente: 10.0.60.0/24 via 10.0.1.254.',
  },
  {
    id: 'sw-srv',
    kind: 'switch',
    name: 'sw-srv',
    x: 130,
    y: 270,
    locked: true,
    ports: switchPorts(4),
    note: 'Switch della sala server.',
  },
  {
    id: 'srv-01',
    kind: 'server',
    name: 'srv-01',
    x: 60,
    y: 400,
    locked: true,
    ports: [port('Fa0', '10.0.2.11', MASK)],
    gateway: '10.0.2.1',
  },
  {
    id: 'srv-02',
    kind: 'server',
    name: 'srv-02',
    x: 190,
    y: 400,
    locked: true,
    ports: [port('Fa0', '10.0.2.12', MASK)],
    gateway: '10.0.2.1',
  },
  {
    id: 'sw-core',
    kind: 'switch',
    name: 'sw-core',
    x: 470,
    y: 270,
    locked: true,
    ports: switchPorts(8),
    note: 'Switch della LAN uffici 10.0.1.0/24: le porte libere si possono usare per i nuovi collegamenti.',
  },
  {
    id: 'pc-01',
    kind: 'pc',
    name: 'pc-01',
    x: 470,
    y: 420,
    locked: true,
    ports: [port('Fa0', SPEC.officePc.ip, MASK)],
    gateway: '10.0.1.1',
    note: 'Un PC degli uffici (LAN uffici).',
  },
  {
    id: 'pc-ospite',
    kind: 'pc',
    name: 'pc-ospite',
    x: 330,
    y: 400,
    locked: true,
    ports: [port('Fa0', SPEC.guestPc.ip, MASK)],
    gateway: '192.168.50.1',
    note: 'Un dispositivo della rete Wi-Fi ospiti.',
  },
]

function link(id: string, a: [string, string], b: [string, string]): Link {
  return { id, a: { device: a[0], port: a[1] }, b: { device: b[0], port: b[1] }, locked: true }
}

const EXISTING_LINKS: Link[] = [
  link('l-internet', ['internet', 'Eth0'], ['rt-01', 'G0/0']),
  link('l-edge', ['rt-01', 'G0/1'], ['fw-01', 'wan']),
  link('l-lan', ['fw-01', 'lan'], ['sw-core', 'Fa0/1']),
  link('l-srv', ['fw-01', 'server'], ['sw-srv', 'Fa0/1']),
  link('l-srv-01', ['sw-srv', 'Fa0/2'], ['srv-01', 'Fa0']),
  link('l-srv-02', ['sw-srv', 'Fa0/3'], ['srv-02', 'Fa0']),
  link('l-pc-01', ['sw-core', 'Fa0/2'], ['pc-01', 'Fa0']),
  link('l-guest', ['fw-01', 'ospiti'], ['pc-ospite', 'Fa0']),
]

export function initialTopology(): Topology {
  return {
    devices: EXISTING.map((d) => ({ ...d, ports: d.ports.map((p) => ({ ...p })) })),
    links: EXISTING_LINKS.map((l) => ({ ...l })),
  }
}

/** Dispositivi che il giocatore può aggiungere dalla palette. */
export const PALETTE: { kind: DeviceKind; label: string; prefix: string }[] = [
  { kind: 'router', label: 'Router', prefix: 'rt' },
  { kind: 'switch', label: 'Switch', prefix: 'sw' },
  { kind: 'firewall', label: 'Firewall', prefix: 'fw' },
  { kind: 'server', label: 'Server', prefix: 'srv' },
]

export const KIND_LABEL: Record<DeviceKind, string> = {
  router: 'Router',
  switch: 'Switch',
  firewall: 'Firewall',
  server: 'Server',
  pc: 'PC',
  cloud: 'Rete esterna',
}

/** Nome del prossimo dispositivo di un tipo: numerazione che prosegue quella esistente (srv-03, rt-02, fw-02…). */
function nextName(prefix: string, devices: Device[]) {
  const used = devices
    .map((d) => new RegExp(`^${prefix}-(\\d+)$`).exec(d.name))
    .filter((m) => m !== null)
    .map((m) => Number(m[1]))
  return `${prefix}-${String(Math.max(0, ...used) + 1).padStart(2, '0')}`
}

let created = 0

/** Nuovo dispositivo con la configurazione di fabbrica. */
export function createDevice(kind: DeviceKind, x: number, y: number, devices: Device[]): Device {
  created += 1
  const prefix = PALETTE.find((p) => p.kind === kind)?.prefix ?? kind
  const base = { id: `new-${created}`, kind, name: nextName(prefix, devices), x, y }
  switch (kind) {
    case 'router':
      // Come in Packet Tracer: le interfacce del router partono spente e senza indirizzo.
      return { ...base, ports: [port('G0/0', '', '', false), port('G0/1', '', '', false)] }
    case 'firewall':
      return {
        ...base,
        ports: [port('Eth1'), port('Eth2')],
        rules: [],
        note: 'Firewall trasparente: filtra il traffico tra le due porte senza avere indirizzi propri.',
      }
    case 'server':
      return { ...base, ports: [port('Fa0')], gateway: '' }
    default:
      return { ...base, ports: switchPorts(4) }
  }
}

export const MAIL_REQUEST: Mail = {
  id: 'team-server',
  from: 'Giulia Ferri',
  role: 'Responsabile IT',
  subject: 'Nuovo server per il team Progetti (stanza est)',
  time: '09:12',
  body: [
    'Ciao,',
    'da lunedì il nuovo team Progetti lavora nella stanza a est dell’open space (la porta è accanto alla stampante). Serve un server applicativo dedicato, raggiungibile dagli uffici solo in HTTPS.',
    'Cosa ti chiedo:',
    `- Server srv-03: IP ${SPEC.serverIp}, maschera ${SPEC.mask}, gateway ${SPEC.lanIp}.`,
    `- Router rt-02: una porta verso la rete aziendale con ${SPEC.uplinkIp} / ${SPEC.mask}, l’altra verso la stanza con ${SPEC.lanIp} / ${SPEC.mask}. Ricordati di accendere le porte.`,
    `- Firewall fw-02 (trasparente, non ha indirizzi) tra lo switch ${SPEC.coreSwitch} e rt-02, così protegge anche il router.`,
    `- Regola su fw-02: permetti solo TCP ${SPEC.service.port} dalla LAN uffici ${SPEC.officeNet} verso ${SPEC.serverIp}. Tutto il resto deve restare bloccato (ospiti compresi).`,
    'La rotta verso 10.0.60.0/24 su fw-01 l’ho già aggiunta io.',
    'Prima progetta e verifica tutto nel Simulatore di rete. Quando la verifica passa, vai nella stanza e monta gli apparati nel rack: il materiale è già lì.',
    'Grazie!',
  ],
}

export const MAIL_DONE: Mail = {
  id: 'team-server-done',
  from: 'Giulia Ferri',
  role: 'Responsabile IT',
  subject: 'Re: Nuovo server per il team Progetti (stanza est)',
  time: '11:47',
  body: [
    'Perfetto, srv-03 risponde in HTTPS dagli uffici e dalla rete ospiti non si vede.',
    'Il team Progetti può iniziare. Grazie per il lavoro pulito!',
  ],
}

/**
 * Suggerimenti dell'Analisi Assistita (a pagamento in Knowledge Credits), uno per controllo di `check.ts`:
 * si compra quello del primo controllo non superato. Indicano dove guardare senza dare la soluzione completa.
 */
export const NET_HINTS: Record<string, string> = {
  devices:
    'Servono tre apparati nuovi: un router per la rete della stanza, un firewall che lo protegga e il server. Trascinali dalla palette dentro il riquadro della nuova stanza.',
  cabling: `L'ordine dei cavi è ${SPEC.coreSwitch} → firewall → router → server: il firewall va in mezzo tra la LAN uffici e il router, il server sull'altra porta del router. Usa una porta libera di ${SPEC.coreSwitch}.`,
  router: `Il router ha due interfacce in due reti diverse: quella verso ${SPEC.coreSwitch} sta nella LAN uffici (${SPEC.uplinkIp}), quella verso il server nella nuova rete (${SPEC.lanIp}). Controlla che entrambe siano accese e non scambiate.`,
  server: `Il server vive nella rete della stanza: indirizzo ${SPEC.serverIp}, maschera ${SPEC.mask}, e come gateway l'interfaccia del router nella sua stessa rete.`,
  ping: 'Se il ping al gateway non passa, tra server e router c\'è un firewall che blocca ICMP: il firewall va messo tra la LAN uffici e il router, non davanti al server.',
  https: `Il firewall nuovo applica il deny implicito: serve una regola permit con sorgente ${SPEC.officeNet}, destinazione ${SPEC.serverIp} e servizio tcp/${SPEC.service.port}, prima di eventuali deny.`,
  guest: `La regola permit è troppo larga sulla sorgente: con "any" passa anche la rete ospiti 192.168.50.0/24. Restringi la sorgente a ${SPEC.officeNet}.`,
  rdp: `La regola permit apre troppe porte: deve consentire solo tcp/${SPEC.service.port}. Tutto il resto, RDP tcp/3389 compreso, lo ferma il deny implicito.`,
}
