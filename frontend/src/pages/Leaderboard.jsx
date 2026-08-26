import { useEffect, useState } from "react";
import { Trophy, Medal, Crown, Flame } from "lucide-react";
import api from "../api/axios.js";
import LoadingSpinner from "../components/LoadingSpinner.jsx";

export default function Leaderboard(){
 const [data,setData]=useState(null); const [tab,setTab]=useState("weekly");
 useEffect(()=>{api.get("/leaderboard").then(r=>setData(r.data));},[]);
 if(!data)return <LoadingSpinner full/>;
 const rows=data[tab]||[];
 return <div className="space-y-6 animate-fade-in">
  <div><h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Leaderboard</h1><p className="text-sm text-muted mt-0.5">Compete on consistency, not just activity.</p></div>
  <div className="card p-2 flex gap-2">{[["weekly","This week"],["monthly","This month"],["allTime","All time"]].map(([key,label])=><button key={key} onClick={()=>setTab(key)} className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition ${tab===key?"bg-brand-500 text-white shadow-md":"text-soft hover:bg-[var(--surface-hover)]"}`}>{label}</button>)}</div>
  <div className="grid grid-cols-3 gap-3">{rows.slice(0,3).map((u,i)=><div key={u.id} className={`card p-5 text-center ${i===0?"ring-2 ring-brand-500/20":""}`}><div className="text-3xl">{["🥇","🥈","🥉"][i]}</div><div className="w-12 h-12 mx-auto mt-3 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center font-bold text-lg">{u.avatar?.toUpperCase()}</div><div className="font-semibold mt-2 truncate">{u.name}</div><div className="text-xs text-muted">Level {u.level}</div><div className="font-bold mt-2">⭐ {u.xp.toLocaleString()} XP</div></div>)}</div>
  <div className="card overflow-hidden">{rows.map((u,i)=><div key={u.id} className={`flex items-center gap-3 px-4 md:px-6 py-4 border-b divider last:border-0 ${u.isMe?"bg-brand-500/5":""}`}><div className="w-10 text-center font-bold text-sm">{i<3?["🥇","🥈","🥉"][i]:`#${u.rank}`}</div><div className="w-10 h-10 rounded-full bg-brand-500/10 text-brand-700 dark:text-brand-300 flex items-center justify-center font-semibold">{u.avatar?.toUpperCase()}</div><div className="flex-1 min-w-0"><div className="font-medium truncate">{u.name}{u.isMe&&<span className="ml-2 chip">You</span>}</div><div className="text-xs text-muted">Level {u.level}</div></div><div className="font-semibold text-sm">{u.xp.toLocaleString()} XP</div></div>)}</div>
  {!rows.length&&<div className="card p-8 text-center text-muted">No leaderboard data yet. Complete a habit to get started.</div>}
 </div>;
}
