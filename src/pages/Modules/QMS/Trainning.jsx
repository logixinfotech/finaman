import { useState, useCallback, useMemo } from "react";
import {
  FaChalkboardTeacher, FaUsers, FaClipboardCheck,
  FaFlagCheckered, FaHistory,
} from "react-icons/fa";
import Table from "../../../components/Reusable/table/Table";
import ERPFormBuilder from "../../../components/Reusable/form/ERPFormBuilder";
import UnivarsalFilter from "../../../components/Reusable/Filter/UnivarsalFilter.jsx";
import RecordAuditPanel from "./Utils/RecordAuditPanel.jsx";
import { getHeaderStyle } from "./Utils/QmsValidation";
import { useQmsModule } from "./Utils/useQmsModule";
import { useRefOptions } from "./Utils/useRefOptions";
import {
  trainingTabs, trainingTabStage, trainingTabLabels,
  getTrainingFieldGroups, getTrainingRequired,
  trainingWidthConfig, trainingSectionConfigs, trainingTableColumns,
} from "./Utils/Qmsconfigs";
import {
  getTrainings, createTraining, updateTraining, deleteTraining,
} from "./Utils/QmsAPI";

import { usePrintWorkflow } from "../../../Hooks/usePrintWorkflow.js";
import ERPPrintPreview from "../../../components/Reusable/ERPPrintPreview.jsx";
const API = {
  list: getTrainings, create: createTraining,
  update: updateTraining, remove: deleteTraining,
};

const initialState = {
  Id: null, RecordNo: "", Status: "Scheduled",
  TrainingTitle: "", TrainingType: "", TrainingMode: "",
  Department: "", Trainer: "",
  ScheduledDate: new Date().toISOString().slice(0, 10), ScheduledBy: "",
  DocRef: "", DmsRef: "", CapaRef: "", AttachmentRef: "",
  ConductedDate: "", Venue: "", DurationHours: "", TraineesScores: "",
  EvaluationMethod: "", PassCriteria: "", PassCount: "", FailCount: "",
  CertificateNo: "", EvaluatedBy: "", RetrainingDueDate: "",
  Effectiveness: "", Remarks: "", ClosedBy: "",
};

const TRN_TAB_ICON = {
  details: FaChalkboardTeacher,
  conduct: FaUsers,
  evaluation: FaClipboardCheck,
  closure: FaFlagCheckered,
  audit: FaHistory,
};
function TrainingTabIcon({ tab }) {
  const Icon = TRN_TAB_ICON[tab];
  return Icon ? <Icon /> : <span>•</span>;
}

const STATUS_OPTIONS = [
  "Scheduled", "Conducted", "Evaluated", "Pending Closure", "Closed", "Rejected",
];

const EMPTY_FILTERS = { Status: "All", Department: "", TrainingType: "All" };

export default function TrainingMasterPage({ tab }) {
  const m = useQmsModule({
    moduleKey: "training",
    title: "Training",
    applName: tab?.appl_name || "Training",
    initialState,
    tabs: trainingTabs,
    tabStage: trainingTabStage,
    getRequired: getTrainingRequired,
    api: API,
  });

  const printWorkflow = usePrintWorkflow({
    printBaseUrl: '/api/qms-print/training',  
    applName: 'training',
    emailEndpoint: '/api/qms-print/training',
    shareLinkEndpoint: '/api/qms-print/training',
  });

  const refOpts = useRefOptions(["stp", "dms", "capa"]);

  const fieldGroups = useMemo(
    () => getTrainingFieldGroups({ ...m.groupOptions, refOpts }),
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
      .map((item, i) => ({ ...item, Sr: i + 1, Status: item.Status || "Scheduled" }))
      .filter((it) =>
        (filters.Status === "All" || it.Status === filters.Status) &&
        (filters.TrainingType === "All" || it.TrainingType === filters.TrainingType) &&
        (!filters.Department || has(it.Department, filters.Department))
      );
  }, [m.list, filters]);

  const handlePrint = useCallback(() => {
    printWorkflow.openPrintFor(m.formData?.Id, {
      fileName: m.formData?.RecordNo || `Training-${m.formData?.Id}`,
      contextLabel: m.formData?.Department,
    }).catch((err) => console.error('Print open failed:', err));
  }, [m.formData, printWorkflow]);

  if (printWorkflow.isOpen) {
    return (
      <div className="h-full w-full">
        <ERPPrintPreview title="Training Record" {...printWorkflow.printProps} />
      </div>
    );
  }

  if (m.showForm) {
    return (
      <div className="h-full w-full">
        <ERPFormBuilder
          title="Training"
          tabs={trainingTabs}
          tabLabels={trainingTabLabels}
          TabIcon={TrainingTabIcon}
          fieldGroups={fieldGroups}
          customTabs={customTabs}
          configs={trainingSectionConfigs}
          widthConfig={trainingWidthConfig}
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
             onSaveDraft={m.handleSaveDraft}
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
          moduleKey="training" 
        />
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <Table
        title="Training Register"
        data={filteredList}
        columns={trainingTableColumns}
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
            visibleFields={["status", "department", "trainingType"]}
            options={{
              ...m.groupOptions,
              status: STATUS_OPTIONS,
              trainingType: ["Induction", "GMP", "SOP", "Safety", "Refresher", "On-the-Job", "External"],
            }}
            onApply={() => {}}
            onClear={clearFilter}
          />
        }
      />
    </div>
  );
}