import { useEffect, useState, useCallback } from "react";
import { useERPMode } from "../../../../components/Reusable/form/useFormMode";
import Table from "../../../../components/Reusable/table/Table";
import QMSMasterForm from "./QMSMasterForm";
import { getMasters, createMaster, updateMaster, deleteMaster } from "../../../Modules/QMS/Utils/QmsAPI";
import { confirmDelete, showToast, alertError } from "../../../../components/Reusable/alert";
import { setERPHandlers } from "../../../../utils/erpShortcuts";
import { useApplSettings } from "../../../../Hooks/useApplSettings";

const QMSMasterPage = ({ tab, config }) => {
  const { masterType, title, nameLabel, extraFields, columns, toForm, toDb, hasSettings, settingsApplName } = config;

  const initialState = {
    group_id: null,
    group_name: "",
    active: true,
    ...Object.fromEntries(extraFields.map((f) => [f.key, ""])),
  };

  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Settings hook — agar hasSettings false hai to applName undefined jayega, hook khud no-op karega
  const { settingsConfig, settingsDefaults, onSettingsSave } = useApplSettings(
    hasSettings ? settingsApplName : null
  );

  const {
    mode, formData, setFormData, showForm, setShowForm, saving,
    handleView, handleAdd, handleModify, performSave, rights, handleEditCancel,
    activeTab, setActiveTab,
  } = useERPMode(
    initialState,
    async (data, isEdit) => {
      const payload = toDb(data);
      return isEdit
        ? await updateMaster(masterType, payload.id, payload)
        : await createMaster(masterType, payload);
    },
    () => {},
    tab?.appl_name
  );

  const loadGroups = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getMasters(masterType);
      const rows = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      const finalData = rows.map(toForm);
      setList(finalData);
      return finalData;
    } catch (err) {
      alertError("Fetch Error", `Failed to load ${title}`);
      return [];
    } finally {
      setLoading(false);
    }
  }, [masterType]);

  useEffect(() => { loadGroups(); }, [loadGroups]);

  useEffect(() => {
    if (showForm && mode === "view" && list.length > 0) {
      setFormData(list[currentIndex]);
    }
  }, [currentIndex, list, showForm, mode, setFormData]);

  const listWithSr = list.map((item, index) => ({
    ...item,
    Sr: index + 1,
    status: item.active ? "Active" : "Inactive",
  }));

  const handleRowSelect = (row) => {
    const index = list.findIndex((item) => item.group_id === row.group_id);
    if (index !== -1) setCurrentIndex(index);
    handleView(row);
    setShowForm(true);
  };

  // ── AUTO CODE GENERATION — sirf equipment/instrument (jinke extraFields me type:"code" hai) ──
  const codeField = extraFields.find((f) => f.type === "code");

  const generateNextCode = useCallback(() => {
    if (!codeField) return "";
    const prefix = settingsDefaults?.codePrefix || "";
    const nums = list
      .map((item) => item[codeField.key] || "")
      .filter((code) => code.startsWith(prefix))
      .map((code) => parseInt(code.slice(prefix.length), 10))
      .filter((n) => !isNaN(n));
    const next = (nums.length > 0 ? Math.max(...nums) : 0) + 1;
    return `${prefix}${String(next).padStart(3, "0")}`;
  }, [list, settingsDefaults, codeField]);

  const handleAddNew = () => {
    handleAdd();
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formData.group_name) {
      alertError("Validation", `${nameLabel} is required`);
      return;
    }
    const dataToSave = { ...formData, group_id: formData.group_id ?? null };
    const response = await performSave("group_id", dataToSave);
    if (response?.success) {
      showToast({ icon: "success", title: "Saved Successfully" });
      const freshList = await loadGroups();
      let newIndex = freshList.findIndex((i) => i.group_id === dataToSave.group_id);
      if (newIndex === -1) newIndex = freshList.findIndex((i) => i.group_name === dataToSave.group_name);
      if (newIndex === -1 && freshList.length > 0) newIndex = 0;
      if (newIndex !== -1) {
        setCurrentIndex(newIndex);
        setFormData({ ...freshList[newIndex] });
      }
    }
  };

  const handleDelete = async (row) => {
    const confirmed = await confirmDelete({ title: `Delete "${row.group_name}"?` });
    if (confirmed) {
      const res = await deleteMaster(masterType, row.group_id);
      if (res.success) {
        showToast({ icon: "success", title: "Deleted" });
        loadGroups();
        setShowForm(false);
      }
    }
  };

  const handleDeleteMultiple = async (selected) => {
    const ids = (selected || []).map((item) => (typeof item === "object" ? item.group_id : item));
    if (ids.length === 0) return;
    const confirmed = await confirmDelete({ title: `Delete ${ids.length} record(s)?` });
    if (!confirmed) return;
    try {
      const results = await Promise.all(ids.map((id) => deleteMaster(masterType, id)));
      const failed = results.filter((r) => !r?.success).length;
      showToast({
        icon: failed === 0 ? "success" : "warning",
        title: failed === 0 ? `${ids.length} deleted` : `${ids.length - failed} deleted, ${failed} failed`,
      });
      loadGroups();
      setShowForm(false);
    } catch (err) {
      alertError("Delete Error", `Failed to delete some ${title}`);
    }
  };

  useEffect(() => {
    setERPHandlers({
      onNextRecord: () => setCurrentIndex((p) => Math.min(p + 1, list.length - 1)),
      onPrevRecord: () => setCurrentIndex((p) => Math.max(p - 1, 0)),
      onNew: handleAddNew,
      onSave: handleSave,
      onEsc: () => {
        setShowForm(false);
        setActiveTab("search");
        if (mode === "add") setFormData(initialState);
      },
    });
  }, [list, handleAdd, formData, mode]);

  const handleTabChange = useCallback((targetTab) => {
    setActiveTab(targetTab);
    setShowForm(targetTab === "entry" || targetTab === "settings");
  }, [setActiveTab, setShowForm]);

  return (
    <div className="h-full w-full">
      {showForm ? (
        <QMSMasterForm
          title={title}
          nameLabel={nameLabel}
          formData={formData}
          setFormData={setFormData}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setActiveTab("entry"); setFormData(initialState); }}
          onDelete={handleDelete}
          mode={mode}
          saving={saving}
          onModify={handleModify}
          onNewEntry={handleAddNew}
          currentRecord={currentIndex + 1}
          totalRecords={list.length}
          rights={rights}
          onEditCancel={handleEditCancel}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onPrevRecord={() => setCurrentIndex((p) => Math.max(p - 1, 0))}
          onNextRecord={() => setCurrentIndex((p) => Math.min(p + 1, list.length - 1))}
          showActive={true}
          extraFields={extraFields}
          showSettingsTab={!!hasSettings}
          settingsConfig={settingsConfig}
          settingsDefaults={settingsDefaults}
          onSettingsSave={onSettingsSave}
        />
      ) : (
        <Table
          activeTab={activeTab}
          showSettingsTab={!!hasSettings}
          onTabChange={handleTabChange}
          title={title}
          onDeleteMultiple={handleDeleteMultiple}
          data={listWithSr}
          columns={columns}
          rowKey="group_id"
          loading={loading}
          onAdd={rights?.add === 1 ? handleAddNew : null}
          onRowDoubleClick={handleRowSelect}
        />
      )}
    </div>
  );
};

export default QMSMasterPage;