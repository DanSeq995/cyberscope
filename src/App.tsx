import { Scene } from '@/scene/Scene'
import { useGameStore } from '@/state/game'
import { AlertToast } from '@/ui/AlertToast'
import { CreditsBadge } from '@/ui/CreditsBadge'
import { FirewallAdmin } from '@/ui/firewall/FirewallAdmin'
import { FpsCounter } from '@/ui/FpsCounter'
import { Hud } from '@/ui/Hud'
import { RedTerminal } from '@/ui/red/RedTerminal'
import { SocFullscreen } from '@/ui/SocFullscreen'
import { StudyTheory } from '@/ui/study/StudyTheory'
import { TeamSelect } from '@/ui/TeamSelect'
import { WebexPanel } from '@/ui/webex/WebexPanel'
import { WorkDesktop } from '@/ui/work/WorkDesktop'

function App() {
  const team = useGameStore((s) => s.team)
  const entered = useGameStore((s) => s.entered)

  // Prima di tutto si sceglie la squadra. La scena viene montata alla prima scelta e poi resta montata
  // (smontarla riattiverebbe il bug drei Html / React 19): tornando alla scelta la copre la schermata.
  return (
    <>
      {entered && (
        <>
          <Scene />
          <FpsCounter />
          <Hud />
          <WebexPanel />
          <AlertToast />
          <SocFullscreen />
          <FirewallAdmin />
          <StudyTheory />
          <WorkDesktop />
          <RedTerminal />
          <CreditsBadge />
        </>
      )}
      {!team && <TeamSelect />}
    </>
  )
}

export default App
