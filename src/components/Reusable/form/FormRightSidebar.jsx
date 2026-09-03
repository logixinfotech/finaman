import { useRef, useEffect, useState, useCallback } from "react";
import { useERPFormMeta, useERPFormData } from "../../../theme/ERPFormContext";
import { FaFileAlt, FaEye, FaDownload, FaCloudUploadAlt, FaTrash } from "react-icons/fa";
import { getAttachments, uploadAttachment, deleteAttachment, fetchAttachmentBlob } from "../../../pages/Modules/QMS/Utils/QmsAPI";

export default function FormRightSidebar() {
  const { rightSidebarConfig, isViewMode, moduleKey } = useERPFormMeta();
  const { formData } = useERPFormData();
  const fileInputRef = useRef(null);
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);

  const recordId = formData.Id;   // 🆕 koi hook nahi hai — return se pehle rakhna safe hai

const loadAttachments = useCallback(async () => {
  if (!moduleKey || !recordId) { setAttachments([]); return; }
  try {
    const res = await getAttachments(moduleKey, recordId);
    setAttachments(res?.data || []);
  } catch { setAttachments([]); }
}, [moduleKey, recordId]);

  useEffect(() => { loadAttachments(); }, [loadAttachments]);   // 🆕 ab unconditionally call hota hai

  if (!rightSidebarConfig) return null;   // 🆕 return ab saare hooks ke BAAD

  const { summaryFields = [], severityGuide = [], showAttachments = false } = rightSidebarConfig;

const handleFilesAdd = async (files) => {
  if (!recordId) {alert("Please save the record first. Only then can you upload an attachment."); return; }
  setLoading(true);
  for (const file of Array.from(files)) {
    await uploadAttachment(moduleKey, recordId, file);
  }
  await loadAttachments();
  setLoading(false);
};

const removeFile = async (id) => {
  await deleteAttachment(id);
  await loadAttachments();
};

  const fmtSize = (kb) => kb < 1024 ? `${kb} KB` : `${(kb / 1024).toFixed(1)} MB`;
const openFile = async (f) => {
    try {
      const res = await fetchAttachmentBlob(f.Id);
      const url = URL.createObjectURL(new Blob([res.data], { type: f.FileType }));
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch { alert("Could not open file"); }
  };

  const downloadFile = async (f) => {
    try {
      const res = await fetchAttachmentBlob(f.Id);
      const url = URL.createObjectURL(new Blob([res.data], { type: f.FileType }));
      const a = document.createElement("a");
      a.href = url;
      a.download = f.FileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch { alert("Could not download file"); }
  };

  return (
    <div className="w-full md:w-[260px] bg-white border-l border-[#dde1ea] flex flex-col overflow-y-auto overflow-x-hidden shrink-0 p-2.5 gap-2.5">

      {summaryFields.length > 0 && (
        <div className="bg-white border border-[#dde1ea] rounded-[6px] shadow-sm overflow-hidden shrink-0">
          <div className="px-3 py-2 bg-[#eef4ff] border-b border-[#dde1ea]">
            <h3 className="text-[11px] font-bold tracking-[0.4px] text-[#1a56db] uppercase">Summary</h3>
          </div>
          <div className="p-3 flex flex-col gap-1.5">
            {summaryFields.map((f) => (
              <div key={f.key} className="flex justify-between items-center border-b border-[#f0f2f7] pb-1 last:border-0 last:pb-0">
                <span className="text-[#718096] text-[11px]">{f.label}</span>
                <span className={`font-bold text-[11px] truncate max-w-[130px] ${f.badge ? "px-1.5 py-0.5 rounded-full text-white" : "text-[#1a202c]"}`}
                      style={f.badge ? { backgroundColor: f.badgeColor?.(formData[f.key]) || "#64748b" } : {}}>
                  {formData[f.key] || "—"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {severityGuide.length > 0 && (
        <div className="bg-white border border-[#dde1ea] rounded-[6px] shadow-sm overflow-hidden shrink-0">
          <div className="px-3 py-2 bg-[#eef4ff] border-b border-[#dde1ea]">
            <h3 className="text-[11px] font-bold tracking-[0.4px] text-[#1a56db] uppercase">Severity Guide</h3>
          </div>
          <div className="p-3 flex flex-col gap-1.5">
            {severityGuide.map((s) => (
              <div key={s.label} className="flex items-center gap-2">
                <span className="w-[8px] h-[8px] rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                <span className="text-[10.5px] font-semibold text-[#1a202c] w-[70px] shrink-0">{s.label}</span>
                <span className="text-[10px] text-[#718096]">{s.desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {showAttachments && (
        <div className="bg-white border border-[#dde1ea] rounded-[6px] shadow-sm overflow-hidden shrink-0 flex-1">
          <div className="px-3 py-2 bg-[#eef4ff] border-b border-[#dde1ea]">
            <h3 className="text-[11px] font-bold tracking-[0.4px] text-[#1a56db] uppercase">Attachments</h3>
          </div>
          <div className="p-3 flex flex-col gap-2 min-h-0">
            {!recordId && (
              <p className="text-[10.5px] text-[#94aabf] italic">Please save the record first. Only then can you upload an attachment..</p>
            )}
            {recordId && !isViewMode && (
              <div
                className="border-2 border-dashed border-[#c8d2e4] rounded-[6px] p-3 text-center cursor-pointer hover:border-[#1a56db] transition-colors"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); handleFilesAdd(e.dataTransfer.files); }}
              >
                <FaCloudUploadAlt className="mx-auto text-[18px] text-[#94aabf] mb-1" />
                <p className="text-[10.5px] text-[#718096]">
                  {loading ? "Uploading…" : <>Drag & drop files here<br />or click to browse</>}
                </p>
                <p className="text-[9px] text-[#94aabf] mt-0.5">Max file size: 25MB</p>
                <input type="file" multiple className="hidden" ref={fileInputRef}
                  onChange={(e) => { handleFilesAdd(e.target.files); e.target.value = ""; }} />
              </div>
            )}

            <div className="flex flex-col gap-2 overflow-y-auto max-h-[240px] pr-0.5 scrollbar-hide">
            {attachments.map((f) => (
              <div key={f.Id} className="flex items-center gap-2 border border-[#eef1f7] rounded-[5px] p-1.5">
                <FaFileAlt className="text-[#1a56db] text-[14px] shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10.5px] font-semibold text-[#1a202c] truncate">{f.FileName}</p>
                  <p className="text-[9px] text-[#94aabf]">{fmtSize(f.FileSizeKB)}</p>
                </div>
               <button onClick={() => openFile(f)} title="View" className="text-[#64748b] hover:text-[#1a56db] shrink-0"><FaEye className="text-[12px]" /></button>
                <button onClick={() => downloadFile(f)} title="Download" className="text-[#64748b] hover:text-[#1a56db] shrink-0"><FaDownload className="text-[12px]" /></button>
                {!isViewMode && (
                  <button onClick={() => removeFile(f.Id)} className="text-[#64748b] hover:text-red-600"><FaTrash className="text-[11px]" /></button>
                )}
              </div>
            ))}
          </div>
        </div>
          </div>
      )}
    </div>
  );
}