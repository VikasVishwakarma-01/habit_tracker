import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import { makeId, now } from "./utils.js";

dotenv.config();

if (!process.env.MONGODB_URI) {
  throw new Error("MONGODB_URI is required. Add your MongoDB Atlas connection string to backend/.env");
}

const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
export const mongoClient = client;
export const db = client.db(process.env.MONGODB_DB_NAME || "ai_habit_tracker");

export const users = db.collection("users");
export const habits = db.collection("habits");
export const logs = db.collection("logs");
export const gamificationProfiles = db.collection("gamification_profiles");
export const achievements = db.collection("achievements");
export const userAchievements = db.collection("user_achievements");
export const dailyQuests = db.collection("daily_quests");
export const xpTransactions = db.collection("xp_transactions");

await Promise.all([
  users.createIndex({ email: 1 }, { unique: true }),
  habits.createIndex({ user_id: 1, habit_order: 1, created_at: 1 }),
  logs.createIndex({ user_id: 1, completed_date: 1 }),
  logs.createIndex({ user_id: 1, habit_id: 1, completed_date: 1 }, { unique: true }),
  gamificationProfiles.createIndex({ xp: -1 }),
  userAchievements.createIndex({ user_id: 1, achievement_id: 1 }, { unique: true }),
  dailyQuests.createIndex({ user_id: 1, quest_date: 1 }),
  xpTransactions.createIndex({ user_id: 1, created_at: -1 }),
]);

const achievementSeed = [
  ["first_habit", "First Step", "Complete your first habit", "🌱", 25, "total_completions", 1],
  ["seven_day", "On Fire", "Reach a 7 day streak", "🔥", 100, "streak", 7],
  ["thirty_day", "Unstoppable", "Reach a 30 day streak", "⚡", 500, "streak", 30],
  ["hundred_completions", "Habit Master", "Complete 100 habits", "🏆", 500, "total_completions", 100],
  ["level_five", "Rising Star", "Reach level 5", "⭐", 250, "level", 5],
  ["perfect_week", "Perfect Week", "Complete every active habit for 7 consecutive days", "💯", 200, "perfect_week", 1]
];
for (const [id,name,description,icon,xp_reward,requirement_type,requirement_value] of achievementSeed) {
  await achievements.updateOne({ id }, { $setOnInsert: { id,name,description,icon,xp_reward,requirement_type,requirement_value } }, { upsert:true });
}

export { makeId, now };

export function toUser(row) {
  if (!row) return null;
  return { _id: row.id, name: row.name, email: row.email, avatar: row.name?.trim()?.charAt(0)?.toUpperCase() || "?", morningMotivation: Boolean(row.morning_motivation), createdAt: row.created_at, updatedAt: row.updated_at };
}
export function toHabit(row) {
  if (!row) return null;
  return { _id: row.id, userId: row.user_id, name: row.name, description: row.description, category: row.category, frequency: row.frequency, targetDays: row.target_days, color: row.color, icon: row.icon, isArchived: Boolean(row.is_archived), order: row.habit_order, createdAt: row.created_at, updatedAt: row.updated_at };
}
export function toLog(row) {
  if (!row) return null;
  return { _id: row.id, userId: row.user_id, habitId: row.habit_id, completedDate: row.completed_date, createdAt: row.created_at };
}
