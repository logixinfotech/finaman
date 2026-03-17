import { useState, useCallback } from 'react';

export const useERPMode = (initialState, onSaveApi, loadList) => {
  const [mode, setMode] = useState("add"); 
  const [formData, setFormData] = useState(initialState);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [canPrint, setCanPrint] = useState(false);

  // Transitions to View Mode
  const handleView = useCallback((row, mappedRow) => {
    setFormData(mappedRow || row);
    setMode("view");
    setShowForm(true);
    setCanPrint(true);
  }, []); 
  const handleAdd = useCallback(() => {
    setFormData(initialState);
    setMode("add");
    setShowForm(true);
    setCanPrint(false);
  }, [initialState]);
 
  const handleModify = useCallback(() => {
    setMode("edit");
    setCanPrint(false);
  }, []);
 
  const performSave = async (idField) => {
    if (saving) return;
    try {
      setSaving(true);
      const response = await onSaveApi(formData);
      
      if (response.success) {
        setFormData(response.data);
        setMode("view");
        setCanPrint(true);
        if (loadList) loadList();
        return { success: true, data: response.data };
      }
      return { success: false, message: response.message };
    } catch (err) {
      return { success: false, message: "System Error" };
    } finally {
      setSaving(false);
    }
  };

  return {
    mode, setMode,
    formData, setFormData,
    showForm, setShowForm,
    saving, setSaving,
    canPrint, setCanPrint,
    handleView, handleAdd, handleModify, performSave,
    isAddMode: mode === "add",
    isViewMode: mode === "view",
    isEditMode: mode === "edit"
  };
};