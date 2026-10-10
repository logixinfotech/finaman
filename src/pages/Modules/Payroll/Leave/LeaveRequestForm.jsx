import React, { useState, useCallback, useEffect, useRef } from "react";
import ERPHeader from "../../../../components/Reusable/form/HeaderForm";
import ERPFooter from "../../../../components/Reusable/form/FooterForm";
import ERPAutocomplete from "../../../../components/Reusable/input/ERPAutocomplete";
import { getActledList, getLeaveTypes, getLeaveTypesByEmployee, fetchAllHolidays } from "../../../../utils/api";
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
  const [allHolidays, setAllHolidays] = useState([]);
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

  // ── Fetch employees & Holidays (Company + RH) ─────────────
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [empData, hData] = await Promise.all([
          getActledList(),
          fetchAllHolidays(),
        ]);
        setEmployees(empData || []);
        setEmployeeNames((empData || []).map((e) => (e.full_name || e.Led_name)?.trim()));
        setAllHolidays(hData || []);
        setRestrictedHolidays(
          (hData || []).filter(
            (h) => h.is_restricted === 1 || h.holiday_type_code === "Restricted" || h.holiday_type_code === "RH"
          )
        );
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

  // ── Company Holidays (Non-RH) ───────────────────────────
  const companyHolidays = allHolidays.filter(
    (h) => h.is_restricted !== 1 && h.holiday_type_code !== "Restricted" && h.holiday_type_code !== "RH"
  );

  // ── Auto-calculate total_days (Excluding Company Holidays) ──
  useEffect(() => {
    if (localData.from_date && localData.to_date) {
      const fromD = parseDateOnly(localData.from_date);
      const toD = parseDateOnly(localData.to_date);
      if (fromD && toD && fromD <= toD) {
        let count = 0;
        let curr = new Date(fromD.getTime());
        while (curr <= toD) {
          const dStr = formatDateISO(curr);
          const isCompHol = companyHolidays.some((h) => h.date === dStr);
          if (!isCompHol) {
            count++;
          }
          curr.setDate(curr.getDate() + 1);
        }
        if (count !== parseFloat(localData.total_days)) {
          const updated = { ...localData, total_days: count };
          setLocalData(updated);
          setFormData(updated);
        }
      }
    }
  }, [localData.from_date, localData.to_date, allHolidays]);

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

  // ── Date Helpers ──────────────────────────────────────────
  const formatDateISO = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const parseDateOnly = (str) => {
    if (!str) return null;
    const parts = str.split("T")[0].split("-");
    if (parts.length === 3) {
      return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    }
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  };

  const addDaysToDateStr = (dateStr, days) => {
    const d = parseDateOnly(dateStr);
    if (!d) return dateStr;
    d.setDate(d.getDate() + days);
    return formatDateISO(d);
  };

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return "";
    const d = parseDateOnly(dateStr);
    if (!d) return dateStr;
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
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
  const isPaidLeave = selectedLT && (selectedLT.is_paid === true || selectedLT.is_paid === 1 || selectedLT.is_paid === "1" || selectedLT.is_paid === undefined) && (selectedLT.leave_code?.toUpperCase() !== "UNL" && selectedLT.leave_code?.toUpperCase() !== "LWP" && !selectedLT.leave_name?.toLowerCase().includes("unpaid"));

  // ── Month-wise balance (CF + earned till From Date month − used − pending) ──
  const monthlyBal = selectedLT?.monthly_balance;
  const requestedDays = parseFloat(localData.total_days) || 0;

  // Unpaid Leave Type & RH Leave Type find karo
  const unpaidLT = allLeaveTypes.find(
    (lt) => lt.is_paid === 0 || lt.is_paid === false || lt.leave_code?.toUpperCase() === "UNL" || lt.leave_code?.toUpperCase() === "LWP" || lt.leave_name?.toLowerCase().includes("unpaid")
  ) || leaveTypes.find(
    (lt) => lt.is_paid === 0 || lt.is_paid === false || lt.leave_code?.toUpperCase() === "UNL" || lt.leave_code?.toUpperCase() === "LWP" || lt.leave_name?.toLowerCase().includes("unpaid")
  );

  const rhLT = leaveTypes.find(
    (lt) => lt.leave_code?.toUpperCase() === "RH" || lt.leave_name?.toLowerCase().includes("restricted")
  ) || allLeaveTypes.find(
    (lt) => lt.leave_code?.toUpperCase() === "RH" || lt.leave_name?.toLowerCase().includes("restricted")
  );

  // ── Multi-Leave Day-by-Day Auto-Split Calculation ──
  let splitPlan = null;

  if (!isViewMode && localData.from_date && localData.to_date && selectedLT) {
    const fromD = parseDateOnly(localData.from_date);
    const toD = parseDateOnly(localData.to_date);

    if (fromD && toD && fromD <= toD) {
      const allDates = [];
      let curr = new Date(fromD.getTime());
      while (curr <= toD) {
        allDates.push(formatDateISO(curr));
        curr.setDate(curr.getDate() + 1);
      }

      let remPaid = isPaidLeave && selectedLT?.balance_tracked
        ? (monthlyBal ? Math.max(0, parseFloat(monthlyBal.available) || 0) : (parseFloat(selectedLT?.balance_days) || 0))
        : (isPaidLeave ? 999999 : 0);

      let remRH = !isRH && rhLT
        ? (rhLT.monthly_balance ? Math.max(0, parseFloat(rhLT.monthly_balance.available) || 0) : (parseFloat(rhLT?.balance_days) || 2))
        : 0;

      const taggedDays = allDates.map((dateStr) => {
        // 1. Company Holiday Check (Non-RH): Already paid day off — does not deduct leave balance & no leave request created
        const companyHolMatch = companyHolidays.find((h) => h.date === dateStr);
        if (companyHolMatch) {
          return {
            date: dateStr,
            type: "COMPANY_HOLIDAY",
            leaveType: null,
            holidayInfo: companyHolMatch,
          };
        }

        // 2. Restricted Holiday (RH) Check: If RH day and employee has RH entitlement
        const rhMatch = !isRH && restrictedHolidays.find((rh) => rh.date === dateStr);
        if (rhMatch && remRH > 0 && rhLT) {
          remRH -= 1;
          return {
            date: dateStr,
            type: "RH",
            leaveType: rhLT,
            holidayInfo: rhMatch,
          };
        }

        // 3. Paid Leave (Earned Leave / Casual Leave etc.)
        if (remPaid > 0 && isPaidLeave) {
          remPaid -= 1;
          return {
            date: dateStr,
            type: "PAID",
            leaveType: selectedLT,
            holidayInfo: null,
          };
        }

        // 4. Remainder -> Unpaid Leave (Loss of Pay)
        return {
          date: dateStr,
          type: "UNPAID",
          leaveType: unpaidLT,
          holidayInfo: null,
        };
      });

      const segments = [];
      let currentSeg = null;

      for (const item of taggedDays) {
        const ltId = item.leaveType?.leave_type_id || item.type;
        if (!currentSeg || currentSeg.key !== `${item.type}_${ltId}`) {
          if (currentSeg) segments.push(currentSeg);
          currentSeg = {
            key: `${item.type}_${ltId}`,
            type: item.type, // 'PAID', 'RH', 'UNPAID', 'COMPANY_HOLIDAY'
            isLeaveRequest: item.type !== "COMPANY_HOLIDAY",
            leaveType: item.leaveType,
            leaveTypeId: item.leaveType?.leave_type_id,
            leaveName: item.type === "COMPANY_HOLIDAY"
              ? "Company Holiday (Paid)"
              : (item.leaveType?.leave_name || (item.type === "UNPAID" ? "Unpaid Leave" : item.type === "RH" ? "Restricted Holiday" : "Leave")),
            fromDate: item.date,
            toDate: item.date,
            totalDays: 1,
            holidayInfo: item.holidayInfo,
          };
        } else {
          currentSeg.toDate = item.date;
          currentSeg.totalDays += 1;
          if (item.holidayInfo) currentSeg.holidayInfo = item.holidayInfo;
        }
      }
      if (currentSeg) segments.push(currentSeg);

      const leaveSegments = segments.filter((s) => s.isLeaveRequest);
      const paidDaysCount = segments.filter((s) => s.type === "PAID").reduce((sum, s) => sum + s.totalDays, 0);
      const rhDaysCount = segments.filter((s) => s.type === "RH").reduce((sum, s) => sum + s.totalDays, 0);
      const unpaidDaysCount = segments.filter((s) => s.type === "UNPAID").reduce((sum, s) => sum + s.totalDays, 0);
      const companyHolidayDaysCount = segments.filter((s) => s.type === "COMPANY_HOLIDAY").reduce((sum, s) => sum + s.totalDays, 0);

      const hasSplit = segments.length > 1 || segments.some((s) => s.type === "UNPAID" || s.type === "COMPANY_HOLIDAY" || (!isRH && s.type === "RH"));

      if (hasSplit) {
        splitPlan = {
          segments,
          leaveSegments,
          paidDaysCount,
          rhDaysCount,
          unpaidDaysCount,
          companyHolidayDaysCount,
          actualLeaveDays: paidDaysCount + rhDaysCount + unpaidDaysCount,
          leaveRequestsCount: leaveSegments.length,
          totalSelectedDays: allDates.length,
          availablePaidDays: monthlyBal ? Math.max(0, parseFloat(monthlyBal.available) || 0) : 0,
          monthName: monthlyBal?.month_name || "this month",
          leaveName: selectedLT?.leave_name || "Paid Leave",
        };
      }
    }
  }

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

    // ── Auto-Split Multi-Leave Submission ──
    if (splitPlan && splitPlan.leaveSegments.length > 0) {
      const split_requests = splitPlan.leaveSegments.map((seg) => ({
        employee_id: localData.employee_id,
        leave_type_id: seg.leaveTypeId || (seg.type === "UNPAID" ? unpaidLT?.leave_type_id : null),
        from_date: seg.fromDate,
        to_date: seg.toDate,
        total_days: seg.totalDays,
        reason: localData.reason
          ? (seg.type === "RH"
            ? `${localData.reason} (Restricted Holiday - ${seg.holidayInfo?.purpose || 'RH'})`
            : `${localData.reason} (${seg.leaveName}: ${seg.totalDays}d)`)
          : (seg.type === "RH"
            ? `Restricted Holiday - ${seg.holidayInfo?.purpose || 'RH'}`
            : `Leave Request (${seg.leaveName} - ${seg.totalDays}d)`),
        status: "PENDING",
      }));

      if (onSave) {
        onSave({
          ...localData,
          total_days: splitPlan.actualLeaveDays,
          split_requests,
        });
      }
      return;
    }

    if (onSave) onSave(localData);
  }, [localData, onSave, isViewMode, isRH, restrictedHolidays, selectedLT, splitPlan, unpaidLT]);

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
                          <span className={`font-semibold ${monthlyBal.available > 0 ? (splitPlan ? "text-amber-600" : "text-emerald-700") : "text-red-600"}`}>
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
                  className={`${getInputClass(true, "total_days")} ${splitPlan ? "!border-amber-400 !bg-amber-50/40" : ""}`}
                  placeholder="Auto-calculated"
                  onKeyDown={handleKeyDown}
                />
                {splitPlan && (
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold mt-1">
                    <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                    <span className="text-amber-900">Auto-split active:</span>
                    {splitPlan.paidDaysCount > 0 && <span className="text-emerald-700">{splitPlan.paidDaysCount} Paid</span>}
                    {splitPlan.rhDaysCount > 0 && <span className="text-purple-700">{splitPlan.paidDaysCount > 0 ? "+" : ""} {splitPlan.rhDaysCount} RH</span>}
                    {splitPlan.unpaidDaysCount > 0 && <span className="text-orange-700">+ {splitPlan.unpaidDaysCount} Unpaid</span>}
                    <span className="text-gray-500 font-normal">({splitPlan.segments.length} requests will be created)</span>
                  </div>
                )}
              </div>
            </div>

            {/* ── Auto-Split Highlighted Tooltip / Banner Card ── */}
            {splitPlan && (
              <div className="mx-1 bg-gradient-to-r from-amber-50 via-amber-50/70 to-orange-50 border border-amber-300 rounded-lg p-3 shadow-xs">
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 text-xs">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <span className="font-bold text-amber-950 text-[13px] flex items-center gap-1.5">
                        Auto-Split Multi-Leave Notice
                        <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 bg-amber-200 text-amber-800 rounded font-bold">
                          {splitPlan.leaveRequestsCount} {splitPlan.leaveRequestsCount === 1 ? "Request" : "Requests"}
                        </span>
                      </span>
                      <span className="text-gray-600 font-medium text-[11px]">
                        Range: <strong className="text-gray-900">{splitPlan.totalSelectedDays} Days</strong> {splitPlan.companyHolidayDaysCount > 0 && <span className="text-sky-700 font-semibold">({splitPlan.companyHolidayDaysCount} Paid Holiday excluded)</span>}
                      </span>
                    </div>

                    <p className="text-amber-900 mt-1 leading-relaxed">
                      {splitPlan.companyHolidayDaysCount > 0 && (
                        <span className="text-sky-900 font-medium">Company holiday(s) in this range are recognized as <strong>Paid Holidays</strong> and will not be deducted from your leave balance. </span>
                      )}
                      {splitPlan.unpaidDaysCount > 0 && (
                        <span>Only <strong className="text-amber-950 font-bold">{splitPlan.paidDaysCount} day(s)</strong> available for <span className="underline font-semibold decoration-amber-400">{splitPlan.leaveName}</span> till {splitPlan.monthName}. </span>
                      )}
                      Saving will create <strong className="text-amber-950 font-bold">{splitPlan.leaveRequestsCount} separate leave request{splitPlan.leaveRequestsCount !== 1 ? "s" : ""}</strong> with exact dates:
                    </p>

                    {/* Breakdown Chips for each segment */}
                    <div className="mt-2.5 flex flex-col gap-1.5 pt-2 border-t border-amber-200/90">
                      {splitPlan.segments.map((seg, idx) => (
                        <div
                          key={idx}
                          className={`flex items-center justify-between flex-wrap gap-1 px-2.5 py-1.5 rounded-md border text-[11px] font-medium shadow-xs ${seg.type === "COMPANY_HOLIDAY"
                              ? "bg-sky-50 border-sky-300 text-sky-950"
                              : seg.type === "PAID"
                                ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                                : seg.type === "RH"
                                  ? "bg-purple-50 border-purple-300 text-purple-900"
                                  : "bg-orange-50 border-orange-300 text-orange-900"
                            }`}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2 h-2 rounded-full ${seg.type === "COMPANY_HOLIDAY"
                                  ? "bg-sky-500"
                                  : seg.type === "PAID"
                                    ? "bg-emerald-500"
                                    : seg.type === "RH"
                                      ? "bg-purple-500"
                                      : "bg-orange-500"
                                }`}
                            ></span>
                            <span className="font-bold">
                              {seg.type === "COMPANY_HOLIDAY"
                                ? "Company Holiday (Paid)"
                                : seg.type === "PAID"
                                  ? `Paid (${seg.leaveName})`
                                  : seg.type === "RH"
                                    ? `Restricted Holiday (RH)`
                                    : `Unpaid Leave (Loss of Pay)`}
                              :
                            </span>
                            <span>{seg.totalDays} day(s)</span>
                            {seg.holidayInfo && (
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${seg.type === "COMPANY_HOLIDAY"
                                    ? "text-sky-800 bg-sky-100/90 border border-sky-200"
                                    : "text-purple-700 bg-purple-100/80 border border-purple-200"
                                  }`}
                              >
                                {seg.holidayInfo.purpose} {seg.type === "COMPANY_HOLIDAY" ? "· Paid Off" : ""}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] font-semibold text-gray-700">
                            {formatDisplayDate(seg.fromDate)} {seg.fromDate !== seg.toDate ? `to ${formatDisplayDate(seg.toDate)}` : ""}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

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