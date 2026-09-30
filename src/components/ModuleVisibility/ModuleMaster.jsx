import { useEffect, useState, useMemo, useRef, memo, useCallback } from "react";
import Swal from "sweetalert2";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import * as FaIcons from "react-icons/fa";
import {
  FaSearch,
  FaLayerGroup,
  FaBoxOpen,
  FaRedo,
  FaTimes,
  FaEye,
  FaEyeSlash,
  FaArrowRight,
  FaArrowLeft,
} from "react-icons/fa";
import { fetchSidebarMenu, updateModuleVisibility } from "../../utils/api";

// ─────────────────────────────────────────────────────────────
// NOTE ON THEMING
// All surfaces (container, header, board, column panels, column
// headers, drop zones, empty states, cards, inputs) read from the
// CSS custom properties defined in the theme stylesheet (--bg-main,
// --bg-header, --text-main, --text-muted, --border-main,
// --icon-color, --accent-soft, --header-start/end). The component
// therefore follows whichever theme-* class is applied on an
// ancestor (theme-light, theme-dark, theme-corporate, theme-blue,
// theme-teal, theme-orange).
//
// Only the STATUS accents stay fixed across themes: emerald means
// "visible/live", slate means "hidden". These appear as the header
// legend dots, the status dot in each column header, the 4px left
// border on cards, and the drop-target ring. Surfaces are never
// hard-coded.
// ─────────────────────────────────────────────────────────────

// per-module icon-badge gradient — product/data identity color, not theme color
const GRADIENTS = [
  ["#6366F1", "#8B5CF6"],
  ["#3B82F6", "#06B6D4"],
  ["#EC4899", "#F43F5E"],
  ["#F59E0B", "#F97316"],
  ["#10B981", "#14B8A6"],
  ["#8B5CF6", "#D946EF"],
  ["#06B6D4", "#3B82F6"],
  ["#EF4444", "#F59E0B"],
  ["#14B8A6", "#6366F1"],
  ["#F43F5E", "#EC4899"],
];

const gradientCache = new Map();
const getGradient = (name = "") => {
  if (gradientCache.has(name)) return gradientCache.get(name);
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const result = GRADIENTS[Math.abs(hash) % GRADIENTS.length];
  gradientCache.set(name, result);
  return result;
};

// case-insensitive icon lookup built once (avoids re-scanning FaIcons per row/render)
const ICON_LOOKUP = Object.keys(FaIcons).reduce((acc, key) => {
  acc[key.toLowerCase()] = FaIcons[key];
  return acc;
}, {});
const getModuleIcon = (m) => {
  const raw = (m?.icon_name || "").trim();
  if (!raw) return null;
  return FaIcons[raw] || ICON_LOOKUP[raw.toLowerCase()] || null;
};

const springTransition = { type: "spring", stiffness: 420, damping: 34, mass: 0.7 };

// gradient built from the active theme's header vars — used for the logo badge,
// the column header bars and the retry button
const headerGradientStyle = {
  background: "linear-gradient(135deg, var(--header-start), var(--header-end))",
};

// ── Skeleton card while loading ──────────────────────────────────
function SkeletonCard() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[var(--border-main)] bg-[var(--bg-header)] px-3 py-2.5 animate-pulse">
      <div className="h-8 w-8 rounded-lg bg-[var(--accent-soft)] shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-2.5 w-24 rounded bg-[var(--accent-soft)]" />
        <div className="h-2 w-12 rounded bg-[var(--accent-soft)]" />
      </div>
      <div className="h-6 w-6 rounded-md bg-[var(--accent-soft)]" />
    </div>
  );
}

// ── A single draggable module card, sits in either column ───────
const ModuleCard = memo(function ModuleCard({ m, isBusy, onMove, direction, onDragStart, accentClass }) {
  const [c1, c2] = getGradient(m.mod_name || "");
  const IconComp = getModuleIcon(m);
  const MoveIcon = direction === "toHidden" ? FaArrowRight : FaArrowLeft;

  return (
    <motion.div
      layout
      layoutId={`card-${m.masmod_id}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.14 } }}
      transition={springTransition}
      draggable
      onDragStart={(e) => onDragStart(e, m)}
      className={`group flex items-center gap-2.5 rounded-xl border-y border-r border-l-4 border-[var(--border-main)] ${accentClass}
                  bg-[var(--bg-header)] px-3 py-2.5
                  cursor-grab active:cursor-grabbing select-none
                  shadow-[0_1px_2px_rgba(15,23,42,0.04)]
                  hover:shadow-[0_6px_16px_-8px_rgba(15,23,42,0.18)]
                  transition-shadow ${isBusy ? "opacity-50" : ""}`}
    >
      <div
        className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ring-1 ring-black/5"
        style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
      >
        {IconComp ? (
          <IconComp className="text-white text-[12px]" />
        ) : (
          <span className="text-white text-[11px] font-bold">
            {(m.mod_name || "?").charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[12.5px] font-semibold text-[var(--text-main)] truncate">{m.mod_name}</p>
        <p className="text-[10px] text-[var(--text-muted)] font-medium">Srl #{m.mod_srl ?? "-"}</p>
      </div>

      <button
        type="button"
        onClick={() => onMove(m)}
        disabled={isBusy}
        aria-label={direction === "toHidden" ? `Hide ${m.mod_name}` : `Show ${m.mod_name}`}
        title={direction === "toHidden" ? "Move to hidden" : "Move to visible"}
        className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0 text-[var(--text-muted)]
                   opacity-70 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100
                   hover:bg-[var(--accent-soft)] hover:text-[var(--text-main)]
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--icon-color)]
                   disabled:opacity-30 transition-all"
      >
        <MoveIcon size={11} />
      </button>
    </motion.div>
  );
});

// ── One column of the board (Visible or Hidden) ──────────────────
function BoardColumn({
  title,
  icon: Icon,
  tone,
  items,
  emptyLabel,
  direction,
  isBusyId,
  onMove,
  onDragStart,
  onDragOverColumn,
  onDropColumn,
  isDragOver,
  prefersReducedMotion,
}) {
  // Surfaces come from the theme. Only the status accent (emerald = visible,
  // slate = hidden) is fixed, so the two columns read the same way in every theme.
const tones = {
  emerald: {
    statusDot: "bg-[var(--icon-color)]",
    cardAccent: "border-l-[var(--icon-color)]",
    dropRing: "ring-[var(--icon-color)]",
  },
  rose: {
    statusDot: "bg-slate-400",
    cardAccent: "border-l-slate-400",
    dropRing: "ring-slate-400",
  },
};
  const t = tones[tone];

  return (
    <div
      onDragOver={onDragOverColumn}
      onDrop={onDropColumn}
      className={`flex flex-col h-full min-h-0 min-w-0 rounded-2xl border-2 transition-colors
                  ${isDragOver ? `ring-4 ${t.dropRing} bg-[var(--accent-soft)] border-transparent` : "bg-[var(--bg-header)] border-[var(--border-main)]"}`}
    >
      <div
        className="shrink-0 flex items-center gap-2 px-4 py-3 rounded-t-2xl text-white"
        style={headerGradientStyle}
      >
        <span className={`h-2 w-2 rounded-full shrink-0 ${t.statusDot}`} />
        <Icon size={13} />
        <span className="text-[12.5px] font-bold uppercase tracking-wide">{title}</span>
        <span className="ml-auto text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white">
          {items.length}
        </span>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 space-y-2 [-webkit-overflow-scrolling:touch]">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-10 text-center">
            <FaBoxOpen className="text-2xl mb-2 text-[var(--text-muted)] opacity-50" />
            <p className="text-[11px] font-medium text-[var(--text-muted)]">{emptyLabel}</p>
          </div>
        ) : (
          <motion.div layout={!prefersReducedMotion} className="space-y-2">
            <AnimatePresence mode="popLayout" initial={false}>
              {items.map((m) => (
                <ModuleCard
                  key={m.masmod_id}
                  m={m}
                  isBusy={isBusyId === m.masmod_id}
                  onMove={onMove}
                  direction={direction}
                  onDragStart={onDragStart}
                  accentClass={t.cardAccent}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function ModuleMaster() {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [togglingId, setTogglingId] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null); // "visible" | "hidden" | null
  const prefersReducedMotion = useReducedMotion();

  const requestSeq = useRef(0);
  const draggedIdRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 150);
    return () => clearTimeout(t);
  }, [search]);

  const loadModules = useCallback(async () => {
    const seq = ++requestSeq.current;
    setLoading(true);
    setLoadError(null);
    try {
      const data = await fetchSidebarMenu();
      if (seq !== requestSeq.current) return;
      setModules((data || []).slice().sort((a, b) => (a.mod_srl || 0) - (b.mod_srl || 0)));
    } catch (err) {
      if (seq !== requestSeq.current) return;
      console.error("Failed to load modules:", err);
      setLoadError(err?.response?.data?.message || err.message || "Something went wrong");
    } finally {
      if (seq === requestSeq.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadModules();
  }, [loadModules]);

  const commitVisibility = useCallback(async (m, newStat) => {
    const prevStat = m.show_stat;
    setTogglingId(m.masmod_id);
    setModules((prev) =>
      prev.map((row) => (row.masmod_id === m.masmod_id ? { ...row, show_stat: newStat } : row))
    );
    try {
      const res = await updateModuleVisibility(m.masmod_id, newStat);
      if (res?.success === false) {
        setModules((prev) =>
          prev.map((row) => (row.masmod_id === m.masmod_id ? { ...row, show_stat: prevStat } : row))
        );
        Swal.fire("Error", res.message || "Failed to move the module", "error");
      }
    } catch (err) {
      setModules((prev) =>
        prev.map((row) => (row.masmod_id === m.masmod_id ? { ...row, show_stat: prevStat } : row))
      );
      Swal.fire("Error", err.response?.data?.message || err.message, "error");
    } finally {
      setTogglingId(null);
    }
  }, []);

  const handleMoveToHidden = useCallback((m) => commitVisibility(m, "N"), [commitVisibility]);
  const handleMoveToVisible = useCallback((m) => commitVisibility(m, "Y"), [commitVisibility]);

  const handleDragStart = useCallback((e, m) => {
    draggedIdRef.current = m.masmod_id;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(m.masmod_id));
  }, []);

  const makeDropHandler = useCallback(
    (targetStat) => (e) => {
      e.preventDefault();
      setDragOverCol(null);
      const id = draggedIdRef.current ?? e.dataTransfer.getData("text/plain");
      const m = modules.find((row) => String(row.masmod_id) === String(id));
      if (m && m.show_stat !== targetStat) commitVisibility(m, targetStat);
      draggedIdRef.current = null;
    },
    [modules, commitVisibility]
  );

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    const list = q ? modules.filter((m) => (m.mod_name || "").toLowerCase().includes(q)) : modules;
    return list;
  }, [modules, debouncedSearch]);

  const visibleItems = useMemo(() => filtered.filter((m) => m.show_stat === "Y"), [filtered]);
  const hiddenItems = useMemo(() => filtered.filter((m) => m.show_stat !== "Y"), [filtered]);
  const totalCount = modules.length;

  return (
    <div
      className="flex flex-col h-full max-h-[calc(100vh-90px)] rounded-2xl overflow-hidden border"
      style={{
        background: "var(--bg-header)",
        color: "var(--text-main)",
        borderColor: "var(--border-main)",
      }}
    >
      {/* ══════════════════════ HEADER (theme-driven via inline styles) ══════════════════════ */}
      <div
        className="shrink-0 flex items-center gap-3 px-5 sm:px-7 py-3.5 border-b flex-wrap"
        style={{ borderColor: "var(--border-main)" }}
      >
        <div
          className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
          style={headerGradientStyle}
        >
          <FaLayerGroup className="text-white text-[14px]" />
        </div>
        <div className="min-w-0">
          <h2
            className="text-[14.5px] font-bold tracking-tight leading-tight"
            style={{ color: "var(--text-main)" }}
          >
            Module Master
          </h2>
       
        </div>

        <div className="w-full sm:w-auto sm:ml-auto flex items-center gap-2.5">
          <div className="relative flex-1 sm:flex-none sm:min-w-[160px] sm:max-w-[240px]">
            <FaSearch
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px]"
              style={{ color: "var(--text-muted)" }}
            />
            <input
              type="text"
              placeholder="Search module..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={(e) => {
                e.target.style.borderColor = "var(--icon-color)";
                e.target.style.background = "var(--bg-header)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "var(--border-main)";
                e.target.style.background = "var(--accent-soft)";
              }}
              aria-label="Search modules"
              className="w-full pl-8 pr-8 py-1.5 rounded-lg text-[12px] outline-none border transition-colors"
              style={{
                background: "var(--accent-soft)",
                color: "var(--text-main)",
                borderColor: "var(--border-main)",
              }}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: "var(--text-muted)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-main)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
              >
                <FaTimes size={10} />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={loadModules}
            disabled={loading}
            aria-label="Refresh modules"
            className="shrink-0 p-2 rounded-lg disabled:opacity-40 transition-colors
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--icon-color)]"
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--text-main)";
              e.currentTarget.style.background = "var(--accent-soft)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--text-muted)";
              e.currentTarget.style.background = "transparent";
            }}
          >
            <FaRedo className={`text-[11px] ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* ══════════════════════ BOARD ══════════════════════ */}
      <div className="flex-1 min-h-0 overflow-hidden bg-[var(--bg-main)] px-3 sm:px-6 py-3 sm:py-4">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 grid-rows-2 sm:grid-rows-1 gap-3 sm:gap-4 h-full min-h-0">
            {[0, 1].map((col) => (
              <div
                key={col}
                className="rounded-2xl border border-[var(--border-main)] bg-[var(--accent-soft)] p-2.5 space-y-2 overflow-hidden"
              >
                {Array.from({ length: 4 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ))}
          </div>
        ) : loadError ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="h-16 w-16 rounded-2xl bg-[var(--accent-soft)] flex items-center justify-center mb-3">
              <FaBoxOpen className="text-rose-400 text-2xl" />
            </div>
            <p className="text-[13.5px] font-bold text-[var(--text-main)]">Couldn't load modules</p>
            <p className="text-[11.5px] text-[var(--text-muted)] mt-1 max-w-xs">{loadError}</p>
            <button
              type="button"
              onClick={loadModules}
              style={headerGradientStyle}
              className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-white text-[12px] font-semibold hover:opacity-90 transition-opacity"
            >
              <FaRedo size={10} /> Retry
            </button>
          </div>
        ) : totalCount === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="h-16 w-16 rounded-2xl bg-[var(--accent-soft)] flex items-center justify-center mb-3">
              <FaBoxOpen className="text-[var(--text-muted)] text-2xl" />
            </div>
            <p className="text-[13.5px] font-bold text-[var(--text-main)]">No modules found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 grid-rows-2 sm:grid-rows-1 gap-3 sm:gap-4 h-full min-h-0">
            <BoardColumn
              title="Visible"
              icon={FaEye}
              tone="emerald"
              items={visibleItems}
              emptyLabel={search ? "No matches for your search" : "Drag a module here"}
              direction="toHidden"
              isBusyId={togglingId}
              onMove={handleMoveToHidden}
              onDragStart={handleDragStart}
              onDragOverColumn={(e) => {
                e.preventDefault();
                setDragOverCol("visible");
              }}
              onDropColumn={makeDropHandler("Y")}
              isDragOver={dragOverCol === "visible"}
              prefersReducedMotion={prefersReducedMotion}
            />
            <BoardColumn
              title="Hidden"
              icon={FaEyeSlash}
              tone="rose"
              items={hiddenItems}
              emptyLabel={search ? "No matches for your search" : "Everything is visible"}
              direction="toVisible"
              isBusyId={togglingId}
              onMove={handleMoveToVisible}
              onDragStart={handleDragStart}
              onDragOverColumn={(e) => {
                e.preventDefault();
                setDragOverCol("hidden");
              }}
              onDropColumn={makeDropHandler("N")}
              isDragOver={dragOverCol === "hidden"}
              prefersReducedMotion={prefersReducedMotion}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default ModuleMaster;