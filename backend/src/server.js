import "dotenv/config";
import express from "express";
import cors from "cors";
import { db } from "./db.js";
import authRoutes from "./routes/auth.js";
import habitRoutes from "./routes/habits.js";
import logRoutes from "./routes/logs.js";
import aiRoutes from "./routes/ai.js";
import gamificationRoutes from "./routes/gamification.js";
import leaderboardRoutes from "./routes/leaderboard.js";

const app = express();
const PORT = Number(process.env.PORT || 8000);

if (!process.env.JWT_SECRET) {
  console.warn("WARNING: JWT_SECRET is not set. Create a .env file before production use.");
}

app.use(cors({
  origin: process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(",").map((v) => v.trim())
    : "http://localhost:5173",
  credentials: false
}));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/habits", habitRoutes);
app.use("/api/logs", logRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/gamification", gamificationRoutes);
app.use("/api/leaderboard", leaderboardRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
});

const server = app.listen(PORT, () => {
  console.log(`AI Habit Tracker API running at http://localhost:${PORT}`);
});

function shutdown() {
  server.close(() => {
    process.exit(0);
  });
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);