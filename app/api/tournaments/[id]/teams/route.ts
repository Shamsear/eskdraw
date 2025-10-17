import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { put } from '@vercel/blob'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tournamentId } = await params
    const formData = await request.formData()
    const teamsData = formData.get('teams') as string
    const teams = JSON.parse(teamsData)

    const createdTeams = []

    for (const team of teams) {
      let logoUrl = team.logoUrl || null

      // Handle logo upload if file is provided
      if (team.logoFile) {
        const file = formData.get(team.logoFile) as File
        if (file) {
          const blob = await put(file.name, file, {
            access: 'public',
          })
          logoUrl = blob.url
        }
      }

      const createdTeam = await prisma.team.create({
        data: {
          tournamentId,
          name: team.name,
          logoUrl,
        },
      })

      createdTeams.push(createdTeam)
    }

    return NextResponse.json(createdTeams)
  } catch (error) {
    console.error('Error creating teams:', error)
    return NextResponse.json(
      { error: 'Failed to create teams' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tournamentId } = await params

    const teams = await prisma.team.findMany({
      where: { tournamentId },
      include: {
        allocations: {
          include: {
            player: true,
            pot: true,
          },
        },
      },
    })

    return NextResponse.json(teams)
  } catch (error) {
    console.error('Error fetching teams:', error)
    return NextResponse.json(
      { error: 'Failed to fetch teams' },
      { status: 500 }
    )
  }
}
