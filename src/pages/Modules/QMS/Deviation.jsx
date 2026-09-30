import { useState, useCallback, useMemo, useEffect } from "react";
import Table from "../../../components/Reusable/table/Table";
import ERPFormBuilder from "../../../components/Reusable/form/ERPFormBuilder";
import UnivarsalFilter from "../../../components/Reusable/Filter/UnivarsalFilter.jsx";
import RecordAuditPanel from "./Utils/RecordAuditPanel.jsx";
import { getHeaderStyle,  renderStage, renderRejected, renderDraft } from "./Utils/QmsValidation";
import { useQmsModule } from "./Utils/useQmsModule";
import { useRefOptions } from "./Utils/useRefOptions";
import ERPPrintPreview from "../../../components/Reusable/ERPPrintPreview.jsx";
import * as FaIcons from "react-icons/fa";
import {
  deviationTabs, deviationTabStage, deviationTabLabels,
  getDeviationFieldGroups, getDeviationRequired,
  deviationWidthConfig, deviationSectionConfigs, deviationAutoFieldMap, 
} from "./Utils/Qmsconfigs";
import {
  getDeviations, getDeviation, createDeviation, updateDeviation, deleteDeviation,getMyWork,
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
    { Department: "Engineering", RoleTitle: "Engineering Head" },
    { Department: "Stores", RoleTitle: "Warehouse Head" },
    { Department: "Production", RoleTitle: "Production Head" },
    { Department: "Quality Control", RoleTitle: "QC Head" },
    { Department: "Administration/HR", RoleTitle: "Administration Head" },
    { Department: "Purchase", RoleTitle: "Purchase Head" },
    { Department: "Any other dept.", exemptFromLock: true },
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
  { key: "Status", label: "Stage", render: (r) => (r.Status === "Rejected" ? (r.RejectedFromStage || "—") : r.Status) },
  { key: "Rejected", label: "Rejected", render: (r) => r.Status === "Rejected" ? "Yes" : "No" },
  { key: "IsDraft", label: "Is Draft", render: (r) => r.IsDraft ? "Yes" : "No" },
];

// Columns for the Logbook (PDF) — no Rejected / Is Draft columns
const fmtD = (v) => { const s = (v || "").slice(0, 10); const [y, m, d] = s.split("-"); return d ? `${d}-${m}-${y}` : "—"; };
const daysOpen = (r) => {
  const from = r.OccurrenceDate ? new Date(r.OccurrenceDate) : null;
  if (!from) return "—";
  const to = r.ClosedOn ? new Date(r.ClosedOn) : new Date();
  return String(Math.max(0, Math.round((to - from) / 86400000)));
};

// Widths total = 96% (Sr column takes 4%)
const LOGBOOK_COLUMNS = [
  { key: "RecordNo",       label: "Record No.",      pdfWidth: "11%" },
  { key: "OccurrenceDate", label: "Date",            pdfWidth: "8%",  align: "center", render: (r) => fmtD(r.OccurrenceDate) },
  { key: "Product",        label: "Product / Batch", pdfWidth: "18%", render: (r) => r.Product ? `${r.Product}${r.BatchNo ? ` · ${r.BatchNo}` : ""}` : "—" },
  { key: "Classification", label: "Class",           pdfWidth: "7%",  align: "center", render: (r) => r.Classification || "—" },
  { key: "Department",     label: "Department",      pdfWidth: "12%" },
  { key: "ReportedBy",     label: "Reported By",     pdfWidth: "9%", render: (r) => r.ReportedBy || "—" },
  { key: "Status",         label: "Status",          pdfWidth: "11%", render: (r) => r.Status === "Rejected" ? `Rejected (${r.RejectedFromStage || "—"})` : r.Status },
  { key: "ClosedOn",       label: "Closed On",       pdfWidth: "8%",  align: "center", render: (r) => fmtD(r.ClosedOn) },
  { key: "DaysOpen",       label: "Days",            pdfWidth: "4%",  align: "center", render: daysOpen },
  { key: "CapaRef",        label: "CAPA Ref",        pdfWidth: "8%",  render: (r) => r.CapaRef || "—" },
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
    autoFieldMap: deviationAutoFieldMap,
  });

  const printWorkflow = usePrintWorkflow({
    printBaseUrl: '/api/qms-print/deviation',
    applName: 'deviation',
    emailEndpoint: '/api/qms-print/deviation',
    shareLinkEndpoint: '/api/qms-print/deviation',
  });
  const refOpts = useRefOptions(["incident"]);

const fieldGroups = useMemo(
  () => getDeviationFieldGroups({ ...m.groupOptions, refOpts, recordNoEditable: m.recordNoEditable, auto: m.auto }),
  [m.groupOptions, refOpts, m.recordNoEditable, m.auto]
);

useEffect(() => {
  getMyWork().then((r) => console.log("MYWORK", r));
}, []);
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
  const ModuleIcon = useMemo(() => {
    const name = tab?.icon_name || tab?.module?.icon_name;
    return (name && FaIcons[name]) || FaClipboardList;
  }, [tab?.icon_name, tab?.module?.icon_name]);

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

    const logbookConfig = useMemo(() => ({
    company: "LOGIX INFOTECH LLP",          // TODO: replace with company name from your session/company context
    subtitle: "Quality Management System",
    title: "DEVIATION LOGBOOK",
    description: "Chronological Register of Quality Deviations",
    code: "DEV",
    columns: LOGBOOK_COLUMNS,
    dateKey: "OccurrenceDate",
    statusKey: "Status",
    excludeRow: (r) => !!r.IsDraft,         // drafts never appear in the logbook
    generatedBy: m.currentUserName,
  }), [m.currentUserName]);

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
          subtitle={m.formData?.RecordNo || "New"}
          TitleIcon={ModuleIcon}
          tabs={deviationTabs}
          tabLabels={deviationTabLabels}
          tabStage={deviationTabStage}
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
          isRecordClosed={m.isRecordClosed}
          currentUserName={m.currentUserName}
          alwaysSignTabs={["closure"]}
          settingsConfig={m.settingsConfig}
          settingsDefaults={m.settingsDefaults}
          onSettingsSave={m.onSettingsSave}
          onSave={m.handleSave}
          onSignedSave={m.handleSignedSave}
          onDelete={m.handleDelete}
          onModify={m.handleModifyGuarded}
          onPrint={handlePrint}
          onNewEntry={m.handleAddNewGuarded}
          canPrint={m.canPrint}
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

        TitleIcon={ModuleIcon}
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
        logbook={logbookConfig}
      />
    </div>
  );
}