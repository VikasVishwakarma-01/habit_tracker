// Available habit categories
export const CATEGORIES = new Set([
  "Health",
  "Fitness",
  "Learning",
  "Mindfulness",
  "Productivity",
  "Social",
  "Finance",
  "Creative",
  "Other",
]);

// Get current timestamp
export function now() {
  return new Date().toISOString();
}

// Generate a unique ID with a prefix
export function makeId(prefix) {
  return `${prefix}_${crypto.randomUUID()}`;
}

// Convert a date to YYYY-MM-DD format
export function dateKey(date = new Date()) {
  const d = new Date(date);

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${y}-${m}-${day}`;
}

// Check whether a value is a valid YYYY-MM-DD date string
export function isDateKey(v) {
  return (
    typeof v === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(v)
  );
}

// Add a number of days to a YYYY-MM-DD date
export function addDays(key, amount) {
  const d = new Date(
    `${key}T12:00:00`
  );

  d.setDate(d.getDate() + amount);

  return dateKey(d);
}

// Calculate current and longest streak
export function streakFromKeys(keys) {
  const unique = [...new Set(keys)].sort();

  if (!unique.length) {
    return {
      current: 0,
      longest: 0,
    };
  }

  const set = new Set(unique);

  const today = dateKey();
  const yesterday = addDays(
    today,
    -1
  );

  // Calculate current streak
  let current = 0;

  let cursor = set.has(today)
    ? today
    : set.has(yesterday)
      ? yesterday
      : null;

  while (
    cursor &&
    set.has(cursor)
  ) {
    current++;
    cursor = addDays(cursor, -1);
  }

  // Calculate longest streak
  let longest = 0;
  let run = 0;
  let prev = null;

  for (const key of unique) {
    run =
      prev && addDays(prev, 1) === key
        ? run + 1
        : 1;

    longest = Math.max(
      longest,
      run
    );

    prev = key;
  }

  return {
    current,
    longest,
  };
}

// Validate habit data
export function validateHabit(
  body = {}
) {
  const name = String(
    body.name ?? ""
  ).trim();

  if (!name) {
    return "Habit name is required";
  }

  if (name.length > 120) {
    return "Habit name is too long";
  }

  const frequency =
    body.frequency ?? "daily";

  if (
    !["daily", "weekly"].includes(
      frequency
    )
  ) {
    return "Invalid frequency";
  }

  const targetDays = Number(
    body.targetDays ?? 7
  );

  if (
    !Number.isInteger(targetDays) ||
    targetDays < 1 ||
    targetDays > 7
  ) {
    return "targetDays must be an integer from 1 to 7";
  }

  if (
    body.category &&
    !CATEGORIES.has(body.category)
  ) {
    return "Invalid category";
  }

  return null;
}