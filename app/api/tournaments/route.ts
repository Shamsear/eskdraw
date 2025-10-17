import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Create tournament
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, numPots, playersPerTeam } = body

    if (!name || !numPots) {
      return NextResponse.json(
        { error: 'Name and number of pots are required' },
        { status: 400 }
      )
    }

    const tournament = await prisma.tournament.create({
      data: {
        name,
        numPots: parseInt(numPots),
        playersPerTeam: playersPerTeam ? parseInt(playersPerTeam) : parseInt(numPots),
        status: 'setup',
      },
    })

    // Create pots for this tournament
    const pots = []
    for (let i = 1; i <= numPots; i++) {
      pots.push({
        tournamentId: tournament.id,
        potNumber: i,
        name: `Pot ${i}`,
      })
    }

    await prisma.pot.createMany({
      data: pots,
    })

    return NextResponse.json(tournament)
  } catch (error) {
    console.error('Error creating tournament:', error)
    return NextResponse.json(
      { error: 'Failed to create tournament' },
      { status: 500 }
    )
  }
}

// Get all tournaments
export async function GET() {
  try {
    const tournaments = await prisma.tournament.findMany({
      include: {
        teams: true,
        pots: {
          include: {
            players: true,
          },
        },
        _count: {
          select: {
            teams: true,
            allocations: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(tournaments)
  } catch (error) {
    console.error('Error fetching tournaments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tournaments' },
      { status: 500 }
    )
  }
}
