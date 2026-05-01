import React, { useState } from 'react'
import { useGameStore, ROLES } from '../lib/gameStore'
import PlayerGrid from './PlayerGrid'
import Timer from './Timer'
import NightWizard from './NightWizard'
import VotingPanel from './VotingPanel'
import GameLog from './GameLog'
import EndGameSheet from './EndGameSheet'

export default function GameScreen() {
  const gamePhase = useGameStore(state => state.gamePhase)
  const dayCount = useGameStore(state => state.dayCount)
  const nightCount = useGameStore(state => state.nightCount)
  const players = useGameStore(state => state.players)
  const endDay = useGameStore(state => state.endDay)
  const resetGame = useGameStore(state => state.resetGame)
  const checkGameEnd = useGameStore(state => state.checkGameEnd)
  const endGame = useGameStore(state => state.endGame)
  const transitionToEndgame = useGameStore(state => state.transitionToEndgame)

  const [showOverlay, setShowOverlay] = useState(false)
  const [overlayContent, setOverlayContent] = useState(null)

  const getPhaseLabel = () => {
    if (gamePhase === 'day') return `День ${dayCount}`
    if (gamePhase === 'night') return `Ночь ${nightCount}`
    if (gamePhase === 'voting') return `Голосование`
    if (gamePhase === 'endgame') return 'Конец игры'
    return 'Unknown'
  }

  const getPhaseClass = () => {
    if (gamePhase === 'day') return 'phase-day'
    if (gamePhase === 'night') return 'phase-night'
    return 'phase-day'
  }

  const handleOpenOverlay = (content) => {
    setOverlayContent(content)
    setShowOverlay(true)
  }

  const handleCloseOverlay = () => {
    setShowOverlay(false)
    setOverlayContent(null)
  }

  const handleCheckGameEnd = () => {
    const winner = checkGameEnd()
    if (winner) {
      endGame(winner)
    }
  }

  const handleEndDay = () => {
    endDay()
    handleCheckGameEnd()
  }

  const handleNextPhase = () => {
    if (gamePhase === 'day') {
      handleOpenOverlay('voting')
    } else if (gamePhase === 'voting') {
      handleOpenOverlay('night')
    }
  }

  return (
    <div className="app-container">
      {/* Top Bar */}
      <div className="top-bar">
        <h1>Мафия</h1>
        <span className={`phase-badge ${getPhaseClass()}`}>
          {getPhaseLabel()}
        </span>
      </div>

      {gamePhase === 'day' && (
        <>
          <Timer phase="day" />
          <div className="section-label">Игроки</div>
          <PlayerGrid onOpenOverlay={handleOpenOverlay} />
          <div className="section-label">Действия</div>
          <div className="action-grid">
            <button className="action-btn purple-action" onClick={() => handleOpenOverlay('voting')}>
              <div className="a-icon">🗳️</div>
              <div className="a-label">Голосование</div>
              <div className="a-sub">Номинированные</div>
            </button>
            <button className="action-btn" onClick={() => handleOpenOverlay('night')}>
              <div className="a-icon">🌙</div>
              <div className="a-label">Ночь</div>
              <div className="a-sub">Пробуждения ролей</div>
            </button>
            <button className="action-btn red-action" onClick={() => handleOpenOverlay('foul')}>
              <div className="a-icon">⚠️</div>
              <div className="a-label">Фол</div>
              <div className="a-sub">Назначить игроку</div>
            </button>
            <button className="action-btn green-action" onClick={() => handleOpenOverlay('roles')}>
              <div className="a-icon">🃏</div>
              <div className="a-label">Роли</div>
              <div className="a-sub">Назначить / смотреть</div>
            </button>
          </div>
          <div className="section-label">Журнал</div>
          <GameLog />
        </>
      )}

      {gamePhase === 'night' && (
        <>
          <Timer phase="night" />
          <NightWizard onOpenOverlay={handleOpenOverlay} />
        </>
      )}

      {gamePhase === 'voting' && (
        <>
          <Timer phase="voting" />
          <VotingPanel onOpenOverlay={handleOpenOverlay} />
        </>
      )}

      {gamePhase === 'endgame' && (
        <EndGameSheet />
      )}

      {/* Bottom Bar */}
      {gamePhase !== 'endgame' && (
        <div className="bottom-bar">
          <button className="bb-btn" onClick={transitionToEndgame}>
            Завершить игру
          </button>
          <button className="bb-btn primary" onClick={() => {
            if (gamePhase === 'day') {
              handleOpenOverlay('voting')
            } else if (gamePhase === 'voting') {
              handleEndDay()
            } else if (gamePhase === 'night') {
              handleEndDay()
            }
          }}>
            Следующая фаза ›
          </button>
        </div>
      )}

      {/* Overlay */}
      {showOverlay && (
        <div className="overlay" onClick={(e) => e.target === e.currentTarget && handleCloseOverlay()}>
          <div className="sheet">
            {overlayContent === 'voting' && (
              <VotingPanel onOpenOverlay={handleOpenOverlay} isModal={true} onClose={handleCloseOverlay} />
            )}
            {overlayContent === 'night' && (
              <NightWizard onOpenOverlay={handleOpenOverlay} isModal={true} onClose={handleCloseOverlay} />
            )}
            {overlayContent === 'foul' && <FoulModal onClose={handleCloseOverlay} />}
            {overlayContent === 'roles' && <RolesModal onClose={handleCloseOverlay} />}
            {typeof overlayContent === 'object' && overlayContent.type === 'player' && (
              <PlayerModal player={overlayContent.player} onClose={handleCloseOverlay} />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function FoulModal({ onClose }) {
  const players = useGameStore(state => state.players)
  const addFoul = useGameStore(state => state.addFoul)

  const alivePlayers = players.filter(p => p.alive)

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div className="sheet-title">Назначить фол</div>
        <button className="sheet-close" onClick={onClose}>✕</button>
      </div>
      <p className="sheet-sub">3 фола = палец на голосовании. 4 фола = вскрытие карты и уход.</p>
      <div>
        {alivePlayers.map(p => (
          <button
            key={p.seatNumber}
            className="action-btn"
            style={{
              marginBottom: 7,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              width: '100%',
              textAlign: 'left',
            }}
            onClick={() => {
              addFoul(p.seatNumber)
              onClose()
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 600, color: '#f0eee8' }}>
              № {p.seatNumber} {p.nickname && `— ${p.nickname}`}
            </span>
            <span style={{ fontSize: 13, color: '#888' }}>
              {p.fouls} фол{p.fouls === 1 ? '' : 'а'}
            </span>
          </button>
        ))}
      </div>
    </>
  )
}

function RolesModal({ onClose }) {
  const players = useGameStore(state => state.players)
  const assignRole = useGameStore(state => state.assignRole)
  const [selectedSeat, setSelectedSeat] = useState(null)

  if (selectedSeat !== null) {
    const player = players.find(p => p.seatNumber === selectedSeat)
    return (
      <>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div className="sheet-title">
            №{player.seatNumber}{player.nickname ? ` — ${player.nickname}` : ''}
          </div>
          <button className="sheet-close" onClick={() => setSelectedSeat(null)}>‹</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {Object.entries(ROLES).map(([key, role]) => (
            <button
              key={key}
              className="action-btn"
              style={{
                padding: '12px 8px',
                ...(player.role === key && {
                  border: `2px solid ${role.color}`,
                  background: `${role.color}22`,
                }),
              }}
              onClick={() => {
                assignRole(selectedSeat, key, role.team)
                setSelectedSeat(null)
              }}
            >
              <div className="a-icon">{role.icon}</div>
              <div className="a-label">{role.name}</div>
            </button>
          ))}
        </div>
      </>
    )
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div className="sheet-title">Роли</div>
        <button className="sheet-close" onClick={onClose}>✕</button>
      </div>
      <div>
        {players.map(p => (
          <button
            key={p.seatNumber}
            onClick={() => setSelectedSeat(p.seatNumber)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '9px 4px',
              borderBottom: '1px solid #1e1e28',
              width: '100%',
              background: 'none',
              border: 'none',
              borderBottom: '1px solid #1e1e28',
              cursor: 'pointer',
              color: 'inherit',
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 600 }}>
              №{p.seatNumber}{p.nickname ? ` — ${p.nickname}` : ''}
            </span>
            <span style={{
              fontSize: 13,
              color: p.role ? (p.team === 'black' ? '#e24b4a' : '#378add') : '#555',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}>
              {p.role ? `${ROLES[p.role].icon} ${ROLES[p.role].name}` : '—'}
              <span style={{ color: '#555', marginLeft: 2 }}>›</span>
            </span>
          </button>
        ))}
      </div>
    </>
  )
}

function PlayerModal({ player, onClose }) {
  const killPlayer = useGameStore(state => state.killPlayer)
  const revivePlayer = useGameStore(state => state.revivePlayer)
  const addFoul = useGameStore(state => state.addFoul)
  const setNominated = useGameStore(state => state.setNominated)
  const assignRole = useGameStore(state => state.assignRole)
  const players = useGameStore(state => state.players)
  const [showRolePicker, setShowRolePicker] = useState(false)

  const currentPlayer = players.find(p => p.seatNumber === player.seatNumber) || player

  if (showRolePicker) {
    return (
      <>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div className="sheet-title">Выбрать роль</div>
          <button className="sheet-close" onClick={() => setShowRolePicker(false)}>‹</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {Object.entries(ROLES).map(([key, role]) => (
            <button
              key={key}
              className="action-btn"
              style={{
                padding: '12px 8px',
                ...(currentPlayer.role === key && {
                  border: `2px solid ${role.color}`,
                  background: `${role.color}22`,
                }),
              }}
              onClick={() => {
                assignRole(player.seatNumber, key, role.team)
                onClose()
              }}
            >
              <div className="a-icon">{role.icon}</div>
              <div className="a-label">{role.name}</div>
            </button>
          ))}
        </div>
      </>
    )
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div className="sheet-title">
          Игрок №{player.seatNumber}{player.nickname ? ` — ${player.nickname}` : ''}
        </div>
        <button className="sheet-close" onClick={onClose}>✕</button>
      </div>
      {currentPlayer.role && (
        <div style={{
          fontSize: 13,
          color: currentPlayer.team === 'black' ? '#e24b4a' : '#378add',
          marginBottom: 14,
          fontWeight: 600,
        }}>
          {currentPlayer.team === 'black' ? '⚫ Чёрные' : '🔴 Красные'}
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <button
          className="action-btn"
          style={{ flex: 1 }}
          onClick={() => {
            if (currentPlayer.alive) killPlayer(player.seatNumber)
            else revivePlayer(player.seatNumber)
            onClose()
          }}
        >
          <div className="a-icon">{currentPlayer.alive ? '💀' : '💚'}</div>
          <div className="a-label">{currentPlayer.alive ? 'Убить' : 'Воскресить'}</div>
        </button>
        <button
          className="action-btn red-action"
          style={{ flex: 1 }}
          onClick={() => {
            addFoul(player.seatNumber)
            onClose()
          }}
        >
          <div className="a-icon">⚠️</div>
          <div className="a-label">Фол ({currentPlayer.fouls}/4)</div>
        </button>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          className="action-btn"
          style={{ flex: 1 }}
          onClick={() => {
            setNominated(player.seatNumber, !currentPlayer.nominated)
            onClose()
          }}
        >
          <div className="a-icon">{currentPlayer.nominated ? '✅' : '🎯'}</div>
          <div className="a-label">{currentPlayer.nominated ? 'Снять' : 'Номинировать'}</div>
        </button>
        <button
          className="action-btn green-action"
          style={{ flex: 1 }}
          onClick={() => setShowRolePicker(true)}
        >
          <div className="a-icon">{currentPlayer.role ? ROLES[currentPlayer.role].icon : '🃏'}</div>
          <div className="a-label">{currentPlayer.role ? ROLES[currentPlayer.role].name : 'Роль'}</div>
        </button>
      </div>
    </>
  )
}