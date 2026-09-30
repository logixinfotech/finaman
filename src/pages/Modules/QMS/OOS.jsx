import { useState, useCallback, useMemo } from "react";
import {
  FaVial, FaFlask, FaIndustry, FaGavel, FaFlagCheckered, FaHistory,
  FaClipboardList,
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
  oosTabs, oosTabStage, oosTabLabels,
  getOosFieldGroups, getOosRequired,
  oosWidthConfig, oosSectionConfigs, oosTableColumns,
} from "./Utils/Qmsconfigs";
import { getOoss, getOos, createOos, updateOos, deleteOos } from "./Utils/QmsAPI";
import { usePrintWorkflow } from "../../../Hooks/usePrintWorkflow.js";
import ERPPrintPreview from "../../../components/Reusable/ERPPrintPreview.jsx";
const API = { list: getOoss, getOne: getOos, create: createOos, update: updateOos, remove: deleteOos };

const initialState = {
  Id: null, RecordNo: "", Status: "Reported",
  ReportedDate: new Date().toISOString().slice(0, 10),
  Product: "", BatchNo: "", MfgDate: "", BatchSize: "",
  ArNo: "", Stage: "", TestParameter: "", ReportedBy: "",
  StpRef: "", SpecificationLimit: "", ObtainedResult: "",
  Analyst: "", Instrument: "", AnalysisDate: "",
  ObviousError: "", LabErrorDetails: "", Phase1Retest: "",
  Phase1Checklist: "", Phase1By: "", Phase1Date: "", Phase1Conclusion: "",
  Phase2Investigation: "", RootCause: "", OtherBatchesImpacted: "",
  Phase2By: "", Phase2Date: "", DeviationRef: "",
  FinalClassification: "", BatchDisposition: "",
  ApprovedBy: "", ApprovalDate: "", CapaRef: "",
  QaComments: "", TargetClosure: "", ClosedBy: "", ClosureRemarks: "",
    PliNo: "", PliIssuedBy: "", PliIssuedTo: "", PliIssuedDate: "",
  AnalystKnowsProcedure: "", AnalystFollowedProcedure: "", AnalystInterviewRemarks: "",
  ReInjection: "", ReInjectionResult: "",
  ReSonication: "", ReSonicationResult: "",
  ReFiltration: "", ReFiltrationResult: "",
  Phase1Recommendation: "",
  PliRefNo: "", PliCompletionDate: "",
  Analyst1: "", Analyst2: "", Analyst3: "", SamplerName: "",
  ResultMean: "", ResultRsd: "", WithinAcceptanceCriteria: "",
  LabInvestHeadQcBy: "", LabInvestHeadQcOn: "",
  LabInvestHeadQaBy: "", LabInvestHeadQaOn: "",
  ExtendedInvestigationRecommended: "", AttachmentDetails: "",
  Phase2HeadQaBy: "", Phase2HeadQaOn: "",

  plichecklist: [], samplingcheck: [], hypothesis: [], phase2results: [],
};

const OOS_TAB_ICON = {
  details: FaVial, phase1: FaFlask, phase2: FaIndustry,
  decision: FaGavel, closure: FaFlagCheckered, audit: FaHistory,
};
function OosTabIcon({ tab }) {
  const Icon = OOS_TAB_ICON[tab];
  return Icon ? <Icon /> : <span>•</span>;
}

const STATUS_OPTIONS = [
  "Reported", "Phase 1 Investigation", "Phase 2 Investigation",
  "Pending Decision", "Pending Closure", "Closed", "Rejected",
];

const EMPTY_FILTERS = { Status: "All", Product: "", Stage: "All", FinalClassification: "All" };

export default function OosMasterPage({ tab }) {
  const m = useQmsModule({
    moduleKey: "oos",
    title: "OOS",
    applName: tab?.appl_name || "OOS",
    initialState,
    tabs: oosTabs,
    tabStage: oosTabStage,
    getRequired: getOosRequired,
    api: API,
  });
  const printWorkflow = usePrintWorkflow({
    printBaseUrl: '/api/qms-print/oos',
    applName: 'oos',
    emailEndpoint: '/api/qms-print/oos',
    shareLinkEndpoint: '/api/qms-print/oos',
  });
  const refOpts = useRefOptions(["stp", "capa"]);

  const fieldGroups = useMemo(
    () => getOosFieldGroups({ ...m.groupOptions, refOpts }),
    [m.groupOptions, refOpts]
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
        (filters.Stage === "All" || it.Stage === filters.Stage) &&
        (filters.FinalClassification === "All" || it.FinalClassification === filters.FinalClassification) &&
        (!filters.Product || has(it.Product, filters.Product))
      );
  }, [m.list, filters]);
     const ModuleIcon = useMemo(() => {
        const name = tab?.icon_name || tab?.module?.icon_name;
        return (name && FaIcons[name]) || FaClipboardList;
      }, [tab?.icon_name, tab?.module?.icon_name]);
  const handlePrint = useCallback(() => {
    printWorkflow.openPrintFor(m.formData?.Id, {
      fileName: m.formData?.RecordNo || `OOS-${m.formData?.Id}`,
      contextLabel: m.formData?.Product,
    });
  }, [m.formData, printWorkflow]);

  if (printWorkflow.isOpen) {
    return (
      <div className="h-full w-full">
        <ERPPrintPreview title="Out of Specification (OOS) Report" {...printWorkflow.printProps} />
      </div>
    );
  }
  if (m.showForm) {
    return (
      <div className="h-full w-full">
        <ERPFormBuilder
          title="Out of Specification (OOS)"
            subtitle={m.formData?.RecordNo || "New"}   
          TitleIcon={ModuleIcon}
          tabs={oosTabs}
          tabLabels={oosTabLabels}
          tabStage={oosTabStage}
          TabIcon={OosTabIcon}
          fieldGroups={fieldGroups}
          customTabs={customTabs}
          configs={oosSectionConfigs}
          widthConfig={oosWidthConfig}
          getHeaderStyle={getHeaderStyle}
          requiredFields={m.requiredFields}
          completedTabs={m.completedTabs}
          hideSidebar={false}
          hideTabBar={false}
          showSettingsTab
          sidebarConfig={{ hidePhoto: true, hideHeader: true }}
          stageHistory={m.history?.stageHistory || null}
          recordHistory={m.history}
          moduleKey="oos"
          formData={m.formData}
          savedFormData={m.savedFormData}
          setFormData={m.setFormData}
          mode={m.mode}
          saving={m.saving}
          rights={m.rights}
            onSaveDraft={m.handleSaveDraft}
          workflowConfig={m.workflowConfig}
          currentUserRole={m.currentUserRole}
          alwaysSignTabs={["closure"]}
          settingsConfig={m.settingsConfig}
          settingsDefaults={m.settingsDefaults}
          onSettingsSave={m.onSettingsSave}
          onSave={m.handleSave}
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
        title="Out of Specification (OOS)"
          TitleIcon={ModuleIcon}
        data={filteredList}
        columns={oosTableColumns}
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
            setShowFilter={setShowFilter}
            visibleFields={["status", "product", "stage", "classification"]}
            options={{
              ...m.groupOptions,
              status: STATUS_OPTIONS,
              stage: ["Raw Material", "In-Process", "Finished Product", "Stability", "Packing Material", "Water / Utility"],
              classification: ["Invalidated — Lab Error", "Confirmed OOS", "Inconclusive"],
            }}
            onApply={() => { }}
            onClear={clearFilter}
          />
        }
      />
    </div>
  );
}