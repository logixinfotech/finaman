import React, { useEffect, useState, Suspense } from "react";
import "./Dashboard.css";
import { fetchMasmnuData } from "../../utils/api";
import TabBar from "./TabBar";
import PageRegistry from "../../pages/PageRegistry";
import * as FaIcons from "react-icons/fa";
import {
  FaRegWindowMaximize,
  FaStar,
  FaRegStar
} from "react-icons/fa";
import FinamanDashboard from "../../pages/FinamanDashboard";

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

  const [favourites, setFavourites] = useState(() => {
    return JSON.parse(localStorage.getItem("favMenus") || "[]");
  });

  /* ===============================
     LOAD MENUS
  ================================ */

  useEffect(() => {

    const loadMenus = async () => {

      if (!activeModule) {
        setMenus([]);
        return;
      }

      setLoading(true);

      try {

        const token = sessionStorage.getItem("token");
        const data = await fetchMasmnuData(token);

        const filtered = (data || []).filter(
          (x) =>
            x.masmod_id === activeModule.masmod_id &&
            x.menu_hide !== "Y"
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

  /* ===============================
     TAB CACHE
  ================================ */

  useEffect(() => {

    if (!activeTab) return;

    setLoadedTabs((prev) => {

      if (prev.includes(activeTab.id)) return prev;

      return [...prev, activeTab.id];

    });

  }, [activeTab]);

  /* ===============================
     ICON SYSTEM
  ================================ */

  const getIcon = (m) => {

    if (m.icon_name && FaIcons[m.icon_name]) {

      const IconComp = FaIcons[m.icon_name];

      return <IconComp />;

    }

    return <FaRegWindowMaximize />;

  };

  /* ===============================
     COLOR GENERATOR
  ================================ */

  const menuColors = [

    ["#22c55e", "#4ade80"],
    ["#6366f1", "#818cf8"],
    ["#f97316", "#fb923c"],
    ["#06b6d4", "#22d3ee"],
    ["#ec4899", "#f472b6"],
    ["#8b5cf6", "#a78bfa"],
    ["#eab308", "#facc15"],
    ["#ef4444", "#f87171"],
    ["#14b8a6", "#2dd4bf"],
    ["#3b82f6", "#60a5fa"]

  ];

  function getMenuColor(name) {

    let hash = 0;

    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    const index = Math.abs(hash % menuColors.length);
    const [c1, c2] = menuColors[index];

    return `linear-gradient(145deg,${c1},${c2})`;

  }

  /* ===============================
     ALPHABET GENERATOR
  ================================ */

  function getAlphabet(index) {

    let result = "";
    let n = index;

    while (n >= 0) {

      result = String.fromCharCode((n % 26) + 65) + result;
      n = Math.floor(n / 26) - 1;

    }

    return result;

  }

  /* ===============================
     TOGGLE FAVOURITE
  ================================ */

  const toggleFavourite = (id) => {

    let updated;

    if (favourites.includes(id)) {

      updated = favourites.filter(x => x !== id);

    } else {

      updated = [...favourites, id];

    }

    setFavourites(updated);

    localStorage.setItem(
      "favMenus",
      JSON.stringify(updated)
    );

  };

  /* ===============================
     FILTER MENUS
  ================================ */

  const entries = menus.filter(
    (m) => m.pad_type === "1"
  );

  const reports = menus.filter(
    (m) => m.pad_type === "2"
  );

  /* ===============================
     SORT FAVOURITES FIRST
  ================================ */

  const sortedEntries = [...entries].sort(
    (a, b) =>
      favourites.includes(b.masmnu_id) -
      favourites.includes(a.masmnu_id)
  );

  const sortedReports = [...reports].sort(
    (a, b) =>
      favourites.includes(b.masmnu_id) -
      favourites.includes(a.masmnu_id)
  );

  /* ===============================
     KEYBOARD SHORTCUT FIXED
  ================================ */

  useEffect(() => {

    const handleKeyPress = (e) => {

      const tag = document.activeElement.tagName;

      /* stop shortcut inside input fields */

      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        document.activeElement.isContentEditable
      ) {
        return;
      }

      /* only module dashboard */

      if (!activeTab || activeTab.type !== "module") {
        return;
      }

      const key = e.key.toUpperCase();

      if (!/^[A-Z]$/.test(key)) return;

      const allMenus = [...sortedEntries, ...sortedReports];

      const index = key.charCodeAt(0) - 65;

      if (index >= 0 && index < allMenus.length) {

        e.preventDefault();

        onOpenPage(allMenus[index]);

      }

    };

    window.addEventListener("keydown", handleKeyPress);

    return () =>
      window.removeEventListener("keydown", handleKeyPress);

  }, [sortedEntries, sortedReports, activeTab]);

  /* ===============================
     MODULE DASHBOARD
  ================================ */

  const renderModuleDashboard = () => (

    <div className="module-board modern-card">

      <section className="dashboard-section entries">

        <div className="section-title">
          <FaRegWindowMaximize className="section-icon" />
          Entries
        </div>

        {loading && <div className="section-status">Loading…</div>}

        {!loading && !entries.length && (
          <div className="section-status muted">
            No entries configured.
          </div>
        )}

        <div className="dashboard-card-grid">

          {sortedEntries.map((m, index) => {

            const fav = favourites.includes(m.masmnu_id);

            return (

              <div
                key={m.masmnu_id}
                className="dashboard-card entry-card"
                onClick={() => onOpenPage(m)}
              >

                <div className="menu-serial">
                  {getAlphabet(index)}
                </div>

                <div
                  className="fav-star"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleFavourite(m.masmnu_id);
                  }}
                >

                  {fav ? <FaStar /> : <FaRegStar />}

                </div>

                <div
                  className="dashboard-card-icon colored-icon"
                  style={{
                    background: getMenuColor(m.bar_name),
                    color: "#fff"
                  }}
                >

                  {getIcon(m)}

                </div>

                <div className="dashboard-card-text">

                  <div className="dashboard-card-title">
                    {m.bar_name}
                  </div>

                </div>

              </div>

            );

          })}

        </div>

      </section>

      <section className="dashboard-section reports">

        <div className="section-title">
          <FaIcons.FaChartBar className="section-icon" />
          Reports
        </div>

        {loading && <div className="section-status">Loading…</div>}

        {!loading && !reports.length && (
          <div className="section-status muted">
            No reports configured.
          </div>
        )}

        <div className="dashboard-card-grid">

          {sortedReports.map((m, index) => {

            const fav = favourites.includes(m.masmnu_id);

            return (

              <div
                key={m.masmnu_id}
                className="dashboard-card report-card"
                onClick={() => onOpenPage(m)}
              >

                <div className="menu-serial">
                  {getAlphabet(sortedEntries.length + index)}
                </div>

                <div
                  className="fav-star"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleFavourite(m.masmnu_id);
                  }}
                >

                  {fav ? <FaStar /> : <FaRegStar />}

                </div>

                <div
                  className="dashboard-card-icon colored-icon"
                  style={{
                    background: getMenuColor(m.bar_name),
                    color: "#fff"
                  }}
                >

                  {getIcon(m)}

                </div>

                <div className="dashboard-card-text">

                  <div className="dashboard-card-title">
                    {m.bar_name}
                  </div>

                </div>

              </div>

            );

          })}

        </div>

      </section>

    </div>

  );

  return (

    <div className="dashboard-shell">

      <TabBar
        tabs={tabs}
        activeTab={activeTab}
        onChangeActiveTab={onChangeActiveTab}
        onCloseTab={onCloseTab}
        onReorderTabs={setTabs}
      />

      <div className="dashboard-content">

        {!activeTab && <FinamanDashboard />}

        {tabs.map((tab) => {

          if (!loadedTabs.includes(tab.id)) return null;

          const Component =
            tab.type === "module"
              ? null
              : PageRegistry[tab.appl_name];

          return (

            <div
              key={tab.id}
              style={{
                display:
                  activeTab?.id === tab.id
                    ? "block"
                    : "none",
                height: "100%"
              }}
            >

              {tab.type === "module"
                ? renderModuleDashboard()
                : Component
                  ? (
                    <Suspense fallback={<div style={{ padding: 20 }}>Loading...</div>}>

                      <Component
                        tab={tab}
                        module={tab.module}
                        onOpenPage={onOpenPage}
                      />

                    </Suspense>
                  )
                  : (
                    <div className="module-dev-placeholder">

                      <FaIcons.FaTools className="dev-icon" />

                      <h2>{tab.label}</h2>

                      <p>This module is currently under development.</p>

                      <span className="dev-subtext">
                        Our team is working to make this feature available soon.
                      </span>

                    </div>
                  )}

            </div>

          );

        })}

      </div>

    </div>

  );

}

export default Dashboard;