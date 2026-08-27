import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trophy, Medal, Crown, Flame } from "lucide-react";
import api from "../api/axios.js";
import LoadingSpinner from "../components/LoadingSpinner.jsx";

export default function Leaderboard() {
  const [data, setData] = useState(null);
  const [tab, setTab] = useState("weekly");

  const navigate = useNavigate();

  useEffect(() => {
    api
      .get("/leaderboard")
      .then((response) => {
        setData(response.data);
      })
      .catch((error) => {
        console.error("Failed to load leaderboard:", error);
      });
  }, []);

  if (!data) {
    return <LoadingSpinner full />;
  }

  const rows = data[tab] || [];

  const tabs = [
    ["weekly", "This week"],
    ["monthly", "This month"],
    ["allTime", "All time"],
  ];

  // Open a user's public profile
  const openUserProfile = (userId) => {
    if (!userId) return;

    navigate(`/leaderboard/user/${userId}`);
  };

  // Icons for the top three positions
  const positionIcons = [
    <Crown key="crown" className="w-7 h-7" />,
    <Medal key="medal-1" className="w-7 h-7" />,
    <Medal key="medal-2" className="w-7 h-7" />,
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center">
          <Trophy className="w-6 h-6" />
        </div>

        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Leaderboard
          </h1>

          <p className="text-sm text-muted mt-0.5">
            Compete on consistency, not just activity.
          </p>
        </div>
      </div>

      {/* Time Period Tabs */}
      <div className="card p-2 flex gap-2">
        {tabs.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition ${
              tab === key
                ? "bg-brand-500 text-white shadow-md"
                : "text-soft hover:bg-[var(--surface-hover)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Top 3 Players */}
      {rows.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {rows.slice(0, 3).map((user, index) => (
            <button
              key={user.id}
              type="button"
              onClick={() => openUserProfile(user.id)}
              className={`card p-5 text-center relative cursor-pointer hover:-translate-y-1 hover:shadow-lg transition ${
                index === 0 ? "ring-2 ring-brand-500/20" : ""
              }`}
            >
              {/* Position Icon */}
              <div className="flex justify-center text-brand-500">
                {positionIcons[index]}
              </div>

              {/* Rank */}
              <div className="text-xs text-muted mt-1">#{index + 1}</div>

              {/* Avatar */}
              <div className="w-12 h-12 mx-auto mt-3 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center font-bold text-lg">
                {user.avatar?.toUpperCase()}
              </div>

              {/* Name */}
              <div className="font-semibold mt-2 truncate">{user.name}</div>

              {/* Level */}
              <div className="text-xs text-muted">Level {user.level}</div>

              {/* XP */}
              <div className="flex items-center justify-center gap-1 font-bold mt-2">
                <Flame className="w-4 h-4 text-orange-500" />
                {user.xp.toLocaleString()} XP
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Full Leaderboard */}
      {rows.length > 0 && (
        <div className="card overflow-hidden">
          {rows.map((user, index) => (
            <button
              key={user.id}
              type="button"
              onClick={() => openUserProfile(user.id)}
              className={`w-full flex items-center gap-3 px-4 md:px-6 py-4 border-b divider last:border-0 text-left cursor-pointer hover:bg-[var(--surface-hover)] transition ${
                user.isMe ? "bg-brand-500/5" : ""
              }`}
            >
              {/* Rank */}
              <div className="w-10 flex justify-center">
                {index === 0 ? (
                  <Crown className="w-5 h-5 text-brand-500" />
                ) : index === 1 || index === 2 ? (
                  <Medal className="w-5 h-5 text-brand-500" />
                ) : (
                  <span className="font-bold text-sm">#{user.rank}</span>
                )}
              </div>

              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-brand-500/10 text-brand-700 dark:text-brand-300 flex items-center justify-center font-semibold">
                {user.avatar?.toUpperCase()}
              </div>

              {/* User Information */}
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">
                  {user.name}

                  {user.isMe && <span className="ml-2 chip">You</span>}
                </div>

                <div className="text-xs text-muted">Level {user.level}</div>
              </div>

              {/* XP */}
              <div className="flex items-center gap-1 font-semibold text-sm">
                <Flame className="w-4 h-4 text-orange-500" />
                {user.xp.toLocaleString()} XP
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!rows.length && (
        <div className="card p-8 text-center text-muted">
          No leaderboard data yet. Complete a habit to get started.
        </div>
      )}
    </div>
  );
}
