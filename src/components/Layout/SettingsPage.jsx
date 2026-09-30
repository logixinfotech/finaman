 
import React, { useState, useMemo, useEffect, Suspense, lazy } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, MessageSquare, ShieldCheck, Settings as SettingsIcon,
  ChevronRight, ChevronDown, Star, XCircle, Inbox, Keyboard, Menu,
} from "lucide-react";
import { useAuth } from "../../theme/AuthContext";

/* ────────────────────────────────────────────────────────────────────────────
   Section registry — unchanged (ids, labels, groups, lazy components).
   ──────────────────────────────────────────────────────────────────────────── */
const SETTINGS_SECTIONS = [
  {
    id: "communication",
    label: "Communication Setup",
    description: "Email & WhatsApp channels, message templates",
    icon: MessageSquare,
    group: "Operations",
    component: lazy(() => import("./CommunicationSetup")),
  },
  {
    id: "authentication",
    label: "Authentication",
    description: "Password policy, 2FA, session rules",
    icon: ShieldCheck,
    group: "Security",
    comingSoon: true,
  },
  {
    id: "shortcuts",
    label: "Keyboard Shortcuts",
    description: "View, change or turn off shortcuts across the ERP",
    icon: Keyboard,
    group: "Personalisation",
    component: lazy(() => import("./KeyboardShortcuts")),
  },
  {
    id: "nav-shortcuts",
    label: "Navigation Shortcuts",
    description: "Open any screen with your own key combination",
    icon: Keyboard,
    group: "Personalisation",
    component: lazy(() => import("./NavigationShortcuts")),
  },
];

const FOCUS =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1";

/* ────────────────────────────────────────────────────────────────────────────
   Small presentational pieces
   ──────────────────────────────────────────────────────────────────────────── */
const EmptyState = ({ title, subtitle }) => (
  <div className="text-center py-10" role="status">
    <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-400">
      <Inbox className="h-5 w-5" aria-hidden="true" />
    </div>
    <p className="text-sm font-semibold text-slate-700">{title}</p>
    {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
  </div>
);

const ShimmerBlock = () => (
  <div className="space-y-3" role="status" aria-label="Loading settings">
    {[0, 1, 2].map((i) => (
      <div key={i} className="h-4 rounded bg-slate-100 animate-pulse" style={{ width: `${88 - i * 14}%` }} />
    ))}
    <div className="h-24 rounded-lg bg-slate-100 animate-pulse mt-4" />
  </div>
);

/* ────────────────────────────────────────────────────────────────────────────
   Page
   ──────────────────────────────────────────────────────────────────────────── */
const SettingsPage = () => {
  const { user } = useAuth(); // kept as-is (no behaviour change)
  const [activeId, setActiveId] = useState(SETTINGS_SECTIONS[0].id);
  const [search, setSearch] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [favourites, setFavourites] = useState(() => {
    try {
      const raw = JSON.parse(localStorage.getItem("favSettings") || "[]");
      return Array.isArray(raw) ? raw.map(String) : [];
    } catch { return []; }
  });

  const [recent, setRecent] = useState(() => {
    try {
      const raw = JSON.parse(localStorage.getItem("recentSettings") || "[]");
      return Array.isArray(raw) ? raw : [];
    } catch { return []; }
  });

  const [collapsedGroups, setCollapsedGroups] = useState(() => {
    try {
      const raw = JSON.parse(localStorage.getItem("collapsedSettingsGroups") || "[]");
      return new Set(Array.isArray(raw) ? raw : []);
    } catch { return new Set(); }
  });

  const toggleFavourite = (id, e) => {
    e.stopPropagation();
    setFavourites((prev) => {
      const updated = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      localStorage.setItem("favSettings", JSON.stringify(updated));
      return updated;
    });
  };

  const toggleGroup = (group) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      next.has(group) ? next.delete(group) : next.add(group);
      localStorage.setItem("collapsedSettingsGroups", JSON.stringify([...next]));
      return next;
    });
  };

  const visit = (id) => {
    setActiveId(id);
    setRecent((prev) => {
      const updated = [id, ...prev.filter((x) => x !== id)].slice(0, 4);
      localStorage.setItem("recentSettings", JSON.stringify(updated));
      return updated;
    });
  };

  // Type-ahead navigation — logic unchanged.
  useEffect(() => {
    let buffer = "";
    let timer = null;
    const handleKeyDown = (e) => {
      const tag = (e.target.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      if (!/^[a-zA-Z]$/.test(e.key)) return;
      buffer += e.key.toLowerCase();
      clearTimeout(timer);
      timer = setTimeout(() => { buffer = ""; }, 600);
      const target = SETTINGS_SECTIONS.find((s) => !s.comingSoon && s.label.toLowerCase().startsWith(buffer));
      if (target) visit(target.id);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => { window.removeEventListener("keydown", handleKeyDown); clearTimeout(timer); };
  }, []);

  const matches = (s) => s.label.toLowerCase().includes(search.toLowerCase());
  const searchActive = search.trim().length > 0;

  const favouriteItems = useMemo(
    () => SETTINGS_SECTIONS.filter((s) => favourites.includes(s.id) && !s.comingSoon && matches(s)),
    [favourites, search]
  );

  const groupSource = useMemo(
    () => SETTINGS_SECTIONS.filter((s) => matches(s) && (searchActive || !favourites.includes(s.id))),
    [search, favourites]
  );

  const groupedSections = useMemo(() => {
    const map = new Map();
    groupSource.forEach((s) => {
      if (!map.has(s.group)) map.set(s.group, []);
      map.get(s.group).push(s);
    });
    return Array.from(map, ([group, items]) => ({ group, items }));
  }, [groupSource]);

  const totalVisible = favouriteItems.length + groupSource.length;
  const active = SETTINGS_SECTIONS.find((s) => s.id === activeId);
  const ActiveComponent = active?.component;
  const ActiveIcon = active?.icon;
  const activeCount = SETTINGS_SECTIONS.filter((s) => !s.comingSoon).length;
  const comingSoonCount = SETTINGS_SECTIONS.length - activeCount;
  const recentChips = recent
    .filter((id) => id !== activeId)
    .map((id) => SETTINGS_SECTIONS.find((x) => x.id === id))
    .filter(Boolean);

  const selectSection = (id) => {
    visit(id);
    setMobileNavOpen(false);
  };

  /* One navigation row. The favourite star is a sibling of the main button
     (not nested inside it) so the markup is valid and each control is
     independently focusable. */
  const renderItem = (section) => {
    const Icon = section.icon;
    const isActive = section.id === activeId;
    const isFav = favourites.includes(section.id);
    const disabled = !!section.comingSoon;

    return (
      <li key={section.id} className="group relative">
        <button
          type="button"
          disabled={disabled}
          aria-current={isActive ? "page" : undefined}
          onClick={() => selectSection(section.id)}
          className={`relative flex w-full items-start gap-3 rounded-lg py-2 pl-3 text-left transition-colors
                      ${disabled ? "pr-3" : "pr-10"} ${FOCUS}
                      ${isActive
                        ? "bg-indigo-50 text-indigo-900"
                        : disabled
                          ? "text-slate-400 cursor-not-allowed"
                          : "text-slate-700 hover:bg-slate-100"}`}
        >
          {isActive && (
            <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-indigo-600" aria-hidden="true" />
          )}
          <Icon
            className={`mt-0.5 h-4 w-4 shrink-0 ${isActive ? "text-indigo-600" : disabled ? "text-slate-300" : "text-slate-400"}`}
            aria-hidden="true"
          />
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2">
              <span className="truncate text-[13.5px] font-medium">{section.label}</span>
              {disabled && (
                <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                  Coming soon
                </span>
              )}
              {!disabled && (
                <kbd
                  className="hidden xl:inline shrink-0 rounded border border-slate-200 bg-white px-1 text-[10px] font-medium text-slate-400"
                  title={`Press ${section.label.charAt(0).toUpperCase()} to open`}
                >
                  {section.label.charAt(0).toUpperCase()}
                </kbd>
              )}
            </span>
            <span className={`mt-0.5 block truncate text-xs ${isActive ? "text-indigo-700/70" : "text-slate-500"}`}>
              {section.description}
            </span>
          </span>
        </button>

        {!disabled && (
          <button
            type="button"
            onClick={(e) => toggleFavourite(section.id, e)}
            aria-pressed={isFav}
            aria-label={isFav ? `Remove ${section.label} from favourites` : `Add ${section.label} to favourites`}
            className={`absolute right-1.5 top-1.5 rounded-md p-1.5 transition
                        ${isFav ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100 max-lg:opacity-100"}
                        hover:bg-white ${FOCUS}`}
          >
            <Star className={`h-3.5 w-3.5 ${isFav ? "fill-amber-400 text-amber-500" : "text-slate-400"}`} aria-hidden="true" />
          </button>
        )}
      </li>
    );
  };

  return (
    <div className="h-full w-full overflow-y-auto bg-slate-50 pb-24">
      {/* ── Sticky page header ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <SettingsIcon className="h-4.5 w-4.5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-base font-semibold tracking-tight text-slate-900">Settings</h1>
          </div>
       
          <button
            type="button"
            onClick={() => setMobileNavOpen((o) => !o)}
            aria-expanded={mobileNavOpen}
            aria-controls="settings-nav"
            className={`lg:hidden inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 ${FOCUS}`}
          >
            <Menu className="h-4 w-4" aria-hidden="true" />
            Sections
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[288px_minmax(0,1fr)] lg:gap-8">
          {/* ── Left navigation ──────────────────────────────────────────────── */}
          <aside
            id="settings-nav"
            className={`${mobileNavOpen ? "block" : "hidden"} lg:block lg:sticky lg:top-[76px]
                        lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto`}
          >
            <div className="rounded-xl border border-slate-200 bg-white">
              <div className="border-b border-slate-100 p-3">
                <label htmlFor="settings-search" className="sr-only">Search settings</label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                  <input
                    id="settings-search"
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Escape") setSearch(""); }}
                    placeholder="Search settings"
                    autoComplete="off"
                    className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-8 text-[13px] text-slate-800
                               outline-none placeholder:text-slate-400 transition
                               focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      aria-label="Clear search"
                      className={`absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-600 ${FOCUS}`}
                    >
                      <XCircle className="h-4 w-4" aria-hidden="true" />
                    </button>
                  )}
                </div>
                <p className="mt-1.5 text-right text-[11px] text-slate-500" aria-live="polite">
                  {totalVisible} result{totalVisible !== 1 ? "s" : ""}
                </p>
              </div>

              <nav className="p-2" aria-label="Settings sections">
                {totalVisible === 0 && (
                  <EmptyState title="No matching settings" subtitle={`Nothing found for "${search}". Try a different word.`} />
                )}

                {favouriteItems.length > 0 && (
                  <div className="mb-2">
                    <div className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-semibold text-slate-600">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-500" aria-hidden="true" />
                      Favourites
                    </div>
                    <ul className="space-y-0.5">{favouriteItems.map(renderItem)}</ul>
                  </div>
                )}

                {groupedSections.map(({ group, items }) => {
                  const isCollapsed = collapsedGroups.has(group);
                  const panelId = `settings-group-${group.replace(/\s+/g, "-").toLowerCase()}`;
                  return (
                    <div key={group} className="mb-1">
                      <button
                        type="button"
                        onClick={() => toggleGroup(group)}
                        aria-expanded={!isCollapsed}
                        aria-controls={panelId}
                        className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 ${FOCUS}`}
                      >
                        <span>{group}</span>
                        <span className="flex items-center gap-1.5 text-slate-400">
                          <span className="text-[11px] font-normal">{items.length}</span>
                          {isCollapsed
                            ? <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                            : <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />}
                        </span>
                      </button>
                      <AnimatePresence initial={false}>
                        {!isCollapsed && (
                          <motion.div
                            id={panelId}
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.18 }}
                            style={{ overflow: "hidden" }}
                          >
                            <ul className="space-y-0.5 pb-1 pt-0.5">{items.map(renderItem)}</ul>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </nav>

              <p className="hidden xl:block border-t border-slate-100 px-4 py-2.5 text-[11px] text-slate-500">
                Tip: press a letter to jump to a section.
              </p>
            </div>
          </aside>

          {/* ── Content ─────────────────────────────────────────────────────── */}
          <main className="min-w-0">
            <div className="mb-2 flex items-start gap-2">
              <span className=" flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                {ActiveIcon && <ActiveIcon className="h-4.5 w-4.5" aria-hidden="true" />}
              </span>
              <div className="min-w-0">
                <h2 className="text-xl font-semibold tracking-tight text-slate-900">{active?.label}</h2>
              </div>
            </div>
            <section
              aria-labelledby="settings-active-title"
              className="rounded-xl border border-slate-200 bg-white"
            >
              <span id="settings-active-title" className="sr-only">{active?.label}settings</span>
              <div className="p-5 sm:p-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeId}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.14 }}
                  >
                    <Suspense fallback={<ShimmerBlock />}>
                      {ActiveComponent ? (
                        <ActiveComponent />
                      ) : (
                        <EmptyState
                          title={`${active?.label} is on the way`}
                          subtitle="This section hasn't been built yet."
                        />
                      )}
                    </Suspense>
                  </motion.div>
                </AnimatePresence>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;