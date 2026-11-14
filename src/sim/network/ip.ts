/** Utilità IPv4 per il simulatore di rete. */

/** Indirizzo puntato → intero senza segno, null se non valido. */
export function parseIp(text: string): number | null {
  const parts = text.trim().split('.')
  if (parts.length !== 4) return null
  let value = 0
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null
    const octet = Number(part)
    if (octet > 255) return null
    value = value * 256 + octet
  }
  return value
}

/** Maschera puntata → lunghezza del prefisso, null se non è una maschera valida (bit a 1 contigui). */
export function maskBits(text: string): number | null {
  const mask = parseIp(text)
  if (mask === null) return null
  const inverted = 0xffffffff - mask
  if ((inverted & (inverted + 1)) !== 0) return null
  return 32 - Math.round(Math.log2(inverted + 1))
}

function network(ip: number, bits: number) {
  return bits === 0 ? 0 : Math.floor(ip / 2 ** (32 - bits))
}

/** true se i due indirizzi stanno nella stessa rete con la maschera data. */
export function sameSubnet(a: string, b: string, mask: string) {
  const ia = parseIp(a)
  const ib = parseIp(b)
  const bits = maskBits(mask)
  if (ia === null || ib === null || bits === null) return false
  return network(ia, bits) === network(ib, bits)
}

/** `any`, indirizzo singolo o rete CIDR → rete e prefisso; null se il testo non è valido. */
export function parseTarget(text: string): { ip: number; bits: number } | null {
  const value = text.trim().toLowerCase()
  if (value === 'any') return { ip: 0, bits: 0 }
  const [address, prefix, extra] = value.split('/')
  if (extra !== undefined) return null
  const ip = parseIp(address)
  if (ip === null) return null
  if (prefix === undefined) return { ip, bits: 32 }
  if (!/^\d{1,2}$/.test(prefix) || Number(prefix) > 32) return null
  return { ip, bits: Number(prefix) }
}

/** true se l'indirizzo ricade in `any` / indirizzo / rete CIDR. */
export function matchesTarget(target: string, address: string) {
  const parsed = parseTarget(target)
  const ip = parseIp(address)
  if (!parsed || ip === null) return false
  return network(ip, parsed.bits) === network(parsed.ip, parsed.bits)
}

/** `any` o numero di porta 1–65535 → numero (0 = any), null se non valido. */
export function parsePort(text: string): number | null {
  const value = text.trim().toLowerCase()
  if (value === 'any') return 0
  if (!/^\d{1,5}$/.test(value)) return null
  const port = Number(value)
  return port >= 1 && port <= 65535 ? port : null
}
