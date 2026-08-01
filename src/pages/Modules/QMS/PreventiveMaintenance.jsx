import { useEffect, useState, useCallback } from "react";
import Table from "../../../components/Reusable/table/Table";
import ERPFormBuilder from "../../../components/Reusable/form/ERPFormBuilder";
import { useERPMode } from "../../../components/Reusable/form/useFormMode";
import { pmTabs, pmFieldGroups, pmRequiredFieldsList, pmTableColumns, pmWidthConfig } from "./Utils/Qmsconfigs";
import { confirmDelete, showToast, alertError } from "../../../components/Reusable/alert";
import { getHeaderStyle, TabIcon } from "./Utils/QmsValidation";
import { useApplSettings } from "../../../Hooks/useApplSettings";
import { getPmRecords, createPmRecord, updatePmRecord, deletePmRecord, getNextRecordNo } from "./Utils/QmsAPI";
import { useGroupOptions } from "../../../Hooks/useUserGroupOption";
import { useMemo } from "react"; // pehli line ko update karo:
 
import UnivarsalFilter from "../../../components/Reusable/Filter/UnivarsalFilter.jsx";

const initialState = {
  Id: null, RecordNo: "", Status: "Active", EquipmentName: "", EquipmentId: "", Location: "", PmType: "",
  MaintenanceType: "", FrequencyMonths: "", LastPM: "", NextDue: "", Downtime: "", Checklist: "",
  SparesUsed: "", LastResult: "", RequalificationTriggered: "", PerformedBy: "", VerifiedBy: "", Remarks: "",
};

const configs = { "PM Details": "grid-cols-1 sm:grid-cols-4" };

export default function PreventiveMaintenanceMasterPage({ tab }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { settingsConfig, settingsDefaults, onSettingsSave } = useApplSettings(tab?.appl_name || "PreventiveMaintenance");
  const { options: groupOptions } = useGroupOptions();
  const fieldGroups = pmFieldGroups(groupOptions);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getPmRecords();
      setList(Array.isArray(res?.data) ? res.data : []);
    } catch (err) { alertError("Load Error", "Failed to load PM records"); }
    finally { setLoading(false); }
  }, []);

  const {
    mode, formData, setFormData, saving, handleView, handleAdd, handleModify, performSave,
    rights, showForm, setShowForm, activeTab, setActiveTab, handleEditCancel, isDirty,
  } = useERPMode(initialState, (data) => data.Id ? updatePmRecord(data.Id, data) : createPmRecord(data), loadData, "PreventiveMaintenance");

  useEffect(() => { loadData(); }, [loadData]);

  const handleHeaderTabChange = useCallback((t) => { setActiveTab(t); setShowForm(t !== "search"); }, [setActiveTab, setShowForm]);

  const handleAddNew = async () => {
    handleAdd();
    setShowForm(true);
    setActiveTab("entry");
    const recordNo = await getNextRecordNo("pm");
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
    const confirmed = await confirmDelete({ title: `Delete PM Record "${row.RecordNo || row.Id}"?` });
    if (!confirmed) return;
    await deletePmRecord(row.Id);
    showToast({ icon: "success", title: "Deleted" });
    setShowForm(false); setActiveTab("search");
    await loadData();
  };

  const handleDeleteMultiple = async (selected) => {
    const ids = (selected || []).map((item) => (typeof item === "object" ? item.Id : item));
    if (ids.length === 0) return;
    const confirmed = await confirmDelete({ title: `Delete ${ids.length} PM record(s)?` });
    if (!confirmed) return;
    try {
      const results = await Promise.all(ids.map((id) => deletePmRecord(id)));
      const failed = results.filter((r) => !r?.success).length;
      showToast({
        icon: failed === 0 ? "success" : "warning",
        title: failed === 0 ? `${ids.length} deleted` : `${ids.length - failed} deleted, ${failed} failed`,
      });
      setShowForm(false); setActiveTab("search");
      await loadData();
    } catch (err) {
      alertError("Delete Error", "Failed to delete some PM records");
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
          title="Preventive Maintenance"
          tabs={pmTabs}
          fieldGroups={fieldGroups}
          widthConfig={pmWidthConfig}
          requiredFields={pmRequiredFieldsList}
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
  title="Preventive Maintenance" data={filteredList} columns={pmTableColumns}
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
        status: ["Active","Retired", "Rejected"],
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