// import React, { useState, useCallback, useEffect, useRef } from "react";
// import ERPHeader from "../../../../components/Reusable/form/HeaderForm";
// import ERPFooter from "../../../../components/Reusable/form/FooterForm";
// import ERPAutocomplete from "../../../../components/Reusable/input/ERPAutocomplete";

// const FONT = `'Inter', 'Tahoma', system-ui, sans-serif`;

// const FY_OPTIONS      = ["2024-25", "2025-26", "2026-27"];
// const CALC_OPTIONS    = ["Projected Annual", "Actual"];

// // ── New Regime defaults (FY 2025-26) ─────────────────────────────────────
// const NEW_REGIME_DEFAULTS = {
//   name:               "New Regime 2025-26",
//   financial_year:     "2025-26",
//   tax_regime:         "New",
//   basic_exemption:    300000,
//   standard_deduction: 75000,
//   calc_method:        "Projected Annual",
//   status:             "Active",
//   slabs: [
//     { income_from: 0,       income_to: 300000,  tax_rate_pct: 0  },
//     { income_from: 300001,  income_to: 700000,  tax_rate_pct: 5  },
//     { income_from: 700001,  income_to: 1000000, tax_rate_pct: 10 },
//     { income_from: 1000001, income_to: 1200000, tax_rate_pct: 15 },
//     { income_from: 1200001, income_to: 1500000, tax_rate_pct: 20 },
//     { income_from: 1500001, income_to: null,    tax_rate_pct: 30 },
//   ],
// };

// // ── Old Regime defaults ───────────────────────────────────────────────────
// const OLD_REGIME_DEFAULTS = {
//   name:               "Old Regime 2025-26",
//   financial_year:     "2025-26",
//   tax_regime:         "Old",
//   basic_exemption:    250000,
//   standard_deduction: 50000,
//   calc_method:        "Projected Annual",
//   status:             "Active",
//   slabs: [
//     { income_from: 0,      income_to: 250000,  tax_rate_pct: 0  },
//     { income_from: 250001, income_to: 500000,  tax_rate_pct: 5  },
//     { income_from: 500001, income_to: 1000000, tax_rate_pct: 20 },
//     { income_from: 1000001,income_to: null,    tax_rate_pct: 30 },
//   ],
// };

// // ── Rate color helper ─────────────────────────────────────────────────────
// const getRateColor = (rate) => {
//   const r = parseFloat(rate);
//   if (r === 0)  return { bg: "#F6FFED", color: "#389E0D", border: "#B7EB8F" };
//   if (r <= 5)   return { bg: "#F0F5FF", color: "#2F54EB", border: "#ADC6FF" };
//   if (r <= 10)  return { bg: "#FFF7E6", color: "#D46B08", border: "#FFD591" };
//   if (r <= 15)  return { bg: "#FFF0F6", color: "#C41D7F", border: "#FFADD2" };
//   if (r <= 20)  return { bg: "#F9F0FF", color: "#531DAB", border: "#D3ADF7" };
//   return         { bg: "#FFF1F0", color: "#CF1322", border: "#FFA39E" };
// };

// const fmt = (n) => n != null && n !== "" ? "₹" + Number(n).toLocaleString("en-IN") : "—";

// // ─────────────────────────────────────────────────────────────────────────────
// const TDSMasterForm = ({
//   mode = "view",
//   onSave,
//   formData,
//   setFormData,
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
//   initialData = {},
// }) => {
//   // const [formData, setFormData] = useState(() => ({
//   //   ...NEW_REGIME_DEFAULTS,
//   //   ...initialData,
//   //   slabs: initialData.slabs?.length ? initialData.slabs : NEW_REGIME_DEFAULTS.slabs,
//   // }));
//   const [errors, setErrors] = useState({});
//   const slabRefs = useRef({});

//   const isViewMode = mode === "view";
//   const isAddMode  = mode === "add";
//   const isEditMode = mode === "edit";
//   const isEditable = !isViewMode;

//   useEffect(() => {
//     setFormData({
//       ...NEW_REGIME_DEFAULTS,
//       ...initialData,
//       slabs: initialData.slabs?.length ? initialData.slabs : (initialData.tax_regime === "Old" ? OLD_REGIME_DEFAULTS.slabs : NEW_REGIME_DEFAULTS.slabs),
//     });
//   }, [initialData]);

//   // Form load hote hi first element par focus laane ka logic
//   useEffect(() => {
//     if (!isEditable) return;
//     const timer = setTimeout(() => {
//       const container = document.getElementById("tds-master-root");
//       if (container) {
//         const firstInput = container.querySelector("input:not([disabled]):not([type='hidden']), select:not([disabled])");
//         if (firstInput) {
//           firstInput.focus();
//         }
//       }
//     }, 150);
//     return () => clearTimeout(timer);
//   }, [isEditable]);

//   // ── helpers ───────────────────────────────────────────────────────────────
//   const handleChange = (field, value) => {
//     setFormData(prev => ({ ...prev, [field]: value }));
//     if (errors[field]) setErrors(prev => { const e = { ...prev }; delete e[field]; return e; });
//   };

//   const setRegime = (regime) => {
//     if (!isEditable) return;
//     handleChange("tax_regime", regime);
//   };

//   const loadDefaults = (regime) => {
//     if (!isEditable) return;
//     const defaults = regime === "New" ? NEW_REGIME_DEFAULTS : OLD_REGIME_DEFAULTS;
//     setFormData(prev => ({ ...prev, ...defaults }));
//   };

//   // ── slab actions ──────────────────────────────────────────────────────────
//   const addSlab = useCallback(() => {
//     if (!isEditable) return;
//     setFormData(prev => {
//       const nextSlabs = [...(prev.slabs || []), { income_from: "", income_to: "", tax_rate_pct: "" }];
//       const newIdx = nextSlabs.length - 1;
//       setTimeout(() => {
//         const ref = slabRefs.current[`${newIdx}-from`];
//         if (ref) ref?.focus();
//       }, 50);
//       return { ...prev, slabs: nextSlabs };
//     });
//   }, [isEditable]);

//   const deleteSlab = (idx) => {
//     if (!isEditable) return;
//     setFormData(prev => ({
//       ...prev,
//       slabs: prev.slabs.filter((_, i) => i !== idx),
//     }));
//   };

//   const updateSlab = (idx, field, value) => {
//     setFormData(prev => ({
//       ...prev,
//       slabs: prev.slabs.map((s, i) => i === idx ? { ...s, [field]: value } : s),
//     }));
//   };

//   // ── GLOBAL KEYBOARD NAVIGATION LOGIC ───────────────────────────────────────
//   const handleGlobalKeyDown = useCallback((e) => {
//     if (isViewMode) return;

//     if (e.key === "Enter" && e.shiftKey) {
//       e.preventDefault();
//       addSlab();
//       return;
//     }

//     const container = document.getElementById("tds-master-root");
//     if (!container) return;

//     const focusables = Array.from(
//       container.querySelectorAll(
//         "input:not([disabled]):not([type='hidden']), select:not([disabled]), button:not([disabled]), #status-toggle"
//       )
//     ).filter(el => {
//       if (el.tabIndex < 0) return false;
//       if (el.tagName === "BUTTON") {
//         const text = (el.textContent || "").toLowerCase();
//         return text.includes("save") || text.includes("update");
//       }
//       return true;
//     });

//     const index = focusables.indexOf(e.target);

//     if (e.key === "Enter" && !e.shiftKey) {
//       if (e.target.tagName === "BUTTON") return;

//       e.preventDefault();
//       if (index > -1 && index < focusables.length - 1) {
//         focusables[index + 1]?.focus();
//       }
//     } 
//     else if (e.key === "Backspace") {
//       if (index > 0) {
//         const target = e.target;
//         let shouldGoBack = false;

//         if (target.id === "status-toggle") {
//           shouldGoBack = true;
//         } else if (target.tagName === "INPUT") {
//           try {
//              if (target.selectionStart === 0 && target.selectionEnd === 0) shouldGoBack = true;
//           } catch (err) {
//              if (!target.value) shouldGoBack = true;
//           }
//         } else if (target.tagName === "SELECT") {
//           shouldGoBack = true;
//         }

//         if (shouldGoBack) {
//           e.preventDefault();
//           focusables[index - 1]?.focus();
//         }
//       }
//     }
//   }, [isViewMode, addSlab]);

//   // ── validation + save (AUTO-FOCUS ERROR LOGIC ADDED HERE) ──────────────────
//   const handleValidateAndSave = useCallback(() => {
//     if (isViewMode) return;
//     const newErrors = {};
//     if (!formData.name)           newErrors.name           = "Required";
//     if (!formData.financial_year) newErrors.financial_year = "Required";
//     if (!formData.tax_regime)     newErrors.tax_regime     = "Required";
    
//     // Agar koi error aata hai
//     if (Object.keys(newErrors).length > 0) {
//       setErrors(newErrors);

//       // 🔥 AUTO-FOCUS LOGIC FOR ERRORS
//       setTimeout(() => {
//         const firstErrorKey = Object.keys(newErrors)[0]; // Sabse pehla error pakdo (e.g., 'name')
//         const wrapper = document.getElementById(`wrapper-${firstErrorKey}`); // Uska wrapper div dhundho
        
//         if (wrapper) {
//           // Wrapper ke andar jo bhi pehla input/button hoga uspe focus set kar do
//           const errorInput = wrapper.querySelector("input:not([disabled]):not([type='hidden']), select:not([disabled]), button:not([disabled])");
//           if (errorInput) {
//             errorInput.focus();
//           }
//         }
//       }, 50);

//       return; // Form save hone se rok do
//     }

//     onSave && onSave({
//       ...formData,
//       slabs: (formData.slabs || []).map(s => ({
//         income_from:  parseFloat(s.income_from) || 0,
//         income_to:    s.income_to !== "" && s.income_to != null ? parseFloat(s.income_to) : null,
//         tax_rate_pct: parseFloat(s.tax_rate_pct) || 0,
//       })),
//     });
//   }, [formData, isViewMode, onSave]);

//   const taxableFrom = (parseFloat(formData.basic_exemption) || 0) + (parseFloat(formData.standard_deduction) || 0);
//   const slabs       = formData.slabs || [];

//   const ic = (field) =>
//     `h-[30px] w-full px-2 text-[13px] border rounded-md outline-none transition-all
//      ${errors[field] ? "border-red-400 bg-red-50" : "border-gray-300"}
//      ${!isEditable ? "bg-gray-100 text-gray-500 cursor-not-allowed" : "bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100"}`;

//   return (
//     <div 
//       id="tds-master-root"
//       onKeyDown={handleGlobalKeyDown} 
//       className="w-full max-w-[1100px] mx-auto h-[calc(100vh-120px)] bg-[#F4F5F7] flex flex-col" 
//       style={{ fontFamily: FONT }}
//     >

//       <ERPHeader
//         title="TDS MASTER ENTRY"
//         isAddMode={isAddMode}
//         isEditMode={isEditMode}
//         isViewMode={isViewMode}
//         activeTab={activeTab}
//         onTabChange={onTabChange}
//         rightContent={`${currentRecord || 1} / ${totalRecords || 1}`}
//       />

//       <div className="flex-1 overflow-y-auto p-4">
//         <div className="flex gap-4 items-start">

//           <div className="flex-1 flex flex-col gap-3">

//             {/* Card 1 — Basic Info */}
//             <div className="bg-white border border-gray-200 rounded-lg shadow-sm relative">
//               <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 bg-gray-50 rounded-t-lg">
//                 <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Basic Information</span>
//               </div>
//               <div className="p-4 flex flex-col gap-3">

//                 <div className="grid grid-cols-2 gap-4">
//                   {/* 🔥 ADDED id="wrapper-name" */}
//                   <div className="flex flex-col gap-1" id="wrapper-name">
//                     <label className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">
//                       Name <span className="text-red-500">*</span>
//                     </label>
//                     <input
//                       value={formData.name || ""}
//                       disabled={!isEditable}
//                       onChange={e => handleChange("name", e.target.value)}
//                       placeholder="e.g. New Regime 2025-26"
//                       className={ic("name")}
//                     />
//                     {errors.name && <span className="text-[11px] text-red-500">{errors.name}</span>}
//                   </div>

//                   {/* 🔥 ADDED id="wrapper-financial_year" */}
//                   <div className="flex flex-col gap-1" id="wrapper-financial_year">
//                     <label className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">
//                       Financial Year <span className="text-red-500">*</span>
//                     </label>
//                     <ERPAutocomplete
//                       options={FY_OPTIONS}
//                       value={formData.financial_year || ""}
//                       onChange={v => handleChange("financial_year", v)}
//                       disabled={!isEditable}
//                       className={ic("financial_year")}
//                     />
//                     {errors.financial_year && <span className="text-[11px] text-red-500">{errors.financial_year}</span>}
//                   </div>
//                 </div>

//                 <div className="grid grid-cols-2 gap-4">
//                   {/* 🔥 ADDED id="wrapper-tax_regime" */}
//                   <div className="flex flex-col gap-1" id="wrapper-tax_regime">
//                     <label className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">
//                       Tax Regime <span className="text-red-500">*</span>
//                     </label>
//                     <div className="flex h-[30px] border border-gray-300 rounded-md overflow-hidden">
//                       <button
//                         type="button"
//                         tabIndex={-1}
//                         disabled={!isEditable}
//                         onClick={() => setRegime("New")}
//                         className={`flex-1 text-[12px] font-medium transition-all flex items-center justify-center gap-1
//                           ${formData.tax_regime === "New"
//                             ? "bg-blue-50 text-blue-600 border-r border-blue-200"
//                             : "bg-white text-gray-400 border-r border-gray-200 hover:bg-gray-50"
//                           } ${!isEditable ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
//                       >
//                         ⚡ New
//                       </button>
//                       <button
//                         type="button"
//                         tabIndex={-1}
//                         disabled={!isEditable}
//                         onClick={() => setRegime("Old")}
//                         className={`flex-1 text-[12px] font-medium transition-all flex items-center justify-center gap-1
//                           ${formData.tax_regime === "Old"
//                             ? "bg-amber-50 text-amber-600"
//                             : "bg-white text-gray-400 hover:bg-gray-50"
//                           } ${!isEditable ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
//                       >
//                         📋 Old
//                       </button>
//                     </div>
//                   </div>

//                   <div className="flex flex-col gap-1">
//                     <label className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">Calc Method</label>
//                     <ERPAutocomplete
//                       options={CALC_OPTIONS}
//                       value={formData.calc_method || ""}
//                       onChange={v => handleChange("calc_method", v)}
//                       disabled={!isEditable}
//                       className={ic("calc_method")}
//                     />
//                   </div>
//                 </div>

//               </div>
//             </div>

//             {/* Card 2 — Exemptions */}
//             <div className="bg-white border border-gray-200 rounded-lg shadow-sm relative">
//               <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 bg-gray-50 rounded-t-lg">
//                 <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Exemptions & Deductions</span>
//                 <span className="text-[11px] text-gray-400">Auto-applied before tax calculation</span>
//               </div>
//               <div className="p-4">
//                 <div className="grid grid-cols-3 gap-4">
//                   <div className="flex flex-col gap-1">
//                     <label className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">Basic Exemption (₹)</label>
//                     <input
//                       type="number" min="0"
//                       value={formData.basic_exemption ?? ""}
//                       disabled={!isEditable}
//                       onChange={e => handleChange("basic_exemption", e.target.value)}
//                       className={ic("basic_exemption")}
//                     />
//                     <span className="text-[10px] text-gray-400">
//                       {formData.tax_regime === "New" ? "₹3L — New regime" : "₹2.5L — Old regime"}
//                     </span>
//                   </div>

//                   <div className="flex flex-col gap-1">
//                     <label className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">Standard Deduction (₹)</label>
//                     <input
//                       type="number" min="0"
//                       value={formData.standard_deduction ?? ""}
//                       disabled={!isEditable}
//                       onChange={e => handleChange("standard_deduction", e.target.value)}
//                       className={ic("standard_deduction")}
//                     />
//                     <span className="text-[10px] text-gray-400">
//                       {formData.tax_regime === "New" ? "₹75K — FY 2025-26" : "₹50K — Old regime"}
//                     </span>
//                   </div>

//                   <div className="flex flex-col gap-1">
//                     <label className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">Status</label>
//                     <div className="flex items-center gap-2 mt-1">
//                       <div
//                         id="status-toggle"
//                         tabIndex={isEditable ? 0 : -1}
//                         onKeyDown={(e) => {
//                           if (e.key === " " || e.key === "Spacebar") {
//                             e.preventDefault();
//                             if (isEditable) handleChange("status", formData.status === "Active" ? "Inactive" : "Active");
//                           }
//                         }}
//                         onClick={() => isEditable && handleChange("status", formData.status === "Active" ? "Inactive" : "Active")}
//                         className={`w-[36px] h-[20px] flex items-center rounded-full p-[2px] transition-colors focus:ring-2 focus:outline-none focus:ring-blue-400
//                           ${formData.status === "Active" ? "bg-green-500" : "bg-gray-300"}
//                           ${isEditable ? "cursor-pointer" : "cursor-not-allowed opacity-60"}`}
//                       >
//                         <div className={`h-[16px] w-[16px] bg-white rounded-full shadow transition-transform
//                           ${formData.status === "Active" ? "translate-x-[16px]" : ""}`} />
//                       </div>
//                       <span className={`text-[12px] font-medium ${formData.status === "Active" ? "text-green-600" : "text-gray-400"}`}>
//                         {formData.status || "Active"}
//                       </span>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Card 3 — Slab Grid */}
//             <div className="bg-white border border-gray-200 rounded-lg shadow-sm relative">
//               <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 bg-gray-50 rounded-t-lg">
//                 <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Tax Slabs</span>
//                 <span className="text-[11px] text-gray-400">{slabs.length} slab{slabs.length !== 1 ? "s" : ""}</span>
//               </div>

//               <table className="w-full border-collapse">
//                 <thead>
//                   <tr className="border-b border-gray-100">
//                     <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-2 bg-gray-50 w-[35%]">
//                       Income From (₹)
//                     </th>
//                     <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-2 bg-gray-50 w-[35%]">
//                       Income To (₹)
//                     </th>
//                     <th className="text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-2 bg-gray-50 w-[20%]">
//                       Tax Rate %
//                     </th>
//                     {isEditable && <th className="bg-gray-50 w-[10%]" />}
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {slabs.map((slab, idx) => {
//                     const c = getRateColor(slab.tax_rate_pct);
//                     return (
//                       <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors group">
//                         <td className="px-2 py-1">
//                           <input
//                             ref={el => slabRefs.current[`${idx}-from`] = el}
//                             type="number" min="0"
//                             value={slab.income_from ?? ""}
//                             disabled={!isEditable}
//                             onChange={e => updateSlab(idx, "income_from", e.target.value)}
//                             placeholder="0"
//                             className={`w-full h-[26px] px-2 text-[12px] font-mono border rounded outline-none transition-all
//                               ${!isEditable
//                                 ? "border-transparent bg-transparent text-gray-600 cursor-not-allowed"
//                                 : "border-transparent bg-transparent hover:border-gray-200 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-50"
//                               }`}
//                           />
//                         </td>
//                         <td className="px-2 py-1">
//                           <input
//                             ref={el => slabRefs.current[`${idx}-to`] = el}
//                             type="number" min="0"
//                             value={slab.income_to ?? ""}
//                             disabled={!isEditable}
//                             onChange={e => updateSlab(idx, "income_to", e.target.value)}
//                             placeholder="No limit"
//                             className={`w-full h-[26px] px-2 text-[12px] font-mono border rounded outline-none transition-all
//                               ${!isEditable
//                                 ? "border-transparent bg-transparent text-gray-600 cursor-not-allowed"
//                                 : "border-transparent bg-transparent hover:border-gray-200 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-50"
//                               }`}
//                           />
//                         </td>
//                         <td className="px-2 py-1 text-right">
//                           <div className="flex items-center justify-end gap-2">
//                             {!isEditable && (
//                               <span
//                                 className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
//                                 style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}` }}
//                               >
//                                 {slab.tax_rate_pct}%
//                               </span>
//                             )}
//                             {isEditable && (
//                               <input
//                                 ref={el => slabRefs.current[`${idx}-rate`] = el}
//                                 type="number" min="0" max="100" step="0.5"
//                                 value={slab.tax_rate_pct ?? ""}
//                                 onChange={e => updateSlab(idx, "tax_rate_pct", e.target.value)}
//                                 placeholder="%"
//                                 className="w-[70px] h-[26px] px-2 text-[12px] font-mono text-right border rounded outline-none transition-all
//                                   border-transparent bg-transparent hover:border-gray-200 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-50"
//                               />
//                             )}
//                           </div>
//                         </td>
//                         {isEditable && (
//                           <td className="px-2 py-1 text-center">
//                             <button
//                               type="button"
//                               tabIndex={-1}
//                               onClick={() => deleteSlab(idx)}
//                               className="w-[24px] h-[24px] rounded text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all
//                                 opacity-0 group-hover:opacity-100 text-[14px] flex items-center justify-center mx-auto"
//                             >
//                               ✕
//                             </button>
//                           </td>
//                         )}
//                       </tr>
//                     );
//                   })}

//                   {slabs.length === 0 && (
//                     <tr>
//                       <td colSpan={isEditable ? 4 : 3} className="text-center py-6 text-[12px] text-gray-400">
//                         No slabs added yet — use "Add Slab" or load defaults below
//                       </td>
//                     </tr>
//                   )}
//                 </tbody>
//               </table>

//               {isEditable && (
//                 <button
//                   type="button"
//                   tabIndex={-1} 
//                   onClick={addSlab}
//                   className="w-full h-[34px] border-t border-dashed border-gray-200 text-[12px] font-medium text-gray-400
//                     hover:text-blue-500 hover:bg-blue-50 hover:border-blue-200 transition-all flex items-center justify-center gap-1"
//                 >
//                   <span className="text-[16px] leading-none">+</span> Add Slab (Shift + Enter)
//                 </button>
//               )}
//             </div>

//             {/* Load Defaults — only in add/edit */}
//             {isEditable && (
//               <div className="flex gap-2">
//                 <button
//                   type="button"
//                   tabIndex={-1}
//                   onClick={() => loadDefaults("New")}
//                   className="flex-1 h-[32px] border border-blue-200 bg-blue-50 text-blue-600 text-[12px] font-medium
//                     rounded-md hover:bg-blue-100 transition-all flex items-center justify-center gap-1"
//                 >
//                   ⚡ Load New Regime Defaults
//                 </button>
//                 <button
//                   type="button"
//                   tabIndex={-1}
//                   onClick={() => loadDefaults("Old")}
//                   className="flex-1 h-[32px] border border-amber-200 bg-amber-50 text-amber-600 text-[12px] font-medium
//                     rounded-md hover:bg-amber-100 transition-all flex items-center justify-center gap-1"
//                 >
//                   📋 Load Old Regime Defaults
//                 </button>
//               </div>
//             )}

//           </div>

//           {/* ── RIGHT — LIVE PREVIEW ─────────────────────────────────────── */}
//           <div className="w-[260px] flex-shrink-0 sticky top-0">
//             <div className="bg-white border border-gray-200 rounded-lg shadow-sm relative">
//               <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 bg-gray-50 rounded-t-lg">
//                 <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Live Preview</span>
//                 <span className="w-[7px] h-[7px] rounded-full bg-green-500 inline-block" />
//               </div>
//               <div className="p-3">
//                 {/* Name */}
//                 <div className="text-[14px] font-semibold text-gray-800 mb-0.5 truncate">
//                   {formData.name || "—"}
//                 </div>
//                 <div className="text-[11px] text-gray-400 mb-3">
//                   {formData.financial_year
//                     ? `FY ${formData.financial_year} · ${formData.tax_regime} Regime`
//                     : "Configure to preview"}
//                 </div>

//                 {/* Regime pill */}
//                 <div className="flex justify-between items-center py-1.5 border-b border-gray-100 text-[12px]">
//                   <span className="text-gray-500">Regime</span>
//                   <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full
//                     ${formData.tax_regime === "New"
//                       ? "bg-blue-50 text-blue-600 border border-blue-200"
//                       : "bg-amber-50 text-amber-600 border border-amber-200"
//                     }`}>
//                     {formData.tax_regime === "New" ? "⚡ New" : "📋 Old"}
//                   </span>
//                 </div>

//                 {[
//                   ["Financial Year", formData.financial_year || "—"],
//                   ["Basic Exemption", fmt(formData.basic_exemption)],
//                   ["Std. Deduction", fmt(formData.standard_deduction)],
//                   ["Taxable From", fmt(taxableFrom)],
//                   ["Calc Method", formData.calc_method || "—"],
//                 ].map(([k, v]) => (
//                   <div key={k} className="flex justify-between items-center py-1.5 border-b border-gray-100 text-[12px]">
//                     <span className="text-gray-500">{k}</span>
//                     <span className="font-mono text-[11px] font-medium text-gray-700">{v}</span>
//                   </div>
//                 ))}

//                 {/* Slab preview */}
//                 {slabs.length > 0 ? (
//                   <div className="mt-3">
//                     <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
//                       Tax Slabs
//                     </div>
//                     <div className="flex flex-col gap-1">
//                       {slabs.map((s, i) => {
//                         const c = getRateColor(s.tax_rate_pct);
//                         return (
//                           <div key={i} className="flex items-center gap-2 p-1.5 rounded bg-gray-50 border border-gray-100 text-[11px]">
//                             <span className="font-mono text-gray-500 flex-1 text-[10px]">
//                               {s.income_from ? "₹" + Number(s.income_from).toLocaleString("en-IN") : "₹0"}
//                               {" – "}
//                               {s.income_to ? "₹" + Number(s.income_to).toLocaleString("en-IN") : "∞"}
//                             </span>
//                             <span
//                               className="font-mono font-semibold text-[11px] px-1.5 py-0.5 rounded-full"
//                               style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}` }}
//                             >
//                               {s.tax_rate_pct || 0}%
//                             </span>
//                           </div>
//                         );
//                       })}
//                     </div>
//                   </div>
//                 ) : (
//                   <div className="mt-3 text-[11px] text-gray-400 text-center py-4">
//                     No slabs added yet
//                   </div>
//                 )}
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

// export default TDSMasterForm;
import React, { useState, useCallback, useEffect, useRef } from "react";
import ERPHeader from "../../../../components/Reusable/form/HeaderForm";
import ERPFooter from "../../../../components/Reusable/form/FooterForm";
import ERPAutocomplete from "../../../../components/Reusable/input/ERPAutocomplete";

const FONT = `'Inter', 'Tahoma', system-ui, sans-serif`;
const FY_OPTIONS   = ["2024-25", "2025-26", "2026-27"];
const CALC_OPTIONS = ["Projected Annual", "Actual"];

const NEW_REGIME_DEFAULTS = {
  name: "New Regime 2025-26", financial_year: "2025-26", tax_regime: "New",
  basic_exemption: 300000, standard_deduction: 75000,
  calc_method: "Projected Annual", status: "Active",
  slabs: [
    { income_from: 0,       income_to: 300000,  tax_rate_pct: 0  },
    { income_from: 300001,  income_to: 700000,  tax_rate_pct: 5  },
    { income_from: 700001,  income_to: 1000000, tax_rate_pct: 10 },
    { income_from: 1000001, income_to: 1200000, tax_rate_pct: 15 },
    { income_from: 1200001, income_to: 1500000, tax_rate_pct: 20 },
    { income_from: 1500001, income_to: null,    tax_rate_pct: 30 },
  ],
};

const OLD_REGIME_DEFAULTS = {
  name: "Old Regime 2025-26", financial_year: "2025-26", tax_regime: "Old",
  basic_exemption: 250000, standard_deduction: 50000,
  calc_method: "Projected Annual", status: "Active",
  slabs: [
    { income_from: 0,       income_to: 250000,  tax_rate_pct: 0  },
    { income_from: 250001,  income_to: 500000,  tax_rate_pct: 5  },
    { income_from: 500001,  income_to: 1000000, tax_rate_pct: 20 },
    { income_from: 1000001, income_to: null,    tax_rate_pct: 30 },
  ],
};

const getRateColor = (rate) => {
  const r = parseFloat(rate);
  if (r === 0) return { bg: "#F6FFED", color: "#389E0D", border: "#B7EB8F" };
  if (r <= 5)  return { bg: "#F0F5FF", color: "#2F54EB", border: "#ADC6FF" };
  if (r <= 10) return { bg: "#FFF7E6", color: "#D46B08", border: "#FFD591" };
  if (r <= 15) return { bg: "#FFF0F6", color: "#C41D7F", border: "#FFADD2" };
  if (r <= 20) return { bg: "#F9F0FF", color: "#531DAB", border: "#D3ADF7" };
  return        { bg: "#FFF1F0", color: "#CF1322", border: "#FFA39E" };
};

const fmt = (n) => n != null && n !== "" ? "₹" + Number(n).toLocaleString("en-IN") : "—";

const TDSMasterForm = ({
  mode = "view", onSave, formData, setFormData,
  onCancel, onDelete, onEditCancel, saving,
  onModify, onNewEntry, currentRecord, totalRecords,
  rights, activeTab = "entry", onTabChange = () => {},
  initialData = {},
}) => {
  const [errors, setErrors] = useState({});
  const slabRefs = useRef({});

  // ── Direct refs for each top-level field ─────────────────────────────────
  // ORDER: name(0) → fyWrap(1) → calcWrap(2) → basic(3) → std(4) → status(5)
  const nameRef    = useRef(null);
  const fyWrapRef  = useRef(null);   // wrapper div — we'll find input inside
  const calcWrapRef= useRef(null);   // wrapper div — we'll find input inside
  const basicRef   = useRef(null);
  const stdRef     = useRef(null);
  const statusRef  = useRef(null);

  // Helper: get the actual focusable input from a ref (handles ERPAutocomplete wrappers)
  const getInput = (ref) => {
    if (!ref?.current) return null;
    // If it's already an input/div with tabIndex, return directly
    const el = ref.current;
    if (el.tagName === "INPUT" || el.tagName === "SELECT" || el.id === "status-toggle") return el;
    // ERPAutocomplete wrapper — find input inside
    return el.querySelector("input:not([disabled])") || el;
  };

  // Ordered list of top-level field refs
  const TOP_REFS = [nameRef, fyWrapRef, calcWrapRef, basicRef, stdRef, statusRef];

  const focusTop = (idx) => {
    const el = getInput(TOP_REFS[idx]);
    if (el) el.focus();
  };

  const isViewMode = mode === "view";
  const isAddMode  = mode === "add";
  const isEditMode = mode === "edit";
  const isEditable = !isViewMode;

  useEffect(() => {
    setFormData({
      ...NEW_REGIME_DEFAULTS,
      ...initialData,
      slabs: initialData.slabs?.length
        ? initialData.slabs
        : (initialData.tax_regime === "Old" ? OLD_REGIME_DEFAULTS.slabs : NEW_REGIME_DEFAULTS.slabs),
    });
  }, [initialData]);

  // Auto-focus first field on edit/add
  useEffect(() => {
    if (!isEditable) return;
    const timer = setTimeout(() => focusTop(0), 150);
    return () => clearTimeout(timer);
  }, [isEditable]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => { const e = { ...prev }; delete e[field]; return e; });
  };

  const setRegime    = (r) => { if (!isEditable) return; handleChange("tax_regime", r); };
  const loadDefaults = (r) => {
    if (!isEditable) return;
    setFormData(prev => ({ ...prev, ...(r === "New" ? NEW_REGIME_DEFAULTS : OLD_REGIME_DEFAULTS) }));
  };

  const saveBtnRef=useRef(null)
  // ── Slab actions ─────────────────────────────────────────────────────────
  const addSlab = useCallback(() => {
    if (!isEditable) return;
    setFormData(prev => {
      const nextSlabs = [...(prev.slabs || []), { income_from: "", income_to: "", tax_rate_pct: "" }];
      setTimeout(() => {
        const ref = slabRefs.current[`${nextSlabs.length - 1}-from`];
        if (ref) ref.focus();
      }, 40);
      return { ...prev, slabs: nextSlabs };
    });
  }, [isEditable]);

  const deleteSlab = (idx) => {
    if (!isEditable) return;
    setFormData(prev => ({ ...prev, slabs: prev.slabs.filter((_, i) => i !== idx) }));
  };

  const updateSlab = (idx, field, value) => {
    setFormData(prev => ({
      ...prev,
      slabs: prev.slabs.map((s, i) => i === idx ? { ...s, [field]: value } : s),
    }));
  };

  // ── Validation + save ─────────────────────────────────────────────────────
  const handleValidateAndSave = useCallback(() => {
    if (isViewMode) return;
    const newErrors = {};
    if (!formData.name)           newErrors.name           = "Required";
    if (!formData.financial_year) newErrors.financial_year = "Required";
    if (!formData.tax_regime)     newErrors.tax_regime     = "Required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setTimeout(() => {
        if      (newErrors.name)           focusTop(0);
        else if (newErrors.financial_year) focusTop(1);
        else if (newErrors.tax_regime)     focusTop(1); // regime is button, focus FY
      }, 40);
      return;
    }
    onSave && onSave({
      ...formData,
      slabs: (formData.slabs || []).map(s => ({
        income_from:  parseFloat(s.income_from) || 0,
        income_to:    s.income_to !== "" && s.income_to != null ? parseFloat(s.income_to) : null,
        tax_rate_pct: parseFloat(s.tax_rate_pct) || 0,
      })),
    });
  }, [formData, isViewMode, onSave]);

  // ── TOP FIELD KEYDOWN ────────────────────────────────────────────────────
  // myIdx = index in TOP_REFS array
  const handleTopKeyDown = useCallback((e, myIdx) => {
    if (isViewMode) return;

    if (e.key === "Enter") {
      e.preventDefault();
      if (myIdx < TOP_REFS.length - 1) {
        // Move to next top field
        focusTop(myIdx + 1);
      } else {
        // Last top field (status) → go to first slab, or add one
        const firstSlab = slabRefs.current["0-from"];
        if (firstSlab) firstSlab.focus();
        else addSlab();
      }
      return;
    }

    if (e.key === "Backspace") {
      const el = e.target;
      const val = String(el.value ?? "");
      // For text inputs check cursor; for number/others check empty value
      const atStart = el.type === "text"
        ? el.selectionStart === 0 && el.selectionEnd === 0
        : val === "";

      if (atStart && myIdx > 0) {
        e.preventDefault();
        focusTop(myIdx - 1);
      }
    }
  }, [isViewMode, addSlab]);

  // ── STATUS TOGGLE KEYDOWN ────────────────────────────────────────────────
  const handleStatusKeyDown = useCallback((e) => {
    if (isViewMode) return;
    if (e.key === " " || e.key === "Spacebar") {
      e.preventDefault();
      handleChange("status", formData.status === "Active" ? "Inactive" : "Active");
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      // status is TOP_REFS index 5 — last top field → go to first slab
      const firstSlab = slabRefs.current["0-from"];
      if (firstSlab) firstSlab.focus();
      else  saveBtnRef?.current?.focus();;
      return;
    }
    if (e.key === "Backspace") {
      e.preventDefault();
      focusTop(4); // go to stdRef (index 4)
    }
  }, [isViewMode, formData.status, addSlab]);

  // ── SLAB KEYDOWN ─────────────────────────────────────────────────────────
  // Enter      → next cell → next row → SAVE (not add slab)
  // Shift+Enter → add new slab
  // Backspace  → prev cell (if empty)
  const handleSlabKeyDown = useCallback((e, idx, field) => {
    const slabCount = formData.slabs?.length ?? 0;
    const fields    = ["from", "to", "rate"];
    const fi        = fields.indexOf(field);

    // Shift+Enter → add new slab
    if (e.key === "Enter" && e.shiftKey) {
      e.preventDefault();
      addSlab();
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();

      if (fi < 2) {
        // next cell in same row
        slabRefs.current[`${idx}-${fields[fi + 1]}`]?.focus();
        return;
      }

      // fi === 2 (rate) — last cell
      if (idx < slabCount - 1) {
        // not last row → first cell of next row
        slabRefs.current[`${idx + 1}-from`]?.focus();
      } else {
        // LAST cell of LAST row → SAVE
       saveBtnRef?.current?.focus();
      }
      return;
    }

    if (e.key === "Backspace") {
      const val = String(e.target.value ?? "");
      if (val !== "") return; // has value — normal backspace

      e.preventDefault();
      if (fi > 0) {
        // prev cell in same row
        slabRefs.current[`${idx}-${fields[fi - 1]}`]?.focus();
      } else if (idx > 0) {
        // first cell, not first row → last cell of prev row
        slabRefs.current[`${idx - 1}-rate`]?.focus();
      } else {
        // first cell of first row → status toggle (last top field)
        focusTop(5);
      }
    }
  }, [formData.slabs, addSlab, handleValidateAndSave]);

  const taxableFrom = (parseFloat(formData.basic_exemption) || 0) + (parseFloat(formData.standard_deduction) || 0);
  const slabs       = formData.slabs || [];

  const ic = (field) =>
    `h-[30px] w-full px-2 text-[13px] border rounded-md outline-none transition-all
     ${errors[field] ? "border-red-400 bg-red-50" : "border-gray-300"}
     ${!isEditable ? "bg-gray-100 text-gray-500 cursor-not-allowed" : "bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100"}`;

  return (
    <div
      className="w-full max-w-[1100px] mx-auto h-[calc(100vh-120px)] bg-[#F4F5F7] flex flex-col"
      style={{ fontFamily: FONT }}
    >
      <ERPHeader
        title="TDS MASTER ENTRY"
        isAddMode={isAddMode} isEditMode={isEditMode} isViewMode={isViewMode}
        activeTab={activeTab} onTabChange={onTabChange}
        rightContent={`${currentRecord || 1} / ${totalRecords || 1}`}
      />

      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex gap-4 items-start">
          <div className="flex-1 flex flex-col gap-3">

            {/* Card 1 — Basic Info */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="flex items-center px-4 py-2 border-b border-gray-100 bg-gray-50 rounded-t-lg">
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Basic Information</span>
              </div>
              <div className="p-4 flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-4">

                  {/* Name — idx 0 */}
                  <div className="flex flex-col gap-1" id="wrapper-name">
                    <label className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      ref={nameRef}
                      value={formData.name || ""}
                      disabled={!isEditable}
                      onChange={e => handleChange("name", e.target.value)}
                      onKeyDown={e => handleTopKeyDown(e, 0)}
                      placeholder="e.g. New Regime 2025-26"
                      className={ic("name")}
                    />
                    {errors.name && <span className="text-[11px] text-red-500">{errors.name}</span>}
                  </div>

                  {/* Financial Year — idx 1 — wrap div so we can find input inside */}
                  <div className="flex flex-col gap-1" id="wrapper-financial_year">
                    <label className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">
                      Financial Year <span className="text-red-500">*</span>
                    </label>
                    <div ref={fyWrapRef} onKeyDown={e => handleTopKeyDown(e, 1)}>
                      <ERPAutocomplete
                        options={FY_OPTIONS}
                        value={formData.financial_year || ""}
                        onChange={v => handleChange("financial_year", v)}
                        disabled={!isEditable}
                        className={ic("financial_year")}
                      />
                    </div>
                    {errors.financial_year && <span className="text-[11px] text-red-500">{errors.financial_year}</span>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Tax Regime — buttons, tabIndex=-1, skip in nav */}
                  <div className="flex flex-col gap-1" id="wrapper-tax_regime">
                    <label className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">
                      Tax Regime <span className="text-red-500">*</span>
                    </label>
                    <div className="flex h-[30px] border border-gray-300 rounded-md overflow-hidden">
                      <button type="button" tabIndex={-1} disabled={!isEditable}
                        onClick={() => setRegime("New")}
                        className={`flex-1 text-[12px] font-medium transition-all flex items-center justify-center gap-1
                          ${formData.tax_regime === "New" ? "bg-blue-50 text-blue-600 border-r border-blue-200" : "bg-white text-gray-400 border-r border-gray-200 hover:bg-gray-50"}
                          ${!isEditable ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}>
                        ⚡ New
                      </button>
                      <button type="button" tabIndex={-1} disabled={!isEditable}
                        onClick={() => setRegime("Old")}
                        className={`flex-1 text-[12px] font-medium transition-all flex items-center justify-center gap-1
                          ${formData.tax_regime === "Old" ? "bg-amber-50 text-amber-600" : "bg-white text-gray-400 hover:bg-gray-50"}
                          ${!isEditable ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}>
                        📋 Old
                      </button>
                    </div>
                    {errors.tax_regime && <span className="text-[11px] text-red-500">{errors.tax_regime}</span>}
                  </div>

                  {/* Calc Method — idx 2 */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">Calc Method</label>
                    <div ref={calcWrapRef} onKeyDown={e => handleTopKeyDown(e, 2)}>
                      <ERPAutocomplete
                        options={CALC_OPTIONS}
                        value={formData.calc_method || ""}
                        onChange={v => handleChange("calc_method", v)}
                        disabled={!isEditable}
                        className={ic("calc_method")}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2 — Exemptions */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 bg-gray-50 rounded-t-lg">
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Exemptions & Deductions</span>
                <span className="text-[11px] text-gray-400">Auto-applied before tax calculation</span>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-3 gap-4">

                  {/* Basic Exemption — idx 3 */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">Basic Exemption (₹)</label>
                    <input
                      ref={basicRef}
                      type="number" min="0"
                      value={formData.basic_exemption ?? ""}
                      disabled={!isEditable}
                      onChange={e => handleChange("basic_exemption", e.target.value)}
                      onKeyDown={e => handleTopKeyDown(e, 3)}
                      className={ic("basic_exemption")}
                    />
                    <span className="text-[10px] text-gray-400">
                      {formData.tax_regime === "New" ? "₹3L — New regime" : "₹2.5L — Old regime"}
                    </span>
                  </div>

                  {/* Std Deduction — idx 4 */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">Standard Deduction (₹)</label>
                    <input
                      ref={stdRef}
                      type="number" min="0"
                      value={formData.standard_deduction ?? ""}
                      disabled={!isEditable}
                      onChange={e => handleChange("standard_deduction", e.target.value)}
                      onKeyDown={e => handleTopKeyDown(e, 4)}
                      className={ic("standard_deduction")}
                    />
                    <span className="text-[10px] text-gray-400">
                      {formData.tax_regime === "New" ? "₹75K — FY 2025-26" : "₹50K — Old regime"}
                    </span>
                  </div>

                  {/* Status Toggle — idx 5 */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">Status</label>
                    <div className="flex items-center gap-2 mt-1">
                      <div
                        ref={statusRef}
                        id="status-toggle"
                        tabIndex={isEditable ? 0 : -1}
                        onKeyDown={handleStatusKeyDown}
                        onClick={() => isEditable && handleChange("status", formData.status === "Active" ? "Inactive" : "Active")}
                        className={`w-[36px] h-[20px] flex items-center rounded-full p-[2px] transition-colors focus:ring-2 focus:outline-none focus:ring-blue-400
                          ${formData.status === "Active" ? "bg-green-500" : "bg-gray-300"}
                          ${isEditable ? "cursor-pointer" : "cursor-not-allowed opacity-60"}`}
                      >
                        <div className={`h-[16px] w-[16px] bg-white rounded-full shadow transition-transform
                          ${formData.status === "Active" ? "translate-x-[16px]" : ""}`} />
                      </div>
                      <span className={`text-[12px] font-medium ${formData.status === "Active" ? "text-green-600" : "text-gray-400"}`}>
                        {formData.status || "Active"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3 — Slab Grid */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 bg-gray-50 rounded-t-lg">
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Tax Slabs</span>
                <span className="text-[11px] text-gray-400">{slabs.length} slab{slabs.length !== 1 ? "s" : ""}</span>
              </div>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-2 bg-gray-50 w-[35%]">Income From (₹)</th>
                    <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-2 bg-gray-50 w-[35%]">Income To (₹)</th>
                    <th className="text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-2 bg-gray-50 w-[20%]">Tax Rate %</th>
                    {isEditable && <th className="bg-gray-50 w-[10%]" />}
                  </tr>
                </thead>
                <tbody>
                  {slabs.map((slab, idx) => {
                    const c = getRateColor(slab.tax_rate_pct);
                    return (
                      <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors group">
                        <td className="px-2 py-1">
                          <input
                            ref={el => slabRefs.current[`${idx}-from`] = el}
                            type="number" min="0"
                            value={slab.income_from ?? ""}
                            disabled={!isEditable}
                            onChange={e => updateSlab(idx, "income_from", e.target.value)}
                            onKeyDown={e => handleSlabKeyDown(e, idx, "from")}
                            placeholder="0"
                            className={`w-full h-[26px] px-2 text-[12px] font-mono border rounded outline-none transition-all
                              ${!isEditable ? "border-transparent bg-transparent text-gray-600 cursor-not-allowed"
                                : "border-transparent bg-transparent hover:border-gray-200 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-50"}`}
                          />
                        </td>
                        <td className="px-2 py-1">
                          <input
                            ref={el => slabRefs.current[`${idx}-to`] = el}
                            type="number" min="0"
                            value={slab.income_to ?? ""}
                            disabled={!isEditable}
                            onChange={e => updateSlab(idx, "income_to", e.target.value)}
                            onKeyDown={e => handleSlabKeyDown(e, idx, "to")}
                            placeholder="No limit"
                            className={`w-full h-[26px] px-2 text-[12px] font-mono border rounded outline-none transition-all
                              ${!isEditable ? "border-transparent bg-transparent text-gray-600 cursor-not-allowed"
                                : "border-transparent bg-transparent hover:border-gray-200 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-50"}`}
                          />
                        </td>
                        <td className="px-2 py-1 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {!isEditable && (
                              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                                style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
                                {slab.tax_rate_pct}%
                              </span>
                            )}
                            {isEditable && (
                              <input
                                ref={el => slabRefs.current[`${idx}-rate`] = el}
                                type="number" min="0" max="100" step="0.5"
                                value={slab.tax_rate_pct ?? ""}
                                onChange={e => updateSlab(idx, "tax_rate_pct", e.target.value)}
                                onKeyDown={e => handleSlabKeyDown(e, idx, "rate")}
                                placeholder="%"
                                className="w-[70px] h-[26px] px-2 text-[12px] font-mono text-right border rounded outline-none transition-all
                                  border-transparent bg-transparent hover:border-gray-200 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-50"
                              />
                            )}
                          </div>
                        </td>
                        {isEditable && (
                          <td className="px-2 py-1 text-center">
                            <button type="button" tabIndex={-1} onClick={() => deleteSlab(idx)}
                              className="w-[24px] h-[24px] rounded text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all
                                opacity-0 group-hover:opacity-100 text-[14px] flex items-center justify-center mx-auto">
                              ✕
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                  {slabs.length === 0 && (
                    <tr>
                      <td colSpan={isEditable ? 4 : 3} className="text-center py-6 text-[12px] text-gray-400">
                        No slabs added yet — Shift+Enter to add
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              {isEditable && (
                <button type="button" tabIndex={-1} onClick={addSlab}
                  className="w-full h-[34px] border-t border-dashed border-gray-200 text-[12px] font-medium text-gray-400
                    hover:text-blue-500 hover:bg-blue-50 hover:border-blue-200 transition-all flex items-center justify-center gap-1">
                  <span className="text-[16px] leading-none">+</span> Add Slab (Shift+Enter)
                </button>
              )}
            </div>

            {/* Load Defaults */}
            {isEditable && (
              <div className="flex gap-2">
                <button type="button" tabIndex={-1} onClick={() => loadDefaults("New")}
                  className="flex-1 h-[32px] border border-blue-200 bg-blue-50 text-blue-600 text-[12px] font-medium rounded-md hover:bg-blue-100 transition-all flex items-center justify-center gap-1">
                  ⚡ Load New Regime Defaults
                </button>
                <button type="button" tabIndex={-1} onClick={() => loadDefaults("Old")}
                  className="flex-1 h-[32px] border border-amber-200 bg-amber-50 text-amber-600 text-[12px] font-medium rounded-md hover:bg-amber-100 transition-all flex items-center justify-center gap-1">
                  📋 Load Old Regime Defaults
                </button>
              </div>
            )}
          </div>

          {/* Live Preview */}
          <div className="w-[260px] flex-shrink-0 sticky top-0">
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 bg-gray-50 rounded-t-lg">
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Live Preview</span>
                <span className="w-[7px] h-[7px] rounded-full bg-green-500 inline-block" />
              </div>
              <div className="p-3">
                <div className="text-[14px] font-semibold text-gray-800 mb-0.5 truncate">{formData.name || "—"}</div>
                <div className="text-[11px] text-gray-400 mb-3">
                  {formData.financial_year ? `FY ${formData.financial_year} · ${formData.tax_regime} Regime` : "Configure to preview"}
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-gray-100 text-[12px]">
                  <span className="text-gray-500">Regime</span>
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full
                    ${formData.tax_regime === "New" ? "bg-blue-50 text-blue-600 border border-blue-200" : "bg-amber-50 text-amber-600 border border-amber-200"}`}>
                    {formData.tax_regime === "New" ? "⚡ New" : "📋 Old"}
                  </span>
                </div>
                {[
                  ["Financial Year", formData.financial_year || "—"],
                  ["Basic Exemption", fmt(formData.basic_exemption)],
                  ["Std. Deduction", fmt(formData.standard_deduction)],
                  ["Taxable From", fmt(taxableFrom)],
                  ["Calc Method", formData.calc_method || "—"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between items-center py-1.5 border-b border-gray-100 text-[12px]">
                    <span className="text-gray-500">{k}</span>
                    <span className="font-mono text-[11px] font-medium text-gray-700">{v}</span>
                  </div>
                ))}
                {slabs.length > 0 ? (
                  <div className="mt-3">
                    <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Tax Slabs</div>
                    <div className="flex flex-col gap-1">
                      {slabs.map((s, i) => {
                        const c = getRateColor(s.tax_rate_pct);
                        return (
                          <div key={i} className="flex items-center gap-2 p-1.5 rounded bg-gray-50 border border-gray-100 text-[11px]">
                            <span className="font-mono text-gray-500 flex-1 text-[10px]">
                              {s.income_from ? "₹" + Number(s.income_from).toLocaleString("en-IN") : "₹0"}
                              {" – "}
                              {s.income_to ? "₹" + Number(s.income_to).toLocaleString("en-IN") : "∞"}
                            </span>
                            <span className="font-mono font-semibold text-[11px] px-1.5 py-0.5 rounded-full"
                              style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
                              {s.tax_rate_pct || 0}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 text-[11px] text-gray-400 text-center py-4">No slabs added yet</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <ERPFooter
        isAddMode={isAddMode} isEditMode={isEditMode} isViewMode={isViewMode}
        saving={saving} handleSubmit={handleValidateAndSave}
        saveBtnRef={saveBtnRef}
        onModify={onModify} onDelete={() => onDelete && onDelete(formData)}
        onCancel={onCancel} onEditCancel={onEditCancel}
        onNewEntry={onNewEntry} rights={rights}
      />
    </div>
  );
};

export default TDSMasterForm;