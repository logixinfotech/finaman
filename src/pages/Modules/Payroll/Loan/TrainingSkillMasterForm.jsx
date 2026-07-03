// TrainingSkillMasterForm.jsx

import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";

import ERPHeader from "../../../../components/Reusable/form/HeaderForm";

import ERPFooter from "../../../../components/Reusable/form/FooterForm";

import ERPAutocomplete from "../../../../components/Reusable/input/ERPAutocomplete";

import ERPDateInput from "../../../../components/Reusable/input/Date";

import {
  focusFirstInput,
  handleERPEnterNavigation,
} from "../../../../utils/erpShortcuts";

import { getActledList } from "../../../../utils/api";

const masterTypes = [
  "Training",
  "Skill",
];

const TrainingSkillMasterForm = ({
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
  const [localData, setLocalData] =
    useState(initialData);

  const [errors, setErrors] =
    useState({});

  const formRef = useRef(null);

  const [employees, setEmployees] =
    useState([]);

  const [employeeNames, setEmployeeNames] =
    useState([]);

  const FONT =
    "'Inter', 'Tahoma', system-ui, sans-serif";

  const isViewMode = mode === "view";

  const isEditMode = mode === "edit";

  const isAddMode = mode === "add";

  const requiredFields = [
    "employee_id",
    "master_type",
    "training_skill_name",
  ];

  useEffect(() => {
    if (isAddMode || isEditMode) {
      focusFirstInput(formRef);
    }
  }, [isAddMode, isEditMode]);

  useEffect(() => {
    const fetchEmployees =
      async () => {
        try {
          const data =
            await getActledList();

          setEmployees(data);

          setEmployeeNames(
            data.map((emp) =>
              emp.Led_name.trim()
            )
          );
        } catch (err) {
          console.error(err);
        }
      };

    fetchEmployees();
  }, []);

  useEffect(() => {
    if (
      !initialData ||
      Object.keys(initialData)
        .length === 0
    )
      return;

    const employee =
      initialData.employee_name ||
      employees.find(
        (emp) =>
          Number(emp.Actled_id) ===
          Number(
            initialData.employee_id
          )
      )?.Led_name ||
      "";

    const formattedData = {
      ...initialData,

      employee_name: employee,

      completion_date:
        initialData.completion_date
          ? initialData.completion_date.split(
              "T"
            )[0]
          : "",

      expiry_date:
        initialData.expiry_date
          ? initialData.expiry_date.split(
              "T"
            )[0]
          : "",
    };

    if (
      JSON.stringify(localData) !==
      JSON.stringify(formattedData)
    ) {
      setLocalData(formattedData);

      setFormData(formattedData);
    }
  }, [initialData, employees]);

  const handleKeyDown =
    useCallback(
      (e) => {
        handleERPEnterNavigation(
          e,
          formRef,
          isViewMode
        );
      },
      [isViewMode]
    );

  const handleChange = (
    field,
    value
  ) => {
    let updatedData = {
      ...localData,
    };

    if (field === "employee_name") {
      const selectedEmp =
        employees.find(
          (emp) =>
            emp.Led_name?.trim() ===
            value?.trim()
        );

      updatedData.employee_name =
        value;

      updatedData.employee_id =
        selectedEmp
          ? Number(
              selectedEmp.Actled_id
            )
          : "";
    } else {
      updatedData[field] = value;
    }

    setLocalData(updatedData);

    setFormData(updatedData);

    setErrors((prev) => {
      const newErrors = {
        ...prev,
      };

      if (
        field === "employee_name"
      ) {
        delete newErrors.employee_id;
      } else {
        delete newErrors[field];
      }

      return newErrors;
    });
  };

  const getInputClass = (
    isDisabled,
    fieldName
  ) =>
    `w-full h-[32px] px-2 text-[15px] border rounded-md outline-none transition-colors ${
      errors[fieldName]
        ? "border-red-500"
        : "border-gray-300"
    } ${
      isDisabled
        ? "bg-[#eef1f6] text-gray-500 cursor-not-allowed"
        : "bg-white text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
    }`;

  const handleValidateAndSave =
    useCallback(() => {
      if (isViewMode) return;

      let newErrors = {};

      requiredFields.forEach(
        (field) => {
          if (
            !localData[field] ||
            localData[field]
              .toString()
              .trim() === ""
          ) {
            newErrors[field] =
              "Required";
          }
        }
      );

      if (
        Object.keys(newErrors)
          .length > 0
      ) {
        setErrors(newErrors);

        return;
      }

      if (onSave)
        onSave(localData);
    }, [
      localData,
      onSave,
      isViewMode,
    ]);

  return (
    <div
      className="w-full max-w-[700px] mx-auto h-[calc(100vh-140px)] bg-[#eef1f6] flex flex-col overflow-hidden font-sans"
      style={{
        fontFamily: FONT,
      }}
    >
      <ERPHeader
        title="TRAINING / SKILL MASTER"
        isAddMode={isAddMode}
        isEditMode={isEditMode}
        isViewMode={isViewMode}
        activeTab={activeTab}
        onTabChange={
          onTabChange
        }
        rightContent={`${
          currentRecord || 1
        } / ${totalRecords || 1}`}
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

            {/* Employee + Type */}
            <div className="flex flex-col sm:flex-row sm:gap-6 w-full">

              <div className="flex flex-col sm:flex-row items-start px-1 flex-1">
                <label className="text-[15px] w-[110px] pt-1 shrink-0">
                  Employee
                  <span className="text-red-500">*</span>
                </label>

                <div className="flex-1 w-full">
                  <ERPAutocomplete
                    options={employeeNames}
                    value={localData.employee_name || ""}
                    onChange={(val) =>
                      handleChange(
                        "employee_name",
                        val
                      )
                    }
                    className={getInputClass(
                      isViewMode,
                      "employee_id"
                    )}
                    disabled={isViewMode}
                    onKeyDown={handleKeyDown}
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start px-1 flex-1 mt-3 sm:mt-0">
                <label className="text-[15px] w-[110px] pt-1 shrink-0">
                  Master Type
                  <span className="text-red-500">*</span>
                </label>

                <div className="flex-1 w-full">
                  <ERPAutocomplete
                    options={masterTypes}
                    value={localData.master_type || ""}
                    onChange={(val) =>
                      handleChange(
                        "master_type",
                        val
                      )
                    }
                    className={getInputClass(
                      isViewMode,
                      "master_type"
                    )}
                    disabled={isViewMode}
                    onKeyDown={handleKeyDown}
                  />
                </div>
              </div>
            </div>

            {/* Training Name + Institute */}
            <div className="flex flex-col sm:flex-row sm:gap-6 w-full">

              <div className="flex flex-col sm:flex-row items-start px-1 flex-1">
                <label className="text-[15px] w-[110px] pt-1 shrink-0">
                  Training / Skill
                  <span className="text-red-500">*</span>
                </label>

                <input
                  type="text"
                  value={localData.training_skill_name || ""}
                  disabled={isViewMode}
                  onChange={(e) =>
                    handleChange(
                      "training_skill_name",
                      e.target.value
                    )
                  }
                  onKeyDown={handleKeyDown}
                  className={getInputClass(
                    isViewMode,
                    "training_skill_name"
                  )}
                />
              </div>

              <div className="flex flex-col sm:flex-row items-start px-1 flex-1 mt-3 sm:mt-0">
                <label className="text-[15px] w-[110px] pt-1 shrink-0">
                  Institute
                </label>

                <input
                  type="text"
                  value={localData.institute_name || ""}
                  disabled={isViewMode}
                  onChange={(e) =>
                    handleChange(
                      "institute_name",
                      e.target.value
                    )
                  }
                  onKeyDown={handleKeyDown}
                  className={getInputClass(
                    isViewMode,
                    "institute_name"
                  )}
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
        handleSubmit={
          handleValidateAndSave
        }
        onModify={onModify}
        onDelete={() =>
          onDelete &&
          onDelete(localData)
        }
        onCancel={onCancel}
        onEditCancel={onEditCancel}
        onNewEntry={onNewEntry}
        rights={rights}
      />
    </div>
  );
};

export default TrainingSkillMasterForm;