import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { useGameStore } from './state/game'
import { useRedStore } from './state/red'
import { useSocStore } from './state/soc'
import { useWorkStore } from './state/work'

// Solo in sviluppo: accesso agli store dalla console (debug e test con browser headless).
if (import.meta.env.DEV) {
  Object.assign(window, { __netroom: { game: useGameStore, soc: useSocStore, work: useWorkStore, red: useRedStore } })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
