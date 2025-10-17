# Quick Setup Guide

## Prerequisites

- Node.js 18+ installed
- A Neon PostgreSQL account (free tier works)

## Step-by-Step Setup

### 1. Install Dependencies (Already Done)

```bash
npm install
```

### 2. Setup Database

1. Go to https://neon.tech and create a free account
2. Create a new project
3. Copy your connection string (it looks like: `postgresql://user:pass@host.neon.tech/dbname`)

### 3. Configure Environment

Create a `.env` file in the root directory:

```env
DATABASE_URL="your_neon_connection_string_here"
DIRECT_URL="your_neon_connection_string_here"
BLOB_READ_WRITE_TOKEN=""
```

**Note**: The BLOB_READ_WRITE_TOKEN is optional for now. It's only needed if you want to upload team logos.

### 4. Initialize Database

Run these commands to create the database tables:

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 5. Start the Application

```bash
npm run dev
```

The application will be available at: http://localhost:3000

## First Steps

1. Navigate to http://localhost:3000/admin
2. Click "New Tournament"
3. Create a tournament with:
   - Name: "Test Tournament"
   - Number of Pots: 4

4. Add some test teams (one per line):
   ```
   Manchester United
   Chelsea
   Liverpool
   Arsenal
   ```

5. Go to Players tab and add players to each pot:
   
   **Pot 1:**
   ```
   Cristiano Ronaldo
   Lionel Messi
   Neymar Jr
   Kylian Mbappe
   ```
   
   **Pot 2:**
   ```
   Kevin De Bruyne
   Luka Modric
   Toni Kroos
   Bruno Fernandes
   ```
   
   (Add similar players for Pot 3 and Pot 4)

6. Click "Start Spinning" and enjoy the tournament spin!

## Troubleshooting

### Database Connection Error

If you see a database connection error:
- Make sure your `.env` file has the correct DATABASE_URL
- Check that your Neon database is active
- Verify the connection string includes `?sslmode=require` at the end

### Prisma Client Not Generated

If you see "Cannot find module '@prisma/client'":
```bash
npx prisma generate
```

### Port Already in Use

If port 3000 is already in use:
```bash
npm run dev -- -p 3001
```

## Next Steps

- Explore the spinning mechanism
- Check the results page after completing a tournament
- Try creating multiple tournaments
- Experiment with different numbers of pots and teams

Enjoy your Tournament Spin Website! 🎰🎉
