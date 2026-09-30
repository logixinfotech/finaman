import { useState, useCallback, useMemo } from "react";
import {
  FaClipboardList, FaSearch, FaTasks, FaSpinner,
  FaCheckDouble, FaChartLine, FaHistory,

} from "react-icons/fa";
import * as FaIcons from "react-icons/fa";
import Table from "../../../components/Reusable/table/Table";
import ERPFormBuilder from "../../../components/Reusable/form/ERPFormBuilder";
import UnivarsalFilter from "../../../components/Reusable/Filter/UnivarsalFilter.jsx";
import RecordAuditPanel from "./Utils/RecordAuditPanel.jsx";
import { getHeaderStyle } from "./Utils/QmsValidation";
import { useQmsModule } from "./Utils/useQmsModule";
import { useRefOptions } from "./Utils/useRefOptions";
import {
  capaTabs, capaTabStage, capaTabLabels,
  getCapaFieldGroups, getCapaRequired,
  capaWidthConfig, capaSectionConfigs, capaTableColumns,
} from "./Utils/Qmsconfigs";
import { getCapas, getCapa, createCapa, updateCapa, deleteCapa } from "./Utils/QmsAPI";
import { usePrintWorkflow } from "../../../Hooks/usePrintWorkflow.js";
import ERPPrintPreview from "../../../components/Reusable/ERPPrintPreview.jsx";
const API = {
  list: getCapas, getOne: getCapa,
  create: createCapa, update: updateCapa, remove: deleteCapa,
};

const initialState = {
  Id: null, RecordNo: "", Status: "Open",
  InitiationDate: new Date().toISOString().slice(0, 10),
  SourceType: "", SourceRef: "", SourceId: null,
  CapaType: "", Department: "", Priority: "", Owner: "", AttachmentRef: "",
  RcaMethod: "", ProblemStatement: "", RootCause: "",
  RcaCompletedBy: "", RcaDate: "",
  Correction: "", CorrectiveAction: "", PreventiveAction: "",
  ResponsiblePerson: "", TargetDate: "",
  ApprovedBy: "", ApprovalDate: "", RejectionReason: "",
  RevisedTargetDate: "", ExtensionReason: "", ProgressRemarks: "",
  ImplementationEvidence: "", ImplementationDate: "",
  VerifiedBy: "", VerificationDate: "",
  ChangeControlRef: "", DmsRef: "", TrainingRef: "",
  EffectivenessCriteria: "", EffectivenessDueDate: "",
  EffectivenessResult: "", EffectivenessReviewedBy: "",
  ClosedBy: "", ClosureRemarks: "",
  InitiatedBy: "", ProposedBy: "", ProposedOn: "",
  Investigation: "",
  CorrectiveTargetDate: "", PreventiveTargetDate: "",
  CaInitiatedBy: "", CaInitiatedOn: "", CaVerifiedQaBy: "", CaVerifiedQaOn: "",
  CaDeptHeadBy: "", CaDeptHeadOn: "",
  PaInitiatedBy: "", PaInitiatedOn: "", PaVerifiedQaBy: "", PaVerifiedQaOn: "",
  PaDeptHeadBy: "", PaDeptHeadOn: "",
  ApprovalStatus: "",
  EvaluationReview: "", EffectivenessRequired: "",
  EvalDeptHeadBy: "", EvalDeptHeadOn: "", EvalQaHeadBy: "", EvalQaHeadOn: "",
  EffVerificationRequired: "", EffReasonIfNotRequired: "",
  EffReasonSignBy: "", EffReasonSignOn: "",
  EffDeptHeadComment: "", EffDeptHeadBy: "", EffDeptHeadOn: "",
  EffQaHeadComment: "", EffQaHeadBy: "", EffQaHeadOn: "",
  InvestigationRefIfNotEffective: "", NewCapaNo: "", CommentsIfNotEffective: "",
  NotEffectiveSignBy: "", NotEffectiveSignOn: "",
  ClosingDate: "",
  extensions: [],
};

const CAPA_TAB_ICON = {
  details: FaClipboardList,
  rca: FaSearch,
  plan: FaTasks,
  progress: FaSpinner,
  verification: FaCheckDouble,
  effectiveness: FaChartLine,
  audit: FaHistory,
};
function CapaTabIcon({ tab }) {
  const Icon = CAPA_TAB_ICON[tab];
  return Icon ? <Icon /> : <span>•</span>;
}

const STATUS_OPTIONS = [
  "Open", "RCA Pending", "Plan Pending", "Action In Progress",
  "Verification Pending", "Effectiveness Check", "Closed", "Rejected",
];

const EMPTY_FILTERS = { Status: "All", Department: "", SourceType: "All" };

export default function CapaMasterPage({ tab }) {
  const m = useQmsModule({
    moduleKey: "capa",
    title: "CAPA",
    applName: tab?.appl_name || "CAPA",
    initialState,
    tabs: capaTabs,
    tabStage: capaTabStage,
    getRequired: getCapaRequired,
    api: API,
  });
  const printWorkflow = usePrintWorkflow({
    printBaseUrl: '/api/qms-print/capa',
    applName: 'capa',
    emailEndpoint: '/api/qms-print/capa',
    shareLinkEndpoint: '/api/qms-print/capa',
  });
  const refOpts = useRefOptions(["changecontrol", "dms", "training", "deviation", "incident", "audit", "capa"]);   // 🆕

  const fieldGroups = useMemo(
    () => getCapaFieldGroups({ ...m.groupOptions, refOpts }),   // 🆕
    [m.groupOptions, refOpts]
  );

  const customTabs = useMemo(
    () => ({ audit: <RecordAuditPanel history={m.history} /> }),
    [m.history]
  );

  // ── module icon (from the module this tab belongs to), used before the
  // "Deviation" title in both the list header and the form header ──────────
  const ModuleIcon = useMemo(() => {
    const name = tab?.icon_name || tab?.module?.icon_name;
    return (name && FaIcons[name]) || FaClipboardList;
  }, [tab?.icon_name, tab?.module?.icon_name]);


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
        (filters.SourceType === "All" || it.SourceType === filters.SourceType) &&
        (!filters.Department || has(it.Department, filters.Department))
      );
  }, [m.list, filters]);
  const handlePrint = useCallback(() => {
    printWorkflow.openPrintFor(m.formData?.Id, {
      fileName: m.formData?.RecordNo || `CAPA-${m.formData?.Id}`,
      contextLabel: m.formData?.Department,
    });
  }, [m.formData, printWorkflow]);

  if (printWorkflow.isOpen) {
    return (
      <div className="h-full w-full">
        <ERPPrintPreview title="CAPA Report" {...printWorkflow.printProps} />
      </div>
    );
  }
  if (m.showForm) {
    return (
      <div className="h-full w-full">
        <ERPFormBuilder
          title="CAPA"
          subtitle={m.formData?.RecordNo || "New"}
          TitleIcon={ModuleIcon}
          tabs={capaTabs}
          tabLabels={capaTabLabels}
          tabStage={capaTabStage}
          TabIcon={CapaTabIcon}
          fieldGroups={fieldGroups}
          customTabs={customTabs}
          configs={capaSectionConfigs}
          widthConfig={capaWidthConfig}
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
          alwaysSignTabs={["effectiveness"]}
          settingsConfig={m.settingsConfig}
          settingsDefaults={m.settingsDefaults}
          onSettingsSave={m.onSettingsSave}
          onPrint={handlePrint}
          canPrint={m.canPrint}
          onSave={m.handleSave}
          onSaveDraft={m.handleSaveDraft}
          onSignedSave={m.handleSignedSave}
          onDelete={m.handleDelete}
          onModify={m.handleModifyGuarded}
          onNewEntry={m.handleAddNewGuarded}
          onCancel={m.handleTabExit}
          onEditCancel={m.handleFormExit}
          currentRecord={m.list.length ? m.currentIndex + 1 : 0}
          totalRecords={m.list.length}
          onPrevRecord={() => m.setCurrentIndex((p) => Math.max(p - 1, 0))}
          onNextRecord={() => m.setCurrentIndex((p) => Math.min(p + 1, m.list.length - 1))}
          headerActiveTab={m.activeTab}
          onHeaderTabChange={m.handleHeaderTabChange}
          moduleKey="capa"
        />
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <Table
        title="CAPA"
        TitleIcon={ModuleIcon}
        data={filteredList}
        columns={capaTableColumns}
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
        onprint={m.handlePrint}
        formComponent={
          <UnivarsalFilter
            filters={filters}
            setFilters={setFilters}
            setShowFilter={setShowFilter}
            visibleFields={["status", "department", "sourceType"]}
            options={{
              ...m.groupOptions,
              status: STATUS_OPTIONS,
              sourceType: ["Deviation", "Incident", "Complaint", "Audit Finding", "Change Control", "OOS/OOT", "Management Review", "CAPA"],
            }}
            onApply={() => { }}
            onClear={clearFilter}
          />
        }
      />
    </div>
  );
}