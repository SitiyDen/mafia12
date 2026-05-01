import React, { useEffect, useState } from 'react'
import { useGameStore } from './lib/gameStore'
import MainMenu from './components/MainMenu'
import PlayerSetup from './components/PlayerSetup'
import GameScreen from './components/GameScreen'
import './App.css'

export default function App() {
  const screen = useGameStore(state => state.screen)

  useEffect(() => {
    // Register service worker for PWA
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .catch(err => console.log('Service worker registration failed:', err))
    }
  }, [])

  return (
    <div style={{ background: '#0f0f12', color: '#f0eee8', minHeight: '100vh' }}>
      {screen === 'menu' && <MainMenu />}
      {screen === 'playerSetup' && <PlayerSetup />}
      {screen === 'gameplay' && <GameScreen />}
    </div>
  )
}
