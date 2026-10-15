 import { useEffect, useMemo, useRef, useState } from "react";
import { FaRegWindowMaximize, FaCog, FaCheck } from "react-icons/fa";
import * as FaIcons from "react-icons/fa";
 
import { fetchSidebarMenu } from "../../utils/api";
import { useAuth } from "../../theme/AuthContext";
import SalesDashboard from "../../pages/Modules/Dashboard/SalesDashboard/SalesDashboard";
import FinamanDashboard from "../../pages/FinamanDashboard";
import MyWork from "../../pages/Modules/QMS/Components/MainDashboard";
import CustomizableHomeDashboard from "./CustHomeDashboard";

// Module identity -> its own "home ready" dashboard. Match is by mod_name
// (case-insensitive) since that's the one stable, human string every module
// row already carries (same field Sidebar.jsx renders as the nav label).
// TODO: if two modules can share a name, swap this to masmod_id instead.
const HOME_READY = {
 customizable: { label: "Customizable", render: () => null },
  qms: { label: "QMS", render: (onOpenPage) => <MyWork onOpenPage={onOpenPage} /> },
  sales: { label: "Sales", render: () => <SalesDashboard /> },
  hrms: { label: "HRMS", render: () => <FinamanDashboard /> },
};
const CUSTOM_KEY = "customizable";
const norm = (s = "") => s.trim().toLowerCase();

export default function HomeDashboard({ onOpenPage, onSelectModule }) {
  const { token } = useAuth();
  const [editing, setEditing] = useState(false);
const [status, setStatus] = useState({ dirty: false, saving: false, saveError: "" });
const controlRef = useRef({});

  
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
const [active, setActive] = useState(CUSTOM_KEY);
const isCustom = active === CUSTOM_KEY;
useEffect(() => { if (!isCustom) setEditing(false); }, [isCustom]);



  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await fetchSidebarMenu(token);
        const visible = (data || [])
          .filter((m) => m.show_stat === "Y")
          .sort((a, b) => (a.mod_srl || 0) - (b.mod_srl || 0));
        setModules(visible);
       
      } catch (err) {
        console.error("HomeDashboard modules error:", err);
        setModules([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

 const readyModules = useMemo(
  () => modules.filter((m) => HOME_READY[norm(m.mod_name)] && norm(m.mod_name) !== CUSTOM_KEY),
  [modules]
);
useEffect(() => {
  if (active !== CUSTOM_KEY && !readyModules.some((m) => norm(m.mod_name) === active)) {
    setActive(CUSTOM_KEY);
  }
}, [readyModules, active]);
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
 <div className="flex-shrink-0 flex items-center gap-1 px-4 py-2 border-b border-gray-100 bg-white">
  <button
    onClick={() => setActive(CUSTOM_KEY)}
    className={`flex items-center gap-1.5 text-[12.5px] font-medium px-3 py-1.5 rounded transition-colors ${
      isCustom ? "bg-[#0f5c6e] text-white" : "text-gray-500 hover:bg-gray-100"
    }`}
  >
    <FaIcons.FaThLarge /> {HOME_READY[CUSTOM_KEY].label}
  </button>

  {readyModules.map((m) => {
    const key = norm(m.mod_name);
    return (
      <button
        key={m.masmod_id}
        onClick={() => setActive(key)}
        className={`flex items-center gap-1.5 text-[12.5px] font-medium px-3 py-1.5 rounded transition-colors ${
          active === key ? "bg-[#0f5c6e] text-white" : "text-gray-500 hover:bg-gray-100"
        }`}
      >
        {getIcon(m)} {HOME_READY[key].label}
      </button>
    );
  })}

  {/* right side: sirf Customizable tab par */}
  {isCustom && (
    <div className="ml-auto flex items-center gap-2">
      {editing ? (
        <>
          {status.saveError && <span className="text-[11px] text-red-500">{status.saveError}</span>}
          {!status.saveError && status.dirty && <span className="text-[11px] text-amber-600">Unsaved changes</span>}
          <button
            onClick={() => controlRef.current.reset?.()}
            disabled={status.saving}
            className="text-[12px] font-medium px-3 py-1.5 rounded text-gray-500 hover:bg-gray-100 disabled:opacity-50"
          >
            Reset
          </button>
          <button
            onClick={() => controlRef.current.cancel?.()}
            disabled={status.saving}
            className="text-[12px] font-medium px-3 py-1.5 rounded text-gray-500 hover:bg-gray-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => controlRef.current.save?.()}
            disabled={status.saving || !status.dirty}
            className="flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded bg-[#0f5c6e] text-white disabled:opacity-50"
          >
            <FaCheck size={11} /> {status.saving ? "Saving…" : "Save"}
          </button>
        </>
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded text-gray-500 hover:bg-gray-100"
        >
          <FaCog size={11} /> Customize
        </button>
      )}
    </div>
  )}
</div>

      {/* Active module's own dashboard, full height */}
    <div className="flex-1 min-h-0 overflow-auto">
  {isCustom ? (
    <CustomizableHomeDashboard
      onOpenPage={onOpenPage}
      editing={editing}
      onEditingChange={setEditing}
      onStatus={setStatus}
      controlRef={controlRef}
    />
  ) : active && HOME_READY[active] ? (
    HOME_READY[active].render(onOpenPage)
  ) : (
    <div className="h-full flex items-center justify-center text-sm text-gray-400">
      Select a module above.
    </div>
  )}
</div> 

    
    </div>
    
    
  );
}