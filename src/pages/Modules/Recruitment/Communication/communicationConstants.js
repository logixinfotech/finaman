// Communication Submodule Constants & Universal Dispositions

export const DISPOSITIONS = [
  {
    key: "Interested",
    label: "Interested",
    color: "bg-emerald-50 text-emerald-700 border-emerald-300",
    dot: "bg-emerald-500",
    description: "Candidate is positive and wants to proceed with the hiring process",
  },
  {
    key: "Call Back",
    label: "Call Back",
    color: "bg-amber-50 text-amber-700 border-amber-300",
    dot: "bg-amber-500",
    description: "Candidate requested a callback at a specific date and time",
  },
  {
    key: "Reschedule",
    label: "Reschedule",
    color: "bg-sky-50 text-sky-700 border-sky-300",
    dot: "bg-sky-500",
    description: "Existing interview/screening needs to be rescheduled",
  },
  {
    key: "Hold",
    label: "Hold",
    color: "bg-purple-50 text-purple-700 border-purple-300",
    dot: "bg-purple-500",
    description: "Profile kept on temporary hold with review date",
  },
  {
    key: "Not Interested",
    label: "Not Interested",
    color: "bg-orange-50 text-orange-700 border-orange-300",
    dot: "bg-orange-500",
    description: "Candidate opted out (salary, commute, profile mismatch, etc.)",
  },
  {
    key: "Rejected",
    label: "Rejected",
    color: "bg-rose-50 text-rose-700 border-rose-300",
    dot: "bg-rose-500",
    description: "Candidate does not meet criteria or failed evaluation",
  },
  {
    key: "Not Picked",
    label: "Not Picked",
    color: "bg-slate-100 text-slate-700 border-slate-300",
    dot: "bg-slate-400",
    description: "Call unanswered or busy (increments call attempt count)",
  },
  {
    key: "Wrong Number",
    label: "Wrong Number",
    color: "bg-red-50 text-red-700 border-red-300",
    dot: "bg-red-500",
    description: "Incorrect contact number or invalid phone number",
  },
];

export const NOT_INTERESTED_REASONS = [
  "Salary / CTC Expectation Mismatch",
  "Job Location / Commute Distance",
  "Profile / Role Not Relevant",
  "Already Employed / Joined Another Company",
  "Pursuing Higher Studies / Exams",
  "Shift Timings / Working Hours Issue",
  "Notice Period / Immediate Joiner Required",
  "Personal / Relocation Reasons",
  "Other",
];

export const REJECTION_CATEGORIES = [
  "Criteria Mismatch / Experience",
  "Skill Verification Failed",
  "Practical Task / Test Benchmark Failed",
  "Communication / Language Fit",
  "Management Disapproval",
  "Budgetary / CTC Constraints",
  "Candidate No-Show",
  "Other",
];

export const RESCHEDULE_REASONS = [
  "Candidate unavailable at the slot",
  "Interviewer / panel unavailable",
  "Travel / commute constraint",
  "Technical issue (call / video)",
  "Health / personal emergency",
  "Other",
];

export const INTERVIEW_MODES = [
  "Telephonic",
  "Walk-in / In-Person",
  "Video Conference (Google Meet / Zoom)",
];

// Unanswered-call ceilings per stage (spec §8). Stages not listed have no ceiling.
export const CALL_LIMITS = { 1: 3, 4: 2, 5: 2, 6: 2 };

export const SOURCE_CHANNELS = ["PublicURL", "InternalHR", "Bulk Excel", "Referral", "Career Portal", "Direct", "Naukri", "LinkedIn"];

export const DISPOSITION_STYLES = DISPOSITIONS.reduce((acc, d) => {
  const parts = d.color.split(" ");
  acc[d.key] = {
    bg: parts[0] || "bg-gray-50",
    text: parts[1] || "text-gray-700",
    border: parts[2] || "border-gray-200",
  };
  return acc;
}, {});

export const dispositionStyle = (disp) => {
  const match = DISPOSITIONS.find((d) => d.key === disp || d.label === disp);
  return match?.color || "bg-slate-100 text-slate-700 border-slate-300";
};

export const dispositionDot = (disp) => {
  const match = DISPOSITIONS.find((d) => d.key === disp || d.label === disp);
  return match?.dot || "bg-slate-400";
};
