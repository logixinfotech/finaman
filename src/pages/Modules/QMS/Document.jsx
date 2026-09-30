import { useState, useCallback, useMemo } from "react";
import {
  FaFileAlt, FaSearch, FaStamp, FaChalkboardTeacher,
  FaCheckCircle, FaArchive, FaHistory,
 
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
  dmsTabs, dmsTabStage, dmsTabLabels,
  getDmsFieldGroups, getDmsRequired,
  dmsWidthConfig, dmsSectionConfigs, dmsTableColumns,
} from "./Utils/Qmsconfigs";
import { getDmsRecords, createDmsRecord, updateDmsRecord, deleteDmsRecord, } from "./Utils/QmsAPI";
import { usePrintWorkflow } from "../../../Hooks/usePrintWorkflow.js";
import ERPPrintPreview from "../../../components/Reusable/ERPPrintPreview.jsx";
// ── module-level constants (component ke bahar — stable references) ──
const API = {
  list: getDmsRecords, create: createDmsRecord,
  update: updateDmsRecord, remove: deleteDmsRecord,
};

const initialState = {
  Id: null, RecordNo: "", Status: "Draft",
  DocNo: "", DocTitle: "", DocType: "", Department: "",
  Version: "", Supersedes: "", ChangeRef: "", CapaRef: "",
  PreparedBy: "", PreparedOn: "", AttachmentRef: "",
  ReasonForRevision: "",
  ReviewedBy: "", ReviewedOn: "",
  ApprovedBy: "", ApprovedOn: "", IssueDate: "",
  TrainingRequired: "", TrainingRef: "", TrainingCompletedOn: "",
  EffectiveDate: "", ReviewDate: "", Distribution: "",
  ObsoleteDate: "", RetentionPeriod: "", SupersededByRef: "", RetrievedCopies: "",
};

const DMS_TAB_ICON = {
  details: FaFileAlt,
  review: FaSearch,
  approval: FaStamp,
  training: FaChalkboardTeacher,
  effective: FaCheckCircle,
  withdrawal: FaArchive,
  audit: FaHistory,
};
function DmsTabIcon({ tab }) {
  const Icon = DMS_TAB_ICON[tab];
  return Icon ? <Icon /> : <span>•</span>;
}

const STATUS_OPTIONS = [
  "Draft", "Under Review", "Pending Approval", "Training Pending",
  "Pending Effective", "Effective", "Obsolete",
];

const EMPTY_FILTERS = { Status: "All", Department: "", DocType: "All" };

export default function DmsMasterPage({ tab }) {
  const m = useQmsModule({
    moduleKey: "dms",
    title: "DMS",
    applName: tab?.appl_name || "DMS",
    initialState,
    tabs: dmsTabs,
    tabStage: dmsTabStage,
    getRequired: getDmsRequired,
    api: API,
  });

  const printWorkflow = usePrintWorkflow({
    printBaseUrl: '/api/qms-print/dms',   // ✅ moduleKey 'dms' se match
    applName: 'dms',
    emailEndpoint: '/api/qms-print/dms',
    shareLinkEndpoint: '/api/qms-print/dms',
  });

  const refOpts = useRefOptions(["changecontrol", "capa", "training"]);

  const fieldGroups = useMemo(
    () => getDmsFieldGroups({ ...m.groupOptions, refOpts }),
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
        (filters.DocType === "All" || it.DocType === filters.DocType) &&
        (!filters.Department || has(it.Department, filters.Department))
      );
  }, [m.list, filters]);
       const ModuleIcon = useMemo(() => {
            const name = tab?.icon_name || tab?.module?.icon_name;
            return (name && FaIcons[name]) || FaIcons.FaClipboardList;
          }, [tab?.icon_name, tab?.module?.icon_name]);

  const handlePrint = useCallback(() => {
    printWorkflow.openPrintFor(m.formData?.Id, {
      fileName: m.formData?.RecordNo || `DMS-${m.formData?.Id}`,
      contextLabel: m.formData?.Department,
    }).catch((err) => console.error('Print open failed:', err));
  }, [m.formData, printWorkflow]);

  if (printWorkflow.isOpen) {
    return (
      <div className="h-full w-full">
        <ERPPrintPreview title="Document Report" {...printWorkflow.printProps} />
      </div>
    );
  }
  

  if (m.showForm) {
    return (
      <div className="h-full w-full">
        <ERPFormBuilder
          title="DMS"
          subtitle={m.formData?.RecordNo || "New"}   
          TitleIcon={ModuleIcon}
          tabs={dmsTabs}
          tabLabels={dmsTabLabels}
          tabStage={dmsTabStage}
          TabIcon={DmsTabIcon}
          fieldGroups={fieldGroups}
          customTabs={customTabs}
          configs={dmsSectionConfigs}
          widthConfig={dmsWidthConfig}
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
          alwaysSignTabs={["withdrawal"]}
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
          moduleKey="dms"
        />
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <Table
        title="DMS"
        TitleIcon={ModuleIcon}
        data={filteredList}
        columns={dmsTableColumns}
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
            setShowFilter={setShowFilter}    
            setFilters={setFilters}
            visibleFields={["status", "department", "docType"]}
            options={{
              ...m.groupOptions,
              status: STATUS_OPTIONS,
              docType: ["SOP", "Policy", "Work Instruction", "Form", "Specification", "Manual", "Protocol"],
            }}
            onApply={() => { }}
            onClear={clearFilter}
          />
        }
      />
    </div>
  );
}