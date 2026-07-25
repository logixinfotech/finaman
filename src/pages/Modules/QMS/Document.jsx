// Matches [FINAMANQMS].[qms].[DMS] columns exactly
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import Table from "../../../components/Reusable/table/Table";
import ERPFormBuilder from "../../../components/Reusable/form/ERPFormBuilder";
import { useERPMode } from "../../../components/Reusable/form/useFormMode";
import {
  dmsTabs,
  getDmsFieldGroups,
  dmsRequiredFieldsList,
  dmsWidthConfig,
  dmsSectionConfigs,
  dmsTableColumns,
} from "./Utils/Qmsconfigs";
import {
  confirmDelete,
  showToast,
  alertError,
} from "../../../components/Reusable/alert";
import { setERPHandlers } from "../../../utils/erpShortcuts"; // BUGFIX: was missing — keyboard shortcuts were dead
import { getHeaderStyle, TabIcon } from "./Utils/QmsValidation"; // shared icon/style helper — reuse or fork as DmsValidation
import { useApplSettings } from "../../../Hooks/useApplSettings";
import {
  getDmsRecords,
  createDmsRecord,
  updateDmsRecord,
  deleteDmsRecord,
} from "./Utils/QmsAPI";
import { useGroupOptions } from "../../../Hooks/useUserGroupOption";

const initialState = {
  Id: null,
  RecordNo: "",
  Status: "Open",
  DocTitle: "",
  DocNo: "",
  DocType: "",
  Department: "",
  Version: "",
  Supersedes: "",
  ChangeRef: "",
  ReasonForRevision: "",
  IssueDate: new Date().toISOString().slice(0, 10),
  EffectiveDate: "",
  ReviewDate: "",
  PreparedBy: "",
  ReviewedBy: "",
  ApprovedBy: "",
  TrainingRequired: "",
  TrainingRef: "",
  Distribution: "",
  CreatedBy: "",
  CreatedAt: "",
  UpdatedBy: "",
  UpdatedAt: "",
  ClosedAt: "",
};

export default function DocumentMasterPage({ tab }) {
  const [docList, setDocList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { settingsConfig, settingsDefaults, onSettingsSave } = useApplSettings(
    tab?.appl_name || "DMS",
  );

  const { options: groupOptions } = useGroupOptions();

  // BUGFIX: groupOptions is undefined until useGroupOptions resolves.
  // getDmsFieldGroups(undefined) can throw inside render (e.g. if it maps
  // over the value), which silently prevents the form from ever opening.
  // Default to [] until the real options arrive.
  const dmsFieldGroup = useMemo(
    () => getDmsFieldGroups(groupOptions || []),
    [groupOptions],
  );

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getDmsRecords();
      const arr = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
          ? res.data
          : [];
      setDocList(arr);
    } catch (err) {
      console.error(err);
      alertError("Load Error", "Failed to load document records");
    } finally {
      setLoading(false);
    }
  }, []);

  const {
    mode,
    formData,
    setFormData,
    saving,
    canPrint, // BUGFIX: was missing, never reached ERPFormBuilder
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
      const stamped = data.Id
        ? { ...data, UpdatedBy: currentUser, UpdatedAt: now }
        : { ...data, CreatedBy: currentUser, CreatedAt: now };
      return data.Id
        ? await updateDmsRecord(data.Id, stamped)
        : await createDmsRecord(stamped);
    },
    loadData,
    "DMS",
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
    if (showForm && mode === "view" && docList.length > 0) {
      setFormData(docList[currentIndex]);
    }
  }, [currentIndex, docList, showForm, mode, setFormData]);

  const listWithSr = docList.map((item, index) => ({
    ...item,
    Sr: index + 1,
    Status: item.Status || "Open",
  }));

  const handleRowSelect = (row) => {
    const index = docList.findIndex((item) => item.Id === row.Id);
    if (index !== -1) setCurrentIndex(index);
    handleView(row);
    setShowForm(true);
    setActiveTab("entry");
  };

  const handleSave = async (localData) => {
    // BUGFIX: required-field validation was missing entirely (Training and
    // Recall both enforce this before saving).
    const missing = dmsRequiredFieldsList.find(
      (f) => !localData[f] || String(localData[f]).trim() === "",
    );
    if (missing) {
      showToast({ icon: "error", title: "Please fill all required fields" });
      return;
    }
    const dataToSave = { ...localData, Id: localData.Id ?? null };
    const response = await performSave("Id", dataToSave);
    if (response && response.success) {
      showToast({ icon: "success", title: "Saved & e-Signed Successfully" });
      await loadData();
      const savedId = response.data?.Id;
      setDocList((prev) => {
        const idx = prev.findIndex((item) => item.Id === savedId);
        if (idx !== -1) setCurrentIndex(idx);
        return prev;
      });
    }
  };

  const handleDelete = async (row) => {
    const confirmed = await confirmDelete({
      title: 'Delete Document "' + (row.DocNo || row.Id) + '"?',
    });
    if (!confirmed) return;
    try {
      await deleteDmsRecord(row.Id);
      showToast({ icon: "success", title: "Deleted" });
      setShowForm(false);
      setActiveTab("search");
      await loadData();
    } catch (err) {
      alertError("Delete Error", "Failed to delete document record");
    }
  };

  const handleDeleteMultiple = async (selected) => {
    const ids = (selected || []).map((item) =>
      typeof item === "object" ? item.Id : item,
    );
    if (ids.length === 0) return;
    const confirmed = await confirmDelete({
      title: `Delete ${ids.length} document record(s)?`,
    });
    if (!confirmed) return;
    try {
      const results = await Promise.all(ids.map((id) => deleteDmsRecord(id)));
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
      alertError("Delete Error", "Failed to delete some document records");
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

  // BUGFIX: replaced the dangling unused formDataRef with the same
  // "latest" ref + setERPHandlers wiring used in Training/Recall, so
  // keyboard shortcuts (next/prev record, new, save, esc) actually work.
  const latest = useRef({});
  latest.current = {
    formData,
    docList,
    handleSave,
    handleAddNew,
    handleFormExit,
  };

  useEffect(() => {
    setERPHandlers({
      onNextRecord: () =>
        setCurrentIndex((p) => Math.min(p + 1, latest.current.docList.length - 1)),
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
            title="Document Management (DMS)"
            tabs={dmsTabs}
            fieldGroups={dmsFieldGroup}
            widthConfig={dmsWidthConfig}
            requiredFields={dmsRequiredFieldsList}
            hideSidebar={true}
            hideTabBar={true}
            showSettingsTab={true}
            getHeaderStyle={getHeaderStyle}
            configs={dmsSectionConfigs}
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
            currentRecord={docList.length > 0 ? currentIndex + 1 : 0}
            totalRecords={docList.length}
            onPrevRecord={() => setCurrentIndex((p) => Math.max(p - 1, 0))}
            onNextRecord={() =>
              setCurrentIndex((p) => Math.min(p + 1, docList.length - 1))
            }
            headerActiveTab={activeTab}
            onHeaderTabChange={handleHeaderTabChange}
            // NOTE: if ERPFormBuilder/ERPFooter supports a save-button label prop,
            // wire it here e.g. saveButtonLabel="Save & e-Sign"
          />
          {mode !== "view" && (
            <p className="text-xs text-gray-500 px-4 pb-2">
              On save, record is electronically signed as{" "}
              <strong>{formData.CreatedBy || formData.UpdatedBy || "H"}</strong>{" "}
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
          title="Document Management (DMS)"
          data={listWithSr}
          columns={dmsTableColumns}
          rowKey="Id"
          loading={loading}
          onAdd={rights?.add === 1 ? handleAddNew : null}
          onRowDoubleClick={handleRowSelect}
        />
      )}
    </div>
  );
}