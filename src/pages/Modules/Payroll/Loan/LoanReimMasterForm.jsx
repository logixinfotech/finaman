import React, { useState, useCallback, useEffect, useRef } from "react";
import ERPHeader from "../../../../components/Reusable/form/HeaderForm";
import ERPFooter from "../../../../components/Reusable/form/FooterForm";
import ERPAutocomplete from "../../../../components/Reusable/input/ERPAutocomplete";
import ERPDateInput from "../../../../components/Reusable/input/Date";
import { getActledList } from "../../../../utils/api";
import {
  focusFirstInput,
  handleERPEnterNavigation,
  focusFirstError,
  handleERPBackspaceNavigation,
} from "../../../../utils/erpShortcuts";

const masterTypes = ["Loan", "Reimbursement", "Advance", "Coupon"];
const requiredFields = ["employee_id", "master_type", "request_name", "amount"];
const FONT = "'Inter', 'Tahoma', system-ui, sans-serif";

const fieldIndexMap = {
  employee_id:   0,
  master_type:   1,
  request_name:  2,
  amount:        3,
};

const LoanReimMasterForm = ({
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
  const [localData, setLocalData] = useState(initialData);
  const [errors, setErrors]       = useState({});
  const formRef                   = useRef(null);
   const saveBtnRef = useRef(null);
  const [employees, setEmployees]         = useState([]);
  const [employeeNames, setEmployeeNames] = useState([]);

  const isViewMode = mode === "view";
  const isEditMode = mode === "edit";
  const isAddMode  = mode === "add";

  // ── Auto focus first field ───────────────────────────────────────────────
  useEffect(() => {
    if (isAddMode || isEditMode) {
      focusFirstInput(formRef);
    }
  }, [isAddMode, isEditMode]);

  // ── Employee fetch ───────────────────────────────────────────────────────
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const data = await getActledList();
        setEmployees(data);
        setEmployeeNames(data.map(emp => emp.Led_name.trim()));
      } catch (err) {
        console.error(err);
      }
    };
    fetchEmployees();
  }, []);

  // ── Initial data (unchanged) ─────────────────────────────────────────────
  useEffect(() => {
    if (!initialData || Object.keys(initialData).length === 0) return;

    const employee =
      initialData.employee_name ||
      employees.find(emp => Number(emp.Actled_id) === Number(initialData.employee_id))?.Led_name ||
      "";

    const formattedData = {
      ...initialData,
      employee_name:  employee,
      effective_from: initialData.effective_from ? initialData.effective_from.split("T")[0] : "",
      effective_to:   initialData.effective_to   ? initialData.effective_to.split("T")[0]   : "",
    };

    if (JSON.stringify(localData) !== JSON.stringify(formattedData)) {
      setLocalData(formattedData);
      setFormData(formattedData);
    }
  }, [initialData, employees]);

  // ── Handle change (unchanged) ────────────────────────────────────────────
  const handleChange = (field, value) => {
    let updatedData = { ...localData };

    if (field === "employee_name") {
      const selectedEmp = employees.find(emp => emp.Led_name?.trim() === value?.trim());
      updatedData.employee_name = value;
      updatedData.employee_id   = selectedEmp ? Number(selectedEmp.Actled_id) : "";
    } else {
      updatedData[field] = value;
    }

    setLocalData(updatedData);
    setFormData(updatedData);

    setErrors(prev => {
      const newErrors = { ...prev };
      if (field === "employee_name") delete newErrors.employee_id;
      else delete newErrors[field];
      return newErrors;
    });
  };

  // ── Input class (unchanged) ──────────────────────────────────────────────
  const getInputClass = (isDisabled, fieldName) =>
    `w-full h-[32px] px-2 text-[15px] border rounded-md outline-none transition-colors ${
      errors[fieldName] ? "border-red-500" : "border-gray-300"
    } ${
      isDisabled
        ? "bg-[#eef1f6] text-gray-500 cursor-not-allowed"
        : "bg-white text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
    }`;

  // ── Validate + Save ──────────────────────────────────────────────────────
  const handleValidateAndSave = useCallback(() => {
    if (isViewMode) return;
    const newErrors = {};

    requiredFields.forEach(field => {
      if (!localData[field] || localData[field].toString().trim() === "") {
        newErrors[field] = "Required";
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // ✅ Error wali exact field pe focus
      focusFirstError(formRef, newErrors, requiredFields, fieldIndexMap);
      return;
    }

    if (onSave) onSave(localData);
  }, [localData, onSave, isViewMode]);

  // ── KeyDown: Enter + Shift+Backspace ────────────────────────────────────
  const handleKeyDown = useCallback((e) => {
    handleERPEnterNavigation(e, formRef, isViewMode, saveBtnRef);
    handleERPBackspaceNavigation(e, formRef, isViewMode);
  }, [isViewMode]);

  return (
    <div
      className="w-full max-w-[700px] mx-auto h-[calc(100vh-140px)] bg-[#eef1f6] flex flex-col overflow-hidden font-sans"
      style={{ fontFamily: FONT }}
    >
      <ERPHeader
        title="LOAN / REIMBURSEMENT"
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

      <div className="flex-1 p-4 overflow-y-auto flex justify-center">
        <div
          ref={formRef}
          className="w-full bg-white border border-slate-200 shadow-sm rounded-md overflow-visible relative"
        >
          <div className="p-5 grid grid-cols-1 gap-y-5">

            {/* Row 1: Employee + Master Type */}
            <div className="flex flex-col sm:flex-row sm:gap-6 w-full">
              <div className="flex flex-col sm:flex-row items-start px-1 flex-1">
                <label className="text-black text-[15px] w-[120px] pt-1 shrink-0">
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

              <div className="flex flex-col sm:flex-row items-start px-1 flex-1 mt-3 sm:mt-0">
                <label className="text-black text-[15px] w-[120px] pt-1 shrink-0">
                  Master Type <span className="text-red-500">*</span>
                </label>
                <div className="flex-1 w-full">
                  <ERPAutocomplete
                    options={masterTypes}
                    value={localData.master_type || ""}
                    onChange={(val) => handleChange("master_type", val)}
                    className={getInputClass(isViewMode, "master_type")}
                    disabled={isViewMode}
                    onKeyDown={handleKeyDown}
                  />
                
                </div>
              </div>
            </div>

            {/* Row 2: Request Name + Amount */}
            <div className="flex flex-col sm:flex-row sm:gap-6 w-full">
              <div className="flex flex-col sm:flex-row items-start px-1 flex-1">
                <label className="text-black text-[15px] w-[120px] pt-1 shrink-0">
                  Request Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="request_name"
                  value={localData.request_name || ""}
                  disabled={isViewMode}
                  onChange={(e) => handleChange("request_name", e.target.value)}
                  onKeyDown={handleKeyDown}
                  className={getInputClass(isViewMode, "request_name")}
                />
              
              </div>

              <div className="flex flex-col sm:flex-row items-start px-1 flex-1 mt-3 sm:mt-0">
                <label className="text-black text-[15px] w-[120px] pt-1 shrink-0">
                  Amount <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="amount"
                  value={localData.amount || ""}
                  disabled={isViewMode}
                  onChange={(e) => handleChange("amount", e.target.value)}
                  onKeyDown={handleKeyDown}
                  className={getInputClass(isViewMode, "amount")}
                />
                
              </div>
            </div>

            {/* Row 3: Effective From + To */}
            <div className="flex flex-col sm:flex-row sm:gap-6 w-full">
              <div className="flex flex-col sm:flex-row items-start px-1 flex-1">
                <label className="text-black text-[15px] w-[120px] pt-1 shrink-0">Effective From</label>
                <ERPDateInput
                  value={localData.effective_from || ""}
                  disabled={isViewMode}
                  onChange={(val) => handleChange("effective_from", val)}
                  className={getInputClass(isViewMode, "effective_from")}
                  onKeyDown={handleKeyDown}
                />
              </div>
              <div className="flex flex-col sm:flex-row items-start px-1 flex-1 mt-3 sm:mt-0">
                <label className="text-black text-[15px] w-[120px] pt-1 shrink-0">Effective To</label>
                <ERPDateInput
                  value={localData.effective_to || ""}
                  disabled={isViewMode}
                  onChange={(val) => handleChange("effective_to", val)}
                  className={getInputClass(isViewMode, "effective_to")}
                  onKeyDown={handleKeyDown}
                />
              </div>
            </div>

            {/* Remarks */}
            <div className="flex flex-col sm:flex-row items-start px-1">
              <label className="text-[15px] w-[120px] pt-1 shrink-0">Remarks</label>
              <div className="flex-1 w-full">
                <textarea
                  rows={4}
                  value={localData.remarks || ""}
                  disabled={isViewMode}
                  onChange={(e) => handleChange("remarks", e.target.value)}
                  onKeyDown={handleKeyDown}
                  className={`${getInputClass(isViewMode, "remarks")} h-[40px] py-2`}
                  placeholder="Enter remarks..."
                />
              </div>
            </div>

          </div>
        </div>
      </div>

      <ERPFooter
        isAddMode={isAddMode}
        isEditMode={isEditMode}
        saveBtnRef={saveBtnRef}
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

export default LoanReimMasterForm;