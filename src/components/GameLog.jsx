import React from 'react'
import { useGameStore } from '../lib/gameStore'

export default function GameLog() {
  const events = useGameStore(state => state.events)

  const recentEvents = events.slice().reverse().slice(0, 10)

  return (
    <div className="log-card">
      {recentEvents.length === 0 ? (
        <div className="log-item">
          <span className="log-text" style={{ color: '#666' }}>Событий нет</span>
        </div>
      ) : (
        recentEvents.map((event, idx) => (
          <div key={idx} className="log-item">
            <span className="log-icon">{getEventIcon(event.eventType)}</span>
            <span className="log-text">{event.description}</span>
          </div>
        ))
      )}
    </div>
  )
}

function getEventIcon(eventType) {
  const icons = {
    game_start:       '🃏',
    kill:             '☠️',
    vote_out:         '🗳️',
    don_take:         '👑',
    auto_kill:        '💣',
    foul:             '⚠️',
    nomination:       '📢',
    night_start:      '🌙',
    voting_start:     '🗳️',
    day_end:          '🌅',
    game_end:         '🏆',
    mafia_kill:       '🔫',
    mafia_saved:      '💊',
    putana_freeze:    '💋',
    doctor_heal:      '💊',
    doctor_blocked:   '💋',
    maniac_kill:      '🤡',
    maniac_blocked:   '💋',
    komissar_check:   '🔍',
    komissar_blocked: '💋',
  }
  return icons[eventType] || '•'
}
