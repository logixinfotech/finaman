
import React, { useState, useRef, useEffect, useCallback, memo } from "react";
import ERPHeader from "../../components/Reusable/form/HeaderForm";
import ERPFooter from "../../components/Reusable/form/FooterForm";
import ERPDateInput from "../../components/Reusable/input/Date";
import ERPAutocomplete from "../../components/Reusable/input/ERPAutocomplete";
import { tabs, fieldGroups } from "./EmployeeMasterDetails";
import {
  validateEmployeeForm,
  validateSingleField,
} from "./EmployeeFromValidation";
import DocumentTable from "./DocumentTable";
import {
  FaUser,
  FaBuilding,
  FaFileAlt,
  FaMoneyBill,
} from "react-icons/fa";
const widthConfig = {
  "Title": "w-[60px]",
  "Pin Code": "w-[70px]",
  "Mobile No": "w-[130px]",
  "Gender": "w-[70px]",
  "Relation": "pl-5 w-[800px]",
  "Married": "pl-6 w-[800%]",
  "Spouse": "pl-6 w-[700px]",
  "Father Name": "w-[500px]",
  "First Name": "w-[500px]"
};

const TabIcon = memo(({ tab, isActive }) => {
  const baseClass = "inline mr-1.5 text-[12px]";
  const colorClass = isActive
    ? "text-blue-600 drop-shadow-sm"
    : tab === "basic"
      ? "text-blue-500"
      : tab === "organization"
        ? "text-orange-500"
        : tab === "documents"
          ? "text-emerald-500"
          : "text-indigo-500";

  if (tab === "basic") return <FaUser className={`${baseClass} ${colorClass}`} />;
  if (tab === "organization") return <FaBuilding className={`${baseClass} ${colorClass}`} />;
  if (tab === "documents") return <FaFileAlt className={`${baseClass} ${colorClass}`} />;
  return <FaMoneyBill className={`${baseClass} ${colorClass}`} />;
});

const EmployeeMasterForm = ({
  formData = {},
  setFormData,
  onSave,
  onCancel,
  saving,
  onDelete,
  mode,
  onModify,
  onNewEntry,
  currentRecord,
  totalRecords,
  onPrint,
  onEditCancel,
}) => {
  const isAddMode = mode === "add";
  const isViewMode = mode === "view";
  const isEditMode = mode === "edit";

  const [activeTab, setActiveTab] = useState("basic");
  const [errors, setErrors] = useState({});
  const [attachments, setAttachments] = useState({});

  const formDataRef = useRef(formData);
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  const photoInputRef = useRef(null);

  useEffect(() => {
    setTimeout(() => {
      const container = document.getElementById(`tab-content-${activeTab}`);
      if (container) {
        const firstEnabled = container.querySelector(
          "input:not([disabled]), select:not([disabled])"
        );
        if (firstEnabled) firstEnabled.focus();
      }
    }, 50);
  }, [activeTab]);

  useEffect(() => {
    if (isAddMode) {
      setTimeout(() => {
        const container = document.getElementById(`tab-content-basic`);
        if (container) {
          const firstEnabled = container.querySelector(
            "input:not([disabled]), select:not([disabled])"
          );
          if (firstEnabled) firstEnabled.focus();
        }
      }, 100);
    }
  }, [isAddMode]);

  const handleChange = useCallback(
    (field, rawValue) => {
      if (!setFormData) return;

      let value = rawValue;
      const nameStr = field.toLowerCase();

      if (
        nameStr.includes("mobile") ||
        nameStr.includes("phone") ||
        nameStr.includes("pin code")
      ) {
        value = value.toString().replace(/\D/g, "").slice(0, 10);
      } else if (nameStr.includes("pan")) {
        value = value.toString().toUpperCase().slice(0, 10);
      }

      setFormData((prev) => {
        let updated = { ...prev, [field]: value };

        if (field === "Same as Correspondence") {
          if (value === true) {
            updated["P_Adress Line"] = updated["C_Adress Line"] || "";
            updated["P_City"] = updated["C_City"] || "";
            updated["P_District"] = updated["C_District"] || "";
            updated["P_Pin Code"] = updated["C_Pin Code"] || "";
            updated["P_State"] = updated["C_State"] || "";
          } else {
            updated["P_Adress Line"] = "";
            updated["P_City"] = "";
            updated["P_District"] = "";
            updated["P_Pin Code"] = "";
            updated["P_State"] = "";
          }
        }

        if (field === "Married" && value === "No") {
          updated["Spouse"] = "";
          updated["Aniversary"] = "";
        }

        return updated;
      });

      const err = validateSingleField(field, value);
      if (err) setErrors((prev) => ({ ...prev, [field]: err }));
      else {
        setErrors((prev) => {
          const copy = { ...prev };
          delete copy[field];
          return copy;
        });
      }
    },
    [setFormData]
  );

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) handleChange("photo_url", URL.createObjectURL(file));
  };

  const requiredFields = [
    "Employee Name",
    "Mobile No",
    "Email Id",
    "Department",
  ];

const getInputClass = (isDisabled) =>
  `w-full h-[32px] px-2 text-[14px] border border-gray-300 rounded-md outline-none ${
    isDisabled
      ? "bg-[#eef1f6] text-gray-500 cursor-not-allowed"
      : "bg-white focus:border-blue-500"
  }`;

  const handleKeyDown = useCallback(
    (e) => {
      if (isViewMode) return;

      if (e.key === "Enter") {
        e.preventDefault();

        const container = document.getElementById(`tab-content-${activeTab}`);
        if (!container) return;

        const focusableElements = Array.from(
          container.querySelectorAll("input:not([disabled]), select:not([disabled])")
        );

        const index = focusableElements.indexOf(e.target);

        if (index > -1) {
          if (index < focusableElements.length - 1) {
            focusableElements[index + 1].focus();
          } else {
            const currentTabIndex = tabs.indexOf(activeTab);
            if (currentTabIndex < tabs.length - 1) {
              setActiveTab(tabs[currentTabIndex + 1]);
            } else {
              const buttons = Array.from(document.querySelectorAll("button"));
              const saveBtn = buttons.find((btn) =>
                btn.textContent.toLowerCase().includes("save")
              );
              if (saveBtn) {
                saveBtn.focus();
              } else {
                handleSave();
              }
            }
          }
        }
      }
    },
    [activeTab, isViewMode]
  );

  const renderField = (fieldObj) => {
    const field = fieldObj.key;
    const type = fieldObj.type || "text";

    const isPermanentAddressField = field.startsWith("P_");
    const isSameAsCorrespondence = !!formData["Same as Correspondence"];
    const fieldDisabled = isViewMode || (isPermanentAddressField && isSameAsCorrespondence);

    if (type === "date") {
      return (
        <ERPDateInput
          value={formData[field] || ""}
          onChange={(val) => handleChange(field, val)}
          className={getInputClass(fieldDisabled)}
          disabled={fieldDisabled}
          onKeyDown={handleKeyDown}
        />
      );
    }

    if (type === "select") {
      return (
        <ERPAutocomplete
          options={fieldObj.options || []}
          value={formData[field] || ""}
          disabled={fieldDisabled}
          onChange={(val) => handleChange(field, val)}
          className={getInputClass(fieldDisabled)}
        />
      );
    }

    if (type === "checkbox") {
      return (
        <div className="flex items-center h-[26px] w-full px-1">
          <input
            type="checkbox"
            className="w-4 h-4 cursor-pointer"
            checked={!!formData[field]}
            disabled={isViewMode}
            onChange={(e) => handleChange(field, e.target.checked)}
            onKeyDown={handleKeyDown}
          />
        </div>
      );
    }

    return (
      <input
        className={getInputClass(fieldDisabled)}
        value={formData[field] || ""}
        disabled={fieldDisabled}
        onChange={(e) => handleChange(field, e.target.value)}
        onKeyDown={handleKeyDown}
style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}      />
    );
  };

  const handleSave = useCallback(() => {
    const { isValid, errors, firstErrorTab } = validateEmployeeForm(
      formDataRef.current,
      fieldGroups
    );
    if (!isValid) {
      setErrors(errors);
      setActiveTab(firstErrorTab);
      return;
    }
    onSave(formDataRef.current);
  }, [onSave]);

  return (
    <div
      className="w-full h-full sm:h-[calc(100vh-140px)] bg-[#eef1f6] flex flex-col overflow-hidden"
      style={{ background: isViewMode ? "#eef1f6" : "#ffffff" }}
    >
      <ERPHeader
        title="EMPLOYEE MASTER"
        isAddMode={isAddMode}
        isEditMode={isEditMode}
        isViewMode={isViewMode}
        rightContent={`${currentRecord || 1}/${totalRecords || 1}`}
      />

      <div
        className="flex flex-1 min-h-0 flex-col md:flex-row w-full h-full md:h-[calc(100vh-120px)] overflow-hidden"
        style={{ background: isViewMode ? "#eef1f6" : "#ffffff" }}
      >
        <div className="w-full md:w-60 bg-[#eef1f6] md:rounded-xl border shadow-sm flex flex-col overflow-hidden shrink-0">
          <div className="bg-slate-800 h-20 w-full relative p-14 mb-12">
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
              <div className="w-28 h-28 bg-white rounded-2xl p-1 shadow-lg border">
                <div
                  className="w-full h-full bg-slate-100 rounded-xl flex items-center justify-center overflow-hidden border border-dashed border-slate-300 cursor-pointer"
                  onClick={() => photoInputRef.current?.click()}
                >
                  {formData.photo_url ? (
                    <img
                      src={formData.photo_url}
                      className="w-full h-full object-cover rounded-xl"
                      alt="profile"
                    />
                  ) : (
                    <FaUser className="text-3xl text-slate-400" />
                  )}
                </div>
              </div>
            </div>
          </div>
          <input
            type="file"
            className="hidden"
            ref={photoInputRef}
            onChange={handlePhotoUpload}
          />
          <div className="px-6 pt-4 pb-4 text-center">
            <h2 className="text-[18px] font-bold text-slate-800 truncate">
              {formData.employee_name || formData["Employee Name"] || "New Employee"}
            </h2>
            <h4 className="text-[14px] text-slate-800 truncate">
              {formData.employee_code || formData["Employee Code"] || "Employee Id"}
            </h4>
            <button
              onClick={() => photoInputRef.current?.click()}
              className="mt-3 px-3 py-1 text-[12px] rounded bg-slate-800 text-white hover:bg-slate-700 transition"
            >
              Upload Photo
            </button>
          </div>
          <nav className="flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible mt-2 md:mt-4 px-3 gap-1 pb-2 md:pb-0 scrollbar-hide">
            {tabs.map((tab) => {
              const isActive = activeTab === tab;

              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className="group relative flex items-center gap-3 px-3 py-2 rounded-md text-[14px] font-semibold uppercase tracking-wide transition-all whitespace-nowrap"
                  style={{
                    background: isActive ? "#0f172a" : "transparent",
                    color: isActive ? "#fff" : "#334155",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.background = "#f1f5f9";
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.background = "transparent";
                  }}
                >
                  {isActive && (
                    <div className="hidden md:block absolute left-0 top-1 bottom-1 w-[3px] bg-white rounded-r" />
                  )}

                  <span className="text-sm">
                    <TabIcon tab={tab} isActive={isActive} />
                  </span>
                  <span>{tab}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div
          id={`tab-content-${activeTab}`}
          className="flex-1 p-2 md:p-2 overflow-y-auto overflow-x-hidden min-h-0"
        >
          {activeTab === "documents" ? (
            <DocumentTable
              attachments={attachments}
              setAttachments={setAttachments}
              isViewMode={isViewMode}
            />
          ) : (
            <div className="columns-1 xl:columns-2 2xl:columns-3 3xl:columns-4 gap-1">
              {Object.entries(fieldGroups[activeTab] || {}).map(
                ([title, fields]) => (
                  <div
                    key={title}
                    className="mb-3 break-inside-avoid border rounded shadow-sm inline-block w-full"
                  >
                    <div className="text-[15px] font-medium px-2 py-1 border-b">
                      {title}
                    </div>

                    <div className="p-2 flex flex-wrap gap-x-2 gap-y-2">
                      {(fields || []).map((fieldObj) => {
                        if (fieldObj.showIf && !fieldObj.showIf(formData)) {
                          return null;
                        }

                        const fieldKey = fieldObj.key;
                        const label = fieldObj.label;
                        const nameStr = label.toLowerCase();

                        const isFullWidth =
                          nameStr.includes("employee name") ||
                          nameStr === "address line" ||
                          nameStr === "passport" ||
                          nameStr === "same as correspondence" ||
                          nameStr === "contact person";

                        // 👉 Logic for variable width
                        const customInputWidth = widthConfig[label];

                        return (
                          <div
                            key={fieldKey}
                            // original wrapper classes bilkul same hain
                            className={`flex flex-col sm:flex-row items-start sm:items-center px-1 text-[15px] flex-grow ${isFullWidth ? "w-full" : "w-[49%]"
                              }`}
                          >
                            <label className="text-black-800 px-1 sm:min-w-[90px] flex-shrink-0 leading-tight mb-1 sm:mb-0 flex items-center">
                              {label}
                              {requiredFields.includes(fieldKey) && (
                                <span className="text-red-500 ml-1">*</span>
                              )}
                            </label>

                            <div
                              // Yahan flex-1 ke saath widthConfig apply ho rahi hai
                              className="flex-1 w-full px-1 relative" style={{
                                background: isViewMode ? "#eef1f6" : "#ffffff",
                              }}
                            >
                              {renderField(fieldObj)}

                              {errors[fieldKey] && (
                                <div className="absolute left-0 top-full mt-1 z-50">
                                  <div className="bg-red-500 text-white text-[10px] px-2 py-[3px] rounded shadow-md max-w-[200px] break-words leading-tight">
                                    {errors[fieldKey]}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>

      <ERPFooter
        isAddMode={isAddMode}
        isViewMode={isViewMode}
        isEditMode={isEditMode}
        saving={saving}
        handleSubmit={handleSave}
        onModify={onModify}
        onDelete={() => onDelete && onDelete(formData)}
        onCancel={onCancel}
        onNewEntry={onNewEntry}
        onPrint={onPrint}
        onEditCancel={onEditCancel}
      />
    </div>
  );
};

export default EmployeeMasterForm;