import { useState, useCallback, useMemo } from "react";
import {
  FaEnvelopeOpenText, FaSearch, FaSitemap,
  FaReply, FaFlagCheckered, FaHistory,
  FaClipboardList,
} from "react-icons/fa";
import * as FaIcons from "react-icons/fa";

import Table from "../../../components/Reusable/table/Table";
import ERPFormBuilder from "../../../components/Reusable/form/ERPFormBuilder";
import UnivarsalFilter from "../../../components/Reusable/Filter/UnivarsalFilter.jsx";
import RecordAuditPanel from "./Utils/RecordAuditPanel.jsx";
import { getHeaderStyle } from "./Utils/QmsValidation";
import { useQmsModule } from "./Utils/useQmsModule";
import {
  complaintTabs, complaintTabStage, complaintTabLabels,
  getComplaintFieldGroups, getComplaintRequired,
  complaintWidthConfig, complaintSectionConfigs, complaintTableColumns,
} from "./Utils/Qmsconfigs";
import { getComplaints, getComplaint, createComplaint, updateComplaint, deleteComplaint } from "./Utils/QmsAPI";
import { usePrintWorkflow } from "../../../Hooks/usePrintWorkflow.js";
import ERPPrintPreview from "../../../components/Reusable/ERPPrintPreview.jsx";
const API = {
  list: getComplaints, getOne: getComplaint,
  create: createComplaint, update: updateComplaint, remove: deleteComplaint,
};

const initialState = {
  Id: null, RecordNo: "", Status: "Received",
  ReceivedDate: new Date().toISOString().slice(0, 10),
  Source: "", ComplainantName: "", ComplainantContact: "", ComplainantType: "",
  Product: "", BatchNo: "", MfgDate: "", ExpDate: "", QtyComplained: "",
  ComplaintType: "", Category: "", Severity: "", Description: "",
  SampleReceived: "", SampleCondition: "",
  AcknowledgementDate: "", AcknowledgedBy: "", TargetDate: "",
  InvestigatedBy: "", InvestigationDate: "",
  SampleAnalysis: "", ControlSampleReview: "", InvestigationSummary: "", SimilarComplaints: "",
  ComplaintConfirmed: "", RootCauseCategory: "", RootCause: "",
  ImpactOnOtherBatches: "", ReviewedBy: "", AdverseEventReportable: "",
  DeviationRef: "", CapaRef: "", RecallRequired: "", RecallRef: "",
  ResponseDate: "", ResponseMode: "", RespondedBy: "",
  ReplacementIssued: "", CreditNoteNo: "", CorrectiveAction: "",
  EffectivenessCheck: "", ClosedBy: "", ClosureRemarks: "",
  BatchSize: "", PackStyle: "", TypeOfPacking: "", PartyName: "",
  ModeOfReceipt: "", ComplaintReportedBy: "", ComplaintForwardedBy: "",
  ComplaintRelatedTo: "", ComplaintRelatedToOther: "",
  SampleReceiptDate: "", SampleFollowUp: "", SampleGenuine: "",
  SampleDescription: "", SampleStorageCondition: "",
  DepartmentsInvolved: "", InvestigationMethodology: "",
  ImpactAssessmentJustification: "", ImpactSignQaBy: "", ImpactSignQaOn: "",
  ReviewApproval: "", ReviewSignQaBy: "", ReviewSignQaOn: "",
  InvestigationReportSummary: "", CapaTcd: "",
  CapaReviewByPlantHead: "", PlantHeadSignBy: "", PlantHeadSignOn: "",
  CapaImplementation: "",
  CapaImplProdHeadBy: "", CapaImplProdHeadOn: "",
  CapaImplQaHeadBy: "", CapaImplQaHeadOn: "",
  Response30Days: "",

  history: [
    { Scenario: "Same product, same batch" },
    { Scenario: "Same product, different batch" },
    { Scenario: "Different product" },
  ],
  deptreview: [], recallbatches: [], extensions: [],
};

const CMP_TAB_ICON = {
  received: FaEnvelopeOpenText,
  investigation: FaSearch,
  rootcause: FaSitemap,
  response: FaReply,
  closure: FaFlagCheckered,
  audit: FaHistory,
};
function ComplaintTabIcon({ tab }) {
  const Icon = CMP_TAB_ICON[tab];
  return Icon ? <Icon /> : <span>•</span>;
}

const STATUS_OPTIONS = [
  "Received", "Under Investigation", "Root Cause Identified",
  "Response Sent", "Pending Closure", "Closed", "Rejected",
];

const EMPTY_FILTERS = { Status: "All", Product: "", Severity: "All", Category: "All" };

export default function MarketComplaintMasterPage({ tab }) {
  const m = useQmsModule({
    moduleKey: "complaint",
    title: "Market Complaint",
    applName: tab?.appl_name || "Complaint",
    initialState,
    tabs: complaintTabs,
    tabStage: complaintTabStage,
    getRequired: getComplaintRequired,
    api: API,
  });
  const printWorkflow = usePrintWorkflow({
    printBaseUrl: '/api/qms-print/complaint',
    applName: 'complaint',
    emailEndpoint: '/api/qms-print/complaint',
    shareLinkEndpoint: '/api/qms-print/complaint',
  });
  const fieldGroups = useMemo(
    () => getComplaintFieldGroups(m.groupOptions),
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
      .map((item, i) => ({ ...item, Sr: i + 1, Status: item.Status || "Received" }))
      .filter((it) =>
        (filters.Status === "All" || it.Status === filters.Status) &&
        (filters.Severity === "All" || it.Severity === filters.Severity) &&
        (filters.Category === "All" || it.Category === filters.Category) &&
        (!filters.Product || has(it.Product, filters.Product))
      );
  }, [m.list, filters]);
  const ModuleIcon = useMemo(() => {
    const name = tab?.icon_name || tab?.module?.icon_name;
    return (name && FaIcons[name]) || FaClipboardList;
  }, [tab?.icon_name, tab?.module?.icon_name]);
  const handlePrint = useCallback(() => {
    printWorkflow.openPrintFor(m.formData?.Id, {
      fileName: m.formData?.RecordNo || `Complaint-${m.formData?.Id}`,
      contextLabel: m.formData?.Product,
    });
  }, [m.formData, printWorkflow]);

  if (printWorkflow.isOpen) {
    return (
      <div className="h-full w-full">
        <ERPPrintPreview title="Market Complaint Report" {...printWorkflow.printProps} />
      </div>
    );
  }
  if (m.showForm) {
    return (
      <div className="h-full w-full">
        <ERPFormBuilder
          title="Market Complaint"
          subtitle={m.formData?.RecordNo || "New"}
          TitleIcon={ModuleIcon}
          tabs={complaintTabs}
          tabLabels={complaintTabLabels}
          tabStage={complaintTabStage}
          TabIcon={ComplaintTabIcon}
          fieldGroups={fieldGroups}
          customTabs={customTabs}
          configs={complaintSectionConfigs}
          widthConfig={complaintWidthConfig}
          getHeaderStyle={getHeaderStyle}
          requiredFields={m.requiredFields}
          completedTabs={m.completedTabs}
          hideSidebar={false}
          hideTabBar={false}
          showSettingsTab
          sidebarConfig={{ hidePhoto: true, hideHeader: true }}
          stageHistory={m.history?.stageHistory || null}
          recordHistory={m.history}
          moduleKey="complaint"
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
          onSaveDraft={m.handleSaveDraft}
          onSignedSave={m.handleSignedSave}
          onDelete={m.handleDelete}
          onModify={m.handleModifyGuarded}
          onNewEntry={m.handleAddNewGuarded}
          onPrint={handlePrint}
          canPrint={m.canPrint}
          onCancel={m.handleTabExit}
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
        title="Market Complaint"
        TitleIcon={ModuleIcon}
        data={filteredList}
        columns={complaintTableColumns}
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
            visibleFields={["status", "product", "severity", "category"]}
            options={{
              ...m.groupOptions,
              status: STATUS_OPTIONS,
              severity: ["Critical", "Major", "Minor"],
              category: ["Product Quality", "Physical Defect", "Packing / Labelling", "Contamination", "Efficacy", "Shortage / Count", "Other"],
            }}
            onApply={() => { }}
            onClear={clearFilter}
          />
        }
      />
    </div>
  );
}