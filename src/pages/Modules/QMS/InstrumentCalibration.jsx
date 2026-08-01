import { useEffect, useState, useCallback, useMemo } from "react";
import Table from "../../../components/Reusable/table/Table";
import ERPFormBuilder from "../../../components/Reusable/form/ERPFormBuilder";
import { useERPMode } from "../../../components/Reusable/form/useFormMode";
import { calibrationTabs, calibrationFieldGroups, calibrationRequiredFieldsList, calibrationTableColumns, calibrationWidthConfig } from "./Utils/Qmsconfigs";
import { confirmDelete, showToast, alertError } from "../../../components/Reusable/alert";
import { getHeaderStyle, TabIcon } from "./Utils/QmsValidation";
import { useApplSettings } from "../../../Hooks/useApplSettings";
import { getCalibrations, createCalibration, updateCalibration, deleteCalibration, getNextRecordNo } from "./Utils/QmsAPI";
import { useGroupOptions } from "../../../Hooks/useUserGroupOption";
import UnivarsalFilter from "../../../components/Reusable/Filter/UnivarsalFilter.jsx";
const initialState = {
  Id: null, RecordNo: "", Status: "Calibrated", Instrument: "", InstrumentCode: "", Location: "",
  CalibrationType: "", Agency: "", AcceptanceCriteria: "", FrequencyMonths: "", LastCalibrated: "",
  AsFound: "", AsLeft: "", OutOfCalibrationImpact: "", CalibratedBy: "", ReviewedBy: "",
  CertificateNo: "", Traceability: "", Result: "", Remarks: "",
};

const configs = { "1. Calibration Details": "grid-cols-1 sm:grid-cols-4" };

export default function CalibrationMasterPage({ tab }) {
  
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { settingsConfig, settingsDefaults, onSettingsSave } = useApplSettings(tab?.appl_name || "Calibration");
const { options: groupOptions } = useGroupOptions();
const fieldGroups = calibrationFieldGroups(groupOptions);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getCalibrations();
      setList(Array.isArray(res?.data) ? res.data : []);
    } catch (err) { alertError("Load Error", "Failed to load calibration records"); }
    finally { setLoading(false); }
  }, []);

  const {
    mode, formData, setFormData, saving, handleView, handleAdd, handleModify, performSave,
    rights, showForm, setShowForm, activeTab, setActiveTab, handleEditCancel, isDirty,
  } = useERPMode(initialState, (data) => data.Id ? updateCalibration(data.Id, data) : createCalibration(data), loadData, "Calibration");

  useEffect(() => { loadData(); }, [loadData]);

  const handleHeaderTabChange = useCallback((t) => { setActiveTab(t); setShowForm(t !== "search"); }, [setActiveTab, setShowForm]);

  const handleAddNew = async () => {
    handleAdd();
    setShowForm(true);
    setActiveTab("entry");
    const recordNo = await getNextRecordNo("calibration");
    setFormData((prev) => ({ ...prev, RecordNo: recordNo }));
  };

  useEffect(() => {
    if (showForm && mode === "view" && list.length > 0) setFormData(list[currentIndex]);
  }, [currentIndex, list, showForm, mode, setFormData]);

  const listWithSr = list.map((item, i) => ({ ...item, Sr: i + 1 }));

  const handleRowSelect = (row) => {
    const idx = list.findIndex((i) => i.Id === row.Id);
    if (idx !== -1) setCurrentIndex(idx);
    handleView(row);
    setShowForm(true);
    setActiveTab("entry");
  };

  const handleSave = async (localData) => {
    const dataToSave = { ...localData, Id: localData.Id ?? null };
    if (mode === "add") dataToSave.RecordNo = "";
    const response = await performSave("Id", dataToSave);
    if (response?.success) { showToast({ icon: "success", title: "Saved Successfully" }); await loadData(); }
  };

  const handleDelete = async (row) => {
    const confirmed = await confirmDelete({ title: `Delete Calibration "${row.RecordNo || row.Id}"?` });
    if (!confirmed) return;
    await deleteCalibration(row.Id);
    showToast({ icon: "success", title: "Deleted" });
    setShowForm(false); setActiveTab("search");
    await loadData();
  };

  const handleDeleteMultiple = async (selected) => {
  const ids = (selected || []).map((item) => (typeof item === "object" ? item.Id : item));
  if (ids.length === 0) return;
  const confirmed = await confirmDelete({ title: `Delete ${ids.length} calibration record(s)?` });
  if (!confirmed) return;
  try {
    const results = await Promise.all(ids.map((id) => deleteCalibration(id)));
    const failed = results.filter((r) => !r?.success).length;
    showToast({
      icon: failed === 0 ? "success" : "warning",
      title: failed === 0 ? `${ids.length} deleted` : `${ids.length - failed} deleted, ${failed} failed`,
    });
    setShowForm(false);
    setActiveTab("search");
    await loadData();
  } catch (err) {
    alertError("Delete Error", "Failed to delete some calibration records");
  }
};

  const handleFormExit = async () => {
    const wasDirty = isDirty;
    await handleEditCancel();
    if (!wasDirty) { setShowForm(false); setActiveTab("search"); setFormData(initialState); }
  };
const [filters, setFilters] = useState({ Status: "All" });
const [showFilter, setShowFilter] = useState(false);

const applyFilter = useCallback(() => {}, []);
const clearFilter = useCallback(() => {
  setFilters({ Status: "All" });
}, []);

const filteredList = useMemo(() => {
  return listWithSr.filter((item) => {
    if (filters.Status && filters.Status !== "All") {
      if (item.Status !== filters.Status) return false;
    }
    return true;
  });
}, [listWithSr, filters]);
  return (
    <div className="h-full w-full">
      {showForm ? (
        <ERPFormBuilder
          title="Instrument Calibration"
          tabs={calibrationTabs}
          fieldGroups={fieldGroups} 
          widthConfig={calibrationWidthConfig}
          requiredFields={calibrationRequiredFieldsList}
          hideSidebar hideTabBar showSettingsTab
          getHeaderStyle={getHeaderStyle}
          configs={configs}
          TabIcon={TabIcon}
          formData={formData} setFormData={setFormData} mode={mode}
          settingsConfig={settingsConfig} settingsDefaults={settingsDefaults} onSettingsSave={onSettingsSave}
          saving={saving} rights={rights}
          onSave={handleSave} onCancel={handleFormExit} onDelete={handleDelete}
          onModify={handleModify} onNewEntry={handleAddNew} onEditCancel={handleFormExit}
          currentRecord={list.length > 0 ? currentIndex + 1 : 0} totalRecords={list.length}
          onPrevRecord={() => setCurrentIndex((p) => Math.max(p - 1, 0))}
          onNextRecord={() => setCurrentIndex((p) => Math.min(p + 1, list.length - 1))}
          headerActiveTab={activeTab} onHeaderTabChange={handleHeaderTabChange}
        />
      ) : (
       <Table
  activeTab={activeTab} showSettingsTab onTabChange={handleHeaderTabChange}
  onDeleteMultiple={handleDeleteMultiple}
  title="Instrument Calibration" data={filteredList} columns={calibrationTableColumns}
  rowKey="Id" loading={loading}
  onRefresh={()=>loadData()}
  onAdd={rights?.add === 1 ? handleAddNew : null}
  onRowDoubleClick={handleRowSelect}
  onToggleFilter={() => setShowFilter((p) => !p)}
  showForm={showFilter}
  formComponent={
    <UnivarsalFilter
      filters={filters}
      visibleFields={["status"]}
      setFilters={setFilters}
      options={{
        ...groupOptions,
        status: ["Scheduled", "Out of Service", "Calibrated", "Rejected"],
      }}
      onApply={applyFilter}
      onClear={clearFilter}
    />
  }
/>
      )}
    </div>
  );
}