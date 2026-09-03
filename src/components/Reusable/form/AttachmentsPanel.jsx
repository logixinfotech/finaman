import { memo, useState, useEffect, useCallback, useRef } from "react";
import { FaFilePdf, FaFileImage, FaFileExcel, FaFileWord, FaFileAlt, FaEye, FaDownload, FaTrash, FaCloudUploadAlt } from "react-icons/fa";
import { getAttachments, uploadAttachment, deleteAttachment, fetchAttachmentBlob } from "../../../pages/Modules/QMS/Utils/QmsAPI";

const ICON = (t = "") => {
    if (t.includes("pdf")) return <FaFilePdf className="text-[#c00000]" />;
    if (t.startsWith("image/")) return <FaFileImage className="text-[#1a56db]" />;
    if (t.includes("sheet") || t.includes("excel")) return <FaFileExcel className="text-[#1e7145]" />;
    if (t.includes("word")) return <FaFileWord className="text-[#2b579a]" />;
    return <FaFileAlt className="text-[#64748b]" />;
};

const PREVIEWABLE = (t = "") =>
    t.includes("pdf") || t.startsWith("image/") || t.startsWith("text/");

const fmtSize = (kb) => (kb < 1024 ? `${kb} KB` : `${(kb / 1024).toFixed(1)} MB`);

const AttachmentPanel = memo(function AttachmentPanel({ moduleKey, recordId, recordNo, readOnly }) {
    const [files, setFiles] = useState([]);
    const [busy, setBusy] = useState(false);
    const [drag, setDrag] = useState(false);
    const inputRef = useRef(null);

    const load = useCallback(async () => {
        if (!moduleKey || !recordId) { setFiles([]); return; }
        try {
            const res = await getAttachments(moduleKey, recordId);
            setFiles(res?.data || []);
        } catch { setFiles([]); }
    }, [moduleKey, recordId]);

    useEffect(() => { load(); }, [load]);

    const addFiles = useCallback(async (list) => {
        if (!recordId || !list?.length) return;
        setBusy(true);
        try {
            for (const f of Array.from(list)) {
                if (f.size > 25 * 1024 * 1024) { alert(`${f.name} exceeds 25 MB`); continue; }
                await uploadAttachment(moduleKey, recordId, f, recordNo);
            }
            await load();
        } catch (e) { alert(e?.message || "Upload failed"); }
        finally { setBusy(false); }
    }, [moduleKey, recordId, recordNo, load]);

    const openBlob = useCallback(async (f, download) => {
        try {
            const res = await fetchAttachmentBlob(f.Id);
            const type = res.headers?.["content-type"] || f.FileType || "application/octet-stream";
            const url = URL.createObjectURL(new Blob([res.data], { type }));
            if (download) {
                const a = document.createElement("a");
                a.href = url; a.download = f.FileName;
                document.body.appendChild(a); a.click(); a.remove();
                URL.revokeObjectURL(url);
            } else {
                window.open(url, "_blank");
                setTimeout(() => URL.revokeObjectURL(url), 60000);
            }
        } catch { alert("Could not open file"); }
    }, []);

    const remove = useCallback(async (f) => {
        if (!window.confirm(`Remove "${f.FileName}"?`)) return;
        try { await deleteAttachment(f.Id); await load(); }
        catch (e) { alert(e?.message || "Delete failed"); }
    }, [load]);

    if (!recordId) {
        return <p className="text-[10.5px] text-[#94aabf] italic text-center py-1.5">Save the record first</p>;
    }

    return (
        <div className="flex flex-col gap-1.5 h-full">
            {!readOnly && (
                <div
                    onClick={() => inputRef.current?.click()}
                    onDragEnter={(e) => { e.preventDefault(); setDrag(true); }}
                    onDragOver={(e) => e.preventDefault()}
                    onDragLeave={() => setDrag(false)}
                    onDrop={(e) => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files); }}
                    className={`border-[1.5px] border-dashed rounded-[5px] py-[9px] text-center cursor-pointer transition-colors ${drag ? "border-[#1a56db] bg-[#eef3fd]" : "border-[#c8d2e4] bg-[#fafbfd] hover:border-[#a0b0c8]"
                        }`}
                >
                    <FaCloudUploadAlt className="mx-auto text-[15px] text-[#8b9ab5]" />
                    <p className="text-[11px] text-[#5b6b85] font-medium mt-1">
                        {busy ? "Uploading…" : "Drag & drop files here"}
                    </p>
                    <p className="text-[9.5px] text-[#94aabf] mt-[1px]">or click to browse · Max 25 MB</p>
                    <input ref={inputRef} type="file" multiple className="hidden"
                        onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
                </div>
            )}

            {files.length === 0 && (
                <p className="text-[10.5px] text-[#94aabf] italic text-center py-1.5">No attachments</p>
            )}

            <div className="flex flex-col gap-1 flex-1 min-h-0 overflow-y-auto scrollbar-hide">
                {files.map((f) => (
                    <div key={f.Id} className="group flex items-center gap-1.5 border border-[#eef1f7] rounded-[4px] px-1.5 py-[5px] hover:bg-[#fafbfd]">
                        <span className="text-[13px] shrink-0">{ICON(f.FileType)}</span>
                        <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-semibold text-[#1a202c] truncate" title={f.FileName}>{f.FileName}</p>
                            <p className="text-[9.5px] text-[#5b6b85]">{fmtSize(f.FileSizeKB)} · {f.UploadedBy}</p>                        </div>
                        <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                            {PREVIEWABLE(f.FileType) && (
                                <button onClick={() => openBlob(f, false)} title="View"
                                    className="p-0.5 text-[#64748b] hover:text-[#1a56db]"><FaEye className="text-[11px]" /></button>
                            )}
                            <button onClick={() => openBlob(f, true)} title="Download"
                                className="p-0.5 text-[#64748b] hover:text-[#1a56db]"><FaDownload className="text-[11px]" /></button>
                            {!readOnly && (
                                <button onClick={() => remove(f)} title="Remove"
                                    className="p-0.5 text-[#94aabf] hover:text-[#c00000]"><FaTrash className="text-[10px]" /></button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
});

export default AttachmentPanel;