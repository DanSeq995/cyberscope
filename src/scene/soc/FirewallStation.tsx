import { useSocStore } from '@/state/soc'

import { STATIONS } from '../office/layout'
import { GuideRing } from './GuideRing'

/** Anello guida davanti all'armadio di rete: indica dove risolvere l'incidente. */
export function FirewallStation() {
  const visible = useSocStore((s) => s.phase === 'incident')
  if (!visible) return null
  return <GuideRing position={STATIONS.firewall.position} />
}
