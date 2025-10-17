'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Tournament {
  id: string
  name: string
  numPots: number
  status: string
  _count: {
    teams: number
    allocations: number
  }
}

export default function AdminDashboard() {
  const router = useRouter()
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [name, setName] = useState('')
  const [numPots, setNumPots] = useState(4)
  const [playersPerTeam, setPlayersPerTeam] = useState(4)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchTournaments()
  }, [])

  const fetchTournaments = async () => {
    try {
      const res = await fetch('/api/tournaments')
      const data = await res.json()
      setTournaments(data)
    } catch (error) {
      console.error('Error fetching tournaments:', error)
    }
  }

  const createTournament = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, numPots, playersPerTeam }),
      })

      if (res.ok) {
        const tournament = await res.json()
        setShowCreateModal(false)
        setName('')
        setNumPots(4)
        setPlayersPerTeam(4)
        router.push(`/admin/tournaments/${tournament.id}`)
      }
    } catch (error) {
      console.error('Error creating tournament:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteTournament = async (id: string) => {
    if (!confirm('Delete this tournament? This action cannot be undone.')) return

    try {
      await fetch(`/api/tournaments/${id}`, { method: 'DELETE' })
      fetchTournaments()
    } catch (error) {
      console.error('Error deleting tournament:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzBoLTJ2LTJoMnYyem0wLTRoLTJ2LTJoMnYyem0wLTRoLTJ2LTJoMnYyem0wLTRoLTJ2LTJoMnYyem0wLTRoLTJ2LTJoMnYyem0wLTRoLTJ2LTJoMnYyem0wLTRoLTJ2LTJoMnYyem0wLTRoLTJ2LTJoMnYyem0wLTRoLTJ2LTJoMnYyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="inline-flex items-center gap-3 px-6 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white mb-6 border border-white/30">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
              </span>
              <span className="text-sm font-semibold">Tournament Management System</span>
            </div>
            
            <h1 className="text-6xl md:text-7xl font-black text-white mb-6 tracking-tight">
              Tournament
              <span className="block bg-gradient-to-r from-yellow-200 to-pink-200 bg-clip-text text-transparent">
                Dashboard
              </span>
            </h1>
            
            <p className="text-xl text-purple-100 mb-10 max-w-2xl mx-auto leading-relaxed">
              Create, manage, and execute professional tournament draws with our intelligent auto-allocation system
            </p>
            
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                setShowCreateModal(true)
              }}
              className="group inline-flex items-center gap-3 px-8 py-4 bg-white text-purple-600 rounded-2xl font-bold text-lg shadow-2xl hover:shadow-purple-900/50 hover:scale-105 transition-all duration-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
              </svg>
              Create New Tournament
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="group bg-white rounded-3xl shadow-2xl p-8 border border-gray-100 hover:shadow-purple-200/50 transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="p-4 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <span className="text-5xl font-black bg-gradient-to-br from-violet-600 to-purple-600 bg-clip-text text-transparent">
                {tournaments.length}
              </span>
            </div>
            <h3 className="text-gray-600 font-semibold text-sm uppercase tracking-wider">Total Tournaments</h3>
          </div>

          <div className="group bg-white rounded-3xl shadow-2xl p-8 border border-gray-100 hover:shadow-blue-200/50 transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="p-4 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-5xl font-black bg-gradient-to-br from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                {tournaments.filter(t => t.status === 'spinning').length}
              </span>
            </div>
            <h3 className="text-gray-600 font-semibold text-sm uppercase tracking-wider">Active Draws</h3>
          </div>

          <div className="group bg-white rounded-3xl shadow-2xl p-8 border border-gray-100 hover:shadow-green-200/50 transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="p-4 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-5xl font-black bg-gradient-to-br from-emerald-600 to-green-600 bg-clip-text text-transparent">
                {tournaments.filter(t => t.status === 'completed').length}
              </span>
            </div>
            <h3 className="text-gray-600 font-semibold text-sm uppercase tracking-wider">Completed</h3>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
          <div>
            <h2 className="text-4xl font-black text-gray-900 mb-2">Your Tournaments</h2>
            <p className="text-gray-500">Manage and monitor all your tournament draws</p>
          </div>
          
          <div className="flex gap-3">
            <button className="px-5 py-3 bg-white border-2 border-gray-200 rounded-xl hover:border-purple-300 hover:shadow-lg transition-all">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <button className="px-5 py-3 bg-white border-2 border-gray-200 rounded-xl hover:border-purple-300 hover:shadow-lg transition-all">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </button>
          </div>
        </div>

        {tournaments.length === 0 ? (
          <div className="text-center py-24">
            <div className="inline-block bg-white rounded-3xl shadow-2xl p-16 max-w-lg border border-gray-100">
              <div className="w-32 h-32 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                <svg className="w-16 h-16 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-4">No Tournaments Yet</h3>
              <p className="text-gray-500 text-lg mb-8 leading-relaxed">
                Get started by creating your first tournament and experience seamless draw management
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  setShowCreateModal(true)
                }}
                className="px-10 py-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-2xl font-bold text-lg hover:shadow-2xl hover:scale-105 transition-all"
              >
                Create Your First Tournament
              </button>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {tournaments.map((tournament) => (
              <div
                key={tournament.id}
                className="group bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:-translate-y-2"
              >
                {/* Status Bar */}
                <div className={`h-2 bg-gradient-to-r ${
                  tournament.status === 'completed' ? 'from-emerald-500 to-green-500' :
                  tournament.status === 'spinning' ? 'from-blue-500 to-cyan-500' :
                  'from-amber-500 to-orange-500'
                }`} />
                
                <div className="p-8">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-purple-600 transition-colors line-clamp-2">
                        {tournament.name}
                      </h3>
                      <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white ${
                        tournament.status === 'completed' ? 'bg-gradient-to-r from-emerald-500 to-green-500' :
                        tournament.status === 'spinning' ? 'bg-gradient-to-r from-blue-500 to-cyan-500' :
                        'bg-gradient-to-r from-amber-500 to-orange-500'
                      }`}>
                        {tournament.status === 'completed' ? '✓ Completed' :
                         tournament.status === 'spinning' ? '⚡ In Progress' :
                         '○ Setup'}
                      </span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="text-center p-4 bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl border border-purple-100">
                      <p className="text-3xl font-black text-purple-600">{tournament.numPots}</p>
                      <p className="text-xs text-gray-600 mt-2 font-semibold uppercase tracking-wide">Pots</p>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border border-blue-100">
                      <p className="text-3xl font-black text-blue-600">{tournament._count.teams}</p>
                      <p className="text-xs text-gray-600 mt-2 font-semibold uppercase tracking-wide">Teams</p>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl border border-green-100">
                      <p className="text-3xl font-black text-emerald-600">{tournament._count.allocations}</p>
                      <p className="text-xs text-gray-600 mt-2 font-semibold uppercase tracking-wide">Draws</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        router.push(`/admin/tournaments/${tournament.id}`)
                      }}
                      className="flex-1 px-6 py-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-2xl font-bold hover:shadow-2xl hover:scale-105 transition-all"
                    >
                      Manage
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        deleteTournament(tournament.id)
                      }}
                      className="p-4 bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 hover:scale-105 transition-all"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in duration-300">
            <div className="bg-gradient-to-r from-violet-600 to-purple-600 p-8">
              <div className="flex items-center justify-between">
                <h3 className="text-3xl font-black text-white">Create Tournament</h3>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    setShowCreateModal(false)
                  }}
                  className="text-white hover:bg-white/20 rounded-xl p-2 transition-all hover:rotate-90 duration-300"
                >
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={createTournament} className="p-8 space-y-8">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">
                  Tournament Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none text-lg font-medium"
                  placeholder="Enter tournament name..."
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">
                  Number of Pots
                </label>
                <input
                  type="number"
                  value={numPots}
                  onChange={(e) => setNumPots(parseInt(e.target.value))}
                  min="2"
                  max="10"
                  required
                  className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none text-lg font-medium"
                />
                <p className="text-sm text-gray-500 mt-3">
                  Choose between 2-10 pots for optimal player distribution
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">
                  Players Per Team
                </label>
                <input
                  type="number"
                  value={playersPerTeam}
                  onChange={(e) => setPlayersPerTeam(parseInt(e.target.value))}
                  min="1"
                  max="20"
                  required
                  className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none text-lg font-medium"
                />
                <p className="text-sm text-gray-500 mt-3">
                  How many players each team should receive (typically equals number of pots)
                </p>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-2xl font-bold text-lg hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-8 py-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-2xl font-bold text-lg hover:shadow-2xl disabled:opacity-50 transition-all"
                >
                  {loading ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
