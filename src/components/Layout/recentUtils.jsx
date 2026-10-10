// src/components/Layout/recentUtils.jsx
// Recent popup + Recent full page, dono yahi helpers use karte hain
import React from "react";
import * as FaIcons from "react-icons/fa";

const TINTS = [
  ["bg-blue-50", "text-blue-600"], ["bg-emerald-50", "text-emerald-600"], ["bg-violet-50", "text-violet-600"],
  ["bg-orange-50", "text-orange-600"], ["bg-cyan-50", "text-cyan-600"], ["bg-rose-50", "text-rose-600"],
  ["bg-indigo-50", "text-indigo-600"],
];
const hash = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h); return Math.abs(h); };

/** Menu / module ka icon_name (DB se) -> react-icons/fa icon. Naam na mile to default window icon. */
export function RecentIcon({ name, seed = "", size = "h-9 w-9", icon = "h-[18px] w-[18px]" }) {
  const Ico = (name && FaIcons[name]) || FaIcons.FaRegWindowMaximize;
  const [bg, fg] = TINTS[hash(String(name || seed || "x")) % TINTS.length];
  return (
    <span className={`flex ${size} shrink-0 items-center justify-center rounded-lg ${bg} ${fg}`}>
      <Ico className={icon} aria-hidden="true" />
    </span>
  );
}

export const startOfDay = (d = new Date()) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/** "Today, 11:42 AM" / "Yesterday, 10:05 AM" / "12 Oct 2026, 04:50 PM" */
export function whenLabel(ms) {
  const d = new Date(ms);
  const t = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const diff = Math.round((startOfDay() - startOfDay(d)) / 864e5);
  if (diff === 0) return `Today, ${t}`;
  if (diff === 1) return `Yesterday, ${t}`;
  return `${d.toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" })}, ${t}`;
}

/** "5m ago" */
export function agoLabel(ms) {
  const s = Math.max(0, (Date.now() - ms) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}