import express from "express";
import bcrypt from "bcryptjs";

import {
  users,
  makeId,
  now,
  toUser,
} from "../db.js";

import {
  requireAuth,
  signToken,
} from "../middleware/auth.js";

const router = express.Router();

// Register
router.post("/register", async (req, res) => {
  const name = String(req.body?.name ?? "").trim();
  const email = String(req.body?.email ?? "")
    .trim()
    .toLowerCase();
  const password = String(req.body?.password ?? "");

  if (!name || !email || !password) {
    return res.status(400).json({
      message: "Name, email and password are required",
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      message: "Password must be at least 6 characters",
    });
  }

  if (await users.findOne({ email })) {
    return res.status(409).json({
      message: "An account with this email already exists",
    });
  }

  const timestamp = now();
  const id = makeId("u");

  const passwordHash = await bcrypt.hash(password, 12);

  await users.insertOne({
    id,
    name,
    email,
    password_hash: passwordHash,
    morning_motivation: true,
    created_at: timestamp,
    updated_at: timestamp,
  });

  const user = toUser(
    await users.findOne({ id })
  );

  res.status(201).json({
    user,
    token: signToken(id),
  });
});

// Login
router.post("/login", async (req, res) => {
  const email = String(req.body?.email ?? "")
    .trim()
    .toLowerCase();

  const password = String(
    req.body?.password ?? ""
  );

  const row = await users.findOne({ email });

  if (
    !row ||
    !(await bcrypt.compare(
      password,
      row.password_hash
    ))
  ) {
    return res.status(401).json({
      message: "Invalid email or password",
    });
  }

  res.json({
    user: toUser(row),
    token: signToken(row.id),
  });
});

// Get current user
router.get("/me", requireAuth, async (req, res) => {
  const row = await users.findOne({
    id: req.userId,
  });

  if (!row) {
    return res.status(404).json({
      message: "User not found",
    });
  }

  res.json({
    user: toUser(row),
  });
});

// Update profile
router.put(
  "/profile",
  requireAuth,
  async (req, res) => {
    const current = await users.findOne({
      id: req.userId,
    });

    if (!current) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const name =
      req.body?.name !== undefined
        ? String(req.body.name).trim()
        : current.name;

    const morningMotivation =
      req.body?.morningMotivation !== undefined
        ? Boolean(req.body.morningMotivation)
        : Boolean(current.morning_motivation);

    if (!name) {
      return res.status(400).json({
        message: "Name cannot be empty",
      });
    }

    await users.updateOne(
      { id: req.userId },
      {
        $set: {
          name,
          morning_motivation: morningMotivation,
          updated_at: now(),
        },
      }
    );

    res.json({
      user: toUser(
        await users.findOne({
          id: req.userId,
        })
      ),
    });
  }
);

export default router;