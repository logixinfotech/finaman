// Shared constants for the Vacancy Tracking screens (read-only view over Job Vacancy + Candidate Pipeline).
export { STAGES, TOTAL_STAGES, fmtDate, fmtDateTime, timeAgo, daysBetween, initials } from "../CandidateTracking/pipelineConstants";

export const VACANCY_STATUSES = ["Draft", "Pending Approval", "Approved", "Open", "On Hold", "Closed", "Rejected", "Cancelled"];
export const PRIORITIES = ["Urgent", "High", "Normal", "Medium", "Low"];

export const PRIORITY_STYLES = {
  Urgent: "bg-rose-50 text-rose-700 border-rose-300",
  High: "bg-orange-50 text-orange-700 border-orange-300",
  Normal: "bg-slate-50 text-slate-700 border-slate-200",
  Medium: "bg-amber-50 text-amber-700 border-amber-300",
  Low: "bg-slate-50 text-slate-600 border-slate-200",
};
// export const PRIORITIES = ["Urgent", "High", "Medium", "Low"];

export const STATUS_STYLES = {
  Draft: "bg-slate-100 text-slate-700 border-slate-300",
  "Pending Approval": "bg-amber-50 text-amber-800 border-amber-300",
  Approved: "bg-emerald-50 text-emerald-800 border-emerald-300",
  Open: "bg-blue-50 text-blue-800 border-blue-300",
  "On Hold": "bg-purple-50 text-purple-800 border-purple-300",
  Closed: "bg-slate-100 text-slate-700 border-slate-300",
  Rejected: "bg-rose-50 text-rose-800 border-rose-300",
  Cancelled: "bg-rose-50 text-rose-700 border-rose-200",
};

// export const PRIORITY_STYLES = {
//   Urgent: "bg-rose-50 text-rose-700 border-rose-300",
//   High: "bg-orange-50 text-orange-700 border-orange-300",
//   Medium: "bg-amber-50 text-amber-700 border-amber-300",
//   Low: "bg-slate-50 text-slate-600 border-slate-200",
// };

export const statusStyle = (s) => STATUS_STYLES[s] || STATUS_STYLES.Draft;
export const priorityStyle = (p) => PRIORITY_STYLES[p] || PRIORITY_STYLES.Low;

export const vacancyTitle = (v) => v?.job_role || v?.designation_name || "Open Position";

export const isOpenVacancy = (v) => ["Open", "Approved"].includes(v?.vacancy_status);

// Target joining date has passed and positions are still unfilled
export const isOverdue = (v) => {
  if (!isOpenVacancy(v) || !v.target_joining_date) return false;
  const remaining = (v.number_of_positions || 0) - (v.filled_positions || 0);
  return remaining > 0 && new Date(v.target_joining_date) < new Date();
};
