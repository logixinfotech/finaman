import React, { useState, useCallback, useEffect, useRef } from "react";
import ERPHeader from "../../../../components/Reusable/form/HeaderForm";
import ERPFooter from "../../../../components/Reusable/form/FooterForm";
import ERPAutocomplete from "../../../../components/Reusable/input/ERPAutocomplete";
import ERPDateInput from "../../../../components/Reusable/input/Date";
import { focusFirstInput, handleERPEnterNavigation ,handleERPBackspaceNavigation} from "../../../../utils/erpShortcuts";
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
  const formRef = useRef(null);
  const [employees, setEmployees] = useState([]); // Full objects from API
  const [employeeNames, setEmployeeNames] = useState([]); // Strings for Autocomplete options
  const saveBtnRef=useRef(null)

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

  useEffect(() => {
    if (isAddMode || isEditMode) {
      focusFirstInput(formRef);
    }
  }, [isAddMode, isEditMode]);

  // 3. Fetch data from ACTLED API
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const data = await getActledList();
        setEmployees(data);
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

  const handleKeyDown = useCallback(
    (e) => {
      handleERPEnterNavigation(e, formRef, isViewMode,saveBtnRef);
      handleERPBackspaceNavigation(e, formRef, isViewMode);
    },
    [isViewMode]
  );

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

      // 🔥 AUTO-FOCUS LOGIC START
      setTimeout(() => {
        // Pata lagao konsa field fail hua hai (e.g., 'employee_id' ya 'day_of_week')
        const firstErrorKey = Object.keys(newErrors)[0]; 

        // Hamara ERPAutocomplete/ERPDateInput input tag render karta hai.
        // Hum formRef ke andar us className ya property se input dhoondh sakte hain.
        // Since custom components className pass karte hain, hum field name ke basis par input select kar rahe hain.
        const container = formRef.current;
        if (container) {
          // Find input where className contains the field name, OR fallback to the first input with a red border
          const errorInput = 
            container.querySelector(`input[class*="${firstErrorKey}"]`) || 
            container.querySelector(`input.border-red-500`); 
            
          if (errorInput) {
            errorInput.focus();
          }
        }
      }, 50);
      // 🔥 AUTO-FOCUS LOGIC END

      return;
    }

    if (onSave) onSave(localData);
  }, [localData, onSave, isViewMode]);

  return (
    <div className="w-full max-w-[700px] mx-auto h-[calc(100vh-140px)] bg-[#eef1f6] flex flex-col overflow-hidden font-sans" style={{ fontFamily: FONT }}>
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
        <div ref={formRef} className="w-full max-w-[850px] h-fit bg-white border border-slate-200 shadow-sm rounded-md overflow-visible relative">
          <div className="p-5 grid grid-cols-1 gap-y-5">
            <div className="flex flex-col gap-1 sm:flex-row sm:gap-6 w-full">
              <div className="flex flex-col sm:flex-row items-start px-1">
                <label className="text-black-800 text-[15px] w-[130px] pt-1 shrink-0">Employee <span className="text-red-500">*</span></label>
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

              <div className="flex flex-col sm:flex-row items-start sm:items-center px-1 mt-3 sm:mt-0">
                <label className="text-black-800 text-[15px] w-[110px] shrink-0">Weekly Off <span className="text-red-500">*</span></label>
                <div className="flex-1 w-full">
                  <ERPAutocomplete
                    data-auto
                    options={daysOfWeek.map(day => day.name)}
                    value={localData.day_of_week || ""}
                    onChange={(val) => {
                      handleChange("day_of_week", val);  
                    }} 
                    className={getInputClass(isViewMode, "day_of_week")}
                    disabled={isViewMode}
                    onKeyDown={handleKeyDown}
                  />
                </div>
              </div>
            </div>
            {/* Effective Dates */}
            <div className="flex flex-col gap-1 sm:flex-row sm:gap-6 w-full">
              <div className="flex flex-col sm:flex-row items-start sm:items-center px-1 flex-1">
                <label className="text-black-800 text-[15px] w-[130px] shrink-0">Effective From <span className="text-red-500">*</span></label>
                <div className="flex-1 w-full">
                  <ERPDateInput
                    value={localData.effective_from || ""}
                    disabled={isViewMode}
                    onChange={(val) =>
                      handleChange("effective_from", val)
                    }
                    className={getInputClass(isViewMode, "effective_from")}
                    onKeyDown={handleKeyDown}
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center px-1 flex-1 mt-3 sm:mt-0">
                <label className="text-black-800 text-[15px]  ml-[10px] w-[110px] shrink-0">Effective To</label>
                <div className="flex-1 w-full">
                  <ERPDateInput
                    value={localData.effective_to || ""}
                    disabled={isViewMode}
                    minDate={localData.effective_from}
               
                    onChange={(val) =>
                      handleChange("effective_to", val)
                    }
                    className={getInputClass(isViewMode, "effective_to")}
                    onKeyDown={handleKeyDown}
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
        saveBtnRef={saveBtnRef}
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