 
import React, { useState, useCallback, useEffect, useRef } from "react";
import ERPHeader from "../../../../components/Reusable/form/HeaderForm";
import ERPFooter from "../../../../components/Reusable/form/FooterForm";
import ERPAutocomplete from "../../../../components/Reusable/input/ERPAutocomplete";
import { getLeaveTypes, fetchUserGroupsByType, fetchUsers } from "../../../../utils/api";
import { focusFirstInput, handleERPEnterNavigation, handleERPBackspaceNavigation,focusFirstError } from "../../../../utils/erpShortcuts";

const APPLICABLE_TO_OPTIONS = ["All", "Department", "Designation"];
const APPROVER_ROLE_OPTIONS = ["Manager", "HR", "TeamLeader", "Director", "Admin"];
const LEVEL_OPTIONS = ["1", "2", "3", "4", "5"];

const Field = ({ label, required, hint, children }) => (
  <div className="flex items-center gap-2 flex-1 min-w-0">
    <label className="w-[120px] shrink-0 text-[15px] text-black-800 leading-tight">
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
      {hint && <span className="text-[11px] text-black-800 ml-1 font-normal">{hint}</span>}
    </label>
    <div className="flex-1 min-w-0">{children}</div>
  </div>
);
const fieldIndexMap = {
  applicable_to:   0,
  level_no:   3,
  approver_role:  4,
  
};

const ApprovalWorkflowForm = ({
  mode = "view",
  onSave,
  onCancel,
  onDelete,
  onEditCancel,
  saving,
  onModify,
  onNewEntry,
  currentRecord,
  totalRecords,
  setFormData,
  rights,
  activeTab = "entry",
  onTabChange,
  initialData = {},onPrevRecord,onNextRecord
}) => {
  const [localData, setLocalData] = useState({});
  const [errors, setErrors] = useState({});
  const [employees, setEmployees] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [departments, setDepartments] = useState([]); 
  const [designations, setDesignations] = useState([]); 
  const saveBtnRef=useRef(null)

  const isViewMode = mode === "view";
  const isEditMode = mode === "edit";
  const isAddMode = mode === "add";
  const FONT = `'Inter', 'Tahoma', system-ui, sans-serif`;
  
  const formRef = useRef(null);
  const isInitialized = useRef(false);
  const prevMode = useRef(mode);
  const prevId = useRef(initialData?.workflow_id);

  const requiredFields = ["applicable_to", "level_no", "approver_role"];

  useEffect(() => {
    const timer = setTimeout(() => {
      if (formRef.current && (isAddMode || isEditMode)) {
        focusFirstInput(formRef);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [mode]); 

useEffect(() => {
    const load = async () => {
      try {
        const [empData, ltData, deptData, desgData] = await Promise.all([
          fetchUsers(),
          getLeaveTypes(),
          fetchUserGroupsByType("DEP"),
          fetchUserGroupsByType("DESG"),
        ]);
        setEmployees(Array.isArray(empData) ? empData : empData?.data || []);
        setLeaveTypes(ltData?.data || []);
        setDepartments(deptData?.data || []);
        setDesignations(desgData?.data || []);
      } catch (err) {
        console.error("Dropdown load error:", err);
      }
    };
    load();
  }, []);
  useEffect(() => {
    const modeChanged = prevMode.current !== mode;
    const idChanged = prevId.current !== initialData?.workflow_id;

    if (!isInitialized.current || modeChanged || idChanged) {
      if (isAddMode) {
        // FIX 1: Add mode mein default leave_name set kiya
        const blankForm = {
          applicable_to: "", applicable_name: "", applicable_id: null,
          leave_name: "All Leave Types", leave_type_id: null, level_no: "",
          approver_role: "", approver_name: "", approver_id: null, is_active: true
        };
        setLocalData(blankForm);
        setFormData(blankForm);
      } else if (initialData && Object.keys(initialData).length > 0) {
        let applicable_name = initialData.applicable_name || "";
        if (!applicable_name && initialData.applicable_id) {
          if (initialData.applicable_to === "Department") {
            const found = departments.find(d => Number(d.group_id) === Number(initialData.applicable_id));
            if (found) applicable_name = found.group_name;
          } else if (initialData.applicable_to === "Designation") {
            const found = designations.find(d => Number(d.group_id) === Number(initialData.applicable_id));
            if (found) applicable_name = found.group_name;
          }
        }
// initialData load wale useEffect me:
let approver_name = initialData.approver_name || "";
if (!approver_name && initialData.approver_id) {
  const found = employees.find(e => String(e.user_id) === String(initialData.approver_id));
  if (found) approver_name = found.user_name?.trim() || "";
}

        let leave_name = initialData.leave_name || "";
        if (!leave_name && initialData.leave_type_id) {
          const found = leaveTypes.find(l => l.leave_type_id === initialData.leave_type_id);
          if (found) leave_name = found.leave_name || "";
        }

        // FIX 2: Agar initialData mein leave nahi hai, toh 'All Leave Types' dikhaye
        if (!initialData.leave_type_id && (!leave_name || leave_name.trim() === "")) {
          leave_name = "All Leave Types";
        }

        const formatted = {
          ...initialData,
          level_no: initialData.level_no !== undefined ? String(initialData.level_no) : "",
          is_active: initialData.is_active !== undefined ? initialData.is_active : true,
          applicable_name, approver_name, leave_name, 
        };

        setLocalData(formatted);
        setFormData(formatted);
      }

      isInitialized.current = true;
      prevMode.current = mode;
      prevId.current = initialData?.workflow_id;
    }
  }, [initialData, mode, departments, designations, employees, leaveTypes, isAddMode, setFormData]);

const handleKeyDown = useCallback((e) => {
    handleERPEnterNavigation(e, formRef, isViewMode,saveBtnRef);
    handleERPBackspaceNavigation(e, formRef, isViewMode);
  }, [isViewMode]);

  const handleChange = (field, rawValue) => {
    let value = rawValue && rawValue.target !== undefined ? rawValue.target.value : rawValue;
    value = value || ""; 

    setLocalData(prev => {
      let updated = { ...prev };
if (field === "approver_name") {
  updated.approver_name = value;
  if (!value.trim()) {
    updated.approver_id = null;
  } else {
    const emp = employees.find(e => e.user_name?.trim() === value?.trim());
    updated.approver_id = emp ? emp.user_id : null;   // Number() hata do
  }
} else if (field === "leave_name") {
        // FIX 3: "All Leave Types" ko explicitly allow kiya taaki select ho sake
        updated.leave_name = value;
        if (!value.trim() || value === "All Leave Types") {
          updated.leave_type_id = null;
        } else {
          const lt = leaveTypes.find(l => l.leave_name?.trim() === value?.trim());
          updated.leave_type_id = lt ? lt.leave_type_id : null;
        }
      } else if (field === "applicable_to") {
        updated.applicable_to = value;
        updated.applicable_id = null;
        updated.applicable_name = "";
      } else if (field === "applicable_name") {
        updated.applicable_name = value;
        if (!value.trim()) {
          updated.applicable_id = null;
        } else {
          if (updated.applicable_to === "Department") {
            const found = departments.find(d => d.group_name?.trim() === value?.trim());
            updated.applicable_id = found ? found.group_id : null;
          } else if (updated.applicable_to === "Designation") {
            const found = designations.find(d => d.group_name?.trim() === value?.trim());
            updated.applicable_id = found ? found.group_id : null;
          }
        }
      } else {
        updated[field] = value;
      }

      setFormData(updated); 
      return updated;
    });

    setErrors(prev => { const c = { ...prev }; delete c[field]; return c; });
  };

  const handleValidateAndSave = useCallback(() => {
    if (isViewMode) return;
    const newErrors = {};
    requiredFields.forEach(f => {
      if (!localData[f] || String(localData[f]).trim() === "") newErrors[f] = "Required";
    });
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors);return;   }
    if (onSave) onSave(localData);
  }, [localData, onSave, isViewMode, requiredFields]);

  const inp = (disabled, fieldName) =>
    `w-full h-[32px] px-2 text-[15px] border rounded-md outline-none transition-colors
     ${errors[fieldName] ? "border-red-500" : "border-gray-300"}
     ${disabled
      ? "bg-[#eef1f6] text-gray-500 cursor-not-allowed"
      : "bg-white text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-100"}`;

const employeeNames = employees.map(e => e.user_name?.trim()).filter(Boolean);
  const leaveTypeNames = leaveTypes.map(lt => lt.leave_name);
  const departmentNames = departments.map(d => d.group_name);
  const designationNames = designations.map(d => d.group_name);

  const applicableLabel = localData.applicable_to === "Department"
    ? "Department"
    : localData.applicable_to === "Designation"
      ? "Designation"
      : "Applicable";

  const applicableOptions = localData.applicable_to === "Department"
    ? departmentNames
    : localData.applicable_to === "Designation"
      ? designationNames
      : [];

  const showApplicable = localData.applicable_to && localData.applicable_to !== "All";

  return (
    <div className="w-full h-full sm:h-[calc(100vh-100px)] bg-[#eef1f6] flex flex-col overflow-hidden font-sans" style={{ fontFamily: FONT }}>
      <ERPHeader
        title="APPROVAL WORKFLOW"
        isAddMode={isAddMode}
        isEditMode={isEditMode}
        isViewMode={isViewMode}
        activeTab={activeTab}
        onTabChange={onTabChange}
        rightContent={`${currentRecord || 1} / ${totalRecords || 1}`}
          currentIndex={currentRecord}      // 👈
        totalRecords={totalRecords}        // 👈
        onPrevRecord={onPrevRecord}        // 👈
        onNextRecord={onNextRecord}  
      />

      <div className="flex-1 p-4 overflow-y-auto">
        <div ref={formRef} className="w-full mx-auto max-w-[750px] bg-white border border-slate-200 shadow-sm rounded-md overflow-visible relative">

          <div className="flex items-center gap-4 px-5 py-3">
            <Field label="Applicable To" required>
              <ERPAutocomplete
                data-auto
                options={APPLICABLE_TO_OPTIONS}
                value={localData.applicable_to || ""}
                onChange={val => handleChange("applicable_to", val)}
                className={inp(isViewMode, "applicable_to")}
                disabled={isViewMode}
                onKeyDown={handleKeyDown}
              />
          
            </Field>

            <Field label="Leave Type">
              <ERPAutocomplete
                data-auto
                options={["All Leave Types", ...leaveTypeNames]}
                value={localData.leave_name || ""}
                onChange={val => handleChange("leave_name", val)} /* FIX 4: Seedha handleChange use kiya */
                className={inp(isViewMode, "leave_type_id")}
                disabled={isViewMode}
                onKeyDown={handleKeyDown}
              />
            </Field>
          </div>

          <div className="flex items-center gap-4 px-5 py-2">
            <Field label={applicableLabel}>
              {showApplicable ? (
                <ERPAutocomplete
                  data-auto
                  options={applicableOptions}
                  value={localData.applicable_name || ""}
                  onChange={val => handleChange("applicable_name", val)}
                  className={inp(isViewMode, "applicable_name")}
                  disabled={isViewMode}
                  onKeyDown={handleKeyDown}
                />
              ) : (
                <input
                  disabled
                  placeholder="Select Dept or Desig in Applicable To"
                  className={inp(true, "")}
                />
              )}
            </Field>

            <Field label="Approval Level" required>
              <ERPAutocomplete
                data-auto
                options={LEVEL_OPTIONS}
                value={localData.level_no ? String(localData.level_no) : ""}
                onChange={val => handleChange("level_no", val)}
                className={inp(isViewMode, "level_no")}
                disabled={isViewMode}
                onKeyDown={handleKeyDown}
              />
            </Field>
          </div>

          <div className="flex items-center gap-4 px-5 py-2">
            <Field label="Approver Role" required>
              <ERPAutocomplete
                data-auto
                options={APPROVER_ROLE_OPTIONS}
                value={localData.approver_role || ""}
                onChange={val => handleChange("approver_role", val)}
                className={inp(isViewMode, "approver_role")}
                disabled={isViewMode}
                onKeyDown={handleKeyDown}
              />
            </Field>

            <Field label="Specific Approver">
              <ERPAutocomplete
                options={employeeNames}
                value={localData.approver_name || ""}
                onChange={val => handleChange("approver_name", val)}
                className={inp(isViewMode, "approver_id")}
                disabled={isViewMode}
                onKeyDown={handleKeyDown}
              />
            </Field>
          </div>

          <div className="flex items-center gap-4 px-5 py-3">
            <Field label="Status">
              <div className="flex items-center gap-2 h-[32px]">
                <input
                  type="checkbox"
                  checked={!!localData.is_active}
                  disabled={isViewMode}
                  onChange={e => handleChange("is_active", e.target.checked)}
                  className="w-4 h-4 accent-blue-600 cursor-pointer"
                  onKeyDown={handleKeyDown}
                />
                <span className="text-[14px] text-gray-600">
                  {localData.is_active
                    ? "Active — this rule will be applied"
                    : "Inactive — this rule will be skipped"}
                </span>
              </div>
            </Field>
          </div>

        </div>
      </div>

      <ERPFooter
        isAddMode={isAddMode}
        isEditMode={isEditMode}
        isViewMode={isViewMode}
        saveBtnRef={saveBtnRef}
        saving={saving}
        handleSubmit={handleValidateAndSave}
        onModify={onModify}
        onDelete={() => onDelete && onDelete(localData)}
        onCancel={onCancel}
        onEditCancel={onEditCancel}
        onNewEntry={onNewEntry}
        rights={rights}
      />
    </div>
  );
};

export default ApprovalWorkflowForm;