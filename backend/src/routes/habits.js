import express from "express";

import {
  habits,
  makeId,
  now,
  toHabit,
} from "../db.js";

import {
  requireAuth,
} from "../middleware/auth.js";

import {
  validateHabit,
} from "../utils.js";

const router = express.Router();

router.use(requireAuth);

// Get all habits
router.get("/", async (req, res) => {
  const filter = {
    user_id: req.userId,
    ...(String(req.query.includeArchived) === "true"
      ? {}
      : { is_archived: false }),
  };

  const rows = await habits
    .find(filter)
    .sort({
      habit_order: 1,
      created_at: 1,
    })
    .toArray();

  res.json(rows.map(toHabit));
});

// Create a new habit
router.post("/", async (req, res) => {
  const error = validateHabit(req.body);

  if (error) {
    return res.status(400).json({
      message: error,
    });
  }

  const count = await habits.countDocuments({
    user_id: req.userId,
  });

  const timestamp = now();
  const id = makeId("h");

  const doc = {
    id,
    user_id: req.userId,
    name: String(req.body.name).trim(),
    description: String(req.body.description ?? ""),
    category: req.body.category ?? "Other",
    frequency: req.body.frequency ?? "daily",
    target_days: Number(req.body.targetDays ?? 7),
    color: req.body.color ?? "#6366f1",
    icon: req.body.icon ?? "🎯",
    is_archived: false,
    habit_order: count,
    created_at: timestamp,
    updated_at: timestamp,
  };

  await habits.insertOne(doc);

  res.status(201).json(toHabit(doc));
});

// Archive / unarchive a habit
router.put("/:id/archive", async (req, res) => {
  const habit = await habits.findOne({
    id: req.params.id,
    user_id: req.userId,
  });

  if (!habit) {
    return res.status(404).json({
      message: "Habit not found",
    });
  }

  await habits.updateOne(
    { id: habit.id },
    {
      $set: {
        is_archived: !habit.is_archived,
        updated_at: now(),
      },
    }
  );

  res.json(
    toHabit(
      await habits.findOne({
        id: habit.id,
      })
    )
  );
});

// Update a habit
router.put("/:id", async (req, res) => {
  const habit = await habits.findOne({
    id: req.params.id,
    user_id: req.userId,
  });

  if (!habit) {
    return res.status(404).json({
      message: "Habit not found",
    });
  }

  const merged = {
    name: req.body.name ?? habit.name,
    description:
      req.body.description ?? habit.description,
    category:
      req.body.category ?? habit.category,
    frequency:
      req.body.frequency ?? habit.frequency,
    targetDays:
      req.body.targetDays ?? habit.target_days,
    color: req.body.color ?? habit.color,
    icon: req.body.icon ?? habit.icon,
  };

  const error = validateHabit(merged);

  if (error) {
    return res.status(400).json({
      message: error,
    });
  }

  await habits.updateOne(
    {
      id: req.params.id,
      user_id: req.userId,
    },
    {
      $set: {
        name: String(merged.name).trim(),
        description: String(merged.description),
        category: merged.category,
        frequency: merged.frequency,
        target_days: Number(merged.targetDays),
        color: merged.color,
        icon: merged.icon,
        updated_at: now(),
      },
    }
  );

  res.json(
    toHabit(
      await habits.findOne({
        id: req.params.id,
      })
    )
  );
});

// Delete a habit
router.delete("/:id", async (req, res) => {
  const result = await habits.deleteOne({
    id: req.params.id,
    user_id: req.userId,
  });

  if (!result.deletedCount) {
    return res.status(404).json({
      message: "Habit not found",
    });
  }

  res.json({
    message: "Deleted",
  });
});

export default router;