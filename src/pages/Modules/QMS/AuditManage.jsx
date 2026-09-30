import { useState, useCallback, useMemo } from "react";
import {
  FaClipboardList, FaSearchPlus, FaFileAlt,
  FaReply, FaFlagCheckered, FaHistory,
 
} from "react-icons/fa";
import * as FaIcons from "react-icons/fa"; 
import Table from "../../../components/Reusable/table/Table";
import ERPFormBuilder from "../../../components/Reusable/form/ERPFormBuilder";
import UnivarsalFilter from "../../../components/Reusable/Filter/UnivarsalFilter.jsx";
import RecordAuditPanel from "./Utils/RecordAuditPanel.jsx";
import { getHeaderStyle } from "./Utils/QmsValidation";
import { useQmsModule } from "./Utils/useQmsModule";
import {
  auditTabs, auditTabStage, auditTabLabels,
  getAuditFieldGroups, getAuditRequired,
  auditWidthConfig, auditSectionConfigs, auditTableColumns,
} from "./Utils/Qmsconfigs";
import { getAudits, createAudit, updateAudit, deleteAudit } from "./Utils/QmsAPI";
import { usePrintWorkflow } from "../../../Hooks/usePrintWorkflow.js";
import ERPPrintPreview from "../../../components/Reusable/ERPPrintPreview.jsx";

// ── module-level constants (component ke bahar — stable references) ──
const API = {
  list: getAudits, create: createAudit,
  update: updateAudit, remove: deleteAudit,
};

const initialState = {
  Id: null, RecordNo: "", Status: "Planned",
  AuditType: "", Agency: "", AreaDepartment: "",
  StartDate: new Date().toISOString().slice(0, 10), EndDate: "",
  PlannedBy: "", AuditPlanRef: "", AttachmentRef: "",
  AuditScope: "", Auditors: "", AuditeeReps: "",
  CriticalObs: "", MajorObs: "", MinorObs: "", KeyFindings: "",
  AuditReportNo: "", ReportIssueDate: "", ResponseDueDate: "",
  ResponseSubmittedDate: "", CapaRef: "", ResponseSubmittedBy: "",
  ComplianceStatus: "", ClosedBy: "", ClosedOn: "", ClosureRemarks: "",
};

const AUD_TAB_ICON = {
  details: FaClipboardList,
  observations: FaSearchPlus,
  report: FaFileAlt,
  response: FaReply,
  closure: FaFlagCheckered,
  audit: FaHistory,
};
function AuditTabIcon({ tab }) {
  const Icon = AUD_TAB_ICON[tab];
  return Icon ? <Icon /> : <span>•</span>;
}

const STATUS_OPTIONS = [
  "Planned", "In Progress", "Report Issued", "CAPA Response",
  "Pending Closure", "Closed", "Rejected",
];

const EMPTY_FILTERS = { Status: "All", AuditType: "All", AreaDepartment: "" };

export default function AuditMasterPage({ tab }) {
  const m = useQmsModule({
    moduleKey: "audit",
    title: "Audit",
    applName: tab?.appl_name || "Audit",
    initialState,
    tabs: auditTabs,
    tabStage: auditTabStage,
    getRequired: getAuditRequired,
    api: API,
  });

  const printWorkflow = usePrintWorkflow({
    printBaseUrl: '/api/qms-print/audit',   // ✅ moduleKey 'audit' se match
    applName: 'audit',
    emailEndpoint: '/api/qms-print/audit',
    shareLinkEndpoint: '/api/qms-print/audit',
  });

  const fieldGroups = useMemo(
    () => getAuditFieldGroups(m.groupOptions),
    [m.groupOptions]
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
      .map((item, i) => ({ ...item, Sr: i + 1, Status: item.Status || "Planned" }))
      .filter((it) =>
        (filters.Status === "All" || it.Status === filters.Status) &&
        (filters.AuditType === "All" || it.AuditType === filters.AuditType) &&
        (!filters.AreaDepartment || has(it.AreaDepartment, filters.AreaDepartment))
      );
  }, [m.list, filters]);

  const handlePrint = useCallback(() => {
    printWorkflow.openPrintFor(m.formData?.Id, {
      fileName: m.formData?.RecordNo || `Audit-${m.formData?.Id}`,
      contextLabel: m.formData?.AreaDepartment,
    }).catch((err) => console.error('Print open failed:', err));
  }, [m.formData, printWorkflow]);
     const ModuleIcon = useMemo(() => {
                    const name = tab?.icon_name || tab?.module?.icon_name;
                    return (name && FaIcons[name]) || FaIcons.FaClipboardList;
                  }, [tab?.icon_name, tab?.module?.icon_name]);

  if (printWorkflow.isOpen) {
    return (
      <div className="h-full w-full">
        <ERPPrintPreview title="Audit Report" {...printWorkflow.printProps} />
      </div>
    );
  }

  if (m.showForm) {
    return (
      <div className="h-full w-full">
        <ERPFormBuilder
          title="Audit Management"
          subtitle={m.formData?.RecordNo||"New"}
          TitleIcon={ModuleIcon}
          tabs={auditTabs}
          tabLabels={auditTabLabels}
          tabStage={auditTabStage}
          TabIcon={AuditTabIcon}
          fieldGroups={fieldGroups}
          customTabs={customTabs}
          configs={auditSectionConfigs}
          widthConfig={auditWidthConfig}
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
          onSignedSave={m.handleSignedSave}
          onDelete={m.handleDelete}
          onModify={m.handleModify}
          onPrint={handlePrint}
          canPrint={m.canPrint}
          onNewEntry={m.handleAddNewGuarded}
          onCancel={m.handleTabExit}
          onEditCancel={m.handleFormExit}
             onSaveDraft={m.handleSaveDraft}
          currentRecord={m.list.length ? m.currentIndex + 1 : 0}
          totalRecords={m.list.length}
          onPrevRecord={() => m.setCurrentIndex((p) => Math.max(p - 1, 0))}
          onNextRecord={() => m.setCurrentIndex((p) => Math.min(p + 1, m.list.length - 1))}
          headerActiveTab={m.activeTab}
          onHeaderTabChange={m.handleHeaderTabChange}
          moduleKey="audit"
        />
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <Table
        title="Audit Management"
         TitleIcon={ModuleIcon}
        data={filteredList}
        columns={auditTableColumns}
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
            visibleFields={["status", "auditType", "areaAudited"]}
            options={{
              ...m.groupOptions,
              status: STATUS_OPTIONS,
              auditType: ["Internal", "External", "Regulatory", "Customer", "Supplier / Vendor", "Self-Inspection"],
            }}
            onApply={() => { }}
            onClear={clearFilter}
          />
        }
      />
    </div>
  );
}