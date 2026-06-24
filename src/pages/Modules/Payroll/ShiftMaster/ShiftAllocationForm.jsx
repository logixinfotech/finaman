 
import React, { useState, useCallback, useEffect } from "react";
import ERPHeader from "../../../../components/Reusable/form/HeaderForm";
import ERPFooter from "../../../../components/Reusable/form/FooterForm";
import ERPAutocomplete from "../../../../components/Reusable/input/ERPAutocomplete";
import { getActledList, fetchShifts } from "../../../../utils/api";
import Date from "../../../../components/Reusable/input/Date";

const ShiftAllocationForm = ({
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
  rights,
  activeTab = "entry",
  onTabChange,
  initialData = {},
  localData,
  setLocalData,
    onPrevRecord,   // 👈
  onNextRecord,   // 👈
}) => {
  // const [localData, setLocalData] = useState(initialData);
  const [errors, setErrors] = useState({});
  const [employees, setEmployees] = useState([]);
  const [employeeNames, setEmployeeNames] = useState([]);
  const [shifts, setShifts] = useState([]);

  const isViewMode = mode === "view";
  const isEditMode = mode === "edit";
  const isAddMode = mode === "add";
  const FONT = `'Inter', 'Tahoma', system-ui, sans-serif`;
  const requiredFields = ["employee_id", "shift_id", "allocation_from", "allocation_to"];

  // Auto-Focus on First Field in Add/Edit Mode
  useEffect(() => {
    if (isAddMode || isEditMode) {
      setTimeout(() => {
        const container = document.getElementById("allocation-form-container");
        if (container) {
          const firstInput = container.querySelector("input:not([disabled])");
          if (firstInput) {
            firstInput.focus();
          }
        }
      }, 100); 
    }
  }, [isAddMode, isEditMode, activeTab]);

  // Load Dropdowns
  useEffect(() => {
    const loadDropdowns = async () => {
      try {
        const empData = await getActledList();
        const shiftData = await fetchShifts();

        const empList = Array.isArray(empData) ? empData : empData?.data || [];
        setEmployees(empList);
        setEmployeeNames(empList.map((emp) => emp.Led_name?.trim()));
        
        setShifts(Array.isArray(shiftData) ? shiftData : shiftData?.data || []);
      } catch (err) {
        console.error("Failed to fetch dropdown data:", err);
      }
    };
    loadDropdowns();
  }, []); 
useEffect(() => {
    if (!initialData?.allocation_id && !initialData?.employee_id) return; // empty object skip
    
    const empName = initialData.employee_name || 
      employees.find(e => Number(e.Actled_id) === Number(initialData.employee_id))?.Led_name || "";
    
    const shiftName = initialData.shift_name || 
      shifts.find(s => s.shift_id === initialData.shift_id)?.shift_name || "";

    setLocalData({
      ...initialData,
      employee_name: empName,
      shift_name: shiftName,
      allocation_from: initialData.allocation_from ? initialData.allocation_from.split('T')[0] : "",
      allocation_to: initialData.allocation_to ? initialData.allocation_to.split('T')[0] : "",
    });
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [initialData?.allocation_id, initialData?.employee_id, employees.length, shifts.length]);

  const handleChange = (field, value) => {
    let updatedData = { ...localData };

    if (field === "employee_name") {
      const selectedEmp = employees.find(
        (emp) => emp.Led_name?.trim() === value?.trim()
      );
      updatedData.employee_name = value;
      updatedData.employee_id = selectedEmp ? selectedEmp.Actled_id : null; 
      
    } else if (field === "shift_name") {
      const selectedShift = shifts.find(
        (sh) => sh.shift_name?.trim() === value?.trim()
      );
      updatedData.shift_name = value;
      updatedData.shift_id = selectedShift ? selectedShift.shift_id : null; 
      
    } else {
      updatedData[field] = value;
    }
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
    if (field === "employee_name" && errors.employee_id) {
      setErrors(prev => ({ ...prev, employee_id: null }));
    }
    if (field === "shift_name" && errors.shift_id) {
      setErrors(prev => ({ ...prev, shift_id: null }));
    }
    
    setLocalData(updatedData);
  };

  const getInputClass = (isDisabled, fieldName) =>
    `w-full h-[30px] px-2 text-[16px] border rounded-md outline-none transition-colors ${
      errors[fieldName] || (fieldName === "employee_id" && errors.employee_id) || (fieldName === "shift_id" && errors.shift_id) ? "border-red-500" : "border-gray-300"
    } ${
      isDisabled ? "bg-[#eef1f6] text-gray-500 cursor-not-allowed" : "bg-white text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
    }`;
  const [fromDate, setFromDate] = useState("");   // db format e.g. "2026-04-01"
const [toDate, setToDate] = useState("");

  const handleValidateAndSave = useCallback(() => {
    if (isViewMode) return;
    let newErrors = {};

    for (const field of requiredFields) {
      let val = localData[field];
      if (val === null || val === undefined || val.toString().trim() === "") {
        newErrors[field] = "Required";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      
      // FIX: Focus on the very first field that has an error
      const firstErrorField = requiredFields.find(field => newErrors[field]);
      if (firstErrorField) {
        setTimeout(() => {
          const wrapper = document.getElementById(`wrapper_${firstErrorField}`);
          if (wrapper) {
            const input = wrapper.querySelector("input:not([disabled]), select:not([disabled]), textarea:not([disabled])");
            if (input) input.focus();
          }
        }, 0);
      }
      return;
    }
    if (onSave) onSave(localData);
  }, [localData, onSave, isViewMode, requiredFields]);

  const handleKeyDown = useCallback((e) => {
    if (isViewMode) return;
    const container = document.getElementById("allocation-form-container");
    if (!container) return;

    const focusableElements = Array.from(
      container.querySelectorAll("input:not([disabled]), select:not([disabled]), textarea:not([disabled])")
    );
    const index = focusableElements.indexOf(e.target);

    // Focus Save Button instead of auto-saving
    if (e.key === "Enter") {
      if (e.target.tagName.toLowerCase() === "textarea") {
        if (!e.shiftKey) { 
          e.preventDefault();
          const buttons = document.querySelectorAll("button");
          const saveBtn = Array.from(buttons).find(b => b.textContent.trim().toLowerCase().includes("save"));
          if (saveBtn) saveBtn.focus();
        }
        return;
      }

      e.preventDefault();
      if (index > -1) {
        if (index < focusableElements.length - 1) {
          focusableElements[index + 1].focus();
        } else {
          const buttons = document.querySelectorAll("button");
          const saveBtn = Array.from(buttons).find(b => b.textContent.trim().toLowerCase().includes("save"));
          if (saveBtn) saveBtn.focus();
        }
      }
    }

    // Backspace Issue
    if (e.key === "Backspace") {
      const target = e.target;
      if (target.value === "" && index > 0) {
        e.preventDefault();
        focusableElements[index - 1].focus();
      }
    }
  }, [isViewMode]);

  return (
    <div className="w-full max-w-[700px] mx-auto h-[calc(100vh-140px)] bg-[#eef1f6] flex flex-col overflow-hidden font-sans" style={{ fontFamily: FONT }}>
      <ERPHeader
        title="SHIFT ALLOCATION ENTRY"
        isAddMode={isAddMode}
        isEditMode={isEditMode}
        isViewMode={isViewMode}
        activeTab={activeTab}
        onTabChange={onTabChange}
        rightContent={`${currentRecord || 1} / ${totalRecords || 1}`}
          currentIndex={currentRecord}      // 👈
  totalRecords={totalRecords}        // 👈
  onPrevRecord={onPrevRecord}        // 👈
  onNextRecord={onNextRecord}        // 👈
      />

      <div className="flex-1 p-2 sm:p-4 overflow-y-auto flex justify-center">
        <div id="allocation-form-container" className="w-full max-w-[800px] h-fit bg-white border border-slate-200 shadow-sm rounded-md overflow-visible">
          <div className="p-3 grid grid-cols-1 gap-y-3"> 
            <div className="flex flex-col sm:flex-row sm:gap-4 w-full">
              
              {/* Employee Selection */}
              <div className="flex flex-col sm:flex-row items-start px-1 flex-1">
                <label className="text-black-800 text-[15px] w-[130px] pt-1 shrink-0">Employee <span className="text-red-500">*</span></label>
                <div className="flex-1 w-full relative" id="wrapper_employee_id">
                  <ERPAutocomplete
                    options={employeeNames}
                    value={localData.employee_name || ""}
                    onChange={(val) => handleChange("employee_name", val)}
                    onKeyDown={handleKeyDown}
                    className={getInputClass(isViewMode, "employee_id")}
                    disabled={isViewMode}
                  /> 
                  {errors.employee_id && <span className="text-[10px] text-red-500 ml-1 absolute -bottom-4 left-0">Required</span>}
                </div>
              </div>

              {/* Shift Selection */}
              <div className="flex flex-col sm:flex-row items-start px-1 flex-1 mt-3 sm:mt-0">
                <label className="text-black-800 text-[15px] sm:w-[100px] pt-1 shrink-0">Assign Shift <span className="text-red-500">*</span></label>
                <div className="flex-1 w-full relative" id="wrapper_shift_id">
                  <ERPAutocomplete
                    options={shifts.map(sh => sh.shift_name?.trim())}
                    value={localData.shift_name || ""}
                    disabled={isViewMode}
                    onChange={(val) => handleChange("shift_name", val)}
                    onKeyDown={handleKeyDown}
                    className={getInputClass(isViewMode, "shift_id")}
                  />  
                  {errors.shift_id && <span className="text-[10px] text-red-500 ml-1 absolute -bottom-4 left-0">Required</span>}
                </div>
              </div>
            </div>

            {/* Row 2: Dates */}
           <div className="flex flex-col sm:flex-row sm:gap-4 w-full ">
              {/* From Date */}
              <div className="flex flex-col sm:flex-row items-start px-1 flex-1">
                <label className="text-black-800 text-[15px] w-[130px] pt-1 shrink-0">From Date <span className="text-red-500">*</span></label>
                <div className="flex-1 w-full relative" id="wrapper_allocation_from">
                  <Date
                    name="allocation_from"
                    value={localData.allocation_from || ""}
                    disabled={isViewMode}
                    onChange={(val) => handleChange("allocation_from", val)}
                    onKeyDown={handleKeyDown}
                    className={getInputClass(isViewMode, "allocation_from")}
                  />
                  {errors.allocation_from && <span className="text-[10px] text-red-500 ml-1 absolute -bottom-4 left-0">Required</span>}
                </div>
              </div>

              {/* To Date */}
              <div className="flex flex-col sm:flex-row items-start px-1 flex-1 sm:mt-0">
                <label className="text-black-800 text-[15px] sm:w-[100px] pt-1 shrink-0">To Date <span className="text-red-500">*</span></label>
                <div className="flex-1 w-full relative" id="wrapper_allocation_to">
                  <Date
                    name="allocation_to"
                    value={localData.allocation_to || ""}
                    disabled={isViewMode}
                    minDate={localData.allocation_from} 
                    minDateLabel="From date"
                    onChange={(val) => handleChange("allocation_to", val)}
                    onKeyDown={handleKeyDown}
                    className={getInputClass(isViewMode, "allocation_to")}
                  />
                  {errors.allocation_to && <span className="text-[10px] text-red-500 ml-1 absolute -bottom-4 left-0">Required</span>}
                </div>
              </div>
            </div>

            {/* Row 3: Remarks */}
            <div className="flex flex-col sm:flex-row items-start px-1">
              <label className="text-black-800 text-[15px] w-[130px] shrink-0 mt-1">Remarks</label>
              <div className="flex-1 w-full" id="wrapper_remarks">
                <textarea
                  name="remarks"
                  value={localData.remarks || ""}
                  disabled={isViewMode}
                  onChange={(e) => handleChange("remarks", e.target.value)}
                  onKeyDown={handleKeyDown}
                  className={`${getInputClass(isViewMode, "remarks")} h-[40px] py-2`}
                  placeholder="Enter remarks"
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

export default ShiftAllocationForm;