import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import Table from "../../../components/Reusable/table/Table";
import ERPFormBuilder from "../../../components/Reusable/form/ERPFormBuilder";
import { useERPMode } from "../../../components/Reusable/form/useFormMode";
import {
  stpTabs,
  stpFieldGroups,
  stpRequiredFieldsList,
  stpGridConfigs,
  stpTableColumns,
} from "./Utils/Qmsconfigs";
import {
  confirmDelete,
  showToast,
  alertError,
} from "../../../components/Reusable/alert";
import { setERPHandlers } from "../../../utils/erpShortcuts";
import {
  getSTPs,
  createSTP,
  updateSTP,
  deleteSTP,
} from "./Utils/QmsAPI";
import { widthConfig, getHeaderStyle, TabIcon } from "./Utils/QmsValidation";
import { useApplSettings } from "../../../Hooks/useApplSettings";
import { useGroupOptions } from "../../../Hooks/useUserGroupOption";

const initialState = {
  id: null,
  record_no: "",
  document_title: "",
  department: "",
  category: "",
  version_no: "",
  date_of_issue: "",
  effective_date: "",
  next_review_due: "",
  supersedes: "",
  reason_for_revision: "",
  linked_change_control_ref: "",
  prepared_by: "",
  reviewed_by: "",
  approved_by: "",
  training_completed_before_effective: "",
  controlled_copy_distribution: "",
  scope_remarks: "",
  status: "Open",
  // e-sign audit fields
  created_by: "",
  created_at: "",
  updated_by: "",
  updated_at: "",
};

export default function STPMasterPage({ tab }) {
  const [stpList, setStpList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const { settingsConfig, settingsDefaults, onSettingsSave } = useApplSettings(
    tab?.appl_name || "STP Register",
  );

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getSTPs();
      const arr = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
          ? res.data
          : [];
      setStpList(arr);
    } catch (err) {
      console.error(err);
      alertError("Load Error", "Failed to load STP records");
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
        ? await updateSTP(data.id, stamped)
        : await createSTP(stamped);
    },
    loadData,
    "STP Register",
  );
  const { options: groupOptions } = useGroupOptions();
  const dmsFieldGroup = useMemo(
    () => stpFieldGroups(groupOptions || []),
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
    if (showForm && mode === "view" && stpList.length > 0) {
      setFormData(stpList[currentIndex]);
    }
  }, [currentIndex, stpList, showForm, mode, setFormData]);

  const listWithSr = stpList.map((item, index) => ({
    ...item,
    Sr: index + 1,
    status: item.status || "Open",
  }));

  const handleRowSelect = (row) => {
    const index = stpList.findIndex((item) => item.id === row.id);
    if (index !== -1) setCurrentIndex(index);
    handleView(row);
    setShowForm(true);
    setActiveTab("entry");
  };

  const handleSave = async (localData) => {
    const missing = stpRequiredFieldsList.find(
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
      setStpList((prev) => {
        const idx = prev.findIndex((item) => item.id === savedId);
        if (idx !== -1) setCurrentIndex(idx);
        return prev;
      });
    }
  };

  const handleDelete = async (row) => {
    const confirmed = await confirmDelete({
      title: `Delete STP "${row.record_no || row.id}"?`,
    });
    if (!confirmed) return;
    try {
      await deleteSTP(row.id);
      showToast({ icon: "success", title: "Deleted" });
      setShowForm(false);
      setActiveTab("search");
      await loadData();
    } catch (err) {
      alertError("Delete Error", "Failed to delete STP record");
    }
  };

  const handleDeleteMultiple = async (selected) => {
    const ids = (selected || []).map((item) =>
      typeof item === "object" ? item.id : item,
    );
    if (ids.length === 0) return;
    const confirmed = await confirmDelete({
      title: `Delete ${ids.length} STP record(s)?`,
    });
    if (!confirmed) return;
    try {
      const results = await Promise.all(ids.map((id) => deleteSTP(id)));
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
      alertError("Delete Error", "Failed to delete some STP records");
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
    stpList,
    handleSave,
    handleAddNew,
    handleFormExit,
  };

  useEffect(() => {
    setERPHandlers({
      onNextRecord: () =>
        setCurrentIndex((p) =>
          Math.min(p + 1, latest.current.stpList.length - 1),
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
            title="STP Register"
            tabs={stpTabs}
            fieldGroups={dmsFieldGroup}
            widthConfig={stpGridConfigs}
            requiredFields={stpRequiredFieldsList}
            hideSidebar={true}
            hideTabBar={true}
            showSettingsTab={true}
            getHeaderStyle={getHeaderStyle}
            configs={stpGridConfigs}
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
            currentRecord={stpList.length > 0 ? currentIndex + 1 : 0}
            totalRecords={stpList.length}
            onPrevRecord={() => setCurrentIndex((p) => Math.max(p - 1, 0))}
            onNextRecord={() =>
              setCurrentIndex((p) => Math.min(p + 1, stpList.length - 1))
            }
            headerActiveTab={activeTab}
            onHeaderTabChange={handleHeaderTabChange}
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
          title="STP Register"
          data={listWithSr}
          columns={stpTableColumns}
          rowKey="id"
          loading={loading}
          onAdd={rights?.add === 1 ? handleAddNew : null}
          onRowDoubleClick={handleRowSelect}
        />
      )}
    </div>
  );
}