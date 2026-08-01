import { useEffect, useState, useCallback, useMemo } from "react";
import Table from "../../../components/Reusable/table/Table";
import ERPFormBuilder from "../../../components/Reusable/form/ERPFormBuilder";
import { useERPMode } from "../../../components/Reusable/form/useFormMode";
import { qualificationTabs, qualificationFieldGroups, qualificationRequiredFieldsList, qualificationTableColumns, qualificationWidthConfig } from "./Utils/Qmsconfigs";
import { confirmDelete, showToast, alertError } from "../../../components/Reusable/alert";
import { getHeaderStyle, TabIcon } from "./Utils/QmsValidation";
import { useApplSettings } from "../../../Hooks/useApplSettings";
import { getQualifications, createQualification, updateQualification, deleteQualification, getNextRecordNo } from "./Utils/QmsAPI";
import { useGroupOptions } from "../../../Hooks/useUserGroupOption";
 
import UnivarsalFilter from "../../../components/Reusable/Filter/UnivarsalFilter.jsx";

const initialState = {
  Id: null, RecordNo: "", Status: "In Progress", Equipment: "", Stage: "", ProtocolNo: "", ReportNo: "",
  PlannedDate: "", ExecutedDate: "", AcceptanceCriteria: "", TestsPerformed: "", Observations: "",
  DeviationRef: "", Result: "", PreparedBy: "", ApprovedBy: "", NextRequalDue: "", Remarks: "",
};

const configs = { "Qualification Details": "grid-cols-1 sm:grid-cols-4" };

export default function QualificationMasterPage({ tab }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { settingsConfig, settingsDefaults, onSettingsSave } = useApplSettings(tab?.appl_name || "Qualification");
  const { options: groupOptions } = useGroupOptions();
  const fieldGroups = qualificationFieldGroups(groupOptions);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getQualifications();
      setList(Array.isArray(res?.data) ? res.data : []);
    } catch (err) { alertError("Load Error", "Failed to load qualification records"); }
    finally { setLoading(false); }
  }, []);

  const {
    mode, formData, setFormData, saving, handleView, handleAdd, handleModify, performSave,
    rights, showForm, setShowForm, activeTab, setActiveTab, handleEditCancel, isDirty,
  } = useERPMode(initialState, (data) => data.Id ? updateQualification(data.Id, data) : createQualification(data), loadData, "Qualification");

  useEffect(() => { loadData(); }, [loadData]);

  const handleHeaderTabChange = useCallback((t) => { setActiveTab(t); setShowForm(t !== "search"); }, [setActiveTab, setShowForm]);

  const handleAddNew = async () => {
    handleAdd();
    setShowForm(true);
    setActiveTab("entry");
    const recordNo = await getNextRecordNo("qualification");
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
    const confirmed = await confirmDelete({ title: `Delete Qualification "${row.RecordNo || row.Id}"?` });
    if (!confirmed) return;
    await deleteQualification(row.Id);
    showToast({ icon: "success", title: "Deleted" });
    setShowForm(false); setActiveTab("search");
    await loadData();
  };

  const handleDeleteMultiple = async (selected) => {
    const ids = (selected || []).map((item) => (typeof item === "object" ? item.Id : item));
    if (ids.length === 0) return;
    const confirmed = await confirmDelete({ title: `Delete ${ids.length} qualification record(s)?` });
    if (!confirmed) return;
    try {
      const results = await Promise.all(ids.map((id) => deleteQualification(id)));
      const failed = results.filter((r) => !r?.success).length;
      showToast({
        icon: failed === 0 ? "success" : "warning",
        title: failed === 0 ? `${ids.length} deleted` : `${ids.length - failed} deleted, ${failed} failed`,
      });
      setShowForm(false); setActiveTab("search");
      await loadData();
    } catch (err) {
      alertError("Delete Error", "Failed to delete some qualification records");
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
          title="Qualification Planner"
          tabs={qualificationTabs}
          fieldGroups={fieldGroups}
          widthConfig={qualificationWidthConfig}
          requiredFields={qualificationRequiredFieldsList}
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
          title="Qualification Planner" data={listWithSr} columns={qualificationTableColumns}
          rowKey="Id" loading={loading}
          onAdd={rights?.add === 1 ? handleAddNew : null}
          onRowDoubleClick={handleRowSelect}
          formComponent={
  <UnivarsalFilter
    filters={filters}
    visibleFields={["status"]}
    setFilters={setFilters}
    options={{
      ...groupOptions,
      status: ["Planned", "In Progress", "Executed", "Approved", "Rejected"],
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