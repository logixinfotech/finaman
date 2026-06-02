// // // // // import React, { useState, useRef, useEffect, useCallback, memo } from "react";
// // // // // import ERPHeader from "../../components/Reusable/form/HeaderForm";
// // // // // import ERPFooter from "../../components/Reusable/form/FooterForm";
// // // // // import ERPDateInput from "../../components/Reusable/input/Date";
// // // // // import ERPAutocomplete from "../../components/Reusable/input/ERPAutocomplete";
// // // // // import { tabs, fieldGroups } from "./EmployeeMasterDetails";
// // // // // import LeaveTypeSelector from "./LeaveTypeSelector";
// // // // // import { fetchUserGroupsByType } from "../../utils/api";
// // // // // import {
// // // // //   validateEmployeeForm,
// // // // //   validateSingleField,
// // // // // } from "./EmployeeFromValidation";
// // // // // import DocumentTable from "./DocumentTable";
// // // // // import {
// // // // //   FaUser,
// // // // //   FaBuilding,
// // // // //   FaFileAlt,
// // // // //   FaMoneyBill,
// // // // // } from "react-icons/fa";
// // // // // const widthConfig = {
// // // // //   "Title": "w-[97px]",
// // // // //   "Pin Code": "w-[70px]",
// // // // //   "Mobile No": "w-[130px]",
// // // // //   "Gender": "w-[120px]",
// // // // //   "Relation": "pl-5 w-[800px]",
// // // // //   "Married": "pl-6 w-[80px]",
// // // // //   "Spouse": "pl-6 w-[700px]",
// // // // //   "Father Name": "w-[500px]",
// // // // //   "First Name": "w-[500px]",
// // // // //   "DOB": "w-[129px]",
// // // // // };


// // // // // const TabIcon = memo(({ tab, isActive }) => {
// // // // //   const baseClass = "inline mr-1.5 text-[12px]";
// // // // //   const colorClass = isActive
// // // // //     ? "text-blue-600 drop-shadow-sm"
// // // // //     : tab === "basic"
// // // // //       ? "text-blue-500"
// // // // //       : tab === "organization"
// // // // //         ? "text-orange-500"
// // // // //         : tab === "documents"
// // // // //           ? "text-emerald-500"
// // // // //           : "text-indigo-500";

// // // // //   if (tab === "basic") return <FaUser className={`${baseClass} ${colorClass}`} />;
// // // // //   if (tab === "organization") return <FaBuilding className={`${baseClass} ${colorClass}`} />;
// // // // //   if (tab === "documents") return <FaFileAlt className={`${baseClass} ${colorClass}`} />;
// // // // //   return <FaMoneyBill className={`${baseClass} ${colorClass}`} />;
// // // // // });

// // // // // const EmployeeMasterForm = ({
// // // // //   formData = {},
// // // // //   setFormData,
// // // // //   onSave,
// // // // //   onCancel,
// // // // //   onTabChange,
// // // // //   saving,
// // // // //   onDelete,
// // // // //   mode,
// // // // //   onModify,
// // // // //   onNewEntry,
// // // // //   currentRecord,
// // // // //   totalRecords,
// // // // //   onPrint,
// // // // //   onEditCancel,
// // // // //   rights,
// // // // // }) => {
// // // // //   const isAddMode = mode === "add";
// // // // //   const isViewMode = mode === "view";
// // // // //   const isEditMode = mode === "edit";

// // // // //   const [activeTab, setActiveTab] = useState("basic");
// // // // //   const [errors, setErrors] = useState({});
// // // // //   const [attachments, setAttachments] = useState({});
// // // // //   const [groupOptions, setGroupOptions] = useState({
// // // // //     division: [],
// // // // //     department: [],
// // // // //     designation: [],
// // // // //     grade: [],
// // // // //     reporting: []
// // // // //   });
// // // // //   const formDataRef = useRef(formData);
// // // // //   useEffect(() => {
// // // // //     formDataRef.current = formData;
// // // // //   }, [formData]);

// // // // //   const photoInputRef = useRef(null);
// // // // //   useEffect(() => {
// // // // //     const loadGroups = async () => {
// // // // //       try {
// // // // //         const div = await fetchUserGroupsByType("DIV");
// // // // //         const dept = await fetchUserGroupsByType("DEP");
// // // // //         const desg = await fetchUserGroupsByType("DESG");
// // // // //         const grade = await fetchUserGroupsByType("GRADE");
// // // // //         const reporting = await fetchUserGroupsByType("RME");


// // // // //         setGroupOptions({
// // // // //           division: div.data || [],
// // // // //           department: dept.data || [],
// // // // //           designation: desg.data || [],
// // // // //           grade: grade.data || [],
// // // // //           reporting: reporting.data || []

// // // // //         });

// // // // //       } catch (err) {
// // // // //         console.log("Dropdown error", err);
// // // // //       }
// // // // //     };

// // // // //     loadGroups();
// // // // //   }, []);

// // // // //   useEffect(() => {
// // // // //     setTimeout(() => {
// // // // //       const container = document.getElementById(`tab-content-${activeTab}`);
// // // // //       if (container) {
// // // // //         const firstEnabled = container.querySelector(
// // // // //           "input:not([disabled]), select:not([disabled])"
// // // // //         );
// // // // //         if (firstEnabled) firstEnabled.focus();
// // // // //       }
// // // // //     }, 50);
// // // // //   }, [activeTab]);

// // // // //   useEffect(() => {
// // // // //     if (isAddMode) {
// // // // //       setTimeout(() => {
// // // // //         const container = document.getElementById(`tab-content-basic`);
// // // // //         if (container) {
// // // // //           const firstEnabled = container.querySelector(
// // // // //             "input:not([disabled]), select:not([disabled])"
// // // // //           );
// // // // //           if (firstEnabled) firstEnabled.focus();
// // // // //         }
// // // // //       }, 100);
// // // // //     }
// // // // //   }, [isAddMode]);

// // // // //   const handleChange = useCallback(
// // // // //     (field, rawValue) => {
// // // // //       if (!setFormData) return;

// // // // //       let value = rawValue;
// // // // //       const nameStr = field.toLowerCase();

// // // // //       // ✅ number validations
// // // // //       if (
// // // // //         nameStr.includes("mobile") ||
// // // // //         nameStr.includes("phone") ||
// // // // //         nameStr.includes("pin code")
// // // // //       ) {
// // // // //         value = value.toString().replace(/\D/g, "").slice(0, 10);
// // // // //       } else if (nameStr.includes("pan")) {
// // // // //         value = value.toString().toUpperCase().slice(0, 10);
// // // // //       }

// // // // //       // ✅ IMPORTANT: dropdown mapping (NAME → ID)
// // // // //       if (
// // // // //         ["Division", "Department", "Designation", "Grade", "Reporting to"].includes(field)
// // // // //       ) {
// // // // //         const groupMap = {
// // // // //           Division: groupOptions.division,
// // // // //           Department: groupOptions.department,
// // // // //           Designation: groupOptions.designation,
// // // // //           Grade: groupOptions.grade,
// // // // //           "Reporting to": groupOptions.reporting,
// // // // //         };

// // // // //         const list = groupMap[field] || [];

// // // // //         const selected = list.find(
// // // // //           (g) => g.group_name?.trim() === rawValue?.trim()
// // // // //         );

// // // // //         console.log("FIELD:", field);
// // // // //         console.log("RAW VALUE:", rawValue);
// // // // //         console.log("SELECTED:", selected);

// // // // //         value = selected ? selected.group_id : null;
// // // // //       }

// // // // //       setFormData((prev) => {
// // // // //         let updated = { ...prev, [field]: value };

// // // // //         // ✅ Same as Correspondence
// // // // //         if (field === "Same as Correspondence") {
// // // // //           if (value === true) {
// // // // //             updated["P_Adress Line"] = updated["C_Adress Line"] || "";
// // // // //             updated["P_City"] = updated["C_City"] || "";
// // // // //             updated["P_District"] = updated["C_District"] || "";
// // // // //             updated["P_Pin Code"] = updated["C_Pin Code"] || "";
// // // // //             updated["P_State"] = updated["C_State"] || "";
// // // // //           } else {
// // // // //             updated["P_Adress Line"] = "";
// // // // //             updated["P_City"] = "";
// // // // //             updated["P_District"] = "";
// // // // //             updated["P_Pin Code"] = "";
// // // // //             updated["P_State"] = "";
// // // // //           }
// // // // //         }

// // // // //         // ✅ Married logic
// // // // //         if (field === "Married" && value === "No") {
// // // // //           updated["Spouse"] = "";
// // // // //           updated["Aniversary"] = "";
// // // // //         }

// // // // //         return updated;
// // // // //       });

// // // // //       // ✅ validation
// // // // //       const err = validateSingleField(field, value);
// // // // //       if (err) setErrors((prev) => ({ ...prev, [field]: err }));
// // // // //       else {
// // // // //         setErrors((prev) => {
// // // // //           const copy = { ...prev };
// // // // //           delete copy[field];
// // // // //           return copy;
// // // // //         });
// // // // //       }
// // // // //     },
// // // // //     [setFormData, groupOptions] // ✅🔥 THIS IS THE MAIN FIX
// // // // //   );

// // // // //   const handlePhotoUpload = (e) => {
// // // // //     const file = e.target.files?.[0];
// // // // //     if (file) handleChange("photo_url", URL.createObjectURL(file));
// // // // //   };

// // // // //   const requiredFields = [
// // // // //     "Employee Name",
// // // // //     "Mobile No",
// // // // //     "Email Id",
// // // // //     "Department",
// // // // //   ];

// // // // //   const getInputClass = (isDisabled) =>
// // // // //     `w-full h-[32px] px-2 text-[16px] border border-gray-300 rounded-md outline-none ${isDisabled
// // // // //       ? "bg-[#eef1f6] text-gray-500 cursor-not-allowed"
// // // // //       : "bg-white text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
// // // // //     }`;
// // // // //   const handleKeyDown = useCallback(
// // // // //     (e) => {
// // // // //       if (isViewMode) return;

// // // // //       if (e.key === "Enter") {
// // // // //         e.preventDefault();

// // // // //         const container = document.getElementById(`tab-content-${activeTab}`);
// // // // //         if (!container) return;

// // // // //         const focusableElements = Array.from(
// // // // //           container.querySelectorAll("input:not([disabled]), select:not([disabled])")
// // // // //         );

// // // // //         const index = focusableElements.indexOf(e.target);

// // // // //         if (index > -1) {
// // // // //           if (index < focusableElements.length - 1) {
// // // // //             focusableElements[index + 1].focus();
// // // // //           } else {
// // // // //             const currentTabIndex = tabs.indexOf(activeTab);
// // // // //             if (currentTabIndex < tabs.length - 1) {
// // // // //               setActiveTab(tabs[currentTabIndex + 1]);
// // // // //             } else {
// // // // //               const buttons = Array.from(document.querySelectorAll("button"));
// // // // //               const saveBtn = buttons.find((btn) =>
// // // // //                 btn.textContent.toLowerCase().includes("save")||btn.textContent.toLowerCase().includes("update")
// // // // //               );
// // // // //               if (saveBtn) {
// // // // //                 saveBtn.focus();
// // // // //               } 
// // // // //             }
// // // // //           }
// // // // //         }
// // // // //       }
// // // // //     },
// // // // //     [activeTab, isViewMode]
// // // // //   );

// // // // //   const renderField = (fieldObj) => {
// // // // //     const field = fieldObj.key;
// // // // //     const type = fieldObj.type || "text";

// // // // //     const isPermanentAddressField = field.startsWith("P_");
// // // // //     const isSameAsCorrespondence = !!formData["Same as Correspondence"];
// // // // //     const fieldDisabled = isViewMode || (isPermanentAddressField && isSameAsCorrespondence);

// // // // //     if (type === "date") {
// // // // //       return (
// // // // //         <ERPDateInput
// // // // //           value={formData[field] || ""}
// // // // //           onChange={(val) => handleChange(field, val)}
// // // // //           className={getInputClass(fieldDisabled)}
// // // // //           disabled={fieldDisabled}
// // // // //           onKeyDown={handleKeyDown}
// // // // //         />
// // // // //       );
// // // // //     }

// // // // //     if (type === "select") {
// // // // //       let options = fieldObj.options || [];

// // // // //       if (field === "Division") {
// // // // //         options = groupOptions.division.map(g => g.group_name);
// // // // //       }
// // // // //       if (field === "Department") {
// // // // //         options = groupOptions.department.map(g => g.group_name);
// // // // //       }
// // // // //       if (field === "Designation") {
// // // // //         options = groupOptions.designation.map(g => g.group_name);
// // // // //       }
// // // // //       if (field === "Grade") {
// // // // //         options = groupOptions.grade.map(g => g.group_name);
// // // // //       }
// // // // //       if (field === "Reporting to") {
// // // // //         options = groupOptions.reporting.map(g => g.group_name);
// // // // //       }

// // // // //       return (
// // // // //         <ERPAutocomplete
// // // // //           options={options}
// // // // //           value={formData[field] || ""}
// // // // //           disabled={fieldDisabled}
// // // // //           onChange={(val) => handleChange(field, val)}
// // // // //           className={getInputClass(fieldDisabled)}
// // // // //         />
// // // // //       );
// // // // //     }

// // // // //     // EmployeeMasterForm.jsx mein:
// // // // //     if (type === "leave-selector") {
// // // // //       return (
// // // // //         <LeaveTypeSelector
// // // // //           value={formData["Leave allow"] || []}
// // // // //           onChange={(selectedIds, selectedNames) => {
// // // // //             setFormData(prev => ({
// // // // //               ...prev,
// // // // //               "Leave allow": selectedIds,      // IDs → balance mein jayenge
// // // // //               "Leave allow names": selectedNames // Names → ACTLED mein jayenge
// // // // //             }));
// // // // //           }}
// // // // //           disabled={isViewMode}
// // // // //         />
// // // // //       );
// // // // //     }

// // // // //     if (type === "checkbox") {
// // // // //       return (
// // // // //         <div className="flex items-center h-[26px] w-full px-1">
// // // // //           <input
// // // // //             type="checkbox"
// // // // //             className="w-4 h-4 cursor-pointer"
// // // // //             checked={!!formData[field]}
// // // // //             disabled={isViewMode}
// // // // //             onChange={(e) => handleChange(field, e.target.checked)}
// // // // //             onKeyDown={handleKeyDown}
// // // // //           />
// // // // //         </div>
// // // // //       );
// // // // //     }

// // // // //     return (
// // // // //       <input
// // // // //         className={getInputClass(fieldDisabled)}
// // // // //         value={formData[field] || ""}
// // // // //         disabled={fieldDisabled}
// // // // //         onChange={(e) => handleChange(field, e.target.value)}
// // // // //         onKeyDown={handleKeyDown}
// // // // //         style={{ whiteSpace: "nowrap" }}
// // // // //       />
// // // // //     );
// // // // //   };

// // // // //   const handleSave = useCallback(() => {
// // // // //     const { isValid, errors, firstErrorTab } = validateEmployeeForm(
// // // // //       formDataRef.current,
// // // // //       fieldGroups
// // // // //     );
// // // // //     if (!isValid) {
// // // // //       setErrors(errors);
// // // // //       setActiveTab(firstErrorTab);
// // // // //       return;
// // // // //     }
// // // // //     onSave(formDataRef.current);
// // // // //   }, [onSave]);

// // // // //   return (
// // // // //     <div
// // // // //       className="w-full h-full sm:h-[calc(100vh-120px)] bg-[#eef1f6] flex flex-col overflow-hidden"
// // // // //       style={{ background: isViewMode ? "#eef1f6" : "#ffffff" }}
// // // // //     >
// // // // //       <ERPHeader
// // // // //         title="EMPLOYEE MASTER"
// // // // //         isAddMode={isAddMode}
// // // // //         isEditMode={isEditMode}
// // // // //         isViewMode={isViewMode}
// // // // //         rightContent={`${currentRecord || 1}/${totalRecords || 1}`}
// // // // //         activeTab="entry"
// // // // //         onTabChange={onTabChange}
// // // // //       />

// // // // //       <div
// // // // //         className="flex flex-1 min-h-0 flex-col md:flex-row w-full h-full md:h-[calc(100vh-120px)] overflow-hidden"
// // // // //         style={{ background: isViewMode ? "#eef1f6" : "#ffffff" }}
// // // // //       >
// // // // //         <div className="w-full md:w-48 bg-[#eef1f6] md:rounded-xl border shadow-sm flex flex-col overflow-hidden shrink-0">
// // // // //           <div className="bg-slate-800 h-20 w-full relative p-14 mb-12">
// // // // //             <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
// // // // //               <div className="w-28 h-28 bg-white rounded-2xl p-1 shadow-lg border">
// // // // //                 <div
// // // // //                   className="w-full h-full bg-slate-100 rounded-xl flex items-center justify-center overflow-hidden border border-dashed border-slate-300 cursor-pointer"
// // // // //                   onClick={() => photoInputRef.current?.click()}
// // // // //                 >
// // // // //                   {formData.photo_url ? (
// // // // //                     <img
// // // // //                       src={formData.photo_url}
// // // // //                       className="w-full h-full object-cover rounded-xl"
// // // // //                       alt="profile"
// // // // //                     />
// // // // //                   ) : (
// // // // //                     <FaUser className="text-3xl text-slate-400" />
// // // // //                   )}
// // // // //                 </div>
// // // // //               </div>
// // // // //             </div>
// // // // //           </div>
// // // // //           <input
// // // // //             type="file"
// // // // //             className="hidden"
// // // // //             ref={photoInputRef}
// // // // //             onChange={handlePhotoUpload}
// // // // //           />
// // // // //           <div className="px-6 pt-4 pb-4 text-center">
// // // // //             <h2 className="text-[18px] font-bold text-slate-800 truncate">
// // // // //               {formData.employee_name || formData["Employee Name"] || "New Employee"}
// // // // //             </h2>
// // // // //             <h4 className="text-[14px] text-slate-800 truncate">
// // // // //               {formData.employee_code || formData["Employee Code"] || "Employee Id"}
// // // // //             </h4>
// // // // //             <button
// // // // //               onClick={() => photoInputRef.current?.click()}
// // // // //               className="mt-3 px-3 py-1 text-[12px] rounded bg-slate-800 text-white hover:bg-slate-700 transition"
// // // // //             >
// // // // //               Upload Photo
// // // // //             </button>
// // // // //           </div>
// // // // //           <nav className="flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible mt-2 md:mt-4 px-3 gap-1 pb-2 md:pb-0 scrollbar-hide">
// // // // //             {tabs.map((tab) => {
// // // // //               const isActive = activeTab === tab;

// // // // //               return (
// // // // //                 <button
// // // // //                   key={tab}
// // // // //                   onClick={() => setActiveTab(tab)}
// // // // //                   className="group relative flex items-center gap-3 px-3 py-2 rounded-md text-[14px] font-semibold uppercase tracking-wide transition-all whitespace-nowrap"
// // // // //                   style={{
// // // // //                     background: isActive ? "#0f172a" : "transparent",
// // // // //                     color: isActive ? "#fff" : "#334155",
// // // // //                   }}
// // // // //                   onMouseEnter={(e) => {
// // // // //                     if (!isActive) e.currentTarget.style.background = "#f1f5f9";
// // // // //                   }}
// // // // //                   onMouseLeave={(e) => {
// // // // //                     if (!isActive) e.currentTarget.style.background = "transparent";
// // // // //                   }}
// // // // //                 >
// // // // //                   {isActive && (
// // // // //                     <div className="hidden md:block absolute left-0 top-1 bottom-1 w-[3px] bg-white rounded-r" />
// // // // //                   )}

// // // // //                   <span className="text-sm">
// // // // //                     <TabIcon tab={tab} isActive={isActive} />
// // // // //                   </span>
// // // // //                   <span>{tab}</span>
// // // // //                 </button>
// // // // //               );
// // // // //             })}
// // // // //           </nav>
// // // // //         </div>

// // // // //         <div
// // // // //           id={`tab-content-${activeTab}`}
// // // // //           className="flex-1 p-2 md:p-2 overflow-y-auto overflow-x-hidden min-h-0"
// // // // //         >
// // // // //           {activeTab === "documents" ? (
// // // // //             <DocumentTable
// // // // //               attachments={attachments}
// // // // //               setAttachments={setAttachments}
// // // // //               isViewMode={isViewMode}
// // // // //             />
// // // // //           ) : (
// // // // //             <div className="columns-1 xl:columns-2 2xl:columns-3 3xl:columns-4 gap-1">
// // // // //               {Object.entries(fieldGroups[activeTab] || {}).map(
// // // // //                 ([title, fields]) => (
// // // // //                   <div
// // // // //                     key={title}
// // // // //                     className="mb-3 break-inside-avoid border rounded shadow-sm inline-block w-full"
// // // // //                   >
// // // // //                     <div className="text-[15px] font-medium px-2 py-1 border-b">
// // // // //                       {title}
// // // // //                     </div>

// // // // //                     <div className="p-2 flex flex-wrap gap-x-2 gap-y-2">
// // // // //                       {(fields || []).map((fieldObj) => {
// // // // //                         if (fieldObj.showIf && !fieldObj.showIf(formData)) {
// // // // //                           return null;
// // // // //                         }

// // // // //                         const fieldKey = fieldObj.key;
// // // // //                         const label = fieldObj.label;
// // // // //                         const nameStr = label.toLowerCase();

// // // // //                         const isFullWidth =
// // // // //                           nameStr.includes("employee name") ||
// // // // //                           nameStr.includes("mother") ||
// // // // //                           nameStr.includes("father") ||
// // // // //                           nameStr.includes("email") ||
// // // // //                           nameStr.includes("address") ||
// // // // //                           nameStr.includes("bank account") ||
// // // // //                           nameStr === "leave allow" ||
// // // // //                           nameStr === "address line" ||
// // // // //                           nameStr === "passport" ||
// // // // //                           nameStr === "same as correspondence" ||
// // // // //                           nameStr === "contact person";
// // // // //                         const customInputWidth = widthConfig[label];

// // // // //                         return (
// // // // //                           <div
// // // // //                             key={fieldKey}
// // // // //                             className={`flex flex-col sm:flex-row items-start sm:items-center px-1 text-[15px] flex-grow ${isFullWidth ? "w-full" : "w-[49%]"
// // // // //                               }`}
// // // // //                           >
// // // // //                             <label className="text-black-800 px-1 sm:min-w-[90px] flex-shrink-0 leading-tight mb-1 sm:mb-0 flex items-center">
// // // // //                               {label}
// // // // //                               {requiredFields.includes(fieldKey) && (
// // // // //                                 <span className="text-red-500 ml-1">*</span>
// // // // //                               )}
// // // // //                             </label>

// // // // //                             <div
// // // // //                               className={`flex min-w-0 ${customInputWidth ? customInputWidth : "flex-1"} px-1 w-full relative`}
// // // // //                               style={{
// // // // //                                 background: isViewMode ? "#eef1f6" : "#ffffff",
// // // // //                               }}
// // // // //                             >
// // // // //                               {renderField(fieldObj)}

// // // // //                               {errors[fieldKey] && (
// // // // //                                 <div className="absolute left-0 top-full mt-1 z-50">
// // // // //                                   <div className="bg-red-500 text-white text-[10px] px-2 py-[3px] rounded shadow-md max-w-[200px] break-words leading-tight">
// // // // //                                     {errors[fieldKey]}
// // // // //                                   </div>
// // // // //                                 </div>
// // // // //                               )}
// // // // //                             </div>
// // // // //                           </div>
// // // // //                         );
// // // // //                       })}
// // // // //                     </div>
// // // // //                   </div>
// // // // //                 )
// // // // //               )}
// // // // //             </div>
// // // // //           )}
// // // // //         </div>
// // // // //       </div>

// // // // //       <ERPFooter
// // // // //         isAddMode={isAddMode}
// // // // //         isViewMode={isViewMode}
// // // // //         isEditMode={isEditMode}
// // // // //         saving={saving}
// // // // //         handleSubmit={handleSave}
// // // // //         onModify={onModify}
// // // // //         onDelete={() => onDelete && onDelete(formData)}
// // // // //         onCancel={onCancel}
// // // // //         onNewEntry={onNewEntry}
// // // // //         onPrint={onPrint}
// // // // //         onEditCancel={onEditCancel}
// // // // //         rights={rights}
// // // // //       />
// // // // //     </div>
// // // // //   );
// // // // // };

// // // // // export default EmployeeMasterForm;

import React, { useState, useRef, useEffect, useCallback, memo } from "react";
import ERPHeader from "../../components/Reusable/form/HeaderForm";
import ERPFooter from "../../components/Reusable/form/FooterForm";
import ERPDateInput from "../../components/Reusable/input/Date";
import ERPAutocomplete from "../../components/Reusable/input/ERPAutocomplete";
import { tabs } from "./EmployeeMasterDetails"; 
import LeaveTypeSelector from "./LeaveTypeSelector";
import { fetchUserGroupsByType } from "../../utils/api";
import {
  validateEmployeeForm,
  validateSingleField,
} from "./EmployeeFromValidation";
import DocumentTable from "./DocumentTable";

import {
  FaUser, FaBuilding, FaFileAlt, FaMoneyBill, FaCloudUploadAlt,
  FaCalendarAlt, FaUserTie, FaPhoneAlt, FaIdCard, FaRegUser, FaRegAddressCard,
  FaGraduationCap, FaUsers, FaExclamationCircle, FaMapMarkerAlt, FaHome, 
  FaUniversity, FaBriefcase, FaCalendarCheck, FaShieldAlt, FaMoneyBillWave, 
  FaChartLine, FaHandHoldingUsd, FaCogs, FaCube, FaCreditCard
} from "react-icons/fa";

// const widthConfig = {
//   // Extra Small Fields
//   "Title": "min-w-[40px] max-w-[50px]",
//   "Phone Extension": "min-w-[90px] max-w-[120px]",
//   "No. of Children": "min-w-[100px] max-w-[130px]",
//   "Gender": "min-w-[100px] max-w-[140px]",
//   "Blood Group": "min-w-[100px] max-w-[140px]",
  
//   // Small Fields (IDs, Dates, Numbers, Dropdowns)
//   "Employee ID": "min-w-[100px] max-w-[120px]",
//   "Date of Birth": "min-w-[130px] max-w-[160px]",
//   "Pin Code": "min-w-[100px] max-w-[140px]",
//   "Mobile No": "min-w-[130px] max-w-[160px]",
//   "Alternate Mobile": "min-w-[130px] max-w-[160px]",
//   "Alternate No": "min-w-[130px] max-w-[160px]",
//   "Phone (Residence)": "min-w-[130px] max-w-[160px]",
//   "Passport Expiry": "min-w-[130px] max-w-[160px]",
//   "Anniversary Date": "min-w-[130px] max-w-[160px]",
//   "Joining Date": "min-w-[130px] max-w-[160px]",
//   "Confirmation Date": "min-w-[130px] max-w-[160px]",
//   "Salary Effective Date": "min-w-[130px] max-w-[160px]",
//   "Last CTC": "min-w-[120px] max-w-[160px]",
//   "MICR Code": "min-w-[120px] max-w-[160px]",
//   "PF Applicable": "min-w-[130px] max-w-[160px]",
//   "ESI Applicable": "min-w-[130px] max-w-[160px]",
//   "Gratuity Eligible": "min-w-[130px] max-w-[160px]",

//   // Medium Fields
//   "PAN Number": "min-w-[130px] max-w-[180px]",
//   "Aadhaar No": "min-w-[140px] max-w-[180px]",
//   "Country": "min-w-[120px] max-w-[180px]",
//   "Nationality": "min-w-[120px] max-w-[180px]",
//   "Religion": "min-w-[120px] max-w-[180px]",
//   "Category": "min-w-[120px] max-w-[180px]",
//   "Marital Status": "min-w-[120px] max-w-[180px]",
//   "Relationship": "min-w-[130px] max-w-[180px]",
//   "Probation Period": "min-w-[130px] max-w-[180px]",
//   "Notice Period": "min-w-[130px] max-w-[180px]",
//   "Account Type": "min-w-[130px] max-w-[180px]",
//   "TDS Category": "min-w-[130px] max-w-[180px]",
//   "CTC": "min-w-[130px] max-w-[180px]",
//   "Basic": "min-w-[130px] max-w-[180px]",
//   "HRA": "min-w-[130px] max-w-[180px]",
//   "Special Allowance": "min-w-[130px] max-w-[180px]",

//   // Regular Text Fields (Names, Districts, etc)
//   "First Name": "min-w-[140px] max-w-[220px]",
//   "Middle Name": "min-w-[140px] max-w-[220px]",
//   "Last Name": "min-w-[140px] max-w-[220px]",
//   "Spouse Name": "min-w-[140px] max-w-[220px]",
//   "Qualification": "min-w-[150px] max-w-[220px]",
//   "Professional Qualification": "min-w-[150px] max-w-[220px]",
//   "Specialization": "min-w-[150px] max-w-[220px]",
//   "City": "min-w-[140px] max-w-[200px]",
//   "District": "min-w-[140px] max-w-[200px]",
//   "State": "min-w-[140px] max-w-[200px]",
//   "Voter ID": "min-w-[140px] max-w-[200px]",
//   "Driving Licence": "min-w-[140px] max-w-[200px]",
//   "Passport No": "min-w-[140px] max-w-[200px]",
//   "Contact Person": "min-w-[140px] max-w-[220px]",
//   "Previous Experience": "min-w-[140px] max-w-[220px]",
//   "Total Experience": "min-w-[140px] max-w-[220px]",
//   "UAN Number": "min-w-[140px] max-w-[200px]",
//   "UAN": "min-w-[140px] max-w-[200px]",
//   "IFSC Code": "min-w-[140px] max-w-[200px]",
//   "PT State": "min-w-[140px] max-w-[200px]",

//   // Large Text Fields
//   "Mother's Name": "min-w-[180px] max-w-[220px]",
//   "Father's / Guardian's Name": "min-w-[180px] max-w-[220px]",
//   "Personal Email": "flex-1 min-w-[200px] max-w-[300px]", 
//   "Work Email": "flex-1 min-w-[200px] max-w-[300px]",
//   "Department": "min-w-[160px] max-w-[260px]",
//   "Designation": "min-w-[160px] max-w-[260px]",
//   "Grade / Level": "min-w-[150px] max-w-[220px]",
//   "Branch / Location": "min-w-[160px] max-w-[260px]",
//   "Cost Centre": "min-w-[150px] max-w-[220px]",
//   "Reporting Manager": "min-w-[160px] max-w-[260px]",
//   "Employment Type": "min-w-[150px] max-w-[220px]",
//   "Work Shift": "min-w-[150px] max-w-[220px]",
//   "Work Location Type": "min-w-[150px] max-w-[220px]",
//   "Employee Category": "min-w-[150px] max-w-[220px]",
//   "Previous Company": "min-w-[180px] max-w-[300px]",
//   "Last Designation": "min-w-[160px] max-w-[260px]",
//   "Reason for Leaving": "min-w-[160px] max-w-[260px]",
//   "Bank Name": "min-w-[180px] max-w-[300px]",
//   "Branch Name": "min-w-[160px] max-w-[260px]",
//   "Account Holder Name": "min-w-[180px] max-w-[300px]",
//   "Account Number": "min-w-[150px] max-w-[240px]",
//   "PF Number": "min-w-[140px] max-w-[240px]",
//   "ESI Number": "min-w-[140px] max-w-[240px]",
//   "PF Account (Previous)": "min-w-[150px] max-w-[240px]",
// };
// ======== CUSTOM GRID CONFIGURATION PER SECTION ========
  const getGridConfig = (title) => {
    const configs = {
      // Bade sections jahan zyada fields hain (4 columns on large screens)
      "Personal Information": "grid-cols-1 sm:grid-cols-3 2xl:grid-cols-5",
      "Employment Details": "grid-cols-1 sm:grid-cols-3 2xl:grid-cols-4",
      
      // Medium sections (3 columns on large screens)
      "Contact Details": "grid-cols-1 md:grid-cols-3 2xl:grid-cols-4",
      "KYC Details": "grid-cols-1 sm:grid-cols-3 2xl:grid-cols-3",
      "Joining & Tenure": "grid-cols-1 md:grid-cols-3 2xl:grid-cols-4",
      "Previous Employment": "grid-cols-1 sm:grid-cols-3 2xl:grid-cols-4",
      "Bank Details": "grid-cols-1 sm:grid-cols-3 2xl:grid-cols-4",
      "Statutory Details": "grid-cols-1 sm:grid-cols-3 2xl:grid-cols-4",
      "Salary Details": "grid-cols-1 sm:grid-cols-3 2xl:grid-cols-4",
      
      // Chhote sections (2 columns on large screens)
      "Emergency Contact": "grid-cols-1 sm:grid-cols-4 2xl:grid-cols-4",
      "Correspondence Address": "grid-cols-1 sm:grid-cols-4 2xl:grid-cols-5",
      "Permanent Address": "grid-cols-1 sm:grid-cols-4 2xl:grid-cols-5",
    };

    // Agar koi section define nahi kiya hai, toh ye default grid apply hoga
    return configs[title] || "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3";
  };

const TabIcon = memo(({ tab }) => {
  const baseClass = "text-[15px]";
  if (tab === "personal_and_contact") return <FaRegUser className={baseClass} />;
  if (tab === "organization") return <FaBuilding className={baseClass} />;
  if (tab === "address") return <FaMapMarkerAlt className={baseClass} />;
  if (tab === "bank_and_payroll") return <FaCreditCard className={baseClass} />;
  if (tab === "documents") return <FaFileAlt className={baseClass} />;
  return <FaFileAlt className={baseClass} />;
});

const getInitials = (name) => {
  if (!name || name === "New Employee") return "NA";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
};

const getHeaderStyle = (title) => {
  const t = title.toLowerCase();
  
  if (t.includes("personal")) return { icon: <FaUser />, barBg: "bg-[#e8f0fe]", iconBg: "bg-[#1a56db]/15 text-[#1a56db]", text: "text-[#0f2137]", border: "border-[#c2d1f7]" };
  if (t.includes("contact") && !t.includes("emergency")) return { icon: <FaPhoneAlt />, barBg: "bg-[#e6f7f4]", iconBg: "bg-[#0d9488]/15 text-[#0d9488]", text: "text-[#0f2137]", border: "border-[#b2e3da]" };
  if (t.includes("kyc")) return { icon: <FaIdCard />, barBg: "bg-[#f3e8ff]", iconBg: "bg-[#7c3aed]/15 text-[#7c3aed]", text: "text-[#0f2137]", border: "border-[#d4b8f5]" };
  if (t.includes("emergency")) return { icon: <FaExclamationCircle />, barBg: "bg-[#fee2e2]", iconBg: "bg-[#dc2626]/15 text-[#dc2626]", text: "text-[#0f2137]", border: "border-[#fca5a5]" };
  if (t.includes("education")) return { icon: <FaGraduationCap />, barBg: "bg-[#eef2ff]", iconBg: "bg-[#6366f1]/15 text-[#6366f1]", text: "text-[#0f2137]", border: "border-[#c7d2fe]" };
  if (t.includes("family")) return { icon: <FaUsers />, barBg: "bg-[#fdf2f8]", iconBg: "bg-[#ec4899]/15 text-[#ec4899]", text: "text-[#0f2137]", border: "border-[#fbcfe8]" };
  if (t.includes("correspondence") || (t.includes("address") && !t.includes("permanent"))) return { icon: <FaMapMarkerAlt />, barBg: "bg-[#fff7ed]", iconBg: "bg-[#f97316]/15 text-[#f97316]", text: "text-[#0f2137]", border: "border-[#ffedd5]" };
  if (t.includes("permanent")) return { icon: <FaHome />, barBg: "bg-[#fefce8]", iconBg: "bg-[#eab308]/20 text-[#d97706]", text: "text-[#0f2137]", border: "border-[#fef08a]" };
  if (t.includes("bank")) return { icon: <FaCreditCard />, barBg: "bg-[#e0f2fe]", iconBg: "bg-[#0284c7]/15 text-[#0284c7]", text: "text-[#0f2137]", border: "border-[#7dd3fc]" };

  if (t.includes("employment")) return { icon: <FaBuilding />, barBg: "bg-[#eff6ff]", iconBg: "bg-[#2563eb]/15 text-[#2563eb]", text: "text-[#0f2137]", border: "border-[#bfdbfe]" };
  if (t.includes("joining") || t.includes("tenure")) return { icon: <FaCalendarAlt />, barBg: "bg-[#f0fdf4]", iconBg: "bg-[#22c55e]/20 text-[#16a34a]", text: "text-[#0f2137]", border: "border-[#bbf7d0]" };
  if (t.includes("statutory") || t.includes("pf")) return { icon: <FaShieldAlt />, barBg: "bg-[#faf5ff]", iconBg: "bg-[#a855f7]/15 text-[#9333ea]", text: "text-[#0f2137]", border: "border-[#e9d5ff]" };
  if (t.includes("salary")) return { icon: <FaMoneyBillWave />, barBg: "bg-[#ecfdf5]", iconBg: "bg-[#10b981]/15 text-[#059669]", text: "text-[#0f2137]", border: "border-[#a7f3d0]" };
  if (t.includes("previous employment")) return { icon: <FaCube />, barBg: "bg-[#fff1f2]", iconBg: "bg-[#f43f5e]/15 text-[#e11d48]", text: "text-[#0f2137]", border: "border-[#fecdd3]" };
  
  return { icon: <FaFileAlt />, barBg: "bg-[#eef1f7]", iconBg: "bg-[#64748b]/15 text-[#475569]", text: "text-[#0f2137]", border: "border-[#dde1ea]" };
};

const EmployeeMasterForm = ({
  formData = {}, setFormData, onSave, onCancel, onTabChange, saving, onDelete, mode, onModify, onNewEntry, currentRecord, totalRecords, onPrint, onEditCancel, rights,
}) => {
  const isAddMode = mode === "add";
  const isViewMode = mode === "view";
  const isEditMode = mode === "edit";

  const [activeTab, setActiveTab] = useState("personal_and_contact");
  const [errors, setErrors] = useState({});
  const [attachments, setAttachments] = useState({});
  const [groupOptions, setGroupOptions] = useState({ division: [], department: [], designation: [], grade: [], reporting: [] });
  const formDataRef = useRef(formData);
  
  useEffect(() => { formDataRef.current = formData; }, [formData]);

  const photoInputRef = useRef(null);

  useEffect(() => {
    const loadGroups = async () => {
      try {
        const div = await fetchUserGroupsByType("DIV");
        const dept = await fetchUserGroupsByType("DEP");
        const desg = await fetchUserGroupsByType("DESG");
        const grade = await fetchUserGroupsByType("GRADE");
        const reporting = await fetchUserGroupsByType("RME");

        setGroupOptions({
          division: div.data || [], department: dept.data || [], designation: desg.data || [], grade: grade.data || [], reporting: reporting.data || []
        });
      } catch (err) {}
    };
    loadGroups();
  }, []);

  const getDisplayValue = (field, value) => {
    if (!value) return "";
    const groupMap = { Division: groupOptions.division, Department: groupOptions.department, Designation: groupOptions.designation, Grade: groupOptions.grade, "Reporting Manager": groupOptions.reporting };
    const list = groupMap[field] || [];
    const found = list.find(g => String(g.group_id) === String(value) || g.group_name === value);
    return found ? found.group_name : value;
  };

  const isPersonalComplete = Boolean(formData["First Name"] && formData["Date of Birth"]); 
  const isContactComplete = Boolean(formData["Mobile No"] && formData["Personal Email"]); 
  const isKYCComplete = Boolean(formData["PAN Number"] || formData["Aadhaar No"]); 
  const isOrgComplete = Boolean(formData["Department"] || formData["Designation"]); 
  const isBankComplete = Boolean(formData["Account Number"] || formData["IFSC Code"]);
  const isAddressComplete = Boolean(formData["C_Address Line 1"] && formData["C_City"]);

  const completedSections = [isPersonalComplete, isContactComplete, isKYCComplete, isOrgComplete, isBankComplete, isAddressComplete].filter(Boolean).length;
  const completionPercentage = Math.round((completedSections / 6) * 100) || 0;

  const isTabComplete = (tabName) => {
    if (tabName === "personal_and_contact") return isPersonalComplete || isContactComplete || isKYCComplete;
    if (tabName === "organization") return isOrgComplete;
    if (tabName === "address") return isAddressComplete;
    if (tabName === "bank_and_payroll") return isBankComplete;
    if (tabName === "documents") return Object.keys(attachments || {}).length > 0;
    return false;
  };
  // 2XL screen detect karne ke liye state
  const [is2XL, setIs2XL] = useState(
    typeof window !== "undefined" ? window.innerWidth >= 1536 : false
  );

  useEffect(() => {
    const handleResize = () => setIs2XL(window.innerWidth >= 1536);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setTimeout(() => {
      const container = document.getElementById(`tab-content-${activeTab}`);
      if (container) {
        const firstEnabled = container.querySelector("input:not([disabled]), select:not([disabled])");
        if (firstEnabled) firstEnabled.focus();
      }
    }, 50);
  }, [activeTab]);

  useEffect(() => {
    if (isAddMode) {
      setTimeout(() => {
        const container = document.getElementById(`tab-content-personal_and_contact`);
        if (container) {
          const firstEnabled = container.querySelector("input:not([disabled]), select:not([disabled])");
          if (firstEnabled) firstEnabled.focus();
        }
      }, 100);
    }
  }, [isAddMode]);

  const handleChange = useCallback((field, rawValue) => {
      if (!setFormData) return;
      let value = rawValue;
      const nameStr = field.toLowerCase();

      if (nameStr.includes("mobile") || nameStr.includes("phone") || nameStr.includes("pin code")) {
        value = value.toString().replace(/\D/g, "").slice(0, 10);
      } else if (nameStr.includes("pan") || nameStr.includes("ifsc") || nameStr.includes("uan")) {
        value = value.toString().toUpperCase();
      }

      if (["Division", "Department", "Designation", "Grade", "Reporting Manager"].includes(field)) {
        const list = { Division: groupOptions.division, Department: groupOptions.department, Designation: groupOptions.designation, Grade: groupOptions.grade, "Reporting Manager": groupOptions.reporting }[field] || [];
        const selected = list.find((g) => g.group_name?.trim() === rawValue?.trim());
        value = selected ? selected.group_id : null;
      }

      setFormData((prev) => {
        let updated = { ...prev, [field]: value };
        
        if (field === "Same as Correspondence") {
          if (value === true) {
            updated["P_Address Line 1"] = updated["C_Address Line 1"] || "";
            updated["P_Address Line 2"] = updated["C_Address Line 2"] || "";
            updated["P_City"] = updated["C_City"] || "";
            updated["P_District"] = updated["C_District"] || "";
            updated["P_Pin Code"] = updated["C_Pin Code"] || "";
            updated["P_State"] = updated["C_State"] || "";
            updated["P_Country"] = updated["C_Country"] || "";
          } else {
            updated["P_Address Line 1"] = ""; updated["P_Address Line 2"] = ""; updated["P_City"] = ""; updated["P_District"] = ""; updated["P_Pin Code"] = ""; updated["P_State"] = ""; updated["P_Country"] = "";
          }
        }
        
        if (field === "Marital Status" && value !== "Married") {
          updated["Spouse Name"] = ""; updated["Anniversary Date"] = ""; updated["No. of Children"] = "";
        }
        
        return updated;
      });

      const err = validateSingleField(field, value);
      if (err) setErrors((prev) => ({ ...prev, [field]: err }));
      else setErrors((prev) => { const copy = { ...prev }; delete copy[field]; return copy; });
    },
    [setFormData, groupOptions]
  );

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) handleChange("photo_url", URL.createObjectURL(file));
  };

  const requiredFields = ["First Name", "Mobile No", "Personal Email", "Department"];

  const getInputClass = (isDisabled) =>
    `w-full h-[28px] px-[5px] text-[12.5px] border-[1.5px] border-[#c8d2e4] rounded-[5px] bg-[#fafbfd] outline-none transition-all font-['Segoe_UI',system-ui,Arial,sans-serif] ${
      isDisabled ? "bg-[#f0f3f8] text-[#64748b] border-[#e2e8f4] cursor-default" : "text-[#0f172a] focus:border-[#1a56db] focus:bg-[#ffffff] focus:ring-[3px] focus:ring-[#1a56db]/10 hover:border-[#a0b0c8]"
    }`;

  const handleKeyDown = useCallback((e) => {
      if (isViewMode) return;
      if (e.key === "Enter") {
        e.preventDefault();
        const container = document.getElementById(`tab-content-${activeTab}`);
        if (!container) return;
        const focusableElements = Array.from(container.querySelectorAll("input:not([disabled]), select:not([disabled])"));
        const index = focusableElements.indexOf(e.target);
        if (index > -1) {
          if (index < focusableElements.length - 1) focusableElements[index + 1].focus();
          else {
            const currentTabIndex = tabs.indexOf(activeTab);
            if (currentTabIndex < tabs.length - 1) setActiveTab(tabs[currentTabIndex + 1]);
            else {
              const buttons = Array.from(document.querySelectorAll("button"));
              const saveBtn = buttons.find((btn) => btn.textContent.toLowerCase().includes("save") || btn.textContent.toLowerCase().includes("update"));
              if (saveBtn) saveBtn.focus();
            }
          }
        }
      }
    }, [activeTab, isViewMode]
  );

  const renderField = (fieldObj) => {
    const field = fieldObj.key;
    const type = fieldObj.type || "text";
    const isPermanentAddressField = field.startsWith("P_");
    const isSameAsCorrespondence = !!formData["Same as Correspondence"];
    const fieldDisabled = isViewMode || (isPermanentAddressField && isSameAsCorrespondence) || fieldObj.readOnly;

    if (type === "date") return <ERPDateInput value={formData[field] || ""} onChange={(val) => handleChange(field, val)} className={getInputClass(fieldDisabled)} disabled={fieldDisabled} onKeyDown={handleKeyDown} />;
    
    if (type === "select") {
      let options = fieldObj.options || [];
      if (field === "Division") options = groupOptions.division.map(g => g.group_name);
      if (field === "Department") options = groupOptions.department.map(g => g.group_name);
      if (field === "Designation") options = groupOptions.designation.map(g => g.group_name);
      if (field === "Grade / Level") options = groupOptions.grade.map(g => g.group_name);
      if (field === "Reporting Manager") options = groupOptions.reporting.map(g => g.group_name);

      return <ERPAutocomplete options={options} value={getDisplayValue(field, formData[field])} disabled={fieldDisabled} onChange={(val) => handleChange(field, val)} className={getInputClass(fieldDisabled)} />;
    }

    if (type === "leave-selector") return <LeaveTypeSelector value={formData["Leave allow"] || []} onChange={(selectedIds, selectedNames) => { setFormData(prev => ({ ...prev, "Leave allow": selectedIds, "Leave allow names": selectedNames })); }} disabled={isViewMode} />;
    
    if (type === "checkbox") {
      return (
        <div className="flex items-center h-[32px] w-full px-1">
          <input type="checkbox" className="w-[16px] h-[16px] cursor-pointer accent-[#1a56db] rounded-[3px]" checked={!!formData[field]} disabled={isViewMode} onChange={(e) => handleChange(field, e.target.checked)} onKeyDown={handleKeyDown} />
        </div>
      );
    }

    return <input className={getInputClass(fieldDisabled)} value={formData[field] || ""} disabled={fieldDisabled} onChange={(e) => handleChange(field, e.target.value)} onKeyDown={handleKeyDown} style={{ whiteSpace: "nowrap" }} />;
  };

  const handleSave = useCallback(() => {
    const { isValid, errors, firstErrorTab } = validateEmployeeForm(formDataRef.current, fieldGroups);
    if (!isValid) { setErrors(errors); setActiveTab(firstErrorTab); return; }
    onSave(formDataRef.current);
  }, [onSave]);

  const employeeName = formData["First Name"] ? `${formData["First Name"]} ${formData["Last Name"] || ""}` : formData.employee_name || "New Employee";

  const renderCard = ([title, fields], isLast) => {
    const headerStyle = getHeaderStyle(title);
    return (
      <div 
        key={title} 
        className={`bg-white w-full flex flex-col border border-[#dde1ea] rounded-[6px] shadow-sm shrink-0 ${isLast ? 'flex-1' : ''}`}
      >
        <div className={`px-[14px] py-[7px] shrink-0 flex items-center justify-between border-b ${headerStyle.border} ${headerStyle.barBg} rounded-t-[5px]`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-[18px] h-[18px] rounded-[3px] flex items-center justify-center text-[11px] shadow-sm ${headerStyle.iconBg}`}>
              {headerStyle.icon}
            </div>
            <h3 className={`text-[11.5px] font-bold uppercase tracking-[0.4px] ${headerStyle.text}`}>
              {title}
            </h3>
          </div>

          {title === "Correspondence Address" && (
            <div className="flex items-center gap-1.5 bg-white/60 px-2.5 py-[3px] rounded border border-[#fef08a] hover:bg-white transition-colors cursor-pointer" onClick={() => !isViewMode && handleChange("Same as Correspondence", !formData["Same as Correspondence"])}>
              <input 
                type="checkbox" 
                id="sameAsCorr"
                className="w-[12px] h-[12px] cursor-pointer accent-[#d97706]" 
                checked={!!formData["Same as Correspondence"]} 
                disabled={isViewMode} 
                onChange={(e) => handleChange("Same as Correspondence", e.target.checked)}
                onClick={(e) => e.stopPropagation()} 
              />
              <label htmlFor="sameAsCorr" className="text-[10px] font-bold text-[#d97706] uppercase tracking-[0.3px] cursor-pointer select-none">
                Same In Permanent
              </label>
            </div>
          )}
        </div>
       {/* Dynamic Grid Class apply ki gayi hai */}
        <div className={`p-[14px] grid ${getGridConfig(title)} gap-x-[12px] gap-y-[5px] content-start items-start flex-1 overflow-visible`}>
          
          {(fields || []).map((fieldObj, index) => {
            if (fieldObj.showIf && !fieldObj.showIf(formData)) return null;

            // ======== SECTION DIVIDER ========
            if (fieldObj.type === "section-divider") {
              const getDividerIcon = (label) => {
                const l = label.toLowerCase();
                if (l.includes("education")) return <FaGraduationCap className="text-[14px]" />;
                if (l.includes("family")) return <FaUsers className="text-[14px]" />;
                return <FaFileAlt className="text-[14px]" />;
              };
              return (
                <div key={`${fieldObj.label}-${index}`} className="col-span-full mt-2 mb-1 flex items-center gap-2.5">
                  <div className="flex items-center gap-1.5 text-[#64748b]">
                    {getDividerIcon(fieldObj.label)}
                    <span className="text-[11px] font-bold uppercase tracking-[0.5px]">{fieldObj.label}</span>
                  </div>
                  <div className="flex-1 h-px bg-[#dde1ea]"></div>
                </div>
              );
            }

            const fieldKey = fieldObj.key;
            const label = fieldObj.label;
            const nameStr = label.toLowerCase();

            // ======== INDIVIDUAL FIELD WIDTH LOGIC ========
            let colSpanClass = "col-span-1"; 

            // Full Width (Poori Row lega)
            if (nameStr.includes("address line") || nameStr.includes("employee name") || nameStr.includes("remarks")) {
              colSpanClass = "col-span-2";
            } 
            // Medium Width (2 Columns lega agar screen badi hai)
            else if (
              nameStr.includes("email") || 
              
              nameStr.includes("bank name") || 

        
     
              nameStr.includes("qualification") 
             
            ) {
              colSpanClass = "col-span-1 sm:col-span-2";
            }

            const fieldClass = `flex flex-col gap-[3px] w-full ${colSpanClass}`;

            return (
              <div key={fieldKey} className={fieldClass}>
                <label className="text-[#1e293b] font-semibold text-[12px] tracking-[0.1px] flex items-center mb-[2px]">
                  {label}
                  {requiredFields.includes(fieldKey) && <span className="text-[#dc2626] ml-[2px] text-[12px] leading-none">*</span>}
                </label>

                <div className="w-full relative">
                  {renderField(fieldObj)}
                  
                  {errors[fieldKey] && (
                    <div className="absolute left-0 top-[100%] z-50 mt-[2px]">
                      <div className="bg-[#dc2626] text-white text-[10px] px-1.5 py-[2px] rounded-[3px] shadow whitespace-nowrap font-medium">
                        {errors[fieldKey]}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* <div className="p-[12px] flex flex-wrap gap-x-[12px] gap-y-[9px] content-start items-start flex-1 overflow-visible">
          {(fields || []).map((fieldObj, index) => {
            if (fieldObj.showIf && !fieldObj.showIf(formData)) return null;

            if (fieldObj.type === "section-divider") {
              const getDividerIcon = (label) => {
                const l = label.toLowerCase();
                if (l.includes("education")) return <FaGraduationCap className="text-[14px]" />;
                if (l.includes("family")) return <FaUsers className="text-[14px]" />;
                return <FaFileAlt className="text-[14px]" />;
              };
              return (
                <div key={`${fieldObj.label}-${index}`} className="w-full basis-full mt-3 mb-1 flex items-center gap-2.5">
                  <div className="flex items-center gap-1.5 text-[#64748b]">
                    {getDividerIcon(fieldObj.label)}
                    <span className="text-[11px] font-bold uppercase tracking-[0.5px]">{fieldObj.label}</span>
                  </div>
                  <div className="flex-1 h-px bg-[#dde1ea]"></div>
                </div>
              );
            }

            const fieldKey = fieldObj.key;
            const label = fieldObj.label;
            const nameStr = label.toLowerCase();

            const isFullWidth = nameStr.includes("employee name") || nameStr.includes("address") || nameStr.includes("remarks");
            const customInputWidth = widthConfig[label];

            let fieldClass = "flex flex-col gap-[3px] flex-1 ";
            
            if (isFullWidth) {
              fieldClass += "w-full min-w-full";
            } else if (customInputWidth) {
              fieldClass += customInputWidth;
            } else {
              fieldClass += "min-w-[130px]"; 
            }

            return (
              <React.Fragment key={fieldKey}>
                <div className={fieldClass}>
                  <label className="text-[#1e293b] font-semibold text-[11px] tracking-[0.1px] flex items-center mb-[2px]">
                    {label}
                    {requiredFields.includes(fieldKey) && <span className="text-[#dc2626] ml-[2px] text-[12px] leading-none">*</span>}
                  </label>

                  <div className="w-full relative">
                    {renderField(fieldObj)}
                    {errors[fieldKey] && (
                      <div className="absolute left-0 top-[100%] z-50 mt-[2px]">
                        <div className="bg-[#dc2626] text-white text-[10px] px-1.5 py-[2px] rounded-[3px] shadow whitespace-nowrap font-medium">
                          {errors[fieldKey]}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {title === "Personal Information" && fieldKey === "Last Name" && (
                  <div className="w-full h-0 m-0 p-0 basis-full"></div>
                )}
              </React.Fragment>
            );
          })}
        </div> */}
      </div>
    );
  };

  return (
    <div className="w-full h-full sm:h-[calc(100vh-120px)] bg-[#eef1f8] flex flex-col overflow-hidden font-['Segoe_UI',system-ui,Arial,sans-serif] text-[13px] text-[#0f172a] leading-[1.4]">
      
      <ERPHeader title="EMPLOYEE MASTER" isAddMode={isAddMode} isEditMode={isEditMode} isViewMode={isViewMode} rightContent={`${currentRecord || 1}/${totalRecords || 1}`} activeTab="entry" onTabChange={onTabChange} />

      <div className="flex flex-1 min-h-0 flex-col md:flex-row w-full h-full md:h-[calc(100vh-120px)] overflow-hidden">
        
        {/* SIDEBAR */}
        <div className="w-full md:w-[220px] bg-white border-r border-[#dde1ea] flex flex-col overflow-y-auto overflow-x-hidden shrink-0 scrollbar-hide z-10">
          <div className="bg-[#f8fafc] border-b border-[#dde1ea] py-[18px] px-3 flex flex-col items-center">
            <div className="relative z-10 cursor-pointer w-[88px] h-[88px] rounded-full bg-[#dde3ef] border-[3px] border-[#dde1ea] flex items-center justify-center overflow-hidden" onClick={() => photoInputRef.current?.click()}>
              {formData.photo_url ? (
                <img src={formData.photo_url} className="w-full h-full object-cover" alt="profile" />
              ) : (
                <span className="text-[28px] font-bold text-[#8a9ab5] tracking-wider">{getInitials(employeeName)}</span>
              )}
            </div>
            <input type="file" className="hidden" ref={photoInputRef} onChange={handlePhotoUpload} />

            <h2 className="text-[15px] font-bold text-[#0f2137] text-center mt-2.5 truncate w-full px-1">{employeeName}</h2>
            <h4 className="text-[10.5px] font-semibold text-[#718096] text-center mt-0.5 tracking-[0.4px] truncate w-full">EMP ID : {formData["Employee ID"] || formData.employee_code || "—"}</h4>

            <button onClick={() => photoInputRef.current?.click()} className="mt-2.5 flex items-center justify-center gap-1.5 px-3.5 py-[5px] rounded border-none bg-[#1a56db] hover:bg-[#1647c0] text-white text-[11px] font-semibold transition-colors w-max">
              <FaCloudUploadAlt className="text-[13px]" /> Upload Photo
            </button>
          </div>

          <div className="p-3 flex flex-col flex-1 bg-white">
            <div className="mb-4">
              <div className="flex justify-between items-center mb-1">
                <h3 className="text-[12px] font-bold text-[#374151]">Completion</h3>
                <span className="text-[13px] font-bold text-[#059669]">{completionPercentage}%</span>
              </div>
              <div className="w-full bg-[#eef1f7] rounded-full h-1.5 mb-2 overflow-hidden">
                <div className="bg-[#059669] h-1.5 rounded-full transition-all" style={{ width: `${completionPercentage}%` }}></div>
              </div>
            </div>

            <hr className="border-[#dde1ea] mb-3" />

            <div>
              <h3 className="text-[10px] font-bold tracking-[0.6px] text-[#94aabf] uppercase mb-2">Quick Info</h3>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center border-b border-[#f0f2f7] pb-1">
                  <span className="flex items-center gap-1.5 text-[#718096] text-[11px]"><FaCalendarAlt className="text-[9px]" /> Joining</span>
                  <span className="text-[#1a202c] font-bold text-[11px]">{formData["Joining Date"] || "—"}</span>
                </div>
                <div className="flex justify-between items-center border-b border-[#f0f2f7] pb-1">
                  <span className="flex items-center gap-1.5 text-[#718096] text-[11px]"><FaUserTie className="text-[9px]" /> Reports</span>
                  <span className="text-[#1a202c] font-bold text-[11px] truncate max-w-[100px]" title={getDisplayValue("Reporting Manager", formData["Reporting Manager"])}>
                    {getDisplayValue("Reporting Manager", formData["Reporting Manager"])}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-[#f0f2f7] pb-1">
                  <span className="flex items-center gap-1.5 text-[#718096] text-[11px]"><FaPhoneAlt className="text-[9px]" /> Mobile</span>
                  <span className="text-[#1a202c] font-bold text-[11px]">{formData["Mobile No"] || "—"}</span>
                </div>
                <div className="flex justify-between items-center pb-0.5">
                  <span className="flex items-center gap-1.5 text-[#718096] text-[11px]"><FaIdCard className="text-[9px]" /> PAN</span>
                  <span className="text-[#1a202c] font-bold text-[11px] uppercase">{formData["PAN Number"] || formData["PAN"] || "—"}</span>
                </div>
              </div>
            </div>

           
          </div>
        </div>

        {/* ===================== MAIN CONTENT AREA ===================== */}
        <div className="flex-1 flex flex-col min-h-0 bg-[#eef1f8]">
          
          {/* YAHAN SE 'overflow-x-auto scrollbar-hide' HATA DIYA GAYA HAI TAAKI ACTIVE TAB KA BLUE BORDER VISIBLE RAHE */}
          <div className="flex items-end gap-0 px-[16px] bg-white border-b-2 border-[#e1e7f2] shrink-0">
            {tabs.map((tab) => {
              const isActive = activeTab === tab;
              const isCompleted = isTabComplete(tab);
              
              const tabNameMap = { 
                personal_and_contact: "Personal & Contact", 
                organization: "Organization", 
                address: "Address",
                bank_and_payroll: "Bank & Payroll",
                documents: "Documents" 
              };
              const displayName = tabNameMap[tab] || tab;

              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex items-center gap-[6px] px-[16px] pt-[10px] pb-[9px] text-[12px] font-semibold cursor-pointer border-b-2 mb-[-2px] transition-all duration-150 whitespace-nowrap outline-none ${
                    isActive 
                      ? "text-[#1a56db] border-[#1a56db]" 
                      : "text-[#64748b] border-transparent hover:text-[#334155] hover:border-[#c4cfe4]"
                  }`}
                >
                  <div className={`w-[20px] h-[20px] rounded-[5px] flex items-center justify-center ${
                    isActive ? "bg-[#eef3fd]" : "bg-transparent"
                  }`}>
                    <TabIcon tab={tab} />
                  </div>
                  
                  <span>{displayName}</span>
                  
                  {isCompleted && (
                    <div className="w-[16px] h-[16px] rounded-[8px] bg-[#059669] text-white text-[9px] font-bold flex items-center justify-center ml-1">
                      ✓
                    </div>
                  )}
                </button>
              );
            })}
          </div>

       <div id={`tab-content-${activeTab}`} className="flex-1 p-[8px] overflow-y-auto overflow-x-hidden min-h-0 flex flex-col">
            {activeTab === "documents" ? (
              <DocumentTable attachments={attachments} setAttachments={setAttachments} isViewMode={isViewMode} />
            ) : (
              (() => {
                const entries = Object.entries(fieldGroups[activeTab] || {});
                const leftCol = [];
                const rightCol = [];

                entries.forEach(([title, fields], index) => {
                  
                  // ====== 2XL SCREEN LOGIC ======
                  // Agar badi 2xl screen hai, toh NO if-else divide logic (direct odd/even)
                  if (is2XL) {
                    if (index % 2 === 0) leftCol.push([title, fields]);
                    else rightCol.push([title, fields]);
                  } 
                  
                  // ====== NORMAL SCREEN LOGIC ======
                  // Agar normal screen hai (lg, xl), tabhi aapka left if-else rule chalega
                  else {
                    if (activeTab === "personal_and_contact") {
                      if (title === "Personal Information") {
                        leftCol.push([title, fields]);
                      } else {
                        rightCol.push([title, fields]);
                      }
                    } else if (activeTab === "organization") {
                      if (title === "Employment Details") {
                        leftCol.push([title, fields]);
                      } else {
                        rightCol.push([title, fields]);
                      }
                    } else {
                      if (index % 2 === 0) leftCol.push([title, fields]);
                      else rightCol.push([title, fields]);
                    }
                  }
                });

                return (
                  <div className="flex flex-col lg:flex-row gap-[8px] flex-1 items-stretch">
                    
                    {/* LEFT COLUMN */}
                    <div className="flex-1 flex flex-col gap-[8px] min-w-0">
                      {leftCol.map((entry, index) => renderCard(entry, index === leftCol.length - 1))}
                    </div>

                    {/* RIGHT COLUMN */}
                    {rightCol.length > 0 && (
                      <div className="flex-1 flex flex-col gap-[8px] min-w-0">
                        {rightCol.map((entry, index) => renderCard(entry, index === rightCol.length - 1))}
                      </div>
                    )}

                  </div>
                );
              })()
            )}
          </div>
        </div>
      </div>

      <ERPFooter
        isAddMode={isAddMode} isViewMode={isViewMode} isEditMode={isEditMode} saving={saving}
        handleSubmit={handleSave} onModify={onModify} onDelete={() => onDelete && onDelete(formData)}
        onCancel={onCancel} onNewEntry={onNewEntry} onPrint={onPrint} onEditCancel={onEditCancel} rights={rights}
      />
    </div>
  );
};

export default EmployeeMasterForm;

// ======================= FINAL FIELD GROUPS =======================
export const fieldGroups = {
  personal_and_contact: {
    "Personal Information": [
      { key: "Employee ID", label: "Employee ID", type: "text", readOnly: true },
      { key: "Title", label: "Title", type: "select", options: ["Mr", "Mrs", "Ms", "Dr", "Er"] },
      
      { key: "First Name", label: "First Name", type: "text" },
      { key: "Middle Name", label: "Middle Name", type: "text" },
      { key: "Last Name", label: "Last Name", type: "text" },
      
      { key: "Gender", label: "Gender", type: "select", options: ["Male", "Female", "Other"] },
      { key: "Date of Birth", label: "Date of Birth", type: "date" },
      { key: "Blood Group", label: "Blood Group", type: "select", options: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"] },
      { key: "Nationality", label: "Nationality", type: "select", options: ["Indian", "Other"] },
      { key: "Religion", label: "Religion", type: "select", options: ["Hindu", "Muslim", "Christian", "Sikh", "Jain", "Buddhist", "Other"] },
      { key: "Category", label: "Category", type: "select", options: ["General", "OBC", "SC", "ST"] },
      
      { key: "Marital Status", label: "Marital Status", type: "select", options: ["Single", "Married", "Divorced", "Widowed"] },
      { key: "Spouse Name", label: "Spouse Name", type: "text", showIf: (data) => data["Marital Status"] === "Married" },
      { key: "Anniversary Date", label: "Anniversary Date", type: "date", showIf: (data) => data["Marital Status"] === "Married" },
      { key: "No. of Children", label: "No. of Children", type: "select", options: ["0", "1", "2", "3", "4+"], showIf: (data) => data["Marital Status"] === "Married" },

      { type: "section-divider", label: "FAMILY DETAILS" },
      { key: "Mother's Name", label: "Mother's Name", type: "text" },
      { key: "Father's  Name", label: "Father's  Name", type: "text" },
      
      { type: "section-divider", label: "EDUCATIONAL DETAILS" },
      { key: "Qualification", label: "Qualification", type: "select", options: ["Below 10th", "10th Pass", "12th Pass", "Graduate", "Post Graduate", "Doctorate"] },
      { key: "Professional Qualification", label: "Professional Qualification", type: "text" },
      { key: "Specialization", label: "Specialization", type: "text" }
    ],
    "Contact Details": [
      { key: "Mobile No", label: "Mobile No", type: "tel" },
      { key: "Alternate Mobile", label: "Alternate Mobile", type: "tel" },
            { key: "Phone Extension", label: "Phone Extension", type: "tel" },
              { key: "Phone (Residence)", label: "Phone (Residence)", type: "tel" },
      { key: "Personal Email", label: "Personal Email", type: "email" },
      { key: "Work Email", label: "Work Email", type: "email" },
    
    ],
    "KYC Details": [
      { key: "PAN Number", label: "PAN Number", type: "text" },
      { key: "Aadhaar No", label: "Aadhaar No", type: "text" },
      { key: "Voter ID", label: "Voter ID", type: "text" },
      { key: "Driving Licence", label: "Driving Licence", type: "text" },
      { key: "Passport No", label: "Passport No", type: "text" },
      { key: "Passport Expiry", label: "Passport Expiry", type: "date" }
    ],
    "Emergency Contact": [
      { key: "Emerg_Contact Person", label: "Contact Person", type: "text" },
      { key: "Emerg_Relationship", label: "Relationship", type: "select", options: ["Brother", "Sister", "Father", "Mother", "Spouse", "Friend", "Other"] },
      { key: "Emerg_Mobile No", label: "Mobile No", type: "tel" },
      { key: "Emerg_Alternate No", label: "Alternate No", type: "tel" }
    ]
  },
  organization: {
    "Employment Details": [
      { key: "Department", label: "Department", type: "select", options: ["Information Technology", "Finance & Accounts", "Human Resources", "Operations", "Sales & Marketing", "Production", "Purchase", "Quality"] },
      { key: "Designation", label: "Designation", type: "select", options: ["Software Engineer", "Senior Engineer", "Team Lead", "Manager", "Senior Manager", "Deputy Manager", "Director"] },
      { key: "Grade / Level", label: "Grade / Level", type: "select", options: ["L1 — Junior", "L2 — Mid", "L3 — Senior", "L4 — Lead", "L5 — Principal"] },
      { key: "Branch / Location", label: "Branch / Location", type: "select", options: ["Noida — Head Office", "Mumbai", "Delhi", "Pune", "Bangalore"] },
      { key: "Cost Centre", label: "Cost Centre", type: "text" },
      { key: "Reporting Manager", label: "Reporting Manager", type: "text" },
      { key: "Employment Type", label: "Employment Type", type: "select", options: ["Full Time", "Part Time", "Contract", "Consultant", "Intern"] },
      { key: "Work Shift", label: "Work Shift", type: "select", options: ["General (9-6)", "Morning", "Evening", "Night", "Flexible"] },
      { key: "Work Location Type", label: "Work Location Type", type: "select", options: ["Office", "Work From Home", "Hybrid", "Field"] },
      { key: "Employee Category", label: "Employee Category", type: "select", options: ["Permanent", "Probation", "Trainee", "Contractual"] }
    ],
    "Joining & Tenure": [
      { key: "Joining Date", label: "Joining Date", type: "date" },
      { key: "Confirmation Date", label: "Confirmation Date", type: "date" },
      { key: "Probation Period", label: "Probation Period", type: "select", options: ["3 Months", "6 Months", "1 Year", "NA"] },
      { key: "Notice Period", label: "Notice Period", type: "select", options: ["30 Days", "60 Days", "90 Days", "NA"] },
      { key: "Previous Experience", label: "Previous Experience", type: "text" },
      { key: "Total Experience", label: "Total Experience", type: "text", readOnly: true }
    ],
    "Previous Employment": [
      { key: "Previous Company", label: "Previous Company", type: "text" },
      { key: "Last Designation", label: "Last Designation", type: "text" },
      { key: "Last CTC", label: "Last CTC (₹ LPA)", type: "text" },
      { key: "Reason for Leaving", label: "Reason for Leaving", type: "select", options: ["Better Opportunity", "Higher Studies", "Personal", "Relocation", "Layoff"] },
      { key: "PF Account (Previous)", label: "PF Account (Previous)", type: "text" },
      { key: "UAN Number", label: "UAN Number", type: "text" }
    ]
  },
  address: {
    "Correspondence Address": [
      { key: "C_Address Line 1", label: "Address Line 1", type: "text" },
      { key: "C_Address Line 2", label: "Address Line 2", type: "text" },
      { key: "C_City", label: "City", type: "text" },
      { key: "C_District", label: "District", type: "text" },
      { key: "C_Pin Code", label: "Pin Code", type: "text" },
      { key: "C_State", label: "State", type: "select", options: ["gorakhpur", "Maharashtra", "Delhi", "Gujarat", "Uttar Pradesh", "Karnataka", "Tamil Nadu", "Rajasthan", "Madhya Pradesh"] },
      { key: "C_Country", label: "Country", type: "select", options: ["India", "Other"] }
    ],
    "Permanent Address": [
      { key: "P_Address Line 1", label: "Address Line 1", type: "text" },
      { key: "P_Address Line 2", label: "Address Line 2", type: "text" },
      { key: "P_City", label: "City", type: "text" },
      { key: "P_District", label: "District", type: "text" },
      { key: "P_Pin Code", label: "Pin Code", type: "text" },
      { key: "P_State", label: "State", type: "select", options: ["MH", "Maharashtra", "Delhi", "Uttar Pradesh"] },
      { key: "P_Country", label: "Country", type: "select", options: ["India", "Other"] }
    ]
  },
  bank_and_payroll: {
    "Bank Details": [
      { key: "Bank Name", label: "Bank Name", type: "text" },
      { key: "IFSC Code", label: "IFSC Code", type: "text" },
      { key: "Account Number", label: "Account Number", type: "text" },
      { key: "Account Type", label: "Account Type", type: "select", options: ["Savings", "Current", "Salary"] },
      { key: "Account Holder Name", label: "Account Holder Name", type: "text" },
      { key: "Branch Name", label: "Branch Name", type: "text" },
      { key: "MICR Code", label: "MICR Code", type: "text" }
    ],
    "Statutory Details": [
      { key: "PF Number", label: "PF Number", type: "text" },
      { key: "UAN", label: "UAN", type: "text" },
      { key: "ESI Number", label: "ESI Number", type: "text" },
      { key: "PT State", label: "PT State", type: "select", options: ["Maharashtra", "Karnataka", "Andhra Pradesh", "Telangana", "Gujarat"] },
      { key: "PF Applicable", label: "PF Applicable", type: "select", options: ["Yes", "No"] },
      { key: "ESI Applicable", label: "ESI Applicable", type: "select", options: ["Yes", "No"] },
      { key: "Gratuity Eligible", label: "Gratuity Eligible", type: "select", options: ["Yes", "No"] },
      { key: "TDS Category", label: "TDS Category", type: "select", options: ["Salaried", "Non-Salaried", "Exempt"] }
    ],
    "Salary Details": [
      { key: "CTC", label: "CTC (₹ per annum)", type: "text" },
      { key: "Basic", label: "Basic (₹ per month)", type: "text" },
      { key: "HRA", label: "HRA (₹ per month)", type: "text" },
      { key: "Special Allowance", label: "Special Allowance", type: "text" },
      { key: "Salary Effective Date", label: "Salary Effective Date", type: "date" }
    ]
  },
  documents: {
    "Document Repository": [
      { key: "Aadhaar Card", label: "Aadhaar Card Upload", type: "file" },
      { key: "PAN Card", label: "PAN Card Upload", type: "file" },
      { key: "Offer Letter", label: "Offer Letter Upload", type: "file" }
    ]
  }
};
// import React, { useState, useRef, useEffect, useCallback, memo } from "react";
// import ERPHeader from "../../components/Reusable/form/HeaderForm";
// import ERPFooter from "../../components/Reusable/form/FooterForm";
// import ERPDateInput from "../../components/Reusable/input/Date";
// import ERPAutocomplete from "../../components/Reusable/input/ERPAutocomplete";
// import { tabs } from "./EmployeeMasterDetails"; 
// import LeaveTypeSelector from "./LeaveTypeSelector";
// import { fetchUserGroupsByType } from "../../utils/api";
// import {
//   validateEmployeeForm,
//   validateSingleField,
// } from "./EmployeeFromValidation";
// import DocumentTable from "./DocumentTable";

// import {
//   FaUser, FaBuilding, FaFileAlt, FaMoneyBill, FaCloudUploadAlt,
//   FaCalendarAlt, FaUserTie, FaPhoneAlt, FaIdCard, FaRegUser, FaRegAddressCard,
//   FaGraduationCap, FaUsers, FaExclamationCircle, FaMapMarkerAlt, FaHome, 
//   FaUniversity, FaBriefcase, FaCalendarCheck, FaShieldAlt, FaMoneyBillWave, 
//   FaChartLine, FaHandHoldingUsd, FaCogs, FaCube, FaCreditCard
// } from "react-icons/fa";

// const widthConfig = {
//   // Extra Small Fields
//   "Title": "min-w-[40px] max-w-[50px] ",
//   "Phone Extension": "min-w-[90px] max-w-[120px]",
//   "No. of Children": "min-w-[100px] max-w-[130px]",
//   "Gender": "min-w-[70px] max-w-[0px]",
//   "Blood Group": "min-w-[70px] max-w-[85px]",
  
//   // Small Fields (IDs, Dates, Numbers, Dropdowns)
//   "Employee ID": "min-w-[100px] max-w-[140px]",
//   "Date of Birth": "min-w-[100px] max-w-[100px]",
//   "Pin Code": "min-w-[100px] max-w-[140px]",
//   "Mobile No": "min-w-[130px] max-w-[160px]",
//   "Alternate Mobile": "min-w-[130px] max-w-[160px]",
//   "Alternate No": "min-w-[130px] max-w-[160px]",
//   "Phone (Residence)": "min-w-[130px] max-w-[160px]",
//   "Passport Expiry": "min-w-[130px] max-w-[160px]",
//   "Anniversary Date": "min-w-[100px] max-w-[140px]",
//   "Joining Date": "min-w-[130px] max-w-[160px]",
//   "Confirmation Date": "min-w-[130px] max-w-[160px]",
//   "Salary Effective Date": "min-w-[130px] max-w-[160px]",
//   "Last CTC": "min-w-[120px] max-w-[160px]",
//   "MICR Code": "min-w-[120px] max-w-[160px]",
//   "PF Applicable": "min-w-[130px] max-w-[160px]",
//   "ESI Applicable": "min-w-[130px] max-w-[160px]",
//   "Gratuity Eligible": "min-w-[130px] max-w-[160px]",

//   // Medium Fields
//   "PAN Number": "min-w-[130px] max-w-[180px]",
//   "Aadhaar No": "min-w-[140px] max-w-[180px]",
//   "Country": "min-w-[120px] max-w-[180px]",
//   "Nationality": "min-w-[120px] max-w-[180px]",
//   "Religion": "min-w-[100px] max-w-[180px]",
//   "Category": "min-w-[120px] max-w-[180px]",
//   "Marital Status": "min-w-[80px] max-w-[100px]",
//   "Relationship": "min-w-[130px] max-w-[180px]",
//   "Probation Period": "min-w-[130px] max-w-[180px]",
//   "Notice Period": "min-w-[130px] max-w-[180px]",
//   "Account Type": "min-w-[130px] max-w-[180px]",
//   "TDS Category": "min-w-[130px] max-w-[180px]",
//   "CTC": "min-w-[130px] max-w-[180px]",
//   "Basic": "min-w-[130px] max-w-[180px]",
//   "HRA": "min-w-[130px] max-w-[180px]",
//   "Special Allowance": "min-w-[130px] max-w-[180px]",

//   // Regular Text Fields (Names, Districts, etc)
//   "First Name": "min-w-[140px] max-w-[230px]",
//   "Middle Name": "min-w-[140px] max-w-[220px]",
//   "Last Name": "min-w-[140px] max-w-[220px]",
//   "Spouse Name": "min-w-[160px] max-w-[220px]",
//   "Qualification": "min-w-[150px] max-w-[220px]",
//   "Professional Qualification": "min-w-[150px] max-w-[220px]",
//   "Specialization": "min-w-[150px] max-w-[220px]",
//   "City": "min-w-[140px] max-w-[200px]",
//   "District": "min-w-[140px] max-w-[200px]",
//   "State": "min-w-[140px] max-w-[200px]",
//   "Voter ID": "min-w-[140px] max-w-[200px]",
//   "Driving Licence": "min-w-[140px] max-w-[200px]",
//   "Passport No": "min-w-[140px] max-w-[200px]",
//   "Contact Person": "min-w-[140px] max-w-[220px]",
//   "Previous Experience": "min-w-[140px] max-w-[220px]",
//   "Total Experience": "min-w-[140px] max-w-[220px]",
//   "UAN Number": "min-w-[140px] max-w-[200px]",
//   "UAN": "min-w-[140px] max-w-[200px]",
//   "IFSC Code": "min-w-[140px] max-w-[200px]",
//   "PT State": "min-w-[140px] max-w-[200px]",

//   // Large Text Fields
//   "Mother's Name": "min-w-[180px] max-w-[220px]",
//   "Father's / Guardian's Name": "min-w-[180px] max-w-[220px]",
//   "Personal Email": "flex-1 min-w-[200px] max-w-[300px]", 
//   "Work Email": "flex-1 min-w-[200px] max-w-[300px]",
//   "Department": "min-w-[160px] max-w-[260px]",
//   "Designation": "min-w-[160px] max-w-[260px]",
//   "Grade / Level": "min-w-[150px] max-w-[220px]",
//   "Branch / Location": "min-w-[160px] max-w-[260px]",
//   "Cost Centre": "min-w-[150px] max-w-[220px]",
//   "Reporting Manager": "min-w-[160px] max-w-[260px]",
//   "Employment Type": "min-w-[150px] max-w-[220px]",
//   "Work Shift": "min-w-[150px] max-w-[220px]",
//   "Work Location Type": "min-w-[150px] max-w-[220px]",
//   "Employee Category": "min-w-[150px] max-w-[220px]",
//   "Previous Company": "min-w-[180px] max-w-[300px]",
//   "Last Designation": "min-w-[160px] max-w-[260px]",
//   "Reason for Leaving": "min-w-[160px] max-w-[260px]",
//   "Bank Name": "min-w-[180px] max-w-[300px]",
//   "Branch Name": "min-w-[160px] max-w-[260px]",
//   "Account Holder Name": "min-w-[180px] max-w-[300px]",
//   "Account Number": "min-w-[150px] max-w-[240px]",
//   "PF Number": "min-w-[140px] max-w-[240px]",
//   "ESI Number": "min-w-[140px] max-w-[240px]",
//   "PF Account (Previous)": "min-w-[150px] max-w-[240px]",
// };
// const TabIcon = memo(({ tab }) => {
//   const baseClass = "text-[15px]";
//   if (tab === "personal_and_contact") return <FaRegUser className={baseClass} />;
//   if (tab === "organization") return <FaBuilding className={baseClass} />;
//   if (tab === "address") return <FaMapMarkerAlt className={baseClass} />;
//   if (tab === "bank_and_payroll") return <FaCreditCard className={baseClass} />;
//   if (tab === "documents") return <FaFileAlt className={baseClass} />;
//   return <FaFileAlt className={baseClass} />;
// });

// const getInitials = (name) => {
//   if (!name || name === "New Employee") return "NA";
//   const parts = name.trim().split(" ");
//   if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
//   return name.substring(0, 2).toUpperCase();
// };

// const getHeaderStyle = (title) => {
//   const t = title.toLowerCase();
  
//   if (t.includes("personal")) return { icon: <FaUser />, barBg: "bg-[#e8f0fe]", iconBg: "bg-[#1a56db]/15 text-[#1a56db]", text: "text-[#0f2137]", border: "border-[#c2d1f7]" };
//   if (t.includes("contact") && !t.includes("emergency")) return { icon: <FaPhoneAlt />, barBg: "bg-[#e6f7f4]", iconBg: "bg-[#0d9488]/15 text-[#0d9488]", text: "text-[#0f2137]", border: "border-[#b2e3da]" };
//   if (t.includes("kyc")) return { icon: <FaIdCard />, barBg: "bg-[#f3e8ff]", iconBg: "bg-[#7c3aed]/15 text-[#7c3aed]", text: "text-[#0f2137]", border: "border-[#d4b8f5]" };
//   if (t.includes("emergency")) return { icon: <FaExclamationCircle />, barBg: "bg-[#fee2e2]", iconBg: "bg-[#dc2626]/15 text-[#dc2626]", text: "text-[#0f2137]", border: "border-[#fca5a5]" };
//   if (t.includes("education")) return { icon: <FaGraduationCap />, barBg: "bg-[#eef2ff]", iconBg: "bg-[#6366f1]/15 text-[#6366f1]", text: "text-[#0f2137]", border: "border-[#c7d2fe]" };
//   if (t.includes("family")) return { icon: <FaUsers />, barBg: "bg-[#fdf2f8]", iconBg: "bg-[#ec4899]/15 text-[#ec4899]", text: "text-[#0f2137]", border: "border-[#fbcfe8]" };
//   if (t.includes("correspondence") || (t.includes("address") && !t.includes("permanent"))) return { icon: <FaMapMarkerAlt />, barBg: "bg-[#fff7ed]", iconBg: "bg-[#f97316]/15 text-[#f97316]", text: "text-[#0f2137]", border: "border-[#ffedd5]" };
//   if (t.includes("permanent")) return { icon: <FaHome />, barBg: "bg-[#fefce8]", iconBg: "bg-[#eab308]/20 text-[#d97706]", text: "text-[#0f2137]", border: "border-[#fef08a]" };
//   if (t.includes("bank")) return { icon: <FaCreditCard />, barBg: "bg-[#e0f2fe]", iconBg: "bg-[#0284c7]/15 text-[#0284c7]", text: "text-[#0f2137]", border: "border-[#7dd3fc]" };

//   if (t.includes("employment")) return { icon: <FaBuilding />, barBg: "bg-[#eff6ff]", iconBg: "bg-[#2563eb]/15 text-[#2563eb]", text: "text-[#0f2137]", border: "border-[#bfdbfe]" };
//   if (t.includes("joining") || t.includes("tenure")) return { icon: <FaCalendarAlt />, barBg: "bg-[#f0fdf4]", iconBg: "bg-[#22c55e]/20 text-[#16a34a]", text: "text-[#0f2137]", border: "border-[#bbf7d0]" };
//   if (t.includes("statutory") || t.includes("pf")) return { icon: <FaShieldAlt />, barBg: "bg-[#faf5ff]", iconBg: "bg-[#a855f7]/15 text-[#9333ea]", text: "text-[#0f2137]", border: "border-[#e9d5ff]" };
//   if (t.includes("salary")) return { icon: <FaMoneyBillWave />, barBg: "bg-[#ecfdf5]", iconBg: "bg-[#10b981]/15 text-[#059669]", text: "text-[#0f2137]", border: "border-[#a7f3d0]" };
//   if (t.includes("previous employment")) return { icon: <FaCube />, barBg: "bg-[#fff1f2]", iconBg: "bg-[#f43f5e]/15 text-[#e11d48]", text: "text-[#0f2137]", border: "border-[#fecdd3]" };
  
//   return { icon: <FaFileAlt />, barBg: "bg-[#eef1f7]", iconBg: "bg-[#64748b]/15 text-[#475569]", text: "text-[#0f2137]", border: "border-[#dde1ea]" };
// };

// const EmployeeMasterForm = ({
//   formData = {}, setFormData, onSave, onCancel, onTabChange, saving, onDelete, mode, onModify, onNewEntry, currentRecord, totalRecords, onPrint, onEditCancel, rights,
// }) => {
//   const isAddMode = mode === "add";
//   const isViewMode = mode === "view";
//   const isEditMode = mode === "edit";

//   const [activeTab, setActiveTab] = useState("personal_and_contact");
//   const [errors, setErrors] = useState({});
//   const [attachments, setAttachments] = useState({});
//   const [groupOptions, setGroupOptions] = useState({ division: [], department: [], designation: [], grade: [], reporting: [] });
//   const formDataRef = useRef(formData);
  
//   useEffect(() => { formDataRef.current = formData; }, [formData]);

//   const photoInputRef = useRef(null);

//   useEffect(() => {
//     const loadGroups = async () => {
//       try {
//         const div = await fetchUserGroupsByType("DIV");
//         const dept = await fetchUserGroupsByType("DEP");
//         const desg = await fetchUserGroupsByType("DESG");
//         const grade = await fetchUserGroupsByType("GRADE");
//         const reporting = await fetchUserGroupsByType("RME");

//         setGroupOptions({
//           division: div.data || [], department: dept.data || [], designation: desg.data || [], grade: grade.data || [], reporting: reporting.data || []
//         });
//       } catch (err) {}
//     };
//     loadGroups();
//   }, []);

//   const getDisplayValue = (field, value) => {
//     if (!value) return "";
//     const groupMap = { Division: groupOptions.division, Department: groupOptions.department, Designation: groupOptions.designation, Grade: groupOptions.grade, "Reporting Manager": groupOptions.reporting };
//     const list = groupMap[field] || [];
//     const found = list.find(g => String(g.group_id) === String(value) || g.group_name === value);
//     return found ? found.group_name : value;
//   };

//   const isPersonalComplete = Boolean(formData["First Name"] && formData["Date of Birth"]); 
//   const isContactComplete = Boolean(formData["Mobile No"] && formData["Personal Email"]); 
//   const isKYCComplete = Boolean(formData["PAN Number"] || formData["Aadhaar No"]); 
//   const isOrgComplete = Boolean(formData["Department"] || formData["Designation"]); 
//   const isBankComplete = Boolean(formData["Account Number"] || formData["IFSC Code"]);
//   const isAddressComplete = Boolean(formData["C_Address Line 1"] && formData["C_City"]);

//   const completedSections = [isPersonalComplete, isContactComplete, isKYCComplete, isOrgComplete, isBankComplete, isAddressComplete].filter(Boolean).length;
//   const completionPercentage = Math.round((completedSections / 6) * 100) || 0;

//   const isTabComplete = (tabName) => {
//     if (tabName === "personal_and_contact") return isPersonalComplete || isContactComplete || isKYCComplete;
//     if (tabName === "organization") return isOrgComplete;
//     if (tabName === "address") return isAddressComplete;
//     if (tabName === "bank_and_payroll") return isBankComplete;
//     if (tabName === "documents") return Object.keys(attachments || {}).length > 0;
//     return false;
//   };

//   useEffect(() => {
//     setTimeout(() => {
//       const container = document.getElementById(`tab-content-${activeTab}`);
//       if (container) {
//         const firstEnabled = container.querySelector("input:not([disabled]), select:not([disabled])");
//         if (firstEnabled) firstEnabled.focus();
//       }
//     }, 50);
//   }, [activeTab]);

//   useEffect(() => {
//     if (isAddMode) {
//       setTimeout(() => {
//         const container = document.getElementById(`tab-content-personal_and_contact`);
//         if (container) {
//           const firstEnabled = container.querySelector("input:not([disabled]), select:not([disabled])");
//           if (firstEnabled) firstEnabled.focus();
//         }
//       }, 100);
//     }
//   }, [isAddMode]);

//   const handleChange = useCallback((field, rawValue) => {
//       if (!setFormData) return;
//       let value = rawValue;
//       const nameStr = field.toLowerCase();

//       if (nameStr.includes("mobile") || nameStr.includes("phone") || nameStr.includes("pin code")) {
//         value = value.toString().replace(/\D/g, "").slice(0, 10);
//       } else if (nameStr.includes("pan") || nameStr.includes("ifsc") || nameStr.includes("uan")) {
//         value = value.toString().toUpperCase();
//       }

//       if (["Division", "Department", "Designation", "Grade", "Reporting Manager"].includes(field)) {
//         const list = { Division: groupOptions.division, Department: groupOptions.department, Designation: groupOptions.designation, Grade: groupOptions.grade, "Reporting Manager": groupOptions.reporting }[field] || [];
//         const selected = list.find((g) => g.group_name?.trim() === rawValue?.trim());
//         value = selected ? selected.group_id : null;
//       }

//       setFormData((prev) => {
//         let updated = { ...prev, [field]: value };
        
//         if (field === "Same as Correspondence") {
//           if (value === true) {
//             updated["P_Address Line 1"] = updated["C_Address Line 1"] || "";
//             updated["P_Address Line 2"] = updated["C_Address Line 2"] || "";
//             updated["P_City"] = updated["C_City"] || "";
//             updated["P_District"] = updated["C_District"] || "";
//             updated["P_Pin Code"] = updated["C_Pin Code"] || "";
//             updated["P_State"] = updated["C_State"] || "";
//             updated["P_Country"] = updated["C_Country"] || "";
//           } else {
//             updated["P_Address Line 1"] = ""; updated["P_Address Line 2"] = ""; updated["P_City"] = ""; updated["P_District"] = ""; updated["P_Pin Code"] = ""; updated["P_State"] = ""; updated["P_Country"] = "";
//           }
//         }
        
//         if (field === "Marital Status" && value !== "Married") {
//           updated["Spouse Name"] = ""; updated["Anniversary Date"] = ""; updated["No. of Children"] = "";
//         }
        
//         return updated;
//       });

//       const err = validateSingleField(field, value);
//       if (err) setErrors((prev) => ({ ...prev, [field]: err }));
//       else setErrors((prev) => { const copy = { ...prev }; delete copy[field]; return copy; });
//     },
//     [setFormData, groupOptions]
//   );

//   const handlePhotoUpload = (e) => {
//     const file = e.target.files?.[0];
//     if (file) handleChange("photo_url", URL.createObjectURL(file));
//   };

//   const requiredFields = ["First Name", "Mobile No", "Personal Email", "Department"];

//   const getInputClass = (isDisabled) =>
//     `w-full h-[28px] px-[5px] text-[12.5px] border-[1.5px] border-[#c8d2e4] rounded-[5px] bg-[#fafbfd] outline-none transition-all font-['Segoe_UI',system-ui,Arial,sans-serif] ${
//       isDisabled ? "bg-[#f0f3f8] text-[#64748b] border-[#e2e8f4] cursor-default" : "text-[#0f172a] focus:border-[#1a56db] focus:bg-[#ffffff] focus:ring-[3px] focus:ring-[#1a56db]/10 hover:border-[#a0b0c8]"
//     }`;

//   const handleKeyDown = useCallback((e) => {
//       if (isViewMode) return;
//       if (e.key === "Enter") {
//         e.preventDefault();
//         const container = document.getElementById(`tab-content-${activeTab}`);
//         if (!container) return;
//         const focusableElements = Array.from(container.querySelectorAll("input:not([disabled]), select:not([disabled])"));
//         const index = focusableElements.indexOf(e.target);
//         if (index > -1) {
//           if (index < focusableElements.length - 1) focusableElements[index + 1].focus();
//           else {
//             const currentTabIndex = tabs.indexOf(activeTab);
//             if (currentTabIndex < tabs.length - 1) setActiveTab(tabs[currentTabIndex + 1]);
//             else {
//               const buttons = Array.from(document.querySelectorAll("button"));
//               const saveBtn = buttons.find((btn) => btn.textContent.toLowerCase().includes("save") || btn.textContent.toLowerCase().includes("update"));
//               if (saveBtn) saveBtn.focus();
//             }
//           }
//         }
//       }
//     }, [activeTab, isViewMode]
//   );

//   const renderField = (fieldObj) => {
//     const field = fieldObj.key;
//     const type = fieldObj.type || "text";
//     const isPermanentAddressField = field.startsWith("P_");
//     const isSameAsCorrespondence = !!formData["Same as Correspondence"];
//     const fieldDisabled = isViewMode || (isPermanentAddressField && isSameAsCorrespondence) || fieldObj.readOnly;

//     if (type === "date") return <ERPDateInput value={formData[field] || ""} onChange={(val) => handleChange(field, val)} className={getInputClass(fieldDisabled)} disabled={fieldDisabled} onKeyDown={handleKeyDown} />;
    
//     if (type === "select") {
//       let options = fieldObj.options || [];
//       if (field === "Division") options = groupOptions.division.map(g => g.group_name);
//       if (field === "Department") options = groupOptions.department.map(g => g.group_name);
//       if (field === "Designation") options = groupOptions.designation.map(g => g.group_name);
//       if (field === "Grade / Level") options = groupOptions.grade.map(g => g.group_name);
//       if (field === "Reporting Manager") options = groupOptions.reporting.map(g => g.group_name);

//       return <ERPAutocomplete options={options} value={getDisplayValue(field, formData[field])} disabled={fieldDisabled} onChange={(val) => handleChange(field, val)} className={getInputClass(fieldDisabled)} />;
//     }

//     if (type === "leave-selector") return <LeaveTypeSelector value={formData["Leave allow"] || []} onChange={(selectedIds, selectedNames) => { setFormData(prev => ({ ...prev, "Leave allow": selectedIds, "Leave allow names": selectedNames })); }} disabled={isViewMode} />;
    
//     if (type === "checkbox") {
//       return (
//         <div className="flex items-center h-[32px] w-full px-1">
//           <input type="checkbox" className="w-[16px] h-[16px] cursor-pointer accent-[#1a56db] rounded-[3px]" checked={!!formData[field]} disabled={isViewMode} onChange={(e) => handleChange(field, e.target.checked)} onKeyDown={handleKeyDown} />
//         </div>
//       );
//     }

//     return <input className={getInputClass(fieldDisabled)} value={formData[field] || ""} disabled={fieldDisabled} onChange={(e) => handleChange(field, e.target.value)} onKeyDown={handleKeyDown} style={{ whiteSpace: "nowrap" }} />;
//   };

//   const handleSave = useCallback(() => {
//     const { isValid, errors, firstErrorTab } = validateEmployeeForm(formDataRef.current, fieldGroups);
//     if (!isValid) { setErrors(errors); setActiveTab(firstErrorTab); return; }
//     onSave(formDataRef.current);
//   }, [onSave]);

//   const employeeName = formData["First Name"] ? `${formData["First Name"]} ${formData["Last Name"] || ""}` : formData.employee_name || "New Employee";

//   const renderCard = ([title, fields], isLast) => {
//     const headerStyle = getHeaderStyle(title);
//     return (
//       <div 
//         key={title} 
//         className={`bg-white w-full flex flex-col border border-[#dde1ea] rounded-[6px] shadow-sm shrink-0 ${isLast ? 'flex-1' : ''}`}
//       >
//         <div className={`px-[14px] py-[7px] shrink-0 flex items-center justify-between border-b ${headerStyle.border} ${headerStyle.barBg} rounded-t-[5px]`}>
//           <div className="flex items-center gap-2.5">
//             <div className={`w-[18px] h-[18px] rounded-[3px] flex items-center justify-center text-[11px] shadow-sm ${headerStyle.iconBg}`}>
//               {headerStyle.icon}
//             </div>
//             <h3 className={`text-[11.5px] font-bold uppercase tracking-[0.4px] ${headerStyle.text}`}>
//               {title}
//             </h3>
//           </div>

//           {title === "Correspondence Address" && (
//             <div className="flex items-center gap-1.5 bg-white/60 px-2.5 py-[3px] rounded border border-[#fef08a] hover:bg-white transition-colors cursor-pointer" onClick={() => !isViewMode && handleChange("Same as Correspondence", !formData["Same as Correspondence"])}>
//               <input 
//                 type="checkbox" 
//                 id="sameAsCorr"
//                 className="w-[12px] h-[12px] cursor-pointer accent-[#d97706]" 
//                 checked={!!formData["Same as Correspondence"]} 
//                 disabled={isViewMode} 
//                 onChange={(e) => handleChange("Same as Correspondence", e.target.checked)}
//                 onClick={(e) => e.stopPropagation()} 
//               />
//               <label htmlFor="sameAsCorr" className="text-[10px] font-bold text-[#d97706] uppercase tracking-[0.3px] cursor-pointer select-none">
//                 Same In Permanent
//               </label>
//             </div>
//           )}
//         </div>

//         <div className="p-[12px] flex flex-wrap gap-x-[12px] gap-y-[9px] content-start items-start flex-1 overflow-visible">
//           {(fields || []).map((fieldObj, index) => {
//             if (fieldObj.showIf && !fieldObj.showIf(formData)) return null;

//             if (fieldObj.type === "section-divider") {
//               const getDividerIcon = (label) => {
//                 const l = label.toLowerCase();
//                 if (l.includes("education")) return <FaGraduationCap className="text-[14px]" />;
//                 if (l.includes("family")) return <FaUsers className="text-[14px]" />;
//                 return <FaFileAlt className="text-[14px]" />;
//               };
//               return (
//                 <div key={`${fieldObj.label}-${index}`} className="w-full basis-full mt-3 mb-1 flex items-center gap-2.5">
//                   <div className="flex items-center gap-1.5 text-[#64748b]">
//                     {getDividerIcon(fieldObj.label)}
//                     <span className="text-[11px] font-bold uppercase tracking-[0.5px]">{fieldObj.label}</span>
//                   </div>
//                   <div className="flex-1 h-px bg-[#dde1ea]"></div>
//                 </div>
//               );
//             }

//             const fieldKey = fieldObj.key;
//             const label = fieldObj.label;
//             const nameStr = label.toLowerCase();

//             const isFullWidth = nameStr.includes("employee name") || nameStr.includes("address") || nameStr.includes("remarks");
//             const customInputWidth = widthConfig[label];

//             let fieldClass = "flex flex-col gap-[3px] flex-1 ";
            
//             if (isFullWidth) {
//               fieldClass += "w-full min-w-full";
//             } else if (customInputWidth) {
//               fieldClass += customInputWidth;
//             } else {
//               fieldClass += "min-w-[130px]"; 
//             }

//             return (
//               <React.Fragment key={fieldKey}>
//                 <div className={fieldClass}>
//                   <label className="text-[#1e293b] font-semibold text-[11px] tracking-[0.1px] flex items-center mb-[2px]">
//                     {label}
//                     {requiredFields.includes(fieldKey) && <span className="text-[#dc2626] ml-[2px] text-[12px] leading-none">*</span>}
//                   </label>

//                   <div className="w-full relative">
//                     {renderField(fieldObj)}
//                     {errors[fieldKey] && (
//                       <div className="absolute left-0 top-[100%] z-50 mt-[2px]">
//                         <div className="bg-[#dc2626] text-white text-[10px] px-1.5 py-[2px] rounded-[3px] shadow whitespace-nowrap font-medium">
//                           {errors[fieldKey]}
//                         </div>
//                       </div>
//                     )}
//                   </div>
//                 </div>
                
//                 {title === "Personal Information" && fieldKey === "Last Name" && (
//                   <div className="w-full h-0 m-0 p-0 basis-full"></div>
//                 )}
//               </React.Fragment>
//             );
//           })}
//         </div>
//       </div>
//     );
//   };

//   return (
//     <div className="w-full h-full sm:h-[calc(100vh-120px)] bg-[#eef1f8] flex flex-col overflow-hidden font-['Segoe_UI',system-ui,Arial,sans-serif] text-[13px] text-[#0f172a] leading-[1.4]">
      
//       <ERPHeader title="EMPLOYEE MASTER" isAddMode={isAddMode} isEditMode={isEditMode} isViewMode={isViewMode} rightContent={`${currentRecord || 1}/${totalRecords || 1}`} activeTab="entry" onTabChange={onTabChange} />

//       <div className="flex flex-1 min-h-0 flex-col md:flex-row w-full h-full md:h-[calc(100vh-120px)] overflow-hidden">
        
//         {/* SIDEBAR */}
//         <div className="w-full md:w-[220px] bg-white border-r border-[#dde1ea] flex flex-col overflow-y-auto overflow-x-hidden shrink-0 scrollbar-hide z-10">
//           <div className="bg-[#f8fafc] border-b border-[#dde1ea] py-[18px] px-3 flex flex-col items-center">
//             <div className="relative z-10 cursor-pointer w-[88px] h-[88px] rounded-full bg-[#dde3ef] border-[3px] border-[#dde1ea] flex items-center justify-center overflow-hidden" onClick={() => photoInputRef.current?.click()}>
//               {formData.photo_url ? (
//                 <img src={formData.photo_url} className="w-full h-full object-cover" alt="profile" />
//               ) : (
//                 <span className="text-[28px] font-bold text-[#8a9ab5] tracking-wider">{getInitials(employeeName)}</span>
//               )}
//             </div>
//             <input type="file" className="hidden" ref={photoInputRef} onChange={handlePhotoUpload} />

//             <h2 className="text-[15px] font-bold text-[#0f2137] text-center mt-2.5 truncate w-full px-1">{employeeName}</h2>
//             <h4 className="text-[10.5px] font-semibold text-[#718096] text-center mt-0.5 tracking-[0.4px] truncate w-full">EMP ID : {formData["Employee ID"] || formData.employee_code || "—"}</h4>

//             <button onClick={() => photoInputRef.current?.click()} className="mt-2.5 flex items-center justify-center gap-1.5 px-3.5 py-[5px] rounded border-none bg-[#1a56db] hover:bg-[#1647c0] text-white text-[11px] font-semibold transition-colors w-max">
//               <FaCloudUploadAlt className="text-[13px]" /> Upload Photo
//             </button>
//           </div>

//           <div className="p-3 flex flex-col flex-1 bg-white">
//             <div className="mb-4">
//               <div className="flex justify-between items-center mb-1">
//                 <h3 className="text-[12px] font-bold text-[#374151]">Completion</h3>
//                 <span className="text-[13px] font-bold text-[#059669]">{completionPercentage}%</span>
//               </div>
//               <div className="w-full bg-[#eef1f7] rounded-full h-1.5 mb-2 overflow-hidden">
//                 <div className="bg-[#059669] h-1.5 rounded-full transition-all" style={{ width: `${completionPercentage}%` }}></div>
//               </div>
//             </div>

//             <hr className="border-[#dde1ea] mb-3" />

//             <div>
//               <h3 className="text-[10px] font-bold tracking-[0.6px] text-[#94aabf] uppercase mb-2">Quick Info</h3>
//               <div className="space-y-1.5">
//                 <div className="flex justify-between items-center border-b border-[#f0f2f7] pb-1">
//                   <span className="flex items-center gap-1.5 text-[#718096] text-[11px]"><FaCalendarAlt className="text-[9px]" /> Joining</span>
//                   <span className="text-[#1a202c] font-bold text-[11px]">{formData["Joining Date"] || "—"}</span>
//                 </div>
//                 <div className="flex justify-between items-center border-b border-[#f0f2f7] pb-1">
//                   <span className="flex items-center gap-1.5 text-[#718096] text-[11px]"><FaUserTie className="text-[9px]" /> Reports</span>
//                   <span className="text-[#1a202c] font-bold text-[11px] truncate max-w-[100px]" title={getDisplayValue("Reporting Manager", formData["Reporting Manager"])}>
//                     {getDisplayValue("Reporting Manager", formData["Reporting Manager"])}
//                   </span>
//                 </div>
//                 <div className="flex justify-between items-center border-b border-[#f0f2f7] pb-1">
//                   <span className="flex items-center gap-1.5 text-[#718096] text-[11px]"><FaPhoneAlt className="text-[9px]" /> Mobile</span>
//                   <span className="text-[#1a202c] font-bold text-[11px]">{formData["Mobile No"] || "—"}</span>
//                 </div>
//                 <div className="flex justify-between items-center pb-0.5">
//                   <span className="flex items-center gap-1.5 text-[#718096] text-[11px]"><FaIdCard className="text-[9px]" /> PAN</span>
//                   <span className="text-[#1a202c] font-bold text-[11px] uppercase">{formData["PAN Number"] || formData["PAN"] || "—"}</span>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* ===================== MAIN CONTENT AREA ===================== */}
//         <div className="flex-1 flex flex-col min-h-0 bg-[#eef1f8]">
          
//           <div className="flex items-end gap-0 px-[16px] bg-white border-b-2 border-[#e1e7f2] shrink-0">
//             {tabs.map((tab) => {
//               const isActive = activeTab === tab;
//               const isCompleted = isTabComplete(tab);
              
//               const tabNameMap = { 
//                 personal_and_contact: "Personal & Contact", 
//                 organization: "Organization", 
//                 address: "Address",
//                 bank_and_payroll: "Bank & Payroll",
//                 documents: "Documents" 
//               };
//               const displayName = tabNameMap[tab] || tab;

//               return (
//                 <button
//                   key={tab}
//                   onClick={() => setActiveTab(tab)}
//                   className={`flex items-center gap-[6px] px-[16px] pt-[10px] pb-[9px] text-[12px] font-semibold cursor-pointer border-b-2 mb-[-2px] transition-all duration-150 whitespace-nowrap outline-none ${
//                     isActive 
//                       ? "text-[#1a56db] border-[#1a56db]" 
//                       : "text-[#64748b] border-transparent hover:text-[#334155] hover:border-[#c4cfe4]"
//                   }`}
//                 >
//                   <div className={`w-[20px] h-[20px] rounded-[5px] flex items-center justify-center ${
//                     isActive ? "bg-[#eef3fd]" : "bg-transparent"
//                   }`}>
//                     <TabIcon tab={tab} />
//                   </div>
                  
//                   <span>{displayName}</span>
                  
//                   {isCompleted && (
//                     <div className="w-[16px] h-[16px] rounded-[8px] bg-[#059669] text-white text-[9px] font-bold flex items-center justify-center ml-1">
//                       ✓
//                     </div>
//                   )}
//                 </button>
//               );
//             })}
//           </div>

//           <div id={`tab-content-${activeTab}`} className="flex-1 p-[14px] overflow-y-auto overflow-x-hidden min-h-0 flex flex-col">
//             {activeTab === "documents" ? (
//               <DocumentTable attachments={attachments} setAttachments={setAttachments} isViewMode={isViewMode} />
//             ) : (
//               (() => {
//                 const entries = Object.entries(fieldGroups[activeTab] || {});
//                 const leftCol = [];
//                 const rightCol = [];

//                 // WAPAS PURANA LOGIC ADD KIYA GAYA HAI TAAKI NORMAL SCREEN PAR 2 COLUMNS BANE
//                 entries.forEach(([title, fields], index) => {
//                   if (activeTab === "personal_and_contact") {
//                     if (title === "Personal Information"|| title === "Previous Employment") {
//                       leftCol.push([title, fields]);
//                     } else {
//                       rightCol.push([title, fields]);
//                     }
//                   } else if (activeTab === "organization") {
//                     if (title === "Employment Details") {
//                       leftCol.push([title, fields]);
//                     } else {
//                       rightCol.push([title, fields]);
//                     }
//                   }
//                   else {
//                     if (index % 2 === 0) leftCol.push([title, fields]);
//                     else rightCol.push([title, fields]);
//                   }
//                 });

//                 return (
//                   // ================= MAIN RESPONSIVE CHANGE YAHAN HAI =================
//                   // xl:flex-row -> Normal desktop par 2 columns banayega
//                   // 2xl:flex-col 2xl:max-w-[60%] -> Bade screen par vertical stack karke sirf left mein rakhega
//                   <div className="flex flex-col xl:flex-row 2xl:flex-col gap-[12px] 2xl:m-auto flex-1 items-stretch 2xl:max-w-[60%]">
                    
//                     {/* LEFT COLUMN */}
//                     <div className="flex-1 flex flex-col gap-[12px] min-w-0">
//                       {leftCol.map((entry, index) => renderCard(entry, index === leftCol.length - 1))}
//                     </div>

//                     {/* RIGHT COLUMN */}
//                     {rightCol.length > 0 && (
//                       <div className="flex-1 flex flex-col gap-[12px] min-w-0">
//                         {rightCol.map((entry, index) => renderCard(entry, index === rightCol.length - 1))}
//                       </div>
//                     )}

//                   </div>
//                   // ===================================================================
//                 );
//               })()
//             )}
//           </div>
//         </div>
//       </div>

//       <ERPFooter
//         isAddMode={isAddMode} isViewMode={isViewMode} isEditMode={isEditMode} saving={saving}
//         handleSubmit={handleSave} onModify={onModify} onDelete={() => onDelete && onDelete(formData)}
//         onCancel={onCancel} onNewEntry={onNewEntry} onPrint={onPrint} onEditCancel={onEditCancel} rights={rights}
//       />
//     </div>
//   );
// };

// export default EmployeeMasterForm;

// // ======================= FINAL FIELD GROUPS =======================
// export const fieldGroups = {
//   personal_and_contact: {
//     "Personal Information": [
//       { key: "Employee ID", label: "Employee ID", type: "text", readOnly: true },
//       { key: "Title", label: "Title", type: "select", options: ["Mr", "Mrs", "Ms", "Dr", "Er"] },
      
//       { key: "First Name", label: "First Name", type: "text" },
//       { key: "Middle Name", label: "Middle Name", type: "text" },
//       { key: "Last Name", label: "Last Name", type: "text" },
      
//       { key: "Gender", label: "Gender", type: "select", options: ["Male", "Female", "Other"] },
//       { key: "Date of Birth", label: "Date of Birth", type: "date" },
//       { key: "Blood Group", label: "Blood Group", type: "select", options: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"] },
//       { key: "Nationality", label: "Nationality", type: "select", options: ["Indian", "Other"] },
//       { key: "Religion", label: "Religion", type: "select", options: ["Hindu", "Muslim", "Christian", "Sikh", "Jain", "Buddhist", "Other"] },
//       { key: "Category", label: "Category", type: "select", options: ["General", "OBC", "SC", "ST"] },
      
//       { key: "Marital Status", label: "Marital Status", type: "select", options: ["Single", "Married", "Divorced", "Widowed"] },
//       { key: "Spouse Name", label: "Spouse Name", type: "text", showIf: (data) => data["Marital Status"] === "Married" },
//       { key: "Anniversary Date", label: "Anniversary Date", type: "date", showIf: (data) => data["Marital Status"] === "Married" },
//       { key: "No. of Children", label: "No. of Children", type: "select", options: ["0", "1", "2", "3", "4+"], showIf: (data) => data["Marital Status"] === "Married" },

//       { type: "section-divider", label: "FAMILY DETAILS" },
//       { key: "Mother's Name", label: "Mother's Name", type: "text" },
//       { key: "Father's / Guardian's Name", label: "Father's / Guardian's Name", type: "text" },
      
//       { type: "section-divider", label: "EDUCATIONAL DETAILS" },
//       { key: "Qualification", label: "Qualification", type: "select", options: ["Below 10th", "10th Pass", "12th Pass", "Graduate", "Post Graduate", "Doctorate"] },
//       { key: "Professional Qualification", label: "Professional Qualification", type: "text" },
//       { key: "Specialization", label: "Specialization", type: "text" }
//     ],
//     "Contact Details": [
//       { key: "Mobile No", label: "Mobile No", type: "tel" },
//       { key: "Alternate Mobile", label: "Alternate Mobile", type: "tel" },
//       { key: "Personal Email", label: "Personal Email", type: "email" },
//       { key: "Work Email", label: "Work Email", type: "email" },
//       { key: "Phone (Residence)", label: "Phone (Residence)", type: "tel" },
//       { key: "Phone Extension", label: "Phone Extension", type: "tel" }
//     ],
//     "KYC Details": [
//       { key: "PAN Number", label: "PAN Number", type: "text" },
//       { key: "Aadhaar No", label: "Aadhaar No", type: "text" },
//       { key: "Voter ID", label: "Voter ID", type: "text" },
//       { key: "Driving Licence", label: "Driving Licence", type: "text" },
//       { key: "Passport No", label: "Passport No", type: "text" },
//       { key: "Passport Expiry", label: "Passport Expiry", type: "date" }
//     ],
//     "Emergency Contact": [
//       { key: "Emerg_Contact Person", label: "Contact Person", type: "text" },
//       { key: "Emerg_Relationship", label: "Relationship", type: "select", options: ["Brother", "Sister", "Father", "Mother", "Spouse", "Friend", "Other"] },
//       { key: "Emerg_Mobile No", label: "Mobile No", type: "tel" },
//       { key: "Emerg_Alternate No", label: "Alternate No", type: "tel" }
//     ]
//   },
//   organization: {
//     "Employment Details": [
//       { key: "Department", label: "Department", type: "select", options: ["Information Technology", "Finance & Accounts", "Human Resources", "Operations", "Sales & Marketing", "Production", "Purchase", "Quality"] },
//       { key: "Designation", label: "Designation", type: "select", options: ["Software Engineer", "Senior Engineer", "Team Lead", "Manager", "Senior Manager", "Deputy Manager", "Director"] },
//       { key: "Grade / Level", label: "Grade / Level", type: "select", options: ["L1 — Junior", "L2 — Mid", "L3 — Senior", "L4 — Lead", "L5 — Principal"] },
//       { key: "Branch / Location", label: "Branch / Location", type: "select", options: ["Noida — Head Office", "Mumbai", "Delhi", "Pune", "Bangalore"] },
//       { key: "Cost Centre", label: "Cost Centre", type: "text" },
//       { key: "Reporting Manager", label: "Reporting Manager", type: "text" },
//       { key: "Employment Type", label: "Employment Type", type: "select", options: ["Full Time", "Part Time", "Contract", "Consultant", "Intern"] },
//       { key: "Work Shift", label: "Work Shift", type: "select", options: ["General (9-6)", "Morning", "Evening", "Night", "Flexible"] },
//       { key: "Work Location Type", label: "Work Location Type", type: "select", options: ["Office", "Work From Home", "Hybrid", "Field"] },
//       { key: "Employee Category", label: "Employee Category", type: "select", options: ["Permanent", "Probation", "Trainee", "Contractual"] }
//     ],
//     "Joining & Tenure": [
//       { key: "Joining Date", label: "Joining Date", type: "date" },
//       { key: "Confirmation Date", label: "Confirmation Date", type: "date" },
//       { key: "Probation Period", label: "Probation Period", type: "select", options: ["3 Months", "6 Months", "1 Year", "NA"] },
//       { key: "Notice Period", label: "Notice Period", type: "select", options: ["30 Days", "60 Days", "90 Days", "NA"] },
//       { key: "Previous Experience", label: "Previous Experience", type: "text" },
//       { key: "Total Experience", label: "Total Experience", type: "text", readOnly: true }
//     ],
//     "Previous Employment": [
//       { key: "Previous Company", label: "Previous Company", type: "text" },
//       { key: "Last Designation", label: "Last Designation", type: "text" },
//       { key: "Last CTC", label: "Last CTC (₹ LPA)", type: "text" },
//       { key: "Reason for Leaving", label: "Reason for Leaving", type: "select", options: ["Better Opportunity", "Higher Studies", "Personal", "Relocation", "Layoff"] },
//       { key: "PF Account (Previous)", label: "PF Account (Previous)", type: "text" },
//       { key: "UAN Number", label: "UAN Number", type: "text" }
//     ]
//   },
//   address: {
//     "Correspondence Address": [
//       { key: "C_Address Line 1", label: "Address Line 1", type: "text" },
//       { key: "C_Address Line 2", label: "Address Line 2", type: "text" },
//       { key: "C_City", label: "City", type: "text" },
//       { key: "C_District", label: "District", type: "text" },
//       { key: "C_Pin Code", label: "Pin Code", type: "text" },
//       { key: "C_State", label: "State", type: "select", options: ["gorakhpur", "Maharashtra", "Delhi", "Gujarat", "Uttar Pradesh", "Karnataka", "Tamil Nadu", "Rajasthan", "Madhya Pradesh"] },
//       { key: "C_Country", label: "Country", type: "select", options: ["India", "Other"] }
//     ],
//     "Permanent Address": [
//       { key: "P_Address Line 1", label: "Address Line 1", type: "text" },
//       { key: "P_Address Line 2", label: "Address Line 2", type: "text" },
//       { key: "P_City", label: "City", type: "text" },
//       { key: "P_District", label: "District", type: "text" },
//       { key: "P_Pin Code", label: "Pin Code", type: "text" },
//       { key: "P_State", label: "State", type: "select", options: ["MH", "Maharashtra", "Delhi", "Uttar Pradesh"] },
//       { key: "P_Country", label: "Country", type: "select", options: ["India", "Other"] }
//     ]
//   },
//   bank_and_payroll: {
//     "Bank Details": [
//       { key: "Bank Name", label: "Bank Name", type: "text" },
//       { key: "IFSC Code", label: "IFSC Code", type: "text" },
//       { key: "Account Number", label: "Account Number", type: "text" },
//       { key: "Account Type", label: "Account Type", type: "select", options: ["Savings", "Current", "Salary"] },
//       { key: "Account Holder Name", label: "Account Holder Name", type: "text" },
//       { key: "Branch Name", label: "Branch Name", type: "text" },
//       { key: "MICR Code", label: "MICR Code", type: "text" }
//     ],
//     "Statutory Details": [
//       { key: "PF Number", label: "PF Number", type: "text" },
//       { key: "UAN", label: "UAN", type: "text" },
//       { key: "ESI Number", label: "ESI Number", type: "text" },
//       { key: "PT State", label: "PT State", type: "select", options: ["Maharashtra", "Karnataka", "Andhra Pradesh", "Telangana", "Gujarat"] },
//       { key: "PF Applicable", label: "PF Applicable", type: "select", options: ["Yes", "No"] },
//       { key: "ESI Applicable", label: "ESI Applicable", type: "select", options: ["Yes", "No"] },
//       { key: "Gratuity Eligible", label: "Gratuity Eligible", type: "select", options: ["Yes", "No"] },
//       { key: "TDS Category", label: "TDS Category", type: "select", options: ["Salaried", "Non-Salaried", "Exempt"] }
//     ],
//     "Salary Details": [
//       { key: "CTC", label: "CTC (₹ per annum)", type: "text" },
//       { key: "Basic", label: "Basic (₹ per month)", type: "text" },
//       { key: "HRA", label: "HRA (₹ per month)", type: "text" },
//       { key: "Special Allowance", label: "Special Allowance", type: "text" },
//       { key: "Salary Effective Date", label: "Salary Effective Date", type: "date" }
//     ]
//   },
//   documents: {
//     "Document Repository": [
//       { key: "Aadhaar Card", label: "Aadhaar Card Upload", type: "file" },
//       { key: "PAN Card", label: "PAN Card Upload", type: "file" },
//       { key: "Offer Letter", label: "Offer Letter Upload", type: "file" }
//     ]
//   }
// };