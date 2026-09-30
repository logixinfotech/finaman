
import React, { useState, useEffect, useCallback, useRef } from "react";
import SignatureCanvas from "react-signature-canvas";
import ERPHeader from "../../../../components/Reusable/form/HeaderForm";
import ERPFooter from "../../../../components/Reusable/form/FooterForm";
import ERPAutocomplete from "../../../../components/Reusable/input/ERPAutocomplete";
import { fetchUserGroups, createUserGroup } from "../../../../utils/api";
import UserGroupForm from "./UserGroupform";
import { showToast } from "../../../../components/Reusable/alert";
import { useGroupOptions } from "../../../../Hooks/useUserGroupOption";

const FONT = `'Inter', 'Tahoma', system-ui, sans-serif`;


const AddUserMaster = ({
  formData,
  setFormData,
  mode = "view",
  onSave,
  onCancel,
  onPrevRecord,
  onNextRecord,
  onDelete,
  onEditCancel,
  saving,
  onModify,
  onNewEntry,
  currentRecord,
  totalRecords,
  rights,
  activeTab = "entry",
  onTabChange,
}) => {

  const [errors, setErrors] = useState({});
  const [userGroups, setUserGroups] = useState([]);
  const [showSignPad, setShowSignPad] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [newGroupData, setNewGroupData] = useState({ group_name: "", remarks: "" });
  const [isQuickSaving, setIsQuickSaving] = useState(false);

  const sigPadRef = useRef(null);
  const fileInputRef = useRef(null);
  const clearRef = useRef(null);
  const signatureBtnRef = useRef(null);

  const isViewMode = mode === "view";
  const isEditMode = mode === "edit";
  const isAddMode = mode === "add";
  const requiredFields = isEditMode
    ? ["user_type", "user_name", "user_id"]
    : ["user_type", "user_name", "user_id", "password"];


  // LOAD GROUPS
  const loadGroups = useCallback(async () => {
    try {
      const res = await fetchUserGroups();
      if (res.success) {
        setUserGroups(res.data.map(g => g.group_name));
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);
  const saveBtnRef = useRef(null)
  useEffect(() => {
    if (!showGroupModal) return;

    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setShowGroupModal(false);
      }
    };

    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [showGroupModal]);

  const { options, loading } = useGroupOptions();

  // AUTO FOCUS
  useEffect(() => {
    if (isAddMode || isEditMode) {
      setTimeout(() => {
        const firstInput = document.querySelector(
          "#user-master-container input:not([disabled])"
        );
        if (firstInput) firstInput.focus();
      }, 150);
    }
  }, [isAddMode, isEditMode]);

  // ESC CLOSE SIGN MODAL + RETURN FOCUS
  useEffect(() => {
    if (!showSignPad) return;

    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setShowSignPad(false);
        setTimeout(() => signatureBtnRef.current?.focus(), 100);
      }
    };

    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [showSignPad]);

  // MODAL AUTO FOCUS
  useEffect(() => {
    if (showSignPad) {
      setTimeout(() => {
        clearRef.current?.focus();
      }, 100);
    }
  }, [showSignPad]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    if (errors[field]) {
      setErrors(prev => {
        const e = { ...prev };
        delete e[field];
        return e;
      });
    }
  };

  const handleCloseGroupModal = useCallback(() => {
    setShowGroupModal(false);

    // optional: focus wapas
    setTimeout(() => {
      signatureBtnRef.current?.focus(); // ya groupBtnRef agar use kar raha hai
    }, 100);
  }, []);

  useEffect(() => {
    if (!showGroupModal) return;

    const handleEsc = (e) => {
      if (e.key === "Escape") {
        handleCloseGroupModal(); // 👈 SAME FUNCTION
      }
    };

    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [showGroupModal, handleCloseGroupModal]);

  // 👉 FIXED HEIGHT FOR MOBILE: h-[38px] for mobile, sm:h-[30px] for desktop
  const getInputClass = (disabled, field) =>
    `h-[38px] sm:h-[30px] px-2 text-[15px] border rounded-md ${errors[field] ? "border-red-500" : "border-gray-300"
    } ${disabled ? "bg-gray-100 cursor-not-allowed" : "bg-white focus:border-blue-500"}`;

  // VALIDATION
  const handleValidateAndSave = useCallback(() => {
    if (isViewMode) return;

    let newErrors = {};
    let firstEmpty = null;

    requiredFields.forEach(field => {
      if (!formData[field]) {
        newErrors[field] = "Required";
        if (!firstEmpty) firstEmpty = field;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);

      setTimeout(() => {
        const el = document.querySelector(`[name="${firstEmpty}"]`);
        if (el) el.focus();
      }, 50);

      return;
    }

    onSave && onSave(formData);
  }, [formData, isViewMode, onSave]);

  // KEYBOARD NAVIGATION (UPDATED)
  const handleKeyDown = useCallback((e) => {
    if (isViewMode) return;

    const container = document.getElementById("user-master-container");
    if (!container) return;

    // Sort elements with 18px tolerance for perfect L-to-R, T-to-B navigation
    const elements = Array.from(
      container.querySelectorAll(
        "input:not([disabled]), button[data-auto]:not([disabled]), [tabindex='0']"
      )
    )
      .filter(el => !el.disabled && el.offsetParent !== null)
      .sort((a, b) => {
        const aRect = a.getBoundingClientRect();
        const bRect = b.getBoundingClientRect();
        if (Math.abs(aRect.top - bRect.top) > 18) return aRect.top - bRect.top;
        return aRect.left - bRect.left;
      });

    const index = elements.indexOf(e.target);
    if (index === -1) return;

    // 🔴 ENTER → ALWAYS NEXT (NO CLICK)
    if (e.key === "Enter") {
      e.preventDefault(); // 👈 Prevents native button click on Enter

      if (index < elements.length - 1) {
        elements[index + 1].focus();
      } else {
        saveBtnRef?.current?.focus();
      }
    }

    // 🔵 SPACE → CLICK ONLY FOR BUTTON
    if (e.key === " " && e.target.tagName === "BUTTON") {
      e.preventDefault(); // Prevents page from scrolling down
      e.target.click();   // Manual trigger
    }

    // 🟡 BACKSPACE → GO BACK ONLY IF EMPTY
    if (e.shiftKey && e.key === "Backspace") {
      let shouldGoBack = true;

      if (e.target.tagName === "INPUT") {
        const isEmpty = e.target.value === "";
        const atStart = e.target.selectionStart === 0 && e.target.selectionEnd === 0;
        if (isEmpty || atStart) shouldGoBack = true;
      } else if (e.target.tagName === "BUTTON" || e.target.dataset.auto) {
        // Buttons (Draw/Upload) par backspace dabane se directly pichhe jao
        shouldGoBack = true;
      }

      if (shouldGoBack && index > 0) {
        e.preventDefault();
        const prevEl = elements[index - 1];
        prevEl.focus();

        // Cursor set to end if text input

        const len = prevEl.value?.length || 0;
        try { prevEl.setSelectionRange(len, len); } catch { }

      }
    }
  }, [isViewMode]);

  // 🟢 SIGNATURE PAD KEYBOARD NAVIGATION
  const handleSignPadKeyDown = useCallback((e) => {
    // 1. ESC dabane par modal band aur focus wapas Draw button par
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      setShowSignPad(false);
      setTimeout(() => signatureBtnRef.current?.focus(), 100);
      return;
    }

    const modalContainer = document.getElementById("sign-pad-modal");
    if (!modalContainer) return;

    // Modal ke saare buttons (Clear, Cancel, Save) nikal lo
    const buttons = Array.from(modalContainer.querySelectorAll("button"));
    const index = buttons.indexOf(e.target);

    if (index === -1) return;

    // 2. RIGHT ARROW -> Agla button
    if (e.key === "ArrowRight") {
      e.preventDefault();
      if (index < buttons.length - 1) {
        buttons[index + 1].focus();
      }
    }
    // 3. LEFT ARROW -> Pichla button
    else if (e.key === "ArrowLeft") {
      e.preventDefault();
      if (index > 0) {
        buttons[index - 1].focus();
      }
    }
    // 4. ENTER ya SPACE -> Button par Click kar do
    else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      e.target.click();
    }
  }, []);

  // QUICK ADD GROUP
  const handleQuickAddGroup = async () => {
    if (!newGroupData.group_name) return;

    setIsQuickSaving(true);
    const res = await createUserGroup(newGroupData);

    if (res.success) {
      await loadGroups();
      handleChange("user_group", newGroupData.group_name.toUpperCase());
      setShowGroupModal(false);
      showToast({ icon: "success", title: "Group Created" });
    }

    setIsQuickSaving(false);
  };

  return (
    <div className="w-full h-full  sm:h-[calc(100vh-100px)] bg-[#eef1f6] flex flex-col overflow-hidden font-sans" style={{ fontFamily: FONT }}>


      <ERPHeader
        title="User Master"
        isAddMode={isAddMode}
        isEditMode={isEditMode}
        isViewMode={isViewMode}
        activeTab={activeTab}
        onTabChange={onTabChange}
        rightContent={`${currentRecord || 1} / ${totalRecords || 1}`}
        currentIndex={currentRecord}      // 👈
        totalRecords={totalRecords}        // 👈
        onPrevRecord={onPrevRecord}        // 👈
        onNextRecord={onNextRecord}
      />

      <div className="flex-1 p-4 overflow-x-auto flex justify-start sm:justify-center items-start w-full">
        <div
          id="user-master-container"
          className="w-full max-w-[800px] bg-white border rounded-md p-4"
        >

          {/* ROW 1 */}
          <div className="flex flex-col sm:flex-row sm:items-center mb-3 sm:mb-2 gap-1 sm:gap-0">
            <label className="w-full sm:w-[110px]">
              User Name <span className="text-red-500">*</span>
            </label>
            <input
              name="user_name"
              value={formData.user_name || ""}
              disabled={isViewMode}
              onChange={(e) => handleChange("user_name", e.target.value)}
              onKeyDown={handleKeyDown}
              className={`${getInputClass(isViewMode, "user_name")} w-full sm:flex-1`}
            />
          </div>

          {/* ROW 2 */}
          <div className="flex flex-col sm:grid sm:grid-cols-2 sm:items-center gap-4 sm:gap-2">

            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <label className="w-full sm:w-[102px]">
                User ID <span className="text-red-500">*</span>
              </label>
              <input
                name="user_id"
                value={formData.user_id || ""}
                disabled={isViewMode || isEditMode}
                onChange={(e) => handleChange("user_id", e.target.value)}
                onKeyDown={handleKeyDown}
                className={`${getInputClass(isViewMode, "user_id")} w-full sm:w-auto`}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-1 sm:gap-0">
              <label className="w-full sm:w-[110px]">
                User Type <span className="text-red-500">*</span>
              </label>
              <ERPAutocomplete
                data-auto
                value={formData.user_type || ""}
                options={["User", "Admin", "SuperUser"]}
                onChange={(val) => handleChange("user_type", val)}
                disabled={isViewMode}
                onKeyDown={handleKeyDown}
                className={`${getInputClass(isViewMode, "user_type")} w-full sm:w-auto flex-1 `}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-1 sm:gap-0">
              <label className="w-full sm:w-[110px]">Department</label>
              <ERPAutocomplete
                data-auto
                value={formData.user_group || ""}
                options={(options.department || []).map((g) => g.label)}
                onChange={(val) => handleChange("user_group", val)}
                disabled={isViewMode}
                onKeyDown={handleKeyDown}
                className={`${getInputClass(isViewMode, "user_group")} w-full sm:w-auto `}
                showAddIfNoMatch={!isViewMode}
                onAddClick={(val) => {
                  setNewGroupData({ group_name: val.toUpperCase() });
                  setShowGroupModal(true);
                }}
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <label className="w-full sm:w-[102px]">
                Password {!isEditMode && <span className="text-red-500">*</span>}
              </label>
              <input
                type="password"
                name="password"
                value={formData.password || ""}
                disabled={isViewMode}
                placeholder={isEditMode ? "Leave blank to keep current" : ""}
                onChange={(e) => handleChange("password", e.target.value)}
                onKeyDown={handleKeyDown}
                className={`${getInputClass(isViewMode, "password")} w-full sm:w-auto`}
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2 sm:mb-2">
              <label className="w-full sm:w-[102px]">Settings Pass</label>
              <input
                type="password"
                name="setting_pass"
                value={formData.setting_pass || ""}
                disabled={isViewMode}
                onChange={(e) => handleChange("setting_pass", e.target.value)}
                onKeyDown={handleKeyDown}
                className={`${getInputClass(isViewMode, "setting_pass")} w-full sm:w-auto`}
              />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <label className="w-full sm:w-[102px]">Block</label>
              <label className="flex items-center gap-2 h-[38px] sm:h-[30px]">
                <input
                  type="checkbox"
                  name="block"
                  checked={String(formData.block) === "1"}
                  disabled={isViewMode}
                  onChange={(e) => handleChange("block", e.target.checked ? 1 : 0)}
                  onKeyDown={handleKeyDown}
                  className="w-4 h-4 accent-blue-600"
                />
                <span className="text-[13px] text-gray-600">
                  {String(formData.block) === "1" ? "Blocked" : "Active"}
                </span>
              </label>
            </div>
          </div>

          {/* SIGNATURE */}
          <div className="sm:col-span-2 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-2 sm:mt-0">
            <label className="w-full sm:w-[100px]">Signature</label>

            <div className="flex items-center gap-3">
              <div className="w-[190px] h-[60px] border border-dashed flex items-center justify-center">
                {formData.signature ? (
                  <img src={formData.signature} className="max-h-full" />
                ) : (
                  <span className="text-[10px] text-gray-400">No Sign</span>
                )}
              </div>

              {!isViewMode && (
                <>
                  <button
                    ref={signatureBtnRef}
                    type="button"   // 🔥 MUST
                    data-auto
                    tabIndex={0}
                    onClick={() => setShowSignPad(true)}
                    onKeyDown={handleKeyDown}

                    className="text-xs text-blue-600 underline cursor-pointer"
                  >
                    Draw
                  </button>

                  <button
                    type="button"   // 🔥 MUST
                    data-auto
                    tabIndex={0}
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={handleKeyDown}

                    className="text-xs text-gray-600 underline cursor-pointer"
                  >
                    Upload
                  </button>
                </>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={(e) => {
                const reader = new FileReader();
                reader.onload = () => handleChange("signature", reader.result);
                reader.readAsDataURL(e.target.files[0]);
              }}
            />
          </div>

        </div>
      </div>

      <ERPFooter
        isAddMode={isAddMode}
        isEditMode={isEditMode}
        saveBtnRef={saveBtnRef}
        isViewMode={isViewMode}
        saving={saving}
        handleSubmit={handleValidateAndSave}
        onModify={onModify}
        onDelete={() => onDelete && onDelete(formData)}
        onCancel={onCancel}
        onEditCancel={onEditCancel}
        onNewEntry={onNewEntry}
        rights={rights}
      />

      {/* SIGN PAD */}
      {showSignPad && (
        <div
          id="sign-pad-modal"
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          onClick={() => {
            setShowSignPad(false);
            setTimeout(() => signatureBtnRef.current?.focus(), 100);
          }}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-[380px] p-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* HEADER */}
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-sm font-semibold">Draw Signature</h2>
              <button
                type="button"
                className="text-gray-500 hover:text-red-500 text-lg"
                onKeyDown={handleSignPadKeyDown} // 👈 Naya function
                onClick={() => {
                  setShowSignPad(false);
                  setTimeout(() => signatureBtnRef.current?.focus(), 100);
                }}
              >
                ✕
              </button>
            </div>

            {/* CANVAS */}
            <div className="border rounded-md overflow-hidden">
              <SignatureCanvas
                ref={sigPadRef}
                canvasProps={{
                  width: 350,
                  height: 150,
                  className: "bg-white"
                }}
              />
            </div>

            {/* ACTIONS */}
            <div className="flex justify-between items-center mt-3">
              <button
                type="button"
                ref={clearRef}
                onClick={() => sigPadRef.current.clear()}
                onKeyDown={handleSignPadKeyDown}
                className="px-3 py-1 text-xs border rounded-md hover:bg-gray-100 focus:ring-2 focus:ring-blue-500"
              >
                Clear
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowSignPad(false);
                    setTimeout(() => signatureBtnRef.current?.focus(), 100);
                  }}
                  onKeyDown={handleSignPadKeyDown}
                  className="px-3 py-1 text-xs border rounded-md hover:bg-gray-100 focus:ring-2 focus:ring-blue-500"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (sigPadRef.current.isEmpty()) {
                      showToast({ icon: "error", title: "Please draw signature" });
                      return;
                    }

                    handleChange("signature", sigPadRef.current.toDataURL());
                    setShowSignPad(false);

                    setTimeout(() => signatureBtnRef.current?.focus(), 100);
                  }}
                  onKeyDown={handleSignPadKeyDown}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-offset-1 focus:ring-blue-600"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
 
      {showGroupModal && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50"
          onClick={() => setShowGroupModal(false)}
        >
          <UserGroupForm
            title="Department Master"
            nameLabel="Department Name"
            formData={newGroupData}
            setFormData={setNewGroupData}
            onSave={handleQuickAddGroup}
            onCancel={handleCloseGroupModal}
            mode="add"
            saving={isQuickSaving}
            rights={{ add: 1 }}
          />
        </div>
      )}

    </div>
  );
};

export default AddUserMaster;