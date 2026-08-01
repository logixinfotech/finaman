import React, { useState, useCallback, useEffect, useRef } from "react";
import ERPHeader from "../../../../components/Reusable/form/HeaderForm";
import ERPFooter from "../../../../components/Reusable/form/FooterForm";
import ERPAutocomplete from "../../../../components/Reusable/input/ERPAutocomplete";
import ERPDateInput from "../../../../components/Reusable/input/Date";
import { getActledList, getLeaveTypes } from "../../../../utils/api";
import {
  focusFirstInput,
  handleERPBackspaceNavigation,
  handleERPEnterNavigation,
} from "../../../../utils/erpShortcuts";

const STATUS_OPTIONS = ["Pending", "Approved", "Paid"];
const YEAR_OPTIONS = Array.from({ length: 6 }, (_, i) =>
  String(new Date().getFullYear() - 2 + i),
);

const Field = ({ label, required, children }) => (
  <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
    <label className="w-[70px] sm:w-[130px] shrink-0 text-[13px] sm:text-[15px] text-black-800">
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    <div className="flex-1 min-w-0">{children}</div>
  </div>
);

export const LeaveEncashmentForm = ({
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
  onPrevRecord,
  onNextRecord,
}) => {
  const [localData, setLocalData] = useState(initialData);
  const [errors, setErrors] = useState({});
  const [employees, setEmployees] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const syncedForRef = useRef(null);
  const formRef = useRef(null);
  const isViewMode = mode === "view";
  const isEditMode = mode === "edit";
  const isAddMode = mode === "add";
  const FONT = `'Inter', 'Tahoma', system-ui, sans-serif`;

  const requiredFields = [
    "employee_id",
    "leave_type_id",
    "financial_year",
    "days_encashed",
    "encashment_date",
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      if (formRef.current && (isAddMode || isEditMode)) {
        focusFirstInput(formRef);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [mode]);
  const saveBtnRef = useRef(null);
  useEffect(() => {
    const load = async () => {
      try {
        const [empData, ltData] = await Promise.all([
          getActledList(),
          getLeaveTypes(),
        ]);
        setEmployees(empData || []);
        setLeaveTypes(ltData?.data || []);
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (isAddMode) {
      const key = `add_${mode}`;
      if (syncedForRef.current === key) return;
      syncedForRef.current = key;

      const blankForm = {
        employee_name: "",
        employee_id: null,
        leave_name: "",
        leave_type_id: null,
        financial_year: "",
        encashment_date: "",
        days_encashed: "",
        rate_per_day: "",
        total_amount: "",
        status: "Pending",
        paid_in_payroll: false,
        remarks: "",
      };
      setLocalData(blankForm);
      setFormData(blankForm);
      return;
    }

    if (!initialData || Object.keys(initialData).length === 0) return;

    const key = `${initialData?.encashment_id}_${mode}`;
    if (syncedForRef.current === key) return;
    syncedForRef.current = key;

    const formatted = {
      ...initialData,
      financial_year: initialData.financial_year
        ? String(initialData.financial_year)
        : "",
      encashment_date: initialData.encashment_date
        ? initialData.encashment_date.split("T")[0]
        : "",
    };
    setLocalData(formatted);
  }, [initialData?.encashment_id, mode, isAddMode, setFormData]);

  // Auto-calculate total_amount
  useEffect(() => {
    const days = parseFloat(localData.days_encashed) || 0;
    const rate = parseFloat(localData.rate_per_day) || 0;
    const newTotal = (days * rate).toFixed(2);
    if (newTotal !== localData.total_amount) {
      setLocalData((p) => ({ ...p, total_amount: newTotal }));
    }
  }, [localData.days_encashed, localData.rate_per_day]);

  const handleChange = (field, value) => {
    let updated = { ...localData };

    if (field === "employee_name") {
      const emp = employees.find((e) => e.Led_name?.trim() === value?.trim());
      updated.employee_name = value;
      updated.employee_id = emp ? Number(emp.Actled_id) : null;
      if (emp?.Pay_amt) {
        const perDay = (parseFloat(emp.Pay_amt) / 26).toFixed(2);
        updated.rate_per_day = perDay;
      }
    } else if (field === "leave_name") {
      const lt = leaveTypes.find((l) => l.leave_name?.trim() === value?.trim());
      updated.leave_name = value;
      updated.leave_type_id = lt ? lt.leave_type_id : null;
    } else {
      updated[field] = value;
    }

    setLocalData(updated);
    setErrors((prev) => {
      const c = { ...prev };
      delete c[field];
      return c;
    });
  };

  const handleValidateAndSave = useCallback(() => {
    if (isViewMode) return;
    const newErrors = {};
    requiredFields.forEach((f) => {
      if (!localData[f] || String(localData[f]).trim() === "")
        newErrors[f] = "Required";
    });
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setFormData(localData); // Save se pehle sync karo
    if (onSave) onSave(localData);
  }, [localData, onSave, isViewMode, setFormData]);

  const handleKeyDown = useCallback(
    (e) => {
      handleERPEnterNavigation(e, formRef, isViewMode, saveBtnRef);
      handleERPBackspaceNavigation(e, formRef, isViewMode);
    },
    [isViewMode],
  );

  const inp = (disabled, fieldName) =>
    `w-full h-[32px] px-2 text-[15px] border rounded-md outline-none transition-colors
     ${errors[fieldName] ? "border-red-500" : "border-gray-300"}
     ${
       disabled
         ? "bg-[#eef1f6] text-gray-500 cursor-not-allowed"
         : "bg-white text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
     }`;

  const employeeNames = employees
    .map((e) => e.Led_name?.trim())
    .filter(Boolean);
  const leaveTypeNames = leaveTypes.map((lt) => lt.leave_name);

  return (
    <div
      className="w-full  h-full sm:h-[calc(100vh-100px)] bg-[#eef1f6] flex flex-col overflow-hidden"
      style={{ fontFamily: FONT }}
    >
      <ERPHeader
        title="Leave Encashment"
        isAddMode={isAddMode}
        isEditMode={isEditMode}
        isViewMode={isViewMode}
        activeTab={activeTab}
        onTabChange={onTabChange}
        rightContent={`${currentRecord || 1} / ${totalRecords || 1}`}
        currentIndex={currentRecord} // 👈
        totalRecords={totalRecords} // 👈
        onPrevRecord={onPrevRecord} // 👈
        onNextRecord={onNextRecord}
      />

      <div className="flex-1 p-2 sm:p-4 overflow-y-auto">
        <div
          ref={formRef}
          className="w-full bg-white border border-slate-200 max-w-[750px] mx-auto
       shadow-sm rounded-md overflow-hidden"
        >
          <div className="flex items-center gap-2 sm:gap-4 px-3 sm:px-5 py-1.5 sm:py-2">
            <Field label="Employee" required>
              <ERPAutocomplete
                options={employeeNames}
                data-field="employee_id"
                value={localData.employee_name || ""}
                onChange={(val) => handleChange("employee_name", val)}
                className={inp(isViewMode, "employee_id")}
                disabled={isViewMode}
                onKeyDown={handleKeyDown}
              />
            </Field>

            <Field label="Leave Type" required>
              <ERPAutocomplete
                options={leaveTypeNames}
                data-field="leave_type_id"
                value={localData.leave_name || ""}
                onChange={(val) => handleChange("leave_name", val)}
                className={inp(isViewMode, "leave_type_id")}
                disabled={isViewMode}
                onKeyDown={handleKeyDown}
              />
            </Field>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 px-3 sm:px-5 py-1.5 sm:py-2">
            <Field label="Financial Year" required>
              <ERPAutocomplete
                options={YEAR_OPTIONS}
                data-field="financial_year"
                value={
                  localData.financial_year
                    ? String(localData.financial_year)
                    : ""
                }
                onChange={(val) => handleChange("financial_year", val)}
                className={inp(isViewMode, "financial_year")}
                disabled={isViewMode}
                onKeyDown={handleKeyDown}
              />
            </Field>

            <Field label="Encashment Date" required>
              <ERPDateInput
                value={localData.encashment_date || ""}
                data-field="encashment_date"
                onChange={(val) => handleChange("encashment_date", val)}
                className={inp(isViewMode, "encashment_date")}
                disabled={isViewMode}
                onKeyDown={handleKeyDown}
              />
            </Field>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 px-3 sm:px-5 py-1.5 sm:py-2">
            <Field label="Days Encashed" required>
              <input
                type="number"
                step="0.5"
                data-field="days_encashed"
                value={localData.days_encashed || ""}
                disabled={isViewMode}
                onChange={(e) => handleChange("days_encashed", e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g. 5"
                className={inp(isViewMode, "days_encashed")}
              />
            </Field>
            <Field label="Rate Per Day" required>
              <input
                type="number"
                step="0.01"
                data-field="rate_per_day"
                value={localData.rate_per_day || ""}
                disabled={isViewMode}
                onChange={(e) => handleChange("rate_per_day", e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Auto from salary"
                className={inp(isViewMode, "rate_per_day")}
              />
              <p className="text-[11px] text-gray-400 mt-0.5">
                Basic Salary ÷ 26
              </p>
            </Field>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 px-3 sm:px-5 py-1.5 sm:py-2">
            <Field label="Total Amount">
              <input
                type="number"
                value={localData.total_amount || ""}
                disabled
                className={inp(true, "total_amount")}
              />
              <p className="text-[11px] text-gray-400 mt-0.5">
                Auto = Days × Rate
              </p>
            </Field>
            <Field label="Status">
              <ERPAutocomplete
                options={STATUS_OPTIONS}
                value={localData.status || "Pending"}
                onChange={(val) => handleChange("status", val)}
                className={inp(isViewMode, "status")}
                disabled={isViewMode}
                onKeyDown={handleKeyDown}
              />
            </Field>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 px-3 sm:px-5 py-1.5 sm:py-2">
            <Field label="Paid in Payroll">
              <div className="flex items-center gap-2 h-[32px]">
                <input
                  type="checkbox"
                  checked={!!localData.paid_in_payroll}
                  disabled={isViewMode}
                  onChange={(e) =>
                    handleChange("paid_in_payroll", e.target.checked)
                  }
                  onKeyDown={handleKeyDown}
                  className="w-4 h-4 accent-blue-600 cursor-pointer"
                />
              </div>
            </Field>
            <Field label="Remarks">
              <input
                type="text"
                value={localData.remarks || ""}
                disabled={isViewMode}
                onChange={(e) => handleChange("remarks", e.target.value)}
                onKeyDown={handleKeyDown}
                className={inp(isViewMode, "remarks")}
                placeholder="Optional..."
              />
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
        saveBtnRef={saveBtnRef}
        onDelete={() => onDelete && onDelete(localData)}
        onCancel={onCancel}
        onEditCancel={onEditCancel}
        onNewEntry={onNewEntry}
        rights={rights}
      />
    </div>
  );
};

export default LeaveEncashmentForm;