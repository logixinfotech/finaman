// import React, { useState, useEffect, useCallback, useRef } from "react";
// import ERPHeader from "../../../../../components/Reusable/form/HeaderForm";
// import ERPFooter from "../../../../../components/Reusable/form/FooterForm";
// import ERPAutocomplete from "../../../../../components/Reusable/input/ERPAutocomplete";
// import ERPDateInput from "../../../../../components/Reusable/input/Date";
// import { useGroupOptions } from "../../../../../Hooks/useUserGroupOption";
// const FONT = `'Inter', 'Tahoma', system-ui, sans-serif`;
// const requiredFields = ["employee_name", "grade", "effective_from", "template_id", "ctc"];

// // ================= DUMMY DATA =================
// const DUMMY_EMPLOYEES = [
//   { emp_id: "E01", name: "Rahul Sharma", grade: "Grade A" },
//   { emp_id: "E02", name: "Priya Mehta", grade: "Grade B" },
//   { emp_id: "E03", name: "Amit Patel", grade: "Grade A" },
// ];


// const DUMMY_TEMPLATES = {
//   "Grade A": {
//     template_id: "T-GA",
//     template_name: "Grade A Default Template",
//     incomeHeads: [
//       { id: "inc1", name: "Basic Salary", formula_type: "% of CTC", percentage: 40, type: "Fixed" },
//       { id: "inc2", name: "House Rent Allowance", formula_type: "% of Basic", percentage: 50, type: "Variable" },
//       { id: "inc3", name: "Special Allowance", formula_type: "Balancing", percentage: 0, type: "Variable" },
//     ],
//     deductionHeads: [
//       { id: "ded1", name: "EPF", formula_type: "% of Basic", percentage: 12, type: "Variable" },
//       { id: "ded2", name: "Professional Tax", formula_type: "Fixed", percentage: 200, type: "Fixed" },
//     ],
//   },
//   "Grade B": {
//     template_id: "T-GB",
//     template_name: "Grade B Premium Template",
//     incomeHeads: [
//       { id: "inc1", name: "Basic Salary", formula_type: "% of CTC", percentage: 50, type: "Fixed" },
//       { id: "inc2", name: "House Rent Allowance", formula_type: "% of Basic", percentage: 40, type: "Variable" },
//       { id: "inc3", name: "Special Allowance", formula_type: "Balancing", percentage: 0, type: "Variable" },
//     ],
//     deductionHeads: [
//       { id: "ded1", name: "EPF", formula_type: "% of Basic", percentage: 12, type: "Variable" },
//       { id: "ded2", name: "Professional Tax", formula_type: "Fixed", percentage: 200, type: "Fixed" },
//     ],
//   }
// };
// // ===============================================

// const SalaryStructureForm = ({
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
//   onTabChange = () => {},
//   formData,
//   setFormData,
// }) => {
//   const [errors, setErrors] = useState({});
//   const [activeHeads, setActiveHeads] = useState({}); 
//   const [calculatedValues, setCalculatedValues] = useState({ 
//     income: {}, 
//     deduction: {},
//     totalIncome: 0,
//     totalDeduction: 0,
//     netSalary: 0
//   });

//   const isViewMode = mode === "view";
//   const isAddMode = mode === "add";
//   const isEditMode = mode === "edit";
  
//   const firstInputRef = useRef(null);
//   const {options} =useGroupOptions();

//   useEffect(() => {
//     if (!isViewMode && firstInputRef.current) {
//       setTimeout(() => firstInputRef.current.focus(), 150);
//     }
//   }, [isViewMode, isAddMode, isEditMode]);

//   const handleEmployeeChange = (empName) => {
//     handleChange("employee_name", empName);
//     const emp = DUMMY_EMPLOYEES.find(e => e.name === empName);
//     if (emp) {
//       handleChange("grade", emp.grade);
//     } else {
//       handleChange("grade", "");
//     }
//   };

//   useEffect(() => {
//     if (formData.grade) {
//       const template = DUMMY_TEMPLATES[formData.grade];
//       if (template) {
//         handleChange("template_id", template.template_name);
//         const initialHeads = {};
//         template.incomeHeads.forEach(h => initialHeads[h.id] = true);
//         template.deductionHeads.forEach(h => initialHeads[h.id] = true);
//         setActiveHeads(initialHeads);
//       }
//     }
//   }, [formData.grade]);

//   // Main Calculation Engine
//   useEffect(() => {
//     const template = DUMMY_TEMPLATES[formData.grade];
//     if (formData.ctc && template) {
//       const ctcYearly = parseFloat(formData.ctc) || 0;
//       const ctcMonthly = ctcYearly / 12;
      
//       let calcInc = {};
//       let calcDed = {};
//       let totalIncome = 0;
//       let totalDeduction = 0;
//       let basicAmount = 0;

//       template.incomeHeads.forEach(head => {
//         if (!activeHeads[head.id] || head.formula_type === "Balancing") return;
        
//         let val = 0;
//         if (head.formula_type === "% of CTC") val = (ctcMonthly * head.percentage) / 100;
//         if (head.formula_type === "Fixed") val = head.percentage;
        
//         if (head.name.toLowerCase().includes("basic")) basicAmount = val;
        
//         if (head.formula_type === "% of Basic") val = (basicAmount * head.percentage) / 100;
        
//         calcInc[head.id] = val;
//         totalIncome += val;
//       });

//       template.incomeHeads.forEach(head => {
//         if (activeHeads[head.id] && head.formula_type === "Balancing") {
//           const val = Math.max(0, ctcMonthly - totalIncome);
//           calcInc[head.id] = val;
//           totalIncome += val;
//         }
//       });

//       template.deductionHeads.forEach(head => {
//         if (!activeHeads[head.id]) return;
        
//         let val = 0;
//         if (head.formula_type === "% of Basic") val = (basicAmount * head.percentage) / 100;
//         if (head.formula_type === "Fixed") val = head.percentage;
//         if (head.formula_type === "% of Gross") val = (totalIncome * head.percentage) / 100;
        
//         calcDed[head.id] = val;
//         totalDeduction += val;
//       });

//       setCalculatedValues({ 
//         income: calcInc, 
//         deduction: calcDed,
//         totalIncome: totalIncome,
//         totalDeduction: totalDeduction,
//         netSalary: totalIncome - totalDeduction
//       });

//       const gross = totalIncome.toFixed(2);
//       if (formData.gross_monthly !== gross) {
//         setFormData(prev => ({ ...prev, gross_monthly: gross }));
//       }
//     } else {
//       setCalculatedValues({ income: {}, deduction: {}, totalIncome: 0, totalDeduction: 0, netSalary: 0 });
//       if (formData.gross_monthly !== "") setFormData(prev => ({ ...prev, gross_monthly: "" }));
//     }
//   }, [formData.ctc, formData.grade, activeHeads, setFormData]);

//   const toggleHead = (id) => {
//     if (isViewMode) return;
//     setActiveHeads(prev => ({ ...prev, [id]: !prev[id] }));
//   };

//   const handleChange = (field, value) => {
//     setFormData(prev => ({ ...prev, [field]: value }));
//     if (errors[field]) {
//       setErrors(prev => {
//         const e = { ...prev };
//         delete e[field];
//         return e;
//       });
//     }
//   };

//   // Wahi same purana Input Class jo Salary Template Form me hai
//   const getInputClass = (disabled, field) =>
//     `h-[30px] px-2 text-[16px] border rounded-md ${
//       errors[field] ? "border-red-500" : "border-gray-300"
//     } ${disabled ? "bg-gray-100 cursor-not-allowed" : "bg-white focus:border-blue-500"}`; 

//   const handleValidateAndSave = useCallback(() => {
//     if (isViewMode) return;
//     let newErrors = {};
//     let firstEmpty = null;

//     requiredFields.forEach(field => {
//       if (!formData[field]) {
//         newErrors[field] = "Required";
//         if (!firstEmpty) firstEmpty = field;
//       }
//     });

//     if (Object.keys(newErrors).length > 0) {
//       setErrors(newErrors);
//       setTimeout(() => {
//         const el = document.querySelector(`[name="${firstEmpty}"]`) || document.querySelector(`[data-field="${firstEmpty}"] input`);
//         if (el) el.focus();
//       }, 50);
//       return;
//     }
    
//     onSave && onSave({ ...formData, calculatedValues });
//   }, [formData, calculatedValues, isViewMode, onSave]); 

//   // Wahi same purana KeyDown logic
//   const handleKeyDown = useCallback(
//     (e) => {
//       if (isViewMode) return;

//       const container = document.getElementById("salary-form-container");
//       if (!container) return;

//       const elements = Array.from(
//         container.querySelectorAll("[data-auto], input, textarea, select, button")
//       )
//         .filter((el) => !el.disabled && el.offsetParent !== null)
//         .sort((a, b) => {
//           const aRect = a.getBoundingClientRect();
//           const bRect = b.getBoundingClientRect();
//           if (Math.abs(aRect.top - bRect.top) > 18) { 
//             return aRect.top - bRect.top;
//           }
//           return aRect.left - bRect.left;
//         });

//       const index = elements.indexOf(e.target);

//       if (e.key === "Enter") {
//         e.preventDefault();
//         e.stopPropagation();

//         if (index < elements.length - 1) {
//           elements[index + 1].focus();
//         } else {
//           let submitBtn = document.querySelector("#save") || document.querySelector("#update");
//           if (submitBtn) {
//             submitBtn.focus();
//           }
//         }
//       }
//       if (e.key === "Backspace") {
//         const el = e.target;
//         const tag = el.tagName;
//         const type = el.type;

//         let shouldGoBack = false;

//         if (tag === "INPUT" || tag === "TEXTAREA") {
//           if (type === "checkbox" || type === "radio") {
//             shouldGoBack = true;
//           } else {
//             if (!el.value || el.value === "") {
//               shouldGoBack = true;
//             }
//           }
//         } else if (tag === "SELECT" || tag === "DIV") {
//           shouldGoBack = true;
//         }

//         if (shouldGoBack && index > 0) {
//           e.preventDefault(); 
//           let prevIndex = index - 1;
//           while (prevIndex >= 0) {
//             const prevEl = elements[prevIndex];
//             if (prevEl && !prevEl.disabled && prevEl.offsetParent !== null) {
//               prevEl.focus();
//               if (
//                 prevEl.tagName === "INPUT" &&
//                 (prevEl.type === "text" || prevEl.type === "search" || prevEl.type === "url" || prevEl.type === "tel" || prevEl.type === "number") &&
//                 typeof prevEl.setSelectionRange === "function"
//               ) {
//                 const len = prevEl.value?.length || 0;
//                 try { prevEl.setSelectionRange(len, len); } catch {}
//               }
//               break;
//             }
//             prevIndex--;
//           }
//         }
//       }
//     },
//     [isViewMode]
//   );

//   const currentTemplate = DUMMY_TEMPLATES[formData.grade];

//   return (
//     <div
//       className="w-full max-w-[1300px] mx-auto h-[calc(100vh-120px)] bg-[#eef1f6] flex flex-col"
//       style={{ fontFamily: FONT }}
//     >
//       <ERPHeader
//         title="SALARY STRUCTURE ENTRY"
//         isAddMode={isAddMode}
//         isEditMode={isEditMode}
//         isViewMode={isViewMode}
//         activeTab={activeTab}
//         onTabChange={onTabChange}
//         rightContent={`${currentRecord || 1} / ${totalRecords || 1}`}
//       />

//       <div className="flex-1 p-4 overflow-y-auto overflow-x-auto flex justify-start lg:justify-center items-start w-full">
//         <div
//           id="salary-form-container"
//           className="w-full min-w-[1000px] lg:min-w-0 bg-white border rounded-md p-4 flex flex-col gap-2"
//         >
          
//           {/* Row 1 */}
//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 ">
//             <div className="flex items-center gap-1">
//               <label className="w-[100px]">
//                 Employee <span className="text-red-500">*</span>
//               </label>
//               <div data-field="employee_name" className="w-[150px]">
//                 <ERPAutocomplete
//                   data-auto
//                   ref={firstInputRef}
//                   value={formData.employee_name || ""}
//                   options={DUMMY_EMPLOYEES.map(e => e.name)}
//                   onChange={handleEmployeeChange}
//                   disabled={isViewMode || isEditMode}
//                   onKeyDown={handleKeyDown}
//                   className={`${getInputClass(isViewMode || isEditMode, "employee_name")} w-[80px]`}
//                 />
//               </div>
//             </div>

//             <div className="flex items-center gap-1">
//               <label className="w-[70px]">
//                 Grade <span className="text-red-500">*</span>
//               </label>
//               <input
//                 data-auto
//                 type="text"
//                 name="grade"
//                 value={formData.grade || ""}
//                 disabled={true} 
//                 className={`${getInputClass(true, "grade")} w-[150px]`}
//               />
//             </div>


//             <div className="flex items-center gap-1">
//               <label className="w-[180px]">Effective From</label>
//               <ERPDateInput
//                 value={formData.effective_from || ""}
//                 disabled={isViewMode}
//                 onChange={(value) => handleChange("effective_from", value)}
//                 onKeyDown={handleKeyDown}
//                 className={`${getInputClass(isViewMode, "effective_from")} max-w-[120px] `}
//               />
//             </div>
//             <div className="flex items-center gap-1">
//               <label className="w-[60px]">
//                 CTC <span className="text-red-500">*</span>
//               </label>
//               <input
//                 data-auto
//                 type="number"
//                 name="ctc"
//                 value={formData.ctc || ""}
//                 disabled={isViewMode}
//                 onChange={e => handleChange("ctc", e.target.value)}
//                 onKeyDown={handleKeyDown}
//                 className={`${getInputClass(isViewMode, "ctc")} w-[160px]`}
//               />
//             </div>
//           </div> 
          
//           {/* Row 2 */}
//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            

//             <div className="flex items-center gap-1">
//               <label className="w-[100px]">Gross</label>
//               <input
//                 data-auto
//                 type="text"
//                 name="gross_monthly"
//                 value={formData.gross_monthly || ""}
//                 disabled={true}
//                 className={`${getInputClass(true, "gross_monthly")} w-[150px] bg-gray-100 font-500`}
//               />
//             </div>

//             {/* Status Checkbox Design Exactly Like Template Form */}
//             <div className="flex items-center ">
//               <label className="w-[120px]">Status</label>
//               <div
//                 tabIndex={0}
//                 data-auto
//                 onKeyDown={(e) => {
//                   handleKeyDown(e);
//                   if (!isViewMode && e.key === " ") {
//                     e.preventDefault();
//                     handleChange("status", formData.status === "Active" ? "Inactive" : "Active");
//                   }
//                 }}
//                 onClick={() =>
//                   !isViewMode &&
//                   handleChange("status", formData.status === "Active" ? "Inactive" : "Active")
//                 }
//                 className={`w-[42px] h-[22px] flex items-center rounded-full p-[2px] cursor-pointer ${
//                   (formData.status || "Active") === "Active" ? "bg-green-500" : "bg-gray-400"
//                 }`}
//               >
//                 <div
//                   className={`h-[18px] w-[18px] bg-white rounded-full transition-all ${
//                     (formData.status || "Active") === "Active" ? "translate-x-[20px]" : ""
//                   }`}
//                 />
//               </div>
//               <span className="text-sm ml-[18px]">
//                 {formData.status || "Active"}
//               </span>
//             </div>
//           </div>

//           <hr className="border-gray-200" />

//           {/* DYNAMIC CALCULATION BLOCK (UI Format Same as Template Form) */}
//           {currentTemplate && formData.ctc && (
//             <div className="grid grid-cols-2 gap-4">
              
//               {/* Earnings Table UI */}
//               <div className="bg-white border rounded-lg flex flex-col">
//                 <div className="flex justify-between items-center px-3 py-2 border-b bg-gray-100 rounded-t-lg">
//                   <span className="text-gray-600 font-semibold text-sm">
//                     Earnings (Monthly)
//                   </span>
//                 </div>
//                 <div className="max-h-[250px] overflow-y-auto flex-1">
//                   {currentTemplate.incomeHeads.map(head => (
//                     <div key={head.id} className={`flex items-center justify-between px-3 py-2 border-b ${isViewMode ? "cursor-not-allowed" : "hover:bg-gray-50"}`}>
//                       <div className="flex items-center gap-2">
//                         <input 
//                           data-auto
//                           type="checkbox" 
//                           checked={activeHeads[head.id] || false}
//                           disabled={isViewMode}
//                           onChange={() => toggleHead(head.id)}
//                           onKeyDown={handleKeyDown}
//                           className={`${isViewMode ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
//                         />
//                         <div className={`text-base font-medium ${!activeHeads[head.id] ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
//                           {head.name}
//                         </div>
//                       </div>
//                       <div className="text-sm font-semibold text-gray-500">
//                         ₹ {activeHeads[head.id] ? (calculatedValues.income[head.id] || 0).toFixed(2) : "0.00"}
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//                 {/* Total Income Footer */}
//                 <div className="flex justify-between items-center px-3 py-2 border-t bg-gray-50 rounded-b-lg">
//                   <span className="text-gray-700 font-bold text-sm">Total Income</span>
//                   <span className="text-gray-700 font-bold text-sm">₹ {calculatedValues.totalIncome.toFixed(2)}</span>
//                 </div>
//               </div>
              
//               {/* Deductions Table UI */}
//               <div className="bg-white border rounded-lg flex flex-col">
//                 <div className="flex justify-between items-center px-3 py-2 border-b bg-gray-100 rounded-t-lg">
//                   <span className="text-gray-500 font-semibold text-sm">
//                     Deductions (Monthly)
//                   </span>
//                 </div>
//                 <div className="max-h-[250px] overflow-y-auto flex-1">
//                   {currentTemplate.deductionHeads.map(head => (
//                     <div key={head.id} className={`flex items-center justify-between px-3 py-2 border-b ${isViewMode ? "cursor-not-allowed" : "hover:bg-gray-50"}`}>
//                       <div className="flex items-center gap-2">
//                         <input 
//                           data-auto
//                           type="checkbox" 
//                           checked={activeHeads[head.id] || false}
//                           disabled={isViewMode}
//                           onChange={() => toggleHead(head.id)}
//                           onKeyDown={handleKeyDown}
//                           className={`${isViewMode ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
//                         />
//                         <div className={`text-base md:text-base 2xl:text-lg font-medium ${!activeHeads[head.id] ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
//                           {head.name}
//                         </div>
//                       </div>
//                       <div className="text-sm font-semibold text-red-500">
//                         ₹ {activeHeads[head.id] ? (calculatedValues.deduction[head.id] || 0).toFixed(2) : "0.00"}
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//                 {/* Total Deduction Footer */}
//                 <div className="flex justify-between items-center px-3 py-2 border-t bg-gray-50 rounded-b-lg">
//                   <span className="text-gray-700 font-bold text-sm">Total Deduction</span>
//                   <span className="text-red-600 font-bold text-sm">₹ {calculatedValues.totalDeduction.toFixed(2)}</span>
//                 </div>
//               </div>

//               {/* NET SALARY - Bottom Right */}
//               <div className="col-span-2 flex justify-end mt-2">
//                 <div className="flex items-center gap-4 bg-green-50 border border-green-200 px-2 py-1 rounded-md">
//                   <span className="text-[14px] font-bold text-green-600">NET SALARY:</span>
//                   <span className="text-[16px] font-extrabold text-green-600">₹ {calculatedValues.netSalary.toFixed(2)}</span>
//                 </div>
//               </div>
//             </div>
//           )}

//           <hr className="border-gray-200" />

//           {/* Row 3: Admin & Revisions */}
//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
//             <div className="flex items-center gap-3">
//               <label className="w-[120px]">
//                 Revision reason
//               </label>
//               <div data-field="revision_reason" className="flex-1">
//                 <ERPAutocomplete
//                   data-auto
//                   value={formData.revision_reason || ""}
//                   options={["Annual increment", "Promotion", "Correction", "Joining"]}
//                   onChange={(val) => handleChange("revision_reason", val)}
//                   disabled={isViewMode || !isEditMode} 
//                   onKeyDown={handleKeyDown}
//                   className={`${getInputClass(isViewMode || !isEditMode, "revision_reason")} w-full`}
//                 />
//               </div>
//             </div>

//             <div className="flex items-center gap-3">
//               <label className="w-[120px]">
//                 Arrear applicable
//               </label>
//               <div data-field="arrear_applicable" className="flex-1">
//                 <ERPAutocomplete
//                   data-auto
//                   value={formData.arrear_applicable || "No"}
//                   options={["Yes", "No"]}
//                   onChange={(val) => handleChange("arrear_applicable", val)}
//                   disabled={isViewMode || !isEditMode}
//                   onKeyDown={handleKeyDown}
//                   className={`${getInputClass(isViewMode || !isEditMode, "arrear_applicable")} w-full`}
//                 />
//               </div>
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
//         onDelete={() => onDelete && onDelete(formData)}
//         onCancel={onCancel}
//         onEditCancel={onEditCancel}
//         onNewEntry={onNewEntry}
//         rights={rights}
//       />
//     </div>
//   );
// };


// export default SalaryStructureForm;
import React, { useState, useEffect, useCallback, useRef } from "react";
import ERPHeader from "../../../../../components/Reusable/form/HeaderForm";
import ERPFooter from "../../../../../components/Reusable/form/FooterForm";
import ERPAutocomplete from "../../../../../components/Reusable/input/ERPAutocomplete";
import ERPDateInput from "../../../../../components/Reusable/input/Date";
import { useGroupOptions } from "../../../../../Hooks/useUserGroupOption";

const FONT = `'Inter', 'Tahoma', system-ui, sans-serif`;
const requiredFields = ["employee_name", "grade", "effective_from", "template_id", "ctc"];

// ================= DUMMY DATA =================
const DUMMY_EMPLOYEES = [
  { emp_id: "E01", name: "Rahul Sharma", grade: "Grade A" },
  { emp_id: "E02", name: "Priya Mehta", grade: "Grade B" },
  { emp_id: "E03", name: "Amit Patel", grade: "Grade A" },
];

const DUMMY_TEMPLATES = {
  "Grade A": {
    template_id: "T-GA",
    template_name: "Grade A Default Template",
    incomeHeads: [
      { id: "inc1", name: "Basic Salary", formula_type: "% of CTC", percentage: 40, type: "Fixed" },
      { id: "inc2", name: "House Rent Allowance", formula_type: "% of Basic", percentage: 50, type: "Variable" },
      { id: "inc3", name: "Special Allowance", formula_type: "Balancing", percentage: 0, type: "Variable" },
    ],
    deductionHeads: [
      { id: "ded1", name: "EPF", formula_type: "% of Basic", percentage: 12, type: "Variable" },
      { id: "ded2", name: "Professional Tax", formula_type: "Fixed", percentage: 200, type: "Fixed" },
    ],
  },
  "Grade B": {
    template_id: "T-GB",
    template_name: "Grade B Premium Template",
    incomeHeads: [
      { id: "inc1", name: "Basic Salary", formula_type: "% of CTC", percentage: 50, type: "Fixed" },
      { id: "inc2", name: "House Rent Allowance", formula_type: "% of Basic", percentage: 40, type: "Variable" },
      { id: "inc3", name: "Special Allowance", formula_type: "Balancing", percentage: 0, type: "Variable" },
    ],
    deductionHeads: [
      { id: "ded1", name: "EPF", formula_type: "% of Basic", percentage: 12, type: "Variable" },
      { id: "ded2", name: "Professional Tax", formula_type: "Fixed", percentage: 200, type: "Fixed" },
    ],
  }
};
// ===============================================

const SalaryStructureForm = ({
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
  onTabChange = () => {},
  formData,
  setFormData,
}) => {
  const [errors, setErrors] = useState({});
  const [activeHeads, setActiveHeads] = useState({}); 
  const [calculatedValues, setCalculatedValues] = useState({ 
    income: {}, 
    deduction: {},
    totalIncome: 0,
    totalDeduction: 0,
    netSalary: 0
  });

  const isViewMode = mode === "view";
  const isAddMode = mode === "add";
  const isEditMode = mode === "edit";
  
  const firstInputRef = useRef(null);
  const {options} =useGroupOptions();

  useEffect(() => {
    if (!isViewMode && firstInputRef.current) {
      setTimeout(() => firstInputRef.current.focus(), 150);
    }
  }, [isViewMode, isAddMode, isEditMode]);

  const handleEmployeeChange = (empName) => {
    handleChange("employee_name", empName);
    const emp = DUMMY_EMPLOYEES.find(e => e.name === empName);
    if (emp) {
      handleChange("grade", emp.grade);
    } else {
      handleChange("grade", "");
    }
  };

  useEffect(() => {
    if (formData.grade) {
      const template = DUMMY_TEMPLATES[formData.grade];
      if (template) {
        handleChange("template_id", template.template_name);
        const initialHeads = {};
        template.incomeHeads.forEach(h => initialHeads[h.id] = true);
        template.deductionHeads.forEach(h => initialHeads[h.id] = true);
        setActiveHeads(initialHeads);
      }
    }
  }, [formData.grade]);

  // Main Calculation Engine
  useEffect(() => {
    const template = DUMMY_TEMPLATES[formData.grade];
    if (formData.ctc && template) {
      const ctcYearly = parseFloat(formData.ctc) || 0;
      const ctcMonthly = ctcYearly / 12;
      
      let calcInc = {};
      let calcDed = {};
      let totalIncome = 0;
      let totalDeduction = 0;
      let basicAmount = 0;

      template.incomeHeads.forEach(head => {
        if (!activeHeads[head.id] || head.formula_type === "Balancing") return;
        
        let val = 0;
        if (head.formula_type === "% of CTC") val = (ctcMonthly * head.percentage) / 100;
        if (head.formula_type === "Fixed") val = head.percentage;
        
        if (head.name.toLowerCase().includes("basic")) basicAmount = val;
        
        if (head.formula_type === "% of Basic") val = (basicAmount * head.percentage) / 100;
        
        calcInc[head.id] = val;
        totalIncome += val;
      });

      template.incomeHeads.forEach(head => {
        if (activeHeads[head.id] && head.formula_type === "Balancing") {
          const val = Math.max(0, ctcMonthly - totalIncome);
          calcInc[head.id] = val;
          totalIncome += val;
        }
      });

      template.deductionHeads.forEach(head => {
        if (!activeHeads[head.id]) return;
        
        let val = 0;
        if (head.formula_type === "% of Basic") val = (basicAmount * head.percentage) / 100;
        if (head.formula_type === "Fixed") val = head.percentage;
        if (head.formula_type === "% of Gross") val = (totalIncome * head.percentage) / 100;
        
        calcDed[head.id] = val;
        totalDeduction += val;
      });

      setCalculatedValues({ 
        income: calcInc, 
        deduction: calcDed,
        totalIncome: totalIncome,
        totalDeduction: totalDeduction,
        netSalary: totalIncome - totalDeduction
      });

      const gross = totalIncome.toFixed(2);
      if (formData.gross_monthly !== gross) {
        setFormData(prev => ({ ...prev, gross_monthly: gross }));
      }
    } else {
      setCalculatedValues({ income: {}, deduction: {}, totalIncome: 0, totalDeduction: 0, netSalary: 0 });
      if (formData.gross_monthly !== "") setFormData(prev => ({ ...prev, gross_monthly: "" }));
    }
  }, [formData.ctc, formData.grade, activeHeads, setFormData]);

  const toggleHead = (id) => {
    if (isViewMode) return;
    setActiveHeads(prev => ({ ...prev, [id]: !prev[id] }));
  };

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

  // 🔥 Yahan max-sm: se height override ki hai sirf mobile ke liye
  const getInputClass = (disabled, field) =>
    `h-[30px] max-sm:!h-[38px] px-2 text-[16px] border rounded-md ${
      errors[field] ? "border-red-500" : "border-gray-300"
    } ${disabled ? "bg-gray-100 cursor-not-allowed" : "bg-white focus:border-blue-500"}`; 

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
        const el = document.querySelector(`[name="${firstEmpty}"]`) || document.querySelector(`[data-field="${firstEmpty}"] input`);
        if (el) el.focus();
      }, 50);
      return;
    }
    
    onSave && onSave({ ...formData, calculatedValues });
  }, [formData, calculatedValues, isViewMode, onSave]); 

  const handleKeyDown = useCallback(
    (e) => {
      if (isViewMode) return;

      const container = document.getElementById("salary-form-container");
      if (!container) return;

      const elements = Array.from(
        container.querySelectorAll("[data-auto], input, textarea, select, button")
      )
        .filter((el) => !el.disabled && el.offsetParent !== null)
        .sort((a, b) => {
          const aRect = a.getBoundingClientRect();
          const bRect = b.getBoundingClientRect();
          if (Math.abs(aRect.top - bRect.top) > 18) { 
            return aRect.top - bRect.top;
          }
          return aRect.left - bRect.left;
        });

      const index = elements.indexOf(e.target);

      if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();

        if (index < elements.length - 1) {
          elements[index + 1].focus();
        } else {
          let submitBtn = document.querySelector("#save") || document.querySelector("#update");
          if (submitBtn) {
            submitBtn.focus();
          }
        }
      }
      if (e.key === "Backspace") {
        const el = e.target;
        const tag = el.tagName;
        const type = el.type;

        let shouldGoBack = false;

        if (tag === "INPUT" || tag === "TEXTAREA") {
          if (type === "checkbox" || type === "radio") {
            shouldGoBack = true;
          } else {
            if (!el.value || el.value === "") {
              shouldGoBack = true;
            }
          }
        } else if (tag === "SELECT" || tag === "DIV") {
          shouldGoBack = true;
        }

        if (shouldGoBack && index > 0) {
          e.preventDefault(); 
          let prevIndex = index - 1;
          while (prevIndex >= 0) {
            const prevEl = elements[prevIndex];
            if (prevEl && !prevEl.disabled && prevEl.offsetParent !== null) {
              prevEl.focus();
              if (
                prevEl.tagName === "INPUT" &&
                (prevEl.type === "text" || prevEl.type === "search" || prevEl.type === "url" || prevEl.type === "tel" || prevEl.type === "number") &&
                typeof prevEl.setSelectionRange === "function"
              ) {
                const len = prevEl.value?.length || 0;
                try { prevEl.setSelectionRange(len, len); } catch {}
              }
              break;
            }
            prevIndex--;
          }
        }
      }
    },
    [isViewMode]
  );

  const currentTemplate = DUMMY_TEMPLATES[formData.grade];

  return (
    <div
      className="w-full max-w-[1300px] mx-auto h-[calc(100vh-120px)] bg-[#eef1f6] flex flex-col"
      style={{ fontFamily: FONT }}
    >
      <ERPHeader
        title="SALARY STRUCTURE ENTRY"
        isAddMode={isAddMode}
        isEditMode={isEditMode}
        isViewMode={isViewMode}
        activeTab={activeTab}
        onTabChange={onTabChange}
        rightContent={`${currentRecord || 1} / ${totalRecords || 1}`}
      />

      <div className="flex-1 p-4 overflow-y-auto overflow-x-auto flex justify-start lg:justify-center items-start w-full">
        <div
          id="salary-form-container"
          // 🔥 CONTAINER: Desktop pe min-w-[1000px] waisa hi rahega, bas mobile par (max-sm:min-w-0) scroll bachayega
          className="w-full max-sm:min-w-0 min-w-[1000px] lg:min-w-0 bg-white border rounded-md p-4 flex flex-col gap-2 max-sm:gap-4"
        >
          
          {/* Row 1 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 max-sm:gap-4">
            <div className="flex items-center gap-1 max-sm:flex-col max-sm:items-start">
              <label className="w-[100px] max-sm:w-full">
                Employee <span className="text-red-500">*</span>
              </label>
              <div data-field="employee_name" className="w-[150px] max-sm:w-full">
                <ERPAutocomplete
                  data-auto
                  ref={firstInputRef}
                  value={formData.employee_name || ""}
                  options={DUMMY_EMPLOYEES.map(e => e.name)}
                  onChange={handleEmployeeChange}
                  disabled={isViewMode || isEditMode}
                  onKeyDown={handleKeyDown}
                  className={`${getInputClass(isViewMode || isEditMode, "employee_name")} w-[80px] max-sm:!w-full`}
                />
              </div>
            </div>

            <div className="flex items-center gap-1 max-sm:flex-col max-sm:items-start">
              <label className="w-[70px] max-sm:w-full">
                Grade <span className="text-red-500">*</span>
              </label>
              <input
                data-auto
                type="text"
                name="grade"
                value={formData.grade || ""}
                disabled={true} 
                className={`${getInputClass(true, "grade")} w-[150px] max-sm:!w-full`}
              />
            </div>

            <div className="flex items-center gap-1 max-sm:flex-col max-sm:items-start">
              <label className="w-[180px] max-sm:w-full">Effective From</label>
              <ERPDateInput
                value={formData.effective_from || ""}
                disabled={isViewMode}
                onChange={(value) => handleChange("effective_from", value)}
                onKeyDown={handleKeyDown}
                className={`${getInputClass(isViewMode, "effective_from")} max-w-[120px] max-sm:!max-w-full max-sm:!w-full`}
              />
            </div>
            
            <div className="flex items-center gap-1 max-sm:flex-col max-sm:items-start">
              <label className="w-[60px] max-sm:w-full">
                CTC <span className="text-red-500">*</span>
              </label>
              <input
                data-auto
                type="number"
                name="ctc"
                value={formData.ctc || ""}
                disabled={isViewMode}
                onChange={e => handleChange("ctc", e.target.value)}
                onKeyDown={handleKeyDown}
                className={`${getInputClass(isViewMode, "ctc")} w-[160px] max-sm:!w-full`}
              />
            </div>
          </div> 
          
          {/* Row 2 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 max-sm:gap-4 mt-2 max-sm:mt-0">
            
            <div className="flex items-center gap-1 max-sm:flex-col max-sm:items-start">
              <label className="w-[100px] max-sm:w-full">Gross</label>
              <input
                data-auto
                type="text"
                name="gross_monthly"
                value={formData.gross_monthly || ""}
                disabled={true}
                className={`${getInputClass(true, "gross_monthly")} w-[150px] max-sm:!w-full bg-gray-100 font-500`}
              />
            </div>

            {/* Status Checkbox */}
            <div className="flex items-center max-sm:flex-col max-sm:items-start max-sm:gap-1">
              <label className="w-[120px] max-sm:w-full">Status</label>
              <div className="flex items-center">
                <div
                  tabIndex={0}
                  data-auto
                  onKeyDown={(e) => {
                    handleKeyDown(e);
                    if (!isViewMode && e.key === " ") {
                      e.preventDefault();
                      handleChange("status", formData.status === "Active" ? "Inactive" : "Active");
                    }
                  }}
                  onClick={() =>
                    !isViewMode &&
                    handleChange("status", formData.status === "Active" ? "Inactive" : "Active")
                  }
                  className={`w-[42px] h-[22px] flex items-center rounded-full p-[2px] cursor-pointer ${
                    (formData.status || "Active") === "Active" ? "bg-green-500" : "bg-gray-400"
                  }`}
                >
                  <div
                    className={`h-[18px] w-[18px] bg-white rounded-full transition-all ${
                      (formData.status || "Active") === "Active" ? "translate-x-[20px]" : ""
                    }`}
                  />
                </div>
                <span className="text-sm ml-[18px]">
                  {formData.status || "Active"}
                </span>
              </div>
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* DYNAMIC CALCULATION BLOCK */}
          {currentTemplate && formData.ctc && (
            <div className="grid grid-cols-2 max-sm:grid-cols-1 gap-4">
              
              {/* Earnings Table UI */}
              <div className="bg-white border rounded-lg flex flex-col">
                <div className="flex justify-between items-center px-3 py-2 border-b bg-gray-100 rounded-t-lg">
                  <span className="text-gray-600 font-semibold text-sm">
                    Earnings (Monthly)
                  </span>
                </div>
                <div className="max-h-[250px] overflow-y-auto flex-1">
                  {currentTemplate.incomeHeads.map(head => (
                    <div key={head.id} className={`flex items-center justify-between px-3 py-2 border-b ${isViewMode ? "cursor-not-allowed" : "hover:bg-gray-50"}`}>
                      <div className="flex items-center gap-2">
                        <input 
                          data-auto
                          type="checkbox" 
                          checked={activeHeads[head.id] || false}
                          disabled={isViewMode}
                          onChange={() => toggleHead(head.id)}
                          onKeyDown={handleKeyDown}
                          className={`${isViewMode ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                        />
                        <div className={`text-base font-medium ${!activeHeads[head.id] ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                          {head.name}
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-gray-500">
                        ₹ {activeHeads[head.id] ? (calculatedValues.income[head.id] || 0).toFixed(2) : "0.00"}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center px-3 py-2 border-t bg-gray-50 rounded-b-lg">
                  <span className="text-gray-700 font-bold text-sm">Total Income</span>
                  <span className="text-gray-700 font-bold text-sm">₹ {calculatedValues.totalIncome.toFixed(2)}</span>
                </div>
              </div>
              
              {/* Deductions Table UI */}
              <div className="bg-white border rounded-lg flex flex-col">
                <div className="flex justify-between items-center px-3 py-2 border-b bg-gray-100 rounded-t-lg">
                  <span className="text-gray-500 font-semibold text-sm">
                    Deductions (Monthly)
                  </span>
                </div>
                <div className="max-h-[250px] overflow-y-auto flex-1">
                  {currentTemplate.deductionHeads.map(head => (
                    <div key={head.id} className={`flex items-center justify-between px-3 py-2 border-b ${isViewMode ? "cursor-not-allowed" : "hover:bg-gray-50"}`}>
                      <div className="flex items-center gap-2">
                        <input 
                          data-auto
                          type="checkbox" 
                          checked={activeHeads[head.id] || false}
                          disabled={isViewMode}
                          onChange={() => toggleHead(head.id)}
                          onKeyDown={handleKeyDown}
                          className={`${isViewMode ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                        />
                        <div className={`text-base md:text-base 2xl:text-lg font-medium ${!activeHeads[head.id] ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                          {head.name}
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-red-500">
                        ₹ {activeHeads[head.id] ? (calculatedValues.deduction[head.id] || 0).toFixed(2) : "0.00"}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center px-3 py-2 border-t bg-gray-50 rounded-b-lg">
                  <span className="text-gray-700 font-bold text-sm">Total Deduction</span>
                  <span className="text-red-600 font-bold text-sm">₹ {calculatedValues.totalDeduction.toFixed(2)}</span>
                </div>
              </div>

              {/* NET SALARY */}
              <div className="col-span-2 max-sm:col-span-1 flex justify-end max-sm:justify-start mt-2">
                <div className="flex items-center gap-4 bg-green-50 border border-green-200 px-2 py-1 rounded-md">
                  <span className="text-[14px] font-bold text-green-600">NET SALARY:</span>
                  <span className="text-[16px] font-extrabold text-green-600">₹ {calculatedValues.netSalary.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          <hr className="border-gray-200" />

          {/* Row 3: Admin & Revisions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 max-sm:flex-col max-sm:items-start max-sm:gap-1">
              <label className="w-[120px] max-sm:w-full">
                Revision reason
              </label>
              <div data-field="revision_reason" className="flex-1 max-sm:w-full">
                <ERPAutocomplete
                  data-auto
                  value={formData.revision_reason || ""}
                  options={["Annual increment", "Promotion", "Correction", "Joining"]}
                  onChange={(val) => handleChange("revision_reason", val)}
                  disabled={isViewMode || !isEditMode} 
                  onKeyDown={handleKeyDown}
                  className={`${getInputClass(isViewMode || !isEditMode, "revision_reason")} w-full`}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 max-sm:flex-col max-sm:items-start max-sm:gap-1">
              <label className="w-[120px] max-sm:w-full">
                Arrear applicable
              </label>
              <div data-field="arrear_applicable" className="flex-1 max-sm:w-full">
                <ERPAutocomplete
                  data-auto
                  value={formData.arrear_applicable || "No"}
                  options={["Yes", "No"]}
                  onChange={(val) => handleChange("arrear_applicable", val)}
                  disabled={isViewMode || !isEditMode}
                  onKeyDown={handleKeyDown}
                  className={`${getInputClass(isViewMode || !isEditMode, "arrear_applicable")} w-full`}
                />
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
        onDelete={() => onDelete && onDelete(formData)}
        onCancel={onCancel}
        onEditCancel={onEditCancel}
        onNewEntry={onNewEntry}
        rights={rights}
      />
    </div>
  );
};

export default SalaryStructureForm;