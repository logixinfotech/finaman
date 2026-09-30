import { useState, useCallback, useMemo, useEffect } from 'react';
import { alertError, alertWarning, showToast, confirmWarning } from '../alert';  
import { getRights } from  '../../../utils/permissions'

export const useERPMode = (initialState, onSaveApi, loadList, appl_name) => {
  const [mode, setMode] = useState("view");
  const [formData, setFormData] = useState(initialState);
  const [originalData, setOriginalData] = useState(null);
  const [showForm, setShowForm] = useState(true);
  const [saving, setSaving] = useState(false);  
  const rights = useMemo(() => getRights(appl_name), [appl_name]);
  const canPrint = useMemo(
  () => rights.print === 1 && mode === "view" && !!formData?.Id,
  [rights.print, mode, formData?.Id]
);
  const [activeTab, setActiveTab] = useState("entry");
  const canAdd = rights.add === 1;
  const canModify = rights.mod === 1; 
  const isDirty = useMemo(() => {
    if (mode === "view") return false;
    return JSON.stringify(formData) !== JSON.stringify(originalData);
  }, [formData, originalData, mode]);

  const isWithinLimit = useCallback((recordDate, limit) => {
    if (!recordDate || limit === 0) return true;
    const created = new Date(recordDate);
    const today = new Date();
    const diffTime = Math.abs(today - created);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) <= limit;
  }, []);

  // Handlers
  const handleAdd = useCallback(() => {
    if (!canAdd) {
      alertError("Access Denied", `You do not have permission to ADD in ${appl_name}`);
      return;
    }
    setFormData(initialState);
    setOriginalData(initialState);
    setMode("add");
    setShowForm(true); 
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
      setActiveTab("entry");   // ✅ ye line add karo
    } else {
      if (mode === "add") {
        setShowForm(false);
      } else if (mode === "edit") {
        setMode("view");
      } else if (mode === "view") {
        setShowForm(false);
      }
    }
  }, [isDirty, mode, originalData, initialState, showForm, setActiveTab]); // 👈 deps mein setActiveTab add karo

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === "Escape") {
        if (mode === "add" || mode === "edit") return;
        const tag = document.activeElement.tagName.toLowerCase();
        if (tag === "input" || tag === "textarea") {
          document.activeElement.blur();
          return;
        }
        handleEditCancel();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [handleEditCancel, mode]);
 
const performSave = useCallback(async (idField, overrideData = null) => {
    if (saving) return { success: false };
    setSaving(true);
    try {
      const isEdit = mode === "edit"; 
      const dataToSave = overrideData || formData;
      
      if (!dataToSave || Object.keys(dataToSave).length === 0) 
        throw new Error("No data to save");

      const response = await onSaveApi(dataToSave, isEdit);
      if (response.success) {
        const savedData = response.data || dataToSave;
        setFormData(savedData);
        setOriginalData(savedData);
        setMode("view"); 
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
    setShowForm(true); 
  }, [rights.print]);

  return {
    mode, setMode, formData, setFormData,
    showForm, setShowForm, saving, canPrint,
    rights, isDirty,
    handleView,activeTab, setActiveTab,
    handleAdd, handleModify, handleEditCancel, performSave,
    isAddMode: mode === "add",
    isViewMode: mode === "view",
    isEditMode: mode === "edit"
  };
};