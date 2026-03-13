import { Plus, Paperclip, Pencil } from "lucide-react";
import { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { createUser, updateUser } from "../../utils/api";
import { AddButton, UpdateButton, CancelButton } from "../Reusable/ActionButon";

const AddUserMaster = ({ onSave, onCancel, editData, onOpenPage }) => {

  const [formData, setFormData] = useState({
    user_type: editData?.user_type || "",
    user_group: editData?.user_group || "",
    user_name: editData?.user_name || "",
    user_id: editData?.user_id || "",
    password: editData?.password || "",
    setting_pass: editData?.setting_pass || "",
    signature: editData?.signature || "",
  });

  const sigPadRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [showSignPad, setShowSignPad] = useState(false);
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
    const tag = e.target.tagName.toLowerCase();

    if (e.key === "Enter") {
      if (tag === "textarea" && e.shiftKey) return;
      e.preventDefault();
      focusNextInput(e.target);
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      focusNextInput(e.target);
    }
  };

  const isEditMode = !!editData;

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const requiredFields = ["user_name","user_id"];

  const validateForm = () => {
    const newErrors = {};
    requiredFields.forEach((field) => {
      if (!formData[field] || formData[field].trim() === "") {
        newErrors[field] = "Required";
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {

    if (!validateForm()) return;

    setLoading(true);

    try {
      const payload = { ...formData };
      let response;

      if (isEditMode) {
        response = await updateUser(editData.user_id, payload);
      } else {
        response = await createUser(payload);
      }

      if (response.success) {
        alert(
          isEditMode
            ? "User Updated Successfully"
            : "User Created Successfully"
        );
        onCancel();
      } else {
        alert(response.message);
      }
    } catch (error) {
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs shadow-sm focus:border-[var(--sidebar-accent-bg)] focus:ring-2 focus:ring-[var(--sidebar-accent-bg)/20] outline-none transition";

  const labelClass =
    "text-[10px] font-semibold text-gray-500 tracking-wide uppercase";

  const errorText = "text-[10px] text-red-500 mt-1";

  return (
    <div className="w-full max-w-7xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 flex flex-col min-h-[calc(100vh-160px)]">

      <div className="px-5 py-1.5 rounded-t-xl flex justify-between items-center text-white"
        style={{ background: "var(--sidebar-top-bg)" }}>
        <h2 className="text-lg font-semibold tracking-wide">User Master</h2>

        <span className="text-[11px] font-semibold px-3 py-[2px] rounded-md"
          style={{
            background: "var(--accent-soft)",
            color: "var(--bg-active)",
            border: "1px solid var(--bg-active)",
          }}>
          {isEditMode ? "EDIT MODE" : "NEW ENTRY"}
        </span>
      </div>

      <div className="p-5 bg-gray-50 flex-1">

        <div className="grid xl:grid-cols-4 md:grid-cols-2 grid-cols-1 gap-4">

          <div>
            <label className={labelClass}>User Type</label>
            <select
              ref={setInputRef}
              value={formData.user_type}
              onChange={(e)=>handleChange("user_type",e.target.value)}
              onKeyDown={handleKeyDown}
              className={inputClass}
            >
              <option value="">Select</option>
              <option value="User">User</option>
              <option value="Superuser">Super User</option>
              <option value="Admin">Administration</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>User Group</label>
            <div className="flex">
              <select
                ref={setInputRef}
                value={formData.user_group}
                onChange={(e)=>handleChange("user_group",e.target.value)}
                onKeyDown={handleKeyDown}
                className={`${inputClass} rounded-r-none`}
              >
                <option value="">Select Group</option>
                <option value="Admin">Admin</option>
                <option value="GM">GM</option>
                <option value="Purchase">Purchase</option>
                <option value="Production">Production</option>
                <option value="Planning">Planning</option>
                <option value="Quality Control">Quality Control</option>
                <option value="Account">Account</option>
              </select>

              <button
                type="button"
                onClick={()=>onOpenPage({
                    masmnu_id:"USERGROUP",
                    bar_name:"User Group",
                    appl_name:"USERGROUP"
                })}
                className="px-3 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700"
              >
                <Plus size={14}/>
              </button>
            </div>
          </div>

          <div>
            <label className={labelClass}>User Name *</label>
            <input
              ref={setInputRef}
              value={formData.user_name}
              onChange={(e)=>handleChange("user_name",e.target.value)}
              onKeyDown={handleKeyDown}
              className={`${inputClass} ${errors.user_name ? "border-red-500":""}`}
            />
            {errors.user_name && <p className={errorText}>{errors.user_name}</p>}
          </div>

          <div>
            <label className={labelClass}>User ID *</label>
            <input
              ref={setInputRef}
              value={formData.user_id}
              onChange={(e)=>handleChange("user_id",e.target.value)}
              onKeyDown={handleKeyDown}
              className={`${inputClass} ${errors.user_id ? "border-red-500":""}`}
            />
            {errors.user_id && <p className={errorText}>{errors.user_id}</p>}
          </div>

          <div>
            <label className={labelClass}>Password</label>
            <input
              ref={setInputRef}
              type="password"
              value={formData.password}
              onChange={(e)=>handleChange("password",e.target.value)}
              onKeyDown={handleKeyDown}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Setting Password</label>
            <input
              ref={setInputRef}
              type="password"
              value={formData.setting_pass}
              onChange={(e)=>handleChange("setting_pass",e.target.value)}
              onKeyDown={handleKeyDown}
              className={inputClass}
            />
          </div>

          <div className="xl:col-span-2 md:col-span-2">
            <label className={labelClass}>Signature</label>

            <div className="flex items-center gap-2">

              <input
                value={formData.signature ? "✔ Signature Attached":""}
                readOnly
                className={`${inputClass} flex-1`}
              />

              <label className="h-[30px] w-[30px] flex items-center justify-center border rounded bg-gray-100 hover:bg-gray-200 cursor-pointer">
                <Paperclip size={14}/>
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e)=>{
                    const file = e.target.files?.[0];
                    if(!file) return;
                    const reader = new FileReader();
                    reader.onloadend=()=>{
                      setFormData(prev=>({...prev,signature:reader.result}));
                    };
                    reader.readAsDataURL(file);
                  }}
                />
              </label>

              <button
                type="button"
                onClick={()=>setShowSignPad(true)}
                className="h-[30px] w-[30px] flex items-center justify-center border rounded bg-gray-100 hover:bg-gray-200"
              >
                <Pencil size={14}/>
              </button>

              {formData.signature && (
                <button
                  type="button"
                  onClick={()=>setFormData(prev=>({...prev,signature:""}))}
                  className="h-[30px] px-2 text-xs border rounded bg-red-50 hover:bg-red-100 text-red-600"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

        </div>
      </div>

      <div className="flex justify-end items-center px-5 py-2 border-t bg-white gap-3">

        {isEditMode ? (
          <UpdateButton onClick={handleSave} disabled={loading}/>
        ) : (
          <AddButton onClick={handleSave} disabled={loading}/>
        )}

        <CancelButton onClick={onCancel}/>
      </div>

      {showSignPad && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-[450px]">
            <h3 className="text-sm font-semibold mb-3 text-blue-600">Draw Signature</h3>

            <SignatureCanvas
              ref={sigPadRef}
              penColor="black"
              canvasProps={{
                width:400,
                height:150,
                className:"border rounded"
              }}
            />

            <div className="flex justify-end gap-3 mt-4">

              <button
                type="button"
                onClick={()=>sigPadRef.current.clear()}
                className="px-3 py-1 text-xs bg-gray-200 rounded"
              >
                Clear
              </button>

              <button
                type="button"
                onClick={()=>{
                  const data=sigPadRef.current.getTrimmedCanvas().toDataURL("image/png");
                  setFormData(prev=>({...prev,signature:data}));
                  setShowSignPad(false);
                }}
                className="px-3 py-1 text-xs bg-blue-600 text-white rounded"
              >
                Save
              </button>

              <button
                type="button"
                onClick={()=>setShowSignPad(false)}
                className="px-3 py-1 text-xs bg-red-500 text-white rounded"
              >
                Cancel
              </button>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AddUserMaster;