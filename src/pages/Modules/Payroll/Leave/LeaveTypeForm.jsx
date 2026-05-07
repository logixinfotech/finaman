import React, { useState, useEffect, useCallback } from "react";
import ERPHeader from "../../../../components/Reusable/form/HeaderForm";
import ERPFooter from "../../../../components/Reusable/form/FooterForm";

const LeaveTypeForm = ({
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
  initialData = {}
}) => {
  const [localData, setLocalData] = useState(initialData);
  const [errors, setErrors] = useState({});

  const isViewMode = mode === "view";
  const isEditMode = mode === "edit";
  const isAddMode = mode === "add";
  const FONT = `'Inter', 'Tahoma', system-ui, sans-serif`;

  const requiredFields = ["leave_code", "leave_name", "max_days"];

  useEffect(() => {
    setLocalData(initialData);
  }, [initialData]);

  const handleChange = (field, value) => {
    const updatedData = { ...localData, [field]: value };
    setLocalData(updatedData);
    setFormData(updatedData);

    if (errors[field]) {
      setErrors(prev => {
        const newErrs = { ...prev };
        delete newErrs[field];
        return newErrs;
      });
    }
  };

  const getInputClass = (isDisabled, fieldName) =>
    `w-full h-[32px] px-2 text-[15px] border rounded-md outline-none transition-colors ${
      errors[fieldName] ? "border-red-500" : "border-gray-300"
    } ${isDisabled ? "bg-[#eef1f6] text-gray-500 cursor-not-allowed" : "bg-white text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-100"}`;

  const handleValidateAndSave = useCallback(() => {
    if (isViewMode) return;
    let newErrors = {};
    requiredFields.forEach(field => {
      if (!localData[field] || localData[field].toString().trim() === "") {
        newErrors[field] = "Required";
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    if (onSave) onSave(localData);
  }, [localData, onSave, isViewMode]);

  return (
    <div className="w-full max-w-[750px] mx-auto h-[calc(100vh-140px)] bg-[#eef1f6] flex flex-col overflow-hidden" style={{ fontFamily: FONT }}>
      <ERPHeader
        title="LEAVE TYPE"
        isAddMode={isAddMode}
        isEditMode={isEditMode}
        isViewMode={isViewMode}
        activeTab={activeTab}
        onTabChange={onTabChange}
        rightContent={`${currentRecord || 1} / ${totalRecords || 1}`}
      />

      <div className="flex-1 p-4 overflow-y-auto flex justify-center">
        <div className="w-full max-w-[850px] h-fit bg-white border border-slate-200 shadow-sm rounded-md p-5 grid grid-cols-1 gap-y-4">
          
          {/* Leave Code & Name */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 flex flex-col sm:flex-row items-center">
              <label className="text-[15px] w-[130px] shrink-0">Leave Code <span className="text-red-500">*</span></label>
              <input
                className={getInputClass(isViewMode, "leave_code")}
                value={localData.leave_code || ""}
                onChange={(e) => handleChange("leave_code", e.target.value.toUpperCase())}
                disabled={isViewMode}
                placeholder="e.g. CL, SL"
              />
            </div>
            <div className="flex-1 flex flex-col sm:flex-row items-center">
              <label className="text-[15px] w-[130px] shrink-0">Max Days <span className="text-red-500">*</span></label>
              <input
                type="number"
                className={getInputClass(isViewMode, "max_days")}
                value={localData.max_days || ""}
                onChange={(e) => handleChange("max_days", e.target.value)}
                disabled={isViewMode}
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center">
            <label className="text-[15px] w-[130px] shrink-0">Leave Name <span className="text-red-500">*</span></label>
            <input
              className={getInputClass(isViewMode, "leave_name")}
              value={localData.leave_name || ""}
              onChange={(e) => handleChange("leave_name", e.target.value)}
              disabled={isViewMode}
            />
          </div>

          {/* Applicable To */}
          <div className="flex flex-col sm:flex-row items-center">
            <label className="text-[15px] w-[130px] shrink-0">Applicable To</label>
            <select
              className={getInputClass(isViewMode, "applicable")}
              value={localData.applicable || "All"}
              onChange={(e) => handleChange("applicable", e.target.value)}
              disabled={isViewMode}
            >
              <option value="All">All Employees</option>
              <option value="Male">Male Only</option>
              <option value="Female">Female Only</option>
            </select>
          </div>

          {/* Description */}
          <div className="flex flex-col sm:flex-row items-start">
            <label className="text-[15px] w-[130px] pt-1 shrink-0">Description</label>
            <textarea
              className={`${getInputClass(isViewMode, "description")} h-[80px] py-2 resize-none`}
              value={localData.description || ""}
              onChange={(e) => handleChange("description", e.target.value)}
              disabled={isViewMode}
              placeholder="Enter leave rules or details..."
            />
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

export default LeaveTypeForm;