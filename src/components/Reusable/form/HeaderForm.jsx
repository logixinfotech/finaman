import { FileText, Search, Settings, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { motion } from 'framer-motion';

const TAB_CONFIG_BASE = [
  { id: "entry",  Icon: FileText, label: "Entry"  },
  { id: "search", Icon: Search,   label: "Search" },
];

const SETTINGS_TAB = { id: "settings", Icon: Settings, label: "Settings" };

const ERPHeader = ({
  title,
  subtitle,
  TitleIcon = User,
  isAddMode,
  isEditMode,
  isViewMode,
  rightContent,
  activeTab,
  onTabChange,
  showSettingsTab = false,
  currentIndex,
  totalRecords,
  onPrevRecord,
  onNextRecord,
}) => {
  const isSettingsTab = activeTab === "settings";
  const TAB_CONFIG = showSettingsTab
    ? [...TAB_CONFIG_BASE, SETTINGS_TAB]
    : TAB_CONFIG_BASE;

  const statusConfig = isSettingsTab
    ? { label: "Config", text: "text-amber-700",   bg: "bg-amber-50",   br: "border-amber-200",   dot: "bg-amber-500"   }
    : isAddMode
    ? { label: "New",    text: "text-emerald-700", bg: "bg-emerald-50", br: "border-emerald-200", dot: "bg-emerald-500" }
    : isEditMode
    ? { label: "Edit",   text: "text-amber-700",   bg: "bg-amber-50",   br: "border-amber-200",   dot: "bg-amber-500"   }
    : { label: "View",   text: "text-slate-600",   bg: "bg-slate-100",  br: "border-slate-200",   dot: "bg-slate-400"   };

  const showNav = (onPrevRecord || onNextRecord) && !isSettingsTab;
  const atStart = typeof currentIndex === "number" && currentIndex <= 1;
  const atEnd =
    typeof currentIndex === "number" &&
    typeof totalRecords === "number" &&
    currentIndex >= totalRecords;

  const navHoverIn = (e) => {
    if (e.currentTarget.disabled) return;
    e.currentTarget.style.background = "var(--accent-soft)";
    e.currentTarget.style.color = "var(--icon-color)";
    e.currentTarget.style.borderColor = "var(--icon-color)";
  };
  const navHoverOut = (e) => {
    e.currentTarget.style.background = "#ffffff";
    e.currentTarget.style.color = "#64748b";
    e.currentTarget.style.borderColor = "#e2e8f0";
  };

  return (
    <div
      className="flex items-center gap-3.5 h-[50px] px-3.5 bg-white border-b border-slate-200 rounded-t-xl flex-shrink-0"
      style={{
        boxShadow: "0 1px 0 0 rgba(15,23,42,0.04), inset 0 1px 0 0 rgba(255,255,255,0.9)",
      }}
    >

      {/* ── MODULE TILE — light accent bg ONLY on this section ── */}
      <div
        className="flex items-center gap-2.5 pr-3.5 border-r border-slate-200 self-stretch"
        style={{
          background: "var(--accent-soft, #eff6ff)",
          marginLeft: "-14px",
          paddingLeft: "14px",
          borderTopLeftRadius: "11px",
        }}
      >
        {/* Icon tile with depth */}
        <div
          className="w-[32px] h-[32px] rounded-[9px] flex items-center justify-center shrink-0 relative overflow-hidden"
          style={{
            background: "linear-gradient(145deg, #dbeafe 0%, #bfdbfe 60%, #93c5fd 100%)",
            boxShadow: "0 1px 2px rgba(37,99,235,0.18), inset 0 1px 0 rgba(255,255,255,0.6)",
          }}
        >
          <TitleIcon size={15} strokeWidth={2.2} style={{ color: "#1d4ed8", position: "relative", zIndex: 1 }} />
        </div>

        <div className="flex flex-col leading-tight">
          <span className="text-[12.5px] font-semibold text-slate-800 whitespace-nowrap">{title}</span>
          {subtitle && (
            <span className="text-[10px] text-slate-400 tracking-wide whitespace-nowrap mt-[1px]">{subtitle}</span>
          )}
        </div>
      </div>

      {/* ── SEGMENTED TABS ── */}
      <div className="flex items-center gap-0.5 bg-slate-100 rounded-[10px] p-[3px]">
        {TAB_CONFIG.map(({ id, Icon, label }) => {
          const active = activeTab === id;
          const isSettings = id === "settings";
          return (
            <button
              key={id}
              type="button"
              onClick={() => onTabChange(id)}
              className={`
                relative flex items-center gap-1.5 h-[30px] px-3.5 rounded-[8px]
                text-[11.5px] transition-colors duration-200
                ${active
                  ? "font-medium"
                  : "text-slate-500 font-normal hover:text-slate-700"
                }
              `}
              style={
                active
                  ? { color: isSettings ? "#b45309" : "var(--icon-color)" }
                  : undefined
              }
            >
              {active && (
                <motion.span
                  layoutId="erpHeaderTabHighlight"
                  className="absolute inset-0 rounded-[8px] -z-0"
                  style={{
                    background: "#ffffff",
                    border: "1px solid rgba(15,23,42,0.08)",
                    boxShadow: "0 1px 3px rgba(15,23,42,0.07), 0 1px 1px rgba(15,23,42,0.04)",
                  }}
                  transition={{ type: "spring", bounce: 0.18, duration: 0.4 }}
                />
              )}
              <Icon size={13} className="relative z-10 shrink-0" />
              <span className="relative z-10">{label}</span>
            </button>
          );
        })}
      </div>

      {/* ── RIGHT: status badge + navigator ── */}
      <div className="ml-auto flex items-center gap-3">

        {/* Status badge */}
        <div
          className={`flex items-center gap-1.5 border pl-2.5 pr-3 py-1 ${statusConfig.bg} ${statusConfig.br}`}
          style={{ borderRadius: "999px" }}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
          <span className={`text-[10px] font-bold tracking-[0.06em] uppercase ${statusConfig.text}`}>
            {statusConfig.label}
          </span>
        </div>

        {/* Record navigator */}
        {showNav && (
          <div className="flex items-center gap-1">
            <motion.button
              type="button"
              onClick={onPrevRecord}
              disabled={atStart}
              aria-label="Previous record"
              whileTap={!atStart ? { scale: 0.85 } : undefined}
              onMouseEnter={navHoverIn}
              onMouseLeave={navHoverOut}
              className="w-[28px] h-[28px] flex items-center justify-center rounded-[8px] border transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ background: "#ffffff", color: "#64748b", borderColor: "#e2e8f0" }}
            >
              <ChevronLeft size={15} strokeWidth={2.5} />
            </motion.button>

            <span className="text-[11px] text-slate-500 px-1 tabular-nums text-center min-w-[38px]">
              <span className="font-semibold text-slate-800">
                {typeof currentIndex === "number" ? currentIndex : "–"}
              </span>
              {typeof totalRecords === "number" ? ` / ${totalRecords}` : ""}
            </span>

            <motion.button
              type="button"
              onClick={onNextRecord}
              disabled={atEnd}
              aria-label="Next record"
              whileTap={!atEnd ? { scale: 0.85 } : undefined}
              onMouseEnter={navHoverIn}
              onMouseLeave={navHoverOut}
              className="w-[28px] h-[28px] flex items-center justify-center rounded-[8px] border transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ background: "#ffffff", color: "#64748b", borderColor: "#e2e8f0" }}
            >
              <ChevronRight size={15} strokeWidth={2.5} />
            </motion.button>
          </div>
        )}

        {/* Ref fallback when no navigator */}
        {rightContent && !isSettingsTab && !showNav && (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-400 italic">Ref</span>
            <span className="font-mono text-[11px] font-semibold tabular-nums" style={{ color: "var(--icon-color)" }}>
              {rightContent}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ERPHeader;
