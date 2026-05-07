// ─────────────────────────────────────────────────────────────────────────────
// FILE 1: ApprovalTransactionForm.jsx
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useCallback, useEffect } from "react";
import ERPHeader       from "../../../../components/Reusable/form/HeaderForm";
import ERPFooter       from "../../../../components/Reusable/form/FooterForm";
import ERPAutocomplete from "../../../../components/Reusable/input/ERPAutocomplete";
import ERPDateInput    from "../../../../components/Reusable/input/Date";
import { getActledList, getLeaveRequests, getApprovalWorkflow } from "../../../../utils/api";

const ACTION_OPTIONS = ["Pending", "Approved", "Rejected"];

export const ApprovalTransactionForm = ({
  mode = "view",
  onSave, onCancel, onDelete, onEditCancel,
  saving, onModify, onNewEntry,
  currentRecord, totalRecords,
  setFormData, rights,
  activeTab = "entry", onTabChange,
  initialData = {},
}) => {
  const [localData,  setLocalData]  = useState(initialData);
  const [errors,     setErrors]     = useState({});
  const [employees,  setEmployees]  = useState([]);
  const [requests,   setRequests]   = useState([]);
  const [workflows,  setWorkflows]  = useState([]);

  const isViewMode = mode === "view";
  const isEditMode = mode === "edit";
  const isAddMode  = mode === "add";
      const FONT = `'Inter', 'Tahoma', system-ui, sans-serif`;


  const requiredFields = ["request_id", "workflow_id", "approver_id", "action"];

  useEffect(() => {
    const load = async () => {
      try {
        const [empData, reqData, wfData] = await Promise.all([
          getActledList(),
          getLeaveRequests(),
          getApprovalWorkflow(),
        ]);
        setEmployees(empData || []);
        setRequests(reqData?.data  || []);
        setWorkflows(wfData?.data  || []);
      } catch (err) { console.error(err); }
    };
    load();
  }, []);

  useEffect(() => {
    if (!initialData || Object.keys(initialData).length === 0) return;
    const formatted = { ...initialData };
    if (JSON.stringify(localData) !== JSON.stringify(formatted)) {
      setLocalData(formatted);
      setFormData(formatted);
    }
  }, [initialData]);

  const handleChange = (field, value) => {
    let updated = { ...localData };

    if (field === "approver_name") {
      const emp = employees.find(e => e.Led_name?.trim() === value?.trim());
      updated.approver_name = value;
      updated.approver_id   = emp ? Number(emp.Actled_id) : null;
    } else if (field === "request_label") {
      const req = requests.find(r =>
        `${r.employee_name} — ${r.leave_name} (${r.from_date?.split("T")[0]} to ${r.to_date?.split("T")[0]})` === value
      );
      updated.request_label = value;
      updated.request_id    = req ? req.request_id : null;
    } else if (field === "workflow_label") {
      const wf = workflows.find(w =>
        `Level ${w.level_no} — ${w.approver_role}` === value
      );
      updated.workflow_label = value;
      updated.workflow_id    = wf ? wf.workflow_id : null;
      updated.level_no       = wf ? wf.level_no    : null;
    } else {
      updated[field] = value;
    }

    setLocalData(updated);
    setFormData(updated);
    setErrors(prev => { const c = { ...prev }; delete c[field]; return c; });
  };

  const handleValidateAndSave = useCallback(() => {
    if (isViewMode) return;
    const newErrors = {};
    requiredFields.forEach(f => {
      if (!localData[f] || String(localData[f]).trim() === "") newErrors[f] = "Required";
    });
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    if (onSave) onSave(localData);
  }, [localData, onSave, isViewMode]);

  const inp = (disabled, fieldName) =>
    `w-full h-[32px] px-2 text-[15px] border rounded-md outline-none transition-colors
     ${errors[fieldName] ? "border-red-500" : "border-gray-300"}
     ${disabled ? "bg-[#eef1f6] text-gray-500 cursor-not-allowed"
                : "bg-white text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-100"}`;

  const Field = ({ label, required, children }) => (
    <div className="flex items-center gap-2 flex-1 min-w-0">
      <label className="w-[110px] shrink-0 text-[15px] text-black-800">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );

  const requestOptions = requests.map(r =>
    `${r.employee_name} — ${r.leave_name} (${r.from_date?.split("T")[0]} to ${r.to_date?.split("T")[0]})`
  );
  const workflowOptions = workflows.map(w => `Level ${w.level_no} — ${w.approver_role}`);
  const employeeNames   = employees.map(e => e.Led_name?.trim()).filter(Boolean);

  return (
    <div className="w-full max-w-[700px] mx-auto h-[calc(100vh-140px)] bg-[#eef1f6] flex flex-col overflow-hidden font-sans" style={{ fontFamily: FONT }}>
      <ERPHeader title="APPROVAL TRANSACTION" isAddMode={isAddMode} isEditMode={isEditMode}
        isViewMode={isViewMode} activeTab={activeTab} onTabChange={onTabChange}
        rightContent={`${currentRecord || 1} / ${totalRecords || 1}`} />

      <div className="flex-1 p-4 overflow-y-auto">
        <div className="w-full bg-white border border-slate-200 shadow-sm rounded-md overflow-hidden">

          {/* Row 1: Leave Request | Workflow */}
          <div className="flex items-center gap-4 px-5 py-2">
            <Field label="Leave Request" required>
              <ERPAutocomplete options={requestOptions}
                value={localData.request_label || ""}
                onChange={val => handleChange("request_label", val)}
                className={inp(isViewMode, "request_id")} disabled={isViewMode} />
              {errors.request_id && <span className="text-[11px] text-red-500">{errors.request_id}</span>}
            </Field>
             <Field label="Workflow Rule" required>
              <ERPAutocomplete options={workflowOptions}
                value={localData.workflow_label || ""}
                onChange={val => handleChange("workflow_label", val)}
                className={inp(isViewMode, "workflow_id")} disabled={isViewMode} />
              {errors.workflow_id && <span className="text-[11px] text-red-500">{errors.workflow_id}</span>}
            </Field>
          </div>

          {/* Row 2: Approver | Action */}
          <div className="flex items-center gap-4 px-5 py-2">
            <Field label="Approver" required>
              <ERPAutocomplete options={employeeNames}
                value={localData.approver_name || ""}
                onChange={val => handleChange("approver_name", val)}
                className={inp(isViewMode, "approver_id")} disabled={isViewMode} />
              {errors.approver_id && <span className="text-[11px] text-red-500">{errors.approver_id}</span>}
              {localData.approver_id && (
                <p className="text-[11px] text-blue-600 mt-0.5">ID: {localData.approver_id}</p>
              )}
            </Field>
             <Field label="Action" required>
              <ERPAutocomplete options={ACTION_OPTIONS}
                value={localData.action || "Pending"}
                onChange={val => handleChange("action", val)}
                className={inp(isViewMode, "action")} disabled={isViewMode} />
              {errors.action && <span className="text-[11px] text-red-500">{errors.action}</span>}
            </Field>
          </div>

          {/* Row 3: Action Date | Level No */}
          <div className="flex items-center gap-4 px-5 py-2">
            <Field label="Action Date">
              <ERPDateInput value={localData.action_date || ""}
                onChange={val => handleChange("action_date", val)}
                className={inp(isViewMode, "action_date")} disabled={isViewMode} />
            </Field>
             <Field label="Level No">
              <input type="number" value={localData.level_no || ""}
                disabled className={inp(true, "level_no")}
                placeholder="Auto from workflow" />
            </Field>
          </div>

          {/* Row 4: Remarks (full width) */}
          <div className="px-5 py-2">
            <Field label="Remarks">
              <input type="text" value={localData.remarks || ""}
                disabled={isViewMode}
                onChange={e => handleChange("remarks", e.target.value)}
                className={inp(isViewMode, "remarks")}
                placeholder="Optional remarks..." />
            </Field>
          </div>

        </div>
      </div>

      <ERPFooter isAddMode={isAddMode} isEditMode={isEditMode} isViewMode={isViewMode}
        saving={saving} handleSubmit={handleValidateAndSave} onModify={onModify}
        onDelete={() => onDelete && onDelete(localData)} onCancel={onCancel}
        onEditCancel={onEditCancel} onNewEntry={onNewEntry} rights={rights} />
    </div>
  );
};

export default ApprovalTransactionForm;