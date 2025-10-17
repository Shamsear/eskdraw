'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'

interface Team {
  id: string
  name: string
  logoUrl?: string
}

interface Player {
  id: string
  name: string
}

interface Pot {
  id: string
  potNumber: number
  name: string
  players: Player[]
}

interface Tournament {
  id: string
  name: string
  numPots: number
  status: string
  teams: Team[]
  pots: Pot[]
}

export default function TournamentManagePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [activeTab, setActiveTab] = useState<'teams' | 'players'>('teams')
  const [loading, setLoading] = useState(false)

  // Teams bulk upload
  const [teamsText, setTeamsText] = useState('')

  // Players bulk upload
  const [selectedPotId, setSelectedPotId] = useState('')
  const [playersText, setPlayersText] = useState('')

  // Delete modals
  const [deleteTeamModal, setDeleteTeamModal] = useState<{ show: boolean; teamId: string | null; teamName: string }>({ show: false, teamId: null, teamName: '' })
  const [deletePlayerModal, setDeletePlayerModal] = useState<{ show: boolean; playerId: string | null; playerName: string }>({ show: false, playerId: null, playerName: '' })

  // Bulk delete
  const [selectedTeams, setSelectedTeams] = useState<string[]>([])
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([])
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false)

  useEffect(() => {
    fetchTournament()
  }, [resolvedParams.id])

  const fetchTournament = async () => {
    try {
      const res = await fetch(`/api/tournaments/${resolvedParams.id}`)
      const data = await res.json()
      setTournament(data)
      if (data.pots.length > 0 && !selectedPotId) {
        setSelectedPotId(data.pots[0].id)
      }
    } catch (error) {
      console.error('Error fetching tournament:', error)
    }
  }

  const bulkAddTeams = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const teamNames = teamsText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)

    const teams = teamNames.map(name => ({ name }))

    const formData = new FormData()
    formData.append('teams', JSON.stringify(teams))

    try {
      const res = await fetch(`/api/tournaments/${resolvedParams.id}/teams`, {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        setTeamsText('')
        fetchTournament()
        alert('Teams added successfully!')
      }
    } catch (error) {
      console.error('Error adding teams:', error)
      alert('Failed to add teams')
    } finally {
      setLoading(false)
    }
  }

  const bulkAddPlayers = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const playerNames = playersText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)

    try {
      const res = await fetch(`/api/tournaments/${resolvedParams.id}/players`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          potId: selectedPotId,
          players: playerNames,
        }),
      })

      if (res.ok) {
        setPlayersText('')
        fetchTournament()
        alert('Players added successfully!')
      }
    } catch (error) {
      console.error('Error adding players:', error)
      alert('Failed to add players')
    } finally {
      setLoading(false)
    }
  }

  const confirmDeleteTeam = async () => {
    if (!deleteTeamModal.teamId) return
    setLoading(true)

    try {
      const res = await fetch(`/api/tournaments/${resolvedParams.id}/teams/${deleteTeamModal.teamId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setDeleteTeamModal({ show: false, teamId: null, teamName: '' })
        fetchTournament()
      } else {
        alert('Failed to delete team')
      }
    } catch (error) {
      console.error('Error deleting team:', error)
      alert('Failed to delete team')
    } finally {
      setLoading(false)
    }
  }

  const confirmDeletePlayer = async () => {
    if (!deletePlayerModal.playerId) return
    setLoading(true)

    try {
      const res = await fetch(`/api/tournaments/${resolvedParams.id}/players/${deletePlayerModal.playerId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setDeletePlayerModal({ show: false, playerId: null, playerName: '' })
        fetchTournament()
      } else {
        alert('Failed to delete player')
      }
    } catch (error) {
      console.error('Error deleting player:', error)
      alert('Failed to delete player')
    } finally {
      setLoading(false)
    }
  }

  const confirmBulkDelete = async () => {
    setLoading(true)
    const itemsToDelete = activeTab === 'teams' ? selectedTeams : selectedPlayers
    const deleteType = activeTab === 'teams' ? 'teams' : 'players'

    try {
      const deletePromises = itemsToDelete.map(id => 
        fetch(`/api/tournaments/${resolvedParams.id}/${deleteType}/${id}`, {
          method: 'DELETE',
        })
      )

      await Promise.all(deletePromises)
      
      setShowBulkDeleteModal(false)
      setSelectedTeams([])
      setSelectedPlayers([])
      fetchTournament()
    } catch (error) {
      console.error('Error bulk deleting:', error)
      alert('Failed to delete some items')
    } finally {
      setLoading(false)
    }
  }

  const toggleTeamSelection = (teamId: string) => {
    setSelectedTeams(prev => 
      prev.includes(teamId) 
        ? prev.filter(id => id !== teamId)
        : [...prev, teamId]
    )
  }

  const togglePlayerSelection = (playerId: string) => {
    setSelectedPlayers(prev => 
      prev.includes(playerId) 
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    )
  }

  const selectAllTeams = () => {
    if (selectedTeams.length === tournament?.teams.length) {
      setSelectedTeams([])
    } else {
      setSelectedTeams(tournament?.teams.map(t => t.id) || [])
    }
  }

  const selectAllPlayers = () => {
    const allPlayerIds = tournament?.pots.flatMap(pot => pot.players.map(p => p.id)) || []
    if (selectedPlayers.length === allPlayerIds.length) {
      setSelectedPlayers([])
    } else {
      setSelectedPlayers(allPlayerIds)
    }
  }

  const startSpinning = () => {
    router.push(`/admin/tournaments/${resolvedParams.id}/spin`)
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <div className="text-2xl font-semibold text-gray-700">Loading tournament...</div>
        </div>
      </div>
    )
  }

  const canStartSpinning = tournament.teams.length > 0 && 
    tournament.pots.every(pot => pot.players.length > 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-8 mb-8 border border-white/20">
          <button
            onClick={() => router.push('/admin')}
            className="text-indigo-600 hover:text-indigo-800 font-semibold mb-4 flex items-center gap-2 transition-colors"
          >
            ← Back to Tournaments
          </button>
          
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3">
                {tournament.name}
              </h1>
              <div className="flex gap-4 text-gray-600">
                <span className="flex items-center gap-2">
                  <span className="text-xl">👥</span>
                  <span className="font-semibold">{tournament.teams.length} Teams</span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-xl">🎯</span>
                  <span className="font-semibold">{tournament.numPots} Pots</span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-xl">📊</span>
                  <span className="font-semibold capitalize">{tournament.status}</span>
                </span>
              </div>
            </div>
            
            {canStartSpinning && tournament.status === 'setup' && (
              <button
                onClick={startSpinning}
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-10 py-5 rounded-2xl hover:shadow-2xl transition-all duration-300 text-xl font-bold flex items-center gap-3"
              >
                <span className="text-3xl">🤖</span>
                Start Auto Allocation
              </button>
            )}
            {tournament.status === 'spinning' && (
              <button
                onClick={startSpinning}
                className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-10 py-5 rounded-2xl hover:shadow-2xl transition-all duration-300 text-xl font-bold flex items-center gap-3 animate-pulse"
              >
                <span className="text-3xl">🤖</span>
                Continue Allocation
              </button>
            )}
          </div>
        </div>

        {!canStartSpinning && tournament.status === 'setup' && (
          <div className="bg-gradient-to-r from-yellow-100 to-orange-100 border-2 border-yellow-300 rounded-2xl p-6 mb-8 shadow-lg">
            <div className="flex items-center gap-3">
              <span className="text-4xl">⚠️</span>
              <div>
                <p className="text-yellow-900 font-bold text-lg">Setup Required</p>
                <p className="text-yellow-800">Add teams and players to all pots before starting auto allocation!</p>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => setActiveTab('teams')}
            className={`px-8 py-4 font-bold text-lg rounded-xl transition-all ${
              activeTab === 'teams'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                : 'bg-white/60 text-gray-600 hover:bg-white/80'
            }`}
          >
            👥 Teams ({tournament.teams.length})
          </button>
          <button
            onClick={() => setActiveTab('players')}
            className={`px-8 py-4 font-bold text-lg rounded-xl transition-all ${
              activeTab === 'players'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                : 'bg-white/60 text-gray-600 hover:bg-white/80'
            }`}
          >
            ⚽ Players ({tournament.pots.reduce((sum, pot) => sum + pot.players.length, 0)})
          </button>
        </div>

        {/* Teams Tab */}
        {activeTab === 'teams' && (
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-gray-100">
              <h2 className="text-3xl font-bold mb-6 text-gray-800 flex items-center gap-2">
                <span>📝</span> Bulk Add Teams
              </h2>
              <form onSubmit={bulkAddTeams} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    🎯 Team Names (one per line)
                  </label>
                  <textarea
                    value={teamsText}
                    onChange={(e) => setTeamsText(e.target.value)}
                    rows={15}
                    className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-200 focus:border-indigo-500 transition-all font-mono"
                    placeholder="Manchester United
Chelsea
Arsenal
Liverpool
Manchester City"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !teamsText.trim()}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-xl hover:shadow-xl transition-all disabled:opacity-50 font-bold text-lg"
                >
                  {loading ? '⏳ Adding...' : '✨ Add Teams'}
                </button>
              </form>
            </div>

            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                  <span>🏆</span> Current Teams
                </h2>
                {tournament.teams.length > 0 && (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={selectAllTeams}
                      className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors text-sm font-semibold"
                    >
                      {selectedTeams.length === tournament.teams.length ? 'Deselect All' : 'Select All'}
                    </button>
                    {selectedTeams.length > 0 && (
                      <button
                        onClick={() => setShowBulkDeleteModal(true)}
                        className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-semibold flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete ({selectedTeams.length})
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                {tournament.teams.map((team, index) => (
                  <div
                    key={team.id}
                    className={`p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl flex items-center gap-4 border transition-all ${
                      selectedTeams.includes(team.id) 
                        ? 'border-indigo-500 border-2 shadow-lg bg-gradient-to-r from-indigo-100 to-purple-100' 
                        : 'border-indigo-100 hover:shadow-md'
                    }`}
                  >
                    <label className="relative flex items-center cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={selectedTeams.includes(team.id)}
                        onChange={() => toggleTeamSelection(team.id)}
                        className="sr-only peer"
                      />
                      <div className="w-6 h-6 bg-white border-2 border-indigo-300 rounded-lg peer-checked:bg-gradient-to-br peer-checked:from-indigo-600 peer-checked:to-purple-600 peer-checked:border-indigo-600 transition-all duration-200 flex items-center justify-center group-hover:border-indigo-500 shadow-sm">
                        <svg className={`w-4 h-4 text-white transition-opacity duration-200 ${
                          selectedTeams.includes(team.id) ? 'opacity-100' : 'opacity-0'
                        }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </label>
                    <span className="font-bold text-indigo-600 text-lg">#{index + 1}</span>
                    <span className="text-gray-800 font-semibold flex-1">{team.name}</span>
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setDeleteTeamModal({ show: true, teamId: team.id, teamName: team.name })
                      }}
                      className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                      title="Delete team"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
                {tournament.teams.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-5xl mb-3">👥</div>
                    <p className="text-gray-500">No teams added yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Players Tab */}
        {activeTab === 'players' && (
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-gray-100">
              <h2 className="text-3xl font-bold mb-6 text-gray-800 flex items-center gap-2">
                <span>⚽</span> Bulk Add Players
              </h2>
              <form onSubmit={bulkAddPlayers} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    🎯 Select Pot
                  </label>
                  <select
                    value={selectedPotId}
                    onChange={(e) => setSelectedPotId(e.target.value)}
                    className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-200 focus:border-indigo-500 transition-all font-semibold text-gray-800 bg-gradient-to-r from-indigo-50 to-purple-50"
                  >
                    {tournament.pots.map((pot) => (
                      <option key={pot.id} value={pot.id}>
                        {pot.name} ({pot.players.length} players)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    🎮 Player Names (one per line)
                  </label>
                  <textarea
                    value={playersText}
                    onChange={(e) => setPlayersText(e.target.value)}
                    rows={12}
                    className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-200 focus:border-indigo-500 transition-all font-mono"
                    placeholder="Cristiano Ronaldo
Lionel Messi
Neymar Jr
Kylian Mbappé
Erling Haaland"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !playersText.trim()}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-xl hover:shadow-xl transition-all disabled:opacity-50 font-bold text-lg"
                >
                  {loading ? '⏳ Adding...' : '✨ Add Players'}
                </button>
              </form>
            </div>

            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                  <span>🎖️</span> Current Players
                </h2>
                {tournament.pots.some(pot => pot.players.length > 0) && (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={selectAllPlayers}
                      className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors text-sm font-semibold"
                    >
                      {selectedPlayers.length === tournament.pots.flatMap(p => p.players).length ? 'Deselect All' : 'Select All'}
                    </button>
                    {selectedPlayers.length > 0 && (
                      <button
                        onClick={() => setShowBulkDeleteModal(true)}
                        className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-semibold flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete ({selectedPlayers.length})
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2">
                {tournament.pots.map((pot) => (
                  <div key={pot.id} className="bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 rounded-2xl p-6 border-2 border-purple-100 shadow-lg">
                    <h3 className="font-bold text-xl bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4 flex items-center gap-2">
                      <span className="text-2xl">🎯</span>
                      {pot.name} <span className="text-sm font-semibold text-gray-600">({pot.players.length} players)</span>
                    </h3>
                    <div className="space-y-2">
                      {pot.players.map((player, index) => (
                        <div
                          key={player.id}
                          className={`p-3 bg-white/80 backdrop-blur-sm rounded-xl flex items-center gap-3 border transition-all ${
                            selectedPlayers.includes(player.id)
                              ? 'border-indigo-500 border-2 shadow-lg bg-gradient-to-r from-indigo-50 to-purple-50'
                              : 'border-indigo-100 hover:shadow-md'
                          }`}
                        >
                          <label className="relative flex items-center cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={selectedPlayers.includes(player.id)}
                              onChange={() => togglePlayerSelection(player.id)}
                              className="sr-only peer"
                            />
                            <div className="w-5 h-5 bg-white border-2 border-indigo-300 rounded-lg peer-checked:bg-gradient-to-br peer-checked:from-indigo-600 peer-checked:to-purple-600 peer-checked:border-indigo-600 transition-all duration-200 flex items-center justify-center group-hover:border-indigo-500 shadow-sm">
                              <svg className={`w-3.5 h-3.5 text-white transition-opacity duration-200 ${
                                selectedPlayers.includes(player.id) ? 'opacity-100' : 'opacity-0'
                              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          </label>
                          <span className="font-bold text-indigo-600 text-sm min-w-[32px] h-8 flex items-center justify-center bg-indigo-100 rounded-lg">#{index + 1}</span>
                          <span className="text-gray-800 font-semibold flex-1">{player.name}</span>
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              setDeletePlayerModal({ show: true, playerId: player.id, playerName: player.name })
                            }}
                            className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                            title="Delete player"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      ))}
                      {pot.players.length === 0 && (
                        <div className="text-center py-8">
                          <div className="text-4xl mb-2">⚽</div>
                          <p className="text-gray-500 text-sm italic">No players in this pot</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {tournament.pots.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-5xl mb-3">🎯</div>
                    <p className="text-gray-500">No pots available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Team Modal */}
      {deleteTeamModal.show && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in duration-300">
            <div className="bg-gradient-to-r from-red-500 to-red-600 p-8">
              <div className="flex items-center justify-center mb-4">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
              </div>
              <h3 className="text-3xl font-black text-white text-center">Delete Team?</h3>
            </div>

            <div className="p-8">
              <p className="text-center text-gray-700 text-lg mb-2">
                Are you sure you want to delete
              </p>
              <p className="text-center text-2xl font-bold text-gray-900 mb-6">
                {deleteTeamModal.teamName}
              </p>
              <p className="text-center text-sm text-red-600 mb-8">
                ⚠️ This action cannot be undone and will remove all related allocations.
              </p>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setDeleteTeamModal({ show: false, teamId: null, teamName: '' })}
                  disabled={loading}
                  className="flex-1 px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-2xl font-bold text-lg hover:bg-gray-50 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteTeam}
                  disabled={loading}
                  className="flex-1 px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-2xl font-bold text-lg hover:shadow-2xl disabled:opacity-50 transition-all"
                >
                  {loading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in duration-300">
            <div className="bg-gradient-to-r from-red-500 to-red-600 p-8">
              <div className="flex items-center justify-center mb-4">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
              </div>
              <h3 className="text-3xl font-black text-white text-center">Bulk Delete?</h3>
            </div>

            <div className="p-8">
              <p className="text-center text-gray-700 text-lg mb-2">
                Are you sure you want to delete
              </p>
              <p className="text-center text-3xl font-bold text-gray-900 mb-6">
                {activeTab === 'teams' ? selectedTeams.length : selectedPlayers.length}
                {' '}
                {activeTab === 'teams' ? 'team' : 'player'}
                {(activeTab === 'teams' ? selectedTeams.length : selectedPlayers.length) > 1 ? 's' : ''}?
              </p>
              <p className="text-center text-sm text-red-600 mb-8">
                ⚠️ This action cannot be undone and will remove all related allocations.
              </p>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowBulkDeleteModal(false)}
                  disabled={loading}
                  className="flex-1 px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-2xl font-bold text-lg hover:bg-gray-50 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmBulkDelete}
                  disabled={loading}
                  className="flex-1 px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-2xl font-bold text-lg hover:shadow-2xl disabled:opacity-50 transition-all"
                >
                  {loading ? 'Deleting...' : 'Delete All'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Player Modal */}
      {deletePlayerModal.show && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in duration-300">
            <div className="bg-gradient-to-r from-red-500 to-red-600 p-8">
              <div className="flex items-center justify-center mb-4">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
              </div>
              <h3 className="text-3xl font-black text-white text-center">Delete Player?</h3>
            </div>

            <div className="p-8">
              <p className="text-center text-gray-700 text-lg mb-2">
                Are you sure you want to delete
              </p>
              <p className="text-center text-2xl font-bold text-gray-900 mb-6">
                {deletePlayerModal.playerName}
              </p>
              <p className="text-center text-sm text-red-600 mb-8">
                ⚠️ This action cannot be undone and will remove all related allocations.
              </p>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setDeletePlayerModal({ show: false, playerId: null, playerName: '' })}
                  disabled={loading}
                  className="flex-1 px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-2xl font-bold text-lg hover:bg-gray-50 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeletePlayer}
                  disabled={loading}
                  className="flex-1 px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-2xl font-bold text-lg hover:shadow-2xl disabled:opacity-50 transition-all"
                >
                  {loading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
