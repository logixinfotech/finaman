import { useEffect, useState, useCallback, useMemo } from "react";
import Table from "../../../components/Reusable/table/Table";
import ERPFormBuilder from "../../../components/Reusable/form/ERPFormBuilder";
import { useERPMode } from "../../../components/Reusable/form/useFormMode";
import { changeControlTabs, changeControlFieldGroups, changeControlRequiredFieldsList, changeControlTableColumns, changeControlWidthConfig } from "./Utils/Qmsconfigs";
import { confirmDelete, showToast, alertError } from "../../../components/Reusable/alert";
import { getHeaderStyle, TabIcon } from "./Utils/QmsValidation";
import { useApplSettings } from "../../../Hooks/useApplSettings";
import { getChangeControls, createChangeControl, updateChangeControl, deleteChangeControl, getNextRecordNo } from "./Utils/QmsAPI";
import { useGroupOptions } from "../../../Hooks/useUserGroupOption";
 
import UnivarsalFilter from "../../../components/Reusable/Filter/UnivarsalFilter.jsx";
const initialState = {
  Id: null, RecordNo: "", Status: "Open", InitiationDate: new Date().toISOString().slice(0, 10),
  Department: "", Product: "", ChangeType: "", ChangeNature: "", Classification: "", CurrentState: "",
  ProposedChange: "", Justification: "", ImpactAssessment: "", RiskAssessmentRef: "", AffectedDocuments: "",
  TrainingImpact: "", ValidationImpact: "", RegulatoryImpact: "", ImplementationPlan: "", TargetDate: "",
  ActualImplementationDate: "", EffectivenessCheck: "",
};

const configs = { "Change Details": "grid-cols-1 sm:grid-cols-4" };

export default function ChangeControlMasterPage({ tab }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { settingsConfig, settingsDefaults, onSettingsSave } = useApplSettings(tab?.appl_name || "ChangeControl");
  const { options: groupOptions } = useGroupOptions();
  const fieldGroups = changeControlFieldGroups(groupOptions);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getChangeControls();
      setList(Array.isArray(res?.data) ? res.data : []);
    } catch (err) { alertError("Load Error", "Failed to load Change Control records"); }
    finally { setLoading(false); }
  }, []);

  const {
    mode, formData, setFormData, saving, handleView, handleAdd, handleModify, performSave,
    rights, showForm, setShowForm, activeTab, setActiveTab, handleEditCancel, isDirty,
  } = useERPMode(initialState, (data) => data.Id ? updateChangeControl(data.Id, data) : createChangeControl(data), loadData, "ChangeControl");

  useEffect(() => { loadData(); }, [loadData]);

  const handleHeaderTabChange = useCallback((t) => { setActiveTab(t); setShowForm(t !== "search"); }, [setActiveTab, setShowForm]);

  const handleAddNew = async () => {
    handleAdd();
    setShowForm(true);
    setActiveTab("entry");
    const recordNo = await getNextRecordNo("changecontrol");
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
    const confirmed = await confirmDelete({ title: `Delete Change Control "${row.RecordNo || row.Id}"?` });
    if (!confirmed) return;
    await deleteChangeControl(row.Id);
    showToast({ icon: "success", title: "Deleted" });
    setShowForm(false); setActiveTab("search");
    await loadData();
  };

  const handleDeleteMultiple = async (selected) => {
    const ids = (selected || []).map((item) => (typeof item === "object" ? item.Id : item));
    if (ids.length === 0) return;
    const confirmed = await confirmDelete({ title: `Delete ${ids.length} Change Control record(s)?` });
    if (!confirmed) return;
    try {
      const results = await Promise.all(ids.map((id) => deleteChangeControl(id)));
      const failed = results.filter((r) => !r?.success).length;
      showToast({
        icon: failed === 0 ? "success" : "warning",
        title: failed === 0 ? `${ids.length} deleted` : `${ids.length - failed} deleted, ${failed} failed`,
      });
      setShowForm(false); setActiveTab("search");
      await loadData();
    } catch (err) {
      alertError("Delete Error", "Failed to delete some Change Control records");
    }
  };

  const handleFormExit = async () => {
    const wasDirty = isDirty;
    await handleEditCancel();
    if (!wasDirty) { setShowForm(false); setActiveTab("search"); setFormData(initialState); }
  };
const [filters, setFilters] = useState({ Status: "All", Department: "", Classification: "All" });
const [showFilter, setShowFilter] = useState(false);

const applyFilter = useCallback(() => {}, []);
const clearFilter = useCallback(() => {
  setFilters({ Status: "All", Department: "", Classification: "All" });
}, []);

const filteredList = useMemo(() => {
  return listWithSr.filter((item) => {
    if (filters.Status && filters.Status !== "All") {
      if (item.Status !== filters.Status) return false;
    }
    if (filters.Classification && filters.Classification !== "All") {
      if (item.Classification !== filters.Classification) return false;
    }
    if (filters.Department) {
      const val = String(item.Department || "").toLowerCase();
      if (!val.includes(filters.Department.toLowerCase())) return false;
    }
    return true;
  });
}, [listWithSr, filters]);
  return (
    <div className="h-full w-full">
      {showForm ? (
        <ERPFormBuilder
          title="Change Control"
          tabs={changeControlTabs}
          fieldGroups={fieldGroups}
          widthConfig={changeControlWidthConfig}
          requiredFields={changeControlRequiredFieldsList}
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
  onRefresh={() => loadData()}
  title="Change Control" data={filteredList} columns={changeControlTableColumns}
  rowKey="Id" loading={loading}
  onAdd={rights?.add === 1 ? handleAddNew : null}
  onRowDoubleClick={handleRowSelect}
  onToggleFilter={() => setShowFilter((p) => !p)}
  showForm={showFilter}
  formComponent={
    <UnivarsalFilter
      filters={filters}
      visibleFields={["status", "department", "classification"]}
      setFilters={setFilters}
      options={{
        ...groupOptions,
        status: ["Initiated", "Impact Assesment", "QA Approval", "Implementation","Effectivness Review", "Closed", "Rejected"],
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