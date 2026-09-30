import { useState, useCallback, useMemo } from "react";
import {
  FaFileSignature, FaSearch, FaStamp, FaChalkboardTeacher,
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
  stpTabs, stpTabStage, stpTabLabels,
  getStpFieldGroups, getStpRequired,
  stpWidthConfig, stpSectionConfigs, stpTableColumns,
} from "./Utils/Qmsconfigs";
import { getSTPs, createSTP, updateSTP, deleteSTP } from "./Utils/QmsAPI";
import { usePrintWorkflow } from "../../../Hooks/usePrintWorkflow.js";
import ERPPrintPreview from "../../../components/Reusable/ERPPrintPreview.jsx";

// ── module-level constants (component ke bahar — stable references) ──
const API = {
  list: getSTPs, create: createSTP,
  update: updateSTP, remove: deleteSTP,
};

const initialState = {
  Id: null, RecordNo: "", Status: "Draft",
  StpNo: "", Title: "", Department: "", Category: "",
  Version: "", Supersedes: "", ChangeRef: "",
  PreparedBy: "", PreparedOn: "", AttachmentRef: "",
  ReasonForRevision: "", Scope: "",
  ReviewedBy: "", ReviewedOn: "",
  ApprovedBy: "", ApprovedOn: "", IssueDate: "",
  TrainingDone: "", TrainingRef: "",
  EffectiveDate: "", NextReviewDate: "", Distribution: "",
  ObsoleteDate: "", RetentionPeriod: "", SupersededByRef: "",
};

const STP_TAB_ICON = {
  details: FaFileSignature,
  review: FaSearch,
  approval: FaStamp,
  training: FaChalkboardTeacher,
  effective: FaCheckCircle,
  withdrawal: FaArchive,
  audit: FaHistory,
};
function StpTabIcon({ tab }) {
  const Icon = STP_TAB_ICON[tab];
  return Icon ? <Icon /> : <span>•</span>;
}

const STATUS_OPTIONS = [
  "Draft", "Under Review", "Pending Approval", "Training Pending",
  "Pending Effective", "Effective", "Obsolete",
];

const EMPTY_FILTERS = { Status: "All", Department: "", Category: "All" };

export default function STPMasterPage({ tab }) {
  const m = useQmsModule({
    moduleKey: "stp",
    title: "STP Register",
    applName: tab?.appl_name || "STP",
    initialState,
    tabs: stpTabs,
    tabStage: stpTabStage,
    getRequired: getStpRequired,
    api: API,
  });

  const printWorkflow = usePrintWorkflow({
    printBaseUrl: '/api/qms-print/stp',   
    applName: 'stp',
    emailEndpoint: '/api/qms-print/stp',
    shareLinkEndpoint: '/api/qms-print/stp',
  });

  const refOpts = useRefOptions(["changecontrol", "training"]);

  const fieldGroups = useMemo(
    () => getStpFieldGroups({ ...m.groupOptions, refOpts }),
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
        (filters.Category === "All" || it.Category === filters.Category) &&
        (!filters.Department || has(it.Department, filters.Department))
      );
  }, [m.list, filters]);

  const handlePrint = useCallback(() => {
    printWorkflow.openPrintFor(m.formData?.Id, {
      fileName: m.formData?.RecordNo || `STP-${m.formData?.Id}`,
      contextLabel: m.formData?.Department,
    }).catch((err) => console.error('Print open failed:', err));
  }, [m.formData, printWorkflow]);
    const ModuleIcon = useMemo(() => {
                  const name = tab?.icon_name || tab?.module?.icon_name;
                  return (name && FaIcons[name]) || FaIcons.FaClipboardList;
                }, [tab?.icon_name, tab?.module?.icon_name]);

  if (printWorkflow.isOpen) {
    return (
      <div className="h-full w-full">
        <ERPPrintPreview title="STP Document" {...printWorkflow.printProps} />
      </div>
    );
  }

  if (m.showForm) {
    return (
      <div className="h-full w-full">
        <ERPFormBuilder
          title="STP"
          subtitle={m.formData?.RecordNo||"New"}
          TitleIcon={ModuleIcon}
          tabs={stpTabs}
          tabLabels={stpTabLabels}
          tabStage={stpTabStage}
          TabIcon={StpTabIcon}
          fieldGroups={fieldGroups}
          customTabs={customTabs}
          configs={stpSectionConfigs}
          widthConfig={stpWidthConfig}
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
          onCancel={m.handleTabExit }
          onEditCancel={m.handleFormExit}
          currentRecord={m.list.length ? m.currentIndex + 1 : 0}
          totalRecords={m.list.length}
          onPrevRecord={() => m.setCurrentIndex((p) => Math.max(p - 1, 0))}
          onNextRecord={() => m.setCurrentIndex((p) => Math.min(p + 1, m.list.length - 1))}
          headerActiveTab={m.activeTab}
          onHeaderTabChange={m.handleHeaderTabChange}
          moduleKey="stp" 
        />
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <Table
        title="STP"
                TitleIcon={ModuleIcon}
        data={filteredList}
        columns={stpTableColumns}
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
            visibleFields={["status", "department", "category"]}
            options={{
              ...m.groupOptions,
              status: STATUS_OPTIONS,
              category: ["SOP", "STP", "Policy", "Work Instruction", "Format", "Guideline"],
            }}
            onApply={() => {}}
            onClear={clearFilter}
          />
        }
      />
    </div>
  );
}