import React, { useState } from 'react'
import { useGameStore, ROLES } from '../lib/gameStore'

export default function NightWizard({ onOpenOverlay, isModal, onClose }) {
  const players = useGameStore(state => state.players)
  const nightCount = useGameStore(state => state.nightCount)
  const killPlayerNoLog = useGameStore(state => state.killPlayerNoLog)
  const addEvent = useGameStore(state => state.addEvent)
  const clearNightEffects = useGameStore(state => state.clearNightEffects)
  const endDay = useGameStore(state => state.endDay)

  const [currentStep, setCurrentStep] = useState(0)
  const [actions, setActions] = useState({
    mafiaTarget: null,
    putanaTarget: null,
    doctorTarget: null,
    kommissarTarget: null,
    maniacTarget: null,
  })
  const [resolution, setResolution] = useState(null) // итог ночи для показа

  const nightSteps = [
    {
      key: 'mafiaTarget',
      role: 'mafia',
      label: 'Мафия + Дон',
      icon: '🔫',
      sub: 'Совещаются беззвучно. Дон принимает финальное решение — кого убить этой ночью.',
      skippable: false,
    },
    {
      key: 'putanaTarget',
      role: 'putana',
      label: 'Путана',
      icon: '💋',
      sub: 'Выбирает кого заморозить (комиссар, доктор или маньяк). Нельзя морозить одного игрока 2 ночи подряд.',
      skippable: true,
    },
    {
      key: 'doctorTarget',
      role: 'doctor',
      label: 'Доктор',
      icon: '💊',
      sub: 'Выбирает кого вылечить. Нельзя лечить одного и того же 2 ночи подряд (включая себя).',
      skippable: true,
    },
    {
      key: 'kommissarTarget',
      role: 'komissar',
      label: 'Комиссар',
      icon: '🔍',
      sub: 'Выбирает кого проверить. Если путана приходила к комиссару — он запутан и не узнает роль.',
      skippable: true,
    },
    {
      key: 'maniacTarget',
      role: 'maniac',
      label: 'Маньяк',
      icon: '🎭',
      sub: 'Может убить любого (кроме себя) или воздержаться. Целится в мафию/путану.',
      skippable: true,
    },
  ]

  const step = nightSteps[currentStep]
  const alivePlayers = players.filter(p => p.alive)

  // Для шагов после мафии показываем живых + цель мафии (ещё не убит, но отмечен)
  const stepPlayers = step.role === 'mafia'
    ? alivePlayers
    : players.filter(p => p.alive || p.seatNumber === actions.mafiaTarget)

  const handleSelect = (seatNumber) => {
    const updated = { ...actions, [step.key]: seatNumber }
    setActions(updated)
    advance(updated)
  }

  const handleSkip = () => {
    advance(actions)
  }

  const advance = (currentActions) => {
    if (currentStep < nightSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleFinish(currentActions)
    }
  }

  const isRoleBlockedByPutana = (role, putanaTarget) => {
    if (putanaTarget === null) return false
    const rolePlayer = players.find(p => p.role === role)
    return rolePlayer !== undefined && rolePlayer.seatNumber === putanaTarget
  }

  const pLabel = (seat) => {
    const p = players.find(pl => pl.seatNumber === seat)
    return `№${seat}${p?.nickname ? ` — ${p.nickname}` : ''}`
  }

  const handleFinish = (finalActions) => {
    const { mafiaTarget, putanaTarget, doctorTarget, kommissarTarget, maniacTarget } = finalActions

    const doctorBlocked = isRoleBlockedByPutana('doctor', putanaTarget)
    const maniacBlocked = isRoleBlockedByPutana('maniac', putanaTarget)
    const kommissarBlocked = isRoleBlockedByPutana('komissar', putanaTarget)

    const doctorSaves = !doctorBlocked && doctorTarget !== null && doctorTarget === mafiaTarget

    const killed = []
    const saved = []
    const blocked = []
    let kommissarCheck = null

    // Putana
    if (putanaTarget !== null) {
      addEvent({ phase: 'night', eventType: 'putana_freeze', description: `Путана заморозила ${pLabel(putanaTarget)}`, affectedSeat: putanaTarget })
    }

    // Doctor
    if (doctorTarget !== null) {
      if (doctorBlocked) {
        addEvent({ phase: 'night', eventType: 'doctor_blocked', description: `Доктор заблокирован — ${pLabel(doctorTarget)} не вылечен` })
        blocked.push({ seat: doctorTarget, role: 'doctor' })
      } else {
        addEvent({ phase: 'night', eventType: 'doctor_heal', description: `Доктор вылечил ${pLabel(doctorTarget)}`, affectedSeat: doctorTarget })
      }
    }

    // Mafia
    if (mafiaTarget !== null) {
      if (doctorSaves) {
        addEvent({ phase: 'night', eventType: 'mafia_saved', description: `${pLabel(mafiaTarget)} спасён доктором (мафия целилась)`, affectedSeat: mafiaTarget })
        saved.push(mafiaTarget)
      } else {
        killPlayerNoLog(mafiaTarget)
        addEvent({ phase: 'night', eventType: 'mafia_kill', description: `${pLabel(mafiaTarget)} убит мафией`, affectedSeat: mafiaTarget })
        killed.push(mafiaTarget)
      }
    }

    // Maniac
    if (maniacTarget !== null) {
      if (maniacBlocked) {
        addEvent({ phase: 'night', eventType: 'maniac_blocked', description: `Маньяк заблокирован — ${pLabel(maniacTarget)} жив` })
        blocked.push({ seat: maniacTarget, role: 'maniac' })
      } else {
        killPlayerNoLog(maniacTarget)
        addEvent({ phase: 'night', eventType: 'maniac_kill', description: `${pLabel(maniacTarget)} убит маньяком`, affectedSeat: maniacTarget })
        killed.push(maniacTarget)
      }
    }

    // Komissar
    if (kommissarTarget !== null) {
      if (kommissarBlocked) {
        addEvent({ phase: 'night', eventType: 'komissar_blocked', description: `Комиссар запутан — проверка ${pLabel(kommissarTarget)} не удалась` })
        kommissarCheck = { seat: kommissarTarget, blocked: true }
      } else {
        const checked = players.find(p => p.seatNumber === kommissarTarget)
        const teamLabel = checked?.team === 'black' ? 'Чёрный' : 'Красный'
        addEvent({ phase: 'night', eventType: 'komissar_check', description: `Комиссар проверил ${pLabel(kommissarTarget)} — ${teamLabel}`, affectedSeat: kommissarTarget, team: checked?.team })
        kommissarCheck = { seat: kommissarTarget, blocked: false, team: checked?.team || null }
      }
    }

    setResolution({ killed, saved, blocked, kommissarCheck })
    clearNightEffects()
  }

  const handleClose = () => {
    endDay()
    if (isModal) onClose()
  }

  // Экран итогов ночи
  if (resolution) {
    const getPlayer = (seat) => players.find(p => p.seatNumber === seat)

    return (
      <>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div className="sheet-title">Итог ночи {nightCount}</div>
          {isModal && <button className="sheet-close" onClick={handleClose}>✕</button>}
        </div>

        {resolution.killed.length === 0 && resolution.saved.length === 0 && resolution.blocked.length === 0 && (
          <div style={{ padding: '16px', background: '#14141a', borderRadius: 12, marginBottom: 12, color: '#888', fontSize: 14 }}>
            Тихая ночь — никто не пострадал
          </div>
        )}

        {resolution.killed.map(seat => {
          const p = getPlayer(seat)
          return (
            <div key={seat} style={{ padding: '12px 14px', background: '#2a1010', border: '1px solid #5a1a1a', borderRadius: 12, marginBottom: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#e24b4a' }}>💀 Убит</div>
              <div style={{ fontSize: 14, marginTop: 4 }}>
                #{seat} {p?.nickname || ''}
                {p?.role && <span style={{ color: '#555', marginLeft: 6 }}>{ROLES[p.role]?.name}</span>}
              </div>
            </div>
          )
        })}

        {resolution.saved.map(seat => {
          const p = getPlayer(seat)
          return (
            <div key={seat} style={{ padding: '12px 14px', background: '#0e2a1a', border: '1px solid #1a5a2a', borderRadius: 12, marginBottom: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1d9e75' }}>💊 Спасён доктором</div>
              <div style={{ fontSize: 14, marginTop: 4 }}>
                #{seat} {p?.nickname || ''}
              </div>
            </div>
          )
        })}

        {resolution.blocked.map(({ seat, role }) => {
          const p = getPlayer(seat)
          const roleLabel = role === 'doctor' ? 'Доктор' : role === 'maniac' ? 'Маньяк' : 'Комиссар'
          return (
            <div key={seat} style={{ padding: '12px 14px', background: '#1a1020', border: '1px solid #3a1a50', borderRadius: 12, marginBottom: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#d4537e' }}>💋 {roleLabel} заблокирован путаной</div>
              <div style={{ fontSize: 14, marginTop: 4 }}>
                #{seat} {p?.nickname || ''} — действие не выполнено
              </div>
            </div>
          )
        })}

        {resolution.kommissarCheck && (() => {
          const { seat, blocked, team } = resolution.kommissarCheck
          const p = getPlayer(seat)
          if (blocked) {
            return (
              <div style={{ padding: '12px 14px', background: '#1a1020', border: '1px solid #3a1a50', borderRadius: 12, marginBottom: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#d4537e' }}>💋 Комиссар запутан</div>
                <div style={{ fontSize: 14, marginTop: 4 }}>
                  Проверял #{seat} {p?.nickname || ''} — но был запутан, результат неизвестен
                </div>
              </div>
            )
          }
          const isBlack = team === 'black'
          return (
            <div style={{ padding: '12px 14px', background: isBlack ? '#2a1010' : '#0e1a2a', border: `1px solid ${isBlack ? '#5a1a1a' : '#1a3a5a'}`, borderRadius: 12, marginBottom: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: isBlack ? '#e24b4a' : '#378add' }}>
                🔍 Комиссар проверил — {isBlack ? '⚫ Чёрный' : team ? '🔴 Красный' : 'Роль не назначена'}
              </div>
              <div style={{ fontSize: 14, marginTop: 4 }}>
                #{seat} {p?.nickname || ''}
              </div>
            </div>
          )
        })()}

        <button className="bb-btn primary" style={{ width: '100%', marginTop: 8 }} onClick={handleClose}>
          Начать день ›
        </button>
      </>
    )
  }

  const dots = nightSteps.map((_, i) => (
    <div key={i} className={`step-dot ${i === currentStep ? 'active' : i < currentStep ? 'done' : ''}`} />
  ))

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div className="sheet-title">
          Ночь {nightCount} — шаг {currentStep + 1}/{nightSteps.length}
        </div>
        {isModal && <button className="sheet-close" onClick={onClose}>✕</button>}
      </div>

      <div className="step-dots">{dots}</div>
      <div className="night-icon">{step.icon}</div>
      <div className="night-role-name">{step.label}</div>
      <div className="night-role-sub">{step.sub}</div>

      {['doctor', 'komissar', 'maniac'].includes(step.role) && isRoleBlockedByPutana(step.role, actions.putanaTarget) && (
        <div style={{
          padding: '10px 14px',
          background: '#2a1020',
          border: '1px solid #d4537e',
          borderRadius: 10,
          marginBottom: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <span style={{ fontSize: 18 }}>💋</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#d4537e' }}>Запутан путаной</div>
            <div style={{ fontSize: 11, color: '#a06080' }}>Выбери игрока — но действие не будет выполнено</div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 12 }}>
        {stepPlayers.map(p => {
          const isMafiaTarget = p.seatNumber === actions.mafiaTarget
          const isDead = !p.alive
          return (
            <button
              key={p.seatNumber}
              onClick={() => handleSelect(p.seatNumber)}
              className="action-btn"
              style={{ padding: '12px', opacity: isDead ? 0.5 : 1 }}
            >
              <div style={{ fontSize: 18, marginBottom: 4 }}>
                {isMafiaTarget ? '🎯' : isDead ? '💀' : ''}#{p.seatNumber}
              </div>
              <div style={{ fontSize: 11, color: '#888' }}>
                {p.nickname && p.nickname.slice(0, 10)}
              </div>
              {p.role && (
                <div style={{ fontSize: 10, color: ROLES[p.role].color, marginTop: 3 }}>
                  {ROLES[p.role].icon} {ROLES[p.role].name}
                </div>
              )}
            </button>
          )
        })}
      </div>

      <button className="bb-btn" onClick={handleSkip} style={{ width: '100%', marginBottom: 8 }}>
        ⏭️ Пропустить
      </button>

      <button className="bb-btn primary" style={{ width: '100%', marginBottom: 8 }} onClick={handleSkip}>
        {currentStep === nightSteps.length - 1 ? 'Завершить ночь ›' : 'Готово — дальше ›'}
      </button>

      {isModal && (
        <button className="bb-btn" style={{ width: '100%' }} onClick={onClose}>
          Пауза / стоп
        </button>
      )}
    </>
  )
}
