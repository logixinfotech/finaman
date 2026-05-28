// lib/permissions.js
export const getRights = (appl_name) => {
  const user = JSON.parse(sessionStorage.getItem("user") || "{}");
  const allPerms = JSON.parse(sessionStorage.getItem("permissions") || "{}");
  
  if (user?.role?.toLowerCase() === "admin") {
    return { add: 1, mod: 1, del: 1, print: 1, modDays: 999 };
  }

  const raw = allPerms[appl_name] || {};
  return {
    add: Number(raw.add || 0),
    mod: Number(raw.mod || 0),
    del: Number(raw.del || 0),
    print: Number(raw.print || 0),
    modDays: Number(raw.modDays || 0)
  };
};// export const hasPermission = (appl, action) => {
//   const user = JSON.parse(sessionStorage.getItem("user"));
//   const permissions = JSON.parse(sessionStorage.getItem("permissions"));

//   // ✅ Admin bypass
//   if (user?.role === "admin") return true;

//   // ✅ Normal user
//   return permissions?.[appl]?.[action] === 1;
// };



// // src/utils/permissions.jsT==========================================================================
// export const getRights = (appl_name) => {
//   const perms = JSON.parse(sessionStorage.getItem("permissions") || "{}");
//   return perms[appl_name] || null;
// };

// export const canUserDo = (appl_name, action, recordDate = null) => {
//   const rights = getRights(appl_name);
  
//   if (!rights) {
//     console.error(`Permission Denied: No entry found for module [${appl_name}]`);
//     return false;
//   }

//   const actionMap = {
//     add: rights.add,
//     modify: rights.mod,
//     delete: rights.del,
//     print: rights.print,
//     pdf: rights.export?.pdf,
//     excel: rights.export?.excel
//   };

//   if (Number(actionMap[action]) !== 1) {
//     console.warn(`Permission Denied: User does not have [${action}] rights for [${appl_name}]`);
//     return false;
//   }

//   // BACK-DATED CHECK
//   if (recordDate && (action === 'modify' || action === 'delete')) {
//     const daysLimit = action === 'modify' ? rights.modDays : rights.delDays;
    
//     if (daysLimit > 0) {
//       const created = new Date(recordDate);
//       const today = new Date();
//       const diffTime = Math.abs(today - created);
//       const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
//       const isAllowed = diffDays <= daysLimit;
//       if (!isAllowed) {
//         console.warn(`Action Blocked: Record age (${diffDays} days) exceeds allowed limit (${daysLimit} days) for ${action}`);
//       }
//       return isAllowed;
//     }
//   }

//   console.log(`Permission Granted: [${action}] on [${appl_name}]`);
//   return true;
// };

// lib/permissions.js
// export const getRights = (appl_name) => {
//   const user     = JSON.parse(sessionStorage.getItem("user")        || "{}");
//   const allPerms = JSON.parse(sessionStorage.getItem("permissions") || "{}");
 
//   if (user?.role?.toLowerCase() === "admin") {
//     return { add: 1, mod: 1, del: 1, print: 1, addDays: 999, modDays: 999, delDays: 999 };
//   }
 
//   const raw = allPerms[appl_name] || {};
//   return {
//     add:     Number(raw.add     || 0),
//     mod:     Number(raw.mod     || 0),
//     del:     Number(raw.del     || 0),
//     print:   Number(raw.print   || 0),
//     addDays: Number(raw.addDays || 0),   // 0 = no limit
//     modDays: Number(raw.modDays || 0),
//     delDays: Number(raw.delDays || 0),
//   };
// };



// export const useERPMode = (initialState, onSaveApi, loadList, appl_name) => {
//   const [mode,         setMode]         = useState("view");
//   const [formData,     setFormData]     = useState(initialState);
//   const [originalData, setOriginalData] = useState(null);
//   const [showForm,     setShowForm]     = useState(true);
//   const [saving,       setSaving]       = useState(false);
//   const [canPrint,     setCanPrint]     = useState(false);
//   const [activeTab,    setActiveTab]    = useState("entry");
 
//   const rights = useMemo(() => getRights(appl_name), [appl_name]);
 
//   const canAdd    = rights.add === 1;
//   const canModify = rights.mod === 1;
//   const canDelete = rights.del === 1;
 
//   const isDirty = useMemo(() => {
//     if (mode === "view") return false;
//     return JSON.stringify(formData) !== JSON.stringify(originalData);
//   }, [formData, originalData, mode]);
 
//   // ── unchanged ──
//   const isWithinLimit = useCallback((recordDate, limit) => {
//     if (!recordDate || limit === 0) return true;   // 0 = unlimited
//     const created  = new Date(recordDate);
//     const today    = new Date();
//     const diffDays = Math.ceil(Math.abs(today - created) / (1000 * 60 * 60 * 24));
//     return diffDays <= limit;
//   }, []);
 
//   // ── handleAdd: now also guards addDays ──────────────────────────────────
//   // addDays on an ADD right means: "user can only add records backdated up to N days"
//   // Most forms don't need this check at open-time, but expose it so the form's
//   // date picker can clamp min date. We export addDays so the form can use it directly.
//   const handleAdd = useCallback(() => {
//     if (!canAdd) {
//       alertError("Access Denied", `You do not have permission to ADD in ${appl_name}`);
//       return;
//     }
//     setFormData(initialState);
//     setOriginalData(initialState);
//     setMode("add");
//     setShowForm(true);
//     setCanPrint(false);
//   }, [initialState, canAdd, appl_name]);
 
//   // ── handleModify: unchanged (already had modDays) ───────────────────────
//   const handleModify = useCallback(() => {
//     if (!canModify) {
//       alertError("Access Denied", "You do not have MODIFY rights.");
//       return;
//     }
//     const recordDate = formData.Created_date || formData.entry_date || formData.created_at;
//     if (!isWithinLimit(recordDate, rights.modDays)) {
//       alertWarning("Entry Locked", `This record is over ${rights.modDays} day(s) old and cannot be modified.`);
//       return;
//     }
//     setOriginalData({ ...formData });
//     setMode("edit");
//     setCanPrint(false);
//   }, [formData, canModify, rights.modDays, isWithinLimit]);
 
//   // ── handleDelete: NEW — mirrors handleModify pattern with delDays ────────
//   // Call this in your page's delete handler BEFORE calling the API.
//   // Returns true if allowed, false if blocked (so you can skip the API call).
//   const handleDelete = useCallback((rowData) => {
//     if (!canDelete) {
//       alertError("Access Denied", "You do not have DELETE rights.");
//       return false;
//     }
//     const recordDate = rowData?.Created_date || rowData?.entry_date || rowData?.created_at;
//     if (!isWithinLimit(recordDate, rights.delDays)) {
//       alertWarning("Delete Locked", `This record is over ${rights.delDays} day(s) old and cannot be deleted.`);
//       return false;
//     }
//     return true;
//   }, [canDelete, rights.delDays, isWithinLimit]);
 
//   // ── handleEditCancel: unchanged ─────────────────────────────────────────
//   const handleEditCancel = useCallback(async () => {
//     if (isDirty) {
//       const confirmed = await confirmWarning({
//         title:             "Discard Changes?",
//         text:              "You have unsaved changes. Do you want to reset the form?",
//         confirmButtonText: "Yes, Reset",
//         cancelButtonText:  "No, Stay",
//       });
//       if (confirmed) {
//         setFormData(originalData || initialState);
//         showToast({ icon: "info", title: "Form Reset" });
//       }
//       return;
//     }
//     if (!showForm) {
//       setShowForm(true);
//     } else {
//       if      (mode === "add")  setShowForm(false);
//       else if (mode === "edit") setMode("view");
//       else if (mode === "view") setShowForm(false);
//     }
//   }, [isDirty, mode, originalData, initialState, showForm]);
 
//   // ── ESC handler: unchanged ───────────────────────────────────────────────
//   useEffect(() => {
//     const handleEsc = (event) => {
//       if (event.key === "Escape") {
//         if (mode === "add" || mode === "edit") return;
//         const tag = document.activeElement.tagName.toLowerCase();
//         if (tag === "input" || tag === "textarea") {
//           document.activeElement.blur();
//           return;
//         }
//         handleEditCancel();
//       }
//     };
//     window.addEventListener("keydown", handleEsc);
//     return () => window.removeEventListener("keydown", handleEsc);
//   }, [handleEditCancel, mode]);
 
//   // ── performSave: unchanged ───────────────────────────────────────────────
//   const performSave = useCallback(async (idField, overrideData = null) => {
//     if (saving) return { success: false };
//     setSaving(true);
//     try {
//       const isEdit     = mode === "edit";
//       const dataToSave = overrideData || formData;
 
//       if (!dataToSave || Object.keys(dataToSave).length === 0)
//         throw new Error("No data to save");
 
//       const response = await onSaveApi(dataToSave, isEdit);
//       if (response.success) {
//         const savedData = response.data || dataToSave;
//         setFormData(savedData);
//         setOriginalData(savedData);
//         setMode("view");
//         setCanPrint(true);
//         if (loadList) await loadList();
//         showToast({ icon: "success", title: "Saved Successfully" });
//         return { success: true, data: savedData };
//       }
//       alertError("Save Failed", response.message || "Database error");
//       return { success: false };
//     } catch (err) {
//       alertError("System Error", err.message);
//       return { success: false };
//     } finally {
//       setSaving(false);
//     }
//   }, [saving, mode, formData, onSaveApi, loadList]);
 
//   // ── handleView: unchanged ────────────────────────────────────────────────
//   const handleView = useCallback((data) => {
//     setFormData(data);
//     setOriginalData(data);
//     setMode("view");
//     setShowForm(true);
//     setCanPrint(rights.print === 1);
//   }, [rights.print]);
 
//   return {
//     mode, setMode,
//     formData, setFormData,
//     showForm, setShowForm,
//     saving, canPrint,
//     rights, isDirty,
//     activeTab, setActiveTab,
//     handleView,
//     handleAdd,
//     handleModify,
//     handleDelete,      // ← new export
//     handleEditCancel,
//     performSave,
//     isAddMode:  mode === "add",
//     isViewMode: mode === "view",
//     isEditMode: mode === "edit",
//   };
// };