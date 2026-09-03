import { useState, useCallback, useMemo } from "react";
import {
  FaClipboardList, FaSearch, FaTasks, FaSpinner,
  FaCheckDouble, FaChartLine, FaHistory,
} from "react-icons/fa";
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
// ── module-level constants (component ke bahar — stable references) ──
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

  const refOpts = useRefOptions(["changecontrol", "dms", "training", "deviation", "incident", "audit", "capa"]);   // 🆕

  const fieldGroups = useMemo(
    () => getCapaFieldGroups({ ...m.groupOptions, refOpts }),   // 🆕
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
      .map((item, i) => ({ ...item, Sr: i + 1, Status: item.Status || "Open" }))
      .filter((it) =>
        (filters.Status === "All" || it.Status === filters.Status) &&
        (filters.SourceType === "All" || it.SourceType === filters.SourceType) &&
        (!filters.Department || has(it.Department, filters.Department))
      );
  }, [m.list, filters]);

  if (m.showForm) {
    return (
      <div className="h-full w-full">
        <ERPFormBuilder
          title="CAPA"
          tabs={capaTabs}
          tabLabels={capaTabLabels}
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
          onSave={m.handleSave}
             onSaveDraft={m.handleSaveDraft}
          onSignedSave={m.handleSignedSave}
          onDelete={m.handleDelete}
          onModify={m.handleModify}
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