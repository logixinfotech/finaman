import { useEffect, useState,useCallback } from "react";
import {   showToast } from "../../../../components/Reusable/alert";
import {
  fetchMenuMasterList,
  fetchUserPermissions,
  saveUserPermissions,
} from "../../../../utils/api";
import * as FaIcons from "react-icons/fa";
import ERPHeader from "../../../../components/Reusable/form/HeaderForm";
import ERPFooter from "../../../../components/Reusable/form/FooterForm";
import ERPSettings from "../../../../components/Reusable/ERPSettings";
import WorkflowRolesModal from "./WorkflowRolesModal";
import { resolveWorkflowModuleKey } from "../../../../constant/qmsWorkflowMenuMap";

const menuColors = [
  ["#22c55e", "#4ade80"],
  ["#6366f1", "#818cf8"],
  ["#f97316", "#fb923c"],
  ["#06b6d4", "#22d3ee"],
];

const PERMISSIONS = [
  { key: "Add_right", label: "Add",    icon: "FaPlus",      color: "text-green-600",  hasDays: true,  dayKey: "Add_days" },
  { key: "Mod_right", label: "Modify", icon: "FaEdit",      color: "text-blue-600",   hasDays: true,  dayKey: "Mod_days" },
  { key: "Del_right", label: "Delete", icon: "FaTrash",     color: "text-red-600",    hasDays: true,  dayKey: "Del_days" },
  { key: "Prt_right", label: "Print",  icon: "FaPrint",     color: "text-orange-600" },
  { key: "Pdf",       label: "PDF",    icon: "FaFilePdf",   color: "text-red-500"    },
  { key: "Excel",     label: "Excel",  icon: "FaFileExcel", color: "text-green-700"  },
  { key: "Word",      label: "Word",   icon: "FaFileWord",  color: "text-blue-500"   },
  { key: "Sms",       label: "SMS",    icon: "FaSms",       color: "text-yellow-600" },
  { key: "Mail",      label: "Mail",   icon: "FaEnvelope",  color: "text-purple-600" },
];

// 9 permission columns + Workflow column
const gridLayout =
  "grid grid-cols-[1.5fr_repeat(9,1fr)_110px] items-center px-4 py-2 border-b";

const getIcon = (name, colorClass) => {
  const Icon = FaIcons[name];
  return Icon ? <Icon size={12} className={colorClass} /> : null;
};

function getMenuColor(name = "") {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const [c1, c2] = menuColors[Math.abs(hash % menuColors.length)];
  return `linear-gradient(135deg, ${c1}, ${c2})`;
}

const UserAuthForm = ({
  selectedUser,
  mode = "view",
  saving,
  rights,
  currentRecord,
  totalRecords,
  onNextRecord,
  onPrevRecord,
  onFirstRecord,
  onLastRecord, 
  onModify,
  onEditCancel,
  onCancel, 
  activeTab = "entry",
  onTabChange,
}) => {
  const [modules,      setModules]      = useState({});
  const [expanded,     setExpanded]     = useState({});
  const [confirmState, setConfirmState] = useState(null);
  const [loading,      setLoading]      = useState(false);
  const [wfModal,      setWfModal]      = useState(null);   

  const isViewMode = mode === "view";
  const isEditMode = mode === "edit";
  const isSettings = activeTab === "settings";
  const closeWfModal = useCallback(() => setWfModal(null), []);
  useEffect(() => {
    if (selectedUser?.userma_id) loadData();
  }, [selectedUser?.userma_id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [menuData, existing] = await Promise.all([
        fetchMenuMasterList(),
        fetchUserPermissions(selectedUser.userma_id),
      ]);

      const merged = menuData.map((row, index) => {
        const found = existing.find(e => {
          const eId   = e.Masmnu_id ?? e.masmnu_id ?? e.masmnuid;
          const rowId = row.masmnuid ?? row.masmnu_id;
          return String(eId) === String(rowId);
        });

        const rowData = {
          ...row,
          row_id:      found?.masusr_id || `NEW_${index}`,
          menu_name:   row.bar_name,
          icon_name:   row.icon_name,
          isReport:    row.pad_name?.toLowerCase().includes("report"),
          wfModuleKey: resolveWorkflowModuleKey(row),   // QMS workflow module key, or null
        };

        PERMISSIONS.forEach(p => {
          if (found) {
            const dbKey = Object.keys(found).find(
              k => k.toLowerCase() === p.key.toLowerCase()
            );
            const val = found[dbKey];
            rowData[p.key] = val === 1 || val === true || String(val) === "1";
          } else {
            rowData[p.key] = false;
          }
        });

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
      const firstKey = Object.keys(grouped)[0];
      if (firstKey) setExpanded({ [firstKey]: true });

    } catch (err) {
      console.error("Load Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggle = (module, row_id, permission) => {
    if (isViewMode) return;
    setModules(prev => ({
      ...prev,
      [module]: prev[module].map(row => {
        if (row.row_id !== row_id) return row;
        const nextValue  = !row[permission.key];
        const updatedRow = { ...row, [permission.key]: nextValue };
        if (nextValue && permission.hasDays) {
          updatedRow[permission.dayKey] = Math.max(
            1, parseInt(row[permission.dayKey]) || 1
          );
        }
        return updatedRow;
      }),
    }));
  };

  const handleDaysChange = (module, row_id, dayKey, value) => {
    if (isViewMode) return;
    setModules(prev => ({
      ...prev,
      [module]: prev[module].map(row =>
        row.row_id === row_id
          ? { ...row, [dayKey]: Math.max(1, parseInt(value) || 1) }
          : row
      ),
    }));
  };

  const applyBulk = (value) => {
    const { module, permission } = confirmState;
    setModules(prev => ({
      ...prev,
      [module]: prev[module].map(row => {
        const isEntryRight = ["Add_right", "Mod_right", "Del_right"].includes(
          permission.key
        );
        if (row.isReport && isEntryRight) return row;

        const updatedRow = { ...row, [permission.key]: value };
        if (value === true && permission.hasDays) {
          updatedRow[permission.dayKey] = Math.max(
            1, parseInt(row[permission.dayKey]) || 1
          );
        }
        return updatedRow;
      }),
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
      pdf:       row.Pdf       ? 1 : 0,
      excel:     row.Excel     ? 1 : 0,
      word:      row.Word      ? 1 : 0,
      sms:       row.Sms       ? 1 : 0,
      mail:      row.Mail      ? 1 : 0,
      add_days:  parseInt(row.Add_days) || 0,
      mod_days:  parseInt(row.Mod_days) || 0,
      del_days:  parseInt(row.Del_days) || 0,
      it_type:   row.isReport ? "REPORT" : "ENTRY",
    }));

    saveUserPermissions({ userma_id: selectedUser.userma_id, permissions: flatData })
      .then(res => {
        if (res.success) showToast({ icon: "success", title: "Permissions Saved Successfully!" });
      })
      .catch(err => console.error("Save Error:", err));
  };

  return (
    <div className="w-full max-w-7xl mx-auto bg-white rounded-xl shadow-lg border flex flex-col h-[calc(100vh-100px)] overflow-hidden">
 
      <ERPHeader
        title="User Authentication Master"
        isEditMode={isEditMode}
        isViewMode={isViewMode}
        activeTab={activeTab}
        onTabChange={onTabChange}
        currentIndex={currentRecord}
        totalRecords={totalRecords}
        onPrevRecord={onPrevRecord}
        onNextRecord={onNextRecord}
        rightContent={
          isSettings
            ? null
            : selectedUser?.user_name
              ? `${selectedUser.user_name}  (${currentRecord} / ${totalRecords})`
              : `${currentRecord} / ${totalRecords}`
        }
      />

      {isSettings ? (
        <ERPSettings
          applName="User Authentication Master"
          onCancel={() => onTabChange("entry")}
          onSave={(savedSettings) => {
            onTabChange("entry");
          }}
        />
      ) : (
        <>
          <div className="flex flex-col flex-1 bg-gray-50 min-h-0">

            <div className="flex-1 overflow-y-auto space-y-3">
              {loading ? (
                <div className="text-center py-10 text-gray-400 font-medium text-sm">
                  <FaIcons.FaSpinner className="animate-spin inline mr-2" />
                  Fetching User Rights…
                </div>
              ) : (
                Object.keys(modules).map((module) => (
                  <div
                    key={module}
                    className="rounded-lg shadow-sm bg-white border border-gray-200 overflow-hidden"
                  >
                    {/* module header */}
                    <div
                      className="px-4 py-2.5 font-semibold cursor-pointer flex items-center justify-between transition-all duration-200 hover:brightness-95"
                      style={{
                        background: "linear-gradient(135deg, #e0f2fe, #bae6fd)",
                        color:      "#1e3a5f",
                        borderLeft: "4px solid #0284c7",
                      }}
                      onClick={() =>
                        setExpanded(p => ({ ...p, [module]: !p[module] }))
                      }
                    >
                      <div className="flex items-center gap-2 text-[13px]">
                        <FaIcons.FaLayerGroup size={13} />
                        {module}
                        <span className="text-[10px] font-normal text-blue-400 ml-1">
                          ({modules[module].length} menus)
                        </span>
                      </div>
                      <FaIcons.FaChevronDown
                        size={11}
                        className={`transition-transform ${expanded[module] ? "rotate-180" : ""}`}
                      />
                    </div>

                    {expanded[module] && (
                      <div className="overflow-x-auto">
                        <div className="min-w-[1210px]">

                          {/* column headers */}
                          <div className={`${gridLayout} font-semibold bg-gray-50 text-gray-500 text-[11px]`}>
                            <div className="text-left pl-1">Menu Name</div>
                            {PERMISSIONS.map(p => (
                              <div
                                key={p.key}
                                className="flex justify-center items-center gap-1 cursor-pointer select-none hover:text-blue-600 transition-colors"
                                title={`Click to bulk-${p.label} all menus in ${module}`}
                                onClick={() => {
                                  if (!isViewMode)
                                    setConfirmState({ module, permission: p });
                                }}
                              >
                                {getIcon(p.icon, p.color)}
                                <span>{p.label}</span>
                              </div>
                            ))}
                            <div className="flex justify-center items-center gap-1">
                              <FaIcons.FaProjectDiagram size={11} className="text-indigo-600" />
                              <span>Workflow</span>
                            </div>
                          </div>

                          {/* rows */}
                          {modules[module].map(row => (
                            <div
                              key={row.row_id}
                              className={`${gridLayout} hover:bg-blue-50 transition-colors`}
                            >
                              {/* menu name cell */}
                              <div className="flex items-center gap-2 overflow-hidden">
                                <div
                                  className="w-6 h-6 flex items-center justify-center text-white rounded shrink-0"
                                  style={{ background: getMenuColor(row.menu_name) }}
                                >
                                  {getIcon(row.icon_name)}
                                </div>
                                <div className="flex flex-col overflow-hidden">
                                  <span className="text-[12px] font-medium text-gray-700 whitespace-nowrap truncate">
                                    {row.menu_name}
                                  </span>
                                  {row.isReport && (
                                    <span className="text-[8px] text-purple-500 font-bold tracking-wide">
                                      REPORT ONLY
                                    </span>
                                  )}
                                </div>
                              </div>

                              {PERMISSIONS.map(p => {
                                const isEntryRight = ["Add_right", "Mod_right", "Del_right"].includes(p.key);
                                const disabled     = row.isReport && isEntryRight;
                                const isOn         = row[p.key];

                                return (
                                  <div
                                    key={p.key}
                                    className="flex flex-col justify-center items-center gap-1"
                                  >
                                    {disabled ? (
                                      <span className="text-gray-200 text-xs">—</span>
                                    ) : (
                                      <>
                                        <div
                                          onClick={() => toggle(module, row.row_id, p)}
                                          className={`w-8 h-4 flex items-center rounded-full transition-colors duration-200 ${
                                            isViewMode
                                              ? "cursor-not-allowed opacity-70"
                                              : "cursor-pointer"
                                          } ${isOn ? "bg-green-500" : "bg-gray-300"}`}
                                        >
                                          <div
                                            className={`w-3 h-3 bg-white rounded-full shadow transition-transform duration-200 ${
                                              isOn ? "translate-x-4" : "translate-x-1"
                                            }`}
                                          />
                                        </div>
                                        {p.hasDays && isOn && (
                                          <input
                                            type="number"
                                            min="1"
                                            value={row[p.dayKey]}
                                            onChange={e =>
                                              handleDaysChange(
                                                module, row.row_id,
                                                p.dayKey, e.target.value
                                              )
                                            }
                                            disabled={isViewMode}
                                            className={`w-8 text-[10px] font-semibold border rounded text-center ${
                                              isViewMode
                                                ? "bg-gray-100 cursor-not-allowed"
                                                : "bg-white"
                                            }`}
                                          />
                                        )}
                                      </>
                                    )}
                                  </div>
                                );
                              })}
 
                              <div className="flex justify-center">
                                {row.wfModuleKey ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setWfModal({ moduleKey: row.wfModuleKey, label: row.menu_name })
                                    }
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-gray-300 text-[10.5px] font-medium text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
                                    title={`Set stage roles for ${row.menu_name}`}
                                  >
                                    <FaIcons.FaProjectDiagram size={9} />
                                    Set
                                  </button>
                                ) : (
                                  <span className="text-gray-200 text-xs">—</span>
                                )}
                              </div>
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
            isViewMode={isViewMode}
            isEditMode={isEditMode}
            saving={saving}
            handleSubmit={handleFinalSave}
            onModify={onModify}
            onCancel={onCancel}
            onEditCancel={onEditCancel}
            rights={rights}
            currentRecord={currentRecord}
            totalRecords={totalRecords}
            onNextRecord={onNextRecord}
            onPrevRecord={onPrevRecord}
            onFirstRecord={onFirstRecord}
            onLastRecord={onLastRecord}
          />
        </>
      )} 
         {wfModal && (
        <WorkflowRolesModal
          moduleKey={wfModal.moduleKey}
          moduleLabel={wfModal.label}
          onClose={closeWfModal}
        />
      )}    

      {confirmState && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white p-5 rounded-xl shadow-2xl w-80 border border-gray-100">
            <p className="text-sm font-semibold mb-1 text-gray-800">
              Bulk apply "{confirmState.permission.label}"
            </p>
            <p className="text-xs text-gray-500 mb-4">
              Apply to <strong>all menus</strong> in{" "}
              <strong>{confirmState.module}</strong>?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => applyBulk(true)}
                className="bg-green-600 hover:bg-green-700 text-white text-xs px-4 py-1.5 rounded-lg font-semibold"
              >
                Grant All
              </button>
              <button
                onClick={() => applyBulk(false)}
                className="bg-red-500 hover:bg-red-600 text-white text-xs px-4 py-1.5 rounded-lg font-semibold"
              >
                Revoke All
              </button>
              <button
                onClick={() => setConfirmState(null)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-4 py-1.5 rounded-lg font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserAuthForm;
