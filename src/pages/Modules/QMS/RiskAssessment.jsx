import { useState, useCallback, useMemo } from "react";
import {
  FaExclamationTriangle, FaCalculator, FaShieldAlt,
  FaCogs, FaChartLine, FaFlagCheckered, FaHistory,
} from "react-icons/fa";
import * as FaIcons from "react-icons/fa";
import Table from "../../../components/Reusable/table/Table";
import ERPFormBuilder from "../../../components/Reusable/form/ERPFormBuilder";
import UnivarsalFilter from "../../../components/Reusable/Filter/UnivarsalFilter.jsx";
import RecordAuditPanel from "./Utils/RecordAuditPanel.jsx";
import RiskMatrix from "./Components/RiskMatrix.jsx";
import { getHeaderStyle } from "./Utils/QmsValidation";
import { useQmsModule } from "./Utils/useQmsModule";
import { useRefOptions } from "./Utils/useRefOptions";
import {
  riskTabs, riskTabStage, riskTabLabels,
  getRiskFieldGroups, getRiskRequired,
  riskWidthConfig, riskSectionConfigs, riskTableColumns,
} from "./Utils/Qmsconfigs";
import { getRisks, createRisk, updateRisk, deleteRisk } from "./Utils/QmsAPI";
import { usePrintWorkflow } from "../../../Hooks/usePrintWorkflow.js";
import ERPPrintPreview from "../../../components/Reusable/ERPPrintPreview.jsx";

const API = { list: getRisks, create: createRisk, update: updateRisk, remove: deleteRisk };

const initialState = {
  Id: null, RecordNo: "", Status: "Identified",
  IdentifiedDate: new Date().toISOString().slice(0, 10),
  Title: "", ProcessArea: "", Department: "", RiskCategory: "",
  IdentifiedBy: "", Hazard: "",
  RmTool: "", TriggerRef: "", ChangeControlRef: "",
  Severity: "", Probability: "", Detectability: "",
  RiskScore: "", RiskLevel: "",
  PotentialEffect: "", ExistingControls: "",
  AssessedBy: "", AssessmentDate: "",
  Mitigation: "", MitigationOwner: "", TargetDate: "", CapaRef: "",
  ProgressRemarks: "", CompletedDate: "",
  ResidualSeverity: "", ResidualProbability: "",
  ResidualScore: "", ResidualLevel: "",
  ResidualReviewedBy: "", ResidualReviewDate: "",
  RiskAcceptance: "", Owner: "", ApprovedBy: "",
  AcceptanceDate: "", ReviewDate: "", ClosedBy: "", ClosureRemarks: "",
};

const RA_TAB_ICON = {
  identify: FaExclamationTriangle,
  assess: FaCalculator,
  mitigation: FaShieldAlt,
  implementation: FaCogs,
  residual: FaChartLine,
  closure: FaFlagCheckered,
  audit: FaHistory,
};
function RiskTabIcon({ tab }) {
  const Icon = RA_TAB_ICON[tab];
  return Icon ? <Icon /> : <span>•</span>;
}

const STATUS_OPTIONS = [
  "Identified", "Assessed", "Mitigation Planned", "Mitigation In Progress",
  "Residual Reviewed", "Pending Acceptance", "Closed", "Rejected",
];

const EMPTY_FILTERS = { Status: "All", ProcessArea: "", RiskLevel: "All" };

export default function RiskAssessmentMasterPage({ tab }) {
  const m = useQmsModule({
    moduleKey: "risk",
    title: "Risk Assessment",
    applName: tab?.appl_name || "RiskAssessment",
    initialState,
    tabs: riskTabs,
    tabStage: riskTabStage,
    getRequired: getRiskRequired,
    api: API,
  });
  const printWorkflow = usePrintWorkflow({
    printBaseUrl: "/api/qms-print/risk",
    applName: "risk",
    emailEndpoint: "/api/qms-print/risk",
    shareLinkEndpoint: "/api/qms-print/risk",
  });
  const refOpts = useRefOptions(["changecontrol", "deviation"]);

  const fieldGroups = useMemo(
    () => getRiskFieldGroups({ ...m.groupOptions, refOpts }),
    [m.groupOptions, refOpts]
  );

  const customTabs = useMemo(
    () => ({ audit: <RecordAuditPanel history={m.history} /> }),
    [m.history]
  );

  // ── filters ──
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [showFilter, setShowFilter] = useState(false);
  const [matrixCell, setMatrixCell] = useState(null);
  const clearFilter = useCallback(() => { setFilters(EMPTY_FILTERS); setMatrixCell(null); }, []);
  const ModuleIcon = useMemo(() => {
    const name = tab?.icon_name || tab?.module?.icon_name;
    return (name && FaIcons[name]) || FaIcons.FaClipboardList;
  }, [tab?.icon_name, tab?.module?.icon_name]);

  const filteredList = useMemo(() => {
    const has = (v, f) => String(v || "").toLowerCase().includes(f.toLowerCase());
    return m.list
      .map((item, i) => ({ ...item, Sr: i + 1, Status: item.Status || "Identified" }))
      .filter((it) =>
        (filters.Status === "All" || it.Status === filters.Status) &&
        (filters.RiskLevel === "All" || it.RiskLevel === filters.RiskLevel) &&
        (!filters.ProcessArea || has(it.ProcessArea, filters.ProcessArea)) &&
        (!matrixCell ||
          (parseInt(it.Severity, 10) === matrixCell.severity &&
            parseInt(it.Probability, 10) === matrixCell.probability))
      );
  }, [m.list, filters, matrixCell]);
  const handlePrint = useCallback(() => {
    printWorkflow.openPrintFor(m.formData?.Id, {
      fileName: m.formData?.RecordNo || `RA-${m.formData?.Id}`,
      contextLabel: m.formData?.ProcessArea,
    });
  }, [m.formData, printWorkflow]);

  if (printWorkflow.isOpen) {
    return (
      <div className="h-full w-full">
        <ERPPrintPreview title="Risk Assessment (ICH Q9)" {...printWorkflow.printProps} />
      </div>
    );
  }
  if (m.showForm) {
    return (
      <div className="h-full w-full">
        <ERPFormBuilder
          title="Risk Assessment (ICH Q9)"
          subtitle={m.formData?.RecordNo || "New"}
          TitleIcon={ModuleIcon}
          tabs={riskTabs}
          tabLabels={riskTabLabels}
          tabStage={riskTabStage}
          TabIcon={RiskTabIcon}
          fieldGroups={fieldGroups}
          customTabs={customTabs}
          configs={riskSectionConfigs}
          widthConfig={riskWidthConfig}
          getHeaderStyle={getHeaderStyle}
          requiredFields={m.requiredFields}
          completedTabs={m.completedTabs}
          hideSidebar={false}
          hideTabBar={false}
          showSettingsTab
          sidebarConfig={{ hidePhoto: true, hideHeader: true }}
          stageHistory={m.history?.stageHistory || null}
          recordHistory={m.history}
          moduleKey="risk"
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
    <div className="h-full w-full flex flex-col"> 
      <div className="px-2 pt-2 shrink-0">
        <RiskMatrix
          data={m.list}
          activeCell={matrixCell}
          onCellClick={(cell) => setMatrixCell(cell)}
        />
      </div>

      <div className="flex-1 min-h-0">
        <Table
          title="Risk Assessment (ICH Q9)"
          TitleIcon={ModuleIcon}
          data={filteredList}
          columns={riskTableColumns}
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
              visibleFields={["status", "processArea", "riskLevel"]}
              options={{
                ...m.groupOptions,
                status: STATUS_OPTIONS,
                riskLevel: ["LOW", "MEDIUM", "HIGH"],
              }}
              onApply={() => { }}
              onClear={clearFilter}
            />
          }
        />
      </div>
    </div>
  );
}