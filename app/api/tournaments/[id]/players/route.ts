import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tournamentId } = await params
    const body = await request.json()
    const { potId, players } = body

    if (!potId || !players || !Array.isArray(players)) {
      return NextResponse.json(
        { error: 'Pot ID and players array are required' },
        { status: 400 }
      )
    }

    // Verify pot belongs to tournament
    const pot = await prisma.pot.findFirst({
      where: {
        id: potId,
        tournamentId,
      },
    })

    if (!pot) {
      return NextResponse.json(
        { error: 'Pot not found in this tournament' },
        { status: 404 }
      )
    }

    // Create players in bulk
    const createdPlayers = await prisma.player.createMany({
      data: players.map((name: string) => ({
        potId,
        name,
      })),
    })

    // Get created players with full data
    const allPlayers = await prisma.player.findMany({
      where: { potId },
    })

    return NextResponse.json(allPlayers)
  } catch (error) {
    console.error('Error creating players:', error)
    return NextResponse.json(
      { error: 'Failed to create players' },
      { status: 500 }
    )
  }
}
