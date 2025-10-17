# Deployment Guide for Vercel

## Prerequisites
- Vercel account
- Neon PostgreSQL database (already configured)
- Vercel Blob storage token

## Option 1: Deploy via Vercel CLI

### 1. Install Vercel CLI
```bash
npm i -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Deploy to preview
```bash
vercel
```

### 4. Set Environment Variables
Go to your Vercel dashboard → Project Settings → Environment Variables and add:
- `DATABASE_URL` - Your Neon PostgreSQL connection string
- `DIRECT_URL` - Your Neon PostgreSQL direct connection string  
- `BLOB_READ_WRITE_TOKEN` - Your Vercel Blob token

### 5. Deploy to production
```bash
vercel --prod
```

## Option 2: Deploy via Vercel Dashboard (Recommended)

### 1. Push to Git
Make sure your code is in a Git repository (GitHub, GitLab, or Bitbucket).

### 2. Import on Vercel
- Go to https://vercel.com/new
- Import your repository
- Vercel will auto-detect it's a Next.js project

### 3. Configure Environment Variables
Add these during import or in Project Settings:
- `DATABASE_URL` - Your Neon PostgreSQL connection string
- `DIRECT_URL` - Your Neon PostgreSQL direct connection string
- `BLOB_READ_WRITE_TOKEN` - Your Vercel Blob token

### 4. Deploy
Click "Deploy" - Vercel will automatically deploy on every push to your main branch.

## Database Setup
After first deployment, run Prisma migrations:
```bash
vercel env pull .env.production
npx prisma db push --schema=./prisma/schema.prisma
```

Or use the Vercel CLI to run commands in your deployment:
```bash
vercel env pull
npm run db:push
```

## Notes
- The `vercel.json` includes automatic Prisma generation during build
- Environment variables are referenced securely
- `.vercelignore` prevents sensitive files from being deployed
