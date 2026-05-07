import React, { useState, useCallback, useEffect } from "react";
import ERPHeader from "../../../../components/Reusable/form/HeaderForm";
import ERPFooter from "../../../../components/Reusable/form/FooterForm";
import ERPAutocomplete from "../../../../components/Reusable/input/ERPAutocomplete";
import { getActledList } from "../../../../utils/api";

const WeeklyOffMasterForm = ({
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
  // 2. States for dynamic data
  const [employees, setEmployees] = useState([]); // Full objects from API
  const [employeeNames, setEmployeeNames] = useState([]); // Strings for Autocomplete options

  const daysOfWeek = [
    { id: 0, name: "Sunday" },
    { id: 1, name: "Monday" },
    { id: 2, name: "Tuesday" },
    { id: 3, name: "Wednesday" },
    { id: 4, name: "Thursday" },
    { id: 5, name: "Friday" },
    { id: 6, name: "Saturday" },
  ];

  const isViewMode = mode === "view";
  const isEditMode = mode === "edit";
  const isAddMode = mode === "add";
  const FONT = `'Inter', 'Tahoma', system-ui, sans-serif`;

  const requiredFields = ["employee_id", "day_of_week", "effective_from"];

  // 3. Fetch data from ACTLED API
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const data = await getActledList();
        setEmployees(data);
        console.log("EMP LIST:", data);
        // Autocomplete expects an array of strings
        setEmployeeNames(data.map(emp => emp.Led_name.trim()));
      } catch (err) {
        console.error("Failed to fetch employees:", err);
      }
    };
    fetchEmployees();
  }, []);

useEffect(() => {
  if (!initialData || Object.keys(initialData).length === 0) return;

  // 1. Calculate the formatted data FIRST
  const employee = initialData.employee_name || 
                   employees.find(emp => Number(emp.Actled_id) === Number(initialData.employee_id))?.Led_name || "";

  const formattedData = {
    ...initialData,
    employee_name: employee,
    effective_from: initialData.effective_from ? initialData.effective_from.split("T")[0] : "",
    effective_to: initialData.effective_to ? initialData.effective_to.split("T")[0] : "",
  };

  // 2. ONLY update if the data is actually different from what we already have
  if (JSON.stringify(localData) !== JSON.stringify(formattedData)) {
    setLocalData(formattedData);
    setFormData(formattedData);
  }
}, [initialData, employees]); // Remove setFormData from dependencies

 const handleChange = (field, value) => {
  let updatedData = { ...localData };

  if (field === "employee_name") {
    const selectedEmp = employees.find(
      emp => emp.Led_name?.trim() === value?.trim()
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
 
  setErrors(prev => {
    const newErrors = { ...prev };

    if (field === "employee_name") {
      delete newErrors.employee_id;
    } else {
      delete newErrors[field];
    }

    return newErrors;
  });
};

  const getInputClass = (isDisabled, fieldName) =>
    `w-full h-[32px] px-2 text-[15px] border rounded-md outline-none transition-colors ${errors[fieldName] ? "border-red-500" : "border-gray-300"
    } ${isDisabled
      ? "bg-[#eef1f6] text-gray-500 cursor-not-allowed"
      : "bg-white text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
    }`;

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
    <div className="w-full max-w-[750px] mx-auto h-[calc(100vh-140px)] bg-[#eef1f6] flex flex-col overflow-hidden font-sans" style={{ fontFamily: FONT }}>
      <ERPHeader
        title="WEEKLY OFF ENTRY"
        isAddMode={isAddMode}
        isEditMode={isEditMode}
        isViewMode={isViewMode}
        activeTab={activeTab}
        onTabChange={onTabChange}
        rightContent={`${currentRecord || 1} / ${totalRecords || 1}`}
      />

      <div className="flex-1 p-4 overflow-y-auto flex justify-center">
        <div className="w-full max-w-[850px] h-fit bg-white border border-slate-200 shadow-sm rounded-md overflow-hidden">
          <div className="p-5 grid grid-cols-1 gap-y-5"> 
            <div className="flex flex-col sm:flex-row items-start px-1">
              <label className="text-black-800 text-[15px] w-[130px] pt-1 shrink-0">Employee <span className="text-red-500">*</span></label>
              <div className="flex-1 w-full">
                <ERPAutocomplete
                  options={employeeNames}
                  value={localData.employee_name || ""}
                  onChange={(val) => handleChange("employee_name", val)}
                  className={getInputClass(isViewMode, "employee_id")}
                  disabled={isViewMode}
                />
                {/* ID in Subscript (Dynamic from ACTLED) */}
                {localData.employee_id && (
                  <div className="text-[14px] text-blue-600 mt-1 ml-1 font-medium">
                    EMP ID: <sub className="text-[14px]">{localData.employee_id}</sub>
                  </div>
                )}
                {errors.employee_id && <span className="text-[10px] text-red-500 ml-1">Required</span>}
              </div>
            </div>
 
            <div className="flex flex-col sm:flex-row items-center px-1">
              <label className="text-black-800 text-[15px] w-[130px] shrink-0">Weekly Off <span className="text-red-500">*</span></label>
              <div className="flex-1 w-full">
                <select
                  name="day_of_week"
                  value={localData.day_of_week || ""}
                  disabled={isViewMode}
                  onChange={(e) => handleChange("day_of_week", e.target.value)}
                  className={getInputClass(isViewMode, "day_of_week")}
                >
                  <option value="">-- Select Day --</option>
                  {daysOfWeek.map(day => (
                    <option key={day.id} value={day.id}>{day.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Effective Dates */}
            <div className="flex flex-col sm:flex-row sm:gap-6 w-full">
              <div className="flex flex-col sm:flex-row items-center px-1 flex-1">
                <label className="text-black-800 text-[15px] w-[130px] sm:w-[130px] shrink-0">Effective From <span className="text-red-500">*</span></label>
                <div className="flex-1 w-full">
                  <input
                    type="date"
                    name="effective_from"
                    value={localData.effective_from || ""}
                    disabled={isViewMode}
                    onChange={(e) => handleChange("effective_from", e.target.value)}
                    className={getInputClass(isViewMode, "effective_from")}
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-center px-1 flex-1 mt-3 sm:mt-0">
                <label className="text-black-800 text-[15px] sm:w-[100px] shrink-0">Effective To</label>
                <div className="flex-1 w-full">
                  <input
                    type="date"
                    name="effective_to"
                    value={localData.effective_to || ""}
                    disabled={isViewMode}
                    onChange={(e) => handleChange("effective_to", e.target.value)}
                    className={getInputClass(isViewMode, "effective_to")}
                  />
                </div>
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

export default WeeklyOffMasterForm;