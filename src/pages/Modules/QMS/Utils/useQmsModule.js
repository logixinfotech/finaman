import { useState, useEffect, useCallback, useMemo } from "react";
import { useERPMode } from "../../../../components/Reusable/form/useFormMode";
import { useApplSettings } from "../../../../Hooks/useApplSettings";
import { useGroupOptions } from "../../../../Hooks/useUserGroupOption";
import { useWorkflowConfig } from "../../../../Hooks/useWorkflowConfig";
import { confirmDelete, showToast, alertError } from "../../../../components/Reusable/alert";
import { getNextRecordNo, advanceState, getRecordHistory } from "./QmsAPI";

export function getCurrentUser() {
  try { return JSON.parse(sessionStorage.getItem("user") || "{}"); }
  catch { return {}; }
}

/**
 * Har QMS workflow module ka common logic.
 * Page me sirf config + JSX bachega.
 */
export function useQmsModule({
  moduleKey,          // 'deviation' | 'incident' | 'capa'
  title,              // 'Deviation'
  applName,           // settings ka appl name
  initialState,
  tabs, tabStage,     // deviationTabs, deviationTabStage
  getRequired,        // (status) => [keys]
  api,                // { list, create, update, remove }
}) {
  const { options: groupOptions } = useGroupOptions();
  const { wfConfig } = useWorkflowConfig();
  const workflowConfig = wfConfig?.[moduleKey] || null;
  const currentUserRole = getCurrentUser()?.user_group;

  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [history, setHistory] = useState(null);

  const { settingsConfig, settingsDefaults, onSettingsSave } = useApplSettings(applName || title);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.list();
      setList(Array.isArray(res) ? res : (res?.data || []));
    } catch {
      alertError("Load Error", `Failed to load ${title} records`);
    } finally { setLoading(false); }
  }, [api, title]);

  const erp = useERPMode(
    initialState,
    async (d) => (d.Id ? api.update(d.Id, d) : api.create(d)),
    loadData,
    title,
  );
  const { mode, formData, setFormData, performSave, setShowForm, setActiveTab,
          handleAdd, handleView, handleEditCancel, isDirty } = erp;

  useEffect(() => { loadData(); }, [loadData]);

  // record history (sidebar + audit tab)
  useEffect(() => {
    const rec = formData?.RecordNo, id = formData?.Id;
    if (!rec || !id) { setHistory(null); return; }
    setHistory(null);
    let alive = true;
    getRecordHistory(moduleKey, rec)
      .then((res) => {
        if (!alive) return;
        const h = res?.stageHistory ? res : res?.data;
        setHistory(h?.stageHistory ? h : null);
      })
      .catch((e) => console.error("[record-history]", e));
    return () => { alive = false; };
  }, [moduleKey, formData?.Id, formData?.RecordNo, formData?.Status]);

  // view mode me list se sync
  useEffect(() => {
    if (erp.showForm && mode === "view" && list.length > 0) setFormData(list[currentIndex]);
  }, [currentIndex, list, erp.showForm, mode, setFormData]);

  const requiredFields = useMemo(
    () => getRequired(formData?.Status || workflowConfig?.wf?.[0] || ""),
    [formData?.Status, getRequired, workflowConfig]
  );

  const completedTabs = useMemo(() => {
    if (!workflowConfig?.wf) return [];
    const cur = workflowConfig.wf.indexOf(formData?.Status);
    if (cur < 0) return [];
    return tabs.filter((t) => tabStage[t] < cur);
  }, [formData?.Status, workflowConfig, tabs, tabStage]);

  const savedFormData = useMemo(
    () => (formData?.Id && list[currentIndex]?.Id === formData.Id ? list[currentIndex] : null),
    [formData?.Id, list, currentIndex]
  );

  const handleHeaderTabChange = useCallback((t) => {
    setActiveTab(t);
    setShowForm(t !== "search");
  }, [setActiveTab, setShowForm]);

  const handleAddNew = useCallback(async () => {
    handleAdd();
    setShowForm(true);
    setActiveTab("entry");
    const recordNo = await getNextRecordNo(moduleKey);
    setFormData((p) => ({ ...p, RecordNo: recordNo }));
  }, [handleAdd, setShowForm, setActiveTab, setFormData, moduleKey]);

  const handleRowSelect = useCallback((row) => {
    const i = list.findIndex((x) => x.Id === row.Id);
    if (i !== -1) setCurrentIndex(i);
    handleView(row);
    setShowForm(true);
    setActiveTab("entry");
  }, [list, handleView, setShowForm, setActiveTab]);

  const syncIndex = useCallback((arr, id) => {
    const i = arr.findIndex((x) => x.Id === id);
    if (i !== -1) setCurrentIndex(i);
  }, []);
  
const handleSave = useCallback(async (localData) => {
    const res = await performSave("Id", { ...localData, Id: localData.Id ?? null });
    if (!res?.success) return;
    showToast({ icon: "success", title: "Saved Successfully" });
    if (res.capaRef)      showToast({ icon: "info", title: `CAPA created: ${res.capaRef}` });
    if (res.deviationRef) showToast({ icon: "info", title: `Deviation created: ${res.deviationRef}` });
    await loadData();
  }, [performSave, loadData]);

  const handleSignedSave = useCallback(async (localData, typedName, newStatus) => {
    const res = await performSave("Id", { ...localData, Id: localData.Id ?? null });
    if (!res?.success) { alertError("Save Error", `Failed to save ${title}`); return; }

    let savedId = localData.Id ?? res?.id ?? res?.data?.Id ?? null;
    if (!savedId) {                       // add mode — RecordNo se dhundo
      const r = await api.list();
      const arr = Array.isArray(r) ? r : (r?.data || []);
      setList(arr);
      savedId = arr.find((x) => x.RecordNo === localData.RecordNo)?.Id ?? null;
      if (savedId) syncIndex(arr, savedId);
    }
    if (!savedId) {
      alertError("Advance Error", "Record saved but Id not found — stage not advanced");
      await loadData(); return;
    }

    const adv = await advanceState(moduleKey, savedId, newStatus, typedName);
    if (!adv?.success) { alertError("Advance Error", adv?.message || "Failed to advance stage"); return; }
    showToast({ icon: "success", title: `Saved & moved to ${newStatus}` });
    await loadData();
    setShowForm(false);
    setActiveTab("search");
  }, [performSave, api, moduleKey, loadData, setShowForm, setActiveTab, syncIndex, title]);

  const handleDelete = useCallback(async (row) => {
    if (!(await confirmDelete({ title: `Delete ${title} "${row.RecordNo || row.Id}"?` }))) return;
    try {
      await api.remove(row.Id);
      showToast({ icon: "success", title: "Deleted" });
      setShowForm(false); setActiveTab("search");
      await loadData();
    } catch { alertError("Delete Error", `Failed to delete ${title}`); }
  }, [api, title, setShowForm, setActiveTab, loadData]);

  const handleDeleteMultiple = useCallback(async (selected) => {
    const ids = (selected || []).map((x) => (typeof x === "object" ? x.Id : x));
    if (!ids.length) return;
    if (!(await confirmDelete({ title: `Delete ${ids.length} ${title} record(s)?` }))) return;
    try {
      const results = await Promise.all(ids.map((id) => api.remove(id)));
      const failed = results.filter((r) => !r?.success).length;
      showToast({
        icon: failed ? "warning" : "success",
        title: failed ? `${ids.length - failed} deleted, ${failed} failed` : `${ids.length} deleted`,
      });
      setShowForm(false); setActiveTab("search");
      await loadData();
    } catch { alertError("Delete Error", `Failed to delete some ${title} records`); }
  }, [api, title, setShowForm, setActiveTab, loadData]);

  const handleFormExit = useCallback(async () => {
    const wasDirty = isDirty;
    await handleEditCancel();
    if (!wasDirty) {
      setShowForm(false); setActiveTab("search");
      setFormData(initialState);
    }
  }, [isDirty, handleEditCancel, setShowForm, setActiveTab, setFormData, initialState]);

  return {
    ...erp,
    groupOptions, workflowConfig, currentUserRole,
    list, setList, loading, currentIndex, setCurrentIndex,
    history, loadData,
    settingsConfig, settingsDefaults, onSettingsSave,
    requiredFields, completedTabs, savedFormData,
    handleHeaderTabChange, handleAddNew, handleRowSelect,
    handleSave, handleSignedSave, handleDelete, handleDeleteMultiple, handleFormExit,
  };
}