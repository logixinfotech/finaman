
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import Table from "../../../components/Reusable/table/Table";
import ERPFormBuilder from "../../../components/Reusable/form/ERPFormBuilder";
import { useERPMode } from "../../../components/Reusable/form/useFormMode";
import {
  incidentTabs,
  incidentFieldGroups,
  incidentRequiredFieldsList,
} from "./Utils/Qmsconfigs";
import {
  confirmDelete,
  showToast,
  alertError,
} from "../../../components/Reusable/alert";
import { setERPHandlers } from "../../../utils/erpShortcuts";
import {
  getIncidents,
  createIncident,
  updateIncident,
  deleteIncident,
} from "./Utils/QmsAPI";
import { widthConfig, getHeaderStyle, TabIcon } from "./Utils/QmsValidation";
import { useApplSettings } from "../../../Hooks/useApplSettings";
import { useGroupOptions } from "../../../Hooks/useUserGroupOption";

const initialState = {
  Id: null,
  RecordNo: "",
  Status: "Open",
  IncidentDate: new Date().toISOString().slice(0, 10),
  Area: "",
  Category: "",
  Severity: "",
  ReportedBy: "",
  WitnessedBy: "",
  EquipmentInvolved: "",
  ProductBatch: "",
  Description: "",
  ImmediateAction: "",
  ImpactAssessment: "",
  RootCause: "",
  InvestigationSummary: "",
  DeviationRaised: "",
  DeviationRef: "",
  CapaRef: "",
  TargetDate: "",
  CreatedBy: "",
  CreatedAt: "",
  UpdatedBy: "",
  UpdatedAt: "",
  ClosedAt: "",
};

const gridConfigs = {
  "Incident Details": "grid-cols-1 sm:grid-cols-4 2xl:grid-cols-4",
  "Reporting Information": "grid-cols-1 sm:grid-cols-4 2xl:grid-cols-4",
  "Incident Description": "grid-cols-1",
  "Immediate Action": "grid-cols-1",
  "Impact & Investigation": "grid-cols-1",
  "Closure & Linked References": "grid-cols-1 sm:grid-cols-4 2xl:grid-cols-4",
};

const tableColumns = [
  { key: "Sr", label: "Sr" },
  { key: "RecordNo", label: "Incident No." },
  {
    key: "IncidentDate",
    label: "Date",
    render: (r) => (r.IncidentDate || "").slice(0, 10),
  },
  { key: "Area", label: "Area / Location" },
  { key: "Severity", label: "Severity" },
  { key: "Status", label: "Status" },
];

export default function IncidentMasterPage({ tab }) {
  const [incidentList, setIncidentList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const { settingsConfig, settingsDefaults, onSettingsSave } = useApplSettings(
    tab?.appl_name || "Incident Management",
  );

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getIncidents();
      const arr = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
          ? res.data
          : [];
      setIncidentList(arr);
    } catch (err) {
      console.error(err);
      alertError("Load Error", "Failed to load incident records");
    } finally {
      setLoading(false);
    }
  }, []);

  const {
    mode,
    formData,
    setFormData,
    saving,
    handleView,
    handleAdd,
    handleModify,
    performSave,
    rights,
    showForm,
    setShowForm,
    activeTab,
    setActiveTab,
    handleEditCancel,
    isDirty,
  } = useERPMode(
    initialState,
    async (data) =>
      data.Id ? await updateIncident(data.Id, data) : await createIncident(data),
    loadData,
    "Incident Management",
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleHeaderTabChange = useCallback(
    (targetTab) => {
      setActiveTab(targetTab);
      setShowForm(targetTab !== "search");
    },
    [setActiveTab, setShowForm],
  );
  const { options: groupOptions } = useGroupOptions();
  const incidentFieldGroup = useMemo(
    () => incidentFieldGroups(groupOptions),
    [groupOptions]   // ✅ sahi
  );

  const handleAddNew = () => {
    handleAdd();
    setShowForm(true);
    setActiveTab("entry");
  };

  useEffect(() => {
    if (showForm && mode === "view" && incidentList.length > 0) {
      setFormData(incidentList[currentIndex]);
    }
  }, [currentIndex, incidentList, showForm, mode, setFormData]);

  const listWithSr = incidentList.map((item, index) => ({
    ...item,
    Sr: index + 1,
    Status: item.Status || "Open",
  }));

  const handleRowSelect = (row) => {
    const index = incidentList.findIndex((item) => item.Id === row.Id);
    if (index !== -1) setCurrentIndex(index);
    handleView(row);
    setShowForm(true);
    setActiveTab("entry");
  };

  const handleSave = async (localData) => {
    const missing = incidentRequiredFieldsList.find(
      (f) => !localData[f] || String(localData[f]).trim() === "",
    );
    if (missing) {
      showToast({ icon: "error", title: "Please fill all required fields" });
      return;
    }
    const dataToSave = { ...localData, Id: localData.Id ?? null };
    const response = await performSave("Id", dataToSave);
    if (response && response.success) {
      showToast({ icon: "success", title: "Saved Successfully" });
      await loadData();
      const savedId = response.data?.Id;
      setIncidentList((prev) => {
        const idx = prev.findIndex((item) => item.Id === savedId);
        if (idx !== -1) setCurrentIndex(idx);
        return prev;
      });
    }
  };

  const handleDelete = async (row) => {
    const confirmed = await confirmDelete({
      title: `Delete Incident "${row.RecordNo || row.Id}"?`,
    });
    if (!confirmed) return;
    try {
      await deleteIncident(row.Id);
      showToast({ icon: "success", title: "Deleted" });
      setShowForm(false);
      setActiveTab("search");
      await loadData();
    } catch (err) {
      alertError("Delete Error", "Failed to delete incident record");
    }
  };

  const handleDeleteMultiple = async (selected) => {
    const ids = (selected || []).map((item) =>
      typeof item === "object" ? item.Id : item,
    );
    if (ids.length === 0) return;
    const confirmed = await confirmDelete({
      title: `Delete ${ids.length} incident record(s)?`,
    });
    if (!confirmed) return;
    try {
      const results = await Promise.all(ids.map((id) => deleteIncident(id)));
      const failed = results.filter((r) => !r?.success).length;
      showToast({
        icon: failed === 0 ? "success" : "warning",
        title:
          failed === 0
            ? `${ids.length} deleted`
            : `${ids.length - failed} deleted, ${failed} failed`,
      });
      setShowForm(false);
      setActiveTab("search");
      await loadData();
    } catch (err) {
      alertError("Delete Error", "Failed to delete some incident records");
    }
  };

  const handleFormExit = async () => {
    const wasDirty = isDirty;
    await handleEditCancel();
    if (!wasDirty) {
      setShowForm(false);
      setActiveTab("search");
      setFormData(initialState);
    }
  };

  // keep latest values/handlers for the keyboard shortcuts (avoids stale closures)
  const latest = useRef({});
  latest.current = {
    formData,
    incidentList,
    handleSave,
    handleAddNew,
    handleFormExit,
  };

  useEffect(() => {
    setERPHandlers({
      onNextRecord: () =>
        setCurrentIndex((p) =>
          Math.min(p + 1, latest.current.incidentList.length - 1),
        ),
      onPrevRecord: () => setCurrentIndex((p) => Math.max(p - 1, 0)),
      onNew: () => latest.current.handleAddNew(),
      onSave: () => latest.current.handleSave(latest.current.formData),
      onEsc: () => latest.current.handleFormExit(),
    });
  }, []);

  return (
    <div className="h-full w-full">
      {showForm ? (
        <ERPFormBuilder
          title="Incident"
          tabs={incidentTabs}
          fieldGroups={incidentFieldGroup}
          widthConfig={widthConfig}
          requiredFields={incidentRequiredFieldsList}
          hideSidebar={true}
          hideTabBar={true}
          showSettingsTab={true}
          getHeaderStyle={getHeaderStyle}
          configs={gridConfigs}
          TabIcon={TabIcon}
          formData={formData}
          setFormData={setFormData}
          mode={mode}
          settingsConfig={settingsConfig}
          settingsDefaults={settingsDefaults}
          onSettingsSave={onSettingsSave}
          saving={saving}
          rights={rights}
          onSave={handleSave}
          onCancel={handleFormExit}
          onDelete={handleDelete}
          onModify={handleModify}
          onNewEntry={handleAddNew}
          onEditCancel={handleFormExit}
          currentRecord={incidentList.length > 0 ? currentIndex + 1 : 0}
          totalRecords={incidentList.length}
          onPrevRecord={() => setCurrentIndex((p) => Math.max(p - 1, 0))}
          onNextRecord={() =>
            setCurrentIndex((p) => Math.min(p + 1, incidentList.length - 1))
          }
          headerActiveTab={activeTab}
          onHeaderTabChange={handleHeaderTabChange}
        />
      ) : (
        <Table
          activeTab={activeTab}
          showSettingsTab={true}
          onTabChange={handleHeaderTabChange}
          onDeleteMultiple={handleDeleteMultiple}
          title="Incident Register"
          data={listWithSr}
          columns={tableColumns}
          rowKey="Id"
          loading={loading}
          onAdd={rights?.add === 1 ? handleAddNew : null}
          onRowDoubleClick={handleRowSelect}
        />
      )}
    </div>
  );
}