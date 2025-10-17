'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import * as XLSX from 'xlsx'

interface Player {
  id: string
  name: string
}

interface Pot {
  id: string
  potNumber: number
  name: string
}

interface Allocation {
  id: string
  player: Player
  pot: Pot
}

interface Team {
  id: string
  name: string
  logoUrl?: string
  allocations: Allocation[]
}

interface Tournament {
  id: string
  name: string
  numPots: number
  status: string
  teams: Team[]
}

export default function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [tournament, setTournament] = useState<Tournament | null>(null)

  useEffect(() => {
    fetchResults()
  }, [resolvedParams.id])

  const fetchResults = async () => {
    try {
      const res = await fetch(`/api/tournaments/${resolvedParams.id}`)
      const data = await res.json()
      setTournament(data)
    } catch (error) {
      console.error('Error fetching results:', error)
    }
  }

  const exportToExcel = () => {
    if (!tournament) return

    // Create a new workbook
    const wb = XLSX.utils.book_new()

    // Create data for each team
    tournament.teams.forEach((team, index) => {
      const wsData: any[][] = []
      
      // Header
      wsData.push([`${team.name}`])
      wsData.push([]) // Empty row
      wsData.push(['Player Name', 'Pot'])
      
      // Players sorted by pot number
      const sortedAllocations = team.allocations.sort((a, b) => a.pot.potNumber - b.pot.potNumber)
      sortedAllocations.forEach((allocation) => {
        wsData.push([allocation.player.name, allocation.pot.name])
      })
      
      wsData.push([]) // Empty row
      wsData.push(['Total Players:', team.allocations.length])
      
      // Create worksheet
      const ws = XLSX.utils.aoa_to_sheet(wsData)
      
      // Set column widths
      ws['!cols'] = [
        { wch: 30 }, // Player Name column
        { wch: 15 }  // Pot column
      ]
      
      // Add worksheet to workbook with team name (sanitize for sheet name)
      const sheetName = team.name.substring(0, 31).replace(/[\\/*?:\[\]]/g, '')
      XLSX.utils.book_append_sheet(wb, ws, sheetName)
    })

    // Create a summary sheet
    const summaryData: any[][] = []
    summaryData.push([`${tournament.name} - Summary`])
    summaryData.push([])
    summaryData.push(['Team Name', 'Total Players', 'Pots Required', 'Status'])
    
    tournament.teams.forEach((team) => {
      const status = team.allocations.length === tournament.numPots ? 'Complete' : 'Incomplete'
      summaryData.push([
        team.name,
        team.allocations.length,
        tournament.numPots,
        status
      ])
    })
    
    summaryData.push([])
    summaryData.push(['Total Teams:', tournament.teams.length])
    summaryData.push(['Total Allocations:', tournament.teams.reduce((sum, team) => sum + team.allocations.length, 0)])
    summaryData.push(['Pots per Team:', tournament.numPots])
    
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData)
    summaryWs['!cols'] = [
      { wch: 30 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 }
    ]
    
    // Insert summary as first sheet
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary')

    // Generate filename with tournament name and date
    const date = new Date().toISOString().split('T')[0]
    const fileName = `${tournament.name.replace(/[\\/*?:\[\]]/g, '_')}_${date}.xlsx`
    
    // Save file
    XLSX.writeFile(wb, fileName)
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">⏳</div>
          <div className="text-2xl font-semibold text-gray-700">Loading results...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-8 relative overflow-hidden">
      {/* Floating Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-purple-300/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-300/30 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-300/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-8 mb-8 border border-white/20">
          <button
            onClick={() => router.push('/admin')}
            className="text-indigo-600 hover:text-indigo-800 font-semibold mb-4 flex items-center gap-2 transition-colors"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-3 flex items-center gap-3">
            <span className="text-5xl">🏆</span> Tournament Results
          </h1>
          <h2 className="text-2xl text-gray-700 font-semibold">{tournament.name}</h2>
        </div>

        {/* Success Banner */}
        <div className="bg-gradient-to-r from-green-100 to-emerald-100 border-4 border-green-400/50 rounded-2xl p-8 mb-8 text-center shadow-xl backdrop-blur-lg">
          <h3 className="text-4xl font-bold text-green-800 mb-3 flex items-center justify-center gap-3">
            <span className="text-5xl">🎉</span> Draw Complete!
          </h3>
          <p className="text-xl text-green-700 font-semibold">
            All {tournament.teams.length} teams have been assigned {tournament.numPots} players each.
          </p>
        </div>

        {/* Teams Table Grid */}
        <div className="space-y-6">
          {tournament.teams.map((team, index) => (
            <div
              key={team.id}
              className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl border-2 border-indigo-200/50 hover:shadow-2xl transition-all overflow-hidden"
            >
              {/* Team Header */}
              <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg border-2 border-white/30">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="text-3xl font-bold text-white drop-shadow-lg">
                        {team.name}
                      </h3>
                      <p className="text-indigo-100 text-sm font-semibold mt-1">
                        {team.allocations.length} {team.allocations.length === 1 ? 'Player' : 'Players'}
                      </p>
                    </div>
                  </div>
                  {team.allocations.length < tournament.numPots && (
                    <div className="bg-red-500/90 backdrop-blur-sm px-4 py-2 rounded-full border-2 border-white/30">
                      <span className="text-white font-bold flex items-center gap-2">
                        <span className="text-xl">⚠️</span>
                        Incomplete
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Players Table */}
              <div className="p-6">
                {team.allocations.length > 0 ? (
                  <div className="overflow-hidden rounded-xl border-2 border-indigo-100">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50">
                          <th className="px-6 py-4 text-left text-sm font-bold text-indigo-900 uppercase tracking-wider border-b-2 border-indigo-200">
                            #
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-bold text-indigo-900 uppercase tracking-wider border-b-2 border-indigo-200">
                            Player Name
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-bold text-indigo-900 uppercase tracking-wider border-b-2 border-indigo-200">
                            Pot
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white">
                        {team.allocations
                          .sort((a, b) => a.pot.potNumber - b.pot.potNumber)
                          .map((allocation, idx) => (
                            <tr
                              key={allocation.id}
                              className={`transition-colors hover:bg-indigo-50/50 ${
                                idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                              }`}
                            >
                              <td className="px-6 py-4 border-b border-indigo-100">
                                <span className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-bold rounded-lg text-sm shadow-sm">
                                  {idx + 1}
                                </span>
                              </td>
                              <td className="px-6 py-4 border-b border-indigo-100">
                                <div className="flex items-center gap-3">
                                  <span className="text-2xl">⚽</span>
                                  <span className="font-bold text-gray-900 text-lg">{allocation.player.name}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 border-b border-indigo-100">
                                <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 border-2 border-purple-200">
                                  {allocation.pot.name}
                                </span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300">
                    <div className="text-5xl mb-3">⚽</div>
                    <p className="text-gray-500 font-semibold">No players allocated yet</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {tournament.teams.length === 0 && (
          <div className="text-center py-12 bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-12">
            <div className="text-6xl mb-4">👥</div>
            <p className="text-gray-500 text-xl font-semibold">No teams found in this tournament</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex justify-center gap-4 flex-wrap">
          <button
            onClick={() => router.push(`/admin/tournaments/${resolvedParams.id}`)}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-10 py-4 rounded-xl hover:shadow-2xl transition-all font-bold text-lg flex items-center gap-2"
          >
            <span>←</span> Back to Tournament
          </button>
          <button
            onClick={exportToExcel}
            className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-10 py-4 rounded-xl hover:shadow-2xl transition-all font-bold text-lg flex items-center gap-2"
          >
            <span>📊</span> Export to Excel
          </button>
          <button
            onClick={() => window.print()}
            className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-10 py-4 rounded-xl hover:shadow-2xl transition-all font-bold text-lg flex items-center gap-2"
          >
            <span>🖨️</span> Print Results
          </button>
        </div>

        {/* Stats Section */}
        <div className="mt-8 bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-white/20">
          <h3 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-6 flex items-center gap-2">
            <span className="text-4xl">📊</span> Statistics
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border-2 border-indigo-200">
              <div className="text-4xl mb-2">👥</div>
              <div className="text-3xl font-bold text-indigo-600">{tournament.teams.length}</div>
              <div className="text-gray-600 font-semibold">Total Teams</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">
              <div className="text-4xl mb-2">⚽</div>
              <div className="text-3xl font-bold text-purple-600">
                {tournament.teams.reduce((sum, team) => sum + team.allocations.length, 0)}
              </div>
              <div className="text-gray-600 font-semibold">Total Allocations</div>
            </div>
            <div className="bg-gradient-to-br from-pink-50 to-red-50 rounded-xl p-6 border-2 border-pink-200">
              <div className="text-4xl mb-2">🎯</div>
              <div className="text-3xl font-bold text-pink-600">{tournament.numPots}</div>
              <div className="text-gray-600 font-semibold">Total Pots</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
