import React, { useState } from 'react'
import { useGameStore, ROLES } from '../lib/gameStore'

export default function RoleSetup() {
  const players = useGameStore(state => state.players)
  const assignRole = useGameStore(state => state.assignRole)
  const goToGameplay = useGameStore(state => state.goToGameplay)
  const startGame = useGameStore(state => state.startGame)
  const goToMenu = useGameStore(state => state.goToMenu)

  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [confirmStart, setConfirmStart] = useState(false)

  const assignedCount = players.filter(p => p.role).length
  const allAssigned = assignedCount === 12

  const handleAssignRole = (seatNumber, role) => {
    const roleObj = ROLES[role]
    assignRole(seatNumber, role, roleObj.team)
    setSelectedPlayer(null)
  }

  const handleStart = () => {
    if (!allAssigned) {
      setConfirmStart(true)
      return
    }
    startGame()
    goToGameplay()
  }

  return (
    <div style={{ padding: '16px 14px', maxWidth: 420, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700 }}>Распределение ролей</h2>
        <button
          className="sheet-close"
          onClick={goToMenu}
          style={{ position: 'relative', float: 'none' }}
        >
          ✕
        </button>
      </div>

      <p className="sheet-sub">
        Распределены: <b>{assignedCount}/12</b>
      </p>

      <div style={{ marginBottom: 24 }}>
        {players.map(player => (
          <button
            key={player.seatNumber}
            onClick={() => setSelectedPlayer(player.seatNumber)}
            style={{
              width: '100%',
              padding: '12px 14px',
              background: '#18181f',
              border: '1px solid #2a2a35',
              borderRadius: 12,
              color: '#f0eee8',
              fontSize: 14,
              fontFamily: 'inherit',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 8,
              cursor: 'pointer',
            }}
          >
            <span style={{ fontWeight: 600 }}>
              #{player.seatNumber} {player.nickname && `— ${player.nickname}`}
            </span>
            <span style={{ color: player.role ? '#f0eee8' : '#666' }}>
              {player.role ? `${ROLES[player.role].icon} ${ROLES[player.role].name}` : '—'}
            </span>
          </button>
        ))}
      </div>

      {selectedPlayer && (
        <div style={{ marginBottom: 24, padding: '16px', background: '#14141a', borderRadius: 14 }}>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>
            Выберите роль для игрока #{selectedPlayer}
          </div>
          <div className="role-list" style={{ marginBottom: 12 }}>
            {Object.entries(ROLES).map(([roleKey, role]) => (
              <button
                key={roleKey}
                onClick={() => handleAssignRole(selectedPlayer, roleKey)}
                className="role-item"
                style={{
                  borderColor: role.color,
                  backgroundColor: 'rgba(' + hexToRgb(role.color) + ', 0.1)',
                }}
              >
                <div className="role-dot" style={{ background: role.color }} />
                <div>
                  <div className="role-name">{role.name}</div>
                  <div className="role-team">
                    {role.team === 'black' ? '⚫ Чёрные' : '🔴 Красные'}
                  </div>
                </div>
              </button>
            ))}
          </div>
          <button
            className="bb-btn"
            onClick={() => setSelectedPlayer(null)}
            style={{ width: '100%' }}
          >
            Отмена
          </button>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <button className="bb-btn" onClick={goToMenu} style={{ flex: 1 }}>
          Назад
        </button>
        <button
          className="bb-btn primary"
          onClick={handleStart}
          style={{ flex: 1 }}
        >
          {allAssigned ? 'Начать ›' : 'Начать без всех ›'}
        </button>
      </div>

      {confirmStart && !allAssigned && (
        <div style={{
          marginTop: 24,
          padding: 16,
          background: '#2d2060',
          borderRadius: 12,
          border: '1px solid #3d2e80',
        }}>
          <p style={{ color: '#c4b8f8', marginBottom: 12, fontSize: 14 }}>
            Вы уверены? Не все роли распределены.
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="bb-btn"
              onClick={() => setConfirmStart(false)}
              style={{ flex: 1 }}
            >
              Отмена
            </button>
            <button
              className="bb-btn primary"
              onClick={() => {
                startGame()
                goToGameplay()
              }}
              style={{ flex: 1 }}
            >
              Да, начать
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return '0, 0, 0'
  return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
}
