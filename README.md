# [Gamilist]

CodePath WEB103 Final Project

Designed and developed by: Rashad, Jing, Rahat

🔗 Link to deployed app: (To be deployed on Render)

## About

### Description and Purpose

Similar to myAnimelist, Gamilist is a way for you to see game recommendations based off what you have played.

### Inspiration

[\[myanimelist\]](https://myanimelist.net/)

## Tech Stack

Frontend: React, React Router, Vite, CSS3

Backend: Node.js, Express.js, PostgreSQL, Passport.js (GitHub OAuth), IGDB API (via Twitch)

## 1. Prerequisites

Before running the project, install:

- **Node.js** 18+ (20 recommended)
- **npm**
- Access to:
  - A **Postgres** database (Render Postgres)
  - A **Twitch Developer App** (to access the IGDB API)

---

## 2. Clone & Install

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

### ✅ [Browse and Search Games]

Discover games by searching or browsing through different platforms (Console, PC, Mobile) and genres

![alt text](<gamilist home.gif>)

### ✅ [Game Lists and Tracking]

Organize games into custom lists: "Completed", "Playing", and "Plan to Play"

![alt text](<gamilist tracking.gif>)

### ✅ [Rate and Review Games]

Rate games on a scale and write detailed reviews to share your experience with the community

![alt text](<gamilist rate.gif>)

### ✅ [Personalized Recommendations]

Get smart game recommendations based on your completed games, ratings, and favorite genres

![alt text](<gamilist forU.gif>)

### ✅ [Community Forums]

Discuss games, share tips, and connect with other gamers through topic-based forum discussions

![alt text](<gamilist forum.gif>)

### ✅ [Trophy and Achievement System]

Earn trophies and unlock achievements by completing milestones like finishing games, writing reviews, or reaching rating goals

![alt text](<gamilist trophy.gif>)

### ✅ [User Profile and Gaming Stats]

Showcase your gaming identity with a profile displaying your stats, favorite games, earned trophies, and gaming history

![alt text](<gamilist profile.gif>)

## Installation Instructions

### 1. Environment Setup

Create a `.env` file in the `gamilist_code` directory with the following variables:

```env
DATABASE_URL=your_postgres_connection_string
TWITCH_CLIENT_ID=your_twitch_client_id
TWITCH_CLIENT_SECRET=your_twitch_client_secret
SESSION_SECRET=your_session_secret
GITHUB_CLIENT_ID=your_github_oauth_client_id (optional, for GitHub OAuth)
GITHUB_CLIENT_SECRET=your_github_oauth_client_secret (optional, for GitHub OAuth)
GITHUB_CALLBACK_URL=http://localhost:10000/api/auth/github/callback
```

### 2. Database Setup

Initialize the database with seed data:

```bash
cd gamilist_code
# The database will be automatically initialized on first run
# Or manually reset using: curl -X POST http://localhost:10000/api/reset
```

### 3. Run the Application

Open two terminal windows:

**Terminal 1 - Backend:**

```bash
cd gamilist_code
npm start
# Backend will run on http://localhost:10000
```

**Terminal 2 - Frontend:**

```bash
cd gamilist_code
npm run dev
# Frontend will run on http://localhost:5173
```

### 4. Access the Application

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:10000`

### 5. Test Accounts

Default test accounts (if using seed data):

- Username: `guest` / Password: `password123`

Or sign in with GitHub OAuth.
