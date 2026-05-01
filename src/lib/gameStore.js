import { create } from 'zustand'

export const useGameStore = create((set, get) => ({
  // Main menu state
  screen: 'menu', // menu, playerSetup, roleSetup, gameplay

  // Game state
  gamePhase: 'setup', // setup, day, night, voting, endgame
  players: Array.from({ length: 12 }, (_, i) => ({
    seatNumber: i + 1,
    nickname: '',
    role: 'civilian',
    team: 'red',
    alive: true,
    fouls: 0,
    nominated: false,
    protected: false,
    frozen: false,
    lastHealed: -1,
    lastFrozen: -1,
  })),
  dayCount: 0,
  nightCount: 0,
  gameStartTime: null,
  events: [],
  winner: null,
  reVoteUsed: false,
  lastVoteResult: null,

  // Rating/History
  gameHistory: [],

  // Screen navigation
  goToMenu: () => set({ screen: 'menu' }),
  goToPlayerSetup: () => set({ screen: 'playerSetup', gamePhase: 'setup' }),
  goToRoleSetup: () => set({ screen: 'roleSetup', gamePhase: 'setup' }),
  goToGameplay: () => set({ screen: 'gameplay' }),
  transitionToEndgame: () => set({ gamePhase: 'endgame' }),

  // Initialize players with nicknames
  setPlayerNickname: (seatNumber, nickname) => set(state => ({
    players: state.players.map(p =>
      p.seatNumber === seatNumber ? { ...p, nickname } : p
    )
  })),

  // Initialize players for new game
  initializePlayers: (playerCount = 12) => set(state => ({
    players: Array.from({ length: playerCount }, (_, i) => ({
      seatNumber: i + 1,
      nickname: '',
      role: 'civilian',
      team: 'red',
      alive: true,
      fouls: 0,
      nominated: false,
      protected: false,
      frozen: false,
      lastHealed: -1,
      lastFrozen: -1,
    })),
    dayCount: 0,
    nightCount: 0,
    gameStartTime: null,
    events: [],
    winner: null,
    reVoteUsed: false,
  })),

  // Update player
  updatePlayer: (seatNumber, updates) => set(state => ({
    players: state.players.map(p =>
      p.seatNumber === seatNumber ? { ...p, ...updates } : p
    )
  })),

  // Assign role to player
  assignRole: (seatNumber, role, team) => set(state => ({
    players: state.players.map(p =>
      p.seatNumber === seatNumber ? { ...p, role, team } : p
    )
  })),

  // Add arbitrary event to log
  addEvent: (event) => set(state => ({
    events: [...state.events, {
      ...event,
      nightNumber: state.nightCount,
      dayNumber: state.dayCount,
      timestamp: new Date().toISOString(),
    }]
  })),

  // Kill player without auto-logging (caller logs manually)
  killPlayerNoLog: (seatNumber) => set(state => ({
    players: state.players.map(p =>
      p.seatNumber === seatNumber ? { ...p, alive: false } : p
    )
  })),

  // Don takes a player with him after being voted out
  donTakePlayer: (seatNumber) => set(state => {
    const player = state.players.find(p => p.seatNumber === seatNumber)
    return {
      players: state.players.map(p =>
        p.seatNumber === seatNumber ? { ...p, alive: false } : p
      ),
      events: [...state.events, {
        phase: state.gamePhase,
        eventType: 'don_take',
        description: `№${seatNumber}${player.nickname ? ` — ${player.nickname}` : ''} забран Доном`,
        affectedSeat: seatNumber,
        dayNumber: state.dayCount,
        nightNumber: state.nightCount,
        timestamp: new Date().toISOString(),
      }]
    }
  }),

  // Vote out player (city voting, day phase)
  voteOutPlayer: (seatNumber) => set(state => {
    const player = state.players.find(p => p.seatNumber === seatNumber)
    const updatedPlayers = state.players.map(p =>
      p.seatNumber === seatNumber ? { ...p, alive: false } : p
    )
    return {
      players: updatedPlayers,
      events: [...state.events, {
        phase: state.gamePhase,
        eventType: 'vote_out',
        description: `№${seatNumber}${player.nickname ? ` — ${player.nickname}` : ''} заголосован городом`,
        affectedSeat: seatNumber,
        dayNumber: state.dayCount,
        nightNumber: state.nightCount,
        timestamp: new Date().toISOString(),
      }]
    }
  }),

  // Kill player
  killPlayer: (seatNumber) => set(state => {
    const player = state.players.find(p => p.seatNumber === seatNumber)
    const updatedPlayers = state.players.map(p =>
      p.seatNumber === seatNumber ? { ...p, alive: false } : p
    )
    return {
      players: updatedPlayers,
      events: [...state.events, {
        phase: state.gamePhase,
        eventType: 'kill',
        description: `№${seatNumber}${player.nickname ? ` — ${player.nickname}` : ''} убит`,
        affectedSeat: seatNumber,
        timestamp: new Date().toISOString(),
      }]
    }
  }),

  // Revive player
  revivePlayer: (seatNumber) => set(state => ({
    players: state.players.map(p =>
      p.seatNumber === seatNumber ? { ...p, alive: true } : p
    )
  })),

  // Add foul
  addFoul: (seatNumber) => set(state => {
    const player = state.players.find(p => p.seatNumber === seatNumber)
    const newFouls = (player?.fouls || 0) + 1
    const autoKill = newFouls === 4

    const updatedPlayers = state.players.map(p =>
      p.seatNumber === seatNumber
        ? { ...p, fouls: newFouls, alive: !autoKill }
        : p
    )

    const newEvent = {
      phase: state.gamePhase,
      eventType: autoKill ? 'auto_kill' : 'foul',
      description: autoKill
        ? `№${seatNumber}${player.nickname ? ` — ${player.nickname}` : ''} убит за 4 фола`
        : `№${seatNumber}${player.nickname ? ` — ${player.nickname}` : ''}: ${newFouls} фол${newFouls > 1 ? 'а' : ''}`,
      affectedSeat: seatNumber,
      timestamp: new Date().toISOString(),
    }

    return {
      players: updatedPlayers,
      events: [...state.events, newEvent]
    }
  }),

  // Set nomination
  setNominated: (seatNumber, nominated) => set(state => ({
    players: state.players.map(p =>
      p.seatNumber === seatNumber ? { ...p, nominated } : p
    ),
    events: nominated ? [...state.events, {
      phase: state.gamePhase,
      eventType: 'nomination',
      description: `№${seatNumber}${state.players.find(p => p.seatNumber === seatNumber)?.nickname ? ` — ${state.players.find(p => p.seatNumber === seatNumber).nickname}` : ''} выдвинут`,
      affectedSeat: seatNumber,
      timestamp: new Date().toISOString(),
    }] : state.events
  })),

  // Heal player
  healPlayer: (seatNumber) => set(state => {
    const nightNum = state.nightCount
    return {
      players: state.players.map(p =>
        p.seatNumber === seatNumber ? { ...p, protected: true, lastHealed: nightNum } : p
      )
    }
  }),

  // Freeze player (Putana)
  freezePlayer: (seatNumber) => set(state => {
    const nightNum = state.nightCount
    return {
      players: state.players.map(p =>
        p.seatNumber === seatNumber ? { ...p, frozen: true, lastFrozen: nightNum } : p
      )
    }
  }),

  // Store night actions for processing
  nightActions: {
    mafiaTarget: null,
    putanaTarget: null,
    doctorTarget: null,
    kommissarTarget: null,
    maniacTarget: null,
  },

  setNightAction: (action, target) => set(state => ({
    nightActions: {
      ...state.nightActions,
      [action]: target
    }
  })),

  // Process all night actions and resolve conflicts
  processNightActions: () => set(state => {
    const actions = state.nightActions
    let updatedPlayers = [...state.players]

    // Track who is frozen and who is healed
    const frozenPlayers = new Set()
    const healedPlayers = new Set()
    const killedPlayers = new Set()

    // Step 1: Putana freezes someone (this prevents their action)
    if (actions.putanaTarget) {
      frozenPlayers.add(actions.putanaTarget)
    }

    // Step 2: Doctor heals someone (saves them from mafia kill)
    if (actions.doctorTarget) {
      healedPlayers.add(actions.doctorTarget)
    }

    // Step 3: Mafia kills (if not healed)
    if (actions.mafiaTarget && !healedPlayers.has(actions.mafiaTarget)) {
      killedPlayers.add(actions.mafiaTarget)
    }

    // Step 4: If doctor was healed/frozen, they couldn't heal anyone
    if (frozenPlayers.has(actions.doctorTarget)) {
      healedPlayers.delete(actions.doctorTarget)
    }

    // Step 5: Apply all effects
    updatedPlayers = updatedPlayers.map(p => {
      let updated = { ...p }

      // Kill players
      if (killedPlayers.has(p.seatNumber)) {
        updated.alive = false
      }

      // Mark frozen/protected status (will be cleared at day start)
      if (frozenPlayers.has(p.seatNumber)) {
        updated.frozen = true
      }
      if (healedPlayers.has(p.seatNumber)) {
        updated.protected = true
      }

      return updated
    })

    // Log the night results
    const newEvents = [...state.events]
    if (actions.mafiaTarget) {
      const victim = state.players.find(p => p.seatNumber === actions.mafiaTarget)
      if (!healedPlayers.has(actions.mafiaTarget)) {
        newEvents.push({
          phase: 'night',
          eventType: 'kill',
          description: `№${actions.mafiaTarget}${victim.nickname ? ` — ${victim.nickname}` : ''} убит мафией`,
          affectedSeat: actions.mafiaTarget,
          timestamp: new Date().toISOString(),
        })
      } else {
        newEvents.push({
          phase: 'night',
          eventType: 'heal',
          description: `№${actions.mafiaTarget}${victim.nickname ? ` — ${victim.nickname}` : ''} спасён доктором`,
          affectedSeat: actions.mafiaTarget,
          timestamp: new Date().toISOString(),
        })
      }
    }

    if (actions.putanaTarget && actions.doctorTarget !== actions.putanaTarget) {
      const target = state.players.find(p => p.seatNumber === actions.putanaTarget)
      newEvents.push({
        phase: 'night',
        eventType: 'freeze',
        description: `№${actions.putanaTarget}${target.nickname ? ` — ${target.nickname}` : ''} заморожен`,
        affectedSeat: actions.putanaTarget,
        timestamp: new Date().toISOString(),
      })
    }

    return {
      players: updatedPlayers,
      events: newEvents,
      nightActions: {
        mafiaTarget: null,
        putanaTarget: null,
        doctorTarget: null,
        kommissarTarget: null,
        maniacTarget: null,
      }
    }
  }),

  // Clear night effects
  clearNightEffects: () => set(state => ({
    players: state.players.map(p => ({
      ...p,
      protected: false,
      frozen: false,
    }))
  })),

  // Phase transitions
  startGame: () => set(state => ({
    screen: 'gameplay',
    gamePhase: 'day',
    gameStartTime: Date.now(),
    dayCount: 1,
    events: [...state.events, {
      phase: 'setup',
      eventType: 'game_start',
      description: 'Игра началась',
      timestamp: new Date().toISOString(),
    }]
  })),

  startNight: () => set(state => {
    const newNightCount = state.nightCount + 1
    return {
      gamePhase: 'night',
      nightCount: newNightCount,
      players: state.players.map(p => ({ ...p, nominated: false })),
      events: [...state.events, {
        phase: 'day',
        eventType: 'night_start',
        description: `Ночь ${newNightCount}`,
        timestamp: new Date().toISOString(),
      }]
    }
  }),

  startVoting: () => set(state => ({
    gamePhase: 'voting',
    events: [...state.events, {
      phase: 'day',
      eventType: 'voting_start',
      description: 'Начало голосования',
      timestamp: new Date().toISOString(),
    }]
  })),

  endDay: () => set(state => ({
    gamePhase: 'day',
    dayCount: state.dayCount + 1,
    reVoteUsed: false,
    players: state.players.map(p => ({ ...p, nominated: false })),
    events: [...state.events, {
      phase: 'voting',
      eventType: 'day_end',
      description: `День ${state.dayCount} закончился`,
      timestamp: new Date().toISOString(),
    }]
  })),

  // End game
  endGame: (winner) => set(state => {
    const gameDuration = Math.floor((Date.now() - (state.gameStartTime || Date.now())) / 1000)
    const newGame = {
      id: Date.now(),
      winner,
      dayCount: state.dayCount,
      nightCount: state.nightCount,
      duration: gameDuration,
      players: state.players.map(p => ({
        seatNumber: p.seatNumber,
        nickname: p.nickname,
        role: p.role,
        team: p.team,
        survived: p.alive,
      })),
      date: new Date().toISOString(),
    }
    return {
      gamePhase: 'endgame',
      winner,
      gameHistory: [newGame, ...state.gameHistory],
      events: [...state.events, {
        phase: 'gameplay',
        eventType: 'game_end',
        description: `Победила команда: ${winner === 'black' ? 'Чёрные' : winner === 'red' ? 'Красные' : 'Ничья'}`,
        timestamp: new Date().toISOString(),
      }]
    }
  }),

  // Reset game
  resetGame: () => set({
    screen: 'menu',
    gamePhase: 'setup',
    players: Array.from({ length: 12 }, (_, i) => ({
      seatNumber: i + 1,
      nickname: '',
      role: 'civilian',
      team: 'red',
      alive: true,
      fouls: 0,
      nominated: false,
      protected: false,
      frozen: false,
      lastHealed: -1,
      lastFrozen: -1,
    })),
    dayCount: 0,
    nightCount: 0,
    gameStartTime: null,
    events: [],
    winner: null,
    reVoteUsed: false,
  }),

  // Set re-vote used
  setReVoteUsed: (used) => set({ reVoteUsed: used }),

  // Set last vote result
  setLastVoteResult: (result) => set({ lastVoteResult: result }),

  // Getters
  getGameDuration: () => {
    const state = get()
    if (!state.gameStartTime) return 0
    return Math.floor((Date.now() - state.gameStartTime) / 1000)
  },

  getAlivePlayers: () => {
    const state = get()
    return state.players.filter(p => p.alive)
  },

  getAliveByTeam: (team) => {
    const state = get()
    return state.players.filter(p => p.alive && p.team === team)
  },

  getNominatedPlayers: () => {
    const state = get()
    return state.players.filter(p => p.nominated && p.alive)
  },

  checkGameEnd: () => {
    const state = get()
    const alive = state.getAlivePlayers()
    const blackAlive = state.getAliveByTeam('black')
    const redAlive = state.getAliveByTeam('red')
    const maniacs = state.players.filter(p => p.alive && p.role === 'maniac')

    // Black wins if no red players left
    if (redAlive.length === 0) return 'black'

    // Red wins if no black players left
    if (blackAlive.length === 0) return 'red'

    // Black wins if black >= red and no maniac
    if (blackAlive.length >= redAlive.length && maniacs.length === 0) return 'black'

    return null
  },

  getPlayerStats: () => {
    const state = get()
    const stats = {}
    state.players.forEach(p => {
      if (p.nickname) {
        stats[p.nickname] = {
          role: p.role,
          team: p.team,
          survived: p.alive,
          fouls: p.fouls,
        }
      }
    })
    return stats
  },
}))

// Role definitions
export const ROLES = {
  don: { name: 'Дон', icon: '🎩', team: 'black', color: '#e24b4a' },
  mafia: { name: 'Мафия', icon: '🔫', team: 'black', color: '#e24b4a' },
  putana: { name: 'Путана', icon: '💋', team: 'black', color: '#d4537e' },
  komissar: { name: 'Комиссар', icon: '🔍', team: 'red', color: '#378add' },
  doctor: { name: 'Доктор', icon: '💊', team: 'red', color: '#1d9e75' },
  maniac: { name: 'Маньяк', icon: '🤡', team: 'red', color: '#9b6cf5' },
  civilian: { name: 'Мирный', icon: '👤', team: 'red', color: '#666' },
}
