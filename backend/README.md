# AI Habit Tracker Backend — MongoDB Edition

Node.js + Express backend using MongoDB Atlas. This replaces the previous local SQLite database so remote users share one cloud database.

## Local setup

1. Copy `.env.example` to `.env`.
2. Create a MongoDB Atlas cluster and database user.
3. Put the Atlas connection string in `MONGODB_URI`.
4. Run:

```bash
npm install
npm run dev
```

The backend automatically creates the required collections and indexes and seeds achievement definitions.

## Environment

```env
PORT=8000
CLIENT_URL=http://localhost:5173
JWT_SECRET=use-a-long-random-secret
JWT_EXPIRES_IN=7d
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME=ai_habit_tracker
```

Optional AI variables:

```env
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
```

## Main APIs

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/habits`
- `POST /api/habits`
- `POST /api/logs`
- `GET /api/logs/stats`
- `GET /api/gamification`
- `GET /api/gamification/history`
- `GET /api/leaderboard`
- `GET/POST /api/ai/*`

Authenticated endpoints require `Authorization: Bearer <JWT>`.

## Deployment

Deploy the backend as a Node service. Set `MONGODB_URI`, `MONGODB_DB_NAME`, `JWT_SECRET`, `CLIENT_URL`, and optional Gemini variables in the deployment provider's environment settings. Do not commit `.env` or the Atlas password.

The frontend should use:

```env
VITE_API_URL=https://YOUR-BACKEND-DOMAIN/api
```
