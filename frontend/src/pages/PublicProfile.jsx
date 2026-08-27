import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Trophy,
  Flame,
  Star,
  CheckCircle2,
  CalendarDays,
  Award,
} from "lucide-react";
import api from "../api/axios.js";
import LoadingSpinner from "../components/LoadingSpinner.jsx";

export default function PublicProfile() {
  const { userId } = useParams();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await api.get(`/leaderboard/user/${userId}`);

        if (!cancelled) {
          setData(response.data);
        }
      } catch (err) {
        console.error("Failed to load public profile:", err);

        if (!cancelled) {
          setError(
            err.response?.data?.message || "Unable to load this profile.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    if (userId) {
      loadProfile();
    }

    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (loading) {
    return <LoadingSpinner full />;
  }

  if (error || !data) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Link
          to="/leaderboard"
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-soft transition"
        >
          <ArrowLeft size={16} />
          Back to leaderboard
        </Link>

        <div className="card p-10 text-center">
          <div className="text-5xl mb-4">😕</div>

          <h1 className="text-lg font-semibold">Profile unavailable</h1>

          <p className="text-sm text-muted mt-2">
            {error || "This user could not be found."}
          </p>

          <Link
            to="/leaderboard"
            className="inline-flex items-center justify-center mt-5 px-4 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition"
          >
            Return to leaderboard
          </Link>
        </div>
      </div>
    );
  }

  const { user, stats, achievements = [] } = data;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back */}
      <Link
        to="/leaderboard"
        className="inline-flex items-center gap-2 text-sm text-muted hover:text-soft transition"
      >
        <ArrowLeft size={16} />
        Back to leaderboard
      </Link>

      {/* Profile Header */}
      <section className="card overflow-hidden relative">
        <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-brand-500/15 blur-3xl pointer-events-none" />

        <div className="p-6 md:p-8 relative">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            {/* Avatar */}
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center font-bold text-3xl md:text-4xl shadow-lg shadow-brand-500/25 shrink-0">
              {user.avatar || "?"}
            </div>

            {/* User information */}
            <div className="flex-1 min-w-0">
              <div className="text-xs uppercase tracking-widest text-muted font-semibold">
                HabitQuest Player
              </div>

              <h1 className="text-2xl md:text-3xl font-bold mt-1 truncate">
                {user.name || "User"}
              </h1>

              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="chip">Level {stats.level}</span>

                {user.memberSince && (
                  <span className="text-xs text-muted flex items-center gap-1">
                    <CalendarDays size={13} />
                    Member since{" "}
                    {new Date(user.memberSince).toLocaleDateString(undefined, {
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                )}
              </div>
            </div>

            {/* XP */}
            <div className="sm:text-right">
              <div className="flex sm:justify-end items-center gap-2">
                <Star size={20} className="text-yellow-500" />
                <span className="text-2xl font-bold">
                  {Number(stats.xp || 0).toLocaleString()}
                </span>
              </div>

              <div className="text-xs text-muted mt-1">Total XP</div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat
          icon={<Star size={19} />}
          label="Total XP"
          value={Number(stats.xp || 0).toLocaleString()}
        />

        <Stat
          icon={<Flame size={19} />}
          label="Current streak"
          value={`${stats.currentStreak || 0}d`}
        />

        <Stat
          icon={<Trophy size={19} />}
          label="Best streak"
          value={`${stats.longestStreak || 0}d`}
        />

        <Stat
          icon={<CheckCircle2 size={19} />}
          label="Completions"
          value={Number(stats.totalCompletions || 0).toLocaleString()}
        />
      </div>

      {/* Achievement Summary */}
      <section className="card p-5 md:p-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="font-semibold text-lg">🏆 Achievements</h2>

            <p className="text-sm text-muted mt-0.5">
              Milestones unlocked by {user.name || "this player"}.
            </p>
          </div>

          <div className="chip">{stats.achievementsUnlocked || 0} unlocked</div>
        </div>

        {achievements.length === 0 ? (
          <div className="py-8 text-center">
            <Award size={32} className="mx-auto text-muted" />

            <div className="text-sm font-medium mt-3">No achievements yet</div>

            <div className="text-xs text-muted mt-1">
              Keep building those habits!
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className="rounded-2xl p-4 border border-brand-500/20 bg-brand-500/5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="text-3xl">{achievement.icon || "🏆"}</div>

                  <CheckCircle2 size={17} className="text-emerald-500 mt-1" />
                </div>

                <div className="font-medium mt-3">{achievement.name}</div>

                <div className="text-xs text-muted mt-1 leading-relaxed">
                  {achievement.description}
                </div>

                {achievement.xpReward > 0 && (
                  <div className="text-xs font-semibold text-brand-700 dark:text-brand-300 mt-3">
                    +{achievement.xpReward} XP
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Public Profile Notice */}
      <div className="text-center text-xs text-muted pb-2">
        Only public gamification statistics are shown.
      </div>
    </div>
  );
}

function Stat({ icon, label, value }) {
  return (
    <div className="card p-4">
      <div className="w-9 h-9 rounded-xl bg-brand-500/10 text-brand-700 dark:text-brand-300 flex items-center justify-center">
        {icon}
      </div>

      <div className="text-xl font-semibold mt-3">{value}</div>

      <div className="text-xs text-muted mt-0.5">{label}</div>
    </div>
  );
}
