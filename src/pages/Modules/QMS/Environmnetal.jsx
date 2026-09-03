import { useState, useCallback, useMemo } from "react";
import { FaThermometerHalf, FaClipboardCheck, FaFlagCheckered, FaHistory } from "react-icons/fa";
import Table from "../../../components/Reusable/table/Table";
import ERPFormBuilder from "../../../components/Reusable/form/ERPFormBuilder";
import UnivarsalFilter from "../../../components/Reusable/Filter/UnivarsalFilter.jsx";
import RecordAuditPanel from "./Utils/RecordAuditPanel.jsx";
import { getHeaderStyle } from "./Utils/QmsValidation";
import { useQmsModule } from "./Utils/useQmsModule";
import { useRefOptions } from "./Utils/useRefOptions";
import { usePrintWorkflow } from "../../../Hooks/usePrintWorkflow.js";
import ERPPrintPreview from "../../../components/Reusable/ERPPrintPreview.jsx";
import {
  envTabs, envTabStage, envTabLabels,
  getEnvFieldGroups, getEnvRequired,
  envWidthConfig, envSectionConfigs, envTableColumns,
} from "./Utils/Qmsconfigs";
import {
  getEnvironmentalMonitorings, createEnvironmentalMonitoring,
  updateEnvironmentalMonitoring, deleteEnvironmentalMonitoring,
} from "./Utils/QmsAPI";
const API = {
  list: getEnvironmentalMonitorings, create: createEnvironmentalMonitoring,
  update: updateEnvironmentalMonitoring, remove: deleteEnvironmentalMonitoring,
};

const initialState = {
  Id: null, RecordNo: "", Status: "Recorded",
  MonitoringDate: new Date().toISOString().slice(0, 10),
  Shift: "", Area: "", Location: "", Grade: "", MonitoringType: "",
  SampleId: "", Analyst: "",
  IncubationStartDate: "", IncubationEndDate: "",
  Result: "", Unit: "", AlertLimit: "", ActionLimit: "",
  LimitStatus: "", Method: "",
  ReviewedBy: "", ReviewedOn: "", TrendRef: "",
  DeviationRef: "", ActionTaken: "",
  CapaRef: "", ClosedBy: "", ClosedOn: "", ClosureRemarks: "",
};

const ENV_TAB_ICON = {
  monitoring: FaThermometerHalf,
  review: FaClipboardCheck,
  closure: FaFlagCheckered,
  audit: FaHistory,
};
function EnvTabIcon({ tab }) {
  const Icon = ENV_TAB_ICON[tab];
  return Icon ? <Icon /> : <span>•</span>;
}

const STATUS_OPTIONS = ["Recorded", "Under Review", "Pending Closure", "Closed", "Rejected"];
const LIMIT_STATUS_OPTIONS = ["WITHIN LIMITS", "ALERT LIMIT", "ACTION LIMIT EXCURSION"];

const MONITORING_TYPES = [
  "Viable - Air", "Viable - Surface", "Viable - Personnel",
  "Non-Viable Particle Count", "Temperature", "Humidity", "Differential Pressure",
];

const EMPTY_FILTERS = { Status: "All", Area: "", MonitoringType: "All", LimitStatus: "All" };

export default function EnvironmentalMonitoringMasterPage({ tab }) {
  const m = useQmsModule({
    moduleKey: "environmental",
    title: "Environmental Monitoring",
    applName: tab?.appl_name || "EnvMonitoring",
    initialState,
    tabs: envTabs,
    tabStage: envTabStage,
    getRequired: getEnvRequired,
    api: API,
  });

  const printWorkflow = usePrintWorkflow({
    printBaseUrl: '/api/qms-print/environmental',
    applName: 'environmental',
    emailEndpoint: '/api/qms-print/environmental',
    shareLinkEndpoint: '/api/qms-print/environmental',
  });

  const refOpts = useRefOptions(["capa"]);

  const fieldGroups = useMemo(
    () => getEnvFieldGroups({ ...m.groupOptions, refOpts }),
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
      .map((item, i) => ({ ...item, Sr: i + 1, Status: item.Status || "Recorded" }))
      .filter((it) =>
        (filters.Status === "All" || it.Status === filters.Status) &&
        (filters.MonitoringType === "All" || it.MonitoringType === filters.MonitoringType) &&
        (filters.LimitStatus === "All" || it.LimitStatus === filters.LimitStatus) &&
        (!filters.Area || has(it.Area, filters.Area))
      );
  }, [m.list, filters]);

  const handlePrint = useCallback(() => {
    printWorkflow.openPrintFor(m.formData?.Id, {
      fileName: m.formData?.RecordNo || `EnvMonitoring-${m.formData?.Id}`,
      contextLabel: m.formData?.Area,
    }).catch((err) => console.error('Print open failed:', err));
  }, [m.formData, printWorkflow]);

  if (printWorkflow.isOpen) {
    return (
      <div className="h-full w-full">
        <ERPPrintPreview title="Environmental Monitoring Report" {...printWorkflow.printProps} />
      </div>
    );
  }

  if (m.showForm) {
    return (
      <div className="h-full w-full">
        <ERPFormBuilder
          title="Environmental Monitoring"
          tabs={envTabs}
          tabLabels={envTabLabels}
          TabIcon={EnvTabIcon}
          fieldGroups={fieldGroups}
          customTabs={customTabs}
          configs={envSectionConfigs}
          widthConfig={envWidthConfig}
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
          moduleKey="environmental"
        />
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <Table
        title="Environmental Monitoring Register"
        data={filteredList}
        columns={envTableColumns}
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
            setShowFilter={setShowFilter}   // ✅ add kiya
            setFilters={setFilters}
            visibleFields={["status", "area", "monitoringType", "limitStatus"]}
            options={{
              ...m.groupOptions,
              status: STATUS_OPTIONS,
              monitoringType: MONITORING_TYPES,
              limitStatus: LIMIT_STATUS_OPTIONS,
            }}
            onApply={() => { }}
            onClear={clearFilter}
          />
        }
      />
    </div>
  );
}