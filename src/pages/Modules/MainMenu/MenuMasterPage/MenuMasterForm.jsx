import React, { useState, useRef, useEffect } from "react";
import ERPFooter from "../../../../components/Reusable/form/FooterForm";
import ERPHeader from "../../../../components/Reusable/form/HeaderForm";

const FONT = `'Inter', 'Tahoma', system-ui, sans-serif`;
const inputClass = "h-[30px] px-2 text-[13px] border border-gray-300 rounded-md bg-white focus:border-blue-500 outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed";
const labelClass = "text-[12px] font-medium text-gray-600 w-[120px]";
const errorText = "text-[10px] text-red-500 mt-0.5";

const MenuMasterForm = ({
  mode , modules, formData, setFormData, onSave, onCancel,
  saving, onDelete, onModify, onEditCancel, rights,
  currentRecord, totalRecords, activeTab, onTabChange,onNewEntry
}) => {
  const isView = mode === "view";
  const isEdit = mode === "edit";
  const isAdd = mode === "add";

  const fieldDisabled = (fieldName) => {
    if (isView) return true;
    if (isEdit && (fieldName === "masmod_id" || fieldName === "pad_name")) return true;
    return false;
  };

  const [errors, setErrors] = useState({});
  const containerRef = useRef(null); 
  useEffect(() => {
    if (!isView) {
      setTimeout(() => {
        const firstInput = containerRef.current?.querySelector("input:not([disabled]), select:not([disabled])");
        firstInput?.focus();
      }, 150);
    }
  }, [mode]);

  const handleKeyDown = (e) => {
    if (isView) return;
    if (e.key === "Enter") {
      e.preventDefault();
      const elements = Array.from(
        containerRef.current.querySelectorAll("input:not([disabled]), select:not([disabled]), button:not([disabled])")
      );
      const index = elements.indexOf(e.target);
      if (index > -1 && index < elements.length - 1) {
        elements[index + 1].focus();
      } else {
        const btn=document.querySelector("#save")|| document.querySelector("#update")
        if(btn){
          btn.focus();
        }
      }
    }
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.masmod_id) newErrors.masmod_id = "Required";
    if (!formData.pad_name) newErrors.pad_name = "Required";
    if (!formData.bar_name) newErrors.bar_name = "Required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    onSave();
  };

  const selectedModule = modules.find((m) => m.masmod_id === formData.masmod_id);

  return (
    <div className="w-full max-w-[700px] mx-auto h-[calc(100vh-140px)] bg-[#eef1f6] flex flex-col" style={{ fontFamily: FONT }}>
      
      <ERPHeader
        title="MENU MASTER"
        isAddMode={isAdd}
        isEditMode={isEdit && !isView}
        isViewMode={isView}
        activeTab={activeTab}
        onTabChange={onTabChange}
        rightContent={`${currentRecord || 1} / ${totalRecords || 1}`}
      />

      <div className="flex-1 p-4 flex justify-center items-start overflow-y-auto">
        <div ref={containerRef} className="w-full bg-white border rounded-lg p-6 shadow-sm">
          
          

          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            {/* Module Select */}
            <div className="flex flex-col">
              <div className="flex items-center">
                <label className={labelClass}>Module <span className="text-red-500">*</span></label>
                <select
                  disabled={fieldDisabled("masmod_id")}
                  className={`${inputClass} flex-1 ${errors.masmod_id ? "border-red-500" : ""}`}
                  value={formData.masmod_id || ""}
                  onChange={(e) => handleChange("masmod_id", Number(e.target.value))}
                  onKeyDown={handleKeyDown}
                >
                  <option value="">Select Module</option>
                  {modules.map((m) => (
                    <option key={m.masmod_id} value={m.masmod_id}>{m.mod_name}</option>
                  ))}
                </select>
              </div>
              {errors.masmod_id && <p className={`${errorText} ml-[120px]`}>{errors.masmod_id}</p>}
            </div>

            {/* Pad Name Select */}
            <div className="flex flex-col">
              <div className="flex items-center">
                <label className={labelClass}>Pad Name <span className="text-red-500">*</span></label>
                <select
                  disabled={fieldDisabled("pad_name")}
                  className={`${inputClass} flex-1 ${errors.pad_name ? "border-red-500" : ""}`}
                  value={formData.pad_name || ""}
                  onChange={(e) => handleChange("pad_name", e.target.value)}
                  onKeyDown={handleKeyDown}
                >
                  <option value="">Select Pad</option>
                  <option value="Entries">Entries</option>
                  <option value="Reports">Reports</option>
                  <option value="Utility">Utility</option>
                </select>
              </div>
              {errors.pad_name && <p className={`${errorText} ml-[120px]`}>{errors.pad_name}</p>}
            </div>

            <div className="flex items-center">
              <label className={labelClass}>Item Type</label>
              <select
                disabled={isView}
                className={`${inputClass} flex-1`}
                value={formData.item_type || ""}
                onChange={(e) => handleChange("item_type", e.target.value)}
                onKeyDown={handleKeyDown}
              >
                <option value="M">Menu</option>
                <option value="S">Sub Menu</option>
                <option value="R">Report</option>
              </select>
            </div>

            <div className="flex items-center">
              <label className={labelClass}>Application Type</label>
              <select
                disabled={isView}
                className={`${inputClass} flex-1`}
                value={formData.appl_type || ""}
                onChange={(e) => handleChange("appl_type", e.target.value)}
                onKeyDown={handleKeyDown}
              >
                <option value="F">Form</option>
                <option value="P">Program</option>
                <option value="A">Application</option>
              </select>
            </div>

            <div className="flex flex-col col-span-2">
              <div className="flex items-center">
                <label className={labelClass}>Menu Name <span className="text-red-500">*</span></label>
                <input
                  disabled={isView}
                  className={`${inputClass} flex-1 ${errors.bar_name ? "border-red-500" : ""}`}
                  value={formData.bar_name || ""}
                  onChange={(e) => handleChange("bar_name", e.target.value)}
                  onKeyDown={handleKeyDown}
                />
              </div>
              {errors.bar_name && <p className={`${errorText} ml-[120px]`}>{errors.bar_name}</p>}
            </div>

            <div className="flex items-center col-span-2">
              <label className={labelClass}>File Name</label>
              <input
                disabled={isView}
                className={`${inputClass} flex-1`}
                value={formData.appl_name || ""}
                placeholder="e.g. UserMasterPage"
                onChange={(e) => handleChange("appl_name", e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>

            <div className="flex items-center col-span-2">
              <label className={labelClass}>Parameters</label>
              <input
                disabled={isView}
                className={`${inputClass} flex-1`}
                value={formData.appl_para || ""}
                onChange={(e) => handleChange("appl_para", e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>

            <div className="flex items-center">
              <label className={labelClass}>Is Hidden?</label>
              <select
                disabled={isView}
                className={`${inputClass} flex-1`}
                value={formData.menu_hide || "N"}
                onChange={(e) => handleChange("menu_hide", e.target.value)}
                onKeyDown={handleKeyDown}
              >
                <option value="N">No (Visible)</option>
                <option value="Y">Yes (Hidden)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <ERPFooter
        isAddMode={isAdd}
        isEditMode={isEdit && !isView}
        isViewMode={isView}
        saving={saving}
        handleSubmit={handleSubmit}
        onModify={rights.mod === 1 ? onModify : null}
        onDelete={rights.del === 1 ? onDelete : null}
        onEditCancel={onEditCancel}
        onCancel={onCancel}
        formData={formData}
        rights={rights }
        onNewEntry={onNewEntry}
      />
    </div>
  );
};

export default MenuMasterForm;