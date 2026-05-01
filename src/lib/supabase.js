// Mock Supabase implementation - использует localStorage без реальной БД
const USE_MOCK = true // Переключи на false когда настроишь реальный Supabase

let supabase = null

if (!USE_MOCK) {
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

    if (supabaseUrl && supabaseKey) {
      supabase = createClient(supabaseUrl, supabaseKey)
    }
  } catch (error) {
    console.log('Supabase не подключен, используется заглушка')
  }
}

// Mock storage
const mockStorage = {
  games: [],
}

// Генерируем UUID
function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

// Game history functions
export async function saveGame(gameData) {
  if (supabase && !USE_MOCK) {
    // Реальное сохранение в Supabase
    return await saveGameToSupabase(gameData)
  }

  // Mock сохранение в localStorage
  const game = {
    id: generateId(),
    played_at: new Date().toISOString(),
    winner: gameData.winner,
    day_count: gameData.dayCount,
    night_count: gameData.nightCount,
    duration_seconds: gameData.durationSeconds,
    players_in_game: gameData.players.map(p => ({
      id: generateId(),
      game_id: null, // будет установлено после
      seat_number: p.seatNumber,
      role: p.role,
      team: p.team,
      fouls: p.fouls || 0,
      survived: p.survived,
    })),
    game_events: gameData.events.map(e => ({
      id: generateId(),
      game_id: null, // будет установлено после
      event_time: new Date().toISOString(),
      phase: e.phase,
      event_type: e.eventType,
      description: e.description,
      affected_seat: e.affectedSeat,
    })),
  }

  mockStorage.games.push(game)
  saveMockToLocalStorage()

  console.log('✅ Игра сохранена локально:', game.id)
  return game
}

export async function loadGameHistory(limit = 10) {
  if (supabase && !USE_MOCK) {
    // Реальная загрузка из Supabase
    return await loadGameHistoryFromSupabase(limit)
  }

  // Mock загрузка из localStorage
  return mockStorage.games.slice().reverse().slice(0, limit)
}

// Вспомогательные функции для реального Supabase
async function saveGameToSupabase(gameData) {
  const { data: game, error: gameError } = await supabase
    .from('games')
    .insert([{
      winner: gameData.winner,
      day_count: gameData.dayCount,
      night_count: gameData.nightCount,
      duration_seconds: gameData.durationSeconds,
    }])
    .select()
    .single()

  if (gameError) throw gameError

  if (gameData.players && gameData.players.length > 0) {
    const playersData = gameData.players.map(p => ({
      game_id: game.id,
      seat_number: p.seatNumber,
      role: p.role,
      team: p.team,
      fouls: p.fouls || 0,
      survived: p.survived,
    }))

    const { error: playersError } = await supabase
      .from('players_in_game')
      .insert(playersData)

    if (playersError) throw playersError
  }

  if (gameData.events && gameData.events.length > 0) {
    const eventsData = gameData.events.map(e => ({
      game_id: game.id,
      phase: e.phase,
      event_type: e.eventType,
      description: e.description,
      affected_seat: e.affectedSeat,
    }))

    const { error: eventsError } = await supabase
      .from('game_events')
      .insert(eventsData)

    if (eventsError) throw eventsError
  }

  return game
}

async function loadGameHistoryFromSupabase(limit = 10) {
  const { data, error } = await supabase
    .from('games')
    .select(`
      *,
      players_in_game(*),
      game_events(*)
    `)
    .order('played_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}

// localStorage helpers
function saveMockToLocalStorage() {
  try {
    localStorage.setItem('mafia-games-mock', JSON.stringify(mockStorage.games))
  } catch (error) {
    console.error('Failed to save to localStorage:', error)
  }
}

function loadMockFromLocalStorage() {
  try {
    const data = localStorage.getItem('mafia-games-mock')
    if (data) {
      mockStorage.games = JSON.parse(data)
    }
  } catch (error) {
    console.error('Failed to load from localStorage:', error)
  }
}

// Initialize
loadMockFromLocalStorage()

export { supabase }

