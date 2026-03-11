// import { useEffect, useState } from "react";
import React, { useEffect, useState, Suspense } from "react";
import "./Dashboard.css";
import { fetchMasmnuData } from "../utils/api";
import TabBar from "./TabBar";
import PageRegistry from "../pages/PageRegistry";
import * as FaIcons from "react-icons/fa";
import { FaRegWindowMaximize } from "react-icons/fa";
import FinamanDashboard from "../pages/FinamanDashboard";

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

  useEffect(() => {
    if (!activeTab) return;

    setLoadedTabs((prev) => {
      if (prev.includes(activeTab.id)) return prev;
      return [...prev, activeTab.id];
    });
  }, [activeTab]);


  const getIcon = (m) => {
    if (m.icon_name && FaIcons[m.icon_name]) {
      const IconComp = FaIcons[m.icon_name];
      return <IconComp />;
    }
    return <FaRegWindowMaximize />;
  };

  const entries = menus.filter((m) => m.pad_type === "1");
  const reports = menus.filter((m) => m.pad_type === "2");

  const renderModuleDashboard = () => (
    <div className="module-board modern-card">
      <section className="dashboard-section entries">
        <div className="section-title">Entries</div>

        {loading && <div className="section-status">Loading…</div>}
        {!loading && !entries.length && (
          <div className="section-status muted">
            No entries configured.
          </div>
        )}

        <div className="dashboard-card-grid">
          {entries.map((m) => (
            <div
              key={m.masmnu_id}
              className="dashboard-card entry-card"
              onClick={() => onOpenPage(m)}
            >
              <div className="dashboard-card-icon">
                {getIcon(m)}
              </div>
              <div className="dashboard-card-text">
                <div className="dashboard-card-title">
                  {m.bar_name}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="dashboard-section reports">
        <div className="section-title">Reports</div>

        {loading && <div className="section-status">Loading…</div>}
        {!loading && !reports.length && (
          <div className="section-status muted">
            No reports configured.
          </div>
        )}

        <div className="dashboard-card-grid">
          {reports.map((m) => (
            <div
              key={m.masmnu_id}
              className="dashboard-card report-card"
              onClick={() => onOpenPage(m)}
            >
              <div className="dashboard-card-icon">
                {getIcon(m)}
              </div>
              <div className="dashboard-card-text">
                <div className="dashboard-card-title">
                  {m.bar_name}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  ); return (
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
                height: "100%",
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
                    <div className="page-wrapper modern-card">
                      <h2>{tab.label}</h2>
                      <p>This screen will be dynamically rendered.</p>
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