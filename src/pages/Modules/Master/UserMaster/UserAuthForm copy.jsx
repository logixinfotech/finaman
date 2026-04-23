import { useEffect, useState } from "react";
import {
  fetchMenuMasterList,
  fetchUserPermissions,
  saveUserPermissions
} from "../../utils/api";
import * as FaIcons from "react-icons/fa";

const menuColors = [
  ["#22c55e", "#4ade80"],
  ["#6366f1", "#818cf8"],
  ["#f97316", "#fb923c"],
  ["#06b6d4", "#22d3ee"]
];

function getMenuColor(name = "") {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash % menuColors.length);
  const [c1, c2] = menuColors[index];
  return `linear-gradient(135deg, ${c1}, ${c2})`;
}

const PERMISSIONS = [
  { key: "Add_right", label: "Add", icon: "FaPlus", color: "text-green-600", hasDays: true, dayKey: "Add_days" },
  { key: "Mod_right", label: "Modify", icon: "FaEdit", color: "text-blue-600", hasDays: true, dayKey: "Mod_days" },
  { key: "Del_right", label: "Delete", icon: "FaTrash", color: "text-red-600", hasDays: true, dayKey: "Del_days" },
  { key: "App_right", label: "Approve", icon: "FaCheckCircle", color: "text-emerald-600" },
  { key: "Print", label: "Print", icon: "FaPrint", color: "text-gray-600" },
  { key: "Pdf", label: "PDF", icon: "FaFilePdf", color: "text-red-500" },
  { key: "Excel", label: "Excel", icon: "FaFileExcel", color: "text-green-700" },
  { key: "Word", label: "Word", icon: "FaFileWord", color: "text-blue-500" },
  { key: "Sms", label: "SMS", icon: "FaSms", color: "text-yellow-600" },
  { key: "Mail", label: "Mail", icon: "FaEnvelope", color: "text-purple-600" }
];

const getIcon = (name, color) => {
  const Icon = FaIcons[name];
  return Icon ? <Icon size={12} className={color} /> : null;
};

const UserAuthForm = ({ selectedUser, onCancel }) => {
  const [modules, setModules] = useState({});
  const [expanded, setExpanded] = useState({});
  const [confirmState, setConfirmState] = useState(null);

  useEffect(() => {
    if (selectedUser) loadData();
  }, [selectedUser]);

  const loadData = async () => {
    const menuData = await fetchMenuMasterList();
    const existing = await fetchUserPermissions(selectedUser.userma_id);

    const merged = menuData.map((row, index) => {
      const found = existing.find(
        e => String(e.masmnuid) === String(row.masmnuid)
      );

      return {
        ...row,
        row_id: found?.masusr_id || `NEW_${index}`,
        menu_name: row.bar_name,
        icon_name: row.icon_name,

        ...Object.fromEntries(
          PERMISSIONS.map(p => [
            p.key,
            Boolean(found?.[p.key])
          ])
        ),

        Add_days: found?.add_days || 0,
        Mod_days: found?.mod_days || 0,
        Del_days: found?.del_days || 0
      };
    });

    const grouped = {};
    merged.forEach(m => {
      if (!grouped[m.mod_name]) grouped[m.mod_name] = [];
      grouped[m.mod_name].push(m);
    });

    setModules(grouped);
  };

  const toggle = (module, row_id, permission) => {
    setModules(prev => {
      const updated = { ...prev };

      updated[module] = prev[module].map(row =>
        row.row_id === row_id
          ? { ...row, [permission.key]: !row[permission.key] }
          : row
      );

      return updated;
    });
  };

  const handleHeaderClick = (module, permission) => {
    setConfirmState({ module, permission });
  };

  const applyBulk = (value) => {
    const { module, permission } = confirmState;

    setModules(prev => {
      const updated = { ...prev };

      updated[module] = prev[module].map(row => ({
        ...row,
        [permission.key]: value
      }));

      return updated;
    });

    setConfirmState(null);
  };

  return (
    <div className="p-4 bg-gray-100 min-h-screen">

      {Object.keys(modules).map((module) => (
        <div key={module} className="mb-4 rounded-lg shadow-sm bg-white">

          {/* 🔥 CLEAN CORPORATE HEADER */}
          <div
            className="px-4 py-3 font-semibold cursor-pointer flex items-center justify-between rounded-t-lg transition-all duration-200 hover:shadow-md"
            style={{
              background: "linear-gradient(135deg, #e0f2fe, #bae6fd)",
              color: "#1e3a5f",
              borderLeft: "5px solid #0284c7"
            }}
            onClick={() =>
              setExpanded(p => ({ ...p, [module]: !p[module] }))
            }
          >
            <div className="flex items-center gap-2">
              <FaIcons.FaLayerGroup size={14} />
              {module}
            </div>

            <FaIcons.FaChevronDown
              className={`transition-transform ${expanded[module] ? "rotate-180" : ""}`}
            />
          </div>

          {expanded[module] && (
            <>
              {/* HEADER */}
              <div className="grid grid-cols-11 text-[11px] px-4 py-2 border-b font-semibold bg-gray-50 text-gray-600">
                <div>Menu</div>

                {PERMISSIONS.map(p => (
                  <div
                    key={p.key}
                    className="flex justify-center items-center gap-1 cursor-pointer"
                    onClick={() => handleHeaderClick(module, p)}
                  >
                    {getIcon(p.icon, p.color)}
                    {p.label}
                  </div>
                ))}
              </div>

              {/* ROW */}
              {modules[module].map(row => (
                <div key={row.row_id} className="grid grid-cols-11 items-center px-4 py-2 border-b hover:bg-blue-50 transition">

                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 flex items-center justify-center text-white rounded"
                      style={{ background: getMenuColor(row.menu_name) }}
                    >
                      {getIcon(row.icon_name)}
                    </div>
                    <span className="text-xs font-medium text-gray-700">{row.menu_name}</span>
                  </div>

                  {PERMISSIONS.map(p => (
                    <div key={p.key} className="flex justify-center items-center gap-1">

                      <div
                        onClick={() => toggle(module, row.row_id, p)}
                        className={`w-8 h-4 flex items-center rounded-full cursor-pointer transition ${row[p.key] ? "bg-green-500" : "bg-gray-300"
                          }`}
                      >
                        <div
                          className={`w-3 h-3 bg-white rounded-full transition ${row[p.key] ? "translate-x-4" : "translate-x-1"
                            }`}
                        />
                      </div>

                      {p.hasDays && row[p.key] && (
                        <input
                          type="number"
                          value={row[p.dayKey]}
                          className="w-7 text-[11px] font-semibold border rounded text-center"
                        />
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </>
          )}
        </div>
      ))}

      {/* MODAL */}
      {confirmState && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
          <div className="bg-white p-4 rounded shadow w-72">
            <p className="text-sm mb-3">Apply to all?</p>

            <div className="flex justify-end gap-2">
              <button onClick={() => applyBulk(true)} className="bg-green-500 text-white px-3 py-1 rounded">YES</button>
              <button onClick={() => applyBulk(false)} className="bg-red-500 text-white px-3 py-1 rounded">NO</button>
              <button onClick={() => setConfirmState(null)} className="bg-gray-300 px-3 py-1 rounded">CANCEL</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserAuthForm;