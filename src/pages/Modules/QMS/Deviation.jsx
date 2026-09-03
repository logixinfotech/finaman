import { useState, useCallback, useMemo } from "react";
import Table from "../../../components/Reusable/table/Table";
import ERPFormBuilder from "../../../components/Reusable/form/ERPFormBuilder";
import UnivarsalFilter from "../../../components/Reusable/Filter/UnivarsalFilter.jsx";
import RecordAuditPanel from "./Utils/RecordAuditPanel.jsx";
import { getHeaderStyle } from "./Utils/QmsValidation";
import { useQmsModule } from "./Utils/useQmsModule";
import { useRefOptions } from "./Utils/useRefOptions";
import ERPPrintPreview from "../../../components/Reusable/ERPPrintPreview.jsx";
import {
  deviationTabs, deviationTabStage, deviationTabLabels,
  getDeviationFieldGroups, getDeviationRequired,
  deviationWidthConfig, deviationSectionConfigs,
} from "./Utils/Qmsconfigs";
import {
  getDeviations, getDeviation, createDeviation, updateDeviation, deleteDeviation,
} from "./Utils/QmsAPI";
import { FaClipboardList, FaCheckCircle, FaSearch, FaLink, FaTools, FaFlagCheckered, FaHistory } from "react-icons/fa";
import { usePrintWorkflow } from "../../../Hooks/usePrintWorkflow.js";

const API = {
  list: getDeviations,
   getOne: getDeviation, 
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
  ItemType: "", DocumentNo: "", ArNo: "", CodeNo: "",
  SupplierName: "", SupplierReceiptDate: "", SupplierQty: "",
  PlannedComments: "", ImmediateActionDocRef: "",
  RelatedTo: "", RelatedToOther: "",
  PersonInvolved: "", InterviewOutcome: "", Counselor: "",
  PointsDiscussed: "", InterviewConclusion: "", RepeatDeviationDetail: "",
  InvestigationPlan: "",
  PlanSignDeptBy: "", PlanSignDeptOn: "", PlanSignQaBy: "", PlanSignQaOn: "",
  CauseIdentified: "", InvestigationExtended: "", InvestExtensionPeriod: "",
  ExternalHelpRequired: "", ExternalHelpDetail: "",
  ExtInvestClosedBy: "", ExtInvestClosedOn: "",
  ImpactDecision: "", CampaignBatches: "",
  CapaProposedBy: "", CapaProposedOn: "", CapaApprovedQaBy: "", CapaApprovedQaOn: "",
  AuthorizationStatus: "", AuthorizedBy: "", AuthorizedOn: "",
  InterimClosureRemarks: "",
  CapaVerificationStatus: "", CapaVerifiedBy: "", CapaVerifiedOn: "",

  // child grids
  deptreview: [
    { Department: "Engineering" }, { Department: "Stores" }, { Department: "Production" },
    { Department: "Quality Control" }, { Department: "Administration/HR" },
    { Department: "Purchase" }, { Department: "Any other dept." },
  ],
  extensions: [],
};
const DEV_TAB_ICON = {
  open: FaClipboardList,
  qa_accepted: FaCheckCircle,
  investigation: FaSearch,
  impact: FaLink,
  capa: FaTools,
  closure: FaFlagCheckered,
  audit: FaHistory,
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
  { key: "IsDraft", label: "Is Draft", render: (r) => r.IsDraft ? "Draft" : (r.Status || "Open") },
];

const EMPTY_FILTERS = { Status: "All", DeviationScope: "All", Subject: "", Classification: "All", Department: "" };

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

  const printWorkflow = usePrintWorkflow({
    printBaseUrl: '/api/qms-print/deviation',
    applName: 'deviation',
    emailEndpoint: '/api/qms-print/deviation',
    shareLinkEndpoint: '/api/qms-print/deviation',
  });
  const refOpts = useRefOptions(["incident"]);

  const fieldGroups = useMemo(
    () => getDeviationFieldGroups({ ...m.groupOptions, refOpts }),
    [m.groupOptions, refOpts]
  );

  const completedTabs = useMemo(() => {
    if (!m.workflowConfig?.wf) return [];
    const cur = m.workflowConfig.wf.indexOf(m.formData?.Status || "Open");
    if (cur < 0) return [];
    const skip = m.workflowConfig.stageSkip || {};
    const isSkipped = (i) => {
      const r = skip[i];
      if (!r) return false;
      return String(m.formData?.[r.field] ?? "").trim().toLowerCase()
        === String(r.equals ?? "").trim().toLowerCase();
    };
    return deviationTabs.filter(
      (t) => deviationTabStage[t] < cur && !isSkipped(deviationTabStage[t])
    );
  }, [m.formData, m.workflowConfig]);

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
      .filter((it) => {
        const subject = it.Product || it.Equipment || it.Instrument || it.Area || "";
        return (filters.Status === "All" || it.Status === filters.Status) &&
          (filters.DeviationScope === "All" || it.DeviationScope === filters.DeviationScope) &&
          (filters.Classification === "All" || it.Classification === filters.Classification) &&
          (!filters.Subject || has(subject, filters.Subject)) &&
          (!filters.Department || has(it.Department, filters.Department));
      });
  }, [m.list, filters]);

  const handlePrint = useCallback(() => {
    printWorkflow.openPrintFor(m.formData?.Id, {
      fileName: m.formData?.RecordNo || `Deviation-${m.formData?.Id}`,
      contextLabel: m.formData?.Department,
    });
  }, [m.formData, printWorkflow]);

  if (printWorkflow.isOpen) {
    return (
      <div className="h-full w-full">
        <ERPPrintPreview title="Deviation Report" {...printWorkflow.printProps} />
      </div>
    );
  }
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
          completedTabs={completedTabs}
          hideSidebar={false}
          hideTabBar={false}
          showSettingsTab
          sidebarConfig={{ hidePhoto: true, hideHeader: true }}
          stageHistory={m.history?.stageHistory || null}
          recordHistory={m.history}
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
          onPrint={handlePrint}
          onNewEntry={m.handleAddNewGuarded}
          canPrint={true}
          onCancel={m.handleTabExit}
          onEditCancel={m.handleFormExit}
          currentRecord={m.list.length ? m.currentIndex + 1 : 0}
          totalRecords={m.list.length}
          onPrevRecord={() => m.setCurrentIndex((p) => Math.max(p - 1, 0))}
          onNextRecord={() => m.setCurrentIndex((p) => Math.min(p + 1, m.list.length - 1))}
          headerActiveTab={m.activeTab}
          onHeaderTabChange={m.handleHeaderTabChange}
          onSaveDraft={m.handleSaveDraft}
          moduleKey="deviation"
          rightSidebarConfig={{ showAttachments: true, }}
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
        onAdd={m.rights?.add === 1 ? m.handleAddNewGuarded : null}
        onRowDoubleClick={m.handleRowSelect}
        onDeleteMultiple={m.handleDeleteMultiple}
        onToggleFilter={() => setShowFilter((p) => !p)}
        showForm={showFilter}
        formComponent={
          <UnivarsalFilter
            filters={filters}
            setFilters={setFilters}
            visibleFields={["status", "deviationScope", "subject", "classification", "department"]}
            options={{
              ...m.groupOptions,
              status: STATUS_OPTIONS,
              deviationScope: ["Product / Batch", "Equipment", "Instrument", "Facility / Area", "Process", "Document / System", "Utility"],
            }}
            onApply={() => { }}
            onClear={clearFilter}
            setShowFilter={setShowFilter}
          />
        }
      />
    </div>
  );
}