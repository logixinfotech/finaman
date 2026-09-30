import { useState, useEffect, useMemo } from "react";
import {
  FaPaperclip,
  FaEye,
  FaTrash,
  FaCloudUploadAlt,
  FaSyncAlt,
  FaCheckCircle,
  FaChevronDown
} from "react-icons/fa";
import {
  getEmployeeDocuments,
  uploadEmployeeDocument,
  deleteEmployeeDocument,
  viewEmployeeDocument,
} from "../../utils/api";
import { showToast } from "../../components/Reusable/alert";

const DocumentTable = ({ attachments, setAttachments, isViewMode, documents = [], employeeId = null }) => {
  const [previewFile, setPreviewFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [activePreviewIdx, setActivePreviewIdx] = useState(null);
  const [collapsedCategories, setCollapsedCategories] = useState([]);
  const [draggingDoc, setDraggingDoc] = useState(null);
  const [savedDocs, setSavedDocs] = useState({});

  const baseDocumentCategories = useMemo(() => {
    const grouped = {};
    documents.forEach(doc => {
      const cat = doc.category || "Other Documents";
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(doc.group_name);
    });
    return grouped;
  }, [documents]);

  const flatDocs = Object.values(baseDocumentCategories).flat();
  useEffect(() => {
    setTimeout(() => {
      document.getElementById("doc-wrapper-0")?.focus();
    }, 150);
  }, []);

  useEffect(() => {
    if (previewFile) {
      const url = URL.createObjectURL(previewFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [previewFile]);
  useEffect(() => {
    if (!employeeId) return;
    (async () => {
      const res = await getEmployeeDocuments(employeeId);
      if (res?.data) {
        const map = {};
        const attMap = {};
        res.data.forEach(d => {
          map[d.doc_name] = d;
          attMap[d.doc_name] = {
            name: d.file_name,
            size: d.file_size,
            type: d.mime_type,
            _saved: true,
            _doc_id: d.doc_id,
            _view_url: viewEmployeeDocument(employeeId, d.doc_id)
          };
        });
        setSavedDocs(map);
        setAttachments(attMap);
      }
    })();
  }, [employeeId]);// eslint-disable-line react-hooks/exhaustive-deps


  useEffect(() => {
    if (!employeeId) return;
    const uploadPending = async () => {
      for (const [docName, file] of Object.entries(attachments)) {
        if (file && !file._saved && !savedDocs[docName]) {

          const doc = typeof documents !== 'undefined'
            ? documents.find(d => d.group_name === docName)
            : null;
          const docGroupId = doc?.group_id || "";

          try {
            const fd = new FormData();
            fd.append("file", file);
            fd.append("doc_group_id", docGroupId);
            fd.append("doc_name", docName);
            await uploadEmployeeDocument(employeeId, fd);
          } catch (e) {
            console.error("Pending upload failed:", e);
          }
        }
      }
      const res = await getEmployeeDocuments(employeeId);
      if (res?.data) {
        const map = {};
        const attMap = { ...attachments };
        res.data.forEach(d => {
          map[d.doc_name] = d;
          attMap[d.doc_name] = {
            name: d.file_name,
            size: d.file_size,
            type: d.mime_type,
            _saved: true,
            _doc_id: d.doc_id,
            _view_url: viewEmployeeDocument(employeeId, d.doc_id)
          };
        });
        setSavedDocs(map);
        setAttachments(attMap);
      }
    };

    uploadPending();
  }, [employeeId]);// eslint-disable-line react-hooks/exhaustive-deps

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

  const handleDrop = (e, docName, globalIdx, docGroupId) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingDoc(null);
    if (isViewMode) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileAttach(e.dataTransfer.files[0], docName, globalIdx, docGroupId);
    }
  };
  const handleFileAttach = async (file, docName, globalIdx, docTypeId) => {
    if (!file) return;

    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_FILE_SIZE) {
      showToast({ icon: "error", title: `File too large! Max 5 MB allowed. "${file.name}" is ${(file.size / 1024 / 1024).toFixed(1)} MB.` }); return;
    }

    const ALLOWED_EXTENSIONS = ["pdf", "jpg", "jpeg", "png"];
    const fileExt = file.name.split(".").pop()?.toLowerCase();
    if (!fileExt || !ALLOWED_EXTENSIONS.includes(fileExt)) {
      showToast({
        icon: "error",
        title: `Invalid file type! "${file.name}" — allowed: ${ALLOWED_EXTENSIONS.join(", ").toUpperCase()}`
      });
      return;
    }

    setAttachments(prev => ({ ...prev, [docName]: file }));
    if (employeeId) {

      try {
        const fd = new FormData();
        fd.append("file", file, file.name);
        fd.append("doc_name", docName || "");
        fd.append("doc_group_id", String(docTypeId || ""));

        const res = await uploadEmployeeDocument(employeeId, fd);
        if (res?.success) {
          const docsRes = await getEmployeeDocuments(employeeId);
          if (docsRes?.data) {
            const map = {};
            docsRes.data.forEach(d => { map[d.doc_name] = d; });
            setSavedDocs(map);
          }
        }
      } catch (e) {
        console.error("Upload failed:", e);
      } finally {
      }
    }

    setTimeout(() => document.getElementById(`doc-wrapper-${globalIdx}`)?.focus(), 50);
  };
  const handleFileRemove = async (docName, globalIdx) => {
    const savedDoc = savedDocs[docName];

    if (employeeId && savedDoc?.doc_id) {
      await deleteEmployeeDocument(employeeId, savedDoc.doc_id);
      setSavedDocs(prev => { const n = { ...prev }; delete n[docName]; return n; });
    }

    setAttachments(prev => {
      const updated = { ...prev };
      delete updated[docName];
      return updated;
    });
    setTimeout(() => document.getElementById(`doc-wrapper-${globalIdx}`)?.focus(), 50);
  };
  const handleDocumentKeyDown = (e, globalIdx, currentType, hasFile) => {
    e.stopPropagation();
    if (e.key === "Enter") {
      e.preventDefault();
      const nextIdx = globalIdx + 1;
      const nextEl = document.getElementById(`doc-wrapper-${nextIdx}`);
      if (nextEl) {
        nextEl.focus();
      } else {
        const saveBtn = Array.from(document.querySelectorAll("button")).find(
          (btn) => btn.textContent.toLowerCase().includes("save") || btn.textContent.toLowerCase().includes("update")
        );
        if (saveBtn) saveBtn.focus();
      }
      return;
    }
    if (e.key === "Backspace") {
      e.preventDefault();
      if (currentType !== "wrapper") {
        document.getElementById(`doc-wrapper-${globalIdx}`)?.focus();
      } else if (globalIdx > 0) {
        document.getElementById(`doc-wrapper-${globalIdx - 1}`)?.focus();
      }
      return;
    }
    if (e.key === " " || e.key === "Spacebar") {
      e.preventDefault();
      if (currentType === "wrapper" && !hasFile && !isViewMode) {
        document.getElementById(`file-input-${globalIdx}`)?.click();
      } else if (currentType === "view" && hasFile) {
        handleView(attachments[flatDocs[globalIdx]], globalIdx);
      } else if (currentType === "replace" && !isViewMode && hasFile) {
        document.getElementById(`file-input-${globalIdx}`)?.click();
      } else if (currentType === "delete" && !isViewMode && hasFile) {
        handleFileRemove(flatDocs[globalIdx], globalIdx);
      }
      return;
    }
    if (hasFile && (e.key === "ArrowRight" || e.key === "ArrowLeft")) {
      e.preventDefault();

      const sequence = isViewMode
        ? ["wrapper", "view"]
        : ["wrapper", "view", "replace", "delete"];

      const currentIndex = sequence.indexOf(currentType);
      let nextIndex = e.key === "ArrowRight" ? currentIndex + 1 : currentIndex - 1;
      if (nextIndex >= sequence.length) nextIndex = 0;
      if (nextIndex < 0) nextIndex = sequence.length - 1;

      const nextType = sequence[nextIndex];
      let nextId = `doc-wrapper-${globalIdx}`;
      if (nextType === "view") nextId = `view-${globalIdx}`;
      if (nextType === "replace") nextId = `replace-${globalIdx}`;
      if (nextType === "delete") nextId = `delete-${globalIdx}`;

      document.getElementById(nextId)?.focus();
      return;
    }
    if (hasFile && !isViewMode) {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        document.getElementById(`delete-${globalIdx}`)?.focus();
      } else if (e.key === "ArrowDown" && currentType === "delete") {
        e.preventDefault();
        document.getElementById(`view-${globalIdx}`)?.focus();
      }
    }
  };


  const handleView = async (file, globalIdx) => {
    if (!file) return;
    if (file._saved && file._view_url) {
      const token = localStorage.getItem("token");
      const res = await fetch(file._view_url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } else {
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
    <div className="w-full flex flex-col min-h-full bg-slate-50 p-1.5 relative">
      <div className="absolute inset-0 pointer-events-none opacity-[0.4] bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px]"></div>

      <div className="relative z-10 w-full max-w-7xl">
        <div className="flex flex-col gap-1">
          {Object.entries(baseDocumentCategories).map(([category, docs]) => {
            const isCollapsed = collapsedCategories.includes(category);
            const categoryUploaded = docs.filter(d => attachments[d]).length;
            const isComplete = categoryUploaded === docs.length;

            return (
              <div key={category} className="flex flex-col bg-white/40 backdrop-blur-sm rounded-xl border border-slate-200/50 overflow-hidden transition-all duration-300">
                <button
                  type="button"
                  onClick={() => setCollapsedCategories(prev => prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category])}
                  className="flex items-center justify-between w-full px-4 py-3 bg-white/60 hover:bg-white/90 transition-colors outline-none"
                >
                  <div className="flex items-center gap-3">
                    <div className={`text-slate-400 transition-transform duration-300 ${isCollapsed ? "rotate-[-90deg]" : "rotate-0"}`}>
                      <FaChevronDown size={10} />
                    </div>
                    <h3 className="text-[11px] font-bold text-slate-700 uppercase tracking-widest flex items-center gap-2">
                      {category}
                      {isComplete && <FaCheckCircle className="text-emerald-500" size={10} />}
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100/80 px-2 py-0.5 rounded-md">
                    {categoryUploaded} / {docs.length}
                  </span>
                </button>
                <div className={`transition-all duration-300 ease-in-out ${isCollapsed ? "max-h-0 opacity-0 overflow-hidden" : "max-h-[2000px] opacity-100 p-1 pt-0"}`}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5 gap-2 mt-1">

                    {docs.map((doc) => {
                      const docObj = documents.find(d => d.group_name === doc);
                      const docGroupId = docObj?.group_id || "";
                      const file = attachments[doc];
                      const globalIdx = flatDocs.indexOf(doc);
                      const fileStyle = getFileIconStyle(file);
                      const isDraggingHere = draggingDoc === doc;
                      if (file) {
                        return (
                          <div
                            key={doc}
                            id={`doc-wrapper-${globalIdx}`}
                            tabIndex={0}
                            onKeyDown={(e) => handleDocumentKeyDown(e, globalIdx, "wrapper", true)}
                            className="group relative border border-slate-200 hover:border-indigo-300 rounded-xl flex flex-col justify-between bg-white p-3 shadow-sm hover:shadow-md transition-all duration-300 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          >
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-400 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity rounded-t-xl"></div>

                            <div className="flex justify-between items-start mb-3 gap-2">
                              <div className="flex gap-3 items-center overflow-hidden">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 ${fileStyle.classes}`}>
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
                                  type="button"
                                  onClick={() => handleFileRemove(doc, globalIdx)}
                                  onKeyDown={(e) => handleDocumentKeyDown(e, globalIdx, "delete", true)}
                                  className="text-slate-300 hover:bg-rose-50 hover:text-rose-600 rounded-lg p-1.5 shrink-0 outline-none transition-all focus:bg-rose-50 focus:text-rose-600 focus:ring-2 focus:ring-rose-400"
                                >
                                  <FaTrash size={11} />
                                </button>
                              )}
                            </div>

                            <div className="flex gap-2 mt-auto">
                              <button
                                id={`view-${globalIdx}`}
                                type="button"
                                tabIndex={0}
                                onClick={() => handleView(file, globalIdx)}
                                onKeyDown={(e) => handleDocumentKeyDown(e, globalIdx, "view", true)}
                                className="flex-1 py-1.5 flex items-center justify-center gap-1.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-700 hover:text-indigo-700 rounded-lg text-[10px] font-bold transition-all outline-none focus:ring-2 focus:ring-indigo-400"
                              >
                                <FaEye size={11} /> View
                              </button>

                              {!isViewMode && (
                                <div
                                  id={`replace-${globalIdx}`}
                                  tabIndex={0}
                                  onClick={() => document.getElementById(`file-input-${globalIdx}`)?.click()}
                                  onKeyDown={(e) => handleDocumentKeyDown(e, globalIdx, "replace", true)}
                                  className="flex-1 py-1.5 flex items-center justify-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-[10px] font-bold cursor-pointer transition-all outline-none focus:ring-2 focus:ring-slate-400"
                                >
                                  <FaSyncAlt size={10} /> Replace
                                </div>
                              )}

                              <input
                                id={`file-input-${globalIdx}`}
                                type="file"
                                className="hidden"
                                disabled={isViewMode}
                                onChange={(e) => {
                                  handleFileAttach(e.target.files[0], doc, globalIdx, docGroupId);
                                  e.target.value = null;
                                }}
                              />
                            </div>
                          </div>
                        );
                      }
                      return (
                        <div
                          key={doc}
                          id={`doc-wrapper-${globalIdx}`}
                          tabIndex={0}
                          onKeyDown={(e) => handleDocumentKeyDown(e, globalIdx, "wrapper", false)}
                          onClick={() => !isViewMode && document.getElementById(`file-input-${globalIdx}`)?.click()}
                          onDragOver={(e) => handleDragOver(e, doc)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, doc, globalIdx)}
                          className={`group relative border-2 border-dashed rounded-xl p-3.5 flex flex-col items-center justify-center text-center h-full min-h-[115px] transition-all duration-300 outline-none overflow-hidden ${isDraggingHere
                            ? "border-indigo-500 bg-indigo-50/80 scale-[1.02]"
                            : "border-slate-200 bg-white/80 hover:border-indigo-400 hover:bg-white cursor-pointer focus:border-indigo-500 focus:ring-2 focus:ring-indigo-400"
                            }`}
                        >
                          <div className="bg-slate-50 text-slate-400 w-10 h-10 rounded-full flex items-center justify-center mb-2 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                            <FaCloudUploadAlt size={18} />
                          </div>

                          <span className="text-[12px] font-extrabold leading-tight mb-0.5 text-slate-700 group-hover:text-indigo-900">
                            {doc}
                          </span>

                          {!isViewMode && (
                            <span className="text-[10px] font-bold mt-0.5 text-indigo-500 opacity-0 -translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all">
                              Press Space to upload
                            </span>
                          )}
                          <span className="text-[9px] mt-1.5 font-medium tracking-wide text-slate-400 uppercase">
                            PDF, JPG, PNG
                          </span>

                          <input
                            id={`file-input-${globalIdx}`}
                            type="file"
                            className="hidden"
                            disabled={isViewMode}
                            onChange={(e) => {
                              handleFileAttach(e.target.files[0], doc, globalIdx, docGroupId);
                              e.target.value = null;
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {previewFile && previewUrl && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
            onClick={closePreview}
            onKeyDown={(e) => {
              if (e.key === "Escape" || (e.ctrlKey && e.key.toLowerCase() === "q")) {
                e.preventDefault();
                e.stopPropagation();
                closePreview();
              }
            }}
            tabIndex={0}
            ref={(el) => el && el.focus()}
          >
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden w-full max-w-5xl h-[85vh] flex flex-col outline-none" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center px-5 py-4 border-b bg-white/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm">
                    <FaPaperclip size={14} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 truncate max-w-md">{previewFile.name}</h3>
                    <p className="text-[10px] font-medium text-slate-500">{formatSize(previewFile.size)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100/80 px-2 py-1 rounded-md">Esc to Close</span>
                  <button type="button" className="text-slate-400 hover:text-rose-500 text-lg font-bold" onClick={closePreview}>✕</button>
                </div>
              </div>
              <div className="flex-1 overflow-auto p-6 flex items-center justify-center bg-slate-100/50">
                {previewFile.type.startsWith("image/") ? (
                  <img src={previewUrl} alt="preview" className="max-w-full max-h-full object-contain rounded-xl shadow-md" />
                ) : previewFile.type === "application/pdf" ? (
                  <iframe src={previewUrl} title="pdf" className="w-full h-full bg-white rounded-xl shadow-md" />
                ) : (
                  <div className="text-sm font-bold text-slate-500 flex flex-col items-center gap-3">
                    No preview available.
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