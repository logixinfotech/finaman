// export default Dashboard;
import React, { useEffect, useState, Suspense, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./Dashboard.css";
import TabBar from "./TabBar";
import PageRegistry from "../../pages/PageRegistry";
import * as FaIcons from "react-icons/fa";
import { TabProvider } from "../../theme/TabContext";
import {
  FaRegWindowMaximize,
  FaStar,
  FaRegStar,
 
  FaHistory,
  FaChevronRight,
  FaChevronDown,
  FaChartBar,
  FaInbox,
} from "react-icons/fa";
import RecentActivity from "./RecentActivity";
import { fetchMasmnuData, fetchMasgrpList } from "../../utils/api"; import { useAuth } from "../../theme/AuthContext";
 
import HomeDashboard from "./HomeDashboard"; 
import CustomizableHomeDashboard from "./CustHomeDashboard";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

function Dashboard({
  activeModule,
  tabs,
  activeTab,
  onSelectModule,
  onOpenPage,
  onChangeActiveTab,
  onCloseTab,
  setTabs,
}) {
  const [menus, setMenus] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadedTabs, setLoadedTabs] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [favourites, setFavourites] = useState(() => {
    try {
      const raw = JSON.parse(localStorage.getItem("favMenus") || "[]");
      return Array.isArray(raw) ? raw.map(String) : [];
    } catch {
      return [];
    }
  });
  const [collapsedGroups, setCollapsedGroups] = useState(() => {
    try {
      const raw = JSON.parse(localStorage.getItem("collapsedMenuGroups") || "[]");
      return new Set(Array.isArray(raw) ? raw : []);
    } catch {
      return new Set();
    }
  });
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 768
  );
  const { token } = useAuth();
  const searchInputRef = useRef(null);
  const constraintsRef = useRef(null);
  // har tab ka "band karne se pehle poochna hai kya" function yahan store hota hai
  const closeGuardsRef = useRef({});

  const toggleGroup = useCallback((key) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      localStorage.setItem("collapsedMenuGroups", JSON.stringify([...next]));
      return next;
    });
  }, []);
  const [ctxMenu, setCtxMenu] = useState(null); // { x, y, menu }

useEffect(() => {
  if (!ctxMenu) return;
  const close = () => setCtxMenu(null);
  const onKey = (e) => e.key === "Escape" && close();
  window.addEventListener("click", close);
  window.addEventListener("scroll", close, true);
  window.addEventListener("resize", close);
  window.addEventListener("keydown", onKey);
  return () => {
    window.removeEventListener("click", close);
    window.removeEventListener("scroll", close, true);
    window.removeEventListener("resize", close);
    window.removeEventListener("keydown", onKey);
  };
}, [ctxMenu]);

const openContextMenu = useCallback((e, m) => {
  e.preventDefault();
  e.stopPropagation();
  const MENU_W = 180, MENU_H = 84;
  setCtxMenu({
    x: Math.min(e.clientX, window.innerWidth - MENU_W - 8),
    y: Math.min(e.clientY, window.innerHeight - MENU_H - 8),
    menu: m,
  });
}, []);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);


  useEffect(() => {
    setSearchQuery("");
    const t = setTimeout(() => searchInputRef.current?.focus(), 150);
    return () => clearTimeout(t);
  }, [activeModule?.masmod_id]);
  // ─────────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const loadMenus = async () => {
      if (!activeModule) { setMenus([]); setGroups([]); return; }
      setLoading(true);
      try {

        const [menuData, grpData] = await Promise.all([
          fetchMasmnuData(token),
          fetchMasgrpList({ masmod_id: activeModule.masmod_id }),
        ]);

        const grpList = (Array.isArray(grpData) ? grpData : grpData?.data || [])
          .filter((g) => g.grp_hide !== "Y");
        const visibleIds = new Set(grpList.map((g) => g.grp_id));

        const filtered = (menuData || []).filter(
          (x) =>
            x.masmod_id === activeModule.masmod_id &&
            x.menu_hide !== "Y" &&
            (!x.grp_id || visibleIds.has(x.grp_id))     // 👈 grp_hide filter
        );

        setGroups(grpList);
        setMenus(filtered);
      } catch (err) {
        console.error("Dashboard masmnu error:", err);
        setMenus([]); setGroups([]);
      } finally {
        setLoading(false);
      }
    };
    loadMenus();
  }, [activeModule]);

  useEffect(() => {
    if (!activeTab) return;
    setLoadedTabs((prev) =>
      prev.includes(activeTab.id) ? prev : [...prev, activeTab.id]
    );
  }, [activeTab]);

  const handleCloseTab = useCallback(
    async (tabId) => {
      // us tab ke andar agar unsaved form data hai, to pehle confirm le lo
      const guard = closeGuardsRef.current[tabId];
      if (guard) {
        const ok = await guard();
        if (!ok) return; // user ne "No" bola — tab mat band karo
      }
      const idx = tabs.findIndex((t) => t.id === tabId);
      setLoadedTabs((prev) => prev.filter((id) => id !== tabId));
      delete closeGuardsRef.current[tabId];
      onCloseTab(tabId);
      if (activeTab?.id === tabId && idx > 0) {
        onChangeActiveTab(tabs[idx - 1].id);
      }
    },
    [tabs, activeTab, onCloseTab, onChangeActiveTab]
  );

  const getIcon = (m) => {
    if (m.icon_name && FaIcons[m.icon_name]) {
      const IconComp = FaIcons[m.icon_name];
      return <IconComp />;
    }
    return <FaRegWindowMaximize />;
  };

  function getMenuColor(name) {
    const menuColors = [
      ["#22c55e", "#4ade80"],
      ["#6366f1", "#818cf8"],
      ["#f97316", "#fb923c"],
      ["#06b6d4", "#22d3ee"],
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++)
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    const [c1, c2] = menuColors[Math.abs(hash % menuColors.length)];
    return `linear-gradient(145deg,${c1},${c2})`;
  }

  function getAlphabet(index) {
    let result = "";
    let n = index;
    while (n >= 0) {
      result = String.fromCharCode((n % 26) + 65) + result;
      n = Math.floor(n / 26) - 1;
    }
    return result;
  }
  function alphabetToIndex(str) {
    let n = 0;
    for (let i = 0; i < str.length; i++) {
      n = n * 26 + (str.charCodeAt(i) - 64); // 'A' = 65 -> 1
    }
    return n - 1;
  }
  const toggleFavourite = useCallback((id) => {
    const sid = String(id);
    setFavourites((prev) => {
      const updated = prev.includes(sid)
        ? prev.filter((x) => x !== sid)
        : [...prev, sid];
      localStorage.setItem("favMenus", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const isFav = useCallback(
    (id) => favourites.includes(String(id)),
    [favourites]
  );

  const filteredMenus = useMemo(
    () =>
      menus.filter((m) =>
        m.bar_name.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [menus, searchQuery]
  );

  const entries = useMemo(
    () => filteredMenus.filter((m) => m.pad_type === "1"),
    [filteredMenus]
  );
  const reports = useMemo(
    () => filteredMenus.filter((m) => m.pad_type === "2"),
    [filteredMenus]
  );

  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => isFav(b.masmnu_id) - isFav(a.masmnu_id)),
    [entries, isFav]
  );

  const sortedReports = useMemo(
    () => [...reports].sort((a, b) => isFav(b.masmnu_id) - isFav(a.masmnu_id)),
    [reports, isFav]
  );

  const groupBy = useCallback((arr, padType) => {
    const map = new Map();

    groups
      .filter((g) => g.pad_type === padType)
      .sort((a, b) => (a.srl_no || 0) - (b.srl_no || 0))
      .forEach((g) => map.set(g.grp_name, { icon: g.icon_name, items: [] }));   // 👈

    arr.forEach((m) => {
      const g = groups.find((x) => x.grp_id === m.grp_id);
      const name = g ? g.grp_name : "General";
      if (!map.has(name)) map.set(name, { icon: g?.icon_name || null, items: [] });  // 👈
      map.get(name).items.push(m);
    });

    return Array.from(map, ([group, v]) => ({ group, icon: v.icon, items: v.items }))
      .filter((x) => x.items.length > 0);
  }, [groups]);

  const entryGroups = useMemo(() => groupBy(sortedEntries, "1"), [sortedEntries, groupBy]);
  const reportGroups = useMemo(() => groupBy(sortedReports, "2"), [sortedReports, groupBy]);
  const shortcutMenus = useMemo(
    () => [
      ...entryGroups.flatMap((g) => g.items),
      ...reportGroups.flatMap((g) => g.items),
    ],
    [entryGroups, reportGroups]
  );

  useEffect(() => {
    const isModuleView = activeTab?.type === "module";
    if (!isModuleView) return;

    let buffer = "";
    let bufferTimer = null;

    const handleKeyDown = (e) => {
      const tag = (e.target.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      if (!/^[a-zA-Z]$/.test(e.key)) return;

      buffer += e.key.toUpperCase();
      clearTimeout(bufferTimer);
      bufferTimer = setTimeout(() => { buffer = ""; }, 600);

      const idx = alphabetToIndex(buffer);
      const target = shortcutMenus[idx];
      if (target) {
        e.preventDefault();
       onOpenPage(target, { newTab: false });   // pehle: onOpenPage(target)
        buffer = "";
        clearTimeout(bufferTimer);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      clearTimeout(bufferTimer);
    };
  }, [activeTab, shortcutMenus, onOpenPage]);

  // ── Improved empty state — styled, intentional, not "broken-looking" ────
  const EmptyState = ({ title, subtitle }) => (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="dashboard-empty-state"
    >
      <div className="empty-icon-circle">
        <FaInbox className="empty-icon" />
      </div>
      <p className="empty-title">{title}</p>
      {subtitle && <p className="empty-subtitle">{subtitle}</p>}
    </motion.div>
  );

  const renderCard = (m, index, baseIndex = 0) => (
    <motion.div
      variants={itemVariants}
      whileHover={{ scale: 1.005 }}
      whileTap={{ scale: 0.98 }}
      key={m.masmnu_id}
      className="dashboard-card entry-card"
     onClick={() => onOpenPage(m, { newTab: false })}
onContextMenu={(e) => openContextMenu(e, m)}
      style={{ position: "relative", overflow: "hidden" }}
    >
      <div
        className="menu-serial"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 22,
          height: 22,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "flex-start",
          padding: "2px 0 0 3px",
          border: "none",
          borderRadius: "0 0 100% 0",
          background: "#eef2ff",
          color: "#6366f1",
          fontSize: 9,
          fontWeight: 700,
          lineHeight: 1,
          margin: 0,
          transform: "none",
          boxShadow: "none",
          flex: "none",
          pointerEvents: "none",
          zIndex: 2,
        }}
      >
        {getAlphabet(baseIndex + index)}
      </div>

      <div
        className="dashboard-card-icon colored-icon"
        style={{ background: getMenuColor(m.bar_name) }}
      >
        {getIcon(m)}
      </div>
      <div className="dashboard-card-title">{m.bar_name}</div>

      <button
        type="button"
        aria-label={isFav(m.masmnu_id) ? "Remove from favourites" : "Add to favourites"}
        className={`fav-star ${isFav(m.masmnu_id) ? "is-fav" : ""}`}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          toggleFavourite(m.masmnu_id);
        }}
        style={{
          opacity: 1,
          visibility: "visible",
          color: isFav(m.masmnu_id) ? "#f59e0b" : "#cbd5e1",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: 4,
          fontSize: 13,
          marginLeft: "auto",
        }}
      >
        {isFav(m.masmnu_id) ? <FaStar /> : <FaRegStar />}
      </button>
    </motion.div>
  );

  const renderGroupedSection = (groups, baseOffset, sectionKey) => {
    let running = baseOffset;
    return groups.map(({ group, icon, items }) => {          // 👈 icon
      const start = running;
      running += items.length;
      const key = `${sectionKey}::${group}`;
      const isCollapsed = collapsedGroups.has(key);
      const GrpIcon = icon && FaIcons[icon] ? FaIcons[icon] : null;   // 👈

      return (
        <div key={key} className="menu-group-block">
          <button
            type="button"
            className={`menu-group-title ${isCollapsed ? "is-collapsed" : ""}`}
            onClick={() => toggleGroup(key)}
            aria-expanded={!isCollapsed}
          >
            {GrpIcon && <GrpIcon className="menu-group-icon" />}
            <span className="menu-group-name">{group}</span>
            {/* <span className="menu-group-count">{items.length}</span> */}
            <span className="menu-group-chevron">
              {isCollapsed ? <FaChevronRight /> : <FaChevronDown />}
            </span>
          </button>

          <AnimatePresence mode="wait" initial={false}>
            {!isCollapsed && (
              <motion.div
                key="body"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                style={{ overflow: "hidden" }}
              >
                <div className="menu-group-card">              {/* 👈 naya */}
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="dashboard-card-grid"
                  >
                    {items.map((m, i) => renderCard(m, i, start))}
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    });
  };

  const renderModuleDashboard = () => (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="module-board modern-card h-full flex flex-col"
    >
     

      <div className="dashboard-scroll-body mt-2">
        {loading ? (
          <div className="dashboard-loading">
            <div className="loading-shimmer" />
            <div className="loading-shimmer" />
            <div className="loading-shimmer" />
          </div>
        ) : filteredMenus.length === 0 ? (
          <EmptyState
            title={searchQuery ? "No matching menus" : "Nothing here yet"}
            subtitle={
              searchQuery
                ? `No menus match "${searchQuery}". Try a different keyword.`
                : "This module has no menus assigned to it."
            }
          />
        ) : (
          <div className="dashboard-dual">
            <section className="dashboard-section entries">
              <div className="section-title">
                <FaRegWindowMaximize className="section-icon" />
                <span>Entries</span>
                {/* <span className="section-count">{sortedEntries.length}</span> */}
              </div>
              {sortedEntries.length === 0 ? (
                <EmptyState title="No entries" subtitle="No entry menus in this module." />
              ) : (
                renderGroupedSection(entryGroups, 0, "E")       // 👈 replace
              )}
            </section>

            <section className="dashboard-section reports">
              <div className="section-title">
                <FaChartBar className="section-icon" style={{ color: "#4f46e5" }} />
                <span>Reports</span>
                {/* <span className="section-count">{sortedReports.length}</span> */}
              </div>
              {sortedReports.length === 0 ? (
                <EmptyState title="No reports" subtitle="No report menus in this module." />
              ) : (
                renderGroupedSection(reportGroups, sortedEntries.length, "R")  // 👈 replace
              )}
            </section>
          </div>
        )}
      </div>
    </motion.div>
  );
  // ── Ctrl+F focuses the dashboard menu search ────────────────────────────
  useEffect(() => {
    const handleCtrlF = (e) => {
      // Ctrl+F (Windows/Linux) or Cmd+F (Mac)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
        // only hijack when a module dashboard is actually showing
        if (activeTab?.type !== "module") return;
        if (!searchInputRef.current) return;
        e.preventDefault();          // stop the browser's native Find bar
        searchInputRef.current.focus();
        searchInputRef.current.select(); // select existing text so user can retype
      }
    };

    window.addEventListener("keydown", handleCtrlF);
    return () => window.removeEventListener("keydown", handleCtrlF);
  }, [activeTab]);
  // Single source of truth for the activity panel inner content
  const activityContent = (
    <>
      <div className="activity-panel-header">
        <h3>Recent Activity</h3>
        <button
          className="activity-panel-close"
          onClick={() => setIsActivityOpen(false)}
        >
          ✕
        </button>
      </div>
      <div className="activity-body-wrap">
        <RecentActivity activeTab={activeTab} />
      </div>
    </>
  );

  return (
    <div className="dashboard-shell" ref={constraintsRef}>
    {tabs && tabs.length > 0 && (
  <TabBar
    tabs={tabs}
    activeTab={activeTab}
    onChangeActiveTab={onChangeActiveTab}
    onCloseTab={handleCloseTab}
    onReorderTabs={setTabs}
    // 👇 naye props
    showSearch={activeTab?.type === "module"}
    searchQuery={searchQuery}
    onSearchChange={setSearchQuery}
    searchInputRef={searchInputRef}
  />
)}
      <div
        className="dashboard-content"
        style={{ overflow: "hidden", position: "relative" }}
      >
        <div
          className="main-view-area"
          style={{ flex: 1, minWidth: 0, height: "100%", position: "relative" }}
        >
          <AnimatePresence mode="wait" >
            {!activeTab ? (
              <motion.div
                key="finaman"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ height: "100%" }}
              >
                {/* <CustomizableHomeDashboard  onOpenPage={onOpenPage}/> */}
                <HomeDashboard onOpenPage={onOpenPage} onSelectModule={onSelectModule}/>
                {/* <SalesDashboard /> */}
                {/* <FinamanDashboard/> */}
              </motion.div>
            ) : (
              tabs.map((tab) => {
                if (!loadedTabs.includes(tab.id)) return null;
                const Component =
                  tab.type === "module"
                    ? null
                    : (PageRegistry[tab.appl_name] ||
                      (tab.label && PageRegistry[tab.label.replace(/\s+/g, "")]) ||
                      (tab.label && PageRegistry[tab.label]));
                return (
                  <motion.div
                    key={tab.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{
                      opacity: activeTab?.id === tab.id ? 1 : 0,
                      y: activeTab?.id === tab.id ? 0 : 10,
                    }}
                    style={{
                      display: activeTab?.id === tab.id ? "block" : "none",
                      height: "100%",
                    }}
                  >
                    {tab.type === "module" ? (
                      renderModuleDashboard()
                    ) : (
                      <Suspense fallback={<div className="p-5 animate-pulse">Loading...</div>}>
                        {Component ? (
                          <TabProvider
                            closeTab={() => handleCloseTab(tab.id)}
                            registerCloseGuard={(fn) => { closeGuardsRef.current[tab.id] = fn; }}
                          >
                            <Component tab={tab} module={tab.module} onOpenPage={onOpenPage} />
                          </TabProvider>
                        ) : (
                          <div className="module-dev-placeholder">
                            <FaIcons.FaTools className="dev-icon" />
                            <h2>{tab.label} Under Development</h2>
                          </div>
                        )}
                      </Suspense>
                    )}
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>

          <motion.div
            drag
            dragConstraints={constraintsRef}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9, cursor: "grabbing" }}
            onClick={() => setIsActivityOpen((v) => !v)}
            className="draggable-history-btn"
          >
            {isActivityOpen ? <FaChevronRight size={14} /> : <FaHistory size={16} />}
          </motion.div>
        </div>
        {isMobile ? (
          <AnimatePresence mode="wait">
            {isActivityOpen && (
              <>
                <motion.div
                  className="activity-mobile-backdrop"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsActivityOpen(false)}
                />
                <motion.div
                  className="activity-bottom-sheet"
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                >
                  {activityContent}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        ) : (
          <motion.div
            initial={false}
            animate={{
              width: isActivityOpen ? "300px" : "0px",
              opacity: isActivityOpen ? 1 : 0,
            }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="activity-panel-container"
            style={{ overflow: "hidden" }}
          >
            <div className="activity-panel-inner">
              {activityContent}
            </div>
          </motion.div>
        )}
      </div>
      <AnimatePresence>
  {ctxMenu && (
    <motion.div
      className="menu-context"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.12 }}
      style={{ top: ctxMenu.y, left: ctxMenu.x }}
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      <button type="button" onClick={() => { onOpenPage(ctxMenu.menu, { newTab: false }); setCtxMenu(null); }}>
        Open
      </button>
      <button type="button" onClick={() => { onOpenPage(ctxMenu.menu, { newTab: true }); setCtxMenu(null); }}>
        Open in new tab
      </button>
    </motion.div>
  )}
</AnimatePresence>
    </div>
  );
}

export default Dashboard;