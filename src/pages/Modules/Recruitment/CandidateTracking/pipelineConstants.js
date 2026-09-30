// Shared constants for the Candidate Pipeline screens.
// Category colours follow the palette already used across the Recruitment module
// (blue = active, amber = pending, emerald = success, rose = terminal).

export const STAGES = [
  { stage_no: 1, stage_name: "Sourcing & Calling", short: "Sourcing", hint: "Raw data · 3 attempts" },
  { stage_no: 2, stage_name: "Initial Screening", short: "Screening", hint: "Criteria check · JD sent" },
  { stage_no: 3, stage_name: "Assessment", short: "Assessment", hint: "Questionnaire · scoring" },
  { stage_no: 4, stage_name: "Round 1 · Telephonic", short: "Round 1", hint: "Skill scorecard" },
  { stage_no: 5, stage_name: "Round 2 · Walk-in / Task", short: "Round 2", hint: "Practical evaluation" },
  { stage_no: 6, stage_name: "Final · Management", short: "Final Round", hint: "CTC · bond · culture fit" },
  { stage_no: 7, stage_name: "Offer & Onboarding", short: "Offer", hint: "Offer · joining · Day 1" },
];
export const TOTAL_STAGES = STAGES.length;
export const JOINED_STATUS = "Joined - Converted to Employee";

export const CATEGORY_STYLES = {
  Active: { label: "Active", chip: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-500", bar: "bg-blue-500", ring: "ring-blue-300", text: "text-blue-700" },
  Intermediate: { label: "Comm Pending", chip: "bg-amber-50 text-amber-800 border-amber-300", dot: "bg-amber-500", bar: "bg-amber-500", ring: "ring-amber-300", text: "text-amber-700" },
  Milestone: { label: "Milestone", chip: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500", bar: "bg-emerald-500", ring: "ring-emerald-300", text: "text-emerald-700" },
  Terminal: { label: "Terminal", chip: "bg-rose-50 text-rose-700 border-rose-200", dot: "bg-rose-500", bar: "bg-rose-500", ring: "ring-rose-300", text: "text-rose-700" },
};

// "Joined" is Terminal but is shown in the success colour
export const styleFor = (category, statusBase) =>
  statusBase === JOINED_STATUS ? { ...CATEGORY_STYLES.Milestone, label: "Terminal" } : CATEGORY_STYLES[category] || CATEGORY_STYLES.Active;

export const initials = (name = "") =>
  name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() || "").join("") || "?";

export const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export const fmtDateTime = (d) =>
  d ? new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

export const timeAgo = (d) => {
  if (!d) return "";
  const diff = Math.max(0, Date.now() - new Date(d).getTime());
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr${h > 1 ? "s" : ""} ago`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days} day${days > 1 ? "s" : ""} ago`;
  return fmtDate(d);
};

export const daysBetween = (from, to = new Date()) =>
  from ? Math.max(0, Math.floor((new Date(to) - new Date(from)) / 86400000)) : 0;

// Reasons apply to "Not Interested" or "Offer Declined" statuses (or both)
export const reasonScopeFor = (statusName = "") =>
  statusName.includes("Offer Declined") ? "Offer Declined" : "Not Interested";
