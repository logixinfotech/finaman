import { useState, useCallback, useMemo } from "react";
import { FaClipboardList, FaCheckCircle, FaSearch, FaFlagCheckered, FaHistory } from "react-icons/fa";
import Table from "../../../components/Reusable/table/Table";
import ERPFormBuilder from "../../../components/Reusable/form/ERPFormBuilder";
import UnivarsalFilter from "../../../components/Reusable/Filter/UnivarsalFilter.jsx";
import RecordAuditPanel from "./Utils/RecordAuditPanel.jsx";
import { getHeaderStyle } from "./Utils/QmsValidation";
import { useQmsModule } from "./Utils/useQmsModule";
import { usePrintWorkflow } from "../../../Hooks/usePrintWorkflow.js";
import ERPPrintPreview from "../../../components/Reusable/ERPPrintPreview.jsx";
import * as FaIcons from "react-icons/fa";
import {
  incidentTabs, incidentTabStage, incidentTabLabels,
  getIncidentFieldGroups, getIncidentRequired,
  incidentWidthConfig, incidentSectionConfigs, incidentTableColumns,
} from "./Utils/Qmsconfigs";
import { getIncidents, getIncident, createIncident, updateIncident, deleteIncident } from "./Utils/QmsAPI";

const API = {
  list: getIncidents, getOne: getIncident,
  create: createIncident, update: updateIncident, remove: deleteIncident,
};

const initialState = {
  Id: null, RecordNo: "", Status: "Reported",
  IncidentDate: new Date().toISOString().slice(0, 10),
  IncidentTime: "", Shift: "", Area: "", Category: "",
  OtherCategoryDetail: "", Severity: "", Description: "",
  ReportedBy: "", WitnessedBy: "", EquipmentInvolved: "",
  Product: "", ProductBatch: "", AttachmentRef: "", ImmediateAction: "",
  ReviewedBy: "", ReviewDate: "", ImpactAssessment: "",
  DeviationRaised: "", DeviationRef: "", EscalatedTo: "",
  InvestigatedBy: "", RootCause: "", InvestigationSummary: "",
  CapaRef: "", TargetDate: "", ClosedBy: "", ClosureRemarks: "",
  Department: "", Designation: "", ReportedOn: "",
  ItemType: "", DocumentNo: "", ArNo: "", CodeNo: "",
  SupplierName: "", SupplierReceiptDate: "", SupplierQty: "",
  ImmediateActionDocRef: "", RelatedTo: "", RelatedToOther: "",
  PersonInvolved: "", Counselor: "", InterviewOutcome: "",
  PointsDiscussed: "", InterviewConclusion: "",
  RepeatIncident: "", RepeatIncidentDetail: "",
  ImpactDecision: "", CampaignBatches: "",
  InvestigationPlan: "",
  PlanSignDeptBy: "", PlanSignDeptOn: "", PlanSignQaBy: "", PlanSignQaOn: "",
  InvestigationStartDate: "", InvestigationCompletionDate: "", RcaMethod: "",
  CauseIdentified: "", InvestigationExtended: "", InvestExtensionPeriod: "",
  ExternalHelpRequired: "", ExternalHelpDetail: "",
  ExtInvestClosedBy: "", ExtInvestClosedOn: "",
  CapaRequired: "", CorrectiveAction: "", PreventiveAction: "",
  CapaProposedBy: "", CapaProposedOn: "", CapaApprovedQaBy: "", CapaApprovedQaOn: "",
  AuthorizationStatus: "", AuthorizedBy: "", AuthorizedOn: "",
  InterimClosureRemarks: "",
  CapaVerificationStatus: "", CapaVerifiedBy: "", CapaVerifiedOn: "",
  ClosedOn: "",

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

const INC_TAB_ICON = {
  reported: FaClipboardList,
  review: FaCheckCircle,
  investigation: FaSearch,
  closure: FaFlagCheckered,
  audit: FaHistory,
};
function IncidentTabIcon({ tab }) {
  const Icon = INC_TAB_ICON[tab];
  return Icon ? <Icon /> : <span>•</span>;
}

const STATUS_OPTIONS = ["Reported", "Under Review", "Under Investigation", "Pending Closure", "Closed", "Rejected"];
const EMPTY_FILTERS = { Status: "All", Area: "", Severity: "All" };

export default function IncidentMasterPage({ tab }) {
  const m = useQmsModule({
    moduleKey: "incident",
    title: "Incident",
    applName: tab?.appl_name || "Incidents",
    initialState,
    tabs: incidentTabs,
    tabStage: incidentTabStage,
    getRequired: getIncidentRequired,
    api: API,
  });

  const printWorkflow = usePrintWorkflow({
    printBaseUrl: '/api/qms-print/incident',
    applName: 'incident',
    emailEndpoint: '/api/qms-print/incident',
    shareLinkEndpoint: '/api/qms-print/incident',
  });

  const fieldGroups = useMemo(
    () => getIncidentFieldGroups(m.groupOptions),
    [m.groupOptions]
  );

  const customTabs = useMemo(
    () => ({ audit: <RecordAuditPanel history={m.history} /> }),
    [m.history]
  );

  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [showFilter, setShowFilter] = useState(false);
  const clearFilter = useCallback(() => setFilters(EMPTY_FILTERS), []);

  const filteredList = useMemo(() => {
    const has = (v, f) => String(v || "").toLowerCase().includes(f.toLowerCase());
    return m.list
      .map((item, i) => ({ ...item, Sr: i + 1, Status: item.Status || "Reported" }))
      .filter((it) =>
        (filters.Status === "All" || it.Status === filters.Status) &&
        (!filters.Area || has(it.Area, filters.Area)) &&
        (filters.Severity === "All" || it.Severity === filters.Severity)
      );
  }, [m.list, filters]);
  const ModuleIcon = useMemo(() => {
    const name = tab?.icon_name || tab?.module?.icon_name;
    return (name && FaIcons[name]) || FaClipboardList;
  }, [tab?.icon_name, tab?.module?.icon_name]);

  const handlePrint = useCallback(() => {
    printWorkflow.openPrintFor(m.formData?.Id, {
      fileName: m.formData?.RecordNo || `Incident-${m.formData?.Id}`,
      contextLabel: m.formData?.Area,
    }).catch((err) => console.error('Print open failed:', err));
  }, [m.formData, printWorkflow]);

  if (printWorkflow.isOpen) {
    return (
      <div className="h-full w-full">
        <ERPPrintPreview title="Incident Report" {...printWorkflow.printProps} />
      </div>
    );
  }

  if (m.showForm) {
    return (
      <div className="h-full w-full">
        <ERPFormBuilder
          title="Incident"
          subtitle={m.formData?.RecordNo || "New"}
          TitleIcon={ModuleIcon}
          tabs={incidentTabs}
          tabLabels={incidentTabLabels}
          tabStage={incidentTabStage}
          TabIcon={IncidentTabIcon}
          fieldGroups={fieldGroups}
          customTabs={customTabs}
          configs={incidentSectionConfigs}
          widthConfig={incidentWidthConfig}
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
          canPrint={m.canPrint}
          onNewEntry={m.handleAddNewGuarded}
          onCancel={m.handleTabExit}
          onEditCancel={m.handleFormExit}
          currentRecord={m.list.length ? m.currentIndex + 1 : 0}
          totalRecords={m.list.length}
          onSaveDraft={m.handleSaveDraft}
          onPrevRecord={() => m.setCurrentIndex((p) => Math.max(p - 1, 0))}
          onNextRecord={() => m.setCurrentIndex((p) => Math.min(p + 1, m.list.length - 1))}
          headerActiveTab={m.activeTab}
          onHeaderTabChange={m.handleHeaderTabChange}
          moduleKey="incident"
        />
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <Table
        title="Incident"
        TitleIcon={ModuleIcon}
        data={filteredList}
        columns={incidentTableColumns}
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
            setShowFilter={setShowFilter}
            setFilters={setFilters}
            visibleFields={["status", "area", "severity"]}
            options={{ ...m.groupOptions, status: STATUS_OPTIONS }}
            onApply={() => { }}
            onClear={clearFilter}
          />
        }
      />
    </div>
  );
}