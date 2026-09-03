import { useState, useCallback, useMemo } from "react";
import { FaTools, FaWrench, FaClipboardCheck, FaHistory } from "react-icons/fa";
import Table from "../../../components/Reusable/table/Table";
import ERPFormBuilder from "../../../components/Reusable/form/ERPFormBuilder";
import UnivarsalFilter from "../../../components/Reusable/Filter/UnivarsalFilter.jsx";
import RecordAuditPanel from "./Utils/RecordAuditPanel.jsx";
import { getHeaderStyle } from "./Utils/QmsValidation";
import { useQmsModule } from "./Utils/useQmsModule";
import {
  pmTabs, pmTabStage, pmTabLabels,
  getPmFieldGroups, getPmRequired,
  pmWidthConfig, pmSectionConfigs, pmTableColumns,
} from "./Utils/Qmsconfigs";
import {
  getPmRecords, createPmRecord, updatePmRecord, deletePmRecord,
} from "./Utils/QmsAPI";
import { useRefOptions } from "./Utils/useRefOptions";
import { usePrintWorkflow } from "../../../Hooks/usePrintWorkflow.js";
import ERPPrintPreview from "../../../components/Reusable/ERPPrintPreview.jsx"; 
const API = {
  list: getPmRecords, create: createPmRecord,
  update: updatePmRecord, remove: deletePmRecord,
};

const initialState = {
  Id: null, RecordNo: "", Status: "Due",
  EquipmentName: "", EquipmentId: "", Location: "",
  PmType: "", MaintenanceType: "", FrequencyMonths: "",
  DueDate: "", WorkOrderNo: "", AttachmentRef: "",
  PmDate: "", PerformedBy: "", Downtime: "", SparesUsed: "",
  BreakdownDate: "", BreakdownCause: "", Checklist: "",
  LastResult: "", RequalificationTriggered: "", QualificationRef: "",
  VerifiedBy: "", VerifiedOn: "", LastPM: "", NextDue: "",
  DeviationRef: "", CapaRef: "", ClosedBy: "", Remarks: "",
};

const PM_TAB_ICON = {
  details: FaTools,
  execution: FaWrench,
  review: FaClipboardCheck,
  audit: FaHistory,
};
function PmTabIcon({ tab }) {
  const Icon = PM_TAB_ICON[tab];
  return Icon ? <Icon /> : <span>•</span>;
}

const STATUS_OPTIONS = ["Due", "Performed", "Under Review", "Closed", "Rejected"];

const EMPTY_FILTERS = { Status: "All", EquipmentName: "", MaintenanceType: "All" };

export default function PreventiveMaintenanceMasterPage({ tab }) {
  const m = useQmsModule({
    moduleKey: "pm",
    title: "Preventive Maintenance",
    applName: tab?.appl_name || "PreventiveMaintenance",
    initialState,
    tabs: pmTabs,
    tabStage: pmTabStage,
    getRequired: getPmRequired,
    api: API,
  });

  const printWorkflow = usePrintWorkflow({
    printBaseUrl: '/api/qms-print/pm',  
    applName: 'pm',
    emailEndpoint: '/api/qms-print/pm',
    shareLinkEndpoint: '/api/qms-print/pm',
  });

  const refOpts = useRefOptions(["capa"]);

  const fieldGroups = useMemo(
    () => getPmFieldGroups({ ...m.groupOptions, refOpts }),   
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
      .map((item, i) => ({ ...item, Sr: i + 1, Status: item.Status || "Due" }))
      .filter((it) =>
        (filters.Status === "All" || it.Status === filters.Status) &&
        (filters.MaintenanceType === "All" || it.MaintenanceType === filters.MaintenanceType) &&
        (!filters.EquipmentName || has(it.EquipmentName, filters.EquipmentName))
      );
  }, [m.list, filters]);

  const handlePrint = useCallback(() => {
    printWorkflow.openPrintFor(m.formData?.Id, {
      fileName: m.formData?.RecordNo || `PM-${m.formData?.Id}`,
      contextLabel: m.formData?.EquipmentName,
    }).catch((err) => console.error('Print open failed:', err));
  }, [m.formData, printWorkflow]);

  if (printWorkflow.isOpen) {
    return (
      <div className="h-full w-full">
        <ERPPrintPreview title="Preventive Maintenance Report" {...printWorkflow.printProps} />
      </div>
    );
  }

  if (m.showForm) {
    return (
      <div className="h-full w-full">
        <ERPFormBuilder
          title="Preventive Maintenance"
          tabs={pmTabs}
          tabLabels={pmTabLabels}
          TabIcon={PmTabIcon}
          fieldGroups={fieldGroups}
          customTabs={customTabs}
          configs={pmSectionConfigs}
          widthConfig={pmWidthConfig}
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
          alwaysSignTabs={["review"]}
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
          onCancel={m.handleTabExit }
          onEditCancel={m.handleFormExit}
          currentRecord={m.list.length ? m.currentIndex + 1 : 0}
          totalRecords={m.list.length}
          onPrevRecord={() => m.setCurrentIndex((p) => Math.max(p - 1, 0))}
          onNextRecord={() => m.setCurrentIndex((p) => Math.min(p + 1, m.list.length - 1))}
          headerActiveTab={m.activeTab}
          onHeaderTabChange={m.handleHeaderTabChange}
          moduleKey="pm" 
        />
      </div>
    );
  } 
  return (
    <div className="h-full w-full">
      <Table
        title="Preventive Maintenance"
        data={filteredList}
        columns={pmTableColumns}
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
            visibleFields={["status", "equipment", "maintenanceType"]}
            options={{
              ...m.groupOptions,
              status: STATUS_OPTIONS,
              maintenanceType: ["Preventive", "Predictive", "Breakdown"],
            }}
            onApply={() => { }}
            onClear={clearFilter}
          />
        }
      />
    </div>
  );
}