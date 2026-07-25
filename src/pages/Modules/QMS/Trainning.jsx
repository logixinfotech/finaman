import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import Table from "../../../components/Reusable/table/Table";
import ERPFormBuilder from "../../../components/Reusable/form/ERPFormBuilder";
import { useERPMode } from "../../../components/Reusable/form/useFormMode";
import {
  trainingTabs,
  trainingFieldGroups,
  trainingRequiredFieldsList,
  trainingGridConfigs,
  trainingTableColumns,
} from "./Utils/Qmsconfigs";
import {
  confirmDelete,
  showToast,
  alertError,
} from "../../../components/Reusable/alert";
import { setERPHandlers } from "../../../utils/erpShortcuts";
import {
  getTrainings,
  createTraining,
  updateTraining,
  deleteTraining,
} from "./Utils/QmsAPI";
import { widthConfig, getHeaderStyle, TabIcon } from "./Utils/QmsValidation";
import { useApplSettings } from "../../../Hooks/useApplSettings";
import { useGroupOptions } from "../../../Hooks/useUserGroupOption";

const initialState = {
  id: null,
  record_no: "",
  training_title: "",
  training_type: "",
  training_mode: "",
  linked_document_ref: "",
  target_department: "",
  trainer: "",
  scheduled_date: new Date().toISOString().slice(0, 10),
  conducted_date: "",
  venue: "",
  duration_hours: "",
  evaluation_method: "",
  pass_criteria: "",
  trainees_scores: "",
  effectiveness_assessment: "",
  remarks: "",
  status: "Open",
  // e-sign audit fields
  created_by: "",
  created_at: "",
  updated_by: "",
  updated_at: "",
};

export default function TrainingMasterPage({ tab }) {
  const [trainingList, setTrainingList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const { settingsConfig, settingsDefaults, onSettingsSave } = useApplSettings(
    tab?.appl_name || "Training Management",
  );

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getTrainings();
      const arr = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
          ? res.data
          : [];
      setTrainingList(arr);
    } catch (err) {
      console.error(err);
      alertError("Load Error", "Failed to load training records");
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
        ? await updateTraining(data.id, stamped)
        : await createTraining(stamped);
    },
    loadData,
    "Training Management",
  );
  const {options:groupOptions}=useGroupOptions()
    const dmsFieldGroup = useMemo(
      () => trainingFieldGroups(groupOptions || []),
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
    if (showForm && mode === "view" && trainingList.length > 0) {
      setFormData(trainingList[currentIndex]);
    }
  }, [currentIndex, trainingList, showForm, mode, setFormData]);

  const listWithSr = trainingList.map((item, index) => ({
    ...item,
    Sr: index + 1,
    status: item.status || "Open",
  }));

  const handleRowSelect = (row) => {
    const index = trainingList.findIndex((item) => item.id === row.id);
    if (index !== -1) setCurrentIndex(index);
    handleView(row);
    setShowForm(true);
    setActiveTab("entry");
  };

  const handleSave = async (localData) => {
    const missing = trainingRequiredFieldsList.find(
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
      setTrainingList((prev) => {
        const idx = prev.findIndex((item) => item.id === savedId);
        if (idx !== -1) setCurrentIndex(idx);
        return prev;
      });
    }
  };

  const handleDelete = async (row) => {
    const confirmed = await confirmDelete({
      title: `Delete Training "${row.record_no || row.id}"?`,
    });
    if (!confirmed) return;
    try {
      await deleteTraining(row.id);
      showToast({ icon: "success", title: "Deleted" });
      setShowForm(false);
      setActiveTab("search");
      await loadData();
    } catch (err) {
      alertError("Delete Error", "Failed to delete training record");
    }
  };

  const handleDeleteMultiple = async (selected) => {
    const ids = (selected || []).map((item) =>
      typeof item === "object" ? item.id : item,
    );
    if (ids.length === 0) return;
    const confirmed = await confirmDelete({
      title: `Delete ${ids.length} training record(s)?`,
    });
    if (!confirmed) return;
    try {
      const results = await Promise.all(ids.map((id) => deleteTraining(id)));
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
      alertError("Delete Error", "Failed to delete some training records");
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
    trainingList,
    handleSave,
    handleAddNew,
    handleFormExit,
  };

  useEffect(() => {
    setERPHandlers({
      onNextRecord: () =>
        setCurrentIndex((p) =>
          Math.min(p + 1, latest.current.trainingList.length - 1),
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
        <>
          <ERPFormBuilder
            title="Training Management"
            tabs={trainingTabs}
            fieldGroups={dmsFieldGroup}
            widthConfig={trainingGridConfigs}
            requiredFields={trainingRequiredFieldsList}
            hideSidebar={true}
            hideTabBar={true}
            showSettingsTab={true}
            getHeaderStyle={getHeaderStyle}
            configs={trainingGridConfigs}
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
            currentRecord={trainingList.length > 0 ? currentIndex + 1 : 0}
            totalRecords={trainingList.length}
            onPrevRecord={() => setCurrentIndex((p) => Math.max(p - 1, 0))}
            onNextRecord={() =>
              setCurrentIndex((p) => Math.min(p + 1, trainingList.length - 1))
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
          title="Training Register"
          data={listWithSr}
          columns={trainingTableColumns}
          rowKey="id"
          loading={loading}
          onAdd={rights?.add === 1 ? handleAddNew : null}
          onRowDoubleClick={handleRowSelect}
        />
      )}
    </div>
  );
}