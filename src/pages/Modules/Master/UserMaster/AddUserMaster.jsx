// import React, { useState, useEffect, useCallback, useRef } from "react";
// import SignatureCanvas from "react-signature-canvas";
// import ERPHeader from "../../../../components/Reusable/form/HeaderForm";
// import ERPFooter from "../../../../components/Reusable/form/FooterForm";
// import ERPAutocomplete from "../../../../components/Reusable/input/ERPAutocomplete";
// import { fetchUserGroups, createUserGroup } from "../../../../utils/api";
// import UserGroupForm from "./UserGroupform";
// import { showToast } from "../../../../components/Reusable/alert";

// const AddUserMaster = ({
//   formData,
//   setFormData,
//   mode = "view",
//   onSave,
//   onCancel,
//   onDelete,
//   onEditCancel,
//   saving,
//   onModify,
//   onNewEntry,
//   currentRecord,
//   totalRecords,
//   rights,
//   activeTab = "entry",
//   onTabChange,
//   initialData = {}
// }) => {
//   const [errors, setErrors] = useState({});
//   const [showSignPad, setShowSignPad] = useState(false);
//   const [userGroups, setUserGroups] = useState([]);
//   const [showGroupModal, setShowGroupModal] = useState(false);
//   const [newGroupData, setNewGroupData] = useState({ group_name: "", remarks: "" });
//   const [isQuickSaving, setIsQuickSaving] = useState(false);

//   const sigPadRef = useRef(null);
//   const fileInputRef = useRef(null);

//   const isViewMode = mode === "view";
//   const isEditMode = mode === "edit";
//   const isAddMode = mode === "add";
//   const FONT = `'Inter', 'Tahoma', system-ui, sans-serif`;
//   const requiredFields = ["user_type", "user_name", "user_id", "password"];

//   // Fetch User Groups on Mount
//   const loadGroups = useCallback(async () => {
//     try {
//       const response = await fetchUserGroups();
//       if (response.success) setUserGroups(response.data.map(g => g.group_name));
//     } catch (err) { console.error("Failed to load groups", err); }
//   }, []);

//   useEffect(() => { loadGroups(); }, [loadGroups]);

//   // Focus logic identical to OT Form 
//   useEffect(() => {
//     if (isAddMode || isEditMode) {
//       setTimeout(() => {
//         const container = document.getElementById("user-master-container");
//         const firstInput = container?.querySelector("input:not([disabled]), select:not([disabled])");
//         if (firstInput) firstInput.focus();
//       }, 150);
//     }
//   }, [isAddMode, isEditMode]);

//   const handleChange = (field, value) => {
//     setFormData((prev) => ({
//       ...prev,
//       [field]: value
//     }));
//     if (errors[field]) setErrors(prev => { const e = { ...prev }; delete e[field]; return e; });
//   };

//   const getInputClass = (isDisabled, fieldName) =>
//     [
//       "w-full h-[31px] px-2 text-[14px]",
//       "border rounded-md outline-none transition-colors",
//       errors[fieldName] ? "border-red-500 bg-red-50" : "border-gray-300",
//       isDisabled
//         ? "bg-[#eef1f6] text-gray-500 cursor-not-allowed"
//         : "bg-white text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-100",
//     ].join(" ");

//   const handleValidateAndSave = useCallback(() => {
//     if (isViewMode) return;
//     let newErrors = {};
//     for (const field of requiredFields) {
//       let val = formData[field];
//       if (val === undefined || val === null || val.toString().trim() === "") {
//         newErrors[field] = "Required";
//       }
//     }

//     if (Object.keys(newErrors).length > 0) {
//       setErrors(newErrors);
//       return;
//     }
//     if (onSave) onSave(formData);
//   }, [formData, onSave, isViewMode]);

//   const handleKeyDown = useCallback((e) => {
//     if (isViewMode) return;
//     const container = document.getElementById("user-master-container");
//     const focusableElements = Array.from(
//       container.querySelectorAll("input:not([disabled]), select:not([disabled])")
//     );
//     const index = focusableElements.indexOf(e.target);

//     if (e.key === "Enter") {
//       e.preventDefault();
//       if (index > -1 && index < focusableElements.length - 1) {
//         focusableElements[index + 1].focus();
//       } else {
//         handleValidateAndSave();
//       }
//     }
//   }, [isViewMode, handleValidateAndSave]);
//   const handleQuickAddGroup = async () => {
//     if (!newGroupData.group_name) return;
//     setIsQuickSaving(true);
//     const response = await createUserGroup(newGroupData);
//     if (response.success) {
//       await loadGroups();
//       handleChange("user_group", newGroupData.group_name.toUpperCase());
//       setShowGroupModal(false);
//       showToast({ icon: "success", title: "Group Created" });
//     }
//     setIsQuickSaving(false);
//   };

//   return (
//     <div className="w-full max-w-[700px] mx-auto h-[calc(100vh-140px)] bg-[#eef1f6] flex flex-col overflow-hidden font-sans" style={{ fontFamily: FONT }}>
//       <ERPHeader
//         title="USER MASTER"
//         isAddMode={isAddMode}
//         isEditMode={isEditMode}
//         isViewMode={isViewMode}
//         activeTab={activeTab}
//         onTabChange={onTabChange}
//         rightContent={`${currentRecord || 1} / ${totalRecords || 1}`}
//       />

//       <div className="flex-1 p-6 overflow-y-auto flex flex-col items-center">
//         <div id="user-master-container" className="w-full max-w-[800px] h-fit bg-white shadow-sm rounded-md border border-slate-200 overflow-hidden">
//           <div className="p-6">
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6 relative">

//               <div className="space-y-4">
//                 <div className="flex items-center gap-2">
//                   <label className="text-black-800 text-[14px] w-[100px] font-bold tracking-wide transition-colors">User Type <span className="text-red-500">*</span></label>
//                   <div className="flex-1">
//                     <ERPAutocomplete
//                       value={formData.user_type || ""}
//                       options={["User", "Admin", "SuperUser"]}
//                       onChange={(val) => handleChange("user_type", val)}
//                       className={getInputClass(isViewMode, "user_type")}
//                       disabled={isViewMode}
//                     />
//                   </div>
//                 </div>

//                 <div className="flex items-center gap-2">
//                   <label className="text-black-800 text-[14px] w-[100px] font-bold tracking-wide transition-colors">User Group</label>
//                   <div className="flex-1">
//                     <ERPAutocomplete
//                       value={formData.user_group || ""}
//                       options={userGroups}
//                       onChange={(val) => handleChange("user_group", val)}
//                       className={getInputClass(isViewMode, "user_group")}
//                       disabled={isViewMode}
//                       showAddIfNoMatch={!isViewMode}
//                       onAddClick={(val) => { setNewGroupData({ group_name: val.toUpperCase() }); setShowGroupModal(true); }}
//                     />
//                   </div>
//                 </div>

//                 <div className="flex items-center gap-2">
//                   <label className="text-black-800 text-[14px] w-[100px] font-bold tracking-wide transition-colors">User Name <span className="text-red-500">*</span></label>
//                   <div className="flex-1">
//                     <input
//                       name="user_name"
//                       value={formData.user_name || ""}
//                       disabled={isViewMode}
//                       onChange={(e) => handleChange("user_name", e.target.value)}
//                       onKeyDown={handleKeyDown}
//                       className={getInputClass(isViewMode, "user_name")}
//                     />
//                   </div>
//                 </div>
//               </div> 
//               <div className="space-y-4">
//                 <div className="flex items-center gap-2">
//                   <label className="text-black-800 text-[14px] w-[100px] font-bold tracking-wide transition-colors">User ID <span className="text-red-500">*</span></label>
//                   <div className="flex-1">
//                     <input
//                       name="user_id"
//                       value={formData.user_id || ""}
//                       disabled={isViewMode || isEditMode}
//                       onChange={(e) => handleChange("user_id", e.target.value)}
//                       onKeyDown={handleKeyDown}
//                       className={getInputClass(isViewMode, "user_id")}
//                     />
//                   </div>
//                 </div>

//                 <div className="flex items-center gap-2">
//                   <label className="text-black-800 text-[14px] w-[100px] font-bold tracking-wide transition-colors">Password <span className="text-red-500">*</span></label>
//                   <div className="flex-1">
//                     <input
//                       type="password"
//                       name="password"
//                       value={formData.password || ""}
//                       disabled={isViewMode}
//                       onChange={(e) => handleChange("password", e.target.value)}
//                       onKeyDown={handleKeyDown}
//                       className={getInputClass(isViewMode, "password")}
//                     />
//                   </div>
//                 </div>

//                 <div className="flex items-center gap-2">
//                   <label className="text-black-800 text-[14px] w-[100px] font-bold tracking-wide transition-colors">Settings Pass</label>
//                   <div className="flex-1">
//                     <input
//                       type="password"
//                       name="setting_pass"
//                       value={formData.setting_pass || ""}
//                       disabled={isViewMode}
//                       onChange={(e) => handleChange("setting_pass", e.target.value)}
//                       onKeyDown={handleKeyDown}
//                       className={getInputClass(isViewMode, "setting_pass")}
//                     />
//                   </div>
//                 </div>
//               </div>

//             </div>

//             {/* Signature Section - Bottom Full Width */}
// <div className="mt-6 pt-6 border-t border-slate-100">
//    <div className="flex items-start gap-2">
//       <label className="text-black-800 text-[14px] w-[100px] font-bold tracking-wide">Signature</label>
//       <div className="flex flex-col gap-3">
//         <div className="flex items-center gap-4">
//           <div className="w-[120px] h-[50px] border border-dashed border-slate-300 rounded bg-slate-50 flex items-center justify-center overflow-hidden">
//             {formData.signature ? <img src={formData.signature} alt="sig" className="max-h-full" /> : <span className="text-[10px] text-slate-400 italic">No Signature</span>}
//           </div>
//           {!isViewMode && (
//             <div className="flex gap-2">
//               <button type="button" onClick={() => setShowSignPad(true)} className="text-[11px] font-bold text-blue-600 underline">Draw</button>
//               <button type="button" onClick={() => fileInputRef.current?.click()} className="text-[11px] font-bold text-slate-500 underline">Upload</button>
//             </div>
//           )}
//         </div>
//         <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
//           const reader = new FileReader();
//           reader.onload = () => handleChange("signature", reader.result);
//           reader.readAsDataURL(e.target.files[0]);
//         }} />
//       </div>
//    </div>
// </div>

//           </div>
//         </div>
//       </div>

//       <ERPFooter
//         isAddMode={isAddMode}
//         isEditMode={isEditMode}
//         isViewMode={isViewMode}
//         saving={saving}
//         handleSubmit={handleValidateAndSave}
//         onModify={onModify}
//         onDelete={() => onDelete && onDelete(formData)}
//         onCancel={onCancel}
//         onEditCancel={onEditCancel}
//         onNewEntry={onNewEntry}
//         rights={rights}
//       />

//       {/* Signature Draw Modal */}
//       {showSignPad && (
//         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100]">
//           <div className="bg-white p-5 rounded-xl shadow-2xl w-[420px]">
//             <div className="flex justify-between items-center mb-3">
//               <span className="text-[13px] font-bold">Draw Signature</span>
//               <button onClick={() => setShowSignPad(false)}>✕</button>
//             </div>
//             <div className="border border-slate-200 rounded-lg bg-slate-50">
//               <SignatureCanvas ref={sigPadRef} canvasProps={{ width: 380, height: 160, className: "signature-canvas" }} />
//             </div>
//             <div className="flex justify-end gap-2 mt-3">
//               <button onClick={() => sigPadRef.current.clear()} className="px-3 py-1 text-[12px] bg-slate-100 rounded">Clear</button>
//               <button onClick={() => { handleChange("signature", sigPadRef.current.getCanvas().toDataURL()); setShowSignPad(false); }} className="px-3 py-1 text-[12px] bg-blue-600 text-white rounded">Save</button>
//             </div>
//           </div>
//         </div>
//       )} 
//       {showGroupModal && (
//         <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
//           <div className="w-full max-w-md">
//             <UserGroupForm
//               formData={newGroupData} setFormData={setNewGroupData}
//               onSave={handleQuickAddGroup} onCancel={() => setShowGroupModal(false)}
//               mode="add" saving={isQuickSaving} rights={{ add: 1 }}
//             />
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default AddUserMaster;
// // import React, { useState, useEffect, useCallback, useRef } from "react";
// // import SignatureCanvas from "react-signature-canvas";
// // import ERPHeader from "../../../../components/Reusable/form/HeaderForm";
// // import ERPFooter from "../../../../components/Reusable/form/FooterForm";
// // import ERPAutocomplete from "../../../../components/Reusable/input/ERPAutocomplete";
// // import { fetchUserGroups, createUserGroup } from "../../../../utils/api";
// // import UserGroupForm from "./UserGroupform";
// // import { showToast } from "../../../../components/Reusable/alert";

// // const FONT = `'Inter', 'Tahoma', system-ui, sans-serif`;

// // const AddUserMaster = ({
// //   formData,
// //   setFormData,
// //   mode = "view",
// //   onSave,
// //   onCancel,
// //   onDelete,
// //   onEditCancel,
// //   saving,
// //   onModify,
// //   onNewEntry,
// //   currentRecord,
// //   totalRecords,
// //   rights,
// //   activeTab = "entry",
// //   onTabChange,
// // }) => {

// //   const [errors, setErrors] = useState({});
// //   const [userGroups, setUserGroups] = useState([]);
// //   const [showSignPad, setShowSignPad] = useState(false);
// //   const [showGroupModal, setShowGroupModal] = useState(false);
// //   const [newGroupData, setNewGroupData] = useState({ group_name: "", remarks: "" });
// //   const [isQuickSaving, setIsQuickSaving] = useState(false);

// //   const sigPadRef = useRef(null);
// //   const fileInputRef = useRef(null);

// //   const isViewMode = mode === "view";
// //   const isEditMode = mode === "edit";
// //   const isAddMode = mode === "add";

// //   const requiredFields = ["user_type", "user_name", "user_id", "password"];

// //   // 🔥 LOAD GROUPS (UNCHANGED)
// //   const loadGroups = useCallback(async () => {
// //     try {
// //       const res = await fetchUserGroups();
// //       if (res.success) {
// //         setUserGroups(res.data.map(g => g.group_name));
// //       }
// //     } catch (err) {
// //       console.error(err);
// //     }
// //   }, []);

// //   useEffect(() => {
// //     loadGroups();
// //   }, [loadGroups]);

// //   // 🔥 AUTO FOCUS (DEDuction style)
// //   useEffect(() => {
// //     if (isAddMode || isEditMode) {
// //       setTimeout(() => {
// //         const firstInput = document.querySelector(
// //           "#user-master-container input:not([disabled])"
// //         );
// //         if (firstInput) firstInput.focus();
// //       }, 150);
// //     }
// //   }, [isAddMode, isEditMode]);

// //   const handleChange = (field, value) => {
// //     setFormData(prev => ({ ...prev, [field]: value }));

// //     if (errors[field]) {
// //       setErrors(prev => {
// //         const e = { ...prev };
// //         delete e[field];
// //         return e;
// //       });
// //     }
// //   };

// //   const getInputClass = (disabled, field) =>
// //     `h-[30px] px-2 text-[15px] border rounded-md ${errors[field] ? "border-red-500" : "border-gray-300"
// //     } ${disabled ? "bg-gray-100 cursor-not-allowed" : "bg-white focus:border-blue-500"}`;

// //   // 🔥 VALIDATION
// //   const handleValidateAndSave = useCallback(() => {
// //     if (isViewMode) return;

// //     let newErrors = {};
// //     let firstEmpty = null;

// //     requiredFields.forEach(field => {
// //       if (!formData[field]) {
// //         newErrors[field] = "Required";
// //         if (!firstEmpty) firstEmpty = field;
// //       }
// //     });

// //     if (Object.keys(newErrors).length > 0) {
// //       setErrors(newErrors);

// //       setTimeout(() => {
// //         const el = document.querySelector(`[name="${firstEmpty}"]`);
// //         if (el) el.focus();
// //       }, 50);

// //       return;
// //     }

// //     onSave && onSave(formData);
// //   }, [formData, isViewMode, onSave]);

// //   // 🔥 KEYBOARD NAV (SAME AS DEDUCTION)
// //   const handleKeyDown = useCallback((e) => {
// //     if (isViewMode) return;

// //     const container = document.getElementById("user-master-container");
// //     if (!container) return;

// //     const elements = Array.from(
// //       container.querySelectorAll(
// //         "input:not([disabled]), [tabindex='0'], [data-auto]"
// //       )
// //     ).filter(el => !el.disabled);

// //     const index = elements.indexOf(e.target);

// //     if (e.key === "Enter") {
// //       e.preventDefault();

// //       if (index < elements.length - 1) {
// //         elements[index + 1].focus();
// //       } else {
// //         handleValidateAndSave();
// //       }
// //     }

// //     if (e.key === "Backspace") {
// //       let shouldGoBack = false;

// //       if (e.target.tagName === "INPUT") {
// //         const isEmpty = e.target.value === "";
// //         const atStart =
// //           e.target.selectionStart === 0 && e.target.selectionEnd === 0;

// //         if (isEmpty || atStart) shouldGoBack = true;
// //       }

// //       if (e.target.dataset.auto) shouldGoBack = true;

// //       if (shouldGoBack && index > 0) {
// //         e.preventDefault();
// //         elements[index - 1].focus();
// //       }
// //     }

// //   }, [formData, isViewMode, handleValidateAndSave]);

// //   // 🔥 QUICK ADD GROUP (UNCHANGED)
// //   const handleQuickAddGroup = async () => {
// //     if (!newGroupData.group_name) return;

// //     setIsQuickSaving(true);
// //     const res = await createUserGroup(newGroupData);

// //     if (res.success) {
// //       await loadGroups();
// //       handleChange("user_group", newGroupData.group_name.toUpperCase());
// //       setShowGroupModal(false);
// //       showToast({ icon: "success", title: "Group Created" });
// //     }

// //     setIsQuickSaving(false);
// //   };

// //   return (
// //     <div
// //       className="w-full max-w-[700px] mx-auto h-[calc(100vh-140px)] bg-[#eef1f6] flex flex-col"
// //       style={{ fontFamily: FONT }}
// //     >

// //       <ERPHeader
// //         title="USER MASTER"
// //         isAddMode={isAddMode}
// //         isEditMode={isEditMode}
// //         isViewMode={isViewMode}
// //         activeTab={activeTab}
// //         onTabChange={onTabChange}
// //         rightContent={`${currentRecord || 1} / ${totalRecords || 1}`}
// //       />

// //       <div className="flex-1 p-4 flex justify-center items-start">
// //         <div
// //           id="user-master-container"
// //           className="w-full max-w-[800px] bg-white border rounded-md p-4"
// //         >

// //           {/* ROW 1 */}
// //           <div className="flex items-center mb-2">
// //             <label className="w-[110px]">
// //               User Name <span className="text-red-500">*</span>
// //             </label>
// //             <input
// //               name="user_name"
// //               value={formData.user_name || ""}
// //               disabled={isViewMode}
// //               onChange={(e) => handleChange("user_name", e.target.value)}
// //               onKeyDown={handleKeyDown}
// //               className={`${getInputClass(isViewMode, "user_name")} flex-1`}
// //             />
// //           </div>

// //           {/* ROW 2 */}
// //           <div className="grid grid-cols-2 flex items-center gap-2">
// //             <div className="flex">
// //               <label className="w-[110px]">User Group</label>
// //               <ERPAutocomplete
// //                 data-auto
// //                 value={formData.user_group || ""}
// //                 options={userGroups}
// //                 onChange={(val) => handleChange("user_group", val)}
// //                 disabled={isViewMode}
// //                 onKeyDown={handleKeyDown}
// //                 className={`${getInputClass(isViewMode, "user_group")} `}
// //                 showAddIfNoMatch={!isViewMode}
// //                 onAddClick={(val) => {
// //                   setNewGroupData({ group_name: val.toUpperCase() });
// //                   setShowGroupModal(true);
// //                 }}
// //               />
// //             </div>




// //             <div className="flex">

// //               <label className="w-[110px]">
// //                 User Type <span className="text-red-500">*</span>
// //               </label>
// //               <ERPAutocomplete
// //                 data-auto
// //                 value={formData.user_type || ""}
// //                 options={["User", "Admin", "SuperUser"]}
// //                 onChange={(val) => handleChange("user_type", val)}
// //                 disabled={isViewMode}
// //                 onKeyDown={handleKeyDown}
// //                 className={`${getInputClass(isViewMode, "user_type")} flex-1 `}
// //               />
// //             </div>
// //             <div className="flex items-center gap-2">
// //               <label className="w-[102px]">
// //                 User ID <span className="text-red-500">*</span>
// //               </label>
// //               <input
// //                 name="user_id"
// //                 value={formData.user_id || ""}
// //                 disabled={isViewMode || isEditMode}
// //                 onChange={(e) => handleChange("user_id", e.target.value)}
// //                 onKeyDown={handleKeyDown}
// //                 className={`${getInputClass(isViewMode, "user_id")} `}
// //               />
// //             </div>
// //             <div className="flex items-center gap-2">
// //               <label className="w-[102px]">
// //                 Password <span className="text-red-500">*</span>
// //               </label>
// //               <input
// //                 type="password"
// //                 name="password"
// //                 value={formData.password || ""}
// //                 disabled={isViewMode}
// //                 onChange={(e) => handleChange("password", e.target.value)}
// //                 onKeyDown={handleKeyDown}
// //                 className={`${getInputClass(isViewMode, "password")} `}
// //               />
// //             </div>
// //             <div className="flex items-center gap-2 mb-2">
// //               <label className="w-[102px]">Settings Pass</label>
// //               <input
// //                 type="password"
// //                 name="setting_pass"
// //                 value={formData.setting_pass || ""}
// //                 disabled={isViewMode}
// //                 onChange={(e) => handleChange("setting_pass", e.target.value)}
// //                 onKeyDown={handleKeyDown}
// //                 className={`${getInputClass(isViewMode, "setting_pass")} `}
// //               />
// //             </div>
// //           </div>

// //           <div className="col-span-2 flex items-center gap-3">
// //             <label className="w-[110px]">Signature</label>

// //             <div className="flex items-center gap-3">
// //               <div className="w-[120px] h-[40px] border border-dashed flex items-center justify-center">
// //                 {formData.signature ? (
// //                   <img src={formData.signature} className="max-h-full" />
// //                 ) : (
// //                   <span className="text-[10px] text-gray-400">No Sign</span>
// //                 )}
// //               </div>

// //               {!isViewMode && (
// //                 <>
// //                   <button onClick={() => setShowSignPad(true)} className="text-xs text-blue-600 underline">
// //                     Draw
// //                   </button>
// //                   <button onClick={() => fileInputRef.current?.click()} className="text-xs text-gray-600 underline">
// //                     Upload
// //                   </button>
// //                 </>
// //               )}
// //             </div>

// //             <input
// //               type="file"
// //               ref={fileInputRef}
// //               className="hidden"
// //               accept="image/*"
// //               onChange={(e) => {
// //                 const reader = new FileReader();
// //                 reader.onload = () => handleChange("signature", reader.result);
// //                 reader.readAsDataURL(e.target.files[0]);
// //               }}
// //             />
// //           </div>



// //         </div>
// //       </div>

// //       <ERPFooter
// //         isAddMode={isAddMode}
// //         isEditMode={isEditMode}
// //         isViewMode={isViewMode}
// //         saving={saving}
// //         handleSubmit={handleValidateAndSave}
// //         onModify={onModify}
// //         onDelete={() => onDelete && onDelete(formData)}
// //         onCancel={onCancel}
// //         onEditCancel={onEditCancel}
// //         onNewEntry={onNewEntry}
// //         rights={rights}
// //       />

// //       {/* SIGN PAD */}
// //       {showSignPad && (
// //         <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
// //           <div className="bg-white p-4 rounded-md">
// //             <SignatureCanvas ref={sigPadRef} canvasProps={{ width: 350, height: 150 }} />
// //             <div className="flex justify-end gap-2 mt-2">
// //               <button onClick={() => sigPadRef.current.clear()}>Clear</button>
// //               <button onClick={() => {
// //                 handleChange("signature", sigPadRef.current.toDataURL());
// //                 setShowSignPad(false);
// //               }}>
// //                 Save
// //               </button>
// //             </div>
// //           </div>
// //         </div>
// //       )}

// //       {/* GROUP MODAL */}
// //       {showGroupModal && (
// //         <div className="fixed inset-0 flex items-center justify-center bg-black/50">
// //           <UserGroupForm
// //             formData={newGroupData}
// //             setFormData={setNewGroupData}
// //             onSave={handleQuickAddGroup}
// //             onCancel={() => setShowGroupModal(false)}
// //             mode="add"
// //             saving={isQuickSaving}
// //             rights={{ add: 1 }}
// //           />
// //         </div>
// //       )}

// //     </div>
// //   );
// // };

// // export default AddUserMaster;
import React, { useState, useEffect, useCallback, useRef } from "react";
import SignatureCanvas from "react-signature-canvas";
import ERPHeader from "../../../../components/Reusable/form/HeaderForm";
import ERPFooter from "../../../../components/Reusable/form/FooterForm";
import ERPAutocomplete from "../../../../components/Reusable/input/ERPAutocomplete";
import { fetchUserGroups, createUserGroup } from "../../../../utils/api";
import UserGroupForm from "./UserGroupform";
import { showToast } from "../../../../components/Reusable/alert";

const FONT = `'Inter', 'Tahoma', system-ui, sans-serif`;

const AddUserMaster = ({
  formData,
  setFormData,
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

  const requiredFields = ["user_type", "user_name", "user_id", "password"];

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

  const getInputClass = (disabled, field) =>
    `h-[30px] px-2 text-[15px] border rounded-md ${errors[field] ? "border-red-500" : "border-gray-300"
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

    const elements = Array.from(
      container.querySelectorAll(
        "input:not([disabled]), button:not([disabled]), [tabindex='0'], [data-auto]"
      )
    ).filter(el => !el.disabled);

    const index = elements.indexOf(e.target);

    // 🔴 ENTER → ALWAYS NEXT (NO CLICK)
    if (e.key === "Enter") {
      e.preventDefault(); // 👈 important (stop button click)

      if (index < elements.length - 1) {
        elements[index + 1].focus();
      } else {
        handleValidateAndSave();
      }
    }

    // 🔵 SPACE → CLICK ONLY FOR BUTTON
    if (e.key === " " && e.target.tagName === "BUTTON") {
      e.preventDefault();
      e.target.click();
    }

    // 🟡 BACKSPACE → GO BACK ONLY IF EMPTY
    if (e.key === "Backspace") {
      if (e.target.tagName === "INPUT") {
        const isEmpty = e.target.value === "";
        const atStart =
          e.target.selectionStart === 0 && e.target.selectionEnd === 0;

        if ((isEmpty || atStart) && index > 0) {
          e.preventDefault();
          elements[index - 1].focus();
        }
      }
    }

  }, [isViewMode, handleValidateAndSave]);

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
    <div className="w-full max-w-[700px] mx-auto h-[calc(100vh-140px)] bg-[#eef1f6] flex flex-col" style={{ fontFamily: FONT }}>

      <ERPHeader
        title="USER MASTER"
        isAddMode={isAddMode}
        isEditMode={isEditMode}
        isViewMode={isViewMode}
        activeTab={activeTab}
        onTabChange={onTabChange}
        rightContent={`${currentRecord || 1} / ${totalRecords || 1}`}
      />

      <div className="flex-1 p-4 flex justify-center items-start">
        <div id="user-master-container" className="w-full max-w-[800px] bg-white border rounded-md p-4">

          {/* ROW 1 */}
          <div className="flex items-center mb-2">
            <label className="w-[110px]">
              User Name <span className="text-red-500">*</span>
            </label>
            <input
              name="user_name"
              value={formData.user_name || ""}
              disabled={isViewMode}
              onChange={(e) => handleChange("user_name", e.target.value)}
              onKeyDown={handleKeyDown}
              className={`${getInputClass(isViewMode, "user_name")} flex-1`}
            />
          </div>

          {/* ROW 2 */}
          <div className="grid grid-cols-2 flex items-center gap-2">

            <div className="flex items-center gap-2">
              <label className="w-[102px]">
                User ID <span className="text-red-500">*</span>
              </label>
              <input
                name="user_id"
                value={formData.user_id || ""}
                disabled={isViewMode || isEditMode}
                onChange={(e) => handleChange("user_id", e.target.value)}
                onKeyDown={handleKeyDown}
                className={`${getInputClass(isViewMode, "user_id")} `}
              />
            </div>
            <div className="flex">
              <label className="w-[110px]">
                User Type <span className="text-red-500">*</span>
              </label>
              <ERPAutocomplete
                data-auto
                value={formData.user_type || ""}
                options={["User", "Admin", "SuperUser"]}
                onChange={(val) => handleChange("user_type", val)}
                disabled={isViewMode}
                onKeyDown={handleKeyDown}
                className={`${getInputClass(isViewMode, "user_type")} flex-1 `}
              />
            </div>


            <div className="flex">
              <label className="w-[110px]">User Group</label>
              <ERPAutocomplete
                data-auto
                value={formData.user_group || ""}
                options={userGroups}
                onChange={(val) => handleChange("user_group", val)}
                disabled={isViewMode}
                onKeyDown={handleKeyDown}
                className={`${getInputClass(isViewMode, "user_group")} `}
                showAddIfNoMatch={!isViewMode}
                onAddClick={(val) => {
                  setNewGroupData({ group_name: val.toUpperCase() });
                  setShowGroupModal(true);
                }}
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="w-[102px]">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                name="password"
                value={formData.password || ""}
                disabled={isViewMode}
                onChange={(e) => handleChange("password", e.target.value)}
                onKeyDown={handleKeyDown}
                className={`${getInputClass(isViewMode, "password")} `}
              />
            </div>

            <div className="flex items-center gap-2 mb-2">
              <label className="w-[102px]">Settings Pass</label>
              <input
                type="password"
                name="setting_pass"
                value={formData.setting_pass || ""}
                disabled={isViewMode}
                onChange={(e) => handleChange("setting_pass", e.target.value)}
                onKeyDown={handleKeyDown}
                className={`${getInputClass(isViewMode, "setting_pass")} `}
              />
            </div>
          </div>

          {/* SIGNATURE */}
          <div className="col-span-2 flex items-center gap-3">
            <label className="w-[100px]">Signature</label>

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

                    className="text-xs text-blue-600 underline cursor-pointer"
                  >
                    Draw
                  </button>

                  <button
                    type="button"   // 🔥 MUST
                    data-auto
                    tabIndex={0}
                    onClick={() => fileInputRef.current?.click()}

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
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          onClick={() => {
            setShowSignPad(false);
            setTimeout(() => signatureBtnRef.current?.focus(), 100);
          }}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-[380px] p-4"
            onClick={(e) => e.stopPropagation()} // 👈 prevent close on inside click
          >

            {/* HEADER */}
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-sm font-semibold">Draw Signature</h2>
              <button
                type="button"
                className="text-gray-500 hover:text-red-500 text-lg"
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
                onKeyDown={handleKeyDown}
                className="px-3 py-1 text-xs border rounded-md hover:bg-gray-100"
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
                  onKeyDown={handleKeyDown}
                  className="px-3 py-1 text-xs border rounded-md hover:bg-gray-100"
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
                  onKeyDown={handleKeyDown}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Save
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
      {/* GROUP MODAL */}
      {/* {showGroupModal && (
        <div className="fixed inset-0 z-[1000]  flex items-center justify-center bg-black/50">
          <UserGroupForm
            formData={newGroupData}
            setFormData={setNewGroupData}
            onSave={handleQuickAddGroup}
            onCancel={() => setShowGroupModal(false)}
            mode="add"
            saving={isQuickSaving}
            rights={{ add: 1 }}
          />
        </div>
      )} */}
      {showGroupModal && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50"
          onClick={() => setShowGroupModal(false)} // 👈 ADD THIS
        >

          <UserGroupForm
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