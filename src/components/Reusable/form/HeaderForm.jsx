import { FileText, Search, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

const TAB_CONFIG = [
  { id: "entry",    Icon: FileText,  label: "entry"    },
  { id: "search",   Icon: Search,    label: "search"   },
  { id: "settings", Icon: Settings,  label: "settings" },
];

const ERPHeader = ({
  title,
  isAddMode,
  isEditMode,
  isViewMode,
  rightContent,
  activeTab,
  onTabChange,
}) => {
  const isSettingsTab = activeTab === "settings";

  const statusConfig = isSettingsTab
    ? { label: "Config", color: "text-amber-400", dot: "bg-amber-400" }
    : isAddMode
    ? { label: "New",    color: "text-emerald-400", dot: "bg-emerald-400" }
    : isEditMode
    ? { label: "Edit",   color: "text-amber-400",   dot: "bg-amber-400"  }
    : { label: "View",   color: "text-slate-400",   dot: "bg-slate-500"  };

  return (
    <div
      className="relative flex items-center justify-between px-5 border-b border-white/[0.07] rounded-t-xl"
      style={{ background: "var(--sidebar-top-bg)", color: "#fff", minHeight: "44px" }}
    >
      {/* ── LEFT ── */}
      <div className="flex items-center gap-0">
        <div className="flex items-center gap-2.5 pr-5 border-r border-white/[0.08]">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.8)]" />
          <h2 className="text-[10px] font-semibold tracking-[0.2em] uppercase text-white/75 whitespace-nowrap">
            {title}
          </h2>
        </div>

        <nav className="flex items-center gap-0.5 pl-4">
          {TAB_CONFIG.map(({ id, Icon, label }) => (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`
                relative flex items-center gap-1.5 px-3.5 py-1 rounded
                text-[10px] font-medium tracking-[0.12em] uppercase
                transition-all duration-200 border
                ${activeTab === id
                  ? id === "settings"
                    ? "text-amber-300 border-white/10 bg-white/[0.08]"
                    : "text-white border-white/10 bg-white/[0.08]"
                  : "text-white/35 border-transparent hover:text-white/60 hover:bg-white/[0.04]"
                }
              `}
            >
              <Icon size={10} className="shrink-0" />
              {label}
              {activeTab === id && (
                <motion.span
                  layoutId="erpHeaderTabHighlight"
                  className="absolute inset-0 rounded bg-white/[0.06] border border-white/10"
                  transition={{ type: "spring", bounce: 0, duration: 0.35 }}
                />
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* ── RIGHT ── */}
      <div className="flex items-center gap-4">
        {rightContent && !isSettingsTab && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/20 border border-white/[0.06]">
            <span className="text-[9px] text-white/25 italic font-medium">Ref</span>
            <span className="font-mono text-[10px] text-blue-300/80 tracking-tight">
              {rightContent}
            </span>
          </div>
        )}
        <div className="flex items-center gap-2 pl-4 border-l border-white/[0.08]">
          <span className="relative flex h-2 w-2 items-center justify-center">
            <span className={`absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping ${statusConfig.dot}`} />
            <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${statusConfig.dot}`} />
          </span>
          <span className={`text-[9px] font-bold tracking-[0.18em] uppercase ${statusConfig.color}`}>
            {statusConfig.label}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ERPHeader;