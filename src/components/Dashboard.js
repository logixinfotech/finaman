import  { useEffect, useState } from "react";
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

  const entries = menus.filter((m) => m.pad_type === "1");
  const reports = menus.filter((m) => m.pad_type === "2"); 
  const getIcon = (m) => {
    if (m.icon_name && FaIcons[m.icon_name]) {
      const IconComp = FaIcons[m.icon_name];
      return <IconComp />;
    }
    return <FaRegWindowMaximize />;
  };
 
  const renderModuleDashboard = () => (
    <div className="module-board modern-card"> 
      <section className="dashboard-section entries">
        <div className="section-title">Entries</div>

        {loading && <div className="section-status">Loading…</div>}
        {!loading && !entries.length && (
          <div className="section-status muted">No entries configured.</div>
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
                <div className="dashboard-card-title">{m.bar_name}</div>
              </div>
            </div>
          ))}
        </div>
      </section> 
      <section className="dashboard-section reports">
        <div className="section-title">Reports</div>

        {loading && <div className="section-status">Loading…</div>}
        {!loading && !reports.length && (
          <div className="section-status muted">No reports configured.</div>
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
                <div className="dashboard-card-title">{m.bar_name}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  ); 
  const renderActivePage = () => {
    if (!activeTab) return null;

    if (activeTab.type === "module") {
      return renderModuleDashboard();
    }

    const Component =
      activeTab.appl_name && PageRegistry[activeTab.appl_name]
        ? PageRegistry[activeTab.appl_name]
        : null;

    if (!Component) {
      return (
        <div className="page-wrapper modern-card">
          <h2>{activeTab.label}</h2>
          <p>This screen will be dynamically rendered.</p>
        </div>
      );
    }

    return <Component tab={activeTab} module={activeTab.module}    onOpenPage={onOpenPage} />;
  }; 
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
  {activeTab ? (
    renderActivePage()
  ) : (
    <FinamanDashboard />
  )}
</div>

    </div>
  );
}

export default Dashboard;
