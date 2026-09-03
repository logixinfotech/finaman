import { useState, useCallback, useMemo } from "react";
import {
  FaCogs, FaStamp, FaVial, FaFileContract,
  FaFlagCheckered, FaHistory,
} from "react-icons/fa";
import Table from "../../../components/Reusable/table/Table";
import ERPFormBuilder from "../../../components/Reusable/form/ERPFormBuilder";
import UnivarsalFilter from "../../../components/Reusable/Filter/UnivarsalFilter.jsx";
import RecordAuditPanel from "./Utils/RecordAuditPanel.jsx";
import { getHeaderStyle } from "./Utils/QmsValidation";
import { useQmsModule } from "./Utils/useQmsModule";
import { useRefOptions } from "./Utils/useRefOptions";
import {
  qualificationTabs, qualificationTabStage, qualificationTabLabels,
  getQualificationFieldGroups, getQualificationRequired,
  qualificationWidthConfig, qualificationSectionConfigs, qualificationTableColumns,
} from "./Utils/Qmsconfigs";
import {
  getQualifications, createQualification, updateQualification, deleteQualification,
} from "./Utils/QmsAPI";
import { usePrintWorkflow } from "../../../Hooks/usePrintWorkflow.js";
import ERPPrintPreview from "../../../components/Reusable/ERPPrintPreview.jsx";
// ── module-level constants (component ke bahar — stable references) ──
const API = {
  list: getQualifications, create: createQualification,
  update: updateQualification, remove: deleteQualification,
};

const initialState = {
  Id: null, RecordNo: "", Status: "Planned",
  Equipment: "", Stage: "", ProtocolNo: "",
  PlannedDate: new Date().toISOString().slice(0, 10), PlannedBy: "",
  VendorName: "", AttachmentRef: "", AcceptanceCriteria: "",
  ProtocolApprovedBy: "", ProtocolApprovalDate: "",
  ExecutedDate: "", WitnessedBy: "", DeviationRef: "",
  TestsPerformed: "", Observations: "",
  ReportNo: "", ReportDate: "", Result: "",
  PreparedBy: "", ApprovedBy: "", ApprovalDate: "", CapaRef: "",
  NextRequalDue: "", ClosedBy: "", Remarks: "",
};

const QLF_TAB_ICON = {
  details: FaCogs,
  protocol: FaStamp,
  execution: FaVial,
  report: FaFileContract,
  closure: FaFlagCheckered,
  audit: FaHistory,
};
function QualificationTabIcon({ tab }) {
  const Icon = QLF_TAB_ICON[tab];
  return Icon ? <Icon /> : <span>•</span>;
}

const STATUS_OPTIONS = [
  "Planned", "Protocol Approved", "Executed", "Report Approved",
  "Pending Closure", "Closed", "Rejected",
];

const EMPTY_FILTERS = { Status: "All", Equipment: "", Stage: "All" };

export default function QualificationMasterPage({ tab }) {
  const m = useQmsModule({
    moduleKey: "qualification",
    title: "Qualification",
    applName: tab?.appl_name || "Qualification",
    initialState,
    tabs: qualificationTabs,
    tabStage: qualificationTabStage,
    getRequired: getQualificationRequired,
    api: API,
  });

  const printWorkflow = usePrintWorkflow({
    printBaseUrl: '/api/qms-print/qualification',   // ✅ moduleKey 'qualification' se match
    applName: 'qualification',
    emailEndpoint: '/api/qms-print/qualification',
    shareLinkEndpoint: '/api/qms-print/qualification',
  });

  const refOpts = useRefOptions(["capa"]);

  const fieldGroups = useMemo(
    () => getQualificationFieldGroups({ ...m.groupOptions, refOpts }),   // 🆕 refOpts add kiya
    [m.groupOptions, refOpts]
  );

  const customTabs = useMemo(
    () => ({ audit: <RecordAuditPanel history={m.history} /> }),
    [m.history]
  );

  // ── filters ──
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [showFilter, setShowFilter] = useState(false);
  const clearFilter = useCallback(() => setFilters(EMPTY_FILTERS), []);

  const filteredList = useMemo(() => {
    const has = (v, f) => String(v || "").toLowerCase().includes(f.toLowerCase());
    return m.list
      .map((item, i) => ({ ...item, Sr: i + 1, Status: item.Status || "Planned" }))
      .filter((it) =>
        (filters.Status === "All" || it.Status === filters.Status) &&
        (filters.Stage === "All" || it.Stage === filters.Stage) &&
        (!filters.Equipment || has(it.Equipment, filters.Equipment))
      );
  }, [m.list, filters]);

  const handlePrint = useCallback(() => {
    printWorkflow.openPrintFor(m.formData?.Id, {
      fileName: m.formData?.RecordNo || `Qualification-${m.formData?.Id}`,
      contextLabel: m.formData?.Equipment,
    }).catch((err) => console.error('Print open failed:', err));
  }, [m.formData, printWorkflow]);

  if (printWorkflow.isOpen) {
    return (
      <div className="h-full w-full">
        <ERPPrintPreview title="Qualification Report" {...printWorkflow.printProps} />
      </div>
    );
  }

  if (m.showForm) {
    return (
      <div className="h-full w-full">
        <ERPFormBuilder
          title="Qualification Planner"
          tabs={qualificationTabs}
          tabLabels={qualificationTabLabels}
          TabIcon={QualificationTabIcon}
          fieldGroups={fieldGroups}
          customTabs={customTabs}
          configs={qualificationSectionConfigs}
          widthConfig={qualificationWidthConfig}
          getHeaderStyle={getHeaderStyle}
          requiredFields={m.requiredFields}
          completedTabs={m.completedTabs}
          hideSidebar={false}
          hideTabBar={false}
          showSettingsTab
          sidebarConfig={{ hidePhoto: true, hideHeader: true }}
          stageHistory={m.history?.stageHistory || null}
          formData={m.formData}
          savedFormData={m.savedFormData}
          setFormData={m.setFormData}
          mode={m.mode}
          saving={m.saving}
          rights={m.rights}
          workflowConfig={m.workflowConfig}
          currentUserRole={m.currentUserRole}
          alwaysSignTabs={["closure"]}
          settingsConfig={m.settingsConfig}
          settingsDefaults={m.settingsDefaults}
          onSettingsSave={m.onSettingsSave}
          onSave={m.handleSave}
             onSaveDraft={m.handleSaveDraft}
          onSignedSave={m.handleSignedSave}
          onDelete={m.handleDelete}
          onModify={m.handleModify}
          onPrint={handlePrint}
          canPrint={m.canPrint}
          onNewEntry={m.handleAddNewGuarded}
          onCancel={m.handleTabExit }
          onEditCancel={m.handleFormExit}
          currentRecord={m.list.length ? m.currentIndex + 1 : 0}
          totalRecords={m.list.length}
          onPrevRecord={() => m.setCurrentIndex((p) => Math.max(p - 1, 0))}
          onNextRecord={() => m.setCurrentIndex((p) => Math.min(p + 1, m.list.length - 1))}
          headerActiveTab={m.activeTab}
          onHeaderTabChange={m.handleHeaderTabChange}
          moduleKey="qualification" 
        />
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <Table
        title="Qualification Planner"
        data={filteredList}
        columns={qualificationTableColumns}
        rowKey="Id"
        loading={m.loading}
        activeTab={m.activeTab}
        showSettingsTab
        onTabChange={m.handleHeaderTabChange}
        onRefresh={m.loadData}
        // onAdd={m.rights?.add === 1 ? m.handleAddNew : null}
        onAdd={m.rights?.add === 1 ? m.handleAddNewGuarded : null}
        onRowDoubleClick={m.handleRowSelect}
        onDeleteMultiple={m.handleDeleteMultiple}
        onToggleFilter={() => setShowFilter((p) => !p)}
        showForm={showFilter}
        formComponent={
          <UnivarsalFilter
            filters={filters}
            setFilters={setFilters}
            setShowFilter={setShowFilter}   // ✅ add kiya
            visibleFields={["status", "equipment", "stage"]}
            options={{
              ...m.groupOptions,
              status: STATUS_OPTIONS,
              stage: ["DQ (Design)", "IQ (Installation)", "OQ (Operational)", "PQ (Performance)", "Re-Qualification"],
            }}
            onApply={() => {}}
            onClear={clearFilter}
          />
        }
      />
    </div>
  );
}