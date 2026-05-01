import React from 'react'
import { useGameStore } from '../lib/gameStore'

export default function MainMenu() {
  const gameHistory = useGameStore(state => state.gameHistory)
  const goToPlayerSetup = useGameStore(state => state.goToPlayerSetup)

  return (
    <div style={{ padding: '20px 16px', maxWidth: 420, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 40, marginTop: 40 }}>
        <div style={{ fontSize: 80, marginBottom: 20 }}>🎭</div>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>Мафия</h1>
        <p style={{ color: '#888' }}>Партийная игра для компании</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
        <button className="bb-btn primary" onClick={goToPlayerSetup} style={{ fontSize: 16 }}>
          ▶ Новая игра
        </button>
        <button className="bb-btn" onClick={() => {}} style={{ fontSize: 16 }}>
          📊 История игр ({gameHistory.length})
        </button>
        <button className="bb-btn" onClick={() => {}} style={{ fontSize: 16 }}>
          🏆 Рейтинг
        </button>
      </div>

      <div style={{ fontSize: 12, color: '#666', textAlign: 'center' }}>
        <p>v1.0.0</p>
      </div>
    </div>
  )
}
