import { useEffect, useMemo, useState } from "react";
import {
  Trophy,
  Flame,
  Star,
  Lock,
  CheckCircle2,
  Sparkles,
  Coins,
  ArrowUpRight,
} from "lucide-react";
import api from "../api/axios.js";
import LoadingSpinner from "../components/LoadingSpinner.jsx";

export default function Gamification() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/gamification");
      setData(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const unlockedCount = useMemo(
    () => data?.achievements?.filter((item) => item.unlocked_at).length || 0,
    [data]
  );

  if (loading || !data) return <LoadingSpinner full />;

  const progress = data.nextLevelXp
    ? Math.min(100, Math.round((data.currentLevelXp / data.nextLevelXp) * 100))
    : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
          Gamification
        </h1>
        <p className="text-sm text-muted mt-0.5">
          Turn your consistency into XP, levels, and achievements.
        </p>
      </div>

      <section className="card overflow-hidden relative">
        <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full bg-brand-500/15 blur-3xl pointer-events-none" />
        <div className="p-6 md:p-7 relative">
          <div className="flex flex-col md:flex-row md:items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center shadow-lg shadow-brand-500/30 shrink-0">
              <Trophy size={30} />
            </div>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-widest text-muted font-semibold">
                Current level
              </div>
              <div className="text-3xl font-bold mt-1">Level {data.level}</div>
              <div className="text-sm text-muted mt-0.5">Habit Builder</div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Flame size={18} className="text-orange-500" />
                <div>
                  <div className="font-semibold">{data.currentStreak}</div>
                  <div className="text-xs text-muted">Current streak</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Coins size={18} className="text-yellow-500" />
                <div>
                  <div className="font-semibold">{data.coins}</div>
                  <div className="text-xs text-muted">Coins</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-7">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-medium">{data.currentLevelXp} XP</span>
              <span className="text-muted">{data.nextLevelXp} XP to next level</span>
            </div>
            <div className="h-3 rounded-full bg-[var(--surface-hover)] overflow-hidden border border-[var(--surface-border)]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-400 via-brand-500 to-brand-700 transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="text-xs text-muted mt-2">{progress}% complete</div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat icon={<Star size={19} />} label="Total XP" value={data.xp} />
        <Stat icon={<Flame size={19} />} label="Current streak" value={`${data.currentStreak}d`} />
        <Stat icon={<Trophy size={19} />} label="Best streak" value={`${data.longestStreak}d`} />
        <Stat icon={<Sparkles size={19} />} label="Achievements" value={`${unlockedCount}/${data.achievements.length}`} />
      </div>

      <section className="card p-5 md:p-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="font-semibold text-lg">🎯 Today's quests</h2>
            <p className="text-sm text-muted mt-0.5">Small wins give you extra XP.</p>
          </div>
          <div className="chip">Daily</div>
        </div>

        <div className="space-y-3">
          {data.quests.map((quest) => {
            const percent = Math.min(100, Math.round((quest.progress / Math.max(1, quest.target)) * 100));
            return (
              <div key={quest.id} className="rounded-2xl p-4 border border-[var(--surface-border)] bg-[var(--surface-hover)]">
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${quest.completed ? "bg-emerald-500/15 text-emerald-600" : "bg-brand-500/10 text-brand-700 dark:text-brand-300"}`}>
                    {quest.completed ? <CheckCircle2 size={19} /> : <Star size={18} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-medium">{quest.title}</div>
                      <div className="text-sm font-semibold text-brand-700 dark:text-brand-300">+{quest.xp_reward} XP</div>
                    </div>
                    <div className="text-xs text-muted mt-1">{quest.description}</div>
                    <div className="mt-3 h-2 rounded-full bg-[var(--surface)] overflow-hidden">
                      <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${percent}%` }} />
                    </div>
                    <div className="text-xs text-muted mt-1.5">{quest.progress} / {quest.target}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="card p-5 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-lg">🏆 Achievements</h2>
            <p className="text-sm text-muted mt-0.5">Milestones unlocked by your real habit activity.</p>
          </div>
          <div className="text-sm font-medium">{unlockedCount} unlocked</div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {data.achievements.map((achievement) => {
            const unlocked = Boolean(achievement.unlocked_at);
            return (
              <div
                key={achievement.id}
                className={`rounded-2xl p-4 border transition ${unlocked ? "border-brand-500/20 bg-brand-500/5" : "border-[var(--surface-border)] bg-[var(--surface-hover)] opacity-60"}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="text-3xl">{unlocked ? achievement.icon : <Lock size={25} />}</div>
                  {unlocked && <CheckCircle2 size={17} className="text-emerald-500 mt-1" />}
                </div>
                <div className="font-medium mt-3">{achievement.name}</div>
                <div className="text-xs text-muted mt-1 leading-relaxed">{achievement.description}</div>
                <div className="text-xs font-semibold text-brand-700 dark:text-brand-300 mt-3">+{achievement.xp_reward} XP</div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="card p-5 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-lg">⭐ XP history</h2>
            <p className="text-sm text-muted mt-0.5">See how you earned your progress.</p>
          </div>
          <ArrowUpRight size={18} className="text-muted" />
        </div>

        <div className="space-y-2">
          {data.transactions.length === 0 ? (
            <div className="text-sm text-muted py-4 text-center">Complete a habit to start earning XP.</div>
          ) : (
            data.transactions.map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--surface-hover)]">
                <div className="w-8 h-8 rounded-lg bg-brand-500/10 text-brand-700 dark:text-brand-300 flex items-center justify-center">
                  <Star size={15} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{item.reason}</div>
                  <div className="text-xs text-muted">{new Date(item.created_at).toLocaleString()}</div>
                </div>
                <div className="font-semibold text-sm text-emerald-600 dark:text-emerald-400">+{item.amount} XP</div>
              </div>
            ))
          )}
        </div>
      </section>
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
