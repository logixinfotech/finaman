import { useEffect, useMemo, useState } from "react";
import * as FaIcons from "react-icons/fa";
import { FaRegWindowMaximize } from "react-icons/fa";
import { fetchSidebarMenu } from "../../utils/api";
import { useAuth } from "../../theme/AuthContext";
import SalesDashboard from "../../pages/Modules/Dashboard/SalesDashboard/SalesDashboard";
import FinamanDashboard from "../../pages/FinamanDashboard";
import MyWork from "../../pages/Modules/QMS/Components/MainDashboard";

// Module identity -> its own "home ready" dashboard. Match is by mod_name
// (case-insensitive) since that's the one stable, human string every module
// row already carries (same field Sidebar.jsx renders as the nav label).
// TODO: if two modules can share a name, swap this to masmod_id instead.
const HOME_READY = {
  qms: { label: "QMS", render: (onOpenPage) => <MyWork onOpenPage={onOpenPage} /> },
  sales: { label: "Sales", render: () => <SalesDashboard /> },
  hrms: { label: "HRMS", render: () => <FinamanDashboard /> },
};

const norm = (s = "") => s.trim().toLowerCase();

export default function HomeDashboard({ onOpenPage, onSelectModule }) {
  const { token } = useAuth();
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await fetchSidebarMenu(token);
        const visible = (data || [])
          .filter((m) => m.show_stat === "Y")
          .sort((a, b) => (a.mod_srl || 0) - (b.mod_srl || 0));
        setModules(visible);
        const firstReady = visible.find((m) => HOME_READY[norm(m.mod_name)]);
        setActive(firstReady ? norm(firstReady.mod_name) : null);
      } catch (err) {
        console.error("HomeDashboard modules error:", err);
        setModules([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const readyModules = useMemo(
    () => modules.filter((m) => HOME_READY[norm(m.mod_name)]),
    [modules]
  );
 

  const getIcon = (m) => {
    const Icon = m.icon_name && FaIcons[m.icon_name];
    return Icon ? <Icon /> : <FaRegWindowMaximize />;
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-gray-400">
        Loading your dashboard…
      </div>
    );
  }

  if (!modules.length) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-gray-400">
        No modules are enabled for this company yet.
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Switcher — only modules that actually have a home-ready dashboard */}
      {readyModules.length > 1 && (
        <div className="flex-shrink-0 flex items-center gap-1 px-4 py-2 border-b border-gray-100 bg-white">
          {readyModules.map((m) => {
            const key = norm(m.mod_name);
            const isActive = active === key;
            return (
              <button
                key={m.masmod_id}
                onClick={() => setActive(key)}
                className={`flex items-center gap-1.5 text-[12.5px] font-medium px-3 py-1.5 rounded transition-colors ${
                  isActive ? "bg-[#0f5c6e] text-white" : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                {getIcon(m)}
                {HOME_READY[key].label}
              </button>
            );
          })}
        </div>
      )}

      {/* Active module's own dashboard, full height */}
      <div className="flex-1 min-h-0 overflow-auto">
        {active && HOME_READY[active]
          ? HOME_READY[active].render(onOpenPage)
          : (
            <div className="h-full flex items-center justify-center text-sm text-gray-400">
              Select a module above.
            </div>
          )}
      </div>

    
    </div>
  );
}