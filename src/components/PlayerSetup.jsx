import React, { useState, useEffect, useRef } from 'react'
import { useGameStore } from '../lib/gameStore'

const API_URL = '/mafia-api/change/players'

export default function PlayerSetup() {
  const players = useGameStore(state => state.players)
  const setPlayerNickname = useGameStore(state => state.setPlayerNickname)
  const startGame = useGameStore(state => state.startGame)
  const goToMenu = useGameStore(state => state.goToMenu)

  const [nicknames, setNicknames] = useState(
    players.reduce((acc, p) => ({ ...acc, [p.seatNumber]: p.nickname || '' }), {})
  )
  const [apiPlayers, setApiPlayers] = useState([])
  const [loadingApi, setLoadingApi] = useState(false)
  const [apiError, setApiError] = useState(null)
  const [activeSeat, setActiveSeat] = useState(null)
  const dropdownRef = useRef(null)

  useEffect(() => {
    fetchPlayers()
  }, [])

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setActiveSeat(null)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const fetchPlayers = async () => {
    setLoadingApi(true)
    setApiError(null)
    try {
      const res = await fetch(API_URL, { credentials: 'include' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setApiPlayers(Array.isArray(data) ? data : [])
    } catch (e) {
      setApiError('Не удалось загрузить')
    } finally {
      setLoadingApi(false)
    }
  }

  const handleNicknameChange = (seatNumber, value) => {
    setNicknames(prev => ({ ...prev, [seatNumber]: value }))
  }

  const handleSelectSuggestion = (seatNumber, name) => {
    setNicknames(prev => ({ ...prev, [seatNumber]: name }))
    setActiveSeat(null)
  }

  const handleStart = () => {
    Object.entries(nicknames).forEach(([seatNumber, nickname]) => {
      if (nickname.trim()) {
        setPlayerNickname(parseInt(seatNumber), nickname)
      }
    })
    startGame()
  }

  const usedNames = new Set(
    Object.entries(nicknames)
      .filter(([, v]) => v.trim())
      .map(([, v]) => v.trim())
  )

  const handleShuffle = () => {
    const filled = Object.entries(nicknames)
      .filter(([, v]) => v.trim())
      .map(([, v]) => v)
    for (let i = filled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [filled[i], filled[j]] = [filled[j], filled[i]]
    }
    const seats = Object.keys(nicknames).map(Number).sort((a, b) => a - b)
    const next = { ...nicknames }
    seats.forEach((seat, i) => {
      next[seat] = filled[i] ?? ''
    })
    setNicknames(next)
  }

  const getSuggestions = (seatNumber) => {
    const currentValue = (nicknames[seatNumber] || '').trim().toLowerCase()
    return apiPlayers.filter(name => {
      if (usedNames.has(name) && nicknames[seatNumber]?.trim() !== name) return false
      if (currentValue && !name.toLowerCase().includes(currentValue)) return false
      return true
    })
  }

  return (
    <div style={{ padding: '16px 14px', maxWidth: 420, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700 }}>Игроки</h2>
        <button
          className="sheet-close"
          onClick={goToMenu}
          style={{ position: 'relative', float: 'none' }}
        >
          ✕
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <p className="sheet-sub" style={{ margin: 0 }}>Введите никнеймы</p>
        <button
          onClick={handleShuffle}
          style={{
            marginLeft: 'auto',
            padding: '5px 10px',
            background: '#1e1e2e',
            border: '1px solid #2a2a35',
            borderRadius: 8,
            color: '#a0a0c0',
            fontSize: 12,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            fontFamily: 'inherit',
          }}
        >
          🔀 Перемешать
        </button>
        <button
          onClick={fetchPlayers}
          disabled={loadingApi}
          style={{
            padding: '5px 10px',
            background: '#1e1e2e',
            border: '1px solid #2a2a35',
            borderRadius: 8,
            color: loadingApi ? '#555' : '#a0a0c0',
            fontSize: 12,
            cursor: loadingApi ? 'default' : 'pointer',
            whiteSpace: 'nowrap',
            fontFamily: 'inherit',
          }}
        >
          {loadingApi ? '…' : apiError ? '↺' : `↺ ${apiPlayers.length}`}
        </button>
      </div>

      {apiError && (
        <p style={{ fontSize: 12, color: '#e24b4a', marginBottom: 12 }}>{apiError}</p>
      )}

      <div style={{ marginBottom: 24 }} ref={dropdownRef}>
        {players.map(player => {
          const suggestions = getSuggestions(player.seatNumber)
          const showDropdown = activeSeat === player.seatNumber && suggestions.length > 0

          return (
            <div key={player.seatNumber} style={{ marginBottom: 8, position: 'relative', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <div style={{
                width: 28,
                height: 44,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 13,
                fontWeight: 700,
                color: '#555',
                flexShrink: 0,
              }}>
                {player.seatNumber}
              </div>
              <div style={{ flex: 1, position: 'relative' }}>
              <input
                type="text"
                placeholder={`Игрок ${player.seatNumber}`}
                value={nicknames[player.seatNumber]}
                onChange={(e) => handleNicknameChange(player.seatNumber, e.target.value)}
                onFocus={() => setActiveSeat(player.seatNumber)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  background: '#18181f',
                  border: showDropdown ? '1px solid #3a3a55' : '1px solid #2a2a35',
                  borderRadius: showDropdown ? '12px 12px 0 0' : 12,
                  color: '#f0eee8',
                  fontSize: 14,
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
              {showDropdown && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: '#18181f',
                  border: '1px solid #3a3a55',
                  borderTop: 'none',
                  borderRadius: '0 0 12px 12px',
                  zIndex: 10,
                  maxHeight: 180,
                  overflowY: 'auto',
                }}>
                  {suggestions.map((name, i) => (
                    <button
                      key={name}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        handleSelectSuggestion(player.seatNumber, name)
                      }}
                      style={{
                        display: 'block',
                        width: '100%',
                        padding: '10px 14px',
                        background: 'none',
                        border: 'none',
                        borderTop: i > 0 ? '1px solid #1e1e28' : 'none',
                        color: '#f0eee8',
                        fontSize: 14,
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#22222e'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              )}
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button className="bb-btn" onClick={goToMenu} style={{ flex: 1 }}>
          Отмена
        </button>
        <button className="bb-btn primary" onClick={handleStart} style={{ flex: 1 }}>
          Далее ›
        </button>
      </div>
    </div>
  )
}
