import express from "express";
import {
  users,
  gamificationProfiles,
  xpTransactions,
  logs,
  userAchievements,
  achievements,
} from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { bestStreak } from "../services/gamification.js";

const router = express.Router();

router.use(requireAuth);

function since(period) {
  const d = new Date();

  if (period === "weekly") {
    d.setDate(d.getDate() - 7);
  } else if (period === "monthly") {
    d.setDate(d.getDate() - 30);
  } else {
    return null;
  }

  return d.toISOString();
}

async function allTime() {
  return gamificationProfiles
    .aggregate([
      {
        $sort: {
          xp: -1,
          level: -1,
        },
      },
      {
        $limit: 100,
      },
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "id",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
      {
        $project: {
          _id: 0,
          id: "$user_id",
          name: "$user.name",
          avatar: {
            $substrCP: ["$user.name", 0, 1],
          },
          xp: 1,
          level: 1,
        },
      },
    ])
    .toArray();
}

async function periodRows(period) {
  const start = since(period);

  return xpTransactions
    .aggregate([
      {
        $match: {
          created_at: {
            $gte: start,
          },
        },
      },
      {
        $group: {
          _id: "$user_id",
          xp: {
            $sum: "$amount",
          },
        },
      },
      {
        $sort: {
          xp: -1,
        },
      },
      {
        $limit: 100,
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "id",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
      {
        $lookup: {
          from: "gamification_profiles",
          localField: "_id",
          foreignField: "user_id",
          as: "profile",
        },
      },
      {
        $unwind: "$profile",
      },
      {
        $project: {
          _id: 0,
          id: "$_id",
          name: "$user.name",
          avatar: {
            $substrCP: ["$user.name", 0, 1],
          },
          xp: 1,
          level: "$profile.level",
        },
      },
    ])
    .toArray();
}

async function withRanks(rows, userId) {
  const out = [];

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];

    out.push({
      ...r,
      rank: i + 1,
      isMe: r.id === userId,
    });
  }

  return out;
}

/*
|--------------------------------------------------------------------------
| GET LEADERBOARD
|--------------------------------------------------------------------------
*/

router.get("/", async (req, res) => {
  try {
    const [all, weekly, monthly] = await Promise.all([
      allTime(),
      periodRows("weekly"),
      periodRows("monthly"),
    ]);

    const [allR, weeklyR, monthlyR] = await Promise.all([
      withRanks(all, req.userId),
      withRanks(weekly, req.userId),
      withRanks(monthly, req.userId),
    ]);

    res.json({
      allTime: allR,
      weekly: weeklyR,
      monthly: monthlyR,
    });
  } catch (error) {
    console.error("Failed to load leaderboard:", error);

    res.status(500).json({
      message: "Failed to load leaderboard",
    });
  }
});

/*
|--------------------------------------------------------------------------
| GET PUBLIC USER PROFILE
|--------------------------------------------------------------------------
|
| This endpoint is used when somebody clicks a user
| in the leaderboard.
|
*/

router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // Find public user information.
    // IMPORTANT: email/password are deliberately excluded.
    const user = await users.findOne(
      {
        id: userId,
      },
      {
        projection: {
          _id: 0,
          id: 1,
          name: 1,
          picture: 1,
          avatar: 1,
          created_at: 1,
        },
      }
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Get gamification profile.
    const profile = await gamificationProfiles.findOne(
      {
        user_id: userId,
      },
      {
        projection: {
          _id: 0,
          xp: 1,
          level: 1,
        },
      }
    );

    // Count completed habits.
    const totalCompletions = await logs.countDocuments({
      user_id: userId,
    });

    // Calculate streak information.
    const streak = await bestStreak(userId);

    // Get unlocked achievements.
    const unlockedAchievements =
      await userAchievements
        .find({
          user_id: userId,
        })
        .toArray();

    const achievementIds = unlockedAchievements
      .map((item) => item.achievement_id)
      .filter(Boolean);

    let achievementDefinitions = [];

    if (achievementIds.length > 0) {
      achievementDefinitions = await achievements
        .find({
          id: {
            $in: achievementIds,
          },
        })
        .toArray();
    }

    /*
     * Prefer the actual profile picture if your users collection
     * contains one. Otherwise use the first letter of the name.
     */
    const avatar =
      user.picture ||
      user.avatar ||
      user.name?.trim()?.charAt(0)?.toUpperCase() ||
      "?";

    res.json({
      user: {
        id: user.id,
        name: user.name || "User",
        avatar,
        memberSince: user.created_at || null,
      },

      stats: {
        xp: profile?.xp || 0,
        level: profile?.level || 1,
        currentStreak: streak?.current || 0,
        longestStreak: streak?.longest || 0,
        totalCompletions,
        achievementsUnlocked:
          unlockedAchievements.length,
      },

      achievements: achievementDefinitions.map(
        (achievement) => ({
          id: achievement.id,
          name: achievement.name,
          description: achievement.description,
          icon: achievement.icon,
          xpReward:
            achievement.xp_reward ||
            achievement.xpReward ||
            0,
        })
      ),
    });
  } catch (error) {
    console.error(
      "Failed to load public user profile:",
      error
    );

    res.status(500).json({
      message: "Failed to load user profile",
    });
  }
});

export default router;