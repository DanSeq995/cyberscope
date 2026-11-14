import type { HecPayload } from './splunk/client'

/**
 * Scenario simulato: timeline di eventi (offset in secondi dall'avvio) che il bot invia a Splunk
 * via HEC, mescolati a traffico normale di sottofondo.
 *
 * Incidente: la regola R4 del firewall ("temporanea test fornitore", permit any → srv-01) lascia
 * un dispositivo della rete Wi-Fi ospiti raggiungere il Desktop remoto (RDP) di srv-01.
 */

export const GUEST_DEVICE_IP = '192.168.50.23'
export const TARGET_HOST = 'srv-01'
export const RDP_PORT = 3389

interface ScheduledEvent {
  /** Secondi dall'avvio della simulazione. */
  at: number
  payload: Omit<HecPayload, 'time'>
}

/** Durata del ciclo di rumore di fondo (si ripete). */
const NOISE_PERIOD = 120

type Fields = HecPayload['event']

function firewall(event: Fields): Omit<HecPayload, 'time'> {
  return { host: 'fw-01', sourcetype: 'firewall', index: 'security', event }
}

function auth(event: Fields): Omit<HecPayload, 'time'> {
  return { host: event.dest, sourcetype: 'linux_secure', index: 'security', event }
}

function dns(event: Fields): Omit<HecPayload, 'time'> {
  return { host: 'dns-01', sourcetype: 'dns', index: 'security', event }
}

/** PRNG deterministico (mulberry32): lo scenario è uguale a ogni partita. */
function mulberry32(seed: number) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Traffico normale: impiegati (10.0.1.x) che navigano e amministrano i server (R1, R2),
 * ospiti (192.168.50.x) che navigano su Internet (R3). Nessuno di questi deve far scattare alert.
 */
function buildNoise(): ScheduledEvent[] {
  const rand = mulberry32(42)
  const pick = <T,>(items: T[]) => items[Math.floor(rand() * items.length)]
  const users = ['mrossi', 'lbianchi', 'gverdi', 'aneri']
  const noise: ScheduledEvent[] = []
  for (let at = 0.5; at < NOISE_PERIOD; at += 0.8 + rand() * 1.4) {
    const office = `10.0.1.${10 + Math.floor(rand() * 30)}`
    const guest = `192.168.50.${100 + Math.floor(rand() * 50)}`
    const roll = rand()
    if (roll < 0.3) {
      noise.push({ at, payload: firewall({ src_ip: office, dest: 'internet', dest_port: 443, action: 'allowed', rule: 'R2' }) })
    } else if (roll < 0.5) {
      noise.push({ at, payload: firewall({ src_ip: guest, dest: 'internet', dest_port: pick([80, 443]), action: 'allowed', rule: 'R3' }) })
    } else if (roll < 0.7) {
      noise.push({ at, payload: dns({ src_ip: pick([office, guest]), dest: 'dns-01', dest_port: 53, action: 'query' }) })
    } else if (roll < 0.8) {
      // RDP legittimo dagli uffici: consentito da R1, non è un'anomalia.
      noise.push({ at, payload: firewall({ src_ip: office, dest: pick(['srv-01', 'srv-02']), dest_port: 3389, action: 'allowed', rule: 'R1' }) })
    } else {
      noise.push({ at, payload: auth({ src_ip: office, dest: 'srv-02', dest_port: 22, action: 'success', user: pick(users) }) })
    }
  }
  return noise
}

/** Incidente: un ospite si collega in RDP a srv-01 grazie alla regola R4 troppo permissiva. */
function buildIncident(): ScheduledEvent[] {
  return [12, 13.5, 15].map((at) => ({
    at,
    payload: firewall({ src_ip: GUEST_DEVICE_IP, dest: TARGET_HOST, dest_port: RDP_PORT, action: 'allowed', rule: 'R4' }),
  }))
}

const NOISE = buildNoise()
const INCIDENT = buildIncident()

/** Eventi con offset in (from, to]; il rumore si ripete ogni NOISE_PERIOD secondi. */
export function dueEvents(from: number, to: number): ScheduledEvent[] {
  const due = INCIDENT.filter((e) => e.at > from && e.at <= to)
  const cycleStart = Math.floor(from / NOISE_PERIOD) * NOISE_PERIOD
  for (let base = cycleStart; base < to; base += NOISE_PERIOD) {
    for (const e of NOISE) {
      const at = base + e.at
      if (at > from && at <= to) due.push({ at, payload: e.payload })
    }
  }
  return due.sort((a, b) => a.at - b.at)
}
