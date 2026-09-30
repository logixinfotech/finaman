import React, { useState, useCallback, useEffect, useRef } from "react";
import ERPHeader from "../../../../components/Reusable/form/HeaderForm";
import ERPFooter from "../../../../components/Reusable/form/FooterForm";
import ERPAutocomplete from "../../../../components/Reusable/input/ERPAutocomplete";
import { getActledList, getLeaveTypes, getLeaveTypesByEmployee, fetchRestrictedHolidays } from "../../../../utils/api";
import ERPDateInput from "../../../../components/Reusable/input/Date";
import { showToast } from "../../../../components/Reusable/alert";
import { focusFirstInput, handleERPBackspaceNavigation, handleERPEnterNavigation } from "../../../../utils/erpShortcuts";

const LeaveRequestForm = ({
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
  initialData = {}, onPrevRecord, onNextRecord
}) => {
  const [localData, setLocalData] = useState(initialData);
  const [errors, setErrors] = useState({});
  const [employees, setEmployees] = useState([]);
  const [employeeNames, setEmployeeNames] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [leaveTypeNames, setLeaveTypeNames] = useState([]);
  const [allLeaveTypes, setAllLeaveTypes] = useState([]); // backup — sab types
  const [restrictedHolidays, setRestrictedHolidays] = useState([]);

  const isViewMode = mode === "view";
  const isEditMode = mode === "edit";
  const isAddMode = mode === "add";
  const saveBtnRef = useRef(null);
  const FONT = `'Inter', 'Tahoma', system-ui, sans-serif`;
  const formRef = useRef(null);

  useEffect(() => {
    if (isAddMode || isEditMode) {
      focusFirstInput(formRef);
    }
  }, [isAddMode, isEditMode]);

  // ── Fetch employees & RH holidays ───────────────────────
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [empData, rhData] = await Promise.all([
          getActledList(),
          fetchRestrictedHolidays(),
        ]);
        setEmployees(empData || []);
        setEmployeeNames((empData || []).map((e) => (e.full_name || e.Led_name)?.trim()));
        setRestrictedHolidays(rhData || []);
      } catch (err) {
        console.error("Initial fetch error:", err);
      }
    };
    fetchInitialData();
  }, []);

  // ── Fetch leave types ───────────────────────────────────
  useEffect(() => {
    const fetchLeaveTypes = async () => {
      try {
        const res = await getLeaveTypes();
        const data = res?.data || [];
        setAllLeaveTypes(data);   // sab types backup mein
        setLeaveTypes(data);
        setLeaveTypeNames(data.map((lt) => lt.leave_name));
      } catch (err) {
        console.error("LeaveType fetch error:", err);
      }
    };
    fetchLeaveTypes();
  }, []);

  // ── Sync initialData → localData ────────────────────────
  useEffect(() => {
    if (!initialData || Object.keys(initialData).length === 0) return;
    const formatted = {
      ...initialData,
      from_date: initialData.from_date ? initialData.from_date.split("T")[0] : "",
      to_date: initialData.to_date ? initialData.to_date.split("T")[0] : "",
    };
    if (JSON.stringify(localData) !== JSON.stringify(formatted)) {
      setLocalData(formatted);
      setFormData(formatted);
    }
  }, [initialData]);

  // ── Employee ke leave types + month-wise balance (From Date ke month tak) ──
  useEffect(() => {
    const showAll = () => {
      setLeaveTypes(allLeaveTypes);
      setLeaveTypeNames(allLeaveTypes.map((lt) => lt.leave_name));
    };
    if (!localData.employee_id) {
      showAll();
      return;
    }

    let cancelled = false;
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    getLeaveTypesByEmployee(localData.employee_id, localData.from_date || today, localData.request_id)
      .then((res) => {
        if (cancelled) return;
        const empLTs = res?.data || [];
        if (empLTs.length > 0) {
          setLeaveTypes(empLTs);
          setLeaveTypeNames(empLTs.map((lt) => lt.leave_name));
        } else {
          showAll();
        }
      })
      .catch(() => { if (!cancelled) showAll(); });

    return () => { cancelled = true; };
  }, [localData.employee_id, localData.from_date, localData.request_id, allLeaveTypes]);

  // ── Auto-calculate total_days ────────────────────────────
  useEffect(() => {
    if (localData.from_date && localData.to_date) {
      const from = new Date(localData.from_date);
      const to = new Date(localData.to_date);
      const diff = Math.ceil((to - from) / (1000 * 60 * 60 * 24)) + 1;
      const days = diff > 0 ? diff : 0;

      if (days !== parseFloat(localData.total_days)) {
        const updated = { ...localData, total_days: days };
        setLocalData(updated);
        setFormData(updated);
      }
    }
  }, [localData.from_date, localData.to_date]);

  useEffect(() => {
    setTimeout(() => {
      console.log("Save Ref:", saveBtnRef.current);

      if (saveBtnRef.current) {
        saveBtnRef.current.focus();
        console.log("Focused");
      }
    }, 3000);
  }, []);
  const handleKeyDown = useCallback(
    (e) => {
      handleERPEnterNavigation(e, formRef, isViewMode, saveBtnRef);
      handleERPBackspaceNavigation(e, formRef, isViewMode)
    },
    [isViewMode]
  );

  // ── Field change handler ─────────────────────────────────
  const handleChange = (field, value) => {
    let updated = { ...localData };

    if (field === "employee_name") {
      const emp = employees.find((e) =>
        (e.full_name || e.Led_name)?.trim() === value?.trim()
      );
      updated.employee_name = value;
      updated.employee_id = emp ? Number(emp.Actled_id) : "";
      // Leave type bhi clear karo jab employee change ho (leave types effect se reload honge)
      updated.leave_name = "";
      updated.leave_type_id = "";
    } else if (field === "leave_name") {
      const lt = leaveTypes.find((l) => l.leave_name === value);
      updated.leave_name = value;
      updated.leave_type_id = lt ? lt.leave_type_id : "";
    } else {
      updated[field] = value;
    }

    setLocalData(updated);
    setFormData(updated);

    // Clear error
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy[field === "employee_name" ? "employee_id" : field];
      delete copy[field === "leave_name" ? "leave_type_id" : field];
      return copy;
    });
  };

  // ── Input class ──────────────────────────────────────────
  const getInputClass = (disabled, fieldName) =>
    `w-full h-[32px] px-2 text-[15px] border rounded-md outline-none transition-colors
    ${errors[fieldName] ? "border-red-500" : "border-gray-300"}
    ${disabled
      ? "bg-[#eef1f6] text-gray-500 cursor-not-allowed"
      : "bg-white text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
    }`;

  const selectedLT = leaveTypes.find(
    (l) => l.leave_type_id === localData.leave_type_id || l.leave_name === localData.leave_name
  );
  const isRH = selectedLT && (selectedLT.leave_code?.toUpperCase() === "RH" || selectedLT.leave_name?.toLowerCase().includes("restricted"));

  // ── Month-wise balance (CF + earned till From Date month − used − pending) ──
  const monthlyBal = selectedLT?.monthly_balance;
  const requestedDays = parseFloat(localData.total_days) || 0;
  const balanceError =
    !isViewMode && monthlyBal && selectedLT?.balance_tracked && requestedDays > monthlyBal.available
      ? `Only ${monthlyBal.available} day(s) available till ${monthlyBal.month_name}. You selected ${requestedDays} day(s).`
      : "";

  // ── Validate and save ────────────────────────────────────
  const handleValidateAndSave = useCallback(() => {
    if (isViewMode) return;

    const newErrors = {};
    if (!localData.employee_id) newErrors.employee_id = "Required";
    if (!localData.leave_type_id) newErrors.leave_type_id = "Required";
    if (!localData.from_date) newErrors.from_date = "Required";
    if (!localData.to_date) newErrors.to_date = "Required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // ── RH Specific Validations ──
    if (isRH) {
      const isValidRHDate = restrictedHolidays.some((rh) => rh.date === localData.from_date);
      if (restrictedHolidays.length > 0 && !isValidRHDate) {
        showToast({ icon: "error", title: "Selected date is not in the approved Restricted Holiday list." });
        setErrors((prev) => ({ ...prev, from_date: "Invalid RH Date" }));
        return;
      }
    }

    // ── Leave balance check (all paid leave types) ──
    if (balanceError) {
      showToast({ icon: "error", title: `Insufficient ${selectedLT.leave_name} balance. ${balanceError}` });
      return;
    }

    if (onSave) onSave(localData);
  }, [localData, onSave, isViewMode, isRH, restrictedHolidays, selectedLT, balanceError]);

  return (
    <div
      className="w-full h-full sm:h-[calc(100vh-100px)] bg-[#eef1f6] flex flex-col overflow-hidden font-sans"
      style={{ fontFamily: FONT }}
    >
      <ERPHeader
        title="Leave Request"
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

      <div className="flex-1 p-2 sm:p-4 overflow-y-auto">
        <div ref={formRef} className="w-full bg-white border max-w-[750px] mx-auto border-slate-200 shadow-sm rounded-md overflow-visible relative">
          <div className="p-3 sm:p-5 grid grid-cols-1 gap-y-3 sm:gap-y-4">

            {/* ── Employee & Leave Type ── */}
            <div className="flex flex-row gap-2 sm:gap-6 w-full">
              <div className="flex flex-row items-start px-1 flex-1">
                <label className="text-[13px] sm:text-[14px] w-[65px] sm:w-[100px] pt-1 shrink-0">
                  Employee <span className="text-red-500">*</span>
                </label>
                <div className="flex-1 w-full">
                  <ERPAutocomplete
                    options={employeeNames}
                    value={localData.employee_name || ""}
                    onChange={(val) => handleChange("employee_name", val)}
                    className={getInputClass(isViewMode, "employee_id")}
                    disabled={isViewMode}
                    onKeyDown={handleKeyDown}
                  />
                </div>
              </div>

              {/* ── Leave Type ── */}
              <div className="flex flex-row items-start px-1 flex-1">
                <label className="text-[13px] sm:text-[14px] w-[60px] sm:w-[100px] pt-1 shrink-0">
                  Leave Type <span className="text-red-500">*</span>
                </label>
                <div className="flex-1 w-full">
                  <ERPAutocomplete
                    options={leaveTypeNames}
                    value={localData.leave_name || ""}
                    onChange={(val) => handleChange("leave_name", val)}
                    className={getInputClass(isViewMode, "leave_type_id")}
                    disabled={isViewMode}
                    onKeyDown={handleKeyDown}
                  />
                  {selectedLT && (
                    <div className="mt-1 text-[11px]">
                      <div className="flex items-center gap-2">
                        {monthlyBal ? (
                          <span className={`font-semibold ${monthlyBal.available > 0 && !balanceError ? "text-emerald-700" : "text-red-600"}`}>
                            Available ({monthlyBal.month_name}): {monthlyBal.available} days
                          </span>
                        ) : (
                          <span className={`font-semibold ${parseFloat(selectedLT.balance_days) > 0 ? "text-emerald-700" : "text-red-600"}`}>
                            Balance: {selectedLT.balance_days ?? 0} days
                          </span>
                        )}
                        {isRH && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200">
                            RH Entitlement
                          </span>
                        )}
                      </div>
                      {monthlyBal && (
                        <div className="text-gray-500 mt-0.5">
                          <span className="text-gray-400"> · Annual {monthlyBal.annual}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── RH Quick Selector Helper (if RH selected) ── */}
            {isRH && restrictedHolidays.length > 0 && (
              <div className="flex flex-row items-center px-1 w-full">
                <label className="text-[13px] sm:text-[14px] text-gray-700 w-[65px] sm:w-[100px] shrink-0 font-medium">
                  RH Holiday
                </label>
                <div className="flex-1 w-full">
                  <select
                    disabled={isViewMode}
                    onChange={(e) => {
                      const rh = restrictedHolidays.find((h) => h.date === e.target.value);
                      if (rh) {
                        handleChange("from_date", rh.date);
                        handleChange("to_date", rh.date);
                        handleChange("reason", `Restricted Holiday - ${rh.purpose}`);
                      }
                    }}
                    className={getInputClass(isViewMode, "rh_holiday")}
                    value={localData.from_date || ""}
                  >
                    <option value="">-- Select Approved Restricted Holiday --</option>
                    {restrictedHolidays.map((h) => (
                      <option key={h.id || h.date} value={h.date}>
                        {h.purpose} ({h.date})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* ── Dates ── */}
            <div className="flex flex-row gap-2 sm:gap-6 w-full">
              <div className="flex flex-row items-start px-1 flex-1">
                <label className="text-[13px] sm:text-[14px] w-[65px] sm:w-[100px] shrink-0">
                  From Date <span className="text-red-500">*</span>
                </label>
                <div className="flex-1 w-full">
                  <ERPDateInput
                    value={localData.from_date || ""}
                    disabled={isViewMode}
                    onChange={(val) => handleChange("from_date", val)}
                    className={getInputClass(isViewMode, "from_date")}
                    onKeyDown={handleKeyDown}
                  />
                </div>
              </div>

              <div className="flex flex-row items-start px-1 flex-1">
                <label className="text-[13px] sm:text-[14px] w-[55px] sm:w-[100px] shrink-0">
                  To Date <span className="text-red-500">*</span>
                </label>
                <div className="flex-1 w-full">
                  <ERPDateInput
                    value={localData.to_date || ""}
                    disabled={isViewMode}
                    onChange={(val) => handleChange("to_date", val)}
                    className={getInputClass(isViewMode, "to_date")}
                    onKeyDown={handleKeyDown}
                  />
                </div>
              </div>
            </div>

            {/* ── Total Days (auto-calculated, read-only) ── */}
            <div className="flex flex-row items-start px-1">
              <label className="text-[13px] sm:text-[14px] w-[65px] sm:w-[100px] shrink-0">Total Days</label>
              <div className="flex-1 w-full">
                <input
                  type="number"
                  value={localData.total_days || ""}
                  disabled
                  className={`${getInputClass(true, "total_days")} ${balanceError ? "!border-red-500" : ""}`}
                  placeholder="Auto-calculated"
                  onKeyDown={handleKeyDown}
                />
                {balanceError && (
                  <p className="text-[11px] text-red-600 font-medium mt-1">{balanceError}</p>
                )}
              </div>
            </div>

            {/* ── Reason ── */}
            <div className="flex flex-row items-start px-1">
              <label className="text-[13px] sm:text-[14px] w-[65px] sm:w-[100px] pt-1 shrink-0">Reason</label>
              <div className="flex-1 w-full">
                <textarea
                  rows={3}
                  value={localData.reason || ""}
                  disabled={isViewMode}
                  onChange={(e) => handleChange("reason", e.target.value)}
                  className={`${getInputClass(isViewMode, "reason")} h-[40px] py-2`}
                  placeholder="Enter reason for leave..."
                  onKeyDown={handleKeyDown}
                />
              </div>
            </div>

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
        onModify={() => {
          const status = (localData?.status || "").toUpperCase();
          if (status === "APPROVED" || status === "REJECTED") {
            showToast({ icon: "error", title: `Cannot modify — request is already ${status}` });
            return;
          }
          onModify?.();
        }}
        onDelete={() => onDelete && onDelete(localData)}
        onCancel={onCancel}
        onEditCancel={onEditCancel}
        onNewEntry={onNewEntry}
        rights={rights}
      />
    </div>
  );
};

export default LeaveRequestForm;