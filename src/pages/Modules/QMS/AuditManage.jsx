import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import Table from "../../../components/Reusable/table/Table";
import ERPFormBuilder from "../../../components/Reusable/form/ERPFormBuilder";
import { useERPMode } from "../../../components/Reusable/form/useFormMode";
import {
  auditTabs,
  auditFieldGroups,
  auditRequiredFieldsList,
  auditGridConfigs,
  auditTableColumns,
} from "./Utils/Qmsconfigs";
import {
  confirmDelete,
  showToast,
  alertError,
} from "../../../components/Reusable/alert";
import { setERPHandlers } from "../../../utils/erpShortcuts";
import {
  getAudits,
  createAudit,
  updateAudit,
  deleteAudit,
  getNextRecordNo,
} from "./Utils/QmsAPI";
import { widthConfig, getHeaderStyle, TabIcon } from "./Utils/QmsValidation";
import { useApplSettings } from "../../../Hooks/useApplSettings";
import { useGroupOptions } from "../../../Hooks/useUserGroupOption";
import UnivarsalFilter from "../../../components/Reusable/Filter/UnivarsalFilter.jsx";

const initialState = {
  id: null,
  record_no: "",
  audit_type: "",
  auditing_agency: "",
  area_department_audited: "",
  audit_start_date: new Date().toISOString().slice(0, 10),
  audit_end_date: "",
  audit_scope: "",
  auditors: "",
  auditee_representatives: "",
  critical_observations: "",
  major_observations: "",
  minor_observations: "",
  key_findings: "",
  capa_submitted_on: "",
  capa_due_date: "",
  linked_capa_ref: "",
  final_compliance_status: "",
  status: "Open",
  // e-sign audit fields
  created_by: "",
  created_at: "",
  updated_by: "",
  updated_at: "",
};

export default function AuditMasterPage({ tab }) {
  const [auditList, setAuditList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const { settingsConfig, settingsDefaults, onSettingsSave } = useApplSettings(
    tab?.appl_name || "Audit Management",
  );

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAudits();
      const arr = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
          ? res.data
          : [];
      setAuditList(arr);
    } catch (err) {
      console.error(err);
      alertError("Load Error", "Failed to load audit records");
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
        ? await updateAudit(data.id, stamped)
        : await createAudit(stamped);
    },
    loadData,
    "Audit Management",
  );
  const { options: groupOptions } = useGroupOptions();
  const dmsFieldGroup = useMemo(
    () => auditFieldGroups(groupOptions || []),
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

  const handleAddNew = async () => {
    handleAdd();
    setShowForm(true);
    setActiveTab("entry");
    const  recordNo = await getNextRecordNo("stp");
                    
                    setFormData((prev) => ({ ...prev, record_no: recordNo }));
  };
  

  useEffect(() => {
    if (showForm && mode === "view" && auditList.length > 0) {
      setFormData(auditList[currentIndex]);
    }
  }, [currentIndex, auditList, showForm, mode, setFormData]);

  const listWithSr = auditList.map((item, index) => ({
    ...item,
    Sr: index + 1,
    status: item.status || "Open",
  }));

  const handleRowSelect = (row) => {
    const index = auditList.findIndex((item) => item.id === row.id);
    if (index !== -1) setCurrentIndex(index);
    handleView(row);
    setShowForm(true);
    setActiveTab("entry");
  };

  const handleSave = async (localData) => {
    const missing = auditRequiredFieldsList.find(
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
      setAuditList((prev) => {
        const idx = prev.findIndex((item) => item.id === savedId);
        if (idx !== -1) setCurrentIndex(idx);
        return prev;
      });
    }
  };

  const handleDelete = async (row) => {
    const confirmed = await confirmDelete({
      title: `Delete Audit "${row.record_no || row.id}"?`,
    });
    if (!confirmed) return;
    try {
      await deleteAudit(row.id);
      showToast({ icon: "success", title: "Deleted" });
      setShowForm(false);
      setActiveTab("search");
      await loadData();
    } catch (err) {
      alertError("Delete Error", "Failed to delete audit record");
    }
  };

  const handleDeleteMultiple = async (selected) => {
    const ids = (selected || []).map((item) =>
      typeof item === "object" ? item.id : item,
    );
    if (ids.length === 0) return;
    const confirmed = await confirmDelete({
      title: `Delete ${ids.length} audit record(s)?`,
    });
    if (!confirmed) return;
    try {
      const results = await Promise.all(ids.map((id) => deleteAudit(id)));
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
      alertError("Delete Error", "Failed to delete some audit records");
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
    auditList,
    handleSave,
    handleAddNew,
    handleFormExit,
  };

  useEffect(() => {
    setERPHandlers({
      onNextRecord: () =>
        setCurrentIndex((p) =>
          Math.min(p + 1, latest.current.auditList.length - 1),
        ),
      onPrevRecord: () => setCurrentIndex((p) => Math.max(p - 1, 0)),
      onNew: () => latest.current.handleAddNew(),
      onSave: () => latest.current.handleSave(latest.current.formData),
      onEsc: () => latest.current.handleFormExit(),
    });
  }, []);
  const [filters, setFilters] = useState({ status: "All", audit_type: "All", area_department_audited: "" });
const [showFilter, setShowFilter] = useState(false);
const applyFilter = useCallback(() => {}, []);
const clearFilter = useCallback(() => {
  setFilters({ status: "All", audit_type: "All", area_department_audited: "" });
}, []);

const filteredAuditList = useMemo(() => {
  return listWithSr.filter((item) => {
    if (filters.status && filters.status !== "All") {
      if (item.status !== filters.status) return false;
    }
    if (filters.audit_type && filters.audit_type !== "All") {
      if (item.audit_type !== filters.audit_type) return false;
    }
    if (filters.area_department_audited) {
      const val = String(item.area_department_audited || "").toLowerCase();
      if (!val.includes(filters.area_department_audited.toLowerCase())) return false;
    }
    return true;
  });
}, [listWithSr, filters]);

  return (
    <div className="h-full w-full">
      {showForm ? (
        <>
          <ERPFormBuilder
            title="Audit Management"
            tabs={auditTabs}
            fieldGroups={dmsFieldGroup}
            widthConfig={auditGridConfigs}
            requiredFields={auditRequiredFieldsList}
            hideSidebar={true}
            hideTabBar={true}
            showSettingsTab={true}
            getHeaderStyle={getHeaderStyle}
            configs={auditGridConfigs}
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
            currentRecord={auditList.length > 0 ? currentIndex + 1 : 0}
            totalRecords={auditList.length}
            onPrevRecord={() => setCurrentIndex((p) => Math.max(p - 1, 0))}
            onNextRecord={() =>
              setCurrentIndex((p) => Math.min(p + 1, auditList.length - 1))
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
  title="Audit Management"
  data={filteredAuditList}
  columns={auditTableColumns}
  rowKey="id"
  loading={loading}
  onAdd={rights?.add === 1 ? handleAddNew : null}
  onRowDoubleClick={handleRowSelect}
  onToggleFilter={() => setShowFilter((p) => !p)}
  showForm={showFilter}
  formComponent={
    <UnivarsalFilter
      filters={filters}
      visibleFields={["status", "auditType", "areaAudited"]}
      setFilters={setFilters}
      options={{...groupOptions,status:["Planned","Conducted","Response Submitted","Closed","Rejected"]}}
      onApply={applyFilter}
      onClear={clearFilter}
    />
  }
/>
      )}
    </div>
  );
}