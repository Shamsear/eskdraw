import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Get spin state - available teams and players for next spin
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tournamentId } = await params

    // Get all teams
    const teams = await prisma.team.findMany({
      where: { tournamentId },
      include: {
        allocations: {
          include: {
            pot: true,
          },
        },
      },
    })

    // Get all pots with players
    const pots = await prisma.pot.findMany({
      where: { tournamentId },
      include: {
        players: true,
        allocations: true,
      },
      orderBy: {
        potNumber: 'asc',
      },
    })

    // Calculate which teams still need players and from which pots
    const teamsNeedingPlayers = teams.filter(team => {
      const allocatedPots = team.allocations.map(a => a.pot.potNumber)
      return allocatedPots.length < pots.length
    })

    return NextResponse.json({
      teams: teamsNeedingPlayers,
      pots,
      isComplete: teamsNeedingPlayers.length === 0,
    })
  } catch (error) {
    console.error('Error getting spin state:', error)
    return NextResponse.json(
      { error: 'Failed to get spin state' },
      { status: 500 }
    )
  }
}

// Perform allocation after spin
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tournamentId } = await params
    const body = await request.json()
    const { teamId, playerId } = body

    if (!teamId || !playerId) {
      return NextResponse.json(
        { error: 'Team ID and Player ID are required' },
        { status: 400 }
      )
    }

    // Get player to find pot
    const player = await prisma.player.findUnique({
      where: { id: playerId },
      include: { pot: true },
    })

    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      )
    }

    // Check if team already has a player from this pot
    const existingAllocation = await prisma.allocation.findUnique({
      where: {
        teamId_potId: {
          teamId,
          potId: player.potId,
        },
      },
    })

    if (existingAllocation) {
      return NextResponse.json(
        { error: 'Team already has a player from this pot' },
        { status: 400 }
      )
    }

    // Create allocation
    const allocation = await prisma.allocation.create({
      data: {
        tournamentId,
        teamId,
        playerId,
        potId: player.potId,
      },
      include: {
        team: true,
        player: true,
        pot: true,
      },
    })

    // Check if tournament is complete
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        teams: true,
        pots: true,
        _count: {
          select: {
            allocations: true,
          },
        },
      },
    })

    const expectedAllocations = tournament!.teams.length * tournament!.pots.length
    const isComplete = tournament!._count.allocations === expectedAllocations

    if (isComplete) {
      await prisma.tournament.update({
        where: { id: tournamentId },
        data: { status: 'completed' },
      })
    }

    return NextResponse.json({
      allocation,
      isComplete,
    })
  } catch (error) {
    console.error('Error creating allocation:', error)
    return NextResponse.json(
      { error: 'Failed to create allocation' },
      { status: 500 }
    )
  }
}
