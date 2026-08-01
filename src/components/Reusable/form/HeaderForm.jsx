import {
  FileText,
  Search,
  Settings,
  ChevronLeft,
  ChevronRight,
  User,
  ChevronDown,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const TAB_CONFIG_BASE = [
  { id: "entry", Icon: FileText, label: "Entry" },
  { id: "search", Icon: Search, label: "Search" },
];

const SETTINGS_TAB = { id: "settings", Icon: Settings, label: "Settings" };

const ERPHeader = ({
  title,
  subtitle,
  TitleIcon = User,
  isAddMode,
  isHidden,
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
    ? {
        label: "Config",
        text: "text-amber-700",
        bg: "bg-amber-50",
        br: "border-amber-200",
        dot: "bg-amber-500",
      }
    : isAddMode
      ? {
          label: "New",
          text: "text-emerald-700",
          bg: "bg-emerald-50",
          br: "border-emerald-200",
          dot: "bg-emerald-500",
        }
      : isEditMode
        ? {
            label: "Edit",
            text: "text-amber-700",
            bg: "bg-amber-50",
            br: "border-amber-200",
            dot: "bg-amber-500",
          }
        : {
            label: "View",
            text: "text-slate-600",
            bg: "bg-slate-100",
            br: "border-slate-200",
            dot: "bg-slate-400",
          };

  const showNav =
    (onPrevRecord || onNextRecord) && !isSettingsTab && isViewMode;
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
  const activeTabConfig =
  TAB_CONFIG.find((t) => t.id === activeTab) || TAB_CONFIG[0];

// ── mobile tabs dropdown state ──
const [mobileTabsOpen, setMobileTabsOpen] = useState(false);
const mobileTabsBtnRef = useRef(null);
const mobileTabsMenuRef = useRef(null);
const [menuPos, setMenuPos] = useState({ top: 0, left: 0, width: 0 });

// position dropdown relative to the trigger button, in viewport coords
useEffect(() => {
  if (!mobileTabsOpen) return;
  const updatePos = () => {
    if (mobileTabsBtnRef.current) {
      const rect = mobileTabsBtnRef.current.getBoundingClientRect();
      setMenuPos({ top: rect.bottom + 6, left: rect.left, width: rect.width });
    }
  };
  updatePos();
  window.addEventListener("scroll", updatePos, true);
  window.addEventListener("resize", updatePos);
  return () => {
    window.removeEventListener("scroll", updatePos, true);
    window.removeEventListener("resize", updatePos);
  };
}, [mobileTabsOpen]);

useEffect(() => {
  if (!mobileTabsOpen) return;
  const handleClickOutside = (e) => {
    const clickedBtn =
      mobileTabsBtnRef.current && mobileTabsBtnRef.current.contains(e.target);
    const clickedMenu =
      mobileTabsMenuRef.current && mobileTabsMenuRef.current.contains(e.target);
    if (!clickedBtn && !clickedMenu) setMobileTabsOpen(false);
  };
  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, [mobileTabsOpen]);
  useEffect(() => {
    if (!showNav) return;

    const isTypingTarget = (el) => {
      if (!el) return false;
      const tag = el.tagName;
      return (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        el.isContentEditable
      );
    };

    const handleKeyDown = (e) => {
      if (e.key !== "PageUp" && e.key !== "PageDown") return;
      if (isTypingTarget(document.activeElement)) return;

      if (e.key === "PageDown") {
        if (atStart || !onPrevRecord) return;
        e.preventDefault();
        onPrevRecord();
      } else if (e.key === "PageUp") {
        if (atEnd || !onNextRecord) return;
        e.preventDefault();
        onNextRecord();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showNav, atStart, atEnd, onPrevRecord, onNextRecord]);

  return (
    <div
      className="relative flex items-center gap-3.5 h-[50px] px-3.5 bg-white border-b border-slate-200 rounded-t-xl flex-shrink-0"
      style={{ height: 48 }}
    >
      {/* {!isHidden && (
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
                ${
                  active
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
                      boxShadow:
                        "0 1px 3px rgba(15,23,42,0.07), 0 1px 1px rgba(15,23,42,0.04)",
                    }}
                    transition={{
                      type: "spring",
                      bounce: 0.18,
                      duration: 0.4,
                    }}
                  />
                )}
                <Icon size={13} className="relative z-10 shrink-0" />
                <span className="relative z-10">{label}</span>
              </button>
            );
          })}
        </div>
      )} */}
      {!isHidden && (
  <>
    {/* Desktop segmented tabs (sm and up) */}
    <div className="hidden sm:flex items-center gap-0.5 bg-slate-100 rounded-[10px] p-[3px]">
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
                ${
                  active
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
                      boxShadow:
                        "0 1px 3px rgba(15,23,42,0.07), 0 1px 1px rgba(15,23,42,0.04)",
                    }}
                    transition={{
                      type: "spring",
                      bounce: 0.18,
                      duration: 0.4,
                    }}
                  />
                )}
                <Icon size={13} className="relative z-10 shrink-0" />
                <span className="relative z-10">{label}</span>
              </button>
            );
          })}
    </div>

   {/* Mobile dropdown (below sm) */}
<div className="sm:hidden shrink-0">
  <button
    ref={mobileTabsBtnRef}
    type="button"
    onClick={() => setMobileTabsOpen((v) => !v)}
    className="flex items-center gap-1.5 h-[32px] pl-2.5 pr-2 rounded-[8px] bg-slate-100 text-[11.5px] font-medium active:scale-[0.97] transition-transform"
    style={{ color: isSettingsTab ? "#b45309" : "var(--icon-color)" }}
  >
    <activeTabConfig.Icon size={13} className="shrink-0" />
    <span>{activeTabConfig.label}</span>
    <ChevronDown
      size={13}
      className={`shrink-0 transition-transform duration-200 ${
        mobileTabsOpen ? "rotate-180" : ""
      }`}
    />
  </button>

  {mobileTabsOpen &&
    createPortal(
      <AnimatePresence>
        <motion.div
          ref={mobileTabsMenuRef}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.15 }}
          style={{
            position: "fixed",
            top: menuPos.top,
            left: menuPos.left,
            minWidth: Math.max(menuPos.width, 136),
          }}
          className="z-[9999] bg-white rounded-[10px] border border-slate-200 shadow-lg p-1"
        >
          {TAB_CONFIG.map(({ id, Icon, label }) => {
            const active = activeTab === id;
            const isSettings = id === "settings";
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  onTabChange(id);
                  setMobileTabsOpen(false);
                }}
                className={`flex items-center gap-2 w-full text-left px-2.5 py-2 rounded-[8px] text-[12px] transition-colors ${
                  active
                    ? "font-medium bg-slate-50"
                    : "text-slate-500 font-normal hover:bg-slate-50"
                }`}
                style={
                  active
                    ? { color: isSettings ? "#b45309" : "var(--icon-color)" }
                    : undefined
                }
              >
                <Icon size={13} className="shrink-0" />
                {label}
              </button>
            );
          })}
        </motion.div>
      </AnimatePresence>,
      document.body
    )}
</div>
  </>
)}
      {!isHidden && (
        <>
        <div className="hidden sm:flex absolute left-[40%] top-1/2 -translate-x-1/2 -translate-y-1/2 items-center gap-3.5 py-2 self-stretch bg-slate-50/60 rounded-tl-xl">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 bg-blue-600 shadow-[0_2px_6px_rgba(37,99,235,0.25)]">
            <TitleIcon size={12} strokeWidth={2.5} className="text-white" />
          </div>

          <div className="flex flex-col min-w-0">
            <span
              className="text-[16px] !font-medium text-slate-900 truncate whitespace-nowrap"
              style={{
                fontFamily:
                  "'Inter', 'Roboto', 'Segoe UI', system-ui, sans-serif",
              }}
              title={title}
            >
              {title}
            </span>
          </div>
        </div>

        </>
      )}
      {isHidden && (
        <div
          className="flex items-center gap-3.5 px-4 py-2 self-stretch bg-slate-50/60 rounded-tl-xl mx-auto"
          style={{
            background: "var(--accent-soft, #eff6ff)",
            marginLeft: "-14px",
            marginRight: "14px",
            borderTopLeftRadius: "11px",
          }}
        >
          <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 bg-blue-600 shadow-[0_2px_6px_rgba(37,99,235,0.25)]">
            <TitleIcon size={12} strokeWidth={2.5} className="text-white" />
          </div>

          {/* Clean, No-Nonsense Text */}
          <div className="flex flex-col min-w-0">
            <span
              className="text-[16px] !font-medium text-slate-900 truncate whitespace-nowrap "
              title={title}
            >
              {title}
            </span>
          </div>
        </div>
      )}

      {/* ── MODULE TILE — light accent bg ONLY on this section ── */}

      {/* ── RIGHT: status badge + navigator ── */}
      <div className="ml-auto flex items-center gap-3">
        {/* Status badge */}
        <div
  className={`hidden sm:flex items-center gap-1.5 border pl-2.5 pr-3 py-1 ${statusConfig.bg} ${statusConfig.br}`}
  style={{ borderRadius: "999px" }}
>
          <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
          <span
            className={`text-[10px] font-bold tracking-[0.06em] uppercase ${statusConfig.text}`}
          >
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
             className="w-[30px] h-[30px] sm:w-[28px] sm:h-[28px] flex items-center justify-center font-semibold rounded-[8px] border transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                background: "#ffffff",
                color: "#64748b",
                borderColor: "#e2e8f0",
              }}
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
              className="w-[28px] h-[28px] flex items-center font-semibold justify-center rounded-[8px] border transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                background: "#ffffff",
                color: "#64748b",
                borderColor: "#e2e8f0",
              }}
            >
              <ChevronRight size={15} strokeWidth={2.5} />
            </motion.button>
          </div>
        )}

        {/* Ref fallback when no navigator */}
        {rightContent && !isSettingsTab && !showNav && (
           <div className="hidden sm:flex items-center gap-1.5">
            <span className="text-[10px] text-slate-400 italic">Ref</span>
            <span
              className="font-mono text-[11px] font-semibold tabular-nums"
              style={{ color: "var(--icon-color)" }}
            >
              {rightContent}
            </span>
          </div>
        )}
        {/* Icon tile with depth */}
      </div>
    </div>
  );
};

export default ERPHeader;
