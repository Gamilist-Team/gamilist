# [Gamilist]

CodePath WEB103 Final Project

Designed and developed by: Rashad, Jing, Rahat

🔗 Link to deployed app:

## About

### Description and Purpose

Similar to myAnimelist, Gamilist is a way for you to see game recommendations based off what you have played.

### Inspiration

[\[myanimelist\]](https://myanimelist.net/)

## Tech Stack

**Frontend:**

- React 19
- React Router 6
- Vite
- CSS3 (Custom styling)

**Backend:**

- Node.js
- Express.js
- PostgreSQL (Render Postgres)
- IGDB API (via Twitch Developer API)
- bcrypt (for password hashing)
- express-session (for authentication)

## 📦 1. Prerequisites

Before running the project, install:

- **Node.js** 18+ (20 recommended)
- **npm**
- Access to:
  - A **Postgres** database (Render Postgres)
  - A **Twitch Developer App** (to access the IGDB API)

---

## 📁 2. Clone & Install

```bash
git clone <repo-url>
cd gamilist_code
npm install
```

## You will usually have two terminals running for start and dev:

### Commands

npm start
Starts Express backend

npm run dev
Starts Vite frontend

npm run build
Builds production bundle

npm run preview
Serves built frontend

## Features

### ✅ Browse and Search Games (Issue #3)

Discover games by searching or browsing through different platforms (Console, PC, Mobile) and genres. Click on any game to view detailed information.

**Features:**

- Search games by title with real-time results
- Browse all available games
- Click any game card to view full details

![alt text](<gamilist.gif)

### ✅ Game Lists and Tracking (Issue #7)

Organize games into custom lists: "Completed", "Currently Playing", and "Plan to Play"

**Features:**

- Add games to different status lists from the game details page
- View all your games organized by status in your profile
- Track your gaming progress
- Remove games from your lists

### ✅ Rate and Review Games (Issue #6)

Rate games on a scale of 0-10 and write detailed reviews to share your experience with the community

**Features:**

- Write reviews with title, rating, and detailed content
- Like other users' reviews
- Delete your own reviews
- View all reviews for any game
- See reviewer information and timestamps

### ✅ Community Forums (Issue #5)

Discuss games, share tips, and connect with other gamers through topic-based forum discussions

**Features:**

- Create new forum threads
- Reply to existing threads
- Edit and delete your own posts and replies
- Like threads to show appreciation
- View all forum discussions from the Community page

### ✅ User Profile and Gaming Stats (Issue #4)

Showcase your gaming identity with a profile displaying your stats, favorite games, and gaming history

**Features:**

- View detailed statistics (completed games, currently playing, plan to play, average rating)
- Browse game lists by status (All, Playing, Completed, Plan to Play)
- See game ratings and personal notes
- Manage your game collection

### ✅ User Authentication System

Secure user authentication with registration, login, and session management

**Features:**

- User registration with username, email, and password
- Secure login with bcrypt password hashing
- Session-based authentication with express-session
- Protected routes requiring authentication
- Logout functionality
- Personalized experience with "My Lists" for authenticated users

## Installation Instructions

### 1. Prerequisites

- Node.js 18+ (20 recommended)
- npm or yarn
- PostgreSQL database (local or cloud)
- Twitch Developer App (for IGDB API access)

### 2. Clone and Install

```bash
git clone <repo-url>
cd gamilist/gamilist_code
npm install
```

### 3. Set Up IGDB API Credentials

1. Go to [Twitch Developer Portal](https://dev.twitch.tv/console/apps)
2. Create a new application
3. Copy your **Client ID** and **Client Secret**

### 4. Set Up Environment Variables

Create a `.env` file in the `gamilist_code` directory:

```env
# Database
DATABASE_URL=postgresql://username:password@host:5432/database_name

# Server
PORT=10000
VITE_API_URL=http://localhost:10000

# IGDB API (Twitch)
TWITCH_CLIENT_ID=your_client_id_here
TWITCH_CLIENT_SECRET=your_client_secret_here

# Session Secret (for authentication)
SESSION_SECRET=your_random_secret_key_here
```

### 5. Initialize Database

The database will be automatically seeded with sample data when you run the reset endpoint:

```bash
# Start the backend server
npm start

# In another terminal, reset the database (one-time setup)
curl -X POST http://localhost:10000/api/reset
```

### 6. Run the Application

Open two terminal windows:

**Terminal 1 - Backend:**

```bash
npm start
```

**Terminal 2 - Frontend:**

```bash
npm run dev
```

The app will be available at:

- Frontend: http://localhost:5173
- Backend API: http://localhost:10000

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user session

### IGDB Games

- `GET /api/igdb/trending` - Get trending games from IGDB
- `GET /api/igdb/genre/:name` - Get games by genre from IGDB
- `GET /api/igdb/games/:id` - Get game details from IGDB
- `GET /api/igdb/search` - Search games on IGDB

### Database Games

- `GET /api/games` - Get all games (with optional search)
- `GET /api/games/:id` - Get game details

### User & Lists

- `GET /api/users/:id` - Get user profile
- `GET /api/users/:id/stats` - Get user statistics
- `GET /api/users/:userId/games` - Get user's game list
- `GET /api/my/games` - Get current user's game list (auth required)
- `POST /api/my/games` - Add game to current user's list (auth required)
- `DELETE /api/my/games/:gameId` - Remove game from list (auth required)

### Reviews

- `GET /api/games/:gameId/reviews` - Get game reviews
- `POST /api/games/:gameId/reviews` - Create review (auth required)
- `PATCH /api/reviews/:id` - Update review (auth required)
- `DELETE /api/reviews/:id` - Delete review (auth required)
- `POST /api/reviews/:id/like` - Like a review (auth required)

### Forum

- `GET /api/threads` - Get all forum threads
- `GET /api/threads/:id` - Get thread details with replies
- `POST /api/threads` - Create new thread (auth required)
- `PATCH /api/threads/:id` - Update thread (auth required)
- `DELETE /api/threads/:id` - Delete thread (auth required)
- `POST /api/threads/:id/like` - Like a thread (auth required)
- `POST /api/threads/:id/replies` - Add reply to thread (auth required)
- `PATCH /api/replies/:id` - Update reply (auth required)
- `DELETE /api/replies/:id` - Delete reply (auth required)

### Utility

- `GET /api/health` - Health check endpoint
- `POST /api/reset` - Reset database to default state
- `POST /api/migrate` - Run database migration

## Database Schema

The app uses PostgreSQL with the following key tables:

**Core Tables:**

- `users` - User accounts with authentication
- `games` - Game information (synced from IGDB)
- `genres` - Game genres/categories

**Relationship Tables:**

- `game_genres` - Many-to-many relationship (games ↔ genres)
- `user_game_lists` - User's game collection with status and ratings
- `reviews` - User reviews for games
- `review_likes` - Like system for reviews
- `forum_threads` - Community discussion threads
- `forum_thread_likes` - Like system for forum threads
- `forum_replies` - Replies to forum threads

**Key Features:**

- One-to-many relationships: users → reviews, users → forum_threads
- Many-to-many relationships: games ↔ genres
- Unique constraints preventing duplicates
- Automatic timestamps (created_at, updated_at)

## Tech Stack

**Frontend:**

- React 19
- React Router 6
- Vite
- CSS3 (Custom styling)

**Backend:**

- Node.js
- Express.js
- PostgreSQL (Render Postgres)
- IGDB API (via Twitch Developer API)
- bcrypt (for password hashing)
- express-session (for authentication)
