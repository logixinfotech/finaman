// // import React, { useState, useEffect } from "react";
// // import { FaPaperclip, FaEye, FaTrash, FaPlus } from "react-icons/fa";

// // const DocumentTable = ({ attachments, setAttachments, isViewMode }) => {
// //   const [previewFile, setPreviewFile] = useState(null);
// //   const [previewUrl, setPreviewUrl] = useState(null);
  
// //   const [activePreviewIdx, setActivePreviewIdx] = useState(null);
  
// //   const [customDocName, setCustomDocName] = useState("");
// //   const [customDocs, setCustomDocs] = useState([]);

// //   useEffect(() => {
// //     if (!isViewMode) {
// //       setTimeout(() => {
// //         const customInput = document.getElementById("custom-doc-input");
// //         if (customInput) {
// //           customInput.focus();
// //         } else {
// //           const firstAttachBtn = document.getElementById("attach-0");
// //           if (firstAttachBtn) firstAttachBtn.focus();
// //         }
// //       }, 100); 
// //     }
// //   }, [isViewMode]);

// //   useEffect(() => {
// //     if (previewFile) {
// //       const url = URL.createObjectURL(previewFile);
// //       setPreviewUrl(url);
// //       return () => URL.revokeObjectURL(url);
// //     } else {
// //       setPreviewUrl(null);
// //     }
// //   }, [previewFile]);

// //   const handleFileAttach = (docName, file) => {
// //     if (file) {
// //       setAttachments((prev) => ({ ...prev, [docName]: file }));
// //     }
// //   };

// //   const handleFileRemove = (docName, globalIdx) => {
// //     setAttachments((prev) => {
// //       const updated = { ...prev };
// //       delete updated[docName];
// //       return updated;
// //     });

// //     setTimeout(() => {
// //       document.getElementById(`attach-${globalIdx}`)?.focus();
// //     }, 0);
// //   };

// //   const handleView = (file, globalIdx) => {
// //     if (file) {
// //       setPreviewFile(file);
// //       setActivePreviewIdx(globalIdx);
// //     }
// //   };

// //   const closePreview = () => {
// //     setPreviewFile(null);
// //     if (activePreviewIdx !== null) {
// //       setTimeout(() => {
// //         document.getElementById(`view-${activePreviewIdx}`)?.focus();
// //       }, 50);
// //     }
// //   };

// //   const handleAddCustomDoc = () => {
// //     const docName = customDocName.trim();
// //     if (docName && !customDocs.includes(docName)) {
// //       setCustomDocs([...customDocs, docName]);
// //       setCustomDocName(""); 
// //     }
// //   };

// //   const baseDocumentCategories = {
// //     "Identity Documents": [
// //       "Aadhaar Card",
// //       "PAN Card",
// //       "Voter ID",
// //       "Passport",
// //       "Driving License",
// //     ],
// //     "Educational Documents": [
// //       "10th / 12th Marksheets",
// //       "Diploma / Degree Certificates",
// //       "Post-Graduation Certificates",
// //       "Professional Certificates",
// //       "Skill Certifications",
// //     ],
// //     "Employment Documents": [
// //       "Previous Employment Letters",
// //       "Relieving Letter",
// //       "Experience Certificate",
// //       "Salary Slips (Last 3 months)",
// //       "Offer Letter",
// //       "Appointment Letter",
// //       "Joining Report",
// //     ],
// //     "Financial / Other": ["PF/ESI Number", "Bank Passbook", "Rent Agreement"],
// //   };

// //   const documentCategories = { ...baseDocumentCategories };
// //   if (customDocs.length > 0) {
// //     documentCategories["Custom Added Documents"] = customDocs;
// //   }

// //   const flatDocs = Object.values(documentCategories).flat();

// //   const handleAttachKeyDown = (e, globalIdx) => {
// //     if (isViewMode) return;

// //     if (e.key === " ") {
// //       e.preventDefault();
// //       document.getElementById(`file-input-${globalIdx}`)?.click();
// //     } else if (e.key === "Enter") {
// //       e.preventDefault();
// //       const nextEl = document.getElementById(`attach-${globalIdx + 1}`);
      
// //       if (nextEl) {
// //         nextEl.focus();
// //       } else {
// //         const allButtons = Array.from(document.querySelectorAll("button"));
// //         const salaryTabBtn = allButtons.find(
// //           (btn) => btn.textContent.toLowerCase().trim() === "salary"
// //         );
        
// //         if (salaryTabBtn) {
// //           salaryTabBtn.click(); 
// //         } else {
// //           const saveBtn = allButtons.find(
// //             (btn) => btn.textContent.toLowerCase().includes("save")
// //           );
// //           if (saveBtn) saveBtn.focus();
// //         }
// //       }
// //     } else if (e.key === "ArrowRight") {
// //       e.preventDefault();
// //       const viewBtn = document.getElementById(`view-${globalIdx}`);
// //       const delBtn = document.getElementById(`delete-${globalIdx}`);
// //       if (viewBtn && !viewBtn.disabled) viewBtn.focus();
// //       else if (delBtn && !delBtn.disabled) delBtn.focus();
// //     }
// //   };

// //   const handleViewKeyDown = (e, globalIdx) => {
// //     if (e.key === "ArrowLeft") {
// //       e.preventDefault();
// //       document.getElementById(`attach-${globalIdx}`)?.focus();
// //     } else if (e.key === "ArrowRight") {
// //       e.preventDefault();
// //       const delBtn = document.getElementById(`delete-${globalIdx}`);
// //       if (delBtn && !delBtn.disabled) delBtn.focus();
// //     }
// //   };

// //   const handleDeleteKeyDown = (e, globalIdx) => {
// //     if (e.key === "ArrowLeft") {
// //       e.preventDefault();
// //       const viewBtn = document.getElementById(`view-${globalIdx}`);
// //       if (viewBtn && !viewBtn.disabled) viewBtn.focus();
// //       else document.getElementById(`attach-${globalIdx}`)?.focus();
// //     }
// //   };

// //   return (
// //     <div className="w-full flex flex-col h-full">
      
    

// //       <div className="columns-1 xl:columns-2 gap-4">
// //         {Object.entries(documentCategories).map(([category, docs]) => (
// //           <div
// //             key={category}
// //             className="mb-4 break-inside-avoid border border-slate-200 rounded shadow-sm inline-block w-full align-top bg-white"
// //           >
// //             <div className={`text-[13px] font-bold px-3 py-1.5 border-b ${category === "Custom Added Documents" ? "bg-indigo-50/80 text-indigo-700" : "bg-slate-50/80 text-slate-700"}`}>
// //               {category}
// //             </div>

// //             <div className="p-3 flex flex-col gap-y-2">
// //               {docs.map((doc, idx) => {
// //                 const file = attachments[doc];
// //                 const globalIdx = flatDocs.indexOf(doc);

// //                 return (
// //                   <div
// //                     key={doc}
// //                     className="flex items-center justify-between text-[16px] w-full border-b border-slate-100 pb-1.5 hover:bg-slate-50 transition-colors"
// //                   >
// //                     <div className="flex items-center gap-2 min-w-0 pr-2">
// //                       <span className="text-slate-500 w-[18px] text-right text-[12px]">
// //                         {idx + 1}.
// //                       </span>
// //                       <span className="text-black-800 text-[12px] font-semibold truncate" title={doc}>
// //                         {doc}
// //                       </span>
// //                     </div>

// //                     <div className="flex items-center gap-2 flex-shrink-0">
// //                       <span className="text-[10px] text-slate-500 truncate max-w-[90px] xl:max-w-[120px]" title={file ? file.name : ""}>
// //                         {file ? file.name : ""}
// //                       </span>

// //                       <label
// //                         id={`attach-${globalIdx}`}
// //                         tabIndex={isViewMode ? -1 : 0}
// //                         onKeyDown={(e) => handleAttachKeyDown(e, globalIdx)}
// //                         className={`inline-flex items-center justify-center w-7 h-7 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
// //                           !isViewMode
// //                             ? file 
// //                               ? "bg-green-50 text-green-600 border border-green-200 hover:bg-green-600 hover:text-white cursor-pointer" 
// //                               : "bg-indigo-50 text-indigo-500 border border-indigo-200 hover:bg-indigo-500 hover:text-white cursor-pointer"
// //                             : "bg-slate-100 text-slate-400 cursor-not-allowed"
// //                         }`}
// //                       >
// //                         <FaPaperclip size={12} />
// //                         <input
// //                           id={`file-input-${globalIdx}`}
// //                           type="file"
// //                           className="hidden"
// //                           disabled={isViewMode}
// //                           onChange={(e) => {
// //                             handleFileAttach(doc, e.target.files[0]);
// //                             e.target.value = null; 
// //                             document.getElementById(`attach-${globalIdx}`)?.focus();
// //                           }}
// //                         />
// //                       </label>

// //                       <button
// //                         id={`view-${globalIdx}`}
// //                         type="button"
// //                         onClick={() => handleView(file, globalIdx)}
// //                         onKeyDown={(e) => handleViewKeyDown(e, globalIdx)}
// //                         disabled={!file}
// //                         className={`inline-flex items-center justify-center w-7 h-7 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
// //                           file
// //                             ? "bg-blue-50 border border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
// //                             : "bg-slate-100 text-slate-300 border border-transparent cursor-not-allowed"
// //                         }`}
// //                       >
// //                         <FaEye size={12} />
// //                       </button>

// //                       <button
// //                         id={`delete-${globalIdx}`}
// //                         type="button"
// //                         disabled={!file || isViewMode}
// //                         onClick={() => handleFileRemove(doc, globalIdx)}
// //                         onKeyDown={(e) => handleDeleteKeyDown(e, globalIdx)}
// //                         className={`inline-flex items-center justify-center w-7 h-7 rounded-lg outline-none focus:ring-2 focus:ring-rose-500 transition-colors ${
// //                           file && !isViewMode
// //                             ? "bg-rose-50 text-rose-500 border border-rose-500 hover:bg-rose-500 hover:text-white"
// //                             : "bg-slate-100 text-slate-300 border border-transparent cursor-not-allowed"
// //                         }`}
// //                       >
// //                         <FaTrash size={12} />
// //                       </button>
// //                     </div>
// //                   </div>
// //                 );
// //               })}
// //             </div>
// //           </div>
// //         ))}
// //       </div>

// //       {/* 🚀 SMART PREVIEW MODAL */}
// //       {previewFile && previewUrl && (
// //         <div
// //           className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm"
// //           onClick={closePreview} 
// //           // 👉 अब Modal Ctrl + Q से बंद होगा
// //           onKeyDown={(e) => {
// //             if (e.ctrlKey && e.key.toLowerCase() === "q") {
// //               e.preventDefault();
// //               closePreview();
// //             }
// //           }}
// //           tabIndex={0} 
// //           ref={(el) => el && el.focus()} 
// //         >
// //           <div
// //             className="bg-white rounded-2xl shadow-2xl overflow-hidden w-full max-w-3xl h-[70vh] flex flex-col outline-none"
// //             onClick={(e) => e.stopPropagation()} 
// //           >
// //             <div className="flex justify-between items-center px-6 py-4 border-b bg-slate-50">
// //               <h3 className="text-sm font-bold text-slate-800">{previewFile.name}</h3>
              
// //               {/* 👉 यहाँ Ctrl + Q का बैज (Hint) लगा दिया गया है */}
// //               <div className="flex items-center gap-3">
// //                 <span className="hidden sm:inline-block text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded shadow-sm border border-slate-300">
// //                   Ctrl + Q
// //                 </span>
// //                 <button 
// //                   className="text-slate-500 hover:text-rose-500 w-6 h-6 flex items-center justify-center rounded-full hover:bg-rose-50 transition-colors"
// //                   onClick={closePreview}
// //                 >✕</button>
// //               </div>
// //             </div>

// //             <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-100/50">
// //               {previewFile.type.startsWith("image/") ? (
// //                 <img
// //                   src={previewUrl}
// //                   alt="preview"
// //                   className="max-w-full max-h-full object-contain rounded shadow-sm"
// //                 />
// //               ) : previewFile.type === "application/pdf" ? (
// //                 <iframe src={previewUrl} title="pdf" className="w-full h-full bg-white rounded shadow-sm" />
// //               ) : (
// //                 <div className="text-sm font-medium text-slate-500 flex flex-col items-center gap-2">
// //                   <FaPaperclip size={24} className="text-slate-300" />
// //                   Preview not supported for this file type
// //                 </div>
// //               )}
// //             </div>
// //           </div>
// //         </div>
// //       )}
// //     </div>
// //   );
// // };

// // export default DocumentTable;
// import React, { useState, useEffect } from "react";
// import { 
//   FaPaperclip, 
//   FaEye, 
//   FaTrash, 
//   FaCloudUploadAlt, 
//   FaSyncAlt, 
//   FaCheckCircle,
//   FaPlus
// } from "react-icons/fa";

// const DocumentTable = ({ attachments, setAttachments, isViewMode }) => {
//   const [previewFile, setPreviewFile] = useState(null);
//   const [previewUrl, setPreviewUrl] = useState(null);
//   const [activePreviewIdx, setActivePreviewIdx] = useState(null);
//   const [customDocName, setCustomDocName] = useState("");
//   const [customDocs, setCustomDocs] = useState([]);

//   // Focus management
//   useEffect(() => {
//     if (!isViewMode) {
//       setTimeout(() => {
//         const customInput = document.getElementById("custom-doc-input");
//         if (customInput) customInput.focus();
//         else document.getElementById("attach-0")?.focus();
//       }, 100);
//     }
//   }, [isViewMode]);

//   // Object URL management for memory leak prevention
//   useEffect(() => {
//     if (previewFile) {
//       const url = URL.createObjectURL(previewFile);
//       setPreviewUrl(url);
//       return () => URL.revokeObjectURL(url);
//     } else {
//       setPreviewUrl(null);
//     }
//   }, [previewFile]);

//   const handleFileAttach = (docName, file) => {
//     if (file) setAttachments((prev) => ({ ...prev, [docName]: file }));
//   };

//   const handleFileRemove = (docName, globalIdx) => {
//     setAttachments((prev) => {
//       const updated = { ...prev };
//       delete updated[docName];
//       return updated;
//     });
//     setTimeout(() => document.getElementById(`attach-${globalIdx}`)?.focus(), 0);
//   };

//   const handleView = (file, globalIdx) => {
//     if (file) {
//       setPreviewFile(file);
//       setActivePreviewIdx(globalIdx);
//     }
//   };

//   const closePreview = () => {
//     setPreviewFile(null);
//     if (activePreviewIdx !== null) {
//       setTimeout(() => document.getElementById(`view-${activePreviewIdx}`)?.focus(), 50);
//     }
//   };

//   const handleAddCustomDoc = () => {
//     const docName = customDocName.trim();
//     if (docName && !customDocs.includes(docName)) {
//       setCustomDocs([...customDocs, docName]);
//       setCustomDocName("");
//     }
//   };

//   // Keyboard accessibility
//   const handleAttachKeyDown = (e, globalIdx) => {
//     if (isViewMode) return;
//     if (e.key === " " || e.key === "Enter") {
//       e.preventDefault();
//       document.getElementById(`file-input-${globalIdx}`)?.click();
//     } else if (e.key === "ArrowRight") {
//       e.preventDefault();
//       document.getElementById(`view-${globalIdx}`)?.focus() || document.getElementById(`delete-${globalIdx}`)?.focus();
//     }
//   };

//   const handleViewKeyDown = (e, globalIdx) => {
//     if (e.key === "ArrowLeft") {
//       e.preventDefault();
//       document.getElementById(`attach-${globalIdx}`)?.focus();
//     } else if (e.key === "ArrowRight") {
//       e.preventDefault();
//       document.getElementById(`delete-${globalIdx}`)?.focus();
//     }
//   };

//   const handleDeleteKeyDown = (e, globalIdx) => {
//     if (e.key === "ArrowLeft") {
//       e.preventDefault();
//       document.getElementById(`view-${globalIdx}`)?.focus() || document.getElementById(`attach-${globalIdx}`)?.focus();
//     }
//   };

//   const baseDocumentCategories = {
//     "Identity Documents": ["Aadhaar Card", "PAN Card", "Voter ID", "Passport"],
//     "Educational Documents": ["10th / 12th Marksheets", "Degree Certificates"],
//     "Employment Documents": ["Previous Relieving Letter", "Experience Certificate", "Salary Slips (Last 3 months)", "Offer Letter"],
//     "Financial / Other": ["PF/ESI Number", "Bank Passbook"],
//   };

//   const documentCategories = { ...baseDocumentCategories };
//   if (customDocs.length > 0) documentCategories["Custom Added Documents"] = customDocs;
//   const flatDocs = Object.values(documentCategories).flat();
//   const uploadedCount = Object.keys(attachments).length;

//   // ✨ PREMIUM FILE ICONS WITH GRADIENTS
//   const getFileIconStyle = (file) => {
//     if (!file) return { text: "DOC", classes: "bg-slate-200 text-slate-500" };
//     if (file.type.includes("pdf")) return { text: "PDF", classes: "bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-red-500/30 shadow-sm" };
//     if (file.type.includes("image")) return { text: "IMG", classes: "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-blue-500/30 shadow-sm" };
//     return { text: "DOC", classes: "bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-emerald-500/30 shadow-sm" };
//   };

//   const formatSize = (bytes) => {
//     if (!bytes) return "0 KB";
//     return (bytes / 1024).toFixed(0) + " KB";
//   };

//   return (
//     <div className="w-full flex flex-col h-full bg-slate-50/30 text-slate-800 p-1">
      
//       {/* ✨ MODERN HEADER */}
//       <div className="flex flex-wrap items-center justify-between gap-3 mb-5 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
//         <div className="flex items-center gap-2.5">
//           <div className="w-1.5 h-5 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full"></div>
//           <h2 className="text-[13px] font-extrabold text-slate-800 uppercase tracking-widest flex items-center">
//             Document Vault
//           </h2>
//         </div>
//         <div className="flex items-center gap-2 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
//           <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
//           <span className="text-[10px] font-bold text-indigo-700 tracking-wide uppercase">
//             {uploadedCount} / {flatDocs.length} Uploaded
//           </span>
//         </div>
//       </div>

//       {/* ✨ SEAMLESS CUSTOM DOCUMENT INPUT */}
//       {!isViewMode && (
//         <div className="mb-5 flex">
//           <div className="group flex items-center bg-white border border-slate-200 hover:border-indigo-300 rounded-full overflow-hidden w-full max-w-sm shadow-sm focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition-all duration-200">
//             <div className="pl-3 pr-1 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
//               <FaPlus size={10} />
//             </div>
//             <input
//               id="custom-doc-input"
//               type="text"
//               value={customDocName}
//               onChange={(e) => setCustomDocName(e.target.value)}
//               onKeyDown={(e) => e.key === "Enter" && handleAddCustomDoc()}
//               placeholder="Add extra document slot..."
//               className="bg-transparent px-2 py-1.5 text-[11px] outline-none w-full text-slate-700 placeholder:text-slate-400 font-medium"
//             />
//             <button
//               onClick={handleAddCustomDoc}
//               className="bg-slate-100 text-slate-600 px-4 py-1.5 text-[11px] font-bold hover:bg-indigo-500 hover:text-white transition-all duration-200"
//             >
//               Add
//             </button>
//           </div>
//         </div>
//       )}

//       {/* CATEGORIES & CARDS GRID */}
//       <div className="flex flex-col gap-5">
//         {Object.entries(documentCategories).map(([category, docs]) => (
//           <div key={category} className="flex flex-col">
//             <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-2.5 px-1 flex items-center gap-3">
//               {category}
//               <div className="h-[1px] bg-gradient-to-r from-slate-200 to-transparent flex-1"></div>
//             </h3>
            
//             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              
//               {docs.map((doc) => {
//                 const file = attachments[doc];
//                 const globalIdx = flatDocs.indexOf(doc);
//                 const fileStyle = getFileIconStyle(file);

//                 // --- ✨ UPLOADED STATE CARD ---
//                 if (file) {
//                   return (
//                     <div key={doc} className="group relative border border-slate-200 hover:border-indigo-300 rounded-xl flex flex-col justify-between bg-white p-3 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
//                       {/* Highlight Bar on Top */}
//                       <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-400 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      
//                       <div className="flex justify-between items-start mb-3 gap-2">
//                         <div className="flex gap-2.5 items-center overflow-hidden">
//                           {/* Rich Gradient Icon */}
//                           <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 ${fileStyle.classes} transition-transform group-hover:scale-105`}>
//                             {fileStyle.text}
//                           </div>
//                           <div className="flex flex-col min-w-0">
//                             <span className="text-[12px] font-bold text-slate-800 truncate" title={doc}>{doc}</span>
//                             <div className="flex items-center gap-1.5 mt-0.5">
//                               <FaCheckCircle className="text-emerald-500" size={10} />
//                               <span className="text-[10px] font-medium text-slate-500 truncate">{formatSize(file.size)}</span>
//                             </div>
//                           </div>
//                         </div>
//                         {/* Elegant Delete Button */}
//                         {!isViewMode && (
//                           <button
//                             id={`delete-${globalIdx}`}
//                             onClick={() => handleFileRemove(doc, globalIdx)}
//                             onKeyDown={(e) => handleDeleteKeyDown(e, globalIdx)}
//                             className="text-slate-300 hover:bg-rose-50 hover:text-rose-600 rounded-full p-1.5 shrink-0 outline-none focus:ring-2 focus:ring-rose-200 transition-all"
//                             title="Remove Document"
//                           >
//                             <FaTrash size={11} />
//                           </button>
//                         )}
//                       </div>

//                       {/* Action Buttons */}
//                       <div className="flex gap-2 mt-auto">
//                         <button
//                           id={`view-${globalIdx}`}
//                           onClick={() => handleView(file, globalIdx)}
//                           onKeyDown={(e) => handleViewKeyDown(e, globalIdx)}
//                           className="flex-1 py-1.5 flex items-center justify-center gap-1.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-700 hover:text-indigo-700 rounded-lg text-[10px] font-bold outline-none focus:ring-2 focus:ring-indigo-300 transition-all"
//                         >
//                           <FaEye size={11} /> View
//                         </button>
//                         {!isViewMode && (
//                           <label
//                             id={`attach-${globalIdx}`}
//                             tabIndex={0}
//                             onKeyDown={(e) => handleAttachKeyDown(e, globalIdx)}
//                             className="flex-1 py-1.5 flex items-center justify-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-[10px] font-bold cursor-pointer outline-none focus:ring-2 focus:ring-slate-300 transition-all"
//                           >
//                             <FaSyncAlt size={10} /> Replace
//                             <input id={`file-input-${globalIdx}`} type="file" className="hidden" onChange={(e) => { handleFileAttach(doc, e.target.files[0]); e.target.value = null; document.getElementById(`attach-${globalIdx}`)?.focus(); }} />
//                           </label>
//                         )}
//                       </div>
//                     </div>
//                   );
//                 }

//                 // --- ✨ INTERACTIVE EMPTY STATE CARD ---
//                 return (
//                   <label
//                     key={doc}
//                     id={`attach-${globalIdx}`}
//                     tabIndex={isViewMode ? -1 : 0}
//                     onKeyDown={(e) => handleAttachKeyDown(e, globalIdx)}
//                     className={`group relative border-2 border-dashed rounded-xl p-3.5 flex flex-col items-center justify-center text-center h-full min-h-[115px] transition-all duration-300 outline-none overflow-hidden ${
//                       !isViewMode 
//                         ? "border-slate-200 bg-white hover:border-indigo-400 hover:shadow-md cursor-pointer focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50/50" 
//                         : "border-slate-100 bg-slate-50 opacity-60 cursor-not-allowed"
//                     }`}
//                   >
//                     {/* Hover Gradient Background Effect */}
//                     {!isViewMode && (
//                       <div className="absolute inset-0 bg-gradient-to-b from-transparent to-indigo-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
//                     )}

//                     <div className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center mb-2 transition-all duration-500 ${!isViewMode ? "bg-slate-50 text-slate-400 group-hover:bg-indigo-600 group-hover:text-white group-hover:-translate-y-1 group-hover:shadow-lg shadow-indigo-500/30" : "bg-slate-200 text-slate-400"}`}>
//                       <FaCloudUploadAlt size={16} />
//                     </div>
                    
//                     <span className="relative z-10 text-[12px] font-extrabold text-slate-700 leading-tight mb-1 px-1 transition-colors group-hover:text-indigo-900">{doc}</span>
                    
//                     {!isViewMode && (
//                       <span className="relative z-10 text-[10px] font-bold text-indigo-500 mt-0.5 opacity-0 -translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
//                         Browse to upload
//                       </span>
//                     )}
//                     <span className="relative z-10 text-[9px] text-slate-400 mt-1.5 font-medium tracking-wide uppercase transition-opacity group-hover:opacity-60">PDF, JPG, PNG • MAX 5MB</span>
                    
//                     <input
//                       id={`file-input-${globalIdx}`}
//                       type="file"
//                       className="hidden"
//                       disabled={isViewMode}
//                       onChange={(e) => {
//                         handleFileAttach(doc, e.target.files[0]);
//                         e.target.value = null;
//                         document.getElementById(`view-${globalIdx}`)?.focus();
//                       }}
//                     />
//                   </label>
//                 );
//               })}
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* ✨ GLASSMORPHISM PREVIEW MODAL */}
//       {previewFile && previewUrl && (
//         <div
//           className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-slate-900/60 backdrop-blur-md transition-all duration-300"
//           onClick={closePreview}
//           onKeyDown={(e) => e.ctrlKey && e.key.toLowerCase() === "q" && closePreview()}
//           tabIndex={0}
//           ref={(el) => el && el.focus()}
//         >
//           <div 
//             className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden w-full max-w-5xl h-[85vh] flex flex-col outline-none ring-1 ring-white/50 animate-in fade-in zoom-in duration-200" 
//             onClick={(e) => e.stopPropagation()}
//           >
//             <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100 bg-white/50">
//               <div className="flex items-center gap-3">
//                 <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm">
//                   <FaPaperclip size={14} />
//                 </div>
//                 <div>
//                   <h3 className="text-sm font-bold text-slate-800 truncate max-w-sm sm:max-w-md">{previewFile.name}</h3>
//                   <p className="text-[10px] font-medium text-slate-500">{formatSize(previewFile.size)} • {previewFile.type || "Document"}</p>
//                 </div>
//               </div>
              
//               <div className="flex items-center gap-4 shrink-0">
//                 <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-bold text-slate-400 bg-slate-100/80 px-2 py-1 rounded-md border border-slate-200">
//                   <span className="bg-white px-1 py-0.5 rounded shadow-sm">Ctrl</span> + <span className="bg-white px-1 py-0.5 rounded shadow-sm">Q</span>
//                 </div>
//                 <button 
//                   className="text-slate-400 hover:text-white bg-slate-100 hover:bg-rose-500 w-8 h-8 flex items-center justify-center rounded-full transition-all duration-200 shadow-sm" 
//                   onClick={closePreview}
//                 >
//                   ✕
//                 </button>
//               </div>
//             </div>
//             <div className="flex-1 overflow-auto p-6 flex items-center justify-center bg-slate-100/50 inner-shadow">
//               {previewFile.type.startsWith("image/") ? (
//                 <img src={previewUrl} alt="preview" className="max-w-full max-h-full object-contain rounded-xl shadow-md ring-1 ring-slate-200/50" />
//               ) : previewFile.type === "application/pdf" ? (
//                 <iframe src={previewUrl} title="pdf" className="w-full h-full bg-white rounded-xl shadow-md ring-1 ring-slate-200/50" />
//               ) : (
//                 <div className="text-sm font-bold text-slate-500 flex flex-col items-center gap-3 bg-white p-8 rounded-2xl shadow-sm ring-1 ring-slate-200">
//                   <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
//                     <FaPaperclip size={32} />
//                   </div>
//                   Preview not available for this file type.
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default DocumentTable;
import React, { useState, useEffect } from "react";
import { 
  FaPaperclip, 
  FaEye, 
  FaTrash, 
  FaCloudUploadAlt, 
  FaSyncAlt, 
  FaCheckCircle,
  FaPlus,
  FaChevronDown,
  FaChevronRight
} from "react-icons/fa";

const DocumentTable = ({ attachments, setAttachments, isViewMode }) => {
  const [previewFile, setPreviewFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [activePreviewIdx, setActivePreviewIdx] = useState(null);
  const [customDocName, setCustomDocName] = useState("");
  const [customDocs, setCustomDocs] = useState([]);
  
  // UX States
  const [draggingDoc, setDraggingDoc] = useState(null);
  const [collapsedCategories, setCollapsedCategories] = useState([]);

  useEffect(() => {
    if (!isViewMode) {
      setTimeout(() => {
        const customInput = document.getElementById("custom-doc-input");
        if (customInput) customInput.focus();
        else document.getElementById("attach-0")?.focus();
      }, 100);
    }
  }, [isViewMode]);

  useEffect(() => {
    if (previewFile) {
      const url = URL.createObjectURL(previewFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [previewFile]);

  // Actions
  const handleFileAttach = (docName, file) => {
    if (file) setAttachments((prev) => ({ ...prev, [docName]: file }));
  };

  const handleFileRemove = (docName, globalIdx) => {
    setAttachments((prev) => {
      const updated = { ...prev };
      delete updated[docName];
      return updated;
    });
    setTimeout(() => document.getElementById(`attach-${globalIdx}`)?.focus(), 0);
  };

  const toggleCategory = (category) => {
    setCollapsedCategories(prev => 
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
  };

  // Drag & Drop Handlers
  const handleDragOver = (e, docName) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isViewMode && draggingDoc !== docName) setDraggingDoc(docName);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingDoc(null);
  };

  const handleDrop = (e, docName) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingDoc(null);
    if (isViewMode) return;
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileAttach(docName, e.dataTransfer.files[0]);
    }
  };

  // Keyboard accessibility
  const handleAttachKeyDown = (e, globalIdx) => {
    if (isViewMode) return;
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      document.getElementById(`file-input-${globalIdx}`)?.click();
    }
  };

  const handleView = (file, globalIdx) => {
    if (file) {
      setPreviewFile(file);
      setActivePreviewIdx(globalIdx);
    }
  };

  const closePreview = () => {
    setPreviewFile(null);
    if (activePreviewIdx !== null) {
      setTimeout(() => document.getElementById(`view-${activePreviewIdx}`)?.focus(), 50);
    }
  };

  const baseDocumentCategories = {
    "Identity Documents": ["Aadhaar Card", "PAN Card", "Voter ID", "Passport"],
    "Educational Documents": ["10th / 12th Marksheets", "Degree Certificates"],
    "Employment Documents": ["Previous Relieving Letter", "Experience Certificate", "Salary Slips (Last 3 months)", "Offer Letter"],
    "Financial / Other": ["PF/ESI Number", "Bank Passbook"],
  };

  const documentCategories = { ...baseDocumentCategories };
  if (customDocs.length > 0) documentCategories["Custom Added Documents"] = customDocs;
  const flatDocs = Object.values(documentCategories).flat();
  const uploadedCount = Object.keys(attachments).length;
  const progressPercentage = flatDocs.length > 0 ? Math.round((uploadedCount / flatDocs.length) * 100) : 0;

  const getFileIconStyle = (file) => {
    if (!file) return { text: "DOC", classes: "bg-slate-200 text-slate-500" };
    if (file.type.includes("pdf")) return { text: "PDF", classes: "bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-red-500/30 shadow-sm" };
    if (file.type.includes("image")) return { text: "IMG", classes: "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-blue-500/30 shadow-sm" };
    return { text: "DOC", classes: "bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-emerald-500/30 shadow-sm" };
  };

  const formatSize = (bytes) => {
    if (!bytes) return "0 KB";
    return (bytes / 1024).toFixed(0) + " KB";
  };

  return (
    // ✨ Subtle dotted grid background for premium feel
    <div className="w-full flex flex-col h-full bg-slate-50 min-h-screen p-1.5 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-[0.4] bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px]"></div>
      
      <div className="relative z-10 w-full max-w-7xl ">
        
        {/* ✨ DYNAMIC DASHBOARD HEADER */}
        {/* <div className="flex flex-wrap items-center justify-between gap-4 mb-5 bg-white/80 backdrop-blur-md px-4 py-3 rounded-xl border border-slate-200/60 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-lg flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <FaPaperclip size={14} />
            </div>
            <div>
              <h2 className="text-[14px] font-extrabold text-slate-800 tracking-wide leading-tight">
                Document Vault
              </h2>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Secure File Management
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5 min-w-[140px]">
            <div className="flex justify-between w-full text-[10px] font-bold text-slate-500">
              <span>{progressPercentage}% Completed</span>
              <span>{uploadedCount} / {flatDocs.length}</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-700 ease-out"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
        </div> */}

        {/* SEAMLESS CUSTOM DOCUMENT INPUT */}
     
        {/* CATEGORIES & CARDS GRID */}
        <div className="flex flex-col gap-1">
          {Object.entries(documentCategories).map(([category, docs]) => {
            const isCollapsed = collapsedCategories.includes(category);
            const categoryUploaded = docs.filter(d => attachments[d]).length;
            const isComplete = categoryUploaded === docs.length;

            return (
              <div key={category} className="flex flex-col bg-white/40 backdrop-blur-sm rounded-xl border border-slate-200/50 overflow-hidden transition-all duration-300">
                
                {/* ✨ ACCORDION HEADER */}
                <button 
                  onClick={() => toggleCategory(category)}
                  className="flex items-center justify-between w-full px-4 py-3 bg-white/60 hover:bg-white/90 transition-colors outline-none"
                >
                  <div className="flex items-center gap-3">
                    <div className={`text-slate-400 transition-transform duration-300 ${isCollapsed ? "rotate-[-90deg]" : "rotate-0"}`}>
                      <FaChevronDown size={10} />
                    </div>
                    <h3 className="text-[11px] font-bold text-slate-700 uppercase tracking-widest flex items-center gap-2">
                      {category}
                      {isComplete && <FaCheckCircle className="text-emerald-500" size={10} title="Category Complete" />}
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100/80 px-2 py-0.5 rounded-md">
                    {categoryUploaded} / {docs.length}
                  </span>
                </button>
                
                {/* GRID CONTENT */}
                <div className={`transition-all duration-300 ease-in-out ${isCollapsed ? "max-h-0 opacity-0 overflow-hidden" : "max-h-[200px] opacity-100 p-1 pt-0"}`}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 2xl:grid-cols-6 gap-2 mt-1">
                    
                    {docs.map((doc) => {
                      const file = attachments[doc];
                      const globalIdx = flatDocs.indexOf(doc);
                      const fileStyle = getFileIconStyle(file);
                      const isDraggingHere = draggingDoc === doc;

                      // --- ✨ UPLOADED STATE CARD ---
                      if (file) {
                        return (
                          <div key={doc} className="group relative border border-slate-200 hover:border-indigo-300 rounded-xl flex flex-col justify-between bg-white p-3 shadow-sm hover:shadow-md transition-all duration-300">
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-400 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity rounded-t-xl"></div>
                            
                            <div className="flex justify-between items-start mb-3 gap-2">
                              <div className="flex gap-3 items-center overflow-hidden">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 ${fileStyle.classes} transition-transform group-hover:scale-105`}>
                                  {fileStyle.text}
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="text-[12px] font-bold text-slate-800 truncate" title={doc}>{doc}</span>
                                  <div className="flex items-center gap-1.5 mt-0.5 text-[10px] font-medium text-slate-500">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                    <span className="truncate">{formatSize(file.size)}</span>
                                  </div>
                                </div>
                              </div>
                              {!isViewMode && (
                                <button
                                  id={`delete-${globalIdx}`}
                                  onClick={() => handleFileRemove(doc, globalIdx)}
                                  className="text-slate-300 hover:bg-rose-50 hover:text-rose-600 rounded-full p-1.5 shrink-0 outline-none transition-all focus:bg-rose-50 focus:text-rose-600"
                                  title="Remove Document"
                                >
                                  <FaTrash size={11} />
                                </button>
                              )}
                            </div>

                            <div className="flex gap-2 mt-auto">
                              <button
                                id={`view-${globalIdx}`}
                                onClick={() => handleView(file, globalIdx)}
                                className="flex-1 py-1.5 flex items-center justify-center gap-1.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-700 hover:text-indigo-700 rounded-lg text-[10px] font-bold transition-all outline-none focus:ring-2 focus:ring-indigo-300"
                              >
                                <FaEye size={11} /> View
                              </button>
                              {!isViewMode && (
                                <label
                                  id={`attach-${globalIdx}`}
                                  tabIndex={0}
                                  onKeyDown={(e) => handleAttachKeyDown(e, globalIdx)}
                                  className="flex-1 py-1.5 flex items-center justify-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-[10px] font-bold cursor-pointer transition-all outline-none focus:ring-2 focus:ring-slate-300"
                                >
                                  <FaSyncAlt size={10} /> Replace
                                  <input type="file" className="hidden" onChange={(e) => { handleFileAttach(doc, e.target.files[0]); e.target.value = null; }} />
                                </label>
                              )}
                            </div>
                          </div>
                        );
                      }

                      // --- 🔥 TRUE DRAG & DROP EMPTY STATE CARD ---
                      return (
                        <label
                          key={doc}
                          id={`attach-${globalIdx}`}
                          tabIndex={isViewMode ? -1 : 0}
                          onKeyDown={(e) => handleAttachKeyDown(e, globalIdx)}
                          onDragOver={(e) => handleDragOver(e, doc)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, doc)}
                          className={`group relative border-2 border-dashed rounded-xl p-3.5 flex flex-col items-center justify-center text-center h-full min-h-[115px] transition-all duration-300 outline-none overflow-hidden ${
                            isViewMode 
                              ? "border-slate-100 bg-white/50 opacity-60 cursor-not-allowed" 
                              : isDraggingHere
                                ? "border-indigo-500 bg-indigo-50/80 scale-[1.02] shadow-lg shadow-indigo-500/10"
                                : "border-slate-200 bg-white/80 hover:border-indigo-400 hover:bg-white hover:shadow-md cursor-pointer focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50/50"
                          }`}
                        >
                          <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all duration-500 ${
                            isViewMode ? "bg-slate-100 text-slate-400" 
                            : isDraggingHere ? "bg-indigo-600 text-white animate-bounce shadow-lg shadow-indigo-500/40"
                            : "bg-slate-50 text-slate-400 group-hover:bg-indigo-600 group-hover:text-white group-hover:-translate-y-1 group-hover:shadow-lg shadow-indigo-500/20"
                          }`}>
                            <FaCloudUploadAlt size={18} />
                          </div>
                          
                          <span className={`relative z-10 text-[12px] font-extrabold leading-tight mb-0.5 px-1 transition-colors ${isDraggingHere ? "text-indigo-700" : "text-slate-700 group-hover:text-indigo-900"}`}>
                            {doc}
                          </span>
                          
                          {!isViewMode && (
                            <span className={`relative z-10 text-[10px] font-bold mt-0.5 transition-all duration-300 ${isDraggingHere ? "text-indigo-600" : "text-indigo-500 opacity-0 -translate-y-2 group-hover:opacity-100 group-hover:translate-y-0"}`}>
                              {isDraggingHere ? "Drop file here!" : "Click or drag to upload"}
                            </span>
                          )}
                          <span className={`relative z-10 text-[9px] mt-1.5 font-medium tracking-wide uppercase transition-opacity ${isDraggingHere ? "text-indigo-400" : "text-slate-400 group-hover:opacity-60"}`}>
                            PDF, JPG, PNG • MAX 5MB
                          </span>
                          
                          <input
                            type="file"
                            className="hidden"
                            disabled={isViewMode}
                            onChange={(e) => { handleFileAttach(doc, e.target.files[0]); e.target.value = null; }}
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ✨ GLASSMORPHISM PREVIEW MODAL */}
        {previewFile && previewUrl && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-slate-900/60 backdrop-blur-md transition-all duration-300"
            onClick={closePreview}
            onKeyDown={(e) => e.ctrlKey && e.key.toLowerCase() === "q" && closePreview()}
            tabIndex={0}
            ref={(el) => el && el.focus()}
          >
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden w-full max-w-5xl h-[85vh] flex flex-col outline-none ring-1 ring-white/50" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100 bg-white/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm">
                    <FaPaperclip size={14} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 truncate max-w-sm sm:max-w-md">{previewFile.name}</h3>
                    <p className="text-[10px] font-medium text-slate-500">{formatSize(previewFile.size)} • {previewFile.type || "Document"}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 shrink-0">
                  <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-bold text-slate-400 bg-slate-100/80 px-2 py-1 rounded-md border border-slate-200">
                    <span className="bg-white px-1 py-0.5 rounded shadow-sm">Ctrl</span> + <span className="bg-white px-1 py-0.5 rounded shadow-sm">Q</span>
                  </div>
                  <button className="text-slate-400 hover:text-white bg-slate-100 hover:bg-rose-500 w-8 h-8 flex items-center justify-center rounded-full transition-all duration-200 shadow-sm" onClick={closePreview}>
                    ✕
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-auto p-6 flex items-center justify-center bg-slate-100/50 inner-shadow">
                {previewFile.type.startsWith("image/") ? (
                  <img src={previewUrl} alt="preview" className="max-w-full max-h-full object-contain rounded-xl shadow-md ring-1 ring-slate-200/50" />
                ) : previewFile.type === "application/pdf" ? (
                  <iframe src={previewUrl} title="pdf" className="w-full h-full bg-white rounded-xl shadow-md ring-1 ring-slate-200/50" />
                ) : (
                  <div className="text-sm font-bold text-slate-500 flex flex-col items-center gap-3 bg-white p-8 rounded-2xl shadow-sm ring-1 ring-slate-200">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                      <FaPaperclip size={32} />
                    </div>
                    Preview not available for this file type.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentTable;