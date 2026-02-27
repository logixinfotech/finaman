import { Plus, Paperclip, Pencil } from "lucide-react";
import { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { createUser, updateUser } from "../../utils/api"; 


import useEnterAsTab from "../Reusable/useEnterAsTab";
import {
  AddButton,
  UpdateButton,
  CancelButton,
} from "../Reusable/ActionButon";

const AddUserMaster = ({ onSave, onCancel, editData, onOpenPage }) => {
  const [formData, setFormData] = useState(
    editData || {
      user_type: "",
      user_group: "",
      user_name: "",
      user_id: "",
      password: "",
      setting_pass: "",
      signature: "",
    }
  );

  const sigPadRef = useRef(null);
    const [loading, setLoading] = useState(false);
  const [showSignPad, setShowSignPad] = useState(false);

  const handleEnterAsTab = useEnterAsTab(".user-master-form");
  const isEditMode = !!editData;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const inputClass =
    "px-3 py-[10px] text-sm border border-gray-300 rounded-lg transition focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20";

  const labelClass = "text-xs font-medium text-gray-500";

  const sectionCard =
    "bg-white p-5 rounded-[14px] shadow-[0_4px_14px_rgba(0,0,0,0.04)]";
  const handleSave = async () => {
    try {
      const payload = {
        user_type: formData.user_type,
        user_group: formData.user_group,
        user_name: formData.user_name,
        user_id: formData.user_id,
        password: formData.password,
        setting_pass: formData.setting_pass,
        signature: formData.signature,
      };

      let response;

      if (isEditMode) {
        response = await updateUser(editData.user_id, payload);
      } else {
        response = await createUser(payload);
      }

      if (response.success) {
        alert(isEditMode ? "User Updated Successfully" : "User Created Successfully");
        onCancel();
      } else {
        alert(response.message);
      }

    } catch (error) {
      alert("Something went wrong");
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-700">
            {isEditMode ? "Edit User Master" : "Add User Master"}
          </h2>
        </div>

        <div
          className="user-master-form flex flex-col gap-7"
          onKeyDown={handleEnterAsTab}
        >
          <div className={sectionCard}>
            <div className="text-[15px] font-semibold mb-4 text-blue-600">
              User Information
            </div>

            <div className="grid gap-[18px] grid-cols-[repeat(auto-fit,minmax(240px,1fr))]">
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>User Type</label>
                <select
                  name="user_type"
                  value={formData.user_type}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="">Select User Type</option>
                  <option value="User">User</option>
                  <option value="Superuser">Super User</option>
                  <option value="Admin">Administration</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>User Group</label>
                <div className="flex">
                  <select
                    name="user_group"
                    value={formData.user_group}
                    onChange={handleChange}
                    className={`${inputClass} rounded-r-none w-full`}
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
                    onClick={() =>
                      onOpenPage({
                        masmnu_id: "USERGROUP",
                        bar_name: "User Group",
                        appl_name: "USERGROUP",
                      })
                    }
                    className="px-3 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 transition"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>User Name</label>
                <input
                  name="user_name"
                  value={formData.user_name}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>User ID</label>
                <input
                  name="user_id"
                  value={formData.user_id}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
            </div>
          </div> 
          <div className={sectionCard}>
            <div className="text-[15px] font-semibold mb-4 text-blue-600">
              Security
            </div>

            <div className="grid gap-[18px] grid-cols-[repeat(auto-fit,minmax(240px,1fr))]">
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Setting Password</label>
                <input
                  type="password"
                  name="setting_pass"
                  value={formData.setting_pass}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Signature</label>

                <div className="flex items-center gap-2">
                  <input
                    value={formData.signature ? "✔ Signature Attached" : ""}
                    readOnly
                    className={`${inputClass} h-[34px]`}
                  />
                  <label className="h-[34px] w-[34px] flex items-center justify-center border rounded bg-gray-100 hover:bg-gray-200 cursor-pointer">
                    <Paperclip size={14} />
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setFormData((prev) => ({
                            ...prev,
                            signature: reader.result,
                          }));
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                  </label> 
                  <button
                    type="button"
                    onClick={() => setShowSignPad(true)}
                    className="h-[34px] w-[34px] flex items-center justify-center border rounded bg-gray-100 hover:bg-gray-200"
                  >
                    <Pencil size={14} />
                  </button>

                  {/* Clear */}
                  {formData.signature && (
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          signature: "",
                        }))
                      }
                      className="h-[34px] px-2 text-xs border rounded bg-red-50 hover:bg-red-100 text-red-600"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            {isEditMode ? (
              <UpdateButton onClick={handleSave} disabled={loading} />
            ) : (
              <AddButton onClick={handleSave} disabled={loading} />
            )}
            <CancelButton onClick={onCancel} />
          </div>

        </div>
      </div>

      {/* ================= SIGNATURE MODAL ================= */}
      {showSignPad && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-[450px]">
            <h3 className="text-sm font-semibold mb-3 text-blue-600">
              Draw Signature
            </h3>

            <SignatureCanvas
              ref={sigPadRef}
              penColor="black"
              canvasProps={{
                width: 400,
                height: 150,
                className: "border rounded",
              }}
            />

            <div className="flex justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={() => sigPadRef.current.clear()}
                className="px-3 py-1 text-xs bg-gray-200 rounded"
              >
                Clear
              </button>

              <button
                type="button"
                onClick={() => {
                  const data =
                    sigPadRef.current
                      .getTrimmedCanvas()
                      .toDataURL("image/png");

                  setFormData((prev) => ({
                    ...prev,
                    signature: data,
                  }));

                  setShowSignPad(false);
                }}
                className="px-3 py-1 text-xs bg-blue-600 text-white rounded"
              >
                Save
              </button>

              <button
                type="button"
                onClick={() => setShowSignPad(false)}
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
