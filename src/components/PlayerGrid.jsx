import React from 'react'
import { useGameStore, ROLES } from '../lib/gameStore'

export default function PlayerGrid({ onOpenOverlay }) {
  const players = useGameStore(state => state.players)

  return (
    <div className="players-grid">
      {players.map(player => (
        <PlayerChip
          key={player.seatNumber}
          player={player}
          onSelect={() => onOpenOverlay({ type: 'player', player })}
        />
      ))}
    </div>
  )
}

function PlayerChip({ player, onSelect }) {
  const role = player.role ? ROLES[player.role] : null

  let chipClasses = 'player-chip '
  if (!player.alive) chipClasses += 'dead '
  if (player.protected) chipClasses += 'protected '
  if (player.nominated) chipClasses += 'nominated '

  return (
    <button
      onClick={onSelect}
      className={chipClasses}
      style={{ border: 'none', padding: 0 }}
    >
      <div className="player-num">{player.seatNumber}</div>
      {role && <div className="player-role-icon">{role.icon}</div>}
      {player.fouls > 0 && (
        <div className="fol-dots">
          {Array.from({ length: Math.min(player.fouls, 4) }).map((_, i) => (
            <div
              key={i}
              className={`fol-dot ${i === 2 ? 'warn' : ''}`}
            />
          ))}
        </div>
      )}
    </button>
  )
}
