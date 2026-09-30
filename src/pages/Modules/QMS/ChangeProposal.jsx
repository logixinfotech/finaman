import { useState, useCallback, useMemo } from "react";
import Table from "../../../components/Reusable/table/Table";
import ERPFormBuilder from "../../../components/Reusable/form/ERPFormBuilder";
import UnivarsalFilter from "../../../components/Reusable/Filter/UnivarsalFilter.jsx";
import RecordAuditPanel from "./Utils/RecordAuditPanel.jsx";
import { getHeaderStyle } from "./Utils/QmsValidation";
import { useQmsModule } from "./Utils/useQmsModule";
import {
  changeProposalTabs, changeProposalTabStage, changeProposalTabLabels,
  getChangeProposalFieldGroups, getChangeProposalRequired,
  changeProposalWidthConfig, changeProposalSectionConfigs, changeProposalTableColumns,
} from "./Utils/Qmsconfigs";
import {
  getChangeProposals, getChangeProposal, createChangeProposal, updateChangeProposal, deleteChangeProposal,
} from "./Utils/QmsAPI";
import { FaLightbulb, FaSearch, FaHistory } from "react-icons/fa";
import * as FaIcons from "react-icons/fa";

const API = {
  list: getChangeProposals, getOne: getChangeProposal,
  create: createChangeProposal, update: updateChangeProposal, remove: deleteChangeProposal,
};

const initialState = {
  Id: null, RecordNo: "", Status: "Draft",
  InitiationDate: new Date().toISOString().slice(0, 10),
  Department: "", InitiatedBy: "", ChangeType: "",
  CurrentState: "", ProposedChange: "", Justification: "",
  ScreenedBy: "", ScreenedOn: "", ScreeningRemarks: "",
  ChangeControlRef: "",
};

const PROP_TAB_ICON = {
  details: FaLightbulb,
  screening: FaSearch,
  audit: FaHistory,
};
function ChangeProposalTabIcon({ tab }) {
  const Icon = PROP_TAB_ICON[tab];
  return Icon ? <Icon /> : <span>•</span>;
}

const STATUS_OPTIONS = ["Draft", "QA Screening", "Closed", "Rejected"];

const EMPTY_FILTERS = { Status: "All", Department: "" };

export default function ChangeProposalMasterPage({ tab }) {
  const m = useQmsModule({
    moduleKey: "changeproposal",
    title: "Change Proposal",
    applName: tab?.appl_name || "Change Proposal",
    initialState,
    tabs: changeProposalTabs,
    tabStage: changeProposalTabStage,
    getRequired: getChangeProposalRequired,
    api: API,
  });

  const fieldGroups = useMemo(
    () => getChangeProposalFieldGroups(m.groupOptions),
    [m.groupOptions]
  );

  const customTabs = useMemo(
    () => ({ audit: <RecordAuditPanel history={m.history} /> }),
    [m.history]
  );

  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [showFilter, setShowFilter] = useState(false);
  const clearFilter = useCallback(() => setFilters(EMPTY_FILTERS), []);
  const ModuleIcon = useMemo(() => {
  const name = tab?.icon_name || tab?.module?.icon_name;
  return (name && FaIcons[name]) || FaLightbulb;
}, [tab?.icon_name, tab?.module?.icon_name]);

  const filteredList = useMemo(() => {
    const has = (v, f) => String(v || "").toLowerCase().includes(f.toLowerCase());
    return m.list
      .map((item, i) => ({ ...item, Sr: i + 1, Status: item.Status || "Draft" }))
      .filter((it) =>
        (filters.Status === "All" || it.Status === filters.Status) &&
        (!filters.Department || has(it.Department, filters.Department))
      );
  }, [m.list, filters]);

  if (m.showForm) {
    return (
      <div className="h-full w-full">
        <ERPFormBuilder
          title="Change Proposal"
          tabs={changeProposalTabs}
          subtitle={m.formData?.RecordNo || "New"}
          tabLabels={changeProposalTabLabels}
          tabStage={changeProposalTabStage}
          TabIcon={ChangeProposalTabIcon}
          fieldGroups={fieldGroups}
          customTabs={customTabs}
          configs={changeProposalSectionConfigs}
          widthConfig={changeProposalWidthConfig}
          getHeaderStyle={getHeaderStyle}
          requiredFields={m.requiredFields}
          completedTabs={m.completedTabs}
          hideSidebar={false}
          hideTabBar={false}
          showSettingsTab
          sidebarConfig={{ hidePhoto: true, hideHeader: true }}
          stageHistory={m.history?.stageHistory || null}
          recordHistory={m.history}
          moduleKey="changeproposal"
          formData={m.formData}
          savedFormData={m.savedFormData}
          setFormData={m.setFormData}
          mode={m.mode}
          saving={m.saving}
          rights={m.rights}
          workflowConfig={m.workflowConfig}
          currentUserRole={m.currentUserRole}
          currentUserName={m.currentUserName}
          settingsConfig={m.settingsConfig}
          settingsDefaults={m.settingsDefaults}
          onSettingsSave={m.onSettingsSave}
          onSave={m.handleSave}
          onSignedSave={m.handleSignedSave}
          onDelete={m.handleDelete}
          onModify={m.handleModifyGuarded}
          onNewEntry={m.handleAddNewGuarded}
          onCancel={m.handleTabExit}
          onEditCancel={m.handleFormExit}
          currentRecord={m.list.length ? m.currentIndex + 1 : 0}
          totalRecords={m.list.length}
          onPrevRecord={() => m.setCurrentIndex((p) => Math.max(p - 1, 0))}
          onNextRecord={() => m.setCurrentIndex((p) => Math.min(p + 1, m.list.length - 1))}
          headerActiveTab={m.activeTab}
          onHeaderTabChange={m.handleHeaderTabChange}
          onSaveDraft={m.handleSaveDraft}
        />
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <Table
        title="Change Proposal"
        data={filteredList}
        columns={changeProposalTableColumns}
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
            visibleFields={["status", "department"]}
            options={{
              ...m.groupOptions,
              status: STATUS_OPTIONS,
            }}
            onApply={() => {}}
            onClear={clearFilter}
          />
        }
      />
    </div>
  );
}