import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import Table from "../../../components/Reusable/table/Table";
import ERPFormBuilder from "../../../components/Reusable/form/ERPFormBuilder";
import { useERPMode } from "../../../components/Reusable/form/useFormMode";
import {
  environmentalMonitoringTabs,
  environmentalMonitoringFieldGroups,
  environmentalMonitoringRequiredFieldsList,
  environmentalMonitoringGridConfigs,
  environmentalMonitoringTableColumns,
} from "./Utils/Qmsconfigs";
import {
  confirmDelete,
  showToast,
  alertError,
} from "../../../components/Reusable/alert";
import { setERPHandlers } from "../../../utils/erpShortcuts";
import {
  getEnvironmentalMonitorings,
  createEnvironmentalMonitoring,
  updateEnvironmentalMonitoring,
  deleteEnvironmentalMonitoring,
} from "./Utils/QmsAPI";
import { widthConfig, getHeaderStyle, TabIcon } from "./Utils/QmsValidation";
import { useApplSettings } from "../../../Hooks/useApplSettings";
import { useGroupOptions } from "../../../Hooks/useUserGroupOption";

const initialState = {
  id: null,
  RecordNo: "",
  MonitoringDate: new Date().toISOString().slice(0, 10),
  Area: "",
  SamplingLocation: "",
  AreaGrade: "",
  MonitoringType: "",
  Result: "",
  Unit: "",
  AlertLimit: "",
  ActionLimit: "",
  MethodReference: "",
  PerformedBy: "",
  ReviewedBy: "",
  ActionTaken: "",
  LinkedCapaRef: "",
  status: "Open",
  // e-sign audit fields
  created_by: "",
  created_at: "",
  updated_by: "",
  updated_at: "",
};

export default function EnvironmentalMonitoringMasterPage({ tab }) {
  const [emList, setEmList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const { settingsConfig, settingsDefaults, onSettingsSave } = useApplSettings(
    tab?.appl_name || "Environmental Monitoring",
  );

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getEnvironmentalMonitorings();
      const arr = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
          ? res.data
          : [];
      setEmList(arr);
    } catch (err) {
      console.error(err);
      alertError("Load Error", "Failed to load environmental monitoring records");
    } finally {
      setLoading(false);
    }
  }, []);

  const {
    mode,
    formData,
    setFormData,
    saving,
    canPrint,
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
    async (data) => {
      // e-sign stamp: attributable + contemporaneous (ALCOA+)
      const now = new Date().toISOString();
      const currentUser = "H"; // TODO: replace with logged-in user context
      const stamped = data.id
        ? { ...data, updated_by: currentUser, updated_at: now }
        : { ...data, created_by: currentUser, created_at: now };
      return data.id
        ? await updateEnvironmentalMonitoring(data.id, stamped)
        : await createEnvironmentalMonitoring(stamped);
    },
    loadData,
    "Environmental Monitoring",
  );

  const { options: groupOptions } = useGroupOptions();
  const emFieldGroups = useMemo(
    () => environmentalMonitoringFieldGroups(groupOptions || {}),
    [groupOptions],
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

  const handleAddNew = () => {
    handleAdd();
    setShowForm(true);
    setActiveTab("entry");
  };

  useEffect(() => {
    if (showForm && mode === "view" && emList.length > 0) {
      setFormData(emList[currentIndex]);
    }
  }, [currentIndex, emList, showForm, mode, setFormData]);

  const listWithSr = emList.map((item, index) => ({
    ...item,
    Sr: index + 1,
    Status: item.Status || item.status || "Open",
  }));

  const handleRowSelect = (row) => {
    const index = emList.findIndex((item) => item.id === row.id);
    if (index !== -1) setCurrentIndex(index);
    handleView(row);
    setShowForm(true);
    setActiveTab("entry");
  };

  const handleSave = async (localData) => {
    const missing = environmentalMonitoringRequiredFieldsList.find(
      (f) => !localData[f] || String(localData[f]).trim() === "",
    );
    if (missing) {
      showToast({ icon: "error", title: "Please fill all required fields" });
      return;
    }
    const dataToSave = { ...localData, id: localData.id ?? null };
    const response = await performSave("id", dataToSave);
    if (response && response.success) {
      showToast({ icon: "success", title: "Saved & e-Signed Successfully" });
      await loadData();
      const savedId = response.data?.id;
      setEmList((prev) => {
        const idx = prev.findIndex((item) => item.id === savedId);
        if (idx !== -1) setCurrentIndex(idx);
        return prev;
      });
    }
  };

  const handleDelete = async (row) => {
    const confirmed = await confirmDelete({
      title: `Delete Environmental Monitoring "${row.RecordNo || row.id}"?`,
    });
    if (!confirmed) return;
    try {
      await deleteEnvironmentalMonitoring(row.id);
      showToast({ icon: "success", title: "Deleted" });
      setShowForm(false);
      setActiveTab("search");
      await loadData();
    } catch (err) {
      alertError("Delete Error", "Failed to delete environmental monitoring record");
    }
  };

  const handleDeleteMultiple = async (selected) => {
    const ids = (selected || []).map((item) =>
      typeof item === "object" ? item.id : item,
    );
    if (ids.length === 0) return;
    const confirmed = await confirmDelete({
      title: `Delete ${ids.length} environmental monitoring record(s)?`,
    });
    if (!confirmed) return;
    try {
      const results = await Promise.all(
        ids.map((id) => deleteEnvironmentalMonitoring(id)),
      );
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
      alertError("Delete Error", "Failed to delete some environmental monitoring records");
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
    emList,
    handleSave,
    handleAddNew,
    handleFormExit,
  };

  useEffect(() => {
    setERPHandlers({
      onNextRecord: () =>
        setCurrentIndex((p) => Math.min(p + 1, latest.current.emList.length - 1)),
      onPrevRecord: () => setCurrentIndex((p) => Math.max(p - 1, 0)),
      onNew: () => latest.current.handleAddNew(),
      onSave: () => latest.current.handleSave(latest.current.formData),
      onEsc: () => latest.current.handleFormExit(),
    });
  }, []);

  return (
    <div className="h-full w-full">
      {showForm ? (
        <>
          <ERPFormBuilder
            title="Environmental Monitoring"
            tabs={environmentalMonitoringTabs}
            fieldGroups={emFieldGroups}
            widthConfig={environmentalMonitoringGridConfigs}
            requiredFields={environmentalMonitoringRequiredFieldsList}
            hideSidebar={true}
            hideTabBar={true}
            showSettingsTab={true}
            getHeaderStyle={getHeaderStyle}
            configs={environmentalMonitoringGridConfigs}
            TabIcon={TabIcon}
            formData={formData}
            setFormData={setFormData}
            mode={mode}
            canPrint={canPrint}
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
            currentRecord={emList.length > 0 ? currentIndex + 1 : 0}
            totalRecords={emList.length}
            onPrevRecord={() => setCurrentIndex((p) => Math.max(p - 1, 0))}
            onNextRecord={() =>
              setCurrentIndex((p) => Math.min(p + 1, emList.length - 1))
            }
            headerActiveTab={activeTab}
            onHeaderTabChange={handleHeaderTabChange}
            // NOTE: if ERPFormBuilder/ERPFooter supports a save-button label prop,
            // wire it here e.g. saveButtonLabel="Save & e-Sign"
          />
          {mode !== "view" && (
            <p className="text-xs text-gray-500 px-4 pb-2">
              On save, record is electronically signed as{" "}
              <strong>{formData.created_by || formData.updated_by || "H"}</strong>{" "}
              with timestamp (ALCOA+: attributable, contemporaneous).
            </p>
          )}
        </>
      ) : (
        <Table
          activeTab={activeTab}
          onRefresh={() => loadData()}
          showSettingsTab={true}
          onTabChange={handleHeaderTabChange}
          onDeleteMultiple={handleDeleteMultiple}
          title="Environmental Monitoring Register"
          data={listWithSr}
          columns={environmentalMonitoringTableColumns}
          rowKey="id"
          loading={loading}
          onAdd={rights?.add === 1 ? handleAddNew : null}
          onRowDoubleClick={handleRowSelect}
        />
      )}
    </div>
  );
}