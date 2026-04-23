import { useEffect, useState } from "react";
import {
  fetchMenuMasterList,
  fetchUserPermissions,
  saveUserPermissions
} from "../../../../utils/api";
import * as FaIcons from "react-icons/fa";
import ERPHeader from "../../../../components/Reusable/form/HeaderForm";
import ERPFooter from "../../../../components/Reusable/form/FooterForm";

const menuColors = [
  ["#22c55e", "#4ade80"],
  ["#6366f1", "#818cf8"],
  ["#f97316", "#fb923c"],
  ["#06b6d4", "#22d3ee"]
];

const getIcon = (name, color) => {
  const Icon = FaIcons[name];
  return Icon ? <Icon size={12} className={color} /> : null;
};

const gridLayout = "grid grid-cols-[1.5fr_repeat(9,1fr)] items-center px-4 py-2 border-b";

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
  { key: "Prt_right", label: "Print", icon: "FaPrint", color: "text-orange-600" },
  { key: "Pdf", label: "PDF", icon: "FaFilePdf", color: "text-red-500" },
  { key: "Excel", label: "Excel", icon: "FaFileExcel", color: "text-green-700" },
  { key: "Word", label: "Word", icon: "FaFileWord", color: "text-blue-500" },
  { key: "Sms", label: "Sms", icon: "FaSms", color: "text-yellow-600" },
  { key: "Mail", label: "Mail", icon: "FaEnvelope", color: "text-purple-600" }
];

const UserAuthForm = ({ selectedUser, onCancel, mode = "edit", saving }) => {
  const [modules, setModules] = useState({});
  const [expanded, setExpanded] = useState({});
  const [confirmState, setConfirmState] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedUser?.userma_id) loadData();
  }, [selectedUser?.userma_id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const menuData = await fetchMenuMasterList();
      const existing = await fetchUserPermissions(selectedUser.userma_id);

      const merged = menuData.map((row, index) => {
        const found = existing.find(e => {
          const eId = e.Masmnu_id ?? e.masmnu_id ?? e.masmnuid;
          const rowId = row.masmnuid ?? row.masmnu_id;
          return String(eId) === String(rowId);
        });

        const rowData = {
          ...row,
          row_id: found?.masusr_id || `NEW_${index}`,
          menu_name: row.bar_name,
          icon_name: row.icon_name,
          isReport: row.pad_name?.toLowerCase().includes("report")
        };

        // Initialize Permissions
        PERMISSIONS.forEach(p => {
          if (found) {
            // Find key in a case-insensitive way
            const dbKey = Object.keys(found).find(k => k.toLowerCase() === p.key.toLowerCase());
            const val = found[dbKey];
            // Normalize value: check for 1, true, or string "1"
            rowData[p.key] = val === 1 || val === true || String(val) === "1";
          } else {
            rowData[p.key] = false;
          }
        });

        // Initialize Days
        rowData.Add_days = found?.Add_days ?? found?.add_days ?? 1;
        rowData.Mod_days = found?.Mod_days ?? found?.mod_days ?? 1;
        rowData.Del_days = found?.Del_days ?? found?.del_days ?? 1;

        return rowData;
      });

      const grouped = {};
      merged.forEach(m => {
        const modName = m.mod_name || "General";
        if (!grouped[modName]) grouped[modName] = [];
        grouped[modName].push(m);
      });

      setModules(grouped);
    } catch (err) {
      console.error("Load Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggle = (module, row_id, permission) => {
    setModules(prev => ({
      ...prev,
      [module]: prev[module].map(row => {
        if (row.row_id === row_id) {
          const nextValue = !row[permission.key];
          const updatedRow = { ...row, [permission.key]: nextValue };
          if (nextValue && permission.hasDays) {
            const dayKey = permission.dayKey;
            updatedRow[dayKey] = Math.max(1, parseInt(row[dayKey]) || 1);
          }

          return updatedRow;
        }
        return row;
      })
    }));
  };

  const handleDaysChange = (module, row_id, dayKey, value) => {
    setModules(prev => ({
      ...prev,
      [module]: prev[module].map(row =>
        row.row_id === row_id ? { ...row, [dayKey]: Math.max(1, parseInt(value) || 1) } : row
      )
    }));
  };

  const applyBulk = (value) => {
    const { module, permission } = confirmState;

    setModules(prev => ({
      ...prev,
      [module]: prev[module].map(row => {
        const isEntryRight = ["Add_right", "Mod_right", "Del_right"].includes(permission.key);

        // Skip restricted rows (Reports don't get entry rights)
        if (row.isReport && isEntryRight) return row;

        // Create the updated row with the new toggle value
        const updatedRow = { ...row, [permission.key]: value };

        // Logic for Days: If turning ON (true) and permission supports days
        if (value === true && permission.hasDays) {
          const dayKey = permission.dayKey;
          // Ensure day value is at least 1
          updatedRow[dayKey] = Math.max(1, parseInt(row[dayKey]) || 1);
        }

        return updatedRow;
      })
    }));

    setConfirmState(null);
  };
  const handleFinalSave = () => {
    const flatData = Object.values(modules).flat().map(row => ({
      masmnu_id: parseInt(row.masmnuid || row.masmnu_id),
      masmod_id: parseInt(row.masmodid || row.masmod_id),
      masusr_id: selectedUser.userma_id,
      add_right: row.Add_right ? 1 : 0,
      mod_right: row.Mod_right ? 1 : 0,
      del_right: row.Del_right ? 1 : 0,
      prt_right: row.Prt_right ? 1 : 0,
      pdf: row.Pdf ? 1 : 0,
      excel: row.Excel ? 1 : 0,
      word: row.Word ? 1 : 0,
      sms: row.Sms ? 1 : 0,
      mail: row.Mail ? 1 : 0,
      add_days: parseInt(row.Add_days) || 0,
      mod_days: parseInt(row.Mod_days) || 0,
      del_days: parseInt(row.Del_days) || 0,
      it_type: row.isReport ? "REPORT" : "ENTRY"
    }));

    saveUserPermissions({ userma_id: selectedUser.userma_id, permissions: flatData })
      .then(res => res.success && alert("Permissions Saved Successfully!"))
      .catch(err => console.error("Save Error:", err));
  };

  return (
    <div className="w-full max-w-7xl mx-auto bg-white rounded-xl shadow-lg border flex flex-col h-[calc(100vh-120px)] overflow-hidden">
      <ERPHeader
        title="User Authentication Master"
        isEditMode={mode === "edit"}
        rightContent={selectedUser?.user_name || "Select User"}
      />

      <div className="flex flex-col flex-1 bg-gray-50 min-h-0">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="text-center py-10 text-gray-500 font-medium">Fetching User Rights...</div>
          ) : (
            Object.keys(modules).map((module) => (
              <div key={module} className="mb-4 rounded-lg shadow-sm bg-white border border-gray-200 overflow-hidden">
                <div
                  className="px-4 py-3 font-semibold cursor-pointer flex items-center justify-between transition-all duration-200 hover:bg-gray-50"
                  style={{ background: "linear-gradient(135deg, #e0f2fe, #bae6fd)", color: "#1e3a5f", borderLeft: "5px solid #0284c7" }}
                  onClick={() => setExpanded(p => ({ ...p, [module]: !p[module] }))}
                >
                  <div className="flex items-center gap-2">
                    <FaIcons.FaLayerGroup size={14} /> {module}
                  </div>
                  <FaIcons.FaChevronDown className={`transition-transform ${expanded[module] ? "rotate-180" : ""}`} />
                </div>

                {expanded[module] && (
                  <div className="overflow-x-auto">
                    <div className="min-w-[1100px]">
                      <div className={`${gridLayout} font-semibold bg-gray-50 text-gray-600 text-[11px]`}>
                        <div className="text-left">Menu Name</div>
                        {PERMISSIONS.map(p => (
                          <div key={p.key} className="flex justify-center items-center gap-1 cursor-pointer hover:text-blue-600" onClick={() => setConfirmState({ module, permission: p })}>
                            {getIcon(p.icon, p.color)} {p.label}
                          </div>
                        ))}
                      </div>
                      {modules[module].map(row => (
                        <div key={row.row_id} className={`${gridLayout} hover:bg-blue-50 transition`}>
                          <div className="flex items-center gap-2 overflow-hidden">
                            <div className="w-6 h-6 flex items-center justify-center text-white rounded shrink-0" style={{ background: getMenuColor(row.menu_name) }}>
                              {getIcon(row.icon_name)}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs font-medium text-gray-700 whitespace-nowrap">{row.menu_name}</span>
                              {row.isReport && <span className="text-[8px] text-purple-600 font-bold">REPORT ONLY</span>}
                            </div>
                          </div>

                          {PERMISSIONS.map(p => {
                            const isEntryRight = ["Add_right", "Mod_right", "Del_right"].includes(p.key);
                            const disabled = row.isReport && isEntryRight;
                            return (
                              <div key={p.key} className="flex flex-col justify-center items-center gap-1">
                                {!disabled ? (
                                  <>
                                    <div
                                      onClick={() => toggle(module, row.row_id, p)}
                                      className={`w-8 h-4 flex items-center rounded-full cursor-pointer transition ${row[p.key] ? "bg-green-500" : "bg-gray-300"}`}
                                    >
                                      <div className={`w-3 h-3 bg-white rounded-full transition ${row[p.key] ? "translate-x-4" : "translate-x-1"}`} />
                                    </div>
                                    {p.hasDays && row[p.key] && (
                                      <input
                                        type="number"
                                        min="1"
                                        value={row[p.dayKey]}
                                        onChange={(e) => handleDaysChange(module, row.row_id, p.dayKey, e.target.value)}
                                        className="w-8 text-[10px] font-semibold border rounded text-center bg-white"
                                      />
                                    )}
                                  </>
                                ) : <span className="text-gray-200">—</span>}
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <ERPFooter
        isEditMode={mode === "edit"}
        saving={saving}
        handleSubmit={handleFinalSave}
        onCancel={onCancel}
      />

      {confirmState && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg shadow-xl w-72 border">
            <p className="text-sm font-bold mb-3">Apply {confirmState.permission.label} to all menus in {confirmState.module}?</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => applyBulk(true)} className="bg-green-600 text-white text-xs px-3 py-1 rounded">YES</button>
              <button onClick={() => applyBulk(false)} className="bg-red-500 text-white text-xs px-3 py-1 rounded">NO</button>
              <button onClick={() => setConfirmState(null)} className="bg-gray-200 text-xs px-3 py-1 rounded">CANCEL</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserAuthForm;