import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useERPMode } from "../../../../components/Reusable/form/useFormMode";
import { useApplSettings } from "../../../../Hooks/useApplSettings";
import { useGroupOptions } from "../../../../Hooks/useUserGroupOption";
import { useWorkflowConfig } from "../../../../Hooks/useWorkflowConfig";
import { usePagedList } from "../../../../Hooks/usePagedList";
import { confirmDelete, confirmWarning, showToast, alertError, alertWarning } from "../../../../components/Reusable/alert";
import { getNextRecordNo, advanceState, getRecordHistory } from "./QmsAPI";
import { useAuth } from "../../../../theme/AuthContext";
import { useTab } from "../../../../theme/TabContext";
import { useQmsIntent } from "../QMSIntent/QMSintent";

export function useQmsModule({
  moduleKey,
  title,              // 'Deviation'
  applName,           // settings ka appl name
  initialState,
  tabs, tabStage,     // deviationTabs, deviationTabStage
  getRequired,        // (status) => [keys]
  api,                // { list, create, update, remove }  (paged mode mein `list` ki zaroorat nahi)
  onCloseTab,
  autoFieldMap = {},
  // 🆕 server-side pagination (optional). fetchPage dene par module paged mode mein chalta hai:
  fetchPage,          // (params) => Promise<{ data, total }>   — stable function
  filters,            // applied filters { Status: "...", ... }
  mapRow,             // (row) => row
}) {
  const { options: groupOptions } = useGroupOptions();
  const [lines, setLines] = useState({});
  const { wfConfig } = useWorkflowConfig();
  const workflowConfig = wfConfig?.[moduleKey] || null;
  const { user } = useAuth();
  const { closeTab, registerCloseGuard } = useTab();
  const currentUserRole = String(user?.user_group ?? "").trim() || null;
  // Sign ke liye current user ka display name
  const currentUserName = user?.user_name || user?.user_id || null;

  // ── list: normal mode = poori list, paged mode = Table ke current page ki rows ──
  const isPaged = !!fetchPage;
  const paged = usePagedList({ fetchPage, filters, mapRow });
  const [rawList, setList] = useState([]);
  const [busy, setLoading] = useState(false);
  // Sr sirf Table ke liye hai; list/savedFormData mein pehle jaisa (bina Sr) rakho
  const list = useMemo(
    () => (isPaged ? paged.rows.map(({ Sr, ...r }) => r) : rawList),
    [isPaged, paged.rows, rawList]
  );
  const loading = isPaged ? (paged.loading || busy) : busy;
  const pageOffset = isPaged ? Math.max(0, (paged.rows[0]?.Sr ?? 1) - 1) : 0;

  const [currentIndex, setCurrentIndex] = useState(0);
  const navRef = useRef(false);   // 🆕 true = index Prev/Next se badla hai (form ko sync karo)
  const preAddSnapshotRef = useRef(null);
  const [history, setHistory] = useState(null);

  const { settingsConfig, settingsDefaults, onSettingsSave } = useApplSettings(applName || title);
  // settings toggles -> { autoCreateCapa: true, ... }
  const auto = useMemo(() => Object.fromEntries(
    Object.entries(settingsDefaults || {})
      .filter(([k]) => k.startsWith("autoCreate"))
      .map(([k, v]) => [k, v === true || v === "true"])
  ), [settingsDefaults]);
  // Manual numbering enabled in this module's settings -> RecordNo becomes editable on Add
  const recordNoEditable = String(settingsDefaults?.numberingMode || "Auto") === "Manual";

  const loadData = useCallback(async () => {
    // paged mode: current page dobara laao
    if (isPaged) {
      try {
        return await paged.refresh();
      } catch {
        alertError("Load Error", `Failed to load ${title} records`);
        return [];
      }
    }
    try {
      setLoading(true);
      const res = await api.list();
      const arr = Array.isArray(res) ? res : (res?.data || []);
      setList(arr);
      return arr;
    } catch {
      alertError("Load Error", `Failed to load ${title} records`);
      return [];
    } finally { setLoading(false); }
  }, [api, title, isPaged, paged.refresh]);

  const erp = useERPMode(
    initialState,
    async (d) => (d.Id ? api.update(d.Id, d) : api.create(d)),
    loadData,
    title,
  );
  const { mode, formData, setFormData, performSave, setShowForm, setActiveTab,
    handleAdd, handleModify, handleView, handleEditCancel, isDirty } = erp;

  const isRecordClosed = useMemo(
    () => !!workflowConfig?.closedStates?.includes(formData?.Status),
    [workflowConfig, formData?.Status]
  );

  // paged mode mein pehli load Table khud karta hai (onPageChange) — yahan dobara nahi
  useEffect(() => { if (!isPaged) loadData(); }, [loadData, isPaged]);

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

  const requiredFields = useMemo(() => {
    const base = getRequired(formData?.Status || workflowConfig?.wf?.[0] || "");
    const hidden = Object.entries(autoFieldMap).filter(([k]) => auto[k] === false).flatMap(([, f]) => f);
    return base.filter((k) => !hidden.includes(k));   // hidden field can't be mandatory
  }, [formData?.Status, getRequired, workflowConfig, auto, autoFieldMap]);

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
    preAddSnapshotRef.current = (mode === "view" && formData?.Id) ? formData : null;
    handleAdd();
    setShowForm(true);
    setActiveTab("entry");
    const recordNo = await getNextRecordNo(moduleKey);
    setFormData((p) => ({ ...p, RecordNo: recordNo }));
  }, [handleAdd, setShowForm, setActiveTab, setFormData, moduleKey, mode, formData]);

  // Add button hamesha dikhega — permission check click pe hoga
  const stage0Roles = useMemo(() => {
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

  // current record jis stage pe hai, wahan kaunse roles allowed hain
  const modifyStageRoles = useMemo(() => {
    if (!workflowConfig?.sections?.length) return [];
    const stage = workflowConfig.wf ? workflowConfig.wf.indexOf(formData?.Status) : -1;
    return [...new Set(
      (workflowConfig.sections || [])
        .filter((s) => s.stage === stage)
        .flatMap((s) => (Array.isArray(s.role) ? s.role : [s.role]))
        .filter(Boolean)
    )];
  }, [workflowConfig, formData?.Status]);

  // kya current user isi stage par modify kar sakta hai
  const canModifyNow = useMemo(() => {
    if (isRecordClosed) return false;   // sabse pehle check — sabse zaroori guard
    if (!workflowConfig?.sections?.length) return true;
    const norm = (v) => String(v ?? "").trim().toLowerCase();
    if (["admin", "administrator", "superadmin", "super admin"].includes(norm(currentUserRole))) return true;
    if (!modifyStageRoles.length) return true;
    return modifyStageRoles.map(norm).includes(norm(currentUserRole));
  }, [workflowConfig, modifyStageRoles, currentUserRole, isRecordClosed]);

  const handleModifyGuarded = useCallback(() => {
    if (!formData?.Id) return;   // koi real record hi nahi hai — kuch mat karo (Alt+M bhi safe)
    if (isRecordClosed) {
      alertWarning("Cannot modify", `This record is already "${formData?.Status}" and cannot be modified.`);
      return;
    }
    if (!canModifyNow) {
      alertWarning(
        "Not your stage",
        `This record at "${formData?.Status}" can only be modified by: ${modifyStageRoles.join(", ") || "the assigned role"}.\n\nYour role: ${currentUserRole || "—"}`
      );
      return;
    }
    handleModify();
  }, [formData?.Id, isRecordClosed, canModifyNow, modifyStageRoles, currentUserRole, formData?.Status, handleModify]);

  const handleRowSelect = useCallback(async (row) => {
    // paged mode mein `list` = Table ka current page, to row isi mein milti hai
    const i = list.findIndex((x) => x.Id === row.Id);
    if (i !== -1) setCurrentIndex(i);

    let full = row;
    if (api.getOne) {
      const res = await api.getOne(row.Id);
      if (res?.data) full = res.data;
    }
    handleView(full);
    setShowForm(true);
    setActiveTab("entry");
  }, [list, api, handleView, setShowForm, setActiveTab]);

  // Prev/Next navigation ke liye — MasterPage isi ko "setCurrentIndex" naam se use karta hai
  const setCurrentIndexGuarded = useCallback((updater) => {
    navRef.current = true;   // 🆕 ab form ko naye index ke record se sync karna hai
    setCurrentIndex(updater);
  }, []);

  // 🆕 Sync sirf Prev/Next ke baad (navRef). Pehle ye list/index kisi bhi badlav par chalta tha —
  //    paging ke saath stale index se form doosre record se bhar jaata.
  useEffect(() => {
    if (!navRef.current) return;
    if (!(erp.showForm && mode === "view" && list.length > 0)) return;
    const row = list[currentIndex];
    if (!row) return;
    if (row.Id === formData?.Id) { navRef.current = false; return; }
    let alive = true;
    (async () => {
      let full = row;
      if (api.getOne) {
        try {
          const res = await api.getOne(row.Id);
          if (res?.data) full = res.data;
        } catch { /* fallback */ }
      }
      if (alive) {
        setFormData(full);
        navRef.current = false;
      }
    })();
    return () => { alive = false; };
  }, [currentIndex, list, erp.showForm, mode, setFormData, formData?.Id, api]);

  const handleSave = useCallback(async (localData) => {
    const res = await performSave("Id", { ...localData, Id: localData.Id ?? null, isDraft: false });
    if (!res?.success) return;
    showToast({ icon: "success", title: "Saved Successfully" });
    if (res.capaRef) showToast({ icon: "info", title: `CAPA created: ${res.capaRef}` });
    if (res.deviationRef) showToast({ icon: "info", title: `Deviation created: ${res.deviationRef}` });

    const savedId = res.data?.Id ?? localData.Id;
    const arr = await loadData();                   // array wapas milta hai
    if (savedId && arr?.length) {
      const idx = arr.findIndex((x) => x.Id === savedId);
      if (idx !== -1) setCurrentIndex(idx);           // sahi record pe point karo
    }
  }, [performSave, loadData]);

  const handleSignedSave = useCallback(async (localData, typedName, newStatus, reason) => {
    if (newStatus === "Rejected" && !localData?.Id) {
      alertWarning("Nothing to reject", "Save the record first, or use Cancel to discard it.");
      return;
    }
    const payload = { ...localData, isDraft: false };
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
          if (isPaged) {
            // sabse nayi 1 row (CreatedAt DESC) — poori list nahi
            const r1 = await fetchPage({ page: 1, pageSize: 1, sortField: "CreatedAt", sortOrder: "desc" });
            savedId = r1?.data?.[0]?.Id ?? null;
          } else {
            const list2 = await api.list();
            const arr = Array.isArray(list2) ? list2 : (list2?.data || []);
            setList(arr);
            savedId = arr[0]?.Id ?? null;       // list CreatedAt DESC
          }
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

    const adv = await advanceState(moduleKey, savedId, newStatus, typedName, reason);
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
  }, [api, moduleKey, title, loadData, setShowForm, setActiveTab, isPaged, fetchPage]);

  const handleDelete = useCallback(async (row) => {
    // Pre-check: agar record stage-0 se aage badh chuka hai, matlab e-sign ho chuka hai —
    // is system mein stage kabhi bina e-sign ke advance nahi hoti, isliye ye check reliable hai
    const isAdvanced = workflowConfig?.wf ? workflowConfig.wf.indexOf(row?.Status) > 0 : false;
    const isClosed = workflowConfig?.closedStates?.includes(row?.Status);

    if (isAdvanced || isClosed) {
      alertWarning("Cannot delete", "This record has been electronically signed and cannot be deleted.");
      return;
    }

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
  }, [api, title, setShowForm, setActiveTab, loadData, workflowConfig]);

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

  // Tab-bar ka X dabane se pehle poochta hai: "unsaved data hai, band karu?"
  // Yahi dirty-check handleFormExit "Cancel" button par bhi karta hai.
  const confirmCloseGuard = useCallback(async () => {
    const wasAddMode = mode === "add";
    const hasData = wasAddMode && Object.entries(formData || {}).some(([k, v]) => {
      if (k === "RecordNo" || k === "Id" || k === "Status") return false;
      if (initialState[k] !== undefined && initialState[k] === v) return false;
      return String(v ?? "").trim() !== "";
    });
    const dirty = wasAddMode ? hasData : isDirty;
    if (!dirty) return true;          // kuch bhi badla nahi, seedha band kar do
    return await confirmWarning({});  // user se poocho
  }, [mode, formData, initialState, isDirty]);

  useEffect(() => {
    registerCloseGuard?.(confirmCloseGuard);
    return () => registerCloseGuard?.(null);
  }, [registerCloseGuard, confirmCloseGuard]);

  // Cancel / Discard — reset karo, form khula rakho
  const handleFormExit = useCallback(async () => {
    const wasAddMode = mode === "add";
    const hasData = wasAddMode && Object.entries(formData || {}).some(([k, v]) => {
      if (k === "RecordNo" || k === "Id" || k === "Status") return false;
      if (initialState[k] !== undefined && initialState[k] === v) return false;
      return String(v ?? "").trim() !== "";
    });
    const dirty = wasAddMode ? hasData : isDirty;

    if (dirty) {
      const confirmed = await confirmWarning({});
      if (!confirmed) return;
      showToast({ icon: "info", title: "Changes discarded" });
    }

    if (!wasAddMode) {
      handleView(savedFormData || formData);
      setShowForm(true);
      return;
    }

    if (preAddSnapshotRef.current) {
      handleView(preAddSnapshotRef.current);
      setShowForm(true);
      setActiveTab("entry");
      preAddSnapshotRef.current = null;
      return;
    }

    // koi pehla record nahi tha bhi — list pe NAHI jaate, isi form-page par View-mode (blank) me rahenge
    handleView(initialState);
    setShowForm(true);
    setActiveTab("entry");
  }, [mode, formData, initialState, isDirty, savedFormData, handleView, setShowForm, setActiveTab]);

  const handleTabExit = useCallback(() => {
    if (closeTab) { closeTab(); return; }
    setShowForm(false);
    setActiveTab("search");
    setFormData(initialState);
  }, [closeTab, setShowForm, setActiveTab, setFormData, initialState]);

  const handleSaveDraft = useCallback(async (localData) => {
    if (isRecordClosed) {
      alertWarning("Cannot save as draft", `This record is already "${localData?.Status}" and cannot be saved as a draft.`);
      return { success: false, message: "Record is closed" };
    }
    const payload = { ...localData, isDraft: true, Id: localData.Id ?? null };
    const res = payload.Id ? await api.update(payload.Id, payload) : await api.create(payload);
    if (res && res.success === false) {
      alertError("Save Draft Error", res.message || "Failed to save draft");
      return res;
    }
    const savedId = payload.Id ?? res?.data?.Id ?? res?.Id ?? null;
    if (savedId && !payload.Id) setFormData((p) => ({ ...p, Id: savedId }));
    showToast({ icon: "info", title: `Saved as draft — Stage: ${payload.Status || "Open"}` });
    const arr = await loadData();
    if (savedId && arr?.length) {
      const idx = arr.findIndex((x) => x.Id === savedId);
      if (idx !== -1) setCurrentIndex(idx);
    }
    return res;
  }, [api, setFormData, isRecordClosed, loadData, setCurrentIndex]);

  useQmsIntent(moduleKey, { handleAddNewGuarded, handleRowSelect, list, loading });

  // 🆕 form ke "3 / 120" counter ke liye: paged mode mein poore data ke hisaab se
  const currentRecord = list.length ? pageOffset + currentIndex + 1 : 0;
  const totalCount = isPaged ? paged.total : list.length;

  return {
    ...erp,
    groupOptions, workflowConfig, currentUserRole, currentUserName, isRecordClosed,
    list, setList, loading, currentIndex, setCurrentIndex: setCurrentIndexGuarded,
    history, loadData,
    settingsConfig, settingsDefaults, onSettingsSave,
    requiredFields, completedTabs, savedFormData, canAddNew,
    handleHeaderTabChange, handleAddNew, handleAddNewGuarded, handleModifyGuarded, handleRowSelect,
    handleSave, handleSaveDraft, handleSignedSave, handleDelete, handleDeleteMultiple, handleFormExit, handleTabExit, recordNoEditable, auto,
    // 🆕 paged mode (Table ke liye) + form counter
    rows: paged.rows, total: paged.total,
    handlePageChange: paged.handlePageChange, refresh: paged.refresh,
    currentRecord, totalCount,
  };
}