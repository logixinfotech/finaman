import { useState, useCallback, useMemo } from "react";
import Table from "../../../components/Reusable/table/Table";
import ERPFormBuilder from "../../../components/Reusable/form/ERPFormBuilder";
import UnivarsalFilter from "../../../components/Reusable/Filter/UnivarsalFilter.jsx";
import RecordAuditPanel from "./Utils/RecordAuditPanel.jsx";
import { getHeaderStyle } from "./Utils/QmsValidation";
import { useQmsModule } from "./Utils/useQmsModule";
import {
  deviationTabs, deviationTabStage, deviationTabLabels,
  getDeviationFieldGroups, getDeviationRequired,
  deviationWidthConfig, deviationSectionConfigs,
} from "./Utils/Qmsconfigs";
import {
  getDeviations, createDeviation, updateDeviation, deleteDeviation,
} from "./Utils/QmsAPI";
import { FaClipboardList, FaCheckCircle, FaSearch, FaLink, FaTools, FaFlagCheckered, FaHistory } from "react-icons/fa";


// ── module-level constants (component ke bahar — stable references) ──
const API = {
  list:   getDeviations,
  create: createDeviation,
  update: updateDeviation,
  remove: deleteDeviation,
};

const initialState = {
  Id: null, RecordNo: "", Status: "Open",
  OccurrenceDate: new Date().toISOString().slice(0, 10),
  DeviationType: "", Classification: "", DetectionDate: "", Stage: "",
  Department: "", Product: "", BatchNo: "", BatchQty: "",
  ReportedBy: "", ReportedOn: "", Designation: "", Priority: "",
  QaNotifiedDate: "", Description: "", ImmediateAction: "",
  IncidentRef: "", RepeatDeviation: "", AttachmentRef: "",
  AcceptedBy: "", AcceptedOn: "", InvestigationRequired: "",
  InvestigationStartDate: "", InvestigationCompletionDate: "",
  InvestigatedBy: "", InvestigationSummary: "",
  RcaMethod: "", ProbableCause: "",
  RiskLevel: "", AffectedLots: "", BatchDisposition: "",
  ImpactAssessment: "", OtherBatchesImpacted: "",
  CapaRequired: "", CapaRef: "", TargetDate: "",
  RevisedTargetDate: "", ExtensionReason: "",
  CorrectiveAction: "", PreventiveAction: "",
  ReviewedBy: "", ReviewDate: "", ClosureStatus: "",
  ClosedOn: "", ClosedBy: "", QaRemarks: "",
};
const DEV_TAB_ICON = {
  open:          FaClipboardList,
  qa_accepted:   FaCheckCircle,
  investigation: FaSearch,
  impact:        FaLink,
  capa:          FaTools,
  closure:       FaFlagCheckered,
  audit:         FaHistory,
};
function DeviationTabIcon({ tab }) {
  const Icon = DEV_TAB_ICON[tab];
  return Icon ? <Icon /> : <span>•</span>;
}

const STATUS_OPTIONS = [
  "Open", "QA Accepted", "Under Investigation", "Impact Assessed",
  "CAPA Assigned", "QA Review", "Closed", "Rejected",
];

const TABLE_COLUMNS = [
  { key: "Sr", label: "Sr" },
  { key: "RecordNo", label: "Record No." },
  { key: "OccurrenceDate", label: "Occurrence Date", render: (r) => (r.OccurrenceDate || "").slice(0, 10) },
  { key: "Product", label: "Product" },
  { key: "Classification", label: "Classification" },
  { key: "Department", label: "Department" },
  { key: "Status", label: "Status" },
];

const EMPTY_FILTERS = { Status: "All", Product: "", Classification: "All", Department: "" };

export default function DeviationMasterPage({ tab }) {
  const m = useQmsModule({
    moduleKey: "deviation",
    title: "Deviation",
    applName: tab?.appl_name || "Deviation",
    initialState,
    tabs: deviationTabs,
    tabStage: deviationTabStage,
    getRequired: getDeviationRequired,
    api: API,
  });

  const fieldGroups = useMemo(
    () => getDeviationFieldGroups(m.groupOptions),
    [m.groupOptions]
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
      .map((item, i) => ({ ...item, Sr: i + 1, Status: item.Status || "Open" }))
      .filter((it) =>
        (filters.Status === "All" || it.Status === filters.Status) &&
        (!filters.Product || has(it.Product, filters.Product)) &&
        (filters.Classification === "All" || it.Classification === filters.Classification) &&
        (!filters.Department || has(it.Department, filters.Department))
      );
  }, [m.list, filters]);

  if (m.showForm) {
    return (
      <div className="h-full w-full">
        <ERPFormBuilder
          title="Deviation"
          tabs={deviationTabs}
          tabLabels={deviationTabLabels}
          TabIcon={DeviationTabIcon}
          fieldGroups={fieldGroups}
          customTabs={customTabs}
          configs={deviationSectionConfigs}
          widthConfig={deviationWidthConfig}
          getHeaderStyle={getHeaderStyle}
          requiredFields={m.requiredFields}
          completedTabs={m.completedTabs}
          hideSidebar={false}
          hideTabBar={false}
          showSettingsTab
          sidebarConfig={{ hidePhoto: true, hideHeader: true }}
          stageHistory={m.history?.stageHistory || null}
          stageEntered={m.history?.stageEntered || null}
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
          onSignedSave={m.handleSignedSave}
          onDelete={m.handleDelete}
          onModify={m.handleModify}
          onNewEntry={m.handleAddNew}
          onCancel={m.handleFormExit}
          onEditCancel={m.handleFormExit}
          currentRecord={m.list.length ? m.currentIndex + 1 : 0}
          totalRecords={m.list.length}
          onPrevRecord={() => m.setCurrentIndex((p) => Math.max(p - 1, 0))}
          onNextRecord={() => m.setCurrentIndex((p) => Math.min(p + 1, m.list.length - 1))}
          headerActiveTab={m.activeTab}
          onHeaderTabChange={m.handleHeaderTabChange}
        />
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <Table
        title="Deviation"
        data={filteredList}
        columns={TABLE_COLUMNS}
        rowKey="Id"
        loading={m.loading}
        activeTab={m.activeTab}
        showSettingsTab
        onTabChange={m.handleHeaderTabChange}
        onRefresh={m.loadData}
        onAdd={m.rights?.add === 1 ? m.handleAddNew : null}
        onRowDoubleClick={m.handleRowSelect}
        onDeleteMultiple={m.handleDeleteMultiple}
        onToggleFilter={() => setShowFilter((p) => !p)}
        showForm={showFilter}
        formComponent={
          <UnivarsalFilter
            filters={filters}
            setFilters={setFilters}
            visibleFields={["status", "product", "classification", "department"]}
            options={{ ...m.groupOptions, status: STATUS_OPTIONS }}
            onApply={() => {}}
            onClear={clearFilter}
          />
        }
      />
    </div>
  );
}