import { useState, useCallback, useMemo  } from "react";
import {
  FaExclamationTriangle, FaBullhorn, FaTruck,
  FaChartLine, FaFlagCheckered, FaHistory,
} from "react-icons/fa";
import * as FaIcons from "react-icons/fa";
import Table from "../../../components/Reusable/table/Table";
import ERPFormBuilder from "../../../components/Reusable/form/ERPFormBuilder";
import UnivarsalFilter from "../../../components/Reusable/Filter/UnivarsalFilter.jsx";
import RecordAuditPanel from "./Utils/RecordAuditPanel.jsx";
import { getHeaderStyle } from "./Utils/QmsValidation";
import { useQmsModule } from "./Utils/useQmsModule";
import { useRefOptions } from "./Utils/useRefOptions";
import { usePagedList } from "../../../Hooks/usePagedList.js";
import {
  recallTabs, recallTabStage, recallTabLabels,
  getRecallFieldGroups, getRecallRequired,
  recallWidthConfig, recallSectionConfigs, recallTableColumns,
} from "./Utils/Qmsconfigs";
import { getRecallsPage, createRecall, updateRecall, deleteRecall } from "./Utils/QmsAPI";
import { usePrintWorkflow } from "../../../Hooks/usePrintWorkflow.js";
import ERPPrintPreview from "../../../components/Reusable/ERPPrintPreview.jsx"; 
const API = {
  list: () => getRecallsPage({ page: 1, pageSize: 50 }),
  create: createRecall,
  update: updateRecall,
  remove: deleteRecall,
};

const initialState = {
  Id: null, RecordNo: "", Status: "Initiated",
  InitiationDate: new Date().toISOString().slice(0, 10),
  Product: "", BatchNos: "", MfgDate: "", ExpDate: "",
  Classification: "", RecallType: "", RecallLevel: "",
  Reason: "", InitiatedBy: "",
  ComplaintRef: "", DeviationRef: "", IncidentRef: "", AttachmentRef: "",
  CommunicationMode: "", RegulatoryAuthority: "",
  RegulatoryNotifiedDate: "", NotifiedBy: "",
  DistributionDetails: "", QtyManufactured: "", QtyDistributed: "",
  QtyInStock: "", QtyRecovered: "", RecoveryPercent: "", TargetDate: "",
  EffectivenessSummary: "", MockRecallResult: "", MockRecallDate: "",
  EffectivenessReviewedBy: "",
  DestructionDetails: "", DestructionWitnessedBy: "", QtyDestroyed: "",
  CapaRef: "", ClosureDate: "", ClosedBy: "",
};

const RCL_TAB_ICON = {
  details: FaExclamationTriangle,
  notification: FaBullhorn,
  recovery: FaTruck,
  effectiveness: FaChartLine,
  closure: FaFlagCheckered,
  audit: FaHistory,
};
function RecallTabIcon({ tab }) {
  const Icon = RCL_TAB_ICON[tab];
  return Icon ? <Icon /> : <span>•</span>;
}

const STATUS_OPTIONS = [
  "Initiated", "Authority Notified", "Recovery In Progress",
  "Effectiveness Check", "Pending Closure", "Closed", "Rejected",
];

const EMPTY_FILTERS = { Status: "All", Product: "", Classification: "All" };
const PAGE_SIZE = 50;

export default function ProductRecallMasterPage({ tab }) {
  const m = useQmsModule({
    moduleKey: "recall",
    title: "Product Recall",
    applName: tab?.appl_name || "ProductRecall",
    initialState,
    tabs: recallTabs,
    tabStage: recallTabStage,
    getRequired: getRecallRequired,
    api: API,
  });

  const printWorkflow = usePrintWorkflow({
    printBaseUrl: '/api/qms-print/recall',
    applName: 'recall',
    emailEndpoint: '/api/qms-print/recall',
    shareLinkEndpoint: '/api/qms-print/recall',
  });

  const refOpts = useRefOptions(["deviation", "incident", "capa", "complaint"]);

  const fieldGroups = useMemo(
    () => getRecallFieldGroups({ ...m.groupOptions, refOpts }),
    [m.groupOptions, refOpts]
  );

  const customTabs = useMemo(
    () => ({ audit: <RecordAuditPanel history={m.history} /> }),
    [m.history]
  );

  const ModuleIcon = useMemo(() => {
    const name = tab?.icon_name || tab?.module?.icon_name;
    return (name && FaIcons[name]) || FaIcons.FaClipboardList;
  }, [tab?.icon_name, tab?.module?.icon_name]);
 
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS);
  const [showFilter, setShowFilter] = useState(false);
const { rows, total, loading, handlePageChange, refresh } = usePagedList({
  fetchPage: getRecallsPage,
  filters: appliedFilters,
  mapRow: (r) => ({ ...r, Status: r.Status || "Initiated" }),
});
const applyFilter = useCallback(() => setAppliedFilters(filters), [filters]);
  const clearFilter = useCallback(() => {
    setFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
  }, []);

  const handlePrint = useCallback(() => {
    printWorkflow.openPrintFor(m.formData?.Id, {
      fileName: m.formData?.RecordNo || `Recall-${m.formData?.Id}`,
      contextLabel: m.formData?.Product,
    }).catch((err) => console.error('Print open failed:', err));
  }, [m.formData, printWorkflow]);

  if (printWorkflow.isOpen) {
    return (
      <div className="h-full w-full">
        <ERPPrintPreview title="Product Recall Report" {...printWorkflow.printProps} />
      </div>
    );
  }

  if (m.showForm) {
    return (
      <div className="h-full w-full">
        <ERPFormBuilder
          title="Product Recall"
          subtitle={m.formData?.RecordNo || "New"}
          TitleIcon={ModuleIcon}
          tabs={recallTabs}
          tabLabels={recallTabLabels}
          tabStage={recallTabStage}
          TabIcon={RecallTabIcon}
          fieldGroups={fieldGroups}
          customTabs={customTabs}
          configs={recallSectionConfigs}
          widthConfig={recallWidthConfig}
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
          onModify={m.handleModifyGuarded}
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
          moduleKey="recall"
        />
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <Table
        key={JSON.stringify(appliedFilters)}   // filter badle to table page 1 se dobara shuru
        storageKey="qms-recall"
        title="Product Recall"
        TitleIcon={ModuleIcon}
        data={rows}
        columns={recallTableColumns}
        rowKey="Id"
        loading={m.loading || loading}   
        serverPagination
       totalRecords={total}  
        onPageChange={handlePageChange}
        defaultPageSize={PAGE_SIZE}
        activeTab={m.activeTab}
        showSettingsTab
        onTabChange={m.handleHeaderTabChange}
        onRefresh={refresh} 
        onAdd={m.rights?.add === 1 ? m.handleAddNewGuarded : null}
        onRowDoubleClick={m.handleRowSelect}
        onDeleteMultiple={m.handleDeleteMultiple}
        onToggleFilter={() => setShowFilter((p) => !p)}
        showForm={showFilter}
        formComponent={
          <UnivarsalFilter
            filters={filters}
            setFilters={setFilters}
            visibleFields={["status", "product", "classification"]}
            options={{
              ...m.groupOptions,
              status: STATUS_OPTIONS,
              classification: ["Class I", "Class II", "Class III"],
            }}
            onApply={applyFilter}
            onClear={clearFilter}
          />
        }
      />
    </div>
  );
}
