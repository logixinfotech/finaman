import React, { useEffect, useState, Suspense, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./Dashboard.css";
import { fetchMasmnuData } from "../../utils/api";
import TabBar from "./TabBar";
import PageRegistry from "../../pages/PageRegistry";
import * as FaIcons from "react-icons/fa";
import {
  FaRegWindowMaximize,
  FaStar,
  FaRegStar,
  FaSearch,
  FaTimesCircle,
  FaHistory,
  FaChevronRight,
  FaChartBar,
  FaInbox,
} from "react-icons/fa";
import FinamanDashboard from "../../pages/FinamanDashboard";
import RecentActivity from "./RecentActivity";

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
  onOpenPage,
  onChangeActiveTab,
  onCloseTab,
  setTabs,
}) {
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadedTabs, setLoadedTabs] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [favourites, setFavourites] = useState(() => {
    try {
      // BUG FIX #4: safe parse + normalise all IDs to strings
      const raw = JSON.parse(localStorage.getItem("favMenus") || "[]");
      return Array.isArray(raw) ? raw.map(String) : [];
    } catch {
      return [];
    }
  });

  const searchInputRef = useRef(null);
  const constraintsRef = useRef(null); 
  useEffect(() => {
    setSearchQuery("");
    const t = setTimeout(() => searchInputRef.current?.focus(), 150);
    return () => clearTimeout(t);
  }, [activeModule?.masmod_id]);
  // ─────────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const loadMenus = async () => {
      if (!activeModule) { setMenus([]); return; }
      setLoading(true);
      try {
        const token = sessionStorage.getItem("token");
        const data = await fetchMasmnuData(token);
        const filtered = (data || []).filter(
          (x) => x.masmod_id === activeModule.masmod_id && x.menu_hide !== "Y"
        );
        setMenus(filtered);
      } catch (err) {
        console.error("Dashboard masmnu error:", err);
        setMenus([]);
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

  // BUG FIX #3: clean up loadedTabs when a tab is closed so components are
  // fully unmounted and don't accumulate in memory.
  const handleCloseTab = useCallback(
    (tabId) => {
      setLoadedTabs((prev) => prev.filter((id) => id !== tabId));
      onCloseTab(tabId);
    },
    [onCloseTab]
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

  // BUG FIX #4: normalise IDs to strings so includes() always works correctly
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

  const EmptyState = ({ message }) => (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="dashboard-empty-state"
    >
      <FaInbox className="empty-icon" />
      <p>{message}</p>
    </motion.div>
  );

  const renderCard = (m, index, baseIndex = 0) => (
    <motion.div
      variants={itemVariants}
      whileHover={{ scale: 1.005 }}
      whileTap={{ scale: 0.98 }}
      key={m.masmnu_id}
      className="dashboard-card entry-card"
      onClick={() => onOpenPage(m)}
    >
      <div className="menu-serial">{getAlphabet(baseIndex + index)}</div>
      <div
        className="dashboard-card-icon colored-icon"
        style={{ background: getMenuColor(m.bar_name) }}
      >
        {getIcon(m)}
      </div>
      <div className="dashboard-card-title">{m.bar_name}</div>
      <div
        className={`fav-star ${isFav(m.masmnu_id) ? "is-fav" : ""}`}
        onClick={(e) => {
          e.stopPropagation();
          toggleFavourite(m.masmnu_id);
        }}
      >
        {isFav(m.masmnu_id) ? <FaStar /> : <FaRegStar />}
      </div>
    </motion.div>
  );

  const renderModuleDashboard = () => (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="module-board modern-card h-full flex flex-col"
    >
      <div className="dashboard-topbar">
        <div className="dashboard-search">
          <FaSearch className="search-icon" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search menus..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <AnimatePresence>
            {searchQuery && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <FaTimesCircle
                  className="search-clear cursor-pointer"
                  onClick={() => {
                    setSearchQuery("");
                    searchInputRef.current?.focus();
                  }}
                />
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <div className="result-badge">{filteredMenus.length} Results</div>
      </div>

      <div className="dashboard-scroll-body">
        {loading ? (
          <div className="dashboard-loading">
            <div className="loading-shimmer" />
            <div className="loading-shimmer" />
            <div className="loading-shimmer" />
          </div>
        ) : filteredMenus.length === 0 ? (
          <EmptyState
            message={
              searchQuery
                ? `No menus match "${searchQuery}"`
                : "No menus available for this module."
            }
          />
        ) : (
          <div className="dashboard-dual">
            <section className="dashboard-section entries">
              <div className="section-title">
                <FaRegWindowMaximize className="section-icon" />
                <span>Entries</span>
                <span className="section-count">{sortedEntries.length}</span>
              </div>
              {sortedEntries.length === 0 ? (
                <EmptyState message="No entry menus found." />
              ) : (
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="dashboard-card-grid"
                >
                  {sortedEntries.map((m, i) => renderCard(m, i, 0))}
                </motion.div>
              )}
            </section>

            <section className="dashboard-section reports">
              <div className="section-title">
                <FaChartBar className="section-icon" style={{ color: "#4f46e5" }} />
                <span>Reports</span>
                <span className="section-count">{sortedReports.length}</span>
              </div>
              {sortedReports.length === 0 ? (
                <EmptyState message="No report menus found." />
              ) : (
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="dashboard-card-grid"
                >
                  {sortedReports.map((m, i) =>
                    renderCard(m, i, sortedEntries.length)
                  )}
                </motion.div>
              )}
            </section>
          </div>
        )}
      </div>
    </motion.div>
  );

  return (
    <div className="dashboard-shell" ref={constraintsRef}>
      <TabBar
        tabs={tabs}
        activeTab={activeTab}
        onChangeActiveTab={onChangeActiveTab}
        onCloseTab={handleCloseTab}
        onReorderTabs={setTabs}
      />

      <div
        className="dashboard-content"
        style={{ display: "flex", flexDirection: "row", overflow: "hidden", position: "relative" }}
      >
        <div
          className="main-view-area"
          style={{ flex: 1, minWidth: 0, height: "100%", position: "relative" }}
        >
          <AnimatePresence mode="wait">
            {!activeTab ? (
              <motion.div
                key="finaman"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <FinamanDashboard />
              </motion.div>
            ) : (
              tabs.map((tab) => {
                if (!loadedTabs.includes(tab.id)) return null;
                const Component =
                  tab.type === "module" ? null : PageRegistry[tab.appl_name];
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
                          <Component tab={tab} module={tab.module} onOpenPage={onOpenPage} />
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

        {/* BUG FIX #2: overflow:hidden stops content bleeding out during animation */}
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
          <div style={{ width: "300px" }}>
            <div className="activity-panel-header">
              <h3>Recent Activity</h3>
              <button
                className="activity-panel-close"
                onClick={() => setIsActivityOpen(false)}
              >
                ✕
              </button>
            </div>
            <RecentActivity activeTab={activeTab} />
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default Dashboard;