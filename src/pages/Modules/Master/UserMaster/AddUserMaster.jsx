import { useState, useRef, useEffect, useCallback } from "react";
import SignatureCanvas from "react-signature-canvas";
import ERPHeader from "../../../../components/Reusable/form/HeaderForm";
import ERPFooter from "../../../../components/Reusable/form/FooterForm";
import ERPAutocomplete from "../../../../components/Reusable/input/ERPAutocomplete";
import { fetchUserGroups, createUserGroup } from "../../../../utils/api";
import UserGroupForm from "./UserGroupform";
import { showToast } from "../../../../components/Reusable/alert";

const VALIDATION_RULES = {
  user_type: { required: true, label: "User Type" },
  user_name: { required: true, label: "User Name" },
  user_id:   { required: true, label: "User ID" },
  password:  { required: true, label: "Password" },
};

const AddUserMaster = ({
  formData, setFormData, onSave, onCancel, onDelete, mode,
  saving, onModify, onNewEntry, onEditCancel, canPrint,
  onPrint, currentRecord, totalRecords, onOpenPage, rights,
  activeTab, onTabChange,
}) => {
  const [errors, setErrors]                 = useState({});
  const [showSignPad, setShowSignPad]       = useState(false);
  const [userGroups, setUserGroups]         = useState([]);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [newGroupData, setNewGroupData]     = useState({ group_name: "", remarks: "" });
  const [isQuickSaving, setIsQuickSaving]   = useState(false);
  const sigPadRef    = useRef(null);
  const fileInputRef = useRef(null);

  const isViewMode = mode === "view";
  const isAddMode  = mode === "add";
  const isEditMode = mode === "edit";

  const ic = (fieldName, extra = "") =>
    [
      "h-[30px] px-2 text-[13px] border rounded outline-none transition-all duration-150",
      extra,
      errors[fieldName]
        ? "border-red-400 bg-red-50"
        : "border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-100",
      isViewMode
        ? "bg-gray-100 text-gray-500 border-gray-200 pointer-events-none"
        : "bg-white text-gray-800",
    ].join(" ");

  // ── fixed label width — same as ShiftMaster ──
  const lc = "w-[130px] shrink-0 text-[12px] font-bold text-gray-600";

  const SectionLabel = ({ children }) => (
    <div className="flex items-center gap-2 pt-3 pb-1.5 border-b border-gray-200 mb-1">
      <div className="w-1 h-3 rounded-sm bg-blue-500" />
      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{children}</span>
    </div>
  );

  useEffect(() => {
    if (isAddMode || isEditMode) {
      setTimeout(() => {
        const el = document.getElementById("user-master-form-container")
          ?.querySelector("input:not([disabled])");
        if (el) el.focus();
      }, 150);
    }
  }, [isAddMode, isEditMode]);

  const handleChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field])
      setErrors(prev => { const e = { ...prev }; delete e[field]; return e; });
  }, [errors, setFormData]);

  const validateForm = () => {
    const newErrors = {};
    Object.keys(VALIDATION_RULES).forEach(field => {
      if (VALIDATION_RULES[field].required && !formData[field]?.toString().trim())
        newErrors[field] = `${VALIDATION_RULES[field].label} is required`;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveAttempt = () => { if (validateForm()) onSave(); };

  const handleKeyDown = useCallback((e) => {
    if (isViewMode) return;
    const container = document.getElementById("user-master-form-container");
    const elements = Array.from(
      container.querySelectorAll("input:not([disabled]), textarea:not([disabled])")
    );
    const index = elements.indexOf(e.target);
    if (e.key === "Enter") {
      if (e.target.tagName === "TEXTAREA") return;
      e.preventDefault();
      if (index < elements.length - 1) elements[index + 1].focus();
      else handleSaveAttempt();
    }
    if (e.key === "Backspace") {
      if ((!e.target.value || e.target.selectionStart === 0) && index > 0) {
        e.preventDefault();
        elements[index - 1].focus();
      }
    }
  }, [isViewMode, handleSaveAttempt]);

  const loadGroups = useCallback(async () => {
    try {
      const response = await fetchUserGroups();
      if (response.success)
        setUserGroups(response.data.map(g => g.group_name));
    } catch (err) { console.error("Failed to load groups", err); }
  }, []);

  useEffect(() => { loadGroups(); }, [loadGroups]);

  const handleQuickAddGroup = async () => {
    if (!newGroupData.group_name) return alert("Group Name is required");
    try {
      setIsQuickSaving(true);
      const response = await createUserGroup(newGroupData);
      if (response.success) {
        await loadGroups();
        handleChange("user_group", newGroupData.group_name.toUpperCase());
        setShowGroupModal(false);
        setNewGroupData({ group_name: "", remarks: "" });
        showToast({ icon: "success", title: "Group Created Successfully" });
      }
    } catch (err) { console.error(err); }
    finally { setIsQuickSaving(false); }
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col h-[calc(100vh-120px)] overflow-hidden bg-white rounded-xl shadow border border-gray-200">

      <ERPHeader
        title="User Master"
        isAddMode={isAddMode}
        isEditMode={isEditMode}
        isViewMode={isViewMode}
        rightContent={`${currentRecord} / ${totalRecords}`}
        activeTab={activeTab}
        onTabChange={onTabChange}
      />

      <div className="flex-1 overflow-y-auto">
        <div id="user-master-form-container" className="px-4 py-2">

          {/* ── USER INFORMATION ── */}
          <SectionLabel>User Information</SectionLabel>

          {/* User Type */}
          <div className="flex items-center gap-3 py-1.5 border-b border-gray-50">
            <span className={lc}>User Type <span className="text-red-400">*</span></span>
            <div className="flex flex-col">
              <ERPAutocomplete
                value={formData.user_type || ""}
                options={["User", "Admin"]}
                onChange={(val) => handleChange("user_type", val)}
                className={ic("user_type", "w-[200px]")}
                disabled={isViewMode}
                placeholder="Select type"
              />
              {errors.user_type && <span className="text-[10px] text-red-500 mt-0.5">{errors.user_type}</span>}
            </div>
          </div>

          {/* User Group */}
          <div className="flex items-center gap-3 py-1.5 border-b border-gray-50">
            <span className={lc}>User Group</span>
            <ERPAutocomplete
              value={formData.user_group || ""}
              options={userGroups}
              onChange={(val) => handleChange("user_group", val)}
              className={ic("user_group", "w-[200px]")}
              disabled={isViewMode}
              placeholder="Select group"
              showAddIfNoMatch={!isViewMode}
              addLabel="Add New Group"
              onAddClick={(typedValue) => {
                setNewGroupData({ group_name: typedValue.toUpperCase(), remarks: "" });
                setShowGroupModal(true);
              }}
            />
          </div>

          {/* User Name */}
          <div className="flex items-center gap-3 py-1.5 border-b border-gray-50">
            <span className={lc}>User Name <span className="text-red-400">*</span></span>
            <div className="flex flex-col">
              <input
                value={formData.user_name || ""}
                onChange={(e) => handleChange("user_name", e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isViewMode}
                placeholder="Full name"
                className={ic("user_name", "w-[200px]")}
              />
              {errors.user_name && <span className="text-[10px] text-red-500 mt-0.5">{errors.user_name}</span>}
            </div>
          </div>

          {/* User ID */}
          <div className="flex items-center gap-3 py-1.5 border-b border-gray-50">
            <span className={lc}>User ID <span className="text-red-400">*</span></span>
            <div className="flex flex-col">
              <input
                value={formData.user_id || ""}
                onChange={(e) => handleChange("user_id", e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isViewMode || isEditMode}
                placeholder="Login username"
                className={ic("user_id", "w-[200px]")}
              />
              {errors.user_id && <span className="text-[10px] text-red-500 mt-0.5">{errors.user_id}</span>}
            </div>
          </div>

          {/* ── SECURITY ── */}
          <SectionLabel>Security & Authentication</SectionLabel>

          {/* Password */}
          <div className="flex items-center gap-3 py-1.5 border-b border-gray-50">
            <span className={lc}>Login Password <span className="text-red-400">*</span></span>
            <div className="flex flex-col">
              <input
                type="password"
                value={formData.password || ""}
                onChange={(e) => handleChange("password", e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isViewMode}
                placeholder="••••••••"
                className={ic("password", "w-[200px]")}
              />
              {errors.password && <span className="text-[10px] text-red-500 mt-0.5">{errors.password}</span>}
            </div>
          </div>

          {/* Settings Password */}
          <div className="flex items-center gap-3 py-1.5 border-b border-gray-50">
            <span className={lc}>Settings Pass</span>
            <input
              type="password"
              value={formData.setting_pass || ""}
              onChange={(e) => handleChange("setting_pass", e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isViewMode}
              placeholder="••••••••"
              className={ic("setting_pass", "w-[200px]")}
            />
          </div>

          {/* ── AUTHORIZATION ── */}
          <SectionLabel>Authorization</SectionLabel>

          {/* Signature */}
          <div className="flex items-center gap-3 py-1.5">
            <span className={lc}>Signature</span>
            <div className="flex items-center gap-2">
              <div className="w-[80px] h-[30px] border border-gray-200 rounded bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
                {formData.signature
                  ? <img src={formData.signature} alt="sig" className="max-h-full object-contain" />
                  : <span className="text-[10px] text-gray-300 italic">No preview</span>
                }
              </div>
              {formData.signature
                ? <span className="text-[11px] text-green-600 font-bold">✔ Attached</span>
                : <span className="text-[11px] text-gray-400">Not set</span>
              }
              {!isViewMode && (
                <div className="flex gap-1">
                  <button type="button" onClick={() => setShowSignPad(true)}
                    className="h-[28px] px-2 text-[11px] font-bold border border-gray-300 rounded text-gray-600 hover:bg-gray-50">
                    Draw
                  </button>
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="h-[28px] px-2 text-[11px] font-bold border border-gray-300 rounded text-gray-600 hover:bg-gray-50">
                    Upload
                  </button>
                  {formData.signature && (
                    <button type="button" onClick={() => handleChange("signature", null)}
                      className="h-[28px] px-2 text-[11px] font-bold border border-red-200 rounded text-red-500 hover:bg-red-50">
                      Remove
                    </button>
                  )}
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => handleChange("signature", reader.result);
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      <ERPFooter
        isAddMode={isAddMode}
        isViewMode={isViewMode}
        isEditMode={isEditMode}
        onEditCancel={onEditCancel}
        saving={saving}
        handleSubmit={handleSaveAttempt}
        formData={formData}
        onDelete={rights?.delete === 1 ? () => onDelete(formData) : null}
        onPrint={rights?.print  === 1 ? () => onPrint(formData)  : null}
        onCancel={onCancel}
        onNewEntry={rights?.add  === 1 ? onNewEntry : null}
        canPrint={canPrint}
        onModify={rights?.edit  === 1 ? onModify   : null}
      />

      {/* ── Signature draw modal ── */}
      {showSignPad && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100]">
          <div className="bg-white p-5 rounded-xl shadow-2xl border w-[420px]">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-[13px] font-bold text-gray-700">Draw Signature</h3>
              <button onClick={() => setShowSignPad(false)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">✕</button>
            </div>
            <div className="border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
              <SignatureCanvas ref={sigPadRef} canvasProps={{ width: 380, height: 160, className: "signature-canvas" }} />
            </div>
            <div className="flex justify-end gap-2 mt-3">
              <button onClick={() => sigPadRef.current.clear()}
                className="px-3 py-1.5 text-[12px] font-bold text-gray-600 bg-gray-100 rounded hover:bg-gray-200">
                Clear
              </button>
              <button onClick={() => {
                handleChange("signature", sigPadRef.current.getCanvas().toDataURL("image/png"));
                setShowSignPad(false);
              }} className="px-3 py-1.5 text-[12px] font-bold text-white bg-blue-600 rounded hover:bg-blue-700">
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Quick Add Group modal ── */}
      {showGroupModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md shadow-2xl">
            <UserGroupForm
              formData={newGroupData}
              setFormData={setNewGroupData}
              onSave={handleQuickAddGroup}
              onCancel={() => setShowGroupModal(false)}
              mode="add"
              saving={isQuickSaving}
              currentRecord={1}
              totalRecords={1}
              rights={{ add: 1 }}
            />
          </div>
        </div>
      )}

    </div>
  );
};

export default AddUserMaster;