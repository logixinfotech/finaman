 
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import Table from "../../../components/Reusable/table/Table";
import ERPFormBuilder from "../../../components/Reusable/form/ERPFormBuilder";
import { useERPMode } from "../../../components/Reusable/form/useFormMode";
import {deviationTabs, getDeviationFieldGroups , deviationRequiredFieldsList, deviationWidthConfig,} from "./Utils/Qmsconfigs";
import {confirmDelete, showToast, alertError,} from "../../../components/Reusable/alert";
import { getHeaderStyle, TabIcon } from "./Utils/QmsValidation";
import { useApplSettings } from "../../../Hooks/useApplSettings";
import {getDeviations, createDeviation, updateDeviation, deleteDeviation, getMasterOptions, getNextRecordNo  } from "./Utils/QmsAPI";
import { useGroupOptions } from "../../../Hooks/useUserGroupOption";
import RecordDetailModal from "./Components/RecordDetailModal";
import { useWorkflowConfig } from "../../../Hooks/useWorkflowConfig";

const initialState = {
  Id: null,
  RecordNo: "",
  Status: "Open",
  OccurrenceDate: new Date().toISOString().slice(0, 10),
  DeviationType: "",
  Classification: "",
  DetectionDate: "",
  Stage: "",
  Department: "",
  Product: "",
  BatchNo: "",
  BatchQty: "",
  ReportedBy: "",
  QaNotifiedDate: "",
  Description: "",
  ImmediateAction: "",
  InvestigationRequired: "",
  ProbableCause: "",
  RcaMethod: "",
  ImpactAssessment: "",
  OtherBatchesImpacted: "",
  InvestigationSummary: "",
  BatchDisposition: "",
  CapaRequired: "",
  CapaRef: "",
  QaRemarks: "",
  TargetDate: "",
  ReportedOn: "",
  Designation: "",
  Priority: "",
  InvestigationStartDate: "",
  InvestigationCompletionDate: "",
  RiskLevel: "",
  AffectedLots: "",
  CorrectiveAction: "",
  PreventiveAction: "",
  ReviewedBy: "",
  ReviewDate: "",
  ClosureStatus: "",
  ClosedOn: "",
}; 
const configs = {
  "1. Deviation Details": "grid-cols-1 sm:grid-cols-4 xl:grid-cols-8",
  "2. Investigation Details": "grid-cols-1 sm:grid-cols-2 xl:grid-cols-8",
  "3. Root Cause Analysis": "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4",
  "4. Impact Assessment": "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4",
  "5. CAPA (Corrective & Preventive Action)":
    "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4",
  "6. QA Review & Closure": "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4",
}; 
 
export default function DeviationMasterPage({ tab }) {
  const { options: groupOptions } = useGroupOptions();
const deviationFieldGroups = useMemo(() => getDeviationFieldGroups(groupOptions), [groupOptions]);
  const [devList, setDevList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [workflowRecord, setWorkflowRecord] = useState(null);
  const { wfConfig } = useWorkflowConfig();
  const { settingsConfig, settingsDefaults, onSettingsSave } = useApplSettings(
    tab?.appl_name || "Deviation",
  );
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getDeviations();
      const arr = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
          ? res.data
          : [];
      setDevList(arr);
    } catch (err) {
      console.error(err);
      alertError("Load Error", "Failed to load deviation records");
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
    rights, showForm, setShowForm,
    activeTab, setActiveTab,
    handleEditCancel,
    isDirty,
  } = useERPMode(
    initialState,
    async (data) =>
      data.Id
        ? await updateDeviation(data.Id, data)
        : await createDeviation(data),
    loadData,
    "Deviation",
  );
  useEffect(() => {
    loadData();
  }, [loadData]);

const handleHeaderTabChange = useCallback((targetTab) => {
  setActiveTab(targetTab);
  setShowForm(targetTab !== "search"); // "entry" aur "settings" dono me form mounted rahega
}, [setActiveTab, setShowForm]);

const handleAddNew = async () => {
  handleAdd();
  setShowForm(true);
  setActiveTab("entry");
  const recordNo = await getNextRecordNo("deviation");
  setFormData((prev) => ({ ...prev, RecordNo: recordNo }));
};



  useEffect(() => {
    if (showForm && mode === "view" && devList.length > 0) {
      setFormData(devList[currentIndex]);
    }
  }, [currentIndex, devList, showForm, mode, setFormData]);

  const listWithSr = devList.map((item, index) => ({
    ...item,
    Sr: index + 1,
    Status: item.Status || "Open",
  }));

  const handleRowSelect = (row) => {
    const index = devList.findIndex((item) => item.Id === row.Id);
    if (index !== -1) setCurrentIndex(index);
    handleView(row);
    setShowForm(true);
    setActiveTab("entry");
  };
const handleRowClick = (row) => {
  console.log("row clicked", row, "wfConfig:", wfConfig);
  setWorkflowRecord(row);
};

  const handleWorkflowStatusChanged = (newStatus) => {
    setDevList((prev) =>
      prev.map((r) => (r.Id === workflowRecord.Id ? { ...r, Status: newStatus } : r))
    );
    setWorkflowRecord((prev) => (prev ? { ...prev, Status: newStatus } : prev));
  };
  const handleSave = async (localData) => {
    const dataToSave = { ...localData, Id: localData.Id ?? null };
    if (mode === "add") dataToSave.RecordNo = "";
    const response = await performSave("Id", dataToSave);
    if (response && response.success) {
      showToast({ icon: "success", title: "Saved Successfully" });
      await loadData();
      const savedId = response.data?.Id;
      setDevList((prev) => {
        const idx = prev.findIndex((item) => item.Id === savedId);
        if (idx !== -1) setCurrentIndex(idx);
        return prev;
      });
    }
  };
  const handleDelete = async (row) => {
    const confirmed = await confirmDelete({
      title: 'Delete Deviation "' + (row.RecordNo || row.Id) + '"?',
    });
    if (!confirmed) return;
    try {
      await deleteDeviation(row.Id);
      showToast({ icon: "success", title: "Deleted" });
      setShowForm(false);
      setActiveTab("search");
      await loadData();
    } catch (err) {
      alertError("Delete Error", "Failed to delete deviation record");
    }
  };
  
  const handleDeleteMultiple = async (selected) => {
    const ids = (selected || []).map((item) =>
      typeof item === "object" ? item.Id : item,
    );
    if (ids.length === 0) return;
    const confirmed = await confirmDelete({
      title: `Delete ${ids.length} deviation record(s)?`,
    });
    if (!confirmed) return;
    try {
      const results = await Promise.all(ids.map((id) => deleteDeviation(id)));
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
      alertError("Delete Error", "Failed to delete some deviation records");
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
  const formDataRef = useRef(formData);
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]); 
  // tableColumns ko component ke ANDAR le jao (Status pe render add karke)
// ye purane module-level tableColumns ko REPLACE karega

const tableColumns = useMemo(() => [
  { key: "Sr", label: "Sr" },
  { key: "RecordNo", label: "Record No." },
  { key: "OccurrenceDate", label: "Occurrence Date" },
  { key: "Product", label: "Product" },
  { key: "Classification", label: "Classification" },
  { key: "Department", label: "Department" },
  {
    key: "Status",
    label: "Status",
    render: (row) => (
      <span
        onClick={(e) => {
          e.stopPropagation();      // row-select trigger nahi hoga
          handleRowClick(row);
        }}
        className="cursor-pointer text-blue-600 hover:underline font-medium"
      >
        {row.Status || "Open"}
      </span>
    ),
  },
], [handleRowClick]);
  return (
    <div className="h-full w-full">
      {showForm ? (
        <ERPFormBuilder
          title="Deviation"
          tabs={deviationTabs}
          fieldGroups={deviationFieldGroups}
          widthConfig={deviationWidthConfig}
          requiredFields={deviationRequiredFieldsList}
          hideSidebar={true}
          hideTabBar={true}
          showSettingsTab={true}
          getHeaderStyle={getHeaderStyle}
          configs={configs}
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
          currentRecord={devList.length > 0 ? currentIndex + 1 : 0}
          totalRecords={devList.length}
          onPrevRecord={() => setCurrentIndex((p) => Math.max(p - 1, 0))}
          onNextRecord={() =>
            setCurrentIndex((p) => Math.min(p + 1, devList.length - 1))
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
          title="Deviation"
          data={listWithSr}
          columns={tableColumns}
          rowKey="Id"
          loading={loading}
          onAdd={rights?.add === 1 ? handleAddNew : null} 
          onRowDoubleClick={handleRowSelect} 
        />
      )}
      {workflowRecord && wfConfig && (
        <RecordDetailModal
          moduleKey="deviation"
          record={workflowRecord}
          wfConfig={wfConfig}
          onClose={() => setWorkflowRecord(null)}
          onStatusChanged={handleWorkflowStatusChanged}
        />
      )}
    </div>
  );
}
