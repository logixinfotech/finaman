import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import Table from "../../../components/Reusable/table/Table";
import ERPFormBuilder from "../../../components/Reusable/form/ERPFormBuilder";
import { useERPMode } from "../../../components/Reusable/form/useFormMode";
import {
  recallTabs,
  recallFieldGroups,
  recallRequiredFieldsList,
} from "./Utils/Qmsconfigs";
import {
  confirmDelete,
  showToast,
  alertError,
} from "../../../components/Reusable/alert";
import { setERPHandlers } from "../../../utils/erpShortcuts";
import {
  getRecalls,
  createRecall,
  updateRecall,
  deleteRecall,
  getNextRecordNo,
} from "./Utils/QmsAPI";
import { getHeaderStyle, TabIcon } from "./Utils/QmsValidation";
import { useApplSettings } from "../../../Hooks/useApplSettings";
import { useGroupOptions } from "../../../Hooks/useUserGroupOption";
import UnivarsalFilter from "../../../components/Reusable/Filter/UnivarsalFilter.jsx";

const initialState = {
  id: null,
  record_no: "",
  initiation_date: new Date().toISOString().slice(0, 10),
  product: "",
  batch_nos: "",
  classification: "",
  recall_type: "",
  recall_level: "",
  mfg_date: "",
  exp_date: "",
  reason: "",
  complaint_ref: "",
  deviation_ref: "",
  distribution_details: "",
  qty_manufactured: "",
  qty_distributed: "",
  qty_in_stock: "",
  qty_recovered: "",
  communication_mode: "",
  regulatory_authority: "",
  regulatory_notified_date: "",
  effectiveness_summary: "",
  mock_recall_result: "",
  destruction_details: "",
  destruction_witnessed_by: "",
  capa_ref: "",
  target_date: "",
  status: "Open",
};

// BUGFIX: previously `widthConfig` (generic/unrelated import) was passed to
// the `widthConfig` prop while a separate partial object was passed to
// `configs`. ERPFormBuilder needs ONE consistent layout config used for both,
// exactly like TrainingMasterPage does with `trainingGridConfigs`.
const recallGridConfigs = {
  "Reason for Recall": "col-span-full",
  "Distribution Details (Parties, Regions, Export)": "col-span-full",
  "Recall Effectiveness Check Summary": "col-span-full",
  "Recovered Stock Disposition / Destruction Details": "col-span-full",
};

const tableColumns = [
  { key: "Sr", label: "Sr" },
  { key: "record_no", label: "Recall No." },
  {
    key: "initiation_date",
    label: "Init. Date",
    render: (r) => (r.initiation_date || "").slice(0, 10),
  },
  { key: "product", label: "Product" },
  { key: "classification", label: "Classification" },
  { key: "status", label: "Status" },
];

export default function ProductRecallMasterPage({ tab }) {
  const [recallList, setRecallList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const { settingsConfig, settingsDefaults, onSettingsSave } = useApplSettings(
    tab?.appl_name || "Product Recall",
  );

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getRecalls();
      const arr = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
          ? res.data
          : [];
      setRecallList(arr);
    } catch (err) {
      console.error(err);
      alertError("Load Error", "Failed to load recall records");
    } finally {
      setLoading(false);
    }
  }, []);

  const {
    mode,
    formData,
    setFormData,
    saving,
    canPrint, // BUGFIX: was missing entirely, never reached ERPFormBuilder
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
      data.id ? await updateRecall(data.id, data) : await createRecall(data),
    loadData,
    "Product Recall",
  );

  useEffect(() => {
    loadData();
  }, [loadData]);
  const [filters, setFilters] = useState({ status: "All", product: "", classification: "All" });
const [showFilter, setShowFilter] = useState(false);

const applyFilter = useCallback(() => {}, []);
const clearFilter = useCallback(() => {
  setFilters({ status: "All", product: "", classification: "All" });
}, []);

  const handleHeaderTabChange = useCallback(
    (targetTab) => {
      setActiveTab(targetTab);
      setShowForm(targetTab !== "search");
    },
    [setActiveTab, setShowForm],
  );
  const { options: groupOptions } = useGroupOptions();
const recallFieldGroup = useMemo(
  () => recallFieldGroups(groupOptions),
  [groupOptions]   // ✅ sahi
);
  const handleAddNew = async() => {
    handleAdd();
    setShowForm(true);
    setActiveTab("entry");
    const  recordNo = await getNextRecordNo("recall");
    
    setFormData((prev) => ({ ...prev, RecordNo: recordNo }));
  };

  useEffect(() => {
    if (showForm && mode === "view" && recallList.length > 0) {
      setFormData(recallList[currentIndex]);
    }
  }, [currentIndex, recallList, showForm, mode, setFormData]);

  const listWithSr = recallList.map((item, index) => ({
    ...item,
    Sr: index + 1,
    status: item.status || "Open",
  }));

  const handleRowSelect = (row) => {
    const index = recallList.findIndex((item) => item.id === row.id);
    if (index !== -1) setCurrentIndex(index);
    handleView(row);
    setShowForm(true);
    setActiveTab("entry");
  
  };

  const handleSave = async (localData) => {
    const missing = recallRequiredFieldsList.find(
      (f) => !localData[f] || String(localData[f]).trim() === "",
    );
    if (missing) {
      showToast({ icon: "error", title: "Please fill all required fields" });
      return;
    }
    const dataToSave = { ...localData, id: localData.id ?? null };
    const response = await performSave("id", dataToSave);
    if (response && response.success) {
      showToast({ icon: "success", title: "Saved Successfully" });
      await loadData();
      const savedId = response.data?.id;
      setRecallList((prev) => {
        const idx = prev.findIndex((item) => item.id === savedId);
        if (idx !== -1) setCurrentIndex(idx);
        return prev;
      });
    }
  };

  const handleDelete = async (row) => {
    const confirmed = await confirmDelete({
      title: `Delete Recall "${row.record_no || row.id}"?`,
    });
    if (!confirmed) return;
    try {
      await deleteRecall(row.id);
      showToast({ icon: "success", title: "Deleted" });
      setShowForm(false);
      setActiveTab("search");
      await loadData();
    } catch (err) {
      alertError("Delete Error", "Failed to delete recall record");
    }
  };

  const handleDeleteMultiple = async (selected) => {
    const ids = (selected || []).map((item) =>
      typeof item === "object" ? item.id : item,
    );
    if (ids.length === 0) return;
    const confirmed = await confirmDelete({
      title: `Delete ${ids.length} recall record(s)?`,
    });
    if (!confirmed) return;
    try {
      const results = await Promise.all(ids.map((id) => deleteRecall(id)));
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
      alertError("Delete Error", "Failed to delete some recall records");
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
    recallList,
    handleSave,
    handleAddNew,
    handleFormExit,
  };

  useEffect(() => {
    setERPHandlers({
      onNextRecord: () =>
        setCurrentIndex((p) =>
          Math.min(p + 1, latest.current.recallList.length - 1),
        ),
      onPrevRecord: () => setCurrentIndex((p) => Math.max(p - 1, 0)),
      onNew: () => latest.current.handleAddNew(),
      onSave: () => latest.current.handleSave(latest.current.formData),
      onEsc: () => latest.current.handleFormExit(),
    });
  }, []);
  const filteredRecallList = useMemo(() => {
  return listWithSr.filter((item) => {
    if (filters.status && filters.status !== "All") {
      if (item.status !== filters.status) return false;
    }
    if (filters.product) {
      const product = String(item.product || "").toLowerCase();
      if (!product.includes(filters.product.toLowerCase())) return false;
    }
    if (filters.classification && filters.classification !== "All") {
      if (item.classification !== filters.classification) return false;
    }
    return true;
  });
}, [listWithSr, filters]);

  return (
    <div className="h-full w-full">
      {showForm ? (
        <>
          <ERPFormBuilder
            title="Product Recall"
            tabs={recallTabs}
            fieldGroups={recallFieldGroup}
            widthConfig={recallGridConfigs}
            requiredFields={recallRequiredFieldsList}
            hideSidebar={true}
            hideTabBar={true}
            showSettingsTab={true}
            getHeaderStyle={getHeaderStyle}
            configs={recallGridConfigs}
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
            currentRecord={recallList.length > 0 ? currentIndex + 1 : 0}
            totalRecords={recallList.length}
            onPrevRecord={() => setCurrentIndex((p) => Math.max(p - 1, 0))}
            onNextRecord={() =>
              setCurrentIndex((p) => Math.min(p + 1, recallList.length - 1))
            }
            headerActiveTab={activeTab}
            onHeaderTabChange={handleHeaderTabChange}
          />
        </>
      ) : (
      <Table
  activeTab={activeTab}
  onRefresh={() => loadData()}
  showSettingsTab={true}
  onTabChange={handleHeaderTabChange}
  onDeleteMultiple={handleDeleteMultiple}
  title="Product Recall Register"
  data={filteredRecallList}
  columns={tableColumns}
  rowKey="id"
  loading={loading}
  onAdd={rights?.add === 1 ? handleAddNew : null}
  onRowDoubleClick={handleRowSelect}
  onToggleFilter={() => setShowFilter((p) => !p)}
  showForm={showFilter}
  formComponent={
    <UnivarsalFilter
      filters={filters}
      visibleFields={["status", "product", "classification"]}
      setFilters={setFilters}
       options={{...groupOptions,status:["Notification Sent","Recovery In Progress","Reconciliation","Initiated","Closed","Rejected"]}}
      onApply={applyFilter}
      onClear={clearFilter}
    />
  }
/>
      )}
    </div>
  );
}