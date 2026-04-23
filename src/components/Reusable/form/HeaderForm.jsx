import React from "react";
import { motion } from "framer-motion";
import { Search, FileText, ChevronRight, Activity } from "lucide-react";

const ERPHeader = ({
  title,
  isAddMode,
  isEditMode,
  isViewMode,
  rightContent,
  activeTab,
  onTabChange,
}) => { 
  const statusConfig = isAddMode
    ? { label: "New", color: "text-emerald-400", dot: "bg-emerald-400" }
    : isEditMode
    ? { label: "Edit", color: "text-amber-400", dot: "bg-amber-400" }
    : { label: "View", color: "text-slate-400", dot: "bg-slate-500" };

  return (
    <div
      className="relative px-6 py-1.5 rounded-t-xl flex justify-between items-center border-b border-white/[0.08]"
      style={{ background: "var(--sidebar-top-bg)", color: "#fff" }}
    >
      <div className="flex items-center gap-8">
        {/* SLIM TITLE SECTION */}
        <div className="flex items-center gap-3 border-r border-white/10 pr-6">
          <Activity size={14} className="text-blue-400/70" />
          <h2 className="text-[11px] font-semibold tracking-[0.2em] uppercase text-white/80">
            {title}
          </h2>
        </div>

        {/* MINIMALIST TABS */}
        <nav className="flex items-center gap-1">
          {["entry", "search"].map((tab) => (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className={`relative px-4 py-1 rounded-md text-[10px] font-medium tracking-widest uppercase transition-all duration-300 ${
                activeTab === tab ? "text-white" : "text-white/40 hover:text-white/70"
              }`}
            >
              <span className="relative z-10 flex items-center gap-2">
                {tab === "entry" ? <FileText size={11} /> : <Search size={11} />}
                {tab}
              </span>
              
              {activeTab === tab && (
                <motion.div
                  layoutId="activeTabHighlight"
                  className="absolute inset-0 bg-white/[0.08] rounded-md border border-white/10"
                  transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                />
              )}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-6">
        {/* SUBTLE CONTEXT INFO */}
        {rightContent && (
          <div className="flex items-center gap-2 px-3 py-1 bg-black/20 rounded border border-white/5">
            <span className="text-[9px] text-white/30 font-medium italic">Ref:</span>
            <span className="text-[10px] font-mono text-blue-300/80 uppercase tracking-tight">
              {rightContent}
            </span>
          </div>
        )}

        {/* CLEAN STATUS INDICATOR */}
        <div className="flex items-center gap-2.5 pl-4 border-l border-white/10">
          <div className="relative flex items-center justify-center">
            <div className={`w-1 h-1 rounded-full ${statusConfig.dot}`} />
            <motion.div 
               animate={{ scale: [1, 2.5], opacity: [0.3, 0] }}
               transition={{ repeat: Infinity, duration: 2 }}
               className={`absolute inset-0 rounded-full ${statusConfig.dot}`} 
            />
          </div>
          <span className={`text-[10px] font-bold tracking-widest uppercase ${statusConfig.color}`}>
            {statusConfig.label}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ERPHeader;