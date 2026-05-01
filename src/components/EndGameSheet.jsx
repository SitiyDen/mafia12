import React, { useState } from 'react'
import { useGameStore, ROLES } from '../lib/gameStore'

export default function EndGameSheet() {
  const players = useGameStore(state => state.players)
  const events = useGameStore(state => state.events)
  const dayCount = useGameStore(state => state.dayCount)
  const nightCount = useGameStore(state => state.nightCount)
  const winner = useGameStore(state => state.winner)
  const getGameDuration = useGameStore(state => state.getGameDuration)
  const endGame = useGameStore(state => state.endGame)
  const resetGame = useGameStore(state => state.resetGame)

  const [step, setStep] = useState(winner ? 'scores' : 'select')
  const [votes, setVotes] = useState({})
  const [hostAdjust, setHostAdjust] = useState({})
  const [saving, setSaving] = useState(false)

  const handleSelectWinner = (w) => {
    endGame(w)
    setStep('scores')
  }

  const adjustVotes = (seatNumber, delta) => {
    setVotes(prev => ({
      ...prev,
      [seatNumber]: Math.max(0, (prev[seatNumber] || 0) + delta),
    }))
  }

  const adjustHost = (seatNumber, delta) => {
    setHostAdjust(prev => ({
      ...prev,
      [seatNumber]: (prev[seatNumber] || 0) + delta,
    }))
  }

  const maxVotes = Math.max(0, ...players.map(p => votes[p.seatNumber] || 0))
  const isMVP = (seatNumber) => maxVotes > 0 && (votes[seatNumber] || 0) === maxVotes

  const calcScore = (player) => {
    const victory = winner !== 'draw' && player.team === winner ? 1 : 0
    const survival = winner !== 'draw' && player.alive && player.team === winner ? 1 : 0
    const mvp = isMVP(player.seatNumber) ? 1 : 0
    const adjust = hostAdjust[player.seatNumber] || 0
    return { victory, survival, mvp, adjust, total: victory + survival + mvp + adjust }
  }

  const handleSave = async () => {
    setSaving(true)

    const payload = {
      winner: winner === 'black' ? 'Мафия' : winner === 'red' ? 'Мирные' : 'Ничья',
      dayCount,
      nightCount,
      durationSeconds: getGameDuration(),
      players: players.map(p => {
        const score = calcScore(p)
        return {
          seatNumber: p.seatNumber,
          nickname: p.nickname || '',
          role: p.role ? ROLES[p.role].name : 'Мирный',
          team: p.team === 'black' ? 'Мафия' : p.team === 'red' ? 'Мирные' : 'Ничья',
          survived: p.alive,
          fouls: p.fouls,
          votes: votes[p.seatNumber] || 0,
          score: score.total,
        }
      }),
    }

    try {
      await fetch('/mafia-api/change/newgame', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    } catch {
      // не блокируем завершение при сетевой ошибке
    } finally {
      setSaving(false)
      setStep('saved')
    }
  }

  if (step === 'select') {
    return (
      <div style={{ padding: '16px 14px', maxWidth: 420, margin: '0 auto' }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Конец игры</h2>
        <p className="sheet-sub" style={{ marginBottom: 24 }}>Выберите победившую команду</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button onClick={() => handleSelectWinner('black')} className="action-btn red-action" style={{ padding: 16 }}>
            <div className="a-icon">⚫</div>
            <div className="a-label">Победа чёрных</div>
            <div className="a-sub">Мафия, Дон, Путана</div>
          </button>
          <button onClick={() => handleSelectWinner('red')} className="action-btn" style={{ padding: 16, borderColor: '#1a3060' }}>
            <div className="a-icon">🔴</div>
            <div className="a-label">Победа красных</div>
            <div className="a-sub">Мирные, Комиссар, Доктор, Маньяк</div>
          </button>
          <button onClick={() => handleSelectWinner('draw')} className="action-btn" style={{ padding: 16 }}>
            <div className="a-icon">🤝</div>
            <div className="a-label">Ничья</div>
          </button>
        </div>
      </div>
    )
  }

  if (step === 'saved') {
    return (
      <div style={{ padding: '16px 14px', maxWidth: 420, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>✅</div>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Игра завершена</h2>
        <button onClick={resetGame} className="bb-btn primary" style={{ width: '100%' }}>
          Новая игра ›
        </button>
      </div>
    )
  }

  const winnerLabel = winner === 'black' ? '⚫ Чёрные' : winner === 'red' ? '🔴 Красные' : '🤝 Ничья'
  const mvpCount = players.filter(p => isMVP(p.seatNumber)).length

  return (
    <div style={{ padding: '16px 14px', maxWidth: 420, margin: '0 auto' }}>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Итоги</h2>
        <div style={{ fontSize: 13, color: '#888' }}>
          Победитель: <b style={{ color: '#f0eee8' }}>{winnerLabel}</b>
          <span style={{ margin: '0 6px', color: '#333' }}>·</span>
          День {dayCount}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        {['Поб +1 — победившей команде', 'Выж +1 — выжил из победившей', 'MVP +1 — лидер голосования'].map(t => (
          <div key={t} style={{ fontSize: 10, color: '#444', whiteSpace: 'nowrap' }}>{t}</div>
        ))}
      </div>

      {/* Table header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 80px 80px',
        gap: 6,
        padding: '0 0 6px',
        borderBottom: '1px solid #1a1a22',
        marginBottom: 4,
      }}>
        <div style={{ fontSize: 10, color: '#444', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Игрок</div>
        <div style={{ fontSize: 10, color: '#444', textTransform: 'uppercase', letterSpacing: '0.4px', textAlign: 'center' }}>Голоса</div>
        <div style={{ fontSize: 10, color: '#444', textTransform: 'uppercase', letterSpacing: '0.4px', textAlign: 'center' }}>Итого</div>
      </div>

      {/* Rows */}
      <div style={{ marginBottom: 12 }}>
        {players.map(player => {
          const score = calcScore(player)
          const role = player.role ? ROLES[player.role] : null
          const playerVotes = votes[player.seatNumber] || 0
          const mvp = isMVP(player.seatNumber)
          const totalColor = score.total > 0 ? '#7be0a0' : score.total < 0 ? '#e24b4a' : '#666'

          const badges = []
          if (score.victory) badges.push({ label: 'Поб', color: '#e24b4a' })
          if (score.survival) badges.push({ label: 'Выж', color: '#1d9e75' })
          if (mvp) badges.push({ label: 'MVP', color: '#9b6cf5' })

          return (
            <div
              key={player.seatNumber}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 80px 80px',
                gap: 6,
                alignItems: 'center',
                padding: '9px 0',
                borderBottom: '1px solid #111118',
                opacity: player.alive ? 1 : 0.55,
              }}
            >
              {/* Player info */}
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, color: '#444', fontWeight: 600, flexShrink: 0 }}>
                    {player.alive ? '' : '💀'}#{player.seatNumber}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {player.nickname || `Игрок ${player.seatNumber}`}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, color: role ? role.color : '#444' }}>
                    {role ? `${role.icon} ${role.name}` : '—'}
                  </span>
                  {badges.map(b => (
                    <span key={b.label} style={{
                      fontSize: 9, fontWeight: 700, color: b.color,
                      border: `1px solid ${b.color}44`, borderRadius: 4,
                      padding: '0 4px', lineHeight: '14px',
                    }}>{b.label}</span>
                  ))}
                </div>
              </div>

              {/* Votes */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <button onClick={() => adjustVotes(player.seatNumber, -1)} style={btnStyle('#c44')}>−</button>
                <span style={{
                  minWidth: 22, textAlign: 'center', fontSize: 16, fontWeight: 700,
                  color: mvp ? '#9b6cf5' : playerVotes > 0 ? '#f0eee8' : '#444',
                }}>
                  {playerVotes}
                </span>
                <button onClick={() => adjustVotes(player.seatNumber, +1)} style={btnStyle('#4c4')}>+</button>
              </div>

              {/* Total */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <button onClick={() => adjustHost(player.seatNumber, -1)} style={btnStyle('#c44')}>−</button>
                <span style={{ minWidth: 22, textAlign: 'center', fontSize: 16, fontWeight: 700, color: totalColor }}>
                  {score.total}
                </span>
                <button onClick={() => adjustHost(player.seatNumber, +1)} style={btnStyle('#4c4')}>+</button>
              </div>
            </div>
          )
        })}
      </div>

      {maxVotes > 0 && (
        <div style={{ fontSize: 11, color: '#7c5af0', marginBottom: 14 }}>
          MVP ({maxVotes} {votesWord(maxVotes)}): {players.filter(p => isMVP(p.seatNumber)).map(p => p.nickname || `#${p.seatNumber}`).join(', ')}
        </div>
      )}

      <HistoryTable players={players} events={events} />

      <button
        className="bb-btn primary"
        onClick={handleSave}
        disabled={saving}
        style={{ width: '100%' }}
      >
        {saving ? 'Сохранение…' : 'Сохранить и завершить ›'}
      </button>
    </div>
  )
}

function btnStyle(color) {
  return {
    width: 24, height: 24, borderRadius: 5,
    background: '#1a1a24', border: '1px solid #2a2a35',
    color, fontSize: 14, lineHeight: 1,
    cursor: 'pointer', fontFamily: 'inherit',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 0, flexShrink: 0,
  }
}

function votesWord(n) {
  if (n === 1) return 'голос'
  if (n >= 2 && n <= 4) return 'голоса'
  return 'голосов'
}

function HistoryTable({ players, events }) {
  const roleRows = [
    { role: 'don',      label: 'Дон',      icon: '🎩', team: 'black', type: 'mafia' },
    { role: 'mafia',    label: 'Мафия',     icon: '🔫', team: 'black', type: 'mafia' },
    { role: 'putana',   label: 'Путана',    icon: '💋', team: 'black', type: 'putana' },
    { role: 'doctor',   label: 'Доктор',    icon: '💊', team: 'red',   type: 'doctor' },
    { role: 'komissar', label: 'Комиссар',  icon: '🔍', team: 'red',   type: 'komissar' },
    { role: 'maniac',   label: 'Маньяк',    icon: '🤡', team: 'red',   type: 'maniac' },
  ]

  const maxCol = Math.max(
    0,
    ...events.map(e => e.nightNumber || 0),
    ...events.map(e => e.dayNumber || 0),
  )
  if (maxCol === 0) return null
  const cols = Array.from({ length: maxCol }, (_, i) => i + 1)

  const evsByNight = (n, type) => events.filter(e => e.nightNumber === n && e.eventType === type)
  const evsByDay   = (n, type) => events.filter(e => e.dayNumber  === n && e.eventType === type)

  const getCell = (type, playerSeat, col) => {
    if (type === 'mafia') {
      const kill  = evsByNight(col, 'mafia_kill')[0]
      const saved = evsByNight(col, 'mafia_saved')[0]
      if (kill)  return { seat: kill.affectedSeat, tag: '☠️', tagColor: '#e24b4a' }
      if (saved) return { seat: saved.affectedSeat, tag: '💊', tagColor: '#1d9e75' }
      return null
    }
    if (type === 'putana') {
      const ev = evsByNight(col, 'putana_freeze')[0]
      return ev ? { seat: ev.affectedSeat } : null
    }
    if (type === 'doctor') {
      const blocked = evsByNight(col, 'doctor_blocked')[0]
      const heal    = evsByNight(col, 'doctor_heal')[0]
      if (blocked) return { blocked: true }
      if (heal)    return { seat: heal.affectedSeat }
      return null
    }
    if (type === 'komissar') {
      const blocked = evsByNight(col, 'komissar_blocked')[0]
      const check   = evsByNight(col, 'komissar_check')[0]
      if (blocked) return { blocked: true }
      if (check) {
        const isBlack = check.team === 'black'
        return { seat: check.affectedSeat, tag: isBlack ? '⚫' : '🔴', tagColor: isBlack ? '#e24b4a' : '#378add' }
      }
      return null
    }
    if (type === 'maniac') {
      const blocked = evsByNight(col, 'maniac_blocked')[0]
      const kill    = evsByNight(col, 'maniac_kill')[0]
      if (blocked) return { blocked: true }
      if (kill)    return { seat: kill.affectedSeat, tag: '☠️', tagColor: '#9b6cf5' }
      return null
    }
    return null
  }

  const pName = (seat) => {
    const p = players.find(pl => pl.seatNumber === seat)
    return p?.nickname || ''
  }

  const COL_W = 60

  const cellStyle = {
    textAlign: 'center',
    padding: '7px 4px',
    verticalAlign: 'middle',
    borderBottom: '1px solid #111118',
    minWidth: COL_W,
  }

  const headerCellStyle = {
    textAlign: 'center',
    padding: '6px 4px 8px',
    color: '#555',
    fontWeight: 700,
    fontSize: 11,
    borderBottom: '1px solid #1e1e28',
    minWidth: COL_W,
    whiteSpace: 'nowrap',
  }

  const renderCellContent = (cell) => {
    if (!cell) return <span style={{ color: '#2a2a35', fontSize: 12 }}>—</span>
    if (cell.blocked) return (
      <span style={{ fontSize: 10, color: '#d4537e', fontWeight: 600 }}>блок</span>
    )
    const name = pName(cell.seat)
    return (
      <div style={{ lineHeight: 1.3 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#f0eee8' }}>№{cell.seat}</div>
        {name && <div style={{ fontSize: 9, color: '#666', maxWidth: COL_W - 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: '0 auto' }}>{name}</div>}
        {cell.tag && <div style={{ fontSize: 11, color: cell.tagColor, marginTop: 1 }}>{cell.tag}</div>}
      </div>
    )
  }

  return (
    <div style={{ marginTop: 28, marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
        История игры
      </div>

      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', marginLeft: -14, marginRight: -14, paddingLeft: 14 }}>
        <table style={{ borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr>
              <th style={{ ...headerCellStyle, textAlign: 'left', minWidth: 110, position: 'sticky', left: 0, background: '#0f0f12', paddingRight: 8 }}>
                Роль
              </th>
              {cols.map(n => (
                <th key={n} style={headerCellStyle}>День {n}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Заголосован row */}
            <tr>
              <td style={{ ...cellStyle, textAlign: 'left', paddingRight: 8, position: 'sticky', left: 0, background: '#0f0f12' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 14 }}>🗳️</span>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#888' }}>Заголосован</div>
                  </div>
                </div>
              </td>
              {cols.map(n => {
                const voteEv   = evsByDay(n, 'vote_out')[0]
                const donTakeEv = evsByDay(n, 'don_take')[0]
                return (
                  <td key={n} style={cellStyle}>
                    {voteEv ? (
                      <div style={{ lineHeight: 1.3 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#f8a0a0' }}>№{voteEv.affectedSeat}</div>
                        {pName(voteEv.affectedSeat) && <div style={{ fontSize: 9, color: '#666', maxWidth: COL_W - 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: '0 auto' }}>{pName(voteEv.affectedSeat)}</div>}
                        {donTakeEv && (
                          <div style={{ fontSize: 10, color: '#f8d080', marginTop: 2 }}>
                            +№{donTakeEv.affectedSeat}
                          </div>
                        )}
                      </div>
                    ) : <span style={{ color: '#2a2a35', fontSize: 12 }}>—</span>}
                  </td>
                )
              })}
            </tr>

            {/* Role rows — one row per player with that role */}
            {roleRows.flatMap(({ role, label, icon, team, type }) => {
              const rolePlayers = players.filter(p => p.role === role)
              if (rolePlayers.length === 0) return []
              return rolePlayers.map(rp => (
                <tr key={`${role}-${rp.seatNumber}`}>
                  <td style={{ ...cellStyle, textAlign: 'left', paddingRight: 8, position: 'sticky', left: 0, background: '#0f0f12' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 14 }}>{icon}</span>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: team === 'black' ? '#c06060' : '#5080b0', lineHeight: 1.2 }}>{label}</div>
                        <div style={{ fontSize: 10, color: '#555' }}>№{rp.seatNumber}{rp.nickname ? ` ${rp.nickname}` : ''}</div>
                      </div>
                    </div>
                  </td>
                  {cols.map(n => (
                    <td key={n} style={cellStyle}>
                      {renderCellContent(getCell(type, rp.seatNumber, n))}
                    </td>
                  ))}
                </tr>
              ))
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
