import {
    gamificationProfiles,
    achievements,
    userAchievements,
    dailyQuests,
    xpTransactions,
    logs,
    habits,
    makeId,
    now,
  } from "../db.js";
  
  import {
    addDays,
    dateKey,
    streakFromKeys,
  } from "../utils.js";
  
  // Calculate XP required to reach the next level
  export function xpForNextLevel(level) {
    return 500 + Math.max(0, level - 1) * 250;
  }
  
  // Calculate level information from total XP
  export function levelDataFromXp(xp) {
    let level = 1;
    let remaining = Math.max(0, Number(xp) || 0);
  
    while (
      remaining >= xpForNextLevel(level)
    ) {
      remaining -= xpForNextLevel(level);
      level++;
    }
  
    return {
      level,
      currentLevelXp: remaining,
      nextLevelXp: xpForNextLevel(level),
    };
  }
  
  // Get total number of habit completions
  export async function totalCompletions(userId) {
    return logs.countDocuments({
      user_id: userId,
    });
  }
  
  // Ensure a gamification profile exists
  export async function ensureProfile(userId) {
    let p = await gamificationProfiles.findOne({
      user_id: userId,
    });
  
    if (!p) {
      const total = await totalCompletions(userId);
      const initialXp = total * 10;
      const level = levelDataFromXp(initialXp);
  
      await gamificationProfiles.insertOne({
        user_id: userId,
        xp: initialXp,
        level: level.level,
        coins: 0,
      });
  
      if (total) {
        await xpTransactions.insertOne({
          id: makeId("xp"),
          user_id: userId,
          amount: initialXp,
          reason:
            "Imported existing habit completions",
          created_at: now(),
        });
      }
  
      p = await gamificationProfiles.findOne({
        user_id: userId,
      });
    }
  
    return p;
  }
  
  // Get the best current and longest streak
  export async function bestStreak(userId) {
    const hs = await habits
      .find(
        {
          user_id: userId,
        },
        {
          projection: {
            id: 1,
          },
        }
      )
      .toArray();
  
    let longest = 0;
    let current = 0;
  
    for (const h of hs) {
      const keys = (
        await logs
          .find(
            {
              user_id: userId,
              habit_id: h.id,
            },
            {
              projection: {
                completed_date: 1,
                _id: 0,
              },
            }
          )
          .sort({
            completed_date: 1,
          })
          .toArray()
      ).map((x) => x.completed_date);
  
      const s = streakFromKeys(keys);
  
      longest = Math.max(longest, s.longest);
      current = Math.max(current, s.current);
    }
  
    return {
      longest,
      current,
    };
  }
  
  // Check whether the user has completed every active
  // habit for the last 7 days
  export async function hasPerfectWeek(userId) {
    const hs = await habits
      .find(
        {
          user_id: userId,
          is_archived: false,
        },
        {
          projection: {
            id: 1,
          },
        }
      )
      .toArray();
  
    if (!hs.length) return false;
  
    const today = dateKey();
  
    for (let i = 0; i < 7; i++) {
      const day = addDays(today, -i);
  
      const count = await logs.countDocuments({
        user_id: userId,
        completed_date: day,
      });
  
      if (count < hs.length) {
        return false;
      }
    }
  
    return true;
  }
  
  // Check and unlock achievements
  export async function checkAchievements(userId) {
    const profile = await ensureProfile(userId);
    const total = await totalCompletions(userId);
    const streak = await bestStreak(userId);
    const perfectWeek =
      await hasPerfectWeek(userId);
  
    const defs = await achievements
      .find({})
      .sort({
        requirement_value: 1,
        name: 1,
      })
      .toArray();
  
    const unlockedNow = [];
    let bonusXp = 0;
  
    for (const a of defs) {
      const alreadyUnlocked =
        await userAchievements.findOne({
          user_id: userId,
          achievement_id: a.id,
        });
  
      if (alreadyUnlocked) continue;
  
      let achieved = false;
  
      if (
        a.requirement_type ===
        "total_completions"
      ) {
        achieved =
          total >= a.requirement_value;
      } else if (
        a.requirement_type === "streak"
      ) {
        achieved =
          streak.longest >= a.requirement_value;
      } else if (
        a.requirement_type === "level"
      ) {
        achieved =
          profile.level >=
          a.requirement_value;
      } else if (
        a.requirement_type === "perfect_week"
      ) {
        achieved = perfectWeek;
      }
  
      if (achieved) {
        await userAchievements.updateOne(
          {
            user_id: userId,
            achievement_id: a.id,
          },
          {
            $setOnInsert: {
              user_id: userId,
              achievement_id: a.id,
              unlocked_at: now(),
            },
          },
          {
            upsert: true,
          }
        );
  
        unlockedNow.push(a);
        bonusXp += a.xp_reward;
      }
    }
  
    return {
      unlockedNow,
      bonusXp,
    };
  }
  
  // Create today's daily quests if needed
  export async function ensureDailyQuests(userId) {
    const today = dateKey();
  
    const existing = await dailyQuests
      .find({
        user_id: userId,
        quest_date: today,
      })
      .sort({
        id: 1,
      })
      .toArray();
  
    if (existing.length >= 3) {
      return existing;
    }
  
    const habitsCount =
      await habits.countDocuments({
        user_id: userId,
        is_archived: false,
      });
  
    const doneToday =
      await logs.countDocuments({
        user_id: userId,
        completed_date: today,
      });
  
    const defs = [
      {
        title: "Complete 2 habits",
        description:
          "Check off any two habits today.",
        target: 2,
        progress: Math.min(doneToday, 2),
        xp_reward: 30,
      },
      {
        title: "Complete all habits",
        description: habitsCount
          ? "Finish every active habit today."
          : "Create a habit and complete it today.",
        target: Math.max(1, habitsCount),
        progress: Math.min(
          doneToday,
          Math.max(1, habitsCount)
        ),
        xp_reward: 50,
      },
      {
        title: "Build momentum",
        description:
          "Complete one habit today.",
        target: 1,
        progress: Math.min(doneToday, 1),
        xp_reward: 20,
      },
    ];
  
    for (const q of defs.slice(
      existing.length
    )) {
      await dailyQuests.insertOne({
        id: makeId("q"),
        user_id: userId,
        quest_date: today,
        title: q.title,
        description: q.description,
        target: q.target,
        progress: q.progress,
        xp_reward: q.xp_reward,
        completed:
          q.progress >= q.target,
      });
    }
  
    return dailyQuests
      .find({
        user_id: userId,
        quest_date: today,
      })
      .sort({
        id: 1,
      })
      .toArray();
  }
  
  // Refresh progress for today's quests
  export async function refreshQuestProgress(
    userId
  ) {
    const today = dateKey();
  
    const doneToday =
      await logs.countDocuments({
        user_id: userId,
        completed_date: today,
      });
  
    const habitsCount =
      await habits.countDocuments({
        user_id: userId,
        is_archived: false,
      });
  
    const quests = await dailyQuests
      .find({
        user_id: userId,
        quest_date: today,
      })
      .toArray();
  
    const rewards = [];
  
    for (const q of quests) {
      const target =
        q.title === "Complete all habits"
          ? Math.max(1, habitsCount)
          : q.target;
  
      const progress = Math.min(
        doneToday,
        target
      );
  
      const completed =
        progress >= target;
  
      if (!q.completed && completed) {
        rewards.push(q);
      }
  
      await dailyQuests.updateOne(
        {
          id: q.id,
          user_id: userId,
        },
        {
          $set: {
            target,
            progress,
            completed,
          },
        }
      );
    }
  
    return rewards;
  }
  
  // Award XP to a user
  export async function awardXP(
    userId,
    amount,
    reason
  ) {
    const p = await ensureProfile(userId);
  
    if (!amount) {
      const l = levelDataFromXp(p.xp);
  
      return {
        xpGained: 0,
        totalXp: p.xp,
        level: l.level,
        currentLevelXp:
          l.currentLevelXp,
        nextLevelXp:
          l.nextLevelXp,
        levelUp: false,
      };
    }
  
    const newXp = p.xp + amount;
    const l = levelDataFromXp(newXp);
  
    await gamificationProfiles.updateOne(
      {
        user_id: userId,
      },
      {
        $set: {
          xp: newXp,
          level: l.level,
        },
      }
    );
  
    await xpTransactions.insertOne({
      id: makeId("xp"),
      user_id: userId,
      amount,
      reason,
      created_at: now(),
    });
  
    return {
      xpGained: amount,
      totalXp: newXp,
      level: l.level,
      currentLevelXp:
        l.currentLevelXp,
      nextLevelXp:
        l.nextLevelXp,
      levelUp: l.level > p.level,
    };
  }
  
  // Process XP, achievements, and quests
  // after completing a habit
  export async function processHabitCompletion(
    userId
  ) {
    let base = await awardXP(
      userId,
      10,
      "Completed a habit"
    );
  
    const a = await checkAchievements(
      userId
    );
  
    // Award achievement bonus XP
    if (a.bonusXp) {
      const b = await awardXP(
        userId,
        a.bonusXp,
        "Achievement unlocked"
      );
  
      Object.assign(base, {
        totalXp: b.totalXp,
        level: b.level,
        currentLevelXp:
          b.currentLevelXp,
        nextLevelXp:
          b.nextLevelXp,
        levelUp:
          base.levelUp || b.levelUp,
      });
    }
  
    await ensureDailyQuests(userId);
  
    const rewards =
      await refreshQuestProgress(userId);
  
    // Award quest XP
    for (const q of rewards) {
      const b = await awardXP(
        userId,
        q.xp_reward,
        `Quest: ${q.title}`
      );
  
      Object.assign(base, {
        totalXp: b.totalXp,
        level: b.level,
        currentLevelXp:
          b.currentLevelXp,
        nextLevelXp:
          b.nextLevelXp,
        levelUp:
          base.levelUp || b.levelUp,
      });
    }
  
    return {
      ...base,
      achievements: a.unlockedNow,
      questRewards: rewards.map((q) => ({
        id: q.id,
        title: q.title,
        xpReward: q.xp_reward,
      })),
    };
  }
  
  // Get complete gamification data
  export async function getGamification(
    userId
  ) {
    let profile =
      await ensureProfile(userId);
  
    const a = await checkAchievements(
      userId
    );
  
    // Award newly unlocked achievement XP
    if (a.bonusXp) {
      await awardXP(
        userId,
        a.bonusXp,
        "Achievement unlocked"
      );
  
      profile =
        await ensureProfile(userId);
    }
  
    await ensureDailyQuests(userId);
    await refreshQuestProgress(userId);
  
    profile =
      await ensureProfile(userId);
  
    const level =
      levelDataFromXp(profile.xp);
  
    const streak =
      await bestStreak(userId);
  
    const defs = await achievements
      .find({})
      .sort({
        requirement_value: 1,
        name: 1,
      })
      .toArray();
  
    const ua = await userAchievements
      .find({
        user_id: userId,
      })
      .toArray();
  
    const unlocked = new Map(
      ua.map((x) => [
        x.achievement_id,
        x.unlocked_at,
      ])
    );
  
    const achievementsOut = defs.map(
      (x) => ({
        ...x,
        unlocked_at:
          unlocked.get(x.id) || null,
      })
    );
  
    const quests = await dailyQuests
      .find({
        user_id: userId,
        quest_date: dateKey(),
      })
      .sort({
        id: 1,
      })
      .toArray();
  
    const transactions =
      await xpTransactions
        .find({
          user_id: userId,
        })
        .sort({
          created_at: -1,
        })
        .limit(12)
        .toArray();
  
    return {
      xp: profile.xp,
      level: level.level,
      currentLevelXp:
        level.currentLevelXp,
      nextLevelXp:
        level.nextLevelXp,
      coins: profile.coins,
      currentStreak: streak.current,
      longestStreak: streak.longest,
      achievements: achievementsOut,
      quests,
      transactions,
    };
  }