'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'

interface Team {
  id: string
  name: string
  logoUrl?: string
  allocations: any[]
}

interface Player {
  id: string
  name: string
  potId: string
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
  teams: Team[]
  pots: Pot[]
  allocations: any[]
  playersPerTeam: number
}

export default function AutoAllocationPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [isAllocating, setIsAllocating] = useState(false)
  const [allocationProgress, setAllocationProgress] = useState(0)
  const [playersPerTeam, setPlayersPerTeam] = useState(0)
  const [teamAllocations, setTeamAllocations] = useState<Map<string, any[]>>(new Map())
  const [showResults, setShowResults] = useState(false)

  useEffect(() => {
    fetchTournament()
  }, [resolvedParams.id])

  useEffect(() => {
    if (tournament) {
      // Use tournament's configured players per team
      setPlayersPerTeam(tournament.playersPerTeam)
    }
  }, [tournament])

  const fetchTournament = async () => {
    try {
      const res = await fetch(`/api/tournaments/${resolvedParams.id}`)
      const data = await res.json()
      setTournament(data)
      
      // Build team allocations map
      const allocMap = new Map<string, any[]>()
      data.teams.forEach((team: Team) => {
        allocMap.set(team.id, data.allocations?.filter((a: any) => a.teamId === team.id) || [])
      })
      setTeamAllocations(allocMap)
    } catch (error) {
      console.error('Error fetching tournament:', error)
    }
  }

  const startAutoAllocation = async () => {
    if (!tournament) return

    setIsAllocating(true)
    setAllocationProgress(0)
    
    // Initialize empty allocations for each team
    const allocMap = new Map<string, any[]>()
    tournament.teams.forEach(team => {
      allocMap.set(team.id, [])
    })
    setTeamAllocations(allocMap)

    try {
      // Shuffle function for randomness
      const shuffle = <T,>(array: T[]): T[] => {
        const shuffled = [...array]
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
        }
        return shuffled
      }

      const allAllocations: any[] = []
      
      // Calculate total allocations needed
      // Each team should get playersPerTeam players, one from each pot
      // So we need to select playersPerTeam pots from available pots
      const potsToUse = tournament.pots.slice(0, Math.min(playersPerTeam, tournament.pots.length))
      const totalAllocations = tournament.teams.length * potsToUse.length

      // STRICT RULE: For each pot, allocate ONE player to each team
      // This ensures no team gets multiple players from the same pot
      for (const pot of potsToUse) {
        const shuffledPlayers = shuffle([...pot.players])
        const shuffledTeams = shuffle([...tournament.teams])

        // Allocate one player from this pot to each team
        for (let i = 0; i < Math.min(shuffledPlayers.length, shuffledTeams.length); i++) {
          const player = shuffledPlayers[i]
          const team = shuffledTeams[i]

          // Send allocation to API (which also enforces this rule via unique constraint)
          const res = await fetch(`/api/tournaments/${resolvedParams.id}/spin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              teamId: team.id,
              playerId: player.id,
            }),
          })

          if (res.ok) {
            const data = await res.json()
            allAllocations.push(data.allocation)
            
            // Update team allocations map
            setTeamAllocations(prev => {
              const newMap = new Map(prev)
              const teamAllocs = newMap.get(team.id) || []
              newMap.set(team.id, [...teamAllocs, data.allocation])
              return newMap
            })
            
            setAllocationProgress((allAllocations.length / totalAllocations) * 100)

            // Add a small delay for visual effect
            await new Promise(resolve => setTimeout(resolve, 200))
          } else {
            // If allocation fails (e.g., duplicate pot-team combination), log and continue
            const error = await res.json()
            console.error(`Failed to allocate ${player.name} to ${team.name}:`, error)
          }
        }
      }

      setIsAllocating(false)
      setShowResults(true)

      // Redirect to results after a delay
      setTimeout(() => {
        router.push(`/admin/tournaments/${resolvedParams.id}/results`)
      }, 3000)

    } catch (error) {
      console.error('Error during auto-allocation:', error)
      setIsAllocating(false)
      alert('Failed to complete allocation')
    }
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">⏳</div>
          <div className="text-2xl font-semibold text-gray-700">Loading tournament...</div>
        </div>
      </div>
    )
  }

  const totalPlayers = tournament.pots.reduce((sum, pot) => sum + pot.players.length, 0)
  const canAllocate = tournament.teams.length > 0 && totalPlayers > 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-8 relative overflow-hidden">
      {/* Floating Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-purple-300/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-300/30 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-300/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-8 mb-8 border border-white/20">
          <button
            onClick={() => router.push(`/admin/tournaments/${resolvedParams.id}`)}
            className="text-indigo-600 hover:text-indigo-800 font-semibold mb-4 flex items-center gap-2 transition-colors"
          >
            ← Back to Tournament
          </button>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-3">
            <span className="text-5xl">🤖</span> Auto Allocation
          </h1>
          <p className="text-gray-600 mt-3 text-lg">Automatically distribute players fairly across all teams</p>
        </div>

        {/* Configuration Card */}
        <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl p-8 mb-8 border border-white/20">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <span>⚙️</span> Allocation Settings
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border-2 border-indigo-200">
              <div className="text-4xl mb-2">👥</div>
              <div className="text-3xl font-bold text-indigo-600">{tournament.teams.length}</div>
              <div className="text-gray-600 font-semibold">Teams</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">
              <div className="text-4xl mb-2">⚽</div>
              <div className="text-3xl font-bold text-purple-600">{totalPlayers}</div>
              <div className="text-gray-600 font-semibold">Total Players</div>
            </div>
            <div className="bg-gradient-to-br from-pink-50 to-red-50 rounded-xl p-6 border-2 border-pink-200">
              <div className="text-4xl mb-2">🎯</div>
              <div className="text-3xl font-bold text-pink-600">{tournament.pots.length}</div>
              <div className="text-gray-600 font-semibold">Pots</div>
            </div>
          </div>

          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
            <h3 className="font-bold text-blue-900 text-lg mb-2">📌 Allocation Strategy</h3>
            <p className="text-blue-800">Each team will receive <span className="font-bold">{playersPerTeam} player(s)</span> (one from each pot) to ensure fair distribution.</p>
          </div>

          {canAllocate ? (
            <button
              onClick={startAutoAllocation}
              disabled={isAllocating}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-10 py-6 rounded-2xl hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed font-bold text-2xl flex items-center justify-center gap-3"
            >
              {isAllocating ? (
                <>
                  <span className="animate-spin">⚙️</span> Allocating...
                </>
              ) : (
                <>
                  <span>🚀</span> Start Auto Allocation
                </>
              )}
            </button>
          ) : (
            <div className="bg-red-100 border-2 border-red-300 rounded-xl p-6 text-center">
              <p className="text-red-800 font-bold">⚠️ Please add teams and players before starting allocation</p>
            </div>
          )}
        </div>

        {/* Progress */}
        {isAllocating && (
          <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl p-8 mb-8 border border-white/20">
            <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>📊</span> Allocation Progress
            </h3>
            <div className="mb-4">
              <div className="flex justify-between text-sm font-semibold text-gray-600 mb-2">
                <span>{Array.from(teamAllocations.values()).flat().length} allocated</span>
                <span>{Math.round(allocationProgress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden shadow-inner">
                <div
                  className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-6 rounded-full transition-all duration-300 relative overflow-hidden"
                  style={{ width: `${allocationProgress}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Team Cards with Player Slots */}
        {tournament && tournament.teams.length > 0 && (
          <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-white/20">
            <h3 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-6 flex items-center gap-2">
              <span className="text-4xl">🏆</span> Team Allocations
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tournament.teams.map((team, teamIndex) => {
                const allocations = teamAllocations.get(team.id) || []
                const emptySlots = playersPerTeam - allocations.length
                
                return (
                  <div
                    key={team.id}
                    className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-indigo-200 shadow-lg hover:shadow-xl transition-all"
                  >
                    {/* Team Header */}
                    <div className="flex items-center gap-3 mb-4 pb-4 border-b-2 border-indigo-200">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                        {teamIndex + 1}
                      </div>
                      <h4 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent flex-1">
                        {team.name}
                      </h4>
                      <span className="text-sm font-bold text-indigo-600 bg-indigo-100 px-3 py-1 rounded-full">
                        {allocations.length}/{playersPerTeam}
                      </span>
                    </div>

                    {/* Player Slots */}
                    <div className="space-y-2">
                      {/* Filled Slots */}
                      {allocations.map((allocation, idx) => (
                        <div
                          key={idx}
                          className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-green-200 animate-in fade-in slide-in-from-left duration-300"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-lg">⚽</span>
                            <span className="font-semibold text-gray-800 flex-1">{allocation.player.name}</span>
                            <span className="text-xs font-semibold text-purple-600 bg-purple-100 px-2 py-1 rounded">
                              {allocation.pot.name}
                            </span>
                          </div>
                        </div>
                      ))}
                      
                      {/* Empty Slots */}
                      {Array.from({ length: emptySlots }).map((_, idx) => (
                        <div
                          key={`empty-${idx}`}
                          className="bg-white/40 backdrop-blur-sm rounded-xl p-3 border-2 border-dashed border-gray-300"
                        >
                          <div className="flex items-center gap-2 opacity-40">
                            <span className="text-lg">⭕</span>
                            <span className="font-medium text-gray-500 italic">Waiting for player...</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Success Message */}
        {showResults && (
          <div className="bg-gradient-to-r from-green-100 to-emerald-100 border-4 border-green-400/50 rounded-2xl p-10 text-center shadow-2xl backdrop-blur-lg mt-8 animate-in zoom-in duration-500">
            <h3 className="text-4xl font-bold text-green-800 mb-4 flex items-center justify-center gap-3">
              <span className="text-5xl">🎉</span> Allocation Complete!
            </h3>
            <p className="text-xl text-green-700 mb-4">
              Successfully allocated {Array.from(teamAllocations.values()).flat().length} players across {tournament.teams.length} teams
            </p>
            <p className="text-lg text-green-600">Redirecting to results...</p>
          </div>
        )}
      </div>
    </div>
  )
}
