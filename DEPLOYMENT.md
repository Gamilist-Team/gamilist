# Deployment Guide

## Prerequisites

- GitHub account
- Render account (for backend and database)
- Vercel/Netlify account (for frontend)

## Step 1: Database Setup (Render PostgreSQL)

1. Go to [render.com](https://render.com) and sign in
2. Click **New → PostgreSQL**
3. Configure:
   - **Name**: gamilist-db
   - **Database**: gamilist
   - **User**: (auto-generated)
   - **Region**: Same as your backend
   - **Plan**: Free
4. Click **Create Database**
5. Copy the **Internal Database URL** (it starts with `postgres://`)
6. Connect to database and run schema:
   - Go to your database dashboard
   - Click **Connect** → **External Connection**
   - Use a PostgreSQL client or the web shell to run all SQL from `gamilist_code/api/schema.sql`

## Step 2: Get IGDB API Credentials

1. Go to [Twitch Developer Console](https://dev.twitch.tv/console)
2. Register an application
3. Copy your **Client ID** and **Client Secret**

## Step 3: Backend Deployment (Render)

1. Go to [render.com](https://render.com) and sign in
2. Click **New → Web Service**
3. Connect your GitHub repository
4. Configure:

   - **Root Directory**: `gamilist_code`
   - **Build Command**: `npm install`
   - **Start Command**: `node -r dotenv/config api/server.js`
   - **Environment**: `Node`

5. Add Environment Variables:

```
DATABASE_URL=your_render_internal_database_url
IGDB_CLIENT_ID=your_twitch_client_id
IGDB_CLIENT_SECRET=your_twitch_client_secret
GITHUB_CLIENT_ID=your_github_oauth_id
GITHUB_CLIENT_SECRET=your_github_oauth_secret
SESSION_SECRET=any_random_long_string
PORT=10000
```

6. Click **Create Web Service**
7. Copy the backend URL (e.g., `https://your-app.onrender.com`)

## Step 4: GitHub OAuth Setup

1. Go to GitHub **Settings → Developer Settings → OAuth Apps**
2. Click **New OAuth App**
3. Fill in:
   - **Homepage URL**: Your frontend URL
   - **Callback URL**: `https://your-backend.onrender.com/api/auth/github/callback`
4. Copy **Client ID** and **Client Secret** to Render environment variables

## Step 5: Frontend Deployment (Vercel)

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **Add New → Project**
3. Import your GitHub repository
4. Configure:

   - **Root Directory**: `gamilist_code`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

5. Add Environment Variable:

```
VITE_API_BASE_URL=https://your-backend.onrender.com
```

6. Click **Deploy**

## Step 6: Test Your App

1. Visit your Vercel URL
2. Try logging in with GitHub
3. Search for games
4. Add games to your list
5. Check achievements

## Common Issues

**CORS Error**: Add your frontend URL to backend CORS settings in `server.js`

**Database Connection Failed**: Check your DATABASE_URL format

**GitHub Login Not Working**: Verify callback URL matches exactly

**Games Not Loading**: Check IGDB credentials are correct
