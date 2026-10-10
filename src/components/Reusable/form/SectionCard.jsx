import React from "react";

// Colour presets — same palette as the Employee Master / Job Vacancy section cards
export const SECTION_THEMES = {
  blue: { barBg: "bg-[#e8f0fe]", iconBg: "bg-[#1a56db]/15 text-[#1a56db]", border: "border-[#c2d1f7]" },
  teal: { barBg: "bg-[#e6f7f4]", iconBg: "bg-[#0d9488]/15 text-[#0d9488]", border: "border-[#b2e3da]" },
  violet: { barBg: "bg-[#f3e8ff]", iconBg: "bg-[#7c3aed]/15 text-[#7c3aed]", border: "border-[#d4b8f5]" },
  red: { barBg: "bg-[#fee2e2]", iconBg: "bg-[#dc2626]/15 text-[#dc2626]", border: "border-[#fca5a5]" },
  indigo: { barBg: "bg-[#eef2ff]", iconBg: "bg-[#6366f1]/15 text-[#6366f1]", border: "border-[#c7d2fe]" },
  orange: { barBg: "bg-[#fff7ed]", iconBg: "bg-[#f97316]/15 text-[#f97316]", border: "border-[#ffedd5]" },
  amber: { barBg: "bg-[#fefce8]", iconBg: "bg-[#eab308]/20 text-[#d97706]", border: "border-[#fef08a]" },
  sky: { barBg: "bg-[#e0f2fe]", iconBg: "bg-[#0284c7]/15 text-[#0284c7]", border: "border-[#7dd3fc]" },
  green: { barBg: "bg-[#f0fdf4]", iconBg: "bg-[#22c55e]/20 text-[#16a34a]", border: "border-[#bbf7d0]" },
  purple: { barBg: "bg-[#faf5ff]", iconBg: "bg-[#a855f7]/15 text-[#9333ea]", border: "border-[#e9d5ff]" },
  emerald: { barBg: "bg-[#ecfdf5]", iconBg: "bg-[#10b981]/15 text-[#059669]", border: "border-[#a7f3d0]" },
  slate: { barBg: "bg-[#eef1f7]", iconBg: "bg-[#64748b]/15 text-[#475569]", border: "border-[#dde1ea]" },
};

/**
 * Coloured card with an icon header bar.
 *  - theme:         key of SECTION_THEMES
 *  - right:         optional node rendered at the right end of the header (buttons etc.)
 *  - bodyClassName: grid/column classes for the body (default 2-column grid)
 */
const SectionCard = ({
  title,
  icon,
  theme = "slate",
  right,
  className = "",
  bodyClassName = "grid grid-cols-1 sm:grid-cols-2",
  collapsed,
  onToggle,
  children,
}) => {
  const t = SECTION_THEMES[theme] || SECTION_THEMES.slate;
  const collapsible = typeof onToggle === "function";
  const isCollapsed = collapsible && !!collapsed;
  return (
    <div className={`bg-white w-full flex flex-col border border-[#dde1ea] rounded-[6px] shadow-sm ${className}`}>
      <div
        onClick={collapsible ? onToggle : undefined}
        className={`px-[14px] py-[7px] shrink-0 flex items-center justify-between gap-2 border-b rounded-t-[5px] ${t.border} ${t.barBg} ${collapsible ? "cursor-pointer select-none" : ""} ${isCollapsed ? "rounded-b-[5px] border-b-0" : ""}`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {icon && (
            <div className={`w-[18px] h-[18px] rounded-[3px] flex items-center justify-center text-[11px] shadow-sm shrink-0 ${t.iconBg}`}>
              {icon}
            </div>
          )}
          <h3 className="text-[11.5px] font-bold uppercase tracking-[0.4px] text-[#0f2137] truncate">{title}</h3>
        </div>
        <div className="shrink-0 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {right}
        </div>
        {collapsible && (
          <span className="shrink-0 text-slate-500 text-[11px] leading-none">{isCollapsed ? "▸" : "▾"}</span>
        )}
      </div>
      {!isCollapsed && (
        <div className={`p-[14px] gap-x-[12px] gap-y-[10px] content-start items-start flex-1 ${bodyClassName}`}>{children}</div>
      )}
    </div>
  );
};

// Input styling matching the section cards — pass to FieldRenderer as `inputClassName`
export const formInputClass = (disabled, error) =>
  `w-full h-[32px] px-2.5 text-xs border rounded-md outline-none transition-colors ${disabled
    ? "bg-[#eef1f6] text-slate-500 border-slate-300 cursor-not-allowed"
    : error
      ? "bg-white text-slate-800 border-red-500 ring-1 ring-red-200"
      : "bg-white text-slate-800 border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
  }`;

// Label + control + error wrapper for fields placed inside a SectionCard
export const FormField = ({ label, required, hint, error, muted, className = "", children }) => (
  <div className={`min-w-0 ${className}`}>
    {label && (
      <label className={`block text-xs font-medium mb-1 ${muted ? "text-slate-400" : "text-slate-700"}`}>
        {label} {required && <span className="text-red-500">*</span>}
        {hint && <span className="text-slate-400 font-normal ml-1">{hint}</span>}
      </label>
    )}
    {children}
    {error && <span className="text-[11px] text-red-500">{error}</span>}
  </div>
);

export default SectionCard;
