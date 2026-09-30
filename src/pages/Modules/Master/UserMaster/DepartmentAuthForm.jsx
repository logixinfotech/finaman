// pages/Modules/Master/UserMaster/DepartmentAuthForm.jsx
//
// Master-detail permission editor for a DEPARTMENT template (keyed by user_group)
// instead of an individual user. Same PERMISSIONS shape, same menu source, same
// save-flow style as UserAuthForm.jsx — this is the "template" layer that
// individual users will inherit from. UserAuthForm.jsx / MASUSR are untouched.

import { useEffect, useState, useMemo, useCallback } from "react";
import { showToast } from "../../../../components/Reusable/alert";
import {
  fetchMenuMasterList,
  fetchDepartmentPermissions,
  saveDepartmentPermissions,
} from "../../../../utils/api";
import * as FaIcons from "react-icons/fa";
import ERPHeader from "../../../../components/Reusable/form/HeaderForm";
import ERPFooter from "../../../../components/Reusable/form/FooterForm";
import WorkflowRolesModal from "./WorkflowRolesModal";
import { resolveWorkflowModuleKey } from "../../../../constant/qmsWorkflowMenuMap";

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

const ENTRY_KEYS = ["Add_right", "Mod_right", "Del_right"];

const menuColors = [
  ["#22c55e", "#4ade80"],
  ["#6366f1", "#818cf8"],
  ["#f97316", "#fb923c"],
  ["#06b6d4", "#22d3ee"],
];

function getMenuColor(name = "") {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const [c1, c2] = menuColors[Math.abs(hash % menuColors.length)];
  return `linear-gradient(135deg, ${c1}, ${c2})`;
}

// Quick presets shown as pill buttons in the detail panel — same idea as the
// existing "bulk apply" confirm modal in UserAuthForm, just per-menu instead
// of per-column, which matches how a template is usually set up.
const TEMPLATES = {
  none: {
    label: "None",
    apply: () => ({
      Add_right: false, Mod_right: false, Del_right: false,
      Prt_right: false, Pdf: false, Excel: false, Word: false,
      Sms: false, Mail: false,
    }),
  },
  view: {
    label: "View only",
    apply: () => ({
      Add_right: false, Mod_right: false, Del_right: false,
      Prt_right: true, Pdf: true, Excel: false, Word: false,
      Sms: false, Mail: false,
    }),
  },
  standard: {
    label: "Standard",
    apply: () => ({
      Add_right: true, Mod_right: true, Del_right: false,
      Prt_right: true, Pdf: true, Excel: false, Word: false,
      Sms: false, Mail: true,
    }),
  },
  full: {
    label: "Full access",
    apply: () => ({
      Add_right: true, Mod_right: true, Del_right: true,
      Prt_right: true, Pdf: true, Excel: true, Word: true,
      Sms: true, Mail: true,
    }),
  },
};

const getIcon = (name, colorClass, size = 12) => {
  const Icon = FaIcons[name];
  return Icon ? <Icon size={size} className={colorClass} /> : null;
};

const DepartmentAuthForm = ({
  selectedDepartment,  // { user_group, member_count }
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
  const [modules,       setModules]       = useState({});
  const [selectedRowId, setSelectedRowId] = useState(null);
  const [search,        setSearch]        = useState("");
  const [loading,       setLoading]       = useState(false);
  const [wfModal,       setWfModal]       = useState(null);
  const [bulkModule,    setBulkModule]    = useState(null);   // module name

  const isViewMode = mode === "view";
  const isEditMode = mode === "edit";

  const closeWfModal = useCallback(() => setWfModal(null), []);

  useEffect(() => {
    if (selectedDepartment?.user_group) loadData();
  }, [selectedDepartment?.user_group]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [menuData, existing] = await Promise.all([
        fetchMenuMasterList(),
        fetchDepartmentPermissions(selectedDepartment.user_group),
      ]);

      const merged = menuData.map((row) => {
        const found = existing.find((e) => {
          const eId   = e.Masmnu_id ?? e.masmnu_id ?? e.masmnuid;
          const rowId = row.masmnuid ?? row.masmnu_id;
          return String(eId) === String(rowId);
        });

        const rowData = {
          ...row,
          row_id:      String(row.masmnuid ?? row.masmnu_id),
          menu_name:   row.bar_name,
          icon_name:   row.icon_name,
          isReport:    row.pad_name?.toLowerCase().includes("report"),
          wfModuleKey: resolveWorkflowModuleKey(row),
        };

        PERMISSIONS.forEach((p) => {
          if (found) {
            const dbKey = Object.keys(found).find(
              (k) => k.toLowerCase() === p.key.toLowerCase()
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
      merged.forEach((m) => {
        const modName = m.mod_name || "General";
        if (!grouped[modName]) grouped[modName] = [];
        grouped[modName].push(m);
      });

      setModules(grouped);
      const firstModule = Object.keys(grouped)[0];
      if (firstModule && grouped[firstModule].length) {
        setSelectedRowId(grouped[firstModule][0].row_id);
      }
    } catch (err) {
      console.error("Load Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const flatRows = useMemo(
    () =>
      Object.entries(modules).flatMap(([modName, rows]) =>
        rows.map((r) => ({ ...r, mod_name: modName }))
      ),
    [modules]
  );

  const filteredByModule = useMemo(() => {
    const q = search.trim().toLowerCase();
    const grouped = {};
    flatRows
      .filter((r) => !q || r.menu_name?.toLowerCase().includes(q))
      .forEach((r) => {
        if (!grouped[r.mod_name]) grouped[r.mod_name] = [];
        grouped[r.mod_name].push(r);
      });
    return grouped;
  }, [flatRows, search]);

  const selectedRow = flatRows.find((r) => r.row_id === selectedRowId) || null;

  const coverage = (row) => {
    const applicable = PERMISSIONS.filter(
      (p) => !(row.isReport && ENTRY_KEYS.includes(p.key))
    );
    const on = applicable.filter((p) => row[p.key]).length;
    return { on, total: applicable.length };
  };

  const updateRow = (row_id, patch) => {
    if (isViewMode) return;
    setModules((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((mod) => {
        next[mod] = next[mod].map((r) =>
          r.row_id === row_id ? { ...r, ...patch } : r
        );
      });
      return next;
    });
  };

  const toggle = (row_id, permission) => {
    const row = flatRows.find((r) => r.row_id === row_id);
    if (!row) return;
    const nextValue = !row[permission.key];
    const patch = { [permission.key]: nextValue };
    if (nextValue && permission.hasDays) {
      patch[permission.dayKey] = Math.max(1, parseInt(row[permission.dayKey]) || 1);
    }
    updateRow(row_id, patch);
  };

  const handleDaysChange = (row_id, dayKey, value) => {
    updateRow(row_id, { [dayKey]: Math.max(1, parseInt(value) || 1) });
  };

  const applyTemplate = (row_id, templateKey) => {
    if (isViewMode) return;
    const row = flatRows.find((r) => r.row_id === row_id);
    if (!row) return;

    const patch = { ...TEMPLATES[templateKey].apply() };
    ENTRY_KEYS.forEach((key) => {
      const dayKey = PERMISSIONS.find((p) => p.key === key)?.dayKey;
      if (patch[key] && dayKey) {
        patch[dayKey] = Math.max(1, parseInt(row[dayKey]) || 1);
      }
    });
    if (row.isReport) {
      ENTRY_KEYS.forEach((key) => { patch[key] = false; });
    }
    updateRow(row_id, patch);
  };

  // Bulk grant/revoke one right across every menu in a module.
  // Report-only menus are skipped for Add/Mod/Del, same rule as everywhere else.
  const applyBulk = (module, permission, value) => {
    if (isViewMode) return;
    setModules((prev) => ({
      ...prev,
      [module]: prev[module].map((row) => {
        if (row.isReport && ENTRY_KEYS.includes(permission.key)) return row;
        const updated = { ...row, [permission.key]: value };
        if (value && permission.hasDays) {
          updated[permission.dayKey] = Math.max(1, parseInt(row[permission.dayKey]) || 1);
        }
        return updated;
      }),
    }));
  };

  const handleFinalSave = () => {
    const flatData = flatRows.map((row) => ({
      masmnu_id: parseInt(row.masmnuid || row.masmnu_id),
      masmod_id: parseInt(row.masmodid || row.masmod_id),
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

    saveDepartmentPermissions({
      user_group: selectedDepartment.user_group,
      permissions: flatData,
    })
      .then((res) => {
        if (res.success) {
          showToast({ icon: "success", title: "Department template saved" });
        }
      })
      .catch((err) => console.error("Save Error:", err));
  };

  return (
    <div className="w-full max-w-7xl mx-auto bg-white rounded-xl shadow-lg border flex flex-col h-[calc(100vh-100px)] overflow-hidden">
      <ERPHeader
        title="Department Permission Template"
        isEditMode={isEditMode}
        isViewMode={isViewMode}
        activeTab={activeTab}
        onTabChange={onTabChange}
        currentIndex={currentRecord}
        totalRecords={totalRecords}
        onPrevRecord={onPrevRecord}
        onNextRecord={onNextRecord}
        rightContent={
          selectedDepartment?.user_group
            ? `${selectedDepartment.user_group}  ·  ${selectedDepartment.member_count || 0} users  (${currentRecord} / ${totalRecords})`
            : `${currentRecord} / ${totalRecords}`
        }
      />

      <div className="flex flex-1 min-h-0 bg-gray-50">
        {/* ── sidebar: searchable menu list with coverage badge ── */}
        <div className="w-72 shrink-0 border-r bg-white flex flex-col">
          <div className="p-3 border-b">
            <div className="relative">
              <FaIcons.FaSearch className="absolute left-2.5 top-2.5 text-gray-300" size={11} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search menus"
                className="w-full pl-7 pr-2 py-1.5 text-[12px] border rounded-lg outline-none focus:border-blue-400"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-2 pb-3">
            {loading ? (
              <div className="text-center py-10 text-gray-400 text-sm">
                <FaIcons.FaSpinner className="animate-spin inline mr-2" />
                Loading…
              </div>
            ) : (
              Object.keys(filteredByModule).map((modName) => (
                <div key={modName} className="mb-1">
                  <div className="flex items-center px-2 pt-3 pb-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide flex-1">
                      {modName}
                    </span>
                    {!isViewMode && (
                      <button
                        type="button"
                        onClick={() => setBulkModule(modName)}
                        title={`Bulk grant / revoke a right for every menu in ${modName}`}
                        className="text-gray-300 hover:text-blue-600 transition-colors"
                      >
                        <FaIcons.FaLayerGroup size={10} />
                      </button>
                    )}
                  </div>
                  {filteredByModule[modName].map((row) => {
                    const { on, total } = coverage(row);
                    const isActive = row.row_id === selectedRowId;
                    const badgeColor =
                      on === 0
                        ? "bg-gray-100 text-gray-400"
                        : on === total
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700";
                    return (
                      <button
                        key={row.row_id}
                        type="button"
                        onClick={() => setSelectedRowId(row.row_id)}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors ${
                          isActive ? "bg-blue-50" : "hover:bg-gray-50"
                        }`}
                      >
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${badgeColor}`}>
                          {on}/{total}
                        </span>
                        <span
                          className={`text-[12px] flex-1 truncate ${
                            isActive ? "text-blue-700 font-semibold" : "text-gray-700"
                          }`}
                        >
                          {row.menu_name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── detail: selected menu's permissions, grouped ── */}
        <div className="flex-1 overflow-y-auto p-5">
          {!selectedRow ? (
            <div className="text-center py-16 text-gray-300 text-sm">
              Select a menu to configure
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-9 h-9 flex items-center justify-center text-white rounded-lg shrink-0"
                  style={{ background: getMenuColor(selectedRow.menu_name) }}
                >
                  {getIcon(selectedRow.icon_name, "text-white", 14) || (
                    <FaIcons.FaFile size={14} className="text-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-semibold text-gray-800">
                    {selectedRow.menu_name}
                  </div>
                  <div className="text-[11px] text-gray-400">{selectedRow.mod_name}</div>
                </div>
                {!isViewMode && (
                  <div className="flex gap-1.5 flex-wrap justify-end">
                    {Object.entries(TEMPLATES).map(([key, t]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => applyTemplate(selectedRow.row_id, key)}
                        className="text-[10.5px] font-semibold px-2.5 py-1 rounded-full border border-gray-200 text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* data actions */}
              <div className="bg-white border rounded-xl p-3.5 mb-3">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">
                  Data actions
                </div>
                {PERMISSIONS.filter((p) => ENTRY_KEYS.includes(p.key)).map((p) => {
                  const disabled = selectedRow.isReport;
                  const isOn = selectedRow[p.key];
                  return (
                    <div key={p.key} className="flex items-center gap-2.5 py-1.5 border-b last:border-0">
                      {getIcon(p.icon, p.color)}
                      <span className="text-[12.5px] text-gray-700 flex-1">{p.label}</span>
                      {disabled ? (
                        <span className="text-gray-200 text-xs">—</span>
                      ) : (
                        <>
                          {p.hasDays && isOn && (
                            <div className="flex items-center gap-1 mr-1">
                              <input
                                type="number"
                                min="1"
                                value={selectedRow[p.dayKey]}
                                onChange={(e) =>
                                  handleDaysChange(selectedRow.row_id, p.dayKey, e.target.value)
                                }
                                disabled={isViewMode}
                                className={`w-9 text-[10.5px] font-semibold border rounded text-center ${
                                  isViewMode ? "bg-gray-100 cursor-not-allowed" : "bg-white"
                                }`}
                              />
                              <span className="text-[10px] text-gray-400">days</span>
                            </div>
                          )}
                          <div
                            onClick={() => toggle(selectedRow.row_id, p)}
                            className={`w-8 h-4 flex items-center rounded-full transition-colors duration-200 ${
                              isViewMode ? "cursor-not-allowed opacity-70" : "cursor-pointer"
                            } ${isOn ? "bg-green-500" : "bg-gray-300"}`}
                          >
                            <div
                              className={`w-3 h-3 bg-white rounded-full shadow transition-transform duration-200 ${
                                isOn ? "translate-x-4" : "translate-x-1"
                              }`}
                            />
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* export / print / notify */}
              <div className="bg-white border rounded-xl p-3.5 mb-3">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">
                  Export, print and notify
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {PERMISSIONS.filter((p) => !ENTRY_KEYS.includes(p.key)).map((p) => {
                    const isOn = selectedRow[p.key];
                    return (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => toggle(selectedRow.row_id, p)}
                        disabled={isViewMode}
                        className={`flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-full border transition-colors ${
                          isOn
                            ? "bg-green-50 border-green-200 text-green-700"
                            : "bg-white border-gray-200 text-gray-400"
                        } ${isViewMode ? "cursor-not-allowed" : "cursor-pointer"}`}
                      >
                        {getIcon(p.icon, isOn ? "text-green-600" : "text-gray-300")}
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* workflow */}
              {selectedRow.wfModuleKey && (
                <div className="flex items-center gap-2.5 bg-indigo-50 border border-indigo-100 rounded-xl px-3.5 py-3">
                  <FaIcons.FaProjectDiagram size={14} className="text-indigo-600" />
                  <div className="flex-1 text-[11.5px] text-indigo-700 font-medium">
                    Workflow routing
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setWfModal({ moduleKey: selectedRow.wfModuleKey, label: selectedRow.menu_name })
                    }
                    className="text-[10.5px] font-semibold px-3 py-1.5 rounded-lg bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-100 transition-colors"
                  >
                    Configure
                  </button>
                </div>
              )}
            </>
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

      {wfModal && (
        <WorkflowRolesModal
          moduleKey={wfModal.moduleKey}
          moduleLabel={wfModal.label}
          onClose={closeWfModal}
        />
      )}

      {/* ── bulk grant / revoke for one module ── */}
      {bulkModule && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white p-5 rounded-xl shadow-2xl w-96 border border-gray-100">
            <p className="text-sm font-semibold text-gray-800">Bulk apply in {bulkModule}</p>
            <p className="text-xs text-gray-500 mb-3">
              Grant or revoke a right for <strong>every menu</strong> in this module.
              Add / Modify / Delete skip report-only menus.
            </p>
            <div className="divide-y">
              {PERMISSIONS.map((p) => (
                <div key={p.key} className="flex items-center gap-2 py-1.5">
                  {getIcon(p.icon, p.color)}
                  <span className="text-[12px] text-gray-700 flex-1">{p.label}</span>
                  <button
                    type="button"
                    onClick={() => applyBulk(bulkModule, p, true)}
                    className="text-[10.5px] font-semibold px-2.5 py-1 rounded-md bg-green-600 hover:bg-green-700 text-white"
                  >
                    Grant all
                  </button>
                  <button
                    type="button"
                    onClick={() => applyBulk(bulkModule, p, false)}
                    className="text-[10.5px] font-semibold px-2.5 py-1 rounded-md bg-red-500 hover:bg-red-600 text-white"
                  >
                    Revoke all
                  </button>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-3">
              <button
                type="button"
                onClick={() => setBulkModule(null)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-4 py-1.5 rounded-lg font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentAuthForm;
