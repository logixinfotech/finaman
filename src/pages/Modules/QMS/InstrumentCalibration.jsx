import { useState, useCallback, useMemo } from "react";
import { FaBalanceScale, FaVial, FaClipboardCheck, FaHistory } from "react-icons/fa";
import Table from "../../../components/Reusable/table/Table";
import ERPFormBuilder from "../../../components/Reusable/form/ERPFormBuilder";
import UnivarsalFilter from "../../../components/Reusable/Filter/UnivarsalFilter.jsx";
import RecordAuditPanel from "./Utils/RecordAuditPanel.jsx";
import { getHeaderStyle } from "./Utils/QmsValidation";
import { useQmsModule } from "./Utils/useQmsModule";
import {
  calibrationTabs, calibrationTabStage, calibrationTabLabels,
  getCalibrationFieldGroups, getCalibrationRequired,
  calibrationWidthConfig, calibrationSectionConfigs, calibrationTableColumns,
} from "./Utils/Qmsconfigs";
import * as FaIcons from "react-icons/fa"; 

import { getCalibrations, createCalibration, updateCalibration, deleteCalibration, } from "./Utils/QmsAPI";
import { useRefOptions } from "./Utils/useRefOptions";
import { usePrintWorkflow } from "../../../Hooks/usePrintWorkflow.js";
import ERPPrintPreview from "../../../components/Reusable/ERPPrintPreview.jsx";
// ── module-level constants (component ke bahar — stable references) ──
const API = {
  list: getCalibrations, create: createCalibration,
  update: updateCalibration, remove: deleteCalibration,
};

const initialState = {
  Id: null, RecordNo: "", Status: "Due",
  Instrument: "", InstrumentCode: "", Location: "",
  CalibrationType: "", Agency: "", AcceptanceCriteria: "",
  FrequencyMonths: "", DueDate: "",
  CalibrationDate: "", CalibratedBy: "", AsFound: "", AsLeft: "",
  CertificateNo: "", Traceability: "", CertificateAttachment: "",
  OutOfCalibrationImpact: "",
  ReviewedBy: "", VerifiedOn: "", Result: "",
  LastCalibrated: "", NextDue: "",
  DeviationRef: "", CapaRef: "", ClosedBy: "", Remarks: "",
};

const CAL_TAB_ICON = {
  details: FaBalanceScale,
  execution: FaVial,
  review: FaClipboardCheck,
  audit: FaHistory,
};
function CalibrationTabIcon({ tab }) {
  const Icon = CAL_TAB_ICON[tab];
  return Icon ? <Icon /> : <span>•</span>;
}

const STATUS_OPTIONS = ["Due", "Performed", "Under Review", "Closed", "Rejected"];

const EMPTY_FILTERS = { Status: "All", Instrument: "", CalibrationType: "All" };

export default function CalibrationMasterPage({ tab }) {
  const m = useQmsModule({
    moduleKey: "calibration",
    title: "Calibration",
    applName: tab?.appl_name || "Calibration",
    initialState,
    tabs: calibrationTabs,
    tabStage: calibrationTabStage,
    getRequired: getCalibrationRequired,
    api: API,
  });

  const printWorkflow = usePrintWorkflow({
    printBaseUrl: '/api/qms-print/calibration',   // ✅ moduleKey 'calibration' se match
    applName: 'calibration',
    emailEndpoint: '/api/qms-print/calibration',
    shareLinkEndpoint: '/api/qms-print/calibration',
  });

  const customTabs = useMemo(
    () => ({ audit: <RecordAuditPanel history={m.history} /> }),
    [m.history]
  );

  // ── filters ──
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [showFilter, setShowFilter] = useState(false);
  const clearFilter = useCallback(() => setFilters(EMPTY_FILTERS), []);
  const refOpts = useRefOptions(["capa"]);

  const fieldGroups = useMemo(
    () => getCalibrationFieldGroups({ ...m.groupOptions, refOpts }),
    [m.groupOptions, refOpts]
  );
  const filteredList = useMemo(() => {
    const has = (v, f) => String(v || "").toLowerCase().includes(f.toLowerCase());
    return m.list
      .map((item, i) => ({ ...item, Sr: i + 1, Status: item.Status || "Due" }))
      .filter((it) =>
        (filters.Status === "All" || it.Status === filters.Status) &&
        (filters.CalibrationType === "All" || it.CalibrationType === filters.CalibrationType) &&
        (!filters.Instrument || has(it.Instrument, filters.Instrument))
      );
  }, [m.list, filters]);

  const handlePrint = useCallback(() => {
    printWorkflow.openPrintFor(m.formData?.Id, {
      fileName: m.formData?.RecordNo || `Calibration-${m.formData?.Id}`,
      contextLabel: m.formData?.Instrument,
    }).catch((err) => console.error('Print open failed:', err));
  }, [m.formData, printWorkflow]);
        const ModuleIcon = useMemo(() => {
                  const name = tab?.icon_name || tab?.module?.icon_name;
                  return (name && FaIcons[name]) || FaIcons.FaClipboardList;
                }, [tab?.icon_name, tab?.module?.icon_name]);

  if (printWorkflow.isOpen) {
    return (
      <div className="h-full w-full">
        <ERPPrintPreview title="Calibration Certificate" {...printWorkflow.printProps} />
      </div>
    );
  }

  if (m.showForm) {
    return (
      <div className="h-full w-full">
        <ERPFormBuilder
          title="Instrument Calibration"
          subtitle={m.formData?.RecordNo||"New"}
          TitleIcon={ModuleIcon}
          tabs={calibrationTabs}
          tabLabels={calibrationTabLabels}
          tabStage={calibrationTabStage}
          TabIcon={CalibrationTabIcon}
          fieldGroups={fieldGroups}
          customTabs={customTabs}
          configs={calibrationSectionConfigs}
          widthConfig={calibrationWidthConfig}
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
          moduleKey="calibration"
        />
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <Table
        title="Instrument Calibration"
        TitleIcon={ModuleIcon}
        data={filteredList}
        columns={calibrationTableColumns}
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
            setShowFilter={setShowFilter}   // ✅ add kiya
            visibleFields={["status", "instrument", "calibrationType"]}
            options={{
              ...m.groupOptions,
              status: STATUS_OPTIONS,
              calibrationType: ["Internal", "External (Agency)"],
            }}
            onApply={() => { }}
            onClear={clearFilter}
          />
        }
      />
    </div>
  );
}