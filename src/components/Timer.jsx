import React, { useState, useEffect } from 'react'
import { useGameStore } from '../lib/gameStore'

export default function Timer({ phase }) {
  const [duration, setDuration] = useState(getInitialTime(phase))
  const [timeLeft, setTimeLeft] = useState(getInitialTime(phase))
  const [isRunning, setIsRunning] = useState(false)
  const startNight = useGameStore(state => state.startNight)
  const endDay = useGameStore(state => state.endDay)

  useEffect(() => {
    if (!isRunning || timeLeft === 0) return

    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1)
      if (timeLeft === 1) {
        playBeep()
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [isRunning, timeLeft])

  const handleReset = () => {
    setTimeLeft(duration)
    setIsRunning(false)
  }

  const handleToggleDuration = () => {
    const next = duration === 120 ? 30 : 120
    setDuration(next)
    setTimeLeft(next)
    setIsRunning(false)
  }

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60

  const getLabel = () => {
    if (phase === 'day') return 'Балаган'
    if (phase === 'night') return 'Ночная фаза'
    if (phase === 'voting') return 'Голосование'
    return 'Таймер'
  }

  return (
    <div className="timer-card">
      <div>
        <div className="timer-label">{getLabel()}</div>
        <div className="timer-val">
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>
      </div>
      <div className="timer-btns">
        <button
          className="t-btn"
          onClick={handleToggleDuration}
          title={duration === 120 ? '2:00 → 0:30' : '0:30 → 2:00'}
          style={{ fontSize: 11, fontWeight: 700, color: '#888', width: 52 }}
        >
          {duration === 120 ? '0:30' : '2:00'}
        </button>
        <button
          className="t-btn"
          onClick={handleReset}
          title="Сброс"
        >
          ↺
        </button>
        <button
          className="t-btn"
          onClick={() => setIsRunning(!isRunning)}
          title={isRunning ? 'Пауза' : 'Старт'}
        >
          {isRunning ? '⏸' : '▶'}
        </button>
      </div>
    </div>
  )
}

function getInitialTime(phase) {
  const times = {
    day: 120,    // 2 minutes
    voting: 30,  // 30 seconds
    night: 30,   // 30 seconds
  }
  return times[phase] || 120
}

function playBeep() {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.value = 800
    oscillator.type = 'sine'

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.5)
  } catch (error) {
    console.log('Audio not available:', error)
  }
}
