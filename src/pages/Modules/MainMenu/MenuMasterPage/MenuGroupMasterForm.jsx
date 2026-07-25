import React, { useState, useRef, useEffect } from "react";
import ERPFooter from "../../../../components/Reusable/form/FooterForm";
import ERPHeader from "../../../../components/Reusable/form/HeaderForm";
import { focusSaveOrUpdateButton } from "../../../../utils/erpShortcuts";
import ERPAutoComplete from "../../../../components/Reusable/input/ERPAutocomplete";

const FONT = `'Inter', 'Tahoma', system-ui, sans-serif`;
const inputClass = "h-[30px] px-2 text-[13px] border border-gray-300 rounded-md bg-white focus:border-blue-500 outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed";
const labelClass = "text-[12px] font-medium text-gray-600 w-[120px]";
const errorText = "text-[10px] text-red-500 mt-0.5";

const PAD_TYPE_MAP = { 1: "Entries", 2: "Reports", 3: "Utility" };
const PAD_TYPE_OPTIONS = Object.values(PAD_TYPE_MAP);

const HIDE_MAP = { N: "No (Visible)", Y: "Yes (Hidden)" };
const HIDE_OPTIONS = Object.values(HIDE_MAP);

const codeFromLabel = (map, label) =>
  Object.keys(map).find((code) => map[code] === label) || "";

const MenuGroupMasterForm = ({
  mode, modules, formData, setFormData, onSave, onCancel,
  saving, onDelete, onModify, onEditCancel, rights,
  currentRecord, totalRecords, activeTab, onTabChange, onNewEntry,
  onPrevRecord, onNextRecord,
}) => {
  const isView = mode === "view";
  const isEdit = mode === "edit";
  const isAdd = mode === "add";

  const saveBtnRef = useRef(null);
  const containerRef = useRef(null);
  const [errors, setErrors] = useState({});

  // Local text state — MenuMasterForm wala hi pattern, typing free rehti hai
  const [moduleText, setModuleText] = useState("");
  const [padText, setPadText] = useState("");
  const [hideText, setHideText] = useState("");

  useEffect(() => {
    const mod = modules.find((m) => m.masmod_id === formData.masmod_id);
    setModuleText(mod?.mod_name || "");
    setPadText(PAD_TYPE_MAP[formData.pad_type] || "");
    setHideText(HIDE_MAP[formData.grp_hide || "N"] || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.masmod_id, formData.pad_type, formData.grp_hide, modules]);

  useEffect(() => {
    if (!isView) {
      setTimeout(() => {
        containerRef.current?.querySelector("input:not([disabled])")?.focus();
      }, 150);
    }
  }, [mode, isView]);

  const handleKeyDown = (e) => {
    if (isView) return;
    const elements = Array.from(
      containerRef.current.querySelectorAll("input:not([disabled]), button:not([disabled])")
    );
    const index = elements.indexOf(e.target);

    if (e.key === "Enter") {
      e.preventDefault();
      if (index > -1 && index < elements.length - 1) elements[index + 1].focus();
      else focusSaveOrUpdateButton(saveBtnRef);
      return;
    }
    if (e.shiftKey && e.key === "Backspace") {
      e.preventDefault();
      if (index > 0) elements[index - 1].focus();
    }
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) setErrors((p) => ({ ...p, [field]: null }));
  };

  const handleModuleChange = (typed) => {
    setModuleText(typed || "");
    const picked = modules.find((m) => m.mod_name === typed);
    if (picked) {
      setFormData({ ...formData, masmod_id: picked.masmod_id });
      if (errors.masmod_id) setErrors((p) => ({ ...p, masmod_id: null }));
    } else if (typed === "") {
      setFormData({ ...formData, masmod_id: "" });
    }
  };

  const handlePadChange = (typed) => {
    setPadText(typed || "");
    const code = codeFromLabel(PAD_TYPE_MAP, typed);
    if (code) handleChange("pad_type", code);
  };

  const handleHideChange = (typed) => {
    setHideText(typed || "");
    const code = codeFromLabel(HIDE_MAP, typed);
    if (code) handleChange("grp_hide", code);
  };

  const validateForm = () => {
    const e = {};
    if (!formData.masmod_id) e.masmod_id = "Required";
    if (!formData.pad_type) e.pad_type = "Required";
    if (!formData.grp_name?.trim()) e.grp_name = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    onSave();
  };

  return (
    <div className="w-full h-[calc(100vh-100px)] bg-[#eef1f6] flex flex-col" style={{ fontFamily: FONT }}>
      <ERPHeader
        title="Menu Group Master"
        isAddMode={isAdd}
        isEditMode={isEdit && !isView}
        isViewMode={isView}
        activeTab={activeTab}
        onTabChange={onTabChange}
        rightContent={`${currentRecord || 1} / ${totalRecords || 1}`}
        currentIndex={currentRecord}
        totalRecords={totalRecords}
        onPrevRecord={onPrevRecord}
        onNextRecord={onNextRecord}
      />

      <div className="flex-1 p-4 flex justify-center items-start overflow-y-auto">
        <div ref={containerRef} className="w-full max-w-[750px] mx-auto bg-white border rounded-lg p-6 shadow-sm">
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">

            {/* Module */}
            <div className="flex flex-col">
              <div className="flex items-center">
                <label className={labelClass}>Module <span className="text-red-500">*</span></label>
                <ERPAutoComplete
                  disabled={isView}
                  className={`${inputClass} flex-1 ${errors.masmod_id ? "border-red-500" : ""}`}
                  value={moduleText}
                  onChange={handleModuleChange}
                  onKeyDown={handleKeyDown}
                  options={modules.map((m) => m.mod_name)}
                />
              </div>
              {errors.masmod_id && <p className={`${errorText} ml-[120px]`}>{errors.masmod_id}</p>}
            </div>

            {/* Section */}
            <div className="flex flex-col">
              <div className="flex items-center">
                <label className={labelClass}>Section <span className="text-red-500">*</span></label>
                <ERPAutoComplete
                  disabled={isView}
                  className={`${inputClass} flex-1 ${errors.pad_type ? "border-red-500" : ""}`}
                  value={padText}
                  onChange={handlePadChange}
                  onKeyDown={handleKeyDown}
                  options={PAD_TYPE_OPTIONS}
                />
              </div>
              {errors.pad_type && <p className={`${errorText} ml-[120px]`}>{errors.pad_type}</p>}
            </div>

            {/* Group Name */}
             
              <div className="flex items-center">
                <label className={labelClass}>Group Name <span className="text-red-500">*</span></label>
                <input
                  disabled={isView}
                  className={`${inputClass} flex-1 ${errors.grp_name ? "border-red-500" : ""}`}
                  value={formData.grp_name || ""}
                  placeholder="e.g. Leave Management"
                  onChange={(e) => handleChange("grp_name", e.target.value)}
                  onKeyDown={handleKeyDown}
                />
              </div>
              {errors.grp_name && <p className={`${errorText} ml-[120px]`}>{errors.grp_name}</p>}
            

            {/* Serial No */}
            <div className="flex items-center">
              <label className={labelClass}>Serial No</label>
              <input
                type="number"
                disabled={isView}
                className={`${inputClass} flex-1`}
                value={formData.srl_no ?? ""}
                placeholder="Auto"
                onChange={(e) => handleChange("srl_no", e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>

            {/* Icon */}
            <div className="flex items-center">
              <label className={labelClass}>Icon Name</label>
              <input
                disabled={isView}
                className={`${inputClass} flex-1`}
                value={formData.icon_name || ""}
                placeholder="e.g. FaCalendarAlt"
                onChange={(e) => handleChange("icon_name", e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>

            {/* Hide */}
           <div className="flex items-center">
              <label className={labelClass}>Is Hidden?</label>
              <ERPAutoComplete
                disabled={isView}
                className={`${inputClass} flex-1`}
                value={hideText}
                onChange={handleHideChange}
                onKeyDown={handleKeyDown}
                options={HIDE_OPTIONS}
              />
            </div>
 
          </div>
        </div>
      </div>

      <ERPFooter
        isAddMode={isAdd}
        isEditMode={isEdit && !isView}
        isViewMode={isView}
        saving={saving}
        saveBtnRef={saveBtnRef}
        handleSubmit={handleSubmit}
        onModify={rights.mod === 1 ? onModify : null}
        onDelete={rights.del === 1 ? onDelete : null}
        onEditCancel={onEditCancel}
        onCancel={onCancel}
        formData={formData}
        rights={rights}
        onNewEntry={onNewEntry}
      />
    </div>
  );
};

export default MenuGroupMasterForm;