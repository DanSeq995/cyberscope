import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { useChatStore } from './state/chat'
import { useGameStore } from './state/game'
import { useKnowledgeStore } from './state/knowledge'
import { useRedStore } from './state/red'
import { useSocStore } from './state/soc'
import { useDoorsStore } from './state/doors'
import { useWorkStore } from './state/work'

// Solo in sviluppo: accesso agli store dalla console (debug e test con browser headless).
if (import.meta.env.DEV) {
  Object.assign(window, {
    __netroom: {
      game: useGameStore,
      soc: useSocStore,
      work: useWorkStore,
      red: useRedStore,
      doors: useDoorsStore,
      knowledge: useKnowledgeStore,
      chat: useChatStore,
    },
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
