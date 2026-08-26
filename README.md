# AI Habit Tracker — MongoDB Full-Stack

A deployable full-stack AI habit tracker with authentication, persistent habits, analytics, AI coaching, XP/levels, achievements, daily quests, and a multi-user leaderboard.

## Architecture

```text
React + Vite frontend
        |
        v
Node.js + Express REST API
        |
        v
MongoDB Atlas (shared cloud database)
```

## Run locally

### Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Set `MONGODB_URI` and `MONGODB_DB_NAME` in `.env`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

For local development, `frontend/.env` can use:

```env
VITE_API_URL=http://localhost:8000/api
```

For deployment, set it to your deployed backend URL, for example:

```env
VITE_API_URL=https://your-api.example.com/api
```

## MongoDB Atlas deployment

1. Create a MongoDB Atlas cluster.
2. Create a database user.
3. Add your deployment provider's outbound IP or use the appropriate Atlas network access policy.
4. Copy the Atlas connection string.
5. Set these backend environment variables on your hosting provider:

```env
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME=ai_habit_tracker
JWT_SECRET=<long-random-secret>
JWT_EXPIRES_IN=7d
CLIENT_URL=https://your-frontend.example.com
```

6. Deploy the `backend` directory as a Node service.
7. Set `VITE_API_URL` on the frontend to the deployed API URL and deploy the `frontend` directory as a Vite static site.

The backend creates collections and indexes automatically on startup and seeds the achievement definitions.

## Important security rules

- Never commit `.env`.
- Never put `MONGODB_URI` or `JWT_SECRET` in the frontend.
- Keep MongoDB credentials only in backend environment variables.
- Configure CORS `CLIENT_URL` to the real frontend origin in production.
- Use HTTPS for the deployed frontend and backend.

## Collections

- `users`
- `habits`
- `logs`
- `gamification_profiles`
- `achievements`
- `user_achievements`
- `daily_quests`
- `xp_transactions`

## Multi-user features

The same Atlas database is shared by all remote users. User-specific records are scoped by `user_id`, while the leaderboard aggregates gamification data across users without exposing emails or private habit details.
