// // FBPConfigForm.jsx

// import React, {
//   useState,
//   useEffect,
//   useCallback,
// } from "react";

// import ERPHeader from "../../../../../components/Reusable/form/HeaderForm";
// import ERPFooter from "../../../../../components/Reusable/form/FooterForm";
// import ERPAutocomplete from "../../../../../components/Reusable/input/ERPAutocomplete";
// import ERPDateInput from "../../../../../components/Reusable/input/Date";

// const FONT = `'Inter', 'Tahoma', system-ui, sans-serif`;

// const FBPConfigForm = ({
//   mode = "view",
//   onSave,
//   onDelete,
//   onEditCancel,
//   saving,
//   onModify,
//   onNewEntry,
//   currentRecord,
//   totalRecords,
//   rights,
//   activeTab = "entry",
//   formData,
//   setFormData,
//   onTabChange = () => {},
// }) => {
//   const [errors, setErrors] = useState({});

//   const isViewMode = mode === "view";
//   const isAddMode = mode === "add";
//   const isEditMode = mode === "edit";

//   const requiredFields = [
//     "name",
//     "code",
//     "category",
//   ];

//   useEffect(() => {
//     if (isAddMode || isEditMode) {
//       setTimeout(() => {
//         const firstInput = document.querySelector(
//           "#fbp-form-container input:not([disabled])"
//         );

//         if (firstInput) firstInput.focus();
//       }, 150);
//     }
//   }, [isAddMode, isEditMode]);

//   const handleChange = (field, value) => {
//     setFormData((prev) => ({
//       ...prev,
//       [field]: value,
//     }));

//     if (errors[field]) {
//       setErrors((prev) => {
//         const e = { ...prev };
//         delete e[field];
//         return e;
//       });
//     }
//   };

//   const getInputClass = (disabled, field) =>
//     `h-[30px] px-2 text-[15px] border rounded-md ${
//       errors[field]
//         ? "border-red-500"
//         : "border-gray-300"
//     } ${
//       disabled
//         ? "bg-gray-100 cursor-not-allowed"
//         : "bg-white focus:border-blue-500"
//     }`;

//   const handleValidateAndSave = useCallback(() => {
//     if (isViewMode) return;

//     let newErrors = {};
//     let firstEmpty = null;

//     requiredFields.forEach((field) => {
//       if (!formData[field]) {
//         newErrors[field] = "Required";

//         if (!firstEmpty) firstEmpty = field;
//       }
//     });

//     if (Object.keys(newErrors).length > 0) {
//       setErrors(newErrors);

//       setTimeout(() => {
//         const el = document.querySelector(
//           `[name="${firstEmpty}"]`
//         );

//         if (el) el.focus();
//       }, 50);

//       return;
//     }

//     onSave && onSave(formData);
//   }, [formData, isViewMode, onSave]);

//   const handleKeyDown = useCallback(
//     (e) => {
//       if (isViewMode) return;

//       const container =
//         document.getElementById(
//           "fbp-form-container"
//         );

//       if (!container) return;

//       const elements = Array.from(
//         container.querySelectorAll(
//           "input:not([disabled]), [tabindex='0'], [data-auto]"
//         )
//       ).filter((el) => !el.disabled);

//       const index = elements.indexOf(e.target);

//       if (e.key === "Enter") {
//         e.preventDefault();

//         if (index < elements.length - 1) {
//           elements[index + 1].focus();
//         } else {
//           const saveBtn = Array.from(
//             document.querySelectorAll("button")
//           ).find(
//             (btn) =>
//               (btn.textContent
//                 ?.toLowerCase()
//                 .includes("save") ||
//                 btn.textContent
//                   ?.toLowerCase()
//                   .includes("update")) &&
//               !btn.disabled
//           );

//           if (saveBtn) saveBtn.focus();
//         }
//       }

//       if (e.key === "Backspace") {
//         let shouldGoBack = false;

//         if (e.target.tagName === "INPUT") {
//           const isEmpty =
//             e.target.value === "";

//           const atStart =
//             e.target.selectionStart === 0 &&
//             e.target.selectionEnd === 0;

//           if (isEmpty || atStart)
//             shouldGoBack = true;
//         }

//         if (e.target.dataset.auto)
//           shouldGoBack = true;

//         if (
//           e.target.dataset.toggle === "status"
//         )
//           shouldGoBack = true;

//         if (shouldGoBack && index > 0) {
//           e.preventDefault();
//           elements[index - 1].focus();
//         }
//       }

//       if (
//         e.key === " " &&
//         e.target.dataset.toggle === "status"
//       ) {
//         e.preventDefault();

//         handleChange(
//           "status",
//           formData.status === "Active"
//             ? "Inactive"
//             : "Active"
//         );
//       }
//     },
//     [formData, isViewMode]
//   );

//   return (
//     <div
//       className="w-full max-w-[850px] mx-auto h-[calc(100vh-140px)] bg-[#eef1f6] flex flex-col"
//       style={{ fontFamily: FONT }}
//     >
//       <ERPHeader
//         title="FBP CONFIG ENTRY"
//         isAddMode={isAddMode}
//         isEditMode={isEditMode}
//         isViewMode={isViewMode}
//         activeTab={activeTab}
//         onTabChange={onTabChange}
//         rightContent={`${currentRecord || 1} / ${
//           totalRecords || 1
//         }`}
//       />

//       <div className="flex-1 p-4 flex justify-center items-start">
//         <div
//           id="fbp-form-container"
//           className="w-full bg-white border rounded-md p-4"
//         >
//           <div className="grid grid-cols-3 gap-6">
//             <div className="col-span-2 flex items-center gap-2">
//               <label className="w-[120px]">
//                 Benefit Name
//                 <span className="text-red-500">
//                   *
//                 </span>
//               </label>

//               <input
//                 name="name"
//                 value={formData.name || ""}
//                 disabled={isViewMode}
//                 onChange={(e) =>
//                   handleChange(
//                     "name",
//                     e.target.value
//                   )
//                 }
//                 onKeyDown={handleKeyDown}
//                 className={`${getInputClass(
//                   isViewMode,
//                   "name"
//                 )} flex-1`}
//               />
//             </div>

//             <div className="flex items-center gap-2">
//               <label className="w-[80px]">
//                 Code
//                 <span className="text-red-500">
//                   *
//                 </span>
//               </label>

//               <input
//                 name="code"
//                 value={formData.code || ""}
//                 disabled={isViewMode}
//                 onChange={(e) =>
//                   handleChange(
//                     "code",
//                     e.target.value
//                   )
//                 }
//                 onKeyDown={handleKeyDown}
//                 className={`${getInputClass(
//                   isViewMode,
//                   "code"
//                 )} w-[170px]`}
//               />
//             </div>
//           </div>

//           <div className="grid grid-cols-3 gap-6 mt-4">
//             <div className="flex items-center gap-2">
//               <label className="w-[200px]">
//                 Category
//                 <span className="text-red-500">
//                   *
//                 </span>
//               </label>

//               <ERPAutocomplete
//                 data-auto
//                 value={formData.category || ""}
//                 options={[
//                   "Housing",
//                   "Travel",
//                   "Food",
//                   "Medical",
//                   "Other",
//                 ]}
//                 onChange={(val) =>
//                   handleChange(
//                     "category",
//                     val
//                   )
//                 }
//                 disabled={isViewMode}
//                 onKeyDown={handleKeyDown}
//                 className={getInputClass(
//                   isViewMode,
//                   "category"
//                 )}
//               />
//             </div>

//             <div className="flex items-center gap-2">
//               <label className="w-[120px]">
//                 Max Limit
//               </label>

//               <input
//                 type="number"
//                 name="max_limit"
//                 value={
//                   formData.max_limit || ""
//                 }
//                 disabled={isViewMode}
//                 onChange={(e) =>
//                   handleChange(
//                     "max_limit",
//                     e.target.value
//                   )
//                 }
//                 onKeyDown={handleKeyDown}
//                 className={`${getInputClass(
//                   isViewMode,
//                   "max_limit"
//                 )} w-[120px]`}
//               />
//             </div>

//             <div className="flex items-center gap-2">
//               <label className="w-[80px]">
//                 Taxable
//               </label>

//               <ERPAutocomplete
//                 data-auto
//                 value={
//                   formData.taxable ?? "Yes"
//                 }
//                 options={["Yes", "No"]}
//                 onChange={(val) =>
//                   handleChange(
//                     "taxable",
//                     val
//                   )
//                 }
//                 disabled={isViewMode}
//                 onKeyDown={handleKeyDown}
//             className={`${getInputClass(
//                   isViewMode,
//                   "taxable"
//                 )} w-[90px]`}
//               />
//             </div>
//           </div>

//           <div className="grid grid-cols-3 gap-6 mt-4">
//             <div className="flex items-center gap-2">
//               <label className="w-[200px]">
//                 Frequency
//               </label>

//               <ERPAutocomplete
//                 data-auto
//                 value={
//                   formData.frequency ||
//                   ""
//                 }
//                 options={[
//                   "Monthly",
//                   "Quarterly",
//                   "Annual",
//                 ]}
//                 onChange={(val) =>
//                   handleChange(
//                     "frequency",
//                     val
//                   )
//                 }
//                 disabled={isViewMode}
//                 onKeyDown={handleKeyDown}
//                 className={`${getInputClass(
//                   isViewMode,
//                   "frequency"
//                 )} w-[100px]`}
//               />
//             </div>

//             <div className="flex items-center gap-2">
//               <label className="w-[250px]">
//                 Applicable From
//               </label>

//               <ERPDateInput
//                 name="applicable_from"
//                 value={
//                   formData.applicable_from ||
//                   ""
//                 }
//                 disabled={isViewMode}
//                 onChange={(value) =>
//                   handleChange(
//                     "applicable_from",
//                     value
//                   )
//                 }
//                 onKeyDown={handleKeyDown}
//                 className={`${getInputClass(
//                   isViewMode,
//                   "applicable_from"
//                 )} w-[60px]`}
//               />
//             </div>

//             <div className="flex items-center gap-4">
//               <label className="w-[50px]">
//                 Status
//               </label>

//               <div
//                 tabIndex={0}
//                 data-toggle="status"
//                 onKeyDown={handleKeyDown}
//                 onClick={() =>
//                   !isViewMode &&
//                   handleChange(
//                     "status",
//                     formData.status ===
//                       "Active"
//                       ? "Inactive"
//                       : "Active"
//                   )
//                 }
//                 className={`w-[42px] mx-[10px] h-[22px] flex items-center rounded-full p-[2px]
//                   ${
//                     formData.status ===
//                     "Active"
//                       ? "bg-green-500"
//                       : "bg-gray-400"
//                   }`}
//               >
//                 <div
//                   className={`h-[18px]  w-[18px] bg-white rounded-full transition-all
//                     ${
//                       formData.status ===
//                       "Active"
//                         ? "translate-x-[20px]"
//                         : ""
//                     }`}
//                 />
//               </div>

//               <span className="mx-[10px] text-sm">
//                 {formData.status ||
//                   "Active"}
//               </span>
//             </div>
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
//         onDelete={() =>
//           onDelete && onDelete(formData)
//         }
//         onCancel={onEditCancel}
//         onEditCancel={onEditCancel}
//         onNewEntry={onNewEntry}
//         rights={rights}
//       />
//     </div>
//   );
// };

// export default FBPConfigForm;
// import React, {
//   useState,
//   useEffect,
//   useCallback,
// } from "react";

// import ERPHeader from "../../../../../components/Reusable/form/HeaderForm";
// import ERPFooter from "../../../../../components/Reusable/form/FooterForm";
// import ERPAutocomplete from "../../../../../components/Reusable/input/ERPAutocomplete";
// import ERPDateInput from "../../../../../components/Reusable/input/Date";

// const FONT = `'Inter', 'Tahoma', system-ui, sans-serif`;

// const FBPConfigForm = ({
//   mode = "view",
//   onSave,
//   onDelete,
//   onEditCancel,
//   saving,
//   onModify,
//   onNewEntry,
//   currentRecord,
//   totalRecords,
//   rights,
//   activeTab = "entry",
//   formData,
//   setFormData,
//   onTabChange = () => {},
// }) => {
//   const [errors, setErrors] = useState({});

//   const isViewMode = mode === "view";
//   const isAddMode = mode === "add";
//   const isEditMode = mode === "edit";

//   const requiredFields = [
//     "name",
//     "code",
//     "category",
//   ];

//   useEffect(() => {
//     if (isAddMode || isEditMode) {
//       setTimeout(() => {
//         const firstInput = document.querySelector(
//           "#fbp-form-container input:not([disabled])"
//         );

//         if (firstInput) firstInput.focus();
//       }, 150);
//     }
//   }, [isAddMode, isEditMode]);

//   const handleChange = (field, value) => {
//     setFormData((prev) => ({
//       ...prev,
//       [field]: value,
//     }));

//     if (errors[field]) {
//       setErrors((prev) => {
//         const e = { ...prev };
//         delete e[field];
//         return e;
//       });
//     }
//   };

//   const getInputClass = (disabled, field) =>
//     `h-[30px] px-2 text-[15px] border rounded-md ${
//       errors[field]
//         ? "border-red-500"
//         : "border-gray-300"
//     } ${
//       disabled
//         ? "bg-gray-100 cursor-not-allowed"
//         : "bg-white focus:border-blue-500"
//     }`;

//   const handleValidateAndSave = useCallback(() => {
//     if (isViewMode) return;

//     let newErrors = {};
//     let firstEmpty = null;

//     requiredFields.forEach((field) => {
//       if (!formData[field]) {
//         newErrors[field] = "Required";

//         if (!firstEmpty) firstEmpty = field;
//       }
//     });

//     if (Object.keys(newErrors).length > 0) {
//       setErrors(newErrors);

//       setTimeout(() => {
//         const el = document.querySelector(
//           `[name="${firstEmpty}"]`
//         );

//         if (el) el.focus();
//       }, 50);

//       return;
//     }

//     onSave && onSave(formData);
//   }, [formData, isViewMode, onSave]);

//   const handleKeyDown = useCallback(
//     (e) => {
//       if (isViewMode) return;

//       const container =
//         document.getElementById(
//           "fbp-form-container"
//         );

//       if (!container) return;

//       const elements = Array.from(
//         container.querySelectorAll(
//           "input:not([disabled]), [tabindex='0'], [data-auto]"
//         )
//       ).filter((el) => !el.disabled);

//       const index = elements.indexOf(e.target);

//       if (e.key === "Enter") {
//         e.preventDefault();

//         if (index < elements.length - 1) {
//           elements[index + 1].focus();
//         } else {
//           const saveBtn = Array.from(
//             document.querySelectorAll("button")
//           ).find(
//             (btn) =>
//               (btn.textContent
//                 ?.toLowerCase()
//                 .includes("save") ||
//                 btn.textContent
//                   ?.toLowerCase()
//                   .includes("update")) &&
//               !btn.disabled
//           );

//           if (saveBtn) saveBtn.focus();
//         }
//       }

//       if (e.key === "Backspace") {
//         let shouldGoBack = false;

//         if (e.target.tagName === "INPUT") {
//           const isEmpty =
//             e.target.value === "";

//           const atStart =
//             e.target.selectionStart === 0 &&
//             e.target.selectionEnd === 0;

//           if (isEmpty || atStart)
//             shouldGoBack = true;
//         }

//         if (e.target.dataset.auto)
//           shouldGoBack = true;

//         if (
//           e.target.dataset.toggle === "status"
//         )
//           shouldGoBack = true;

//         if (shouldGoBack && index > 0) {
//           e.preventDefault();
//           elements[index - 1].focus();
//         }
//       }

//       if (
//         e.key === " " &&
//         e.target.dataset.toggle === "status"
//       ) {
//         e.preventDefault();

//         handleChange(
//           "status",
//           formData.status === "Active"
//             ? "Inactive"
//             : "Active"
//         );
//       }
//     },
//     [formData, isViewMode]
//   );

//   return (
//     <div
//       className="w-full max-w-[850px] mx-auto h-[calc(100vh-140px)] bg-[#eef1f6] flex flex-col"
//       style={{ fontFamily: FONT }}
//     >
//       <ERPHeader
//         title="FBP CONFIG ENTRY"
//         isAddMode={isAddMode}
//         isEditMode={isEditMode}
//         isViewMode={isViewMode}
//         activeTab={activeTab}
//         onTabChange={onTabChange}
//         rightContent={`${currentRecord || 1} / ${
//           totalRecords || 1
//         }`}
//       />

//       {/* FIXED: 'flex justify-center' ko hataya gaya hai aur 'overflow-x-auto' lagaya gaya hai */}
//       <div className="flex-1 p-4 overflow-x-auto">
//         <div
//           id="fbp-form-container"
//           /* FIXED: min-w-[800px] mobile par horizontal scroll dega, mx-auto desktop par center karega */
//           className="w-full min-w-[800px] mx-auto bg-white border rounded-md p-4"
//         >
//           <div className="grid grid-cols-3 gap-6">
//             <div className="col-span-2 flex items-center gap-2">
//               <label className="w-[120px]">
//                 Benefit Name
//                 <span className="text-red-500">
//                   *
//                 </span>
//               </label>

//               <input
//                 name="name"
//                 value={formData.name || ""}
//                 disabled={isViewMode}
//                 onChange={(e) =>
//                   handleChange(
//                     "name",
//                     e.target.value
//                   )
//                 }
//                 onKeyDown={handleKeyDown}
//                 className={`${getInputClass(
//                   isViewMode,
//                   "name"
//                 )} flex-1`}
//               />
//             </div>

//             <div className="flex items-center gap-2">
//               <label className="w-[80px]">
//                 Code
//                 <span className="text-red-500">
//                   *
//                 </span>
//               </label>

//               <input
//                 name="code"
//                 value={formData.code || ""}
//                 disabled={isViewMode}
//                 onChange={(e) =>
//                   handleChange(
//                     "code",
//                     e.target.value
//                   )
//                 }
//                 onKeyDown={handleKeyDown}
//                 className={`${getInputClass(
//                   isViewMode,
//                   "code"
//                 )} w-[170px]`}
//               />
//             </div>
//           </div>

//           <div className="grid grid-cols-3 gap-6 mt-4">
//             <div className="flex items-center gap-2">
//               <label className="w-[200px]">
//                 Category
//                 <span className="text-red-500">
//                   *
//                 </span>
//               </label>

//               <ERPAutocomplete
//                 data-auto
//                 value={formData.category || ""}
//                 options={[
//                   "Housing",
//                   "Travel",
//                   "Food",
//                   "Medical",
//                   "Other",
//                 ]}
//                 onChange={(val) =>
//                   handleChange(
//                     "category",
//                     val
//                   )
//                 }
//                 disabled={isViewMode}
//                 onKeyDown={handleKeyDown}
//                 className={getInputClass(
//                   isViewMode,
//                   "category"
//                 )}
//               />
//             </div>

//             <div className="flex items-center gap-2">
//               <label className="w-[120px]">
//                 Max Limit
//               </label>

//               <input
//                 type="number"
//                 name="max_limit"
//                 value={
//                   formData.max_limit || ""
//                 }
//                 disabled={isViewMode}
//                 onChange={(e) =>
//                   handleChange(
//                     "max_limit",
//                     e.target.value
//                   )
//                 }
//                 onKeyDown={handleKeyDown}
//                 className={`${getInputClass(
//                   isViewMode,
//                   "max_limit"
//                 )} w-[120px]`}
//               />
//             </div>

//             <div className="flex items-center gap-2">
//               <label className="w-[80px]">
//                 Taxable
//               </label>

//               <ERPAutocomplete
//                 data-auto
//                 value={
//                   formData.taxable ?? "Yes"
//                 }
//                 options={["Yes", "No"]}
//                 onChange={(val) =>
//                   handleChange(
//                     "taxable",
//                     val
//                   )
//                 }
//                 disabled={isViewMode}
//                 onKeyDown={handleKeyDown}
//             className={`${getInputClass(
//                   isViewMode,
//                   "taxable"
//                 )} w-[90px]`}
//               />
//             </div>
//           </div>

//           <div className="grid grid-cols-3 gap-6 mt-4">
//             <div className="flex items-center gap-2">
//               <label className="w-[200px]">
//                 Frequency
//               </label>

//               <ERPAutocomplete
//                 data-auto
//                 value={
//                   formData.frequency ||
//                   ""
//                 }
//                 options={[
//                   "Monthly",
//                   "Quarterly",
//                   "Annual",
//                 ]}
//                 onChange={(val) =>
//                   handleChange(
//                     "frequency",
//                     val
//                   )
//                 }
//                 disabled={isViewMode}
//                 onKeyDown={handleKeyDown}
//                 className={`${getInputClass(
//                   isViewMode,
//                   "frequency"
//                 )} w-[100px]`}
//               />
//             </div>

//             <div className="flex items-center gap-2">
//               <label className="w-[250px]">
//                 Applicable From
//               </label>

//               <ERPDateInput
//                 name="applicable_from"
//                 value={
//                   formData.applicable_from ||
//                   ""
//                 }
//                 disabled={isViewMode}
//                 onChange={(value) =>
//                   handleChange(
//                     "applicable_from",
//                     value
//                   )
//                 }
//                 onKeyDown={handleKeyDown}
//                 className={`${getInputClass(
//                   isViewMode,
//                   "applicable_from"
//                 )} w-[60px]`}
//               />
//             </div>

//             <div className="flex items-center gap-4">
//               <label className="w-[50px]">
//                 Status
//               </label>

//               <div
//                 tabIndex={0}
//                 data-toggle="status"
//                 onKeyDown={handleKeyDown}
//                 onClick={() =>
//                   !isViewMode &&
//                   handleChange(
//                     "status",
//                     formData.status ===
//                       "Active"
//                       ? "Inactive"
//                       : "Active"
//                   )
//                 }
//                 className={`w-[42px] mx-[10px] h-[22px] flex items-center rounded-full p-[2px]
//                   ${
//                     formData.status ===
//                     "Active"
//                       ? "bg-green-500"
//                       : "bg-gray-400"
//                   }`}
//               >
//                 <div
//                   className={`h-[18px]  w-[18px] bg-white rounded-full transition-all
//                     ${
//                       formData.status ===
//                       "Active"
//                         ? "translate-x-[20px]"
//                         : ""
//                     }`}
//                 />
//               </div>

//               <span className="mx-[10px] text-sm">
//                 {formData.status ||
//                   "Active"}
//               </span>
//             </div>
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
//         onDelete={() =>
//           onDelete && onDelete(formData)
//         }
//         onCancel={onEditCancel}
//         onEditCancel={onEditCancel}
//         onNewEntry={onNewEntry}
//         rights={rights}
//       />
//     </div>
//   );
// };

// export default FBPConfigForm;
import React, {
  useState,
  useEffect,
  useCallback,
} from "react";

import ERPHeader from "../../../../../components/Reusable/form/HeaderForm";
import ERPFooter from "../../../../../components/Reusable/form/FooterForm";
import ERPAutocomplete from "../../../../../components/Reusable/input/ERPAutocomplete";
import ERPDateInput from "../../../../../components/Reusable/input/Date";

const FONT = `'Inter', 'Tahoma', system-ui, sans-serif`;

const FBPConfigForm = ({
  mode = "view",
  onSave,
  onDelete,
  onEditCancel,
  saving,
  onModify,
  onNewEntry,
  currentRecord,
  totalRecords,
  rights,
  activeTab = "entry",
  formData,
  setFormData,
  onTabChange = () => {},onPrevRecord,onNextRecord
}) => {
  const [errors, setErrors] = useState({});

  const isViewMode = mode === "view";
  const isAddMode = mode === "add";
  const isEditMode = mode === "edit";

  const requiredFields = [
    "name",
    "code",
    "category",
  ];

  useEffect(() => {
    if (isAddMode || isEditMode) {
      setTimeout(() => {
        const firstInput = document.querySelector(
          "#fbp-form-container input:not([disabled])"
        );

        if (firstInput) firstInput.focus();
      }, 150);
    }
  }, [isAddMode, isEditMode]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((prev) => {
        const e = { ...prev };
        delete e[field];
        return e;
      });
    }
  };

  // Mobile ke liye height h-[38px], desktop ke liye exact original h-[30px]
  const getInputClass = (disabled, field) =>
    `h-[30px] max-md:h-[38px] px-2 text-[15px] border rounded-md ${
      errors[field]
        ? "border-red-500"
        : "border-gray-300"
    } ${
      disabled
        ? "bg-gray-100 cursor-not-allowed"
        : "bg-white focus:border-blue-500"
    }`;

  const handleValidateAndSave = useCallback(() => {
    if (isViewMode) return;

    let newErrors = {};
    let firstEmpty = null;

    requiredFields.forEach((field) => {
      if (!formData[field]) {
        newErrors[field] = "Required";

        if (!firstEmpty) firstEmpty = field;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);

      setTimeout(() => {
        const el = document.querySelector(
          `[name="${firstEmpty}"]`
        );

        if (el) el.focus();
      }, 50);

      return;
    }

    onSave && onSave(formData);
  }, [formData, isViewMode, onSave]);

  const handleKeyDown = useCallback(
    (e) => {
      if (isViewMode) return;

      const container =
        document.getElementById(
          "fbp-form-container"
        );

      if (!container) return;

      const elements = Array.from(
        container.querySelectorAll(
          "input:not([disabled]), [tabindex='0'], [data-auto]"
        )
      ).filter((el) => !el.disabled);

      const index = elements.indexOf(e.target);

      if (e.key === "Enter") {
        e.preventDefault();

        if (index < elements.length - 1) {
          elements[index + 1].focus();
        } else {
          const saveBtn = Array.from(
            document.querySelectorAll("button")
          ).find(
            (btn) =>
              (btn.textContent
                ?.toLowerCase()
                .includes("save") ||
                btn.textContent
                  ?.toLowerCase()
                  .includes("update")) &&
              !btn.disabled
          );

          if (saveBtn) saveBtn.focus();
        }
      }

      if (e.key === "Backspace") {
        let shouldGoBack = false;

        if (e.target.tagName === "INPUT") {
          const isEmpty =
            e.target.value === "";

          const atStart =
            e.target.selectionStart === 0 &&
            e.target.selectionEnd === 0;

          if (isEmpty || atStart)
            shouldGoBack = true;
        }

        if (e.target.dataset.auto)
          shouldGoBack = true;

        if (
          e.target.dataset.toggle === "status"
        )
          shouldGoBack = true;

        if (shouldGoBack && index > 0) {
          e.preventDefault();
          elements[index - 1].focus();
        }
      }

      if (
        e.key === " " &&
        e.target.dataset.toggle === "status"
      ) {
        e.preventDefault();

        handleChange(
          "status",
          formData.status === "Active"
            ? "Inactive"
            : "Active"
        );
      }
    },
    [formData, isViewMode, handleChange] // Added handleChange as dependency to fix warning
  );

  return (
    <div
      className="w-full max-w-[850px] mx-auto h-[calc(100vh-140px)] bg-[#eef1f6] flex flex-col"
      style={{ fontFamily: FONT }}
    >
      <ERPHeader
        title="FBP CONFIG ENTRY"
        isAddMode={isAddMode}
        isEditMode={isEditMode}
        isViewMode={isViewMode}
        activeTab={activeTab}
        onTabChange={onTabChange}
        rightContent={`${currentRecord || 1} / ${
          totalRecords || 1
        }`}
          currentIndex={currentRecord}      // 👈
        totalRecords={totalRecords}        // 👈
        onPrevRecord={onPrevRecord}        // 👈
        onNextRecord={onNextRecord}  
      />

      {/* Wapas original 'flex justify-center' laya gaya hai, bas mobile ke liye 'max-md:justify-start' hai */}
      <div className="flex-1 p-4 flex justify-center items-start max-md:justify-start overflow-y-auto overflow-x-hidden">
        <div
          id="fbp-form-container"
          className="w-full max-w-[800px] bg-white border rounded-md p-4"
        >
          {/* Row 1 */}
          <div className="grid grid-cols-3 max-md:grid-cols-1 gap-6 max-md:gap-4">
            <div className="col-span-2 max-md:col-span-1 flex items-center max-md:flex-col max-md:items-start gap-2 max-md:gap-1">
              <label className="w-[120px] max-md:w-full">
                Benefit Name
                <span className="text-red-500 ml-1">
                  *
                </span>
              </label>

              <input
                name="name"
                value={formData.name || ""}
                disabled={isViewMode}
                onChange={(e) =>
                  handleChange(
                    "name",
                    e.target.value
                  )
                }
                onKeyDown={handleKeyDown}
                className={`${getInputClass(
                  isViewMode,
                  "name"
                )} sm:flex-1 max-md:w-full`}
              />
            </div>

            <div className="flex items-center max-md:flex-col max-md:items-start gap-2 max-md:gap-1">
              <label className="w-[80px] max-md:w-full">
                Code
                <span className="text-red-500 ml-1">
                  *
                </span>
              </label>

              <input
                name="code"
                value={formData.code || ""}
                disabled={isViewMode}
                onChange={(e) =>
                  handleChange(
                    "code",
                    e.target.value
                  )
                }
                onKeyDown={handleKeyDown}
                className={`${getInputClass(
                  isViewMode,
                  "code"
                )} w-[170px] max-md:w-full`}
              />
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-3 max-md:grid-cols-1 gap-6 max-md:gap-4 mt-4">
            <div className="flex items-center max-md:flex-col max-md:items-start gap-2 max-md:gap-1">
              <label className="w-[200px] max-md:w-full ">
                Category
                <span className="text-red-500 ml-1">
                  *
                </span>
              </label>

              <ERPAutocomplete
                data-auto
                value={formData.category || ""}
                options={[
                  "Housing",
                  "Travel",
                  "Food",
                  "Medical",
                  "Other",
                ]}
                onChange={(val) =>
                  handleChange(
                    "category",
                    val
                  )
                }
                disabled={isViewMode}
                onKeyDown={handleKeyDown}
                className={`${getInputClass(
                  isViewMode,
                  "category"
                )} max-md:w-full`}
              />
            </div>

            <div className="flex items-center max-md:flex-col max-md:items-start gap-2 max-md:gap-1">
              <label className="w-[120px]  max-md:w-full">
                Max Limit
              </label>

              <input
                type="number"
                name="max_limit"
                value={
                  formData.max_limit || ""
                }
                disabled={isViewMode}
                onChange={(e) =>
                  handleChange(
                    "max_limit",
                    e.target.value
                  )
                }
                onKeyDown={handleKeyDown}
                className={`${getInputClass(
                  isViewMode,
                  "max_limit"
                )} w-[120px] max-md:w-full`}
              />
            </div>

            <div className="flex items-center max-md:flex-col max-md:items-start gap-2 max-md:gap-1">
              <label className="w-[80px] max-md:w-full">
                Taxable
              </label>

              <ERPAutocomplete
                data-auto
                value={
                  formData.taxable ?? "Yes"
                }
                options={["Yes", "No"]}
                onChange={(val) =>
                  handleChange(
                    "taxable",
                    val
                  )
                }
                disabled={isViewMode}
                onKeyDown={handleKeyDown}
                className={`${getInputClass(
                  isViewMode,
                  "taxable"
                )} w-[90px] max-md:w-full`}
              />
            </div>
          </div>

          {/* Row 3 */}
          <div className="grid grid-cols-3 max-md:grid-cols-1 gap-6 max-md:gap-4 mt-4">
            <div className="flex items-center max-md:flex-col max-md:items-start gap-2 max-md:gap-1">
              <label className="w-[200px] max-md:w-full">
                Frequency
              </label>

              <ERPAutocomplete
                data-auto
                value={
                  formData.frequency ||
                  ""
                }
                options={[
                  "Monthly",
                  "Quarterly",
                  "Annual",
                ]}
                onChange={(val) =>
                  handleChange(
                    "frequency",
                    val
                  )
                }
                disabled={isViewMode}
                onKeyDown={handleKeyDown}
                className={`${getInputClass(
                  isViewMode,
                  "frequency"
                )} w-[100px] max-md:w-full`}
              />
            </div>

            <div className="flex items-center max-md:flex-col max-md:items-start gap-2 max-md:gap-1">
              <label className="w-[250px] max-md:w-full">
                Applicable From
              </label>

              <ERPDateInput
                name="applicable_from"
                value={
                  formData.applicable_from ||
                  ""
                }
                disabled={isViewMode}
                onChange={(value) =>
                  handleChange(
                    "applicable_from",
                    value
                  )
                }
                onKeyDown={handleKeyDown}
                className={`${getInputClass(
                  isViewMode,
                  "applicable_from"
                )} w-[60px] max-md:w-full`}
              />
            </div>

            <div className="flex items-center max-md:flex-col max-md:items-start gap-4 max-md:gap-1">
              <label className="w-[50px] max-md:w-full">
                Status
              </label>

              <div className="flex items-center">
                <div
                  tabIndex={0}
                  data-toggle="status"
                  onKeyDown={handleKeyDown}
                  onClick={() =>
                    !isViewMode &&
                    handleChange(
                      "status",
                      formData.status ===
                        "Active"
                        ? "Inactive"
                        : "Active"
                    )
                  }
                  className={`w-[42px] mx-[10px] max-md:mx-0 h-[22px] flex items-center rounded-full p-[2px] cursor-pointer
                    ${
                      formData.status ===
                      "Active"
                        ? "bg-green-500"
                        : "bg-gray-400"
                    }`}
                >
                  <div
                    className={`h-[18px] w-[18px] bg-white rounded-full transition-all
                      ${
                        formData.status ===
                        "Active"
                          ? "translate-x-[20px]"
                          : ""
                      }`}
                  />
                </div>

                <span className="mx-[10px] text-sm">
                  {formData.status ||
                    "Active"}
                </span>
              </div>
            </div>
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
        onDelete={() =>
          onDelete && onDelete(formData)
        }
        onCancel={onEditCancel}
        onEditCancel={onEditCancel}
        onNewEntry={onNewEntry}
        rights={rights}
      />
    </div>
  );
};

export default FBPConfigForm;