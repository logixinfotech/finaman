import { useState, useCallback, useMemo } from "react";
import {
  FaChartArea, FaSearchPlus, FaBalanceScale, FaFlagCheckered, FaHistory,
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
  ootTabs, ootTabStage, ootTabLabels,
  getOotFieldGroups, getOotRequired,
  ootWidthConfig, ootSectionConfigs, ootTableColumns,
} from "./Utils/Qmsconfigs";
import { getOots, createOot, updateOot, deleteOot } from "./Utils/QmsAPI";
import { usePrintWorkflow } from "../../../Hooks/usePrintWorkflow.js";
import ERPPrintPreview from "../../../components/Reusable/ERPPrintPreview.jsx";
const API = { list: getOots, create: createOot, update: updateOot, remove: deleteOot };

const initialState = {
  Id: null, RecordNo: "", Status: "Reported",
  ReportedDate: new Date().toISOString().slice(0, 10),
  Product: "", BatchNo: "", ArNo: "", TestParameter: "",
  DataSource: "", StabilityStation: "", ReportedBy: "",
  ObservedValue: "", SpecificationLimit: "", TrendLimit: "",
  StatisticalMethod: "", Analyst: "",
  HistoricalData: "", Evaluation: "", ProbableCause: "", EvaluationDate: "",
  ImpactAssessment: "", Outcome: "", ReviewedBy: "", ReviewDate: "",
  DeviationRef: "", CapaRef: "",
  ActionTaken: "", TargetClosure: "", ClosedBy: "", ClosureRemarks: "",
};

const OOT_TAB_ICON = {
  details: FaChartArea, evaluation: FaSearchPlus,
  impact: FaBalanceScale, closure: FaFlagCheckered, audit: FaHistory,
};
function OotTabIcon({ tab }) {
  const Icon = OOT_TAB_ICON[tab];
  return Icon ? <Icon /> : <span>•</span>;
}

const STATUS_OPTIONS = [
  "Reported", "Under Evaluation", "Impact Assessed",
  "Pending Closure", "Closed", "Rejected",
];

const EMPTY_FILTERS = { Status: "All", Product: "", DataSource: "All", Outcome: "All" };

export default function OotMasterPage({ tab }) {
  const m = useQmsModule({
    moduleKey: "oot",
    title: "OOT",
    applName: tab?.appl_name || "OOT",
    initialState,
    tabs: ootTabs,
    tabStage: ootTabStage,
    getRequired: getOotRequired,
    api: API,
  });
  const printWorkflow = usePrintWorkflow({
    printBaseUrl: '/api/qms-print/oot',
    applName: 'oot',
    emailEndpoint: '/api/qms-print/oot',
    shareLinkEndpoint: '/api/qms-print/oot',
  });
  const refOpts = useRefOptions(["capa"]);

  const fieldGroups = useMemo(
    () => getOotFieldGroups({ ...m.groupOptions, refOpts }),
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
        (filters.DataSource === "All" || it.DataSource === filters.DataSource) &&
        (filters.Outcome === "All" || it.Outcome === filters.Outcome) &&
        (!filters.Product || has(it.Product, filters.Product))
      );
  }, [m.list, filters]);
     const ModuleIcon = useMemo(() => {
          const name = tab?.icon_name || tab?.module?.icon_name;
          return (name && FaIcons[name]) || FaIcons.FaClipboardList;
        }, [tab?.icon_name, tab?.module?.icon_name]);
  const handlePrint = useCallback(() => {
    printWorkflow.openPrintFor(m.formData?.Id, {
      fileName: m.formData?.RecordNo || `OOT-${m.formData?.Id}`,
      contextLabel: m.formData?.Product,
    });
  }, [m.formData, printWorkflow]);

  if (printWorkflow.isOpen) {
    return (
      <div className="h-full w-full">
        <ERPPrintPreview title="Out of Trend (OOT) Report" {...printWorkflow.printProps} />
      </div>
    );
  }
  if (m.showForm) {
    return (
      <div className="h-full w-full">
        <ERPFormBuilder
          title="Out of Trend (OOT)"
            subtitle={m.formData?.RecordNo || "New"}   
                    TitleIcon={ModuleIcon}
                    
          tabs={ootTabs}
          tabLabels={ootTabLabels}
          tabStage={ootTabStage}
          TabIcon={OotTabIcon}
          fieldGroups={fieldGroups}
          customTabs={customTabs}
          configs={ootSectionConfigs}
          widthConfig={ootWidthConfig}
          getHeaderStyle={getHeaderStyle}
          requiredFields={m.requiredFields}
          completedTabs={m.completedTabs}
          hideSidebar={false}
          hideTabBar={false}
          showSettingsTab
          sidebarConfig={{ hidePhoto: true, hideHeader: true }}
          stageHistory={m.history?.stageHistory || null}
          recordHistory={m.history}
          moduleKey="oot"
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
        title="Out of Trend (OOT)"
           TitleIcon={ModuleIcon}
        data={filteredList}
        columns={ootTableColumns}
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
            visibleFields={["status", "product", "dataSource", "outcome"]}
            options={{
              ...m.groupOptions,
              status: STATUS_OPTIONS,
              dataSource: ["Stability Study", "Routine Release Testing", "In-Process Testing", "Environmental Monitoring", "Water System", "Process Parameter"],
              outcome: ["Isolated — No Action", "Monitor Closely", "Systemic — Investigation Required", "Escalate to OOS"],
            }}
            onApply={() => { }}
            onClear={clearFilter}
          />
        }
      />
    </div>
  );
}