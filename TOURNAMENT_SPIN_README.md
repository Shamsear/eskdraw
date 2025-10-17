# Tournament Spin Website

A Next.js application for managing tournament player allocations through an interactive dual spinning wheel system.

## Features

- **Tournament Management**: Create multiple tournaments with customizable number of pots
- **Bulk Team Upload**: Add teams in bulk with team names
- **Bulk Player Upload**: Add players to specific pots in bulk
- **Dual Spinning Wheels**: Interactive team and player selection with animated wheels
- **Smart Allocation**: Ensures each team gets exactly one player from each pot
- **Real-time Progress**: Track allocation progress during the spinning process
- **Results Dashboard**: View final team rosters after tournament completion

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: PostgreSQL (Neon)
- **ORM**: Prisma
- **Styling**: Tailwind CSS
- **Storage**: Vercel Blob (for team logos)
- **Language**: TypeScript

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
npm install
```

### 2. Setup Neon PostgreSQL Database

1. Create a free account at [Neon](https://neon.tech)
2. Create a new project and database
3. Copy the connection string

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL="postgresql://username:password@host/database?sslmode=require"
DIRECT_URL="postgresql://username:password@host/database?sslmode=require"
BLOB_READ_WRITE_TOKEN="your_vercel_blob_token"
```

### 4. Run Database Migrations

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 5. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000/admin` to access the admin panel.

## Usage Guide

### Creating a Tournament

1. Navigate to `/admin`
2. Click "New Tournament"
3. Enter tournament name and number of pots
4. Click "Create Tournament"

### Adding Teams

1. Open your tournament
2. Go to the "Teams" tab
3. Enter team names (one per line) in the bulk upload form
4. Click "Add Teams"

### Adding Players

1. Go to the "Players" tab
2. Select a pot from the dropdown
3. Enter player names (one per line)
4. Click "Add Players"
5. Repeat for each pot

### Running the Spin

1. Once all teams and players are added, click "Start Spinning"
2. Click "Spin Team" to randomly select a team
3. Click "Spin Player" to randomly select a player (only from pots not yet used by this team)
4. Click "Confirm" to allocate the player to the team
5. Repeat until all allocations are complete

### Viewing Results

After completion, you'll be redirected to the results page showing all team rosters.

## Database Schema

- **Tournament**: Main tournament entity with name, pot count, and status
- **Team**: Teams participating in the tournament
- **Pot**: Groups of players (e.g., Pot A, Pot B, Pot C)
- **Player**: Individual players assigned to pots
- **Allocation**: Links teams to players, ensuring one player per pot per team

## API Routes

- `POST /api/tournaments` - Create tournament
- `GET /api/tournaments` - List all tournaments
- `GET /api/tournaments/[id]` - Get tournament details
- `POST /api/tournaments/[id]/teams` - Bulk add teams
- `POST /api/tournaments/[id]/players` - Bulk add players to a pot
- `GET /api/tournaments/[id]/spin` - Get spin state
- `POST /api/tournaments/[id]/spin` - Create allocation

## Project Structure

```
app/
├── admin/
│   ├── page.tsx                        # Admin dashboard
│   └── tournaments/
│       └── [id]/
│           ├── page.tsx                # Tournament management
│           ├── spin/
│           │   └── page.tsx           # Spinning interface
│           └── results/
│               └── page.tsx           # Results display
├── api/
│   └── tournaments/
│       ├── route.ts                   # Tournament CRUD
│       └── [id]/
│           ├── route.ts               # Tournament details
│           ├── teams/
│           │   └── route.ts          # Team management
│           ├── players/
│           │   └── route.ts          # Player management
│           └── spin/
│               └── route.ts          # Spin logic
components/
└── SpinWheel.tsx                      # Animated spinning wheel component
prisma/
└── schema.prisma                      # Database schema
```

## Key Features Explained

### Smart Player Filtering

When a team is selected, the player wheel only shows players from pots that the team hasn't received a player from yet. This ensures fair distribution.

### Allocation Tracking

The system tracks all allocations in real-time, preventing:
- Teams getting multiple players from the same pot
- Players being assigned to multiple teams
- Incomplete allocations

### Progress Monitoring

A visual progress bar shows how many allocations have been completed out of the total required (teams × pots).

## Future Enhancements

- Export results to PDF/CSV
- Player ratings/rankings
- Team logo upload support
- Undo last allocation
- Manual allocation override
- Tournament templates
- Multi-language support

## Support

For issues or questions, please check the database connection and ensure all environment variables are properly configured.
