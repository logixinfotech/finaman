import React, { useState, useCallback, useEffect } from "react";
import ERPHeader from "../../../../components/Reusable/form/HeaderForm";
import ERPFooter from "../../../../components/Reusable/form/FooterForm";
import ERPAutocomplete from "../../../../components/Reusable/input/ERPAutocomplete";
import { getActledList, getLeaveTypes, fetchUserGroupsByType } from "../../../../utils/api";

const APPLICABLE_TO_OPTIONS = ["All", "Department", "Designation"];
const APPROVER_ROLE_OPTIONS  = ["Manager", "HR", "TeamLeader", "Director", "Admin"];
const LEVEL_OPTIONS          = ["1", "2", "3", "4", "5"];

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
  initialData = {},
}) => {
  const [localData,    setLocalData]    = useState(initialData);
  const [errors,       setErrors]       = useState({});
  const [employees,    setEmployees]    = useState([]);
  const [leaveTypes,   setLeaveTypes]   = useState([]);
  const [departments,  setDepartments]  = useState([]); // { group_id, group_name }
  const [designations, setDesignations] = useState([]); // { group_id, group_name }

  const isViewMode = mode === "view";
  const isEditMode = mode === "edit";
  const isAddMode  = mode === "add";
    const FONT = `'Inter', 'Tahoma', system-ui, sans-serif`;


  const requiredFields = ["applicable_to", "level_no", "approver_role"];

  // ── Load all dropdowns ────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const [empData, ltData, deptData, desgData] = await Promise.all([
          getActledList(),
          getLeaveTypes(),
          fetchUserGroupsByType("DEP"),
          fetchUserGroupsByType("DESG"),
        ]);
        setEmployees(empData || []);
        setLeaveTypes(ltData?.data || []);
        setDepartments(deptData?.data || []);
        setDesignations(desgData?.data || []);
      } catch (err) {
        console.error("Dropdown load error:", err);
      }
    };
    load();
  }, []);

  // ── Sync initialData ──────────────────────────────────────────────────
  useEffect(() => {
    if (!initialData || Object.keys(initialData).length === 0) return;

    // When viewing existing record — resolve applicable_id back to name
    let applicable_name = initialData.applicable_name || "";

    if (!applicable_name && initialData.applicable_id) {
      if (initialData.applicable_to === "Department") {
        const found = departments.find(d => d.group_id === Number(initialData.applicable_id));
        if (found) applicable_name = found.group_name;
      } else if (initialData.applicable_to === "Designation") {
        const found = designations.find(d => d.group_id === Number(initialData.applicable_id));
        if (found) applicable_name = found.group_name;
      }
    }

    const formatted = {
      ...initialData,
      level_no:        initialData.level_no  !== undefined ? String(initialData.level_no) : "",
      is_active:       initialData.is_active !== undefined ? initialData.is_active : true,
      applicable_name,
    };

    if (JSON.stringify(localData) !== JSON.stringify(formatted)) {
      setLocalData(formatted);
      setFormData(formatted);
    }
  }, [initialData, departments, designations]);

  // ── Handle change ─────────────────────────────────────────────────────
  const handleChange = (field, value) => {
    let updated = { ...localData };

    if (field === "approver_name") {
      const emp = employees.find(e => e.Led_name?.trim() === value?.trim());
      updated.approver_name = value;
      updated.approver_id   = emp ? Number(emp.Actled_id) : null;

    } else if (field === "leave_name") {
      const lt = leaveTypes.find(l => l.leave_name?.trim() === value?.trim());
      updated.leave_name    = value;
      updated.leave_type_id = lt ? lt.leave_type_id : null;

    } else if (field === "applicable_to") {
      // Reset applicable when type changes
      updated.applicable_to   = value;
      updated.applicable_id   = null;
      updated.applicable_name = "";

    } else if (field === "applicable_name") {
      // Department or Designation selected from dropdown — save name + ID
      updated.applicable_name = value;

      if (localData.applicable_to === "Department") {
        const found = departments.find(d => d.group_name?.trim() === value?.trim());
        updated.applicable_id = found ? found.group_id : null;
      } else if (localData.applicable_to === "Designation") {
        const found = designations.find(d => d.group_name?.trim() === value?.trim());
        updated.applicable_id = found ? found.group_id : null;
      }

    } else {
      updated[field] = value;
    }

    setLocalData(updated);
    setFormData(updated);
    setErrors(prev => { const c = { ...prev }; delete c[field]; return c; });
  };

  // ── Validate + Save ───────────────────────────────────────────────────
  const handleValidateAndSave = useCallback(() => {
    if (isViewMode) return;
    const newErrors = {};
    requiredFields.forEach(f => {
      if (!localData[f] || String(localData[f]).trim() === "") newErrors[f] = "Required";
    });
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    if (onSave) onSave(localData);
  }, [localData, onSave, isViewMode]);

  // ── Style helpers ─────────────────────────────────────────────────────
  const inp = (disabled, fieldName) =>
    `w-full h-[32px] px-2 text-[15px] border rounded-md outline-none transition-colors
     ${errors[fieldName] ? "border-red-500" : "border-gray-300"}
     ${disabled
       ? "bg-[#eef1f6] text-gray-500 cursor-not-allowed"
       : "bg-white text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-100"}`;

  // Field wrapper: label left, input right
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

  // ── Options ───────────────────────────────────────────────────────────
  const employeeNames   = employees.map(e => e.Led_name?.trim()).filter(Boolean);
  const leaveTypeNames  = leaveTypes.map(lt => lt.leave_name);
  const departmentNames = departments.map(d => d.group_name);
  const designationNames= designations.map(d => d.group_name);

  // Dynamic label + options for applicable field
  const applicableLabel   = localData.applicable_to === "Department"
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
    <div className="w-full max-w-[700px] mx-auto h-[calc(100vh-140px)] bg-[#eef1f6] flex flex-col overflow-hidden font-sans" style={{ fontFamily: FONT }}>
      <ERPHeader
        title="APPROVAL WORKFLOW"
        isAddMode={isAddMode}
        isEditMode={isEditMode}
        isViewMode={isViewMode}
        activeTab={activeTab}
        onTabChange={onTabChange}
        rightContent={`${currentRecord || 1} / ${totalRecords || 1}`}
      />

      <div className="flex-1 p-4 overflow-y-auto">
        <div className="w-full bg-white border border-slate-200 shadow-sm rounded-md overflow-hidden">

          {/* ── Row 1: Applicable To | Leave Type ── */}
          <div className="flex items-center gap-4 px-5 py-3">

            <Field label="Applicable To" required>
              <ERPAutocomplete
                options={APPLICABLE_TO_OPTIONS}
                value={localData.applicable_to || ""}
                onChange={val => handleChange("applicable_to", val)}
                className={inp(isViewMode, "applicable_to")}
                disabled={isViewMode}
              />
              {errors.applicable_to && (
                <span className="text-[11px] text-red-500">{errors.applicable_to}</span>
              )}
            </Field>

          
            <Field label="Leave Type">
              <ERPAutocomplete
                options={["All Leave Types", ...leaveTypeNames]}
                value={localData.leave_name || "All Leave Types"}
                onChange={val => {
                  if (val === "All Leave Types") {
                    setLocalData(p => ({ ...p, leave_name: "", leave_type_id: null }));
                    setFormData(p  => ({ ...p, leave_name: "", leave_type_id: null }));
                  } else {
                    handleChange("leave_name", val);
                  }
                }}
                className={inp(isViewMode, "leave_type_id")}
                disabled={isViewMode}
              />
            </Field>

          </div>

          {/* ── Row 2: Dept/Desig dropdown (conditional) | Approval Level ── */}
          <div className="flex items-center gap-4 px-5 py-2">
            <Field label={applicableLabel}>
              {showApplicable ? (
                <>
                  <ERPAutocomplete
                    options={applicableOptions}
                    value={localData.applicable_name || ""}
                    onChange={val => handleChange("applicable_name", val)}
                    className={inp(isViewMode, "applicable_name")}
                    disabled={isViewMode}
                  />
                  {localData.applicable_id && (
                    <p className="text-[11px] text-blue-600 mt-0.5 font-medium">
                      ID: {localData.applicable_id}
                    </p>
                  )}
                </>
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
                options={LEVEL_OPTIONS}
                value={localData.level_no ? String(localData.level_no) : ""}
                onChange={val => handleChange("level_no", val)}
                className={inp(isViewMode, "level_no")}
                disabled={isViewMode}
              />
              {errors.level_no && (
                <span className="text-[11px] text-red-500">{errors.level_no}</span>
              )}
              
            </Field>

          </div>

          {/* ── Row 3: Approver Role | Specific Approver ── */}
          <div className="flex items-center gap-4 px-5 py-2">

            <Field label="Approver Role" required>
              <ERPAutocomplete
                options={APPROVER_ROLE_OPTIONS}
                value={localData.approver_role || ""}
                onChange={val => handleChange("approver_role", val)}
                className={inp(isViewMode, "approver_role")}
                disabled={isViewMode}
              />
              {errors.approver_role && (
                <span className="text-[11px] text-red-500">{errors.approver_role}</span>
              )}
            </Field>

            <Field label="Specific Approver">
              <ERPAutocomplete
                options={["-- None --", ...employeeNames]}
                value={localData.approver_name || "-- None --"}
                onChange={val => {
                  if (val === "-- None --") {
                    setLocalData(p => ({ ...p, approver_name: "", approver_id: null }));
                    setFormData(p  => ({ ...p, approver_name: "", approver_id: null }));
                  } else {
                    handleChange("approver_name", val);
                  }
                }}
                className={inp(isViewMode, "approver_id")}
                disabled={isViewMode}
              />
              {localData.approver_id && (
                <p className="text-[11px] text-blue-600 mt-0.5 font-medium">
                  Approver ID: {localData.approver_id}
                </p>
              )}
            </Field>

          </div>

          {/* ── Row 4: Active ── */}
          <div className="flex items-center gap-4 px-5 py-3">
            <Field label="Status">
              <div className="flex items-center gap-2 h-[32px]">
                <input
                  type="checkbox"
                  checked={!!localData.is_active}
                  disabled={isViewMode}
                  onChange={e => handleChange("is_active", e.target.checked)}
                  className="w-4 h-4 accent-blue-600 cursor-pointer"
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