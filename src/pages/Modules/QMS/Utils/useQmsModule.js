import { useState, useEffect, useCallback, useMemo } from "react";
import { useERPMode } from "../../../../components/Reusable/form/useFormMode";
import { useApplSettings } from "../../../../Hooks/useApplSettings";
import { useGroupOptions } from "../../../../Hooks/useUserGroupOption";
import { useWorkflowConfig } from "../../../../Hooks/useWorkflowConfig";
import { confirmDelete, showToast, alertError, alertWarning } from "../../../../components/Reusable/alert";
import { getNextRecordNo, advanceState, getRecordHistory } from "./QmsAPI";
import { useAuth } from "../../../../theme/AuthContext";
import { useTab } from "../../../../theme/TabContext";

export function useQmsModule({
  moduleKey,          
  title,              // 'Deviation'
  applName,           // settings ka appl name
  initialState,
  tabs, tabStage,     // deviationTabs, deviationTabStage
  getRequired,        // (status) => [keys]
  api,                // { list, create, update, remove }
  onCloseTab,
}) {
  const { options: groupOptions } = useGroupOptions();
  const [lines, setLines] = useState({});
  const { wfConfig } = useWorkflowConfig();
  const workflowConfig = wfConfig?.[moduleKey] || null;
  const { user } = useAuth();
  const { closeTab } = useTab();          
   const currentUserRole = String(user?.user_group ?? "").trim() || null;

  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [history, setHistory] = useState(null);

  const { settingsConfig, settingsDefaults, onSettingsSave } = useApplSettings(applName || title);
 
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.list();
      const arr = Array.isArray(res) ? res : (res?.data || []);
      setList(arr);
      return arr;                     // 🆕
    } catch {
      alertError("Load Error", `Failed to load ${title} records`);
      return [];                      // 🆕
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
 
  useEffect(() => {
    if (!(erp.showForm && mode === "view" && list.length > 0)) return;
    const row = list[currentIndex];
    if (!row || row.Id === formData?.Id) return;

    let alive = true;
    (async () => {
      let full = row;
      if (api.getOne) {
        try {
          const res = await api.getOne(row.Id);
          if (res?.data) full = res.data;
        } catch { /* fallback: list wali row */ }
      }
      if (alive) setFormData(full);
    })();
    return () => { alive = false; };
  }, [currentIndex, list, erp.showForm, mode, setFormData, formData?.Id, api]);

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

  const canAddNew = useMemo(() => {
    if (!workflowConfig?.sections?.length) return true;
    const norm = (v) => String(v ?? "").trim().toLowerCase();
    if (["admin", "administrator", "superadmin", "super admin"].includes(norm(currentUserRole))) return true;
    const stage0Roles = workflowConfig.sections
      .filter((s) => s.stage === 0)
      .flatMap((s) => (Array.isArray(s.role) ? s.role : [s.role]))
      .map(norm);
    return stage0Roles.includes(norm(currentUserRole));
  }, [workflowConfig, currentUserRole]);

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


    // Add button hamesha dikhega — permission check click pe hoga
  const stage0Roles = useMemo(() => {
    const norm = (v) => String(v ?? "").trim().toLowerCase();
    return (workflowConfig?.sections || [])
      .filter((s) => s.stage === 0)
      .flatMap((s) => (Array.isArray(s.role) ? s.role : [s.role]))
      .filter(Boolean);
  }, [workflowConfig]);

  const handleAddNewGuarded = useCallback(async () => {
    if (!canAddNew) {
      alertWarning(
        "Not your stage",
        `A new ${title} record can only be raised by: ${stage0Roles.join(", ") || "the owning department"}.\n\nYour role: ${currentUserRole || "—"}`
      );
      return;
    }
    await handleAddNew();
  }, [canAddNew, handleAddNew, title, stage0Roles, currentUserRole]);

   const handleRowSelect = useCallback(async (row) => {
    const i = list.findIndex((x) => x.Id === row.Id);
    if (i !== -1) setCurrentIndex(i);

    // 🆕 detail fetch — child lines yahin se aati hain
    let full = row;
    if (api.getOne) {
      const res = await api.getOne(row.Id);
      if (res?.data) full = res.data;
    }
    handleView(full);
    setShowForm(true);
    setActiveTab("entry");
  }, [list, api, handleView, setShowForm, setActiveTab]);

  const handleSave = useCallback(async (localData) => {
    const res = await performSave("Id", { ...localData, Id: localData.Id ?? null, isDraft: false });
    if (!res?.success) return;
    showToast({ icon: "success", title: "Saved Successfully" });
    if (res.capaRef) showToast({ icon: "info", title: `CAPA created: ${res.capaRef}` });
    if (res.deviationRef) showToast({ icon: "info", title: `Deviation created: ${res.deviationRef}` });

    const savedId = res.data?.Id ?? localData.Id;   // 🆕
    const arr = await loadData();                   // 🆕 ab array wapas milta hai
    if (savedId && arr?.length) {                    // 🆕
      const idx = arr.findIndex((x) => x.Id === savedId);
      if (idx !== -1) setCurrentIndex(idx);           // 🆕 sahi record pe point karo
    }
  }, [performSave, loadData]);
  const handleSignedSave = useCallback(async (localData, typedName, newStatus, reason) => {
    const payload = { ...localData };
    delete payload.Sr;

    let savedId = localData.Id ?? null;

    try {
      if (savedId) {
        const r = await api.update(savedId, payload);
        if (r && r.success === false) throw new Error(r.message || "Update failed");
      } else {
        const r = await api.create({ ...payload, Id: null });
        savedId = r?.id ?? r?.data?.Id ?? null;

        if (!savedId) {                       // response me id nahi aayi
          const list2 = await api.list();
          const arr = Array.isArray(list2) ? list2 : (list2?.data || []);
          setList(arr);
          savedId = arr[0]?.Id ?? null;       // list CreatedAt DESC
        }
      }
    } catch (e) {
      alertError("Save Error", e?.message || `Failed to save ${title}`);
      return;
    }

    if (!savedId) {
      alertError("Advance Error", "Record saved but Id not found — stage not advanced");
      await loadData();
      return;
    }

    const adv = await advanceState(moduleKey, savedId, newStatus, typedName, reason);   // 🆕 reason
    if (!adv?.success) {
      alertWarning("Warning", adv?.message || "Failed to advance stage");
      await loadData();
      return;
    }

    showToast({
      icon: newStatus === "Rejected" ? "warning" : "success",
      title: newStatus === "Rejected" ? "Record rejected" : `Saved & moved to ${newStatus}`,
    });

    await loadData();
    setShowForm(false);
    setActiveTab("search");
  }, [api, moduleKey, title, loadData, setShowForm, setActiveTab]); 
  const handleDelete = useCallback(async (row) => {
    if (!(await confirmDelete({ title: `Delete ${title} "${row.RecordNo || row.Id}"?` }))) return;
    try {
      const res = await api.remove(row.Id);
      if (res && res.success === false) {
        alertWarning("Cannot delete", res.message || "This record cannot be deleted.");
        return;
      }
      showToast({ icon: "success", title: "Deleted" });
      setShowForm(false); setActiveTab("search");
      await loadData();
    } catch (e) {
      alertWarning("Cannot delete", e?.message || `Failed to delete ${title}`);
    }
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
   // Cancel / Discard — sirf edit chhodo, form khula rehne do
   // Cancel / Discard — reset karo, form khula rakho
  const handleFormExit = useCallback(async () => {
    const wasAddMode = mode === "add";
    await handleEditCancel();

    if (!wasAddMode) return;   // edit mode → view mode me rehne do ✅

    // ── add mode ──
    // form me kuch bhara hai? (RecordNo aur Id chhod kar)
    const hasData = Object.entries(formData || {}).some(([k, v]) => {
      if (k === "RecordNo" || k === "Id" || k === "Status") return false;
      if (initialState[k] && initialState[k] === v) return false;   // default value hai
      return String(v ?? "").trim() !== "";
    });

    if (hasData) {
      // pehla Cancel → reset karo, form khula rakho
      setShowForm(true);
      setActiveTab("entry");
      setFormData(initialState);
      const recordNo = await getNextRecordNo(moduleKey);
      setFormData((p) => ({ ...p, RecordNo: recordNo }));
    } else {
      // doosra Cancel (form pehle se khali) → list pe jao
      setShowForm(false);
      setActiveTab("search");
      setFormData(initialState);
    }
  }, [mode, formData, initialState, handleEditCancel, setShowForm, setActiveTab, setFormData, moduleKey]);

  // Exit button — poora tab band
    const handleTabExit = useCallback(() => {
    if (closeTab) { closeTab(); return; }
    setShowForm(false);
    setActiveTab("search");
    setFormData(initialState);
  }, [closeTab, setShowForm, setActiveTab, setFormData, initialState]); 
  const handleSaveDraft = useCallback(async (localData) => {
    const payload = { ...localData, isDraft: true, Id: localData.Id ?? null };
    const res = payload.Id ? await api.update(payload.Id, payload) : await api.create(payload);
    const savedId = payload.Id ?? res?.data?.Id ?? res?.Id ?? null;
    if (savedId && !payload.Id) setFormData((p) => ({ ...p, Id: savedId }));
    return res;
  }, [api, setFormData]);
  return {
    ...erp,
    groupOptions, workflowConfig, currentUserRole,
    list, setList, loading, currentIndex, setCurrentIndex,
    history, loadData,
    settingsConfig, settingsDefaults, onSettingsSave,
    requiredFields, completedTabs, savedFormData, canAddNew,
    handleHeaderTabChange, handleAddNew, handleAddNewGuarded, handleRowSelect,
    handleSave, handleSaveDraft, handleSignedSave, handleDelete, handleDeleteMultiple, handleFormExit, handleTabExit,
  };
}