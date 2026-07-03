import React, { useState, useCallback, useEffect, useRef } from "react";

import ERPHeader from "../../../../components/Reusable/form/HeaderForm";

import ERPFooter from "../../../../components/Reusable/form/FooterForm";

import ERPAutocomplete from "../../../../components/Reusable/input/ERPAutocomplete";

import ERPDateInput from "../../../../components/Reusable/input/Date";

import {
  focusFirstInput,
  handleERPEnterNavigation,
  focusFirstError,
  handleERPBackspaceNavigation,
} from "../../../../utils/erpShortcuts";

import { getActledList } from "../../../../utils/api";

const assetTypes = ["Recovery", "Buyback"];

const AssetMasterForm = ({
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

  const [errors, setErrors] = useState({});

  const formRef = useRef(null);

  const [employees, setEmployees] = useState([]);

  const [employeeNames, setEmployeeNames] = useState([]);

  const FONT = "'Inter', 'Tahoma', system-ui, sans-serif";

  const isViewMode = mode === "view";

  const isEditMode = mode === "edit";

  const isAddMode = mode === "add";

  const requiredFields = [
    "employee_id",
    "asset_type",
    "asset_name",
    "recovery_value",
  ];

  const fieldIndexMap = {
    employee_id: 0,
    asset_type: 1,
    asset_name: 2,
    recovery_value: 3,
  };

  //
  // Focus
  //
  const saveBtnRef=useRef(null)
  useEffect(() => {
    if (isAddMode || isEditMode) {
      focusFirstInput(formRef);
    }
  }, [isAddMode, isEditMode]);

  //
  // Employee Fetch
  //
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const data = await getActledList();

        setEmployees(data);

        setEmployeeNames(data.map((emp) => emp.Led_name.trim()));
      } catch (err) {
        console.error(err);
      }
    };

    fetchEmployees();
  }, []);

  //
  // Initial Data
  //
  useEffect(() => {
    if (!initialData || Object.keys(initialData).length === 0) return;

    const employee =
      initialData.employee_name ||
      employees.find(
        (emp) => Number(emp.Actled_id) === Number(initialData.employee_id),
      )?.Led_name ||
      "";

    const formattedData = {
      ...initialData,

      employee_name: employee,

      effective_from: initialData.effective_from
        ? initialData.effective_from.split("T")[0]
        : "",

      effective_to: initialData.effective_to
        ? initialData.effective_to.split("T")[0]
        : "",
    };

    if (JSON.stringify(localData) !== JSON.stringify(formattedData)) {
      setLocalData(formattedData);

      setFormData(formattedData);
    }
  }, [initialData, employees]);

  //
  // Key Navigation
  //
  const handleKeyDown = useCallback(
    (e) => {
      handleERPEnterNavigation(e, formRef, isViewMode,saveBtnRef);
      handleERPBackspaceNavigation(e, formRef, isViewMode);
    },
    [isViewMode],
  );

  //
  // Handle Change
  //
  const handleChange = (field, value) => {
    let updatedData = {
      ...localData,
    };

    if (field === "employee_name") {
      const selectedEmp = employees.find(
        (emp) => emp.Led_name?.trim() === value?.trim(),
      );

      updatedData.employee_name = value;

      updatedData.employee_id = selectedEmp
        ? Number(selectedEmp.Actled_id)
        : "";
    } else {
      updatedData[field] = value;
    }

    setLocalData(updatedData);

    setFormData(updatedData);

    setErrors((prev) => {
      const newErrors = { ...prev };

      if (field === "employee_name") {
        delete newErrors.employee_id;
      } else {
        delete newErrors[field];
      }

      return newErrors;
    });
  };

  //
  // Input Class
  //
  const getInputClass = (isDisabled, fieldName) =>
    `w-full h-[32px] px-2 text-[15px] border rounded-md outline-none transition-colors ${
      errors[fieldName] ? "border-red-500" : "border-gray-300"
    } ${
      isDisabled
        ? "bg-[#eef1f6] text-gray-500 cursor-not-allowed"
        : "bg-white text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
    }`;

  //
  // Save
  //
  const handleValidateAndSave = useCallback(() => {
    if (isViewMode) return;

    let newErrors = {};

    requiredFields.forEach((field) => {
      if (!localData[field] || localData[field].toString().trim() === "") {
        newErrors[field] = "Required";
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      focusFirstError(formRef, newErrors, requiredFields, fieldIndexMap);

      return;
    }

    if (onSave) {
      onSave(localData);
    }
  }, [localData, onSave, isViewMode]);

  return (
    <div
      className="w-full max-w-[700px] mx-auto h-[calc(100vh-140px)] bg-[#eef1f6] flex flex-col overflow-hidden font-sans"
      style={{ fontFamily: FONT }}
    >
      <ERPHeader
        title="ASSET MASTER ENTRY"
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
            {/* Row 1 */}
            <div className="flex flex-col sm:flex-row sm:gap-6 w-full">
              {/* Employee */}
              <div className="flex flex-col sm:flex-row items-start px-1 flex-1">
                <label className="text-black text-[15px] w-[120px] pt-1 shrink-0">
                  Employee
                  <span className="text-red-500">*</span>
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

              {/* Asset Type */}
              <div className="flex flex-col sm:flex-row items-start px-1 flex-1 mt-3 sm:mt-0">
                <label className="text-black text-[15px] w-[120px] pt-1 shrink-0">
                  Asset Type
                  <span className="text-red-500">*</span>
                </label>

                <div className="flex-1 w-full">
                  <ERPAutocomplete
                    options={assetTypes}
                    value={localData.asset_type || ""}
                    onChange={(val) => handleChange("asset_type", val)}
                    className={getInputClass(isViewMode, "asset_type")}
                    disabled={isViewMode}
                    onKeyDown={handleKeyDown}
                  />
                </div>
              </div>
            </div>

            {/* Row 2 */}
            <div className="flex flex-col sm:flex-row sm:gap-6 w-full">
              {/* Asset Name */}
              <div className="flex flex-col sm:flex-row items-start px-1 flex-1">
                <label className="text-black text-[15px] w-[120px] pt-1 shrink-0">
                  Asset Name
                  <span className="text-red-500">*</span>
                </label>

                <input
                  type="text"
                  value={localData.asset_name || ""}
                  disabled={isViewMode}
                  onChange={(e) => handleChange("asset_name", e.target.value)}
                  onKeyDown={handleKeyDown}
                  className={getInputClass(isViewMode, "asset_name")}
                />
              </div>

              {/* Recovery Value */}
              <div className="flex flex-col sm:flex-row items-start px-1 flex-1 mt-3 sm:mt-0">
                <label className="text-black text-[15px] w-[120px] pt-1 shrink-0">
                  Recovery Value
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={localData.recovery_value || ""}
                  disabled={isViewMode}
                  onChange={(e) =>
                    handleChange("recovery_value", e.target.value)
                  }
                  onKeyDown={handleKeyDown}
                  className={getInputClass(isViewMode, "recovery_value")}
                />
              </div>
            </div>

            {/* Row 3 */}
            <div className="flex flex-col sm:flex-row sm:gap-6 w-full">
              <div className="flex flex-col sm:flex-row items-start px-1 flex-1">
                <label className="text-black text-[15px] w-[120px] pt-1 shrink-0">
                  Effective From
                </label>
                <ERPDateInput
                  value={localData.effective_from || ""}
                  disabled={isViewMode}
                  onChange={(val) => handleChange("effective_from", val)}
                  className={getInputClass(isViewMode, "effective_from")}
                  onKeyDown={handleKeyDown}
                />
              </div>
              <div className="flex flex-col sm:flex-row items-start px-1 flex-1 mt-3 sm:mt-0">
                <label className="text-black text-[15px] w-[120px] pt-1 shrink-0">
                  Effective To
                </label>
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
              <label className="text-[15px] w-[120px] pt-1 shrink-0">
                Remarks
              </label>

              <div className="flex-1 w-full">
                <textarea
                  rows={3}
                  value={localData.remarks || ""}
                  disabled={isViewMode}
                  onChange={(e) => handleChange("remarks", e.target.value)}
                  className={`${getInputClass(
                    isViewMode,
                    "remarks",
                  )} h-[40px] py-2`}
                  placeholder="Enter remarks..."
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
        saving={saving}
        saveBtnRef={saveBtnRef}
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

export default AssetMasterForm;
