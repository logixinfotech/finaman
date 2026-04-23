import React, { useState, useEffect } from "react";
import { FaPaperclip, FaEye, FaTrash, FaPlus } from "react-icons/fa";

const DocumentTable = ({ attachments, setAttachments, isViewMode }) => {
  const [previewFile, setPreviewFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  
  const [activePreviewIdx, setActivePreviewIdx] = useState(null);
  
  const [customDocName, setCustomDocName] = useState("");
  const [customDocs, setCustomDocs] = useState([]);

  useEffect(() => {
    if (!isViewMode) {
      setTimeout(() => {
        const customInput = document.getElementById("custom-doc-input");
        if (customInput) {
          customInput.focus();
        } else {
          const firstAttachBtn = document.getElementById("attach-0");
          if (firstAttachBtn) firstAttachBtn.focus();
        }
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

  const handleFileAttach = (docName, file) => {
    if (file) {
      setAttachments((prev) => ({ ...prev, [docName]: file }));
    }
  };

  const handleFileRemove = (docName, globalIdx) => {
    setAttachments((prev) => {
      const updated = { ...prev };
      delete updated[docName];
      return updated;
    });

    setTimeout(() => {
      document.getElementById(`attach-${globalIdx}`)?.focus();
    }, 0);
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
      setTimeout(() => {
        document.getElementById(`view-${activePreviewIdx}`)?.focus();
      }, 50);
    }
  };

  const handleAddCustomDoc = () => {
    const docName = customDocName.trim();
    if (docName && !customDocs.includes(docName)) {
      setCustomDocs([...customDocs, docName]);
      setCustomDocName(""); 
    }
  };

  const baseDocumentCategories = {
    "Identity Documents": [
      "Aadhaar Card",
      "PAN Card",
      "Voter ID",
      "Passport",
      "Driving License",
    ],
    "Educational Documents": [
      "10th / 12th Marksheets",
      "Diploma / Degree Certificates",
      "Post-Graduation Certificates",
      "Professional Certificates",
      "Skill Certifications",
    ],
    "Employment Documents": [
      "Previous Employment Letters",
      "Relieving Letter",
      "Experience Certificate",
      "Salary Slips (Last 3 months)",
      "Offer Letter",
      "Appointment Letter",
      "Joining Report",
    ],
    "Financial / Other": ["PF/ESI Number", "Bank Passbook", "Rent Agreement"],
  };

  const documentCategories = { ...baseDocumentCategories };
  if (customDocs.length > 0) {
    documentCategories["Custom Added Documents"] = customDocs;
  }

  const flatDocs = Object.values(documentCategories).flat();

  const handleAttachKeyDown = (e, globalIdx) => {
    if (isViewMode) return;

    if (e.key === " ") {
      e.preventDefault();
      document.getElementById(`file-input-${globalIdx}`)?.click();
    } else if (e.key === "Enter") {
      e.preventDefault();
      const nextEl = document.getElementById(`attach-${globalIdx + 1}`);
      
      if (nextEl) {
        nextEl.focus();
      } else {
        const allButtons = Array.from(document.querySelectorAll("button"));
        const salaryTabBtn = allButtons.find(
          (btn) => btn.textContent.toLowerCase().trim() === "salary"
        );
        
        if (salaryTabBtn) {
          salaryTabBtn.click(); 
        } else {
          const saveBtn = allButtons.find(
            (btn) => btn.textContent.toLowerCase().includes("save")
          );
          if (saveBtn) saveBtn.focus();
        }
      }
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      const viewBtn = document.getElementById(`view-${globalIdx}`);
      const delBtn = document.getElementById(`delete-${globalIdx}`);
      if (viewBtn && !viewBtn.disabled) viewBtn.focus();
      else if (delBtn && !delBtn.disabled) delBtn.focus();
    }
  };

  const handleViewKeyDown = (e, globalIdx) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      document.getElementById(`attach-${globalIdx}`)?.focus();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      const delBtn = document.getElementById(`delete-${globalIdx}`);
      if (delBtn && !delBtn.disabled) delBtn.focus();
    }
  };

  const handleDeleteKeyDown = (e, globalIdx) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      const viewBtn = document.getElementById(`view-${globalIdx}`);
      if (viewBtn && !viewBtn.disabled) viewBtn.focus();
      else document.getElementById(`attach-${globalIdx}`)?.focus();
    }
  };

  return (
    <div className="w-full flex flex-col h-full">
      
    

      <div className="columns-1 xl:columns-2 gap-4">
        {Object.entries(documentCategories).map(([category, docs]) => (
          <div
            key={category}
            className="mb-4 break-inside-avoid border border-slate-200 rounded shadow-sm inline-block w-full align-top bg-white"
          >
            <div className={`text-[13px] font-bold px-3 py-1.5 border-b ${category === "Custom Added Documents" ? "bg-indigo-50/80 text-indigo-700" : "bg-slate-50/80 text-slate-700"}`}>
              {category}
            </div>

            <div className="p-3 flex flex-col gap-y-2">
              {docs.map((doc, idx) => {
                const file = attachments[doc];
                const globalIdx = flatDocs.indexOf(doc);

                return (
                  <div
                    key={doc}
                    className="flex items-center justify-between text-[16px] w-full border-b border-slate-100 pb-1.5 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <span className="text-slate-500 w-[18px] text-right text-[12px]">
                        {idx + 1}.
                      </span>
                      <span className="text-black-800 text-[12px] font-semibold truncate" title={doc}>
                        {doc}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[10px] text-slate-500 truncate max-w-[90px] xl:max-w-[120px]" title={file ? file.name : ""}>
                        {file ? file.name : ""}
                      </span>

                      <label
                        id={`attach-${globalIdx}`}
                        tabIndex={isViewMode ? -1 : 0}
                        onKeyDown={(e) => handleAttachKeyDown(e, globalIdx)}
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
                          !isViewMode
                            ? file 
                              ? "bg-green-50 text-green-600 border border-green-200 hover:bg-green-600 hover:text-white cursor-pointer" 
                              : "bg-indigo-50 text-indigo-500 border border-indigo-200 hover:bg-indigo-500 hover:text-white cursor-pointer"
                            : "bg-slate-100 text-slate-400 cursor-not-allowed"
                        }`}
                      >
                        <FaPaperclip size={12} />
                        <input
                          id={`file-input-${globalIdx}`}
                          type="file"
                          className="hidden"
                          disabled={isViewMode}
                          onChange={(e) => {
                            handleFileAttach(doc, e.target.files[0]);
                            e.target.value = null; 
                            document.getElementById(`attach-${globalIdx}`)?.focus();
                          }}
                        />
                      </label>

                      <button
                        id={`view-${globalIdx}`}
                        type="button"
                        onClick={() => handleView(file, globalIdx)}
                        onKeyDown={(e) => handleViewKeyDown(e, globalIdx)}
                        disabled={!file}
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                          file
                            ? "bg-blue-50 border border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
                            : "bg-slate-100 text-slate-300 border border-transparent cursor-not-allowed"
                        }`}
                      >
                        <FaEye size={12} />
                      </button>

                      <button
                        id={`delete-${globalIdx}`}
                        type="button"
                        disabled={!file || isViewMode}
                        onClick={() => handleFileRemove(doc, globalIdx)}
                        onKeyDown={(e) => handleDeleteKeyDown(e, globalIdx)}
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-lg outline-none focus:ring-2 focus:ring-rose-500 transition-colors ${
                          file && !isViewMode
                            ? "bg-rose-50 text-rose-500 border border-rose-500 hover:bg-rose-500 hover:text-white"
                            : "bg-slate-100 text-slate-300 border border-transparent cursor-not-allowed"
                        }`}
                      >
                        <FaTrash size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 🚀 SMART PREVIEW MODAL */}
      {previewFile && previewUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm"
          onClick={closePreview} 
          // 👉 अब Modal Ctrl + Q से बंद होगा
          onKeyDown={(e) => {
            if (e.ctrlKey && e.key.toLowerCase() === "q") {
              e.preventDefault();
              closePreview();
            }
          }}
          tabIndex={0} 
          ref={(el) => el && el.focus()} 
        >
          <div
            className="bg-white rounded-2xl shadow-2xl overflow-hidden w-full max-w-3xl h-[70vh] flex flex-col outline-none"
            onClick={(e) => e.stopPropagation()} 
          >
            <div className="flex justify-between items-center px-6 py-4 border-b bg-slate-50">
              <h3 className="text-sm font-bold text-slate-800">{previewFile.name}</h3>
              
              {/* 👉 यहाँ Ctrl + Q का बैज (Hint) लगा दिया गया है */}
              <div className="flex items-center gap-3">
                <span className="hidden sm:inline-block text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded shadow-sm border border-slate-300">
                  Ctrl + Q
                </span>
                <button 
                  className="text-slate-500 hover:text-rose-500 w-6 h-6 flex items-center justify-center rounded-full hover:bg-rose-50 transition-colors"
                  onClick={closePreview}
                >✕</button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-100/50">
              {previewFile.type.startsWith("image/") ? (
                <img
                  src={previewUrl}
                  alt="preview"
                  className="max-w-full max-h-full object-contain rounded shadow-sm"
                />
              ) : previewFile.type === "application/pdf" ? (
                <iframe src={previewUrl} title="pdf" className="w-full h-full bg-white rounded shadow-sm" />
              ) : (
                <div className="text-sm font-medium text-slate-500 flex flex-col items-center gap-2">
                  <FaPaperclip size={24} className="text-slate-300" />
                  Preview not supported for this file type
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentTable;