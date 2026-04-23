import { useState, useCallback, useMemo, useEffect } from 'react';
import { alertError, alertWarning, showToast, confirmWarning } from '../alert'; 

export const useERPMode = (initialState, onSaveApi, loadList, appl_name) => {
const [mode, setMode] = useState("view");
  const [formData, setFormData] = useState(initialState);
  const [originalData, setOriginalData] = useState(null);
const [showForm, setShowForm] = useState(true);
  const [saving, setSaving] = useState(false);
  const [canPrint, setCanPrint] = useState(false); 
  const isDirty = useMemo(() => {
    if (mode === "view") return false;
    return JSON.stringify(formData) !== JSON.stringify(originalData);
  }, [formData, originalData, mode]);
 
  const rights = useMemo(() => {
    try {
      const user = JSON.parse(sessionStorage.getItem("user") || "{}");
      const allPerms = JSON.parse(sessionStorage.getItem("permissions") || "null");
      const isAdmin = user?.role?.toLowerCase() === "admin";
      if (isAdmin) return { add: 1, mod: 1, del: 1, print: 1, modDays: 0 };
      const raw = allPerms?.[appl_name] || { add: 0, mod: 0, del: 0, print: 0, modDays: 0 };
      return {
        add: Number(raw.add || 0), mod: Number(raw.mod || 0),
        del: Number(raw.del || 0), print: Number(raw.print || 0),
        modDays: Number(raw.modDays || 0)
      };
    } catch (e) {
      return { add: 0, mod: 0, del: 0, print: 0, modDays: 0 };
    }
  }, [appl_name]);

  const canAdd = rights.add === 1;
  const canModify = rights.mod === 1;

  const isWithinLimit = useCallback((recordDate, limit) => {
    if (!recordDate || limit === 0) return true;
    const created = new Date(recordDate);
    const today = new Date();
    const diffTime = Math.abs(today - created);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) <= limit;
  }, []);

  // Handlers (Enhanced)
  const handleAdd = useCallback(() => {
    if (!canAdd) {
      alertError("Access Denied", `You do not have permission to ADD in ${appl_name}`);
      return;
    }
    setFormData(initialState);
    setOriginalData(initialState);
    setMode("add");
    setShowForm(true);
    setCanPrint(false);
  }, [initialState, canAdd, appl_name]);

  const handleModify = useCallback(() => {
    if (!canModify) {
      alertError("Access Denied", "You do not have MODIFY rights.");
      return;
    }
    const recordDate = formData.Created_date || formData.entry_date;
    if (!isWithinLimit(recordDate, rights.modDays)) {
      alertWarning("Entry Locked", `This record is over ${rights.modDays} days old.`);
      return;
    }
    setOriginalData({ ...formData });
    setMode("edit");
    setCanPrint(false);
  }, [formData, canModify, rights.modDays, isWithinLimit]); 
const handleEditCancel = useCallback(async () => { 
  if (isDirty) {
    const confirmed = await confirmWarning({
      title: "Discard Changes?",
      text: "You have unsaved changes. Do you want to reset the form?",
      confirmButtonText: "Yes, Reset",
      cancelButtonText: "No, Stay"
    });

    if (confirmed) {
      setFormData(originalData || initialState);
      showToast({ icon: "info", title: "Form Reset" });
    }
    return; 
  } 
  if (!showForm) { 
    setShowForm(true); 
  } else { 
    if (mode === "add") {
      setShowForm(false); // Add mode se exit karke list pe jao
    } else if (mode === "edit") {
      setMode("view");    // Edit se wapas View mode pe aao
    } else if (mode === "view") {
      setShowForm(false); // View mode se exit karke list pe jao
    }
  }
}, [isDirty, mode, originalData, initialState, showForm]);

useEffect(() => {
  const handleEsc = (event) => { 
    if (event.key === "Escape") { 
      if (mode === "add" || mode === "edit") {
        console.log("ESC disabled in Add/Edit mode");
        return; 
      }
      const tag = document.activeElement.tagName.toLowerCase();
      if (tag === "input" || tag === "textarea") {
        // Input se focus hatane ke liye Esc use ho sakta hai
        document.activeElement.blur();
        return;
      }
      
      handleEditCancel();
    }
  };
  window.addEventListener("keydown", handleEsc);
  return () => window.removeEventListener("keydown", handleEsc);
}, [handleEditCancel, mode]); // showForm hataya taaki humesha chale

  const performSave = useCallback(async (idField) => {
    if (saving) return { success: false };
    setSaving(true);
    try {
      const isEdit = mode === "edit";
      if (!formData || Object.keys(formData).length === 0) throw new Error("No data to save");
      
      const response = await onSaveApi(formData, isEdit);
      if (response.success) {
        const savedData = response.data || formData;
        setFormData(savedData);
        setOriginalData(savedData);
        setMode("view");
        setCanPrint(true);
        if (loadList) await loadList();
        showToast({ icon: "success", title: "Saved Successfully" });
        return { success: true, data: savedData };
      }
      alertError("Save Failed", response.message || "Database error");
      return { success: false };
    } catch (err) {
      alertError("System Error", err.message);
      return { success: false };
    } finally {
      setSaving(false);
    }
  }, [saving, mode, formData, onSaveApi, loadList]);

const handleView = useCallback((data) => {
    setFormData(data);
    setOriginalData(data);
    setMode("view");
    setShowForm(true); // Form open karein
    setCanPrint(rights.print === 1);
  }, [rights.print]);
  return {
    mode, setMode, formData, setFormData,
    showForm, setShowForm, saving, canPrint,
    rights, isDirty,
    handleView, 
    handleAdd, handleModify, handleEditCancel, performSave,
    isAddMode: mode === "add",
    isViewMode: mode === "view",
    isEditMode: mode === "edit"
  };
};