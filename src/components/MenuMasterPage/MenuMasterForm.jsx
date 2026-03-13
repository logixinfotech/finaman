import { useState, useRef, useMemo } from "react";
import {
  AddButton,
  UpdateButton,
  CancelButton,
} from "../Reusable/ActionButon";

const padOptions = [
  { value: "Entries", module: "Finance" },
  { value: "Reports", module: "Finance" },
  { value: "Install", module: "Admin" },
  { value: "Utility", module: "Admin" },
];

const MenuMasterForm = ({
  modules,
  formData,
  setFormData,
  onSave,
  onCancel,
  saving,
}) => {

  const isEditMode = !!formData.masmnu_id;

  const [errors, setErrors] = useState({});
  const inputRefs = useRef([]);
  inputRefs.current = [];

  const setInputRef = (el) => {
    if (el && !inputRefs.current.includes(el)) inputRefs.current.push(el);
  };

  const focusNextInput = (current) => {
    const index = inputRefs.current.indexOf(current);
    if (index < inputRefs.current.length - 1) {
      inputRefs.current[index + 1].focus();
    }
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

  const selectedModule = modules.find(
    (m) => m.masmod_id === formData.masmod_id
  );

  const filteredPads = useMemo(() => {
    if (!selectedModule) return [];
    return padOptions.filter(
      (p) => p.module === selectedModule.mod_name
    );
  }, [selectedModule]);

const inputClass =
"w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs shadow-sm hover:border-gray-300 focus:border-[var(--sidebar-accent-bg)] focus:ring-2 focus:ring-[var(--sidebar-accent-bg)/20] outline-none transition";

  const labelClass =
    "text-[10px] font-semibold text-gray-500 tracking-wide uppercase";

  const errorText = "text-[10px] text-red-500 mt-1";

  return (
    <div className="w-full max-w-7xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 flex flex-col min-h-[calc(100vh-160px)]">
 

      <div
        className="px-5 py-1.5 rounded-t-xl flex justify-between items-center text-white"
        style={{ background: "var(--sidebar-top-bg)" }}
      >

        <h2 className="text-lg font-semibold tracking-wide">
          Menu Master
        </h2>

        <span
          className="text-[11px] font-semibold px-3 py-[2px] rounded-md"
          style={{
            background: "var(--accent-soft)",
            color: "var(--bg-active)",
            border: "1px solid var(--bg-active)"
          }}
        >
          {isEditMode ? "EDIT MODE" : "NEW ENTRY"}
        </span>

      </div> 
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
              className={`${inputClass} ${errors.masmod_id ? "border-red-500" : ""}`}
              value={formData.masmod_id || ""}
              onChange={(e) =>
                handleChange("masmod_id", Number(e.target.value))
              }
              onKeyDown={handleKeyDown}
            >
              <option value="">Select Module</option>

              {modules.map((m) => (
                <option key={m.masmod_id} value={m.masmod_id}>
                  {m.mod_name}
                </option>
              ))}

            </select>

            {errors.masmod_id && <p className={errorText}>{errors.masmod_id}</p>}
          </div> 
<div>
  <label className={labelClass}>Pad Name *</label>

  <select
    ref={setInputRef}
    className={`${inputClass} ${errors.pad_name ? "border-red-500" : ""}`}
    value={formData.pad_name || ""}
    onChange={(e) =>
      handleChange("pad_name", e.target.value)
    }
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
              className={inputClass}
              value={formData.item_type || ""}
              onChange={(e) =>
                handleChange("item_type", e.target.value)
              }
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
            <input className={`${inputClass} bg-gray-100`} value={formData.srl_no || ""} disabled />
          </div>
 
          <div>
            <label className={labelClass}>Bar Serial</label>
            <input className={`${inputClass} bg-gray-100`} value={formData.bar_srl || ""} disabled />
          </div> 

          <div className="xl:col-span-2 md:col-span-2">
            <label className={labelClass}>Menu Name *</label>

            <input
              ref={setInputRef}
              className={`${inputClass} ${errors.bar_name ? "border-red-500" : ""}`}
              value={formData.bar_name || ""}
              onChange={(e) =>
                handleChange("bar_name", e.target.value)
              }
              onKeyDown={handleKeyDown}
            />

            {errors.bar_name && <p className={errorText}>{errors.bar_name}</p>}
          </div> 

          <div>
            <label className={labelClass}>Application Type</label>

            <select
              ref={setInputRef}
              className={inputClass}
              value={formData.appl_type || ""}
              onChange={(e) =>
                handleChange("appl_type", e.target.value)
              }
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
              className={inputClass}
              value={formData.appl_name || ""}
              onChange={(e) =>
                handleChange("appl_name", e.target.value)
              }
              onKeyDown={handleKeyDown}
            />
          </div> 

          <div className="xl:col-span-2 md:col-span-2">
            <label className={labelClass}>Parameters</label>

            <input
              ref={setInputRef}
              className={inputClass}
              value={formData.appl_para || ""}
              onChange={(e) =>
                handleChange("appl_para", e.target.value)
              }
              onKeyDown={handleKeyDown}
            />
          </div>

        </div>

      </div> 

      <div className="flex justify-end items-center px-5 py-2 border-t bg-white gap-3">

        {isEditMode ? (
          <UpdateButton disabled={saving} onClick={handleSubmit} />
        ) : (
          <AddButton disabled={saving} onClick={handleSubmit} />
        )}

        <CancelButton onClick={onCancel} />

      </div>

    </div>
  );
};

export default MenuMasterForm;