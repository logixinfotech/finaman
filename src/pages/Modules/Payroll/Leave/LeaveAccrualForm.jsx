// ─────────────────────────────────────────────────────────────────────────────
// FILE: LeaveAccrualForm.jsx
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useCallback, useEffect } from "react";
import ERPHeader from "../../../../components/Reusable/form/HeaderForm";
import ERPFooter from "../../../../components/Reusable/form/FooterForm";
import ERPAutocomplete from "../../../../components/Reusable/input/ERPAutocomplete";
import ERPDateInput from "../../../../components/Reusable/input/Date";
import { getActledList, getLeaveTypes } from "../../../../utils/api";
import { getEligibleFYMonths } from "./LeaveAccrual";

const ACCRUAL_TYPE_OPTIONS = ["Monthly", "Quarterly", "Yearly"];
const YEAR_OPTIONS = Array.from({ length: 6 }, (_, i) =>
  String(new Date().getFullYear() - 2 + i)
);

export const LeaveAccrualForm = ({
  mode = "view",
  onSave, onCancel, onDelete, onEditCancel,
  saving, onModify, onNewEntry,
  currentRecord, totalRecords,
  setFormData, rights,
  activeTab = "entry", onTabChange,
  initialData = {},
}) => {
  const [localData, setLocalData] = useState(initialData);
  const [errors, setErrors] = useState({});
  const [employees, setEmployees] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);

  const isViewMode = mode === "view";
  const isEditMode = mode === "edit";
  const isAddMode = mode === "add";
  const FONT = `'Inter', 'Tahoma', system-ui, sans-serif`;
  const requiredFields = ["employee_id", "leave_type_id", "financial_year", "accrual_type", "accrual_days"];

  useEffect(() => {
    const load = async () => {
      try {
        const [empData, ltData] = await Promise.all([
          getActledList(), getLeaveTypes(),
        ]);
        setEmployees(empData || []);
        setLeaveTypes(ltData?.data || []);
      } catch (err) { console.error(err); }
    };
    load();
  }, []);

  useEffect(() => {
    if (!initialData || Object.keys(initialData).length === 0) return;
    const formatted = {
      ...initialData,
      financial_year: initialData.financial_year ? String(initialData.financial_year) : "",
    };
    if (JSON.stringify(localData) !== JSON.stringify(formatted)) {
      setLocalData(formatted);
      setFormData(formatted);
    }
  }, [initialData]);

  useEffect(() => {
    const accrual = parseFloat(localData.accrual_days) || 0;
    const cf = parseFloat(localData.carry_forward) || 0;
    setLocalData(p => ({ ...p, total_accrued: (accrual + cf).toFixed(2) }));
  }, [localData.accrual_days, localData.carry_forward]);

  // Auto-calculate prorated accrual_days when employee, leave_type, or FY changes in add mode
  const currentEmp = employees.find(e => Number(e.Actled_id) === Number(localData.employee_id));
  const currentLT = leaveTypes.find(l => l.leave_type_id === localData.leave_type_id);
  const fyYear = localData.financial_year ? parseInt(localData.financial_year) : new Date().getFullYear();
  const eligibleFYMonths = currentEmp ? getEligibleFYMonths(currentEmp.Doj, fyYear) : [];
  const eligibleMonthsCount = eligibleFYMonths.filter(m => m.isEligible).length;

  const handleChange = (field, value) => {
    let updated = { ...localData };

    if (field === "employee_name") {
      const emp = employees.find(e => (e.full_name || e.Led_name)?.trim() === value?.trim());
      updated.employee_name = value;
      updated.employee_id = emp ? Number(emp.Actled_id) : null;

      if (emp && updated.leave_type_id && isAddMode) {
        const lt = leaveTypes.find(l => l.leave_type_id === updated.leave_type_id);
        const maxDays = parseFloat(lt?.max_days) || 12;
        const eMonths = getEligibleFYMonths(emp.Doj, updated.financial_year || new Date().getFullYear());
        const eCount = eMonths.filter(m => m.isEligible).length;
        updated.accrual_days = ((maxDays / 12) * eCount).toFixed(2);
      }
    } else if (field === "leave_name") {
      const lt = leaveTypes.find(l => l.leave_name?.trim() === value?.trim());
      updated.leave_name = value;
      updated.leave_type_id = lt ? lt.leave_type_id : null;

      if (lt && updated.employee_id && isAddMode) {
        const emp = employees.find(e => Number(e.Actled_id) === Number(updated.employee_id));
        const maxDays = parseFloat(lt.max_days) || 12;
        const eMonths = getEligibleFYMonths(emp?.Doj, updated.financial_year || new Date().getFullYear());
        const eCount = eMonths.filter(m => m.isEligible).length;
        updated.accrual_days = ((maxDays / 12) * eCount).toFixed(2);
      }
    } else if (field === "financial_year") {
      updated.financial_year = value;
      if (updated.employee_id && updated.leave_type_id && isAddMode) {
        const emp = employees.find(e => Number(e.Actled_id) === Number(updated.employee_id));
        const lt = leaveTypes.find(l => l.leave_type_id === updated.leave_type_id);
        const maxDays = parseFloat(lt?.max_days) || 12;
        const eMonths = getEligibleFYMonths(emp?.Doj, value);
        const eCount = eMonths.filter(m => m.isEligible).length;
        updated.accrual_days = ((maxDays / 12) * eCount).toFixed(2);
      }
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

  const employeeNames = employees.map(e => (e.full_name || e.Led_name)?.trim()).filter(Boolean);
  const leaveTypeNames = leaveTypes.map(lt => lt.leave_name);

  return (
    <div className="w-full max-w-[700px] mx-auto h-[calc(100vh-140px)] bg-[#eef1f6] flex flex-col overflow-hidden" style={{ fontFamily: FONT }}>
      <ERPHeader title="LEAVE ACCRUAL & CARRY FORWARD" isAddMode={isAddMode}
        isEditMode={isEditMode} isViewMode={isViewMode} activeTab={activeTab}
        onTabChange={onTabChange} rightContent={`${currentRecord || 1} / ${totalRecords || 1}`} />

      <div className="flex-1 p-4 overflow-y-auto">
        <div className="w-full bg-white border border-slate-200 shadow-sm rounded-md overflow-hidden">

          {/* Row 1: Employee | Leave Type */}
          <div className="flex items-center gap-4 px-5 py-2">
            <Field label="Employee" required>
              <ERPAutocomplete options={employeeNames}
                value={localData.employee_name || ""}
                onChange={val => handleChange("employee_name", val)}
                className={inp(isViewMode, "employee_id")} disabled={isViewMode} />
              {errors.employee_id && <span className="text-[11px] text-red-500">{errors.employee_id}</span>}
              {currentEmp && (
                <p className="text-[11px] text-blue-600 mt-0.5">
                  ID: {currentEmp.Actled_id} {currentEmp.Doj ? `· DOJ: ${new Date(currentEmp.Doj).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' })} (${eligibleMonthsCount}/12 mo)` : ""}
                </p>
              )}
            </Field>
            <Field label="Leave Type" required>
              <ERPAutocomplete options={leaveTypeNames}
                value={localData.leave_name || ""}
                onChange={val => handleChange("leave_name", val)}
                className={inp(isViewMode, "leave_type_id")} disabled={isViewMode} />
              {errors.leave_type_id && <span className="text-[11px] text-red-500">{errors.leave_type_id}</span>}
            </Field>
          </div>

          {/* Row 2: Financial Year | Accrual Type */}
          <div className="flex items-center gap-4 px-5 py-2">
            <Field label="Financial Year" required>
              <ERPAutocomplete options={YEAR_OPTIONS}
                value={localData.financial_year ? String(localData.financial_year) : ""}
                onChange={val => handleChange("financial_year", val)}
                className={inp(isViewMode, "financial_year")} disabled={isViewMode} />
              {errors.financial_year && <span className="text-[11px] text-red-500">{errors.financial_year}</span>}
            </Field>
            <Field label="Accrual Type" required>
              <ERPAutocomplete options={ACCRUAL_TYPE_OPTIONS}
                value={localData.accrual_type || ""}
                onChange={val => handleChange("accrual_type", val)}
                className={inp(isViewMode, "accrual_type")} disabled={isViewMode} />
              {errors.accrual_type && <span className="text-[11px] text-red-500">{errors.accrual_type}</span>}
            </Field>
          </div>

          {/* Row 3: Accrual Days | Carry Forward */}
          <div className="flex items-center gap-4 px-5 py-2">
            <Field label="Accrual Days" required>
              <input type="number" step="0.5"
                value={localData.accrual_days || ""}
                disabled={isViewMode}
                onChange={e => handleChange("accrual_days", e.target.value)}
                placeholder="e.g. 1.5"
                className={inp(isViewMode, "accrual_days")} />
              {errors.accrual_days && <span className="text-[11px] text-red-500">{errors.accrual_days}</span>}
            </Field>
            <Field label="Carry Forward">
              <input type="number" step="0.5"
                value={localData.carry_forward || ""}
                disabled={isViewMode}
                onChange={e => handleChange("carry_forward", e.target.value)}
                placeholder="Pichle saal se"
                className={inp(isViewMode, "carry_forward")} />
            </Field>
          </div>

          {/* Row 4: Total Accrued (read-only) | Accrual Date */}
          <div className="flex items-center gap-4 px-5 py-2">
            <Field label="Total Accrued">
              <input type="number" value={localData.total_accrued || ""}
                disabled className={inp(true, "total_accrued")} />
              <p className="text-[11px] text-gray-400 mt-0.5">Auto = Accrual + Carry Forward</p>
            </Field>
            <Field label="Accrual Date">
              <ERPDateInput value={localData.accrual_date || ""}
                onChange={val => handleChange("accrual_date", val)}
                className={inp(isViewMode, "accrual_date")} disabled={isViewMode} />
            </Field>
          </div>

          {/* Row 5: Remarks */}
          <div className="px-5 py-3">
            <Field label="Remarks">
              <input type="text" value={localData.remarks || ""}
                disabled={isViewMode}
                onChange={e => handleChange("remarks", e.target.value)}
                className={inp(isViewMode, "remarks")} placeholder="Optional..." />
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

export default LeaveAccrualForm;