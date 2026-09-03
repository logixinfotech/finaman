import { useState, useCallback, useMemo } from "react";
import {
  FaClipboardList, FaBalanceScale, FaStamp,
  FaCogs, FaChartLine, FaFlagCheckered, FaHistory,
} from "react-icons/fa";
import Table from "../../../components/Reusable/table/Table";
import ERPFormBuilder from "../../../components/Reusable/form/ERPFormBuilder";
import UnivarsalFilter from "../../../components/Reusable/Filter/UnivarsalFilter.jsx";
import RecordAuditPanel from "./Utils/RecordAuditPanel.jsx";
import { getHeaderStyle } from "./Utils/QmsValidation";
import { useQmsModule } from "./Utils/useQmsModule";
import { useRefOptions } from "./Utils/useRefOptions";
import {
  changeControlTabs, changeControlTabStage, changeControlTabLabels,
  getChangeControlFieldGroups, getChangeControlRequired,
  changeControlWidthConfig, changeControlSectionConfigs, changeControlTableColumns,
} from "./Utils/Qmsconfigs";
 import { getChangeControls, getChangeControl, createChangeControl, updateChangeControl, deleteChangeControl } from "./Utils/QmsAPI";
import { usePrintWorkflow } from "../../../Hooks/usePrintWorkflow.js";
import ERPPrintPreview from "../../../components/Reusable/ERPPrintPreview.jsx";
// ── module-level constants (component ke bahar — stable references) ──
const API = {
  list: getChangeControls, getOne: getChangeControl,
  create: createChangeControl, update: updateChangeControl, remove: deleteChangeControl,
};

const initialState = {
  Id: null, RecordNo: "", Status: "Draft",
  InitiationDate: new Date().toISOString().slice(0, 10),
  Department: "", InitiatedBy: "", ChangeType: "", Product: "",
  ChangeNature: "", Classification: "", CapaRef: "",  
  CurrentState: "", ProposedChange: "", Justification: "",
  AssessedBy: "", AssessmentDate: "", TrainingImpact: "",
  ValidationImpact: "", RegulatoryImpact: "", RiskAssessmentRef: "",
  ImpactAssessment: "", AffectedDocuments: "",
  CftMembers: "", ApprovedBy: "", ApprovalDate: "", RejectionReason: "",
  ImplementationPlan: "", TargetDate: "", ImplementedBy: "",
  ActualImplementationDate: "", EffectivenessCheck: "",
  DmsRef: "", TrainingRef: "",
  ClosedBy: "", ClosedOn: "", ClosureRemarks: "",
    ChangeRelatedTo: "", ChangeRelatedToOther: "",
  AttachmentDetails: "", PlannedDeviationData: "",
  AttachInitiatedBy: "", AttachInitiatedOn: "", AttachCheckedQaBy: "", AttachCheckedQaOn: "",
  EvalDoneQaBy: "", EvalDoneQaOn: "", EvalCheckedQaBy: "", EvalCheckedQaOn: "",
  ApprovalStatus: "", ApprovalRemarks: "",
  PlanCheckedQaBy: "", PlanCheckedQaOn: "", PlanReviewedQaBy: "", PlanReviewedQaOn: "",
  NewChangeControlRaised: "",
  DiscontinueRequested: "", DiscontinueProposedAction: "",
  DiscontinueJustification: "", DiscontinueSupportingDoc: "",
  DiscPreparedBy: "", DiscPreparedOn: "", DiscDeptHeadBy: "", DiscDeptHeadOn: "",
  DiscQaHeadBy: "", DiscQaHeadOn: "",
  StpImpact: "", DmsImpact: "", DmsChangeNature: "", StpChangeNature: "",
  ExistingDmsRef: "", ExistingStpRef: "", QualificationRef: "", StpRef: "",
  RiskAssessmentRequired: "",

  evalmatrix: [
    { CheckPoint: "Product Identity" }, { CheckPoint: "Product Safety" },
    { CheckPoint: "Product Strength" }, { CheckPoint: "Product Stability" },
    { CheckPoint: "Product Efficacy" },
  ],
  deptreview: [], actionplan: [], actionimpl: [], extensions: [],
};

const CC_TAB_ICON = {
  details: FaClipboardList,
  impact: FaBalanceScale,
  approval: FaStamp,
  implementation: FaCogs,
  review: FaChartLine,
  closure: FaFlagCheckered,
  audit: FaHistory,
};
function ChangeControlTabIcon({ tab }) {
  const Icon = CC_TAB_ICON[tab];
  return Icon ? <Icon /> : <span>•</span>;
}

const STATUS_OPTIONS = [
  "Draft", "Impact Assessment", "Pending Approval", "Implementation",
  "Effectiveness Review", "Pending Closure", "Closed", "Rejected",
];

const EMPTY_FILTERS = { Status: "All", Department: "", Classification: "All" };

export default function ChangeControlMasterPage({ tab }) {
  const m = useQmsModule({
    moduleKey: "changecontrol",
    title: "Change Control",
    applName: tab?.appl_name || "ChangeControl",
    initialState,
    tabs: changeControlTabs,
    tabStage: changeControlTabStage,
    getRequired: getChangeControlRequired,
    api: API,
  });

  const printWorkflow = usePrintWorkflow({
    printBaseUrl: '/api/qms-print/changecontrol',   // ✅ moduleKey 'changecontrol' se match
    applName: 'changecontrol',
    emailEndpoint: '/api/qms-print/changecontrol',
    shareLinkEndpoint: '/api/qms-print/changecontrol',
  });

  const refOpts = useRefOptions(["capa", "dms", "stp"]);   // 🆕

  const fieldGroups = useMemo(
    () => getChangeControlFieldGroups({ ...m.groupOptions, refOpts }),   // 🆕
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
      .map((item, i) => ({ ...item, Sr: i + 1, Status: item.Status || "Draft" }))
      .filter((it) =>
        (filters.Status === "All" || it.Status === filters.Status) &&
        (filters.Classification === "All" || it.Classification === filters.Classification) &&
        (!filters.Department || has(it.Department, filters.Department))
      );
  }, [m.list, filters]);

  const handlePrint = useCallback(() => {
    printWorkflow.openPrintFor(m.formData?.Id, {
      fileName: m.formData?.RecordNo || `ChangeControl-${m.formData?.Id}`,
      contextLabel: m.formData?.Department,
    }).catch((err) => console.error('Print open failed:', err));
  }, [m.formData, printWorkflow]);

  if (printWorkflow.isOpen) {
    return (
      <div className="h-full w-full">
        <ERPPrintPreview title="Change Control Report" {...printWorkflow.printProps} />
      </div>
    );
  }

  if (m.showForm) {
    return (
      <div className="h-full w-full">
        <ERPFormBuilder
          title="Change Control"
          tabs={changeControlTabs}
          tabLabels={changeControlTabLabels}
          TabIcon={ChangeControlTabIcon}
          fieldGroups={fieldGroups}
          customTabs={customTabs}
          configs={changeControlSectionConfigs}
          widthConfig={changeControlWidthConfig}
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
          onCancel={m.handleTabExit}
          onEditCancel={m.handleFormExit}
          currentRecord={m.list.length ? m.currentIndex + 1 : 0}
          totalRecords={m.list.length}
          onPrevRecord={() => m.setCurrentIndex((p) => Math.max(p - 1, 0))}
          onNextRecord={() => m.setCurrentIndex((p) => Math.min(p + 1, m.list.length - 1))}
          headerActiveTab={m.activeTab}
          onHeaderTabChange={m.handleHeaderTabChange}
          moduleKey="changecontrol"
        />
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <Table
        title="Change Control"
        data={filteredList}
        columns={changeControlTableColumns}
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
            visibleFields={["status", "department", "classification"]}
            options={{
              ...m.groupOptions,
              status: STATUS_OPTIONS,
              classification: ["Minor", "Major", "Critical"],
            }}
            onApply={() => { }}
            onClear={clearFilter}
          />
        }
      />
    </div>
  );
}