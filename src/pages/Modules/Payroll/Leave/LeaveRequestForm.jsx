import React, { useState, useCallback, useEffect, useRef } from "react";
import ERPHeader from "../../../../components/Reusable/form/HeaderForm";
import ERPFooter from "../../../../components/Reusable/form/FooterForm";
import ERPAutocomplete from "../../../../components/Reusable/input/ERPAutocomplete";
import { getActledList, getLeaveTypes, getLeaveTypesByEmployee } from "../../../../utils/api";
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

  // ── Fetch employees ─────────────────────────────────────
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const data = await getActledList();
        setEmployees(data || []);
        setEmployeeNames((data || []).map((e) => (e.full_name || e.Led_name)?.trim()));
      } catch (err) {
        console.error("Employee fetch error:", err);
      }
    };
    fetchEmployees();
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

    // Agar employee already selected hai to uske leave types load karo
    if (initialData.employee_id) {
      getLeaveTypesByEmployee(initialData.employee_id)
        .then(res => {
          const empLTs = res?.data || [];
          if (empLTs.length > 0) {
            setLeaveTypes(empLTs);
            setLeaveTypeNames(empLTs.map(lt => lt.leave_name));
          }
        })
        .catch(() => { });
    }
  }, [initialData]);

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
  const handleChange = async (field, value) => {
    let updated = { ...localData };

    if (field === "employee_name") {
      const emp = employees.find((e) =>
        (e.full_name || e.Led_name)?.trim() === value?.trim()
      );
      updated.employee_name = value;
      updated.employee_id = emp ? Number(emp.Actled_id) : "";
      // Leave type bhi clear karo jab employee change ho
      updated.leave_name = "";
      updated.leave_type_id = "";

      // Is employee ke accrued leave types fetch karo
      if (emp) {
        try {
          const res = await getLeaveTypesByEmployee(emp.Actled_id);
          const empLTs = res?.data || [];
          if (empLTs.length > 0) {
            setLeaveTypes(empLTs);
            setLeaveTypeNames(empLTs.map(lt => lt.leave_name));
          } else {
            // Agar accrual nahi hai to sab types dikhao
            setLeaveTypes(allLeaveTypes);
            setLeaveTypeNames(allLeaveTypes.map(lt => lt.leave_name));
          }
        } catch (e) {
          // Error pe bhi sab types dikhao
          setLeaveTypes(allLeaveTypes);
          setLeaveTypeNames(allLeaveTypes.map(lt => lt.leave_name));
        }
      } else {
        // Employee clear kiya — sab types restore karo
        setLeaveTypes(allLeaveTypes);
        setLeaveTypeNames(allLeaveTypes.map(lt => lt.leave_name));
      }
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

  // ── Status badge ─────────────────────────────────────────


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

    if (onSave) onSave(localData);
  }, [localData, onSave, isViewMode]);



  return (
    <div
      className="w-full h-[calc(100vh-100px)] bg-[#eef1f6] flex flex-col overflow-hidden font-sans"
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

      <div className="flex-1 p-4 overflow-y-auto">
        <div ref={formRef} className="w-full bg-white border max-w-[750px] mx-auto border-slate-200 shadow-sm rounded-md overflow-visible relative">
          <div className="p-5 grid grid-cols-1 gap-y-5">


            {/* ── Employee ── */}
            <div className="flex flex-col sm:flex-row sm:gap-6 w-full">
              <div className="flex flex-col sm:flex-row items-start sm:items-start px-1 flex-1">
                <label className="text-[15px] w-[100px] pt-1 shrink-0">
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
                  {/* {localData.employee_id && (
                  <div className="text-[12px] text-blue-600 mt-1 ml-1">
                    EMP ID: {localData.employee_id}
                  </div>
                )} */}

                </div>
              </div>

              {/* ── Leave Type ── */}
              <div className="flex flex-col sm:flex-row items-start sm:items-start px-1 flex-1 mt-3 sm:mt-0">
                <label className="text-[15px] w-[100px] pt-1 shrink-0">
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

                </div>
              </div>
            </div>

            {/* ── Dates ── */}
            <div className="flex flex-col sm:flex-row sm:gap-6 w-full">
              <div className="flex flex-col sm:flex-row items-start px-1 flex-1">
                <label className="text-[15px] w-[100px] shrink-0">
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

              <div className="flex flex-col sm:flex-row items-start sm:items-start px-1 flex-1 mt-3 sm:mt-0">
                <label className="text-[15px] w-[100px] shrink-0">
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
            <div className="flex flex-col sm:flex-row items-start px-1">
              <label className="text-[15px] w-[100px] shrink-0">Total Days</label>
              <div className="flex-1 w-full">
                <input
                  type="number"
                  value={localData.total_days || ""}
                  disabled
                  className={getInputClass(true, "total_days")}
                  placeholder="Auto-calculated"
                  onKeyDown={handleKeyDown}
                />
              </div>
            </div>

            {/* ── Reason ── */}
            <div className="flex flex-col sm:flex-row items-start px-1">
              <label className="text-[15px] w-[100px] pt-1 shrink-0">Reason</label>
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