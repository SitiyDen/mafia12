import React, { useState } from 'react'
import { useGameStore, ROLES } from '../lib/gameStore'

export default function VotingPanel({ onOpenOverlay, isModal, onClose }) {
  const players = useGameStore(state => state.players)
  const voteOutPlayer = useGameStore(state => state.voteOutPlayer)
  const donTakePlayer = useGameStore(state => state.donTakePlayer)
  const startNight = useGameStore(state => state.startNight)

  const [phase, setPhase] = useState('select') // select | don_revenge | result | peaceful
  const [selectedSeat, setSelectedSeat] = useState(null)
  const [donTarget, setDonTarget] = useState(null)
  const [voteResult, setVoteResult] = useState(null)

  const alivePlayers = players.filter(p => p.alive)

  const handleToggleSelect = (seatNumber) => {
    setSelectedSeat(prev => prev === seatNumber ? null : seatNumber)
  }

  const handleVoteOut = () => {
    if (!selectedSeat) return
    const votedPlayer = players.find(p => p.seatNumber === selectedSeat)
    const isDon = votedPlayer?.role === 'don'
    const canTake = isDon && (votedPlayer?.fouls ?? 0) < 3

    voteOutPlayer(selectedSeat)
    setVoteResult(selectedSeat)

    if (canTake) {
      setPhase('don_revenge')
    } else {
      setPhase('result')
    }
  }

  const handleDonTake = () => {
    if (!donTarget) return
    donTakePlayer(donTarget)
    setPhase('result')
  }

  const handleDonSkip = () => {
    setPhase('result')
  }

  const handleGoToNight = () => {
    startNight()
    if (isModal) onClose()
  }

  const ModalHeader = ({ title }) => isModal ? (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
      <div className="sheet-title">{title}</div>
      <button className="sheet-close" onClick={onClose}>✕</button>
    </div>
  ) : null

  if (phase === 'select') {
    const selectedPlayer = players.find(p => p.seatNumber === selectedSeat)
    return (
      <>
        <ModalHeader title="Голосование" />
        <p className="sheet-sub">Выберите игрока — нажмите на карточку для выделения</p>

        <div className="players-grid" style={{ marginBottom: 20 }}>
          {alivePlayers.map(player => {
            const role = player.role ? ROLES[player.role] : null
            const isSelected = selectedSeat === player.seatNumber
            return (
              <button
                key={player.seatNumber}
                onClick={() => handleToggleSelect(player.seatNumber)}
                className={`player-chip${isSelected ? ' vote-selected' : ''}`}
                style={{ border: 'none', padding: 0 }}
              >
                <div className="player-num">{player.seatNumber}</div>
                {role && <div className="player-role-icon">{role.icon}</div>}
                {player.nickname && (
                  <div style={{ fontSize: 9, color: isSelected ? '#b0a0f8' : '#666', marginTop: 2, maxWidth: '90%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {player.nickname}
                  </div>
                )}
                {player.fouls > 0 && (
                  <div className="fol-dots">
                    {Array.from({ length: Math.min(player.fouls, 4) }).map((_, i) => (
                      <div key={i} className={`fol-dot ${i === 2 ? 'warn' : ''}`} />
                    ))}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        <button
          className="bb-btn primary"
          onClick={handleVoteOut}
          disabled={!selectedSeat}
          style={{
            width: '100%',
            marginBottom: 8,
            opacity: selectedSeat ? 1 : 0.4,
            background: selectedSeat ? '#5a1a1a' : undefined,
            borderColor: selectedSeat ? '#8a2020' : undefined,
            color: selectedSeat ? '#f8a0a0' : undefined,
          }}
        >
          {selectedSeat
            ? `Заголосован №${selectedSeat}${selectedPlayer?.nickname ? ` — ${selectedPlayer.nickname}` : ''}`
            : 'Выберите игрока'}
        </button>

        <button
          className="bb-btn"
          onClick={() => setPhase('peaceful')}
          style={{ width: '100%' }}
        >
          Мирный день
        </button>
      </>
    )
  }

  if (phase === 'don_revenge') {
    const don = players.find(p => p.seatNumber === voteResult)
    const targetPlayer = players.find(p => p.seatNumber === donTarget)
    return (
      <>
        <ModalHeader title="Право Дона" />

        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>👑</div>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#f8d080', marginBottom: 6 }}>
            Дон заголосован
          </p>
          <p style={{ fontSize: 13, color: '#888', lineHeight: 1.5 }}>
            {don?.nickname ? `${don.nickname} (№${don.seatNumber})` : `№${don?.seatNumber}`} уходит и может забрать одного игрока с собой
          </p>
        </div>

        <p className="sheet-sub">Выберите жертву или пропустите</p>

        <div className="players-grid" style={{ marginBottom: 20 }}>
          {alivePlayers.map(player => {
            const role = player.role ? ROLES[player.role] : null
            const isSelected = donTarget === player.seatNumber
            return (
              <button
                key={player.seatNumber}
                onClick={() => setDonTarget(prev => prev === player.seatNumber ? null : player.seatNumber)}
                className={`player-chip${isSelected ? ' vote-selected' : ''}`}
                style={{ border: 'none', padding: 0 }}
              >
                <div className="player-num">{player.seatNumber}</div>
                {role && <div className="player-role-icon">{role.icon}</div>}
                {player.nickname && (
                  <div style={{ fontSize: 9, color: isSelected ? '#b0a0f8' : '#666', marginTop: 2, maxWidth: '90%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {player.nickname}
                  </div>
                )}
                {player.fouls > 0 && (
                  <div className="fol-dots">
                    {Array.from({ length: Math.min(player.fouls, 4) }).map((_, i) => (
                      <div key={i} className={`fol-dot ${i === 2 ? 'warn' : ''}`} />
                    ))}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        <button
          className="bb-btn primary"
          onClick={handleDonTake}
          disabled={!donTarget}
          style={{
            width: '100%',
            marginBottom: 8,
            opacity: donTarget ? 1 : 0.4,
            background: donTarget ? '#5a1a1a' : undefined,
            borderColor: donTarget ? '#8a2020' : undefined,
            color: donTarget ? '#f8a0a0' : undefined,
          }}
        >
          {donTarget
            ? `Забрать №${donTarget}${targetPlayer?.nickname ? ` — ${targetPlayer.nickname}` : ''}`
            : 'Выберите жертву'}
        </button>

        <button
          className="bb-btn"
          onClick={handleDonSkip}
          style={{ width: '100%' }}
        >
          Пропустить
        </button>
      </>
    )
  }

  if (phase === 'result') {
    const victim = players.find(p => p.seatNumber === voteResult)
    const takenPlayer = donTarget ? players.find(p => p.seatNumber === donTarget) : null
    return (
      <>
        <ModalHeader title="Результат голосования" />
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 44, marginBottom: 14 }}>🗳️</div>
          <p className="sheet-sub" style={{ fontSize: 15, color: '#f0eee8' }}>
            Город проголосовал против
          </p>
          <p style={{ fontSize: 22, fontWeight: 700, color: '#f8a0a0', marginTop: 8 }}>
            №{victim.seatNumber}{victim.nickname ? ` — ${victim.nickname}` : ''}
          </p>
          {takenPlayer && (
            <div style={{ marginTop: 14, padding: '10px 14px', background: '#1e0f08', borderRadius: 10, border: '1px solid #4a1a10' }}>
              <p style={{ fontSize: 12, color: '#f8d080', marginBottom: 4 }}>👑 Дон забрал с собой</p>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#f8a0a0' }}>
                №{takenPlayer.seatNumber}{takenPlayer.nickname ? ` — ${takenPlayer.nickname}` : ''}
              </p>
            </div>
          )}
        </div>
        <button
          className="bb-btn primary"
          onClick={handleGoToNight}
          style={{ width: '100%' }}
        >
          Начать ночь ›
        </button>
      </>
    )
  }

  if (phase === 'peaceful') {
    return (
      <>
        <ModalHeader title="Мирный день" />
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 44, marginBottom: 14 }}>☮️</div>
          <p className="sheet-sub">
            Никого не заголосовали. Наступает ночь.
          </p>
        </div>
        <button
          className="bb-btn primary"
          onClick={handleGoToNight}
          style={{ width: '100%' }}
        >
          Начать ночь ›
        </button>
      </>
    )
  }
}
