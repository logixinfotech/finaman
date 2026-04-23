import { useState, useRef } from "react";
import ERPFooter from "../../../../components/Reusable/form/FooterForm";
import ERPHeader from "../../../../components/Reusable/form/HeaderForm";
  const inputClass = "w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs shadow-sm hover:border-gray-300 focus:border-[var(--sidebar-accent-bg)] focus:ring-2 focus:ring-[var(--sidebar-accent-bg)/20] outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed";
  const labelClass = "text-[10px] font-semibold text-gray-500 tracking-wide uppercase";
  const errorText = "text-[10px] text-red-500 mt-1";
const MenuMasterForm = ({
  mode,
  modules,
  formData,
  setFormData,
  onSave,
  onCancel,
  saving,
  onDelete,
  onModify,onEditCancel, rights
}) => { 
  const isView = mode === "view";
  const isEdit = !!formData.masmnu_id; 
  const fieldDisabled = (fieldName) => {
    if (isView) return true;  
    if (isEdit && (fieldName === "masmod_id" || fieldName === "pad_name")) return true;
    return false;
  };

  const [errors, setErrors] = useState({});
  const inputRefs = useRef([]);
  inputRefs.current = [];

  const setInputRef = (el) => {
    if (el && !inputRefs.current.includes(el)) inputRefs.current.push(el);
  };

  const focusNextInput = (current) => {
    const index = inputRefs.current.indexOf(current); 
    const nextInput = inputRefs.current.slice(index + 1).find(input => !input.disabled);
    if (nextInput) nextInput.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === "ArrowDown") {
      e.preventDefault();
      focusNextInput(e.target);
    }
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const requiredFields = ["masmod_id", "pad_name", "bar_name"];

  const validateForm = () => {
    const newErrors = {};
    requiredFields.forEach((f) => {
      if (!formData[f]) newErrors[f] = "Required";
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    onSave();
  };

  const selectedModule = modules.find((m) => m.masmod_id === formData.masmod_id);

  return (
    <div className="w-full max-w-7xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 flex flex-col min-h-[calc(100vh-160px)]">
      
      <ERPHeader
        title="Menu Master"
        isAddMode={!isEdit && !isView}
        isEditMode={isEdit && !isView}
        isViewMode={isView}
      />

      <div className="p-5 bg-gray-50 flex-1">
        {selectedModule && (
          <div className="mb-4 text-xs bg-blue-50 border border-blue-200 px-3 py-1 rounded-md text-blue-700 inline-block">
            Selected Module : <b>{selectedModule.mod_name}</b>
          </div>
        )}

        <div className="grid xl:grid-cols-4 md:grid-cols-2 grid-cols-1 gap-4"> 
          <div>
            <label className={labelClass}>Module *</label>
            <select
              ref={setInputRef}
              disabled={fieldDisabled("masmod_id")}
              className={`${inputClass} ${errors.masmod_id ? "border-red-500" : ""}`}
              value={formData.masmod_id || ""}
              onChange={(e) => handleChange("masmod_id", Number(e.target.value))}
              onKeyDown={handleKeyDown}
            >
              <option value="">Select Module</option>
              {modules.map((m) => (
                <option key={m.masmod_id} value={m.masmod_id}>{m.mod_name}</option>
              ))}
            </select>
            {errors.masmod_id && <p className={errorText}>{errors.masmod_id}</p>}
          </div> 
          <div>
            <label className={labelClass}>Pad Name *</label>
            <select
              ref={setInputRef}
              disabled={fieldDisabled("pad_name")}
              className={`${inputClass} ${errors.pad_name ? "border-red-500" : ""}`}
              value={formData.pad_name || ""}
              onChange={(e) => handleChange("pad_name", e.target.value)}
              onKeyDown={handleKeyDown}
            >
              <option value="">Select Pad</option>
              <option value="Entries">Entries</option>
              <option value="Reports">Reports</option>
              <option value="Install">Install</option>
              <option value="Utility">Utility</option>
            </select>
            {errors.pad_name && <p className={errorText}>{errors.pad_name}</p>}
          </div>

          <div>
            <label className={labelClass}>Item Type</label>
            <select
              ref={setInputRef}
              disabled={isView}
              className={inputClass}
              value={formData.item_type || ""}
              onChange={(e) => handleChange("item_type", e.target.value)}
              onKeyDown={handleKeyDown}
            >
              <option value="">Select</option>
              <option value="M">Menu</option>
              <option value="S">Sub Menu</option>
              <option value="R">Report</option>
            </select>
          </div> 
          <div>
            <label className={labelClass}>Serial No</label>
            <input className={inputClass} value={formData.srl_no || ""} disabled />
          </div>

          <div>
            <label className={labelClass}>Bar Serial</label>
            <input className={inputClass} value={formData.bar_srl || ""} disabled />
          </div>

          <div className="xl:col-span-2 md:col-span-2">
            <label className={labelClass}>Menu Name *</label>
            <input
              ref={setInputRef}
              disabled={isView}
              className={`${inputClass} ${errors.bar_name ? "border-red-500" : ""}`}
              value={formData.bar_name || ""}
              onChange={(e) => handleChange("bar_name", e.target.value)}
              onKeyDown={handleKeyDown}
            />
            {errors.bar_name && <p className={errorText}>{errors.bar_name}</p>}
          </div>
 
          <div>
            <label className={labelClass}>Application Type</label>
            <select
              ref={setInputRef}
              disabled={isView}
              className={inputClass}
              value={formData.appl_type || ""}
              onChange={(e) => handleChange("appl_type", e.target.value)}
              onKeyDown={handleKeyDown}
            >
              <option value="F">Form</option>
              <option value="P">Program</option>
              <option value="A">Application</option>
              <option value="E">Executable</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Application Name</label>
            <input
              ref={setInputRef}
              disabled={isView}
              className={inputClass}
              value={formData.appl_name || ""}
              onChange={(e) => handleChange("appl_name", e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>

          <div className="xl:col-span-2 md:col-span-2">
            <label className={labelClass}>Parameters</label>
            <input
              ref={setInputRef}
              disabled={isView}
              className={inputClass}
              value={formData.appl_para || ""}
              onChange={(e) => handleChange("appl_para", e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>

          <div>
            <label className={labelClass}>Is Hidden?</label>
            <select
              disabled={isView}
              className={inputClass}
              value={formData.menu_hide || "N"}
              onChange={(e) => handleChange("menu_hide", e.target.value)}
            >
              <option value="N">No (Visible)</option>
              <option value="Y">Yes (Hidden)</option>
            </select>
          </div>
        </div>
      </div>

      <ERPFooter
        isAddMode={!isEdit && !isView}
        isEditMode={isEdit && !isView}
        isViewMode={isView}
        saving={saving}
        handleSubmit={handleSubmit}
       onModify={rights.mod === 1 ? onModify : null} 
        onDelete={rights.del === 1 ? onDelete : null}
        onEditCancel={onEditCancel}
        onCancel={onCancel}
        formData={formData}
      />
    </div>
  );
};

export default MenuMasterForm;