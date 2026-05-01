import React, { useState } from 'react'
import { useGameStore, ROLES } from '../lib/gameStore'

export default function PlayerSheet({ player, onClose }) {
  const [showRoleList, setShowRoleList] = useState(false)
  const updatePlayer = useGameStore(state => state.updatePlayer)
  const assignRole = useGameStore(state => state.assignRole)
  const killPlayer = useGameStore(state => state.killPlayer)
  const revivePlayer = useGameStore(state => state.revivePlayer)
  const addFoul = useGameStore(state => state.addFoul)
  const setNominated = useGameStore(state => state.setNominated)

  if (!player) return null

  const handleKillToggle = () => {
    if (player.alive) {
      killPlayer(player.seatNumber)
    } else {
      revivePlayer(player.seatNumber)
    }
  }

  const handleAddFoul = () => {
    addFoul(player.seatNumber)
  }

  const handleNominateToggle = () => {
    setNominated(player.seatNumber, !player.nominated)
  }

  const handleAssignRole = (roleKey) => {
    const role = ROLES[roleKey]
    assignRole(player.seatNumber, roleKey, role.team)
    setShowRoleList(false)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50" onClick={onClose}>
      <div
        className="bottom-sheet w-full bg-dark-lighter rounded-t-2xl p-6 max-h-[80vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Игрок #{player.seatNumber}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Player info */}
        <div className="bg-dark p-4 rounded-lg mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-400 text-sm">Статус</p>
              <p className="text-white font-semibold">
                {player.alive ? '🟢 Жив' : '🔴 Мёртв'}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Фолы</p>
              <p className="text-white font-semibold">{player.fouls}/4</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Роль</p>
              <p className="text-white font-semibold">
                {player.role ? ROLES[player.role].name : 'Не назначена'}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Команда</p>
              <p className="text-white font-semibold">
                {player.team === 'black' ? '⬛ Чёрные' : player.team === 'red' ? '🔴 Красные' : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleKillToggle}
            className={`w-full px-4 py-3 font-semibold rounded-lg min-h-[44px] transition-colors ${
              player.alive
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {player.alive ? '☠️ Убить' : '✨ Воскресить'}
          </button>

          <button
            onClick={handleAddFoul}
            className="w-full px-4 py-3 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold rounded-lg min-h-[44px]"
          >
            ⚠️ Добавить фол ({player.fouls}/4)
          </button>

          <button
            onClick={handleNominateToggle}
            className={`w-full px-4 py-3 font-semibold rounded-lg min-h-[44px] transition-colors ${
              player.nominated
                ? 'bg-orange-600 hover:bg-orange-700 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-white'
            }`}
          >
            {player.nominated ? '❌ Снять выдвижение' : '📢 Выдвинуть'}
          </button>

          <div>
            <button
              onClick={() => setShowRoleList(!showRoleList)}
              className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg min-h-[44px]"
            >
              🎭 {showRoleList ? 'Скрыть' : 'Выбрать роль'}
            </button>

            {showRoleList && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                {Object.entries(ROLES).map(([key, role]) => (
                  <button
                    key={key}
                    onClick={() => handleAssignRole(key)}
                    className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg"
                  >
                    {role.icon} {role.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
