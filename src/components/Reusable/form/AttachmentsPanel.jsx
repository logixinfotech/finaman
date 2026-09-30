import { memo, useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import Swal from "sweetalert2";
import {
    FaFilePdf, FaFileImage, FaFileExcel, FaFileWord, FaFileAlt,
    FaEye, FaDownload, FaTrash, FaCloudUploadAlt,
} from "react-icons/fa";
import {
    getAttachments, uploadAttachment, deleteAttachment, fetchAttachmentBlob,
} from "../../../pages/Modules/QMS/Utils/QmsAPI";
import { confirmDelete, showToast, alertError } from "../../../components/Reusable/alert";

/* ------------------------------------------------------------------
   Toast fallback.
   If showToast is not actually exported from components/Reusable/alert,
   the import above resolves to undefined and the call does nothing at
   all - which is why a plain browser toast appeared instead. This
   wrapper always produces the SweetAlert toast.
------------------------------------------------------------------ */
const toast = (icon, title) => {
    if (typeof showToast === "function") {
        showToast({ icon, title });
        return;
    }
    Swal.fire({
        toast: true,
        position: "top-end",
        icon,
        title,
        showConfirmButton: false,
        timer: 2200,
        timerProgressBar: true,
        customClass: { popup: "text-[12px]" },
    });
};

const errorAlert = (title, text) => {
    if (typeof alertError === "function") {
        alertError(title, text);
        return;
    }
    Swal.fire({ icon: "error", title, text });
};

const ICON = (t = "") => {
    if (t.includes("pdf")) return <FaFilePdf className="text-[#c00000]" />;
    if (t.startsWith("image/")) return <FaFileImage className="text-[#1a56db]" />;
    if (t.includes("sheet") || t.includes("excel")) return <FaFileExcel className="text-[#1e7145]" />;
    if (t.includes("word")) return <FaFileWord className="text-[#2b579a]" />;
    return <FaFileAlt className="text-[#64748b]" />;
};

/* FileType can come back empty from the API, so fall back to the extension. */
const PREVIEWABLE = (file) => {
    const t = (file?.FileType || "").toLowerCase();
    if (t.includes("pdf") || t.startsWith("image/") || t.startsWith("text/")) return true;
    const ext = (file?.FileName || "").split(".").pop().toLowerCase();
    return ["pdf", "png", "jpg", "jpeg", "gif", "webp", "bmp", "svg", "txt", "csv"].includes(ext);
};

const MIME_BY_EXT = {
    pdf: "application/pdf", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg",
    gif: "image/gif", webp: "image/webp", bmp: "image/bmp", svg: "image/svg+xml",
    txt: "text/plain", csv: "text/csv",
};

const fmtSize = (kb) => (kb < 1024 ? `${kb} KB` : `${(kb / 1024).toFixed(1)} MB`);

const AttachmentPanel = memo(function AttachmentPanel({ moduleKey, recordId, recordNo, readOnly }) {
    const [files, setFiles] = useState([]);
    const [busy, setBusy] = useState(false);
    const [drag, setDrag] = useState(false);
    const [previewFile, setPreviewFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [previewKind, setPreviewKind] = useState("pdf");
    const inputRef = useRef(null);
    const urlRef = useRef(null);          // always holds the live object URL, for cleanup

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
                if (f.size > 25 * 1024 * 1024) {
                    errorAlert("File too large", `${f.name} exceeds 25 MB`);
                    continue;
                }
                await uploadAttachment(moduleKey, recordId, f, recordNo);
            }
            await load();
            toast("success", "Attachment uploaded");
        } catch (e) {
            errorAlert("Upload Error", e?.message || "Upload failed");
        } finally {
            setBusy(false);
        }
    }, [moduleKey, recordId, recordNo, load]);

    const closePreview = useCallback(() => {
        if (urlRef.current) {
            URL.revokeObjectURL(urlRef.current);
            urlRef.current = null;
        }
        setPreviewFile(null);
        setPreviewUrl(null);
    }, []);

    /* download = true  -> save the file
       download = false -> open in the in-page modal. Never window.open. */
    const openBlob = useCallback(async (f, download) => {
        try {
            const res = await fetchAttachmentBlob(f.Id);
            const ext = (f.FileName || "").split(".").pop().toLowerCase();
            const type =
                res.headers?.["content-type"] ||
                f.FileType ||
                MIME_BY_EXT[ext] ||
                "application/octet-stream";
            const url = URL.createObjectURL(new Blob([res.data], { type }));

            if (download) {
                const a = document.createElement("a");
                a.href = url;
                a.download = f.FileName;
                document.body.appendChild(a);
                a.click();
                a.remove();
                setTimeout(() => URL.revokeObjectURL(url), 1000);
                return;
            }

            if (urlRef.current) URL.revokeObjectURL(urlRef.current);
            urlRef.current = url;
            setPreviewKind(type.startsWith("image/") ? "image" : "frame");
            setPreviewFile(f);
            setPreviewUrl(url);
        } catch (e) {
            errorAlert("Preview Error", e?.message || "Could not open file");
        }
    }, []);

    const remove = useCallback(async (f) => {
        const ok = await confirmDelete({ title: `Remove "${f.FileName}"?`, confirmText: "Yes, remove" });
        if (!ok) return;
        try {
            await deleteAttachment(f.Id);
            await load();
            toast("success", "Attachment removed");
        } catch (e) {
            errorAlert("Delete Error", e?.message || "Failed to delete attachment");
        }
    }, [load]);

    /* Escape closes the modal, and the page behind it must not scroll. */
    useEffect(() => {
        if (!previewFile) return;
        const onKey = (e) => { if (e.key === "Escape") closePreview(); };
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", onKey);
        return () => {
            window.removeEventListener("keydown", onKey);
            document.body.style.overflow = prevOverflow;
        };
    }, [previewFile, closePreview]);

    /* Release the object URL if the component unmounts while open. */
    useEffect(() => () => {
        if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    }, []);

    if (!recordId) {
        return <p className="text-[10.5px] text-[#94aabf] italic text-center py-1.5">Save the record first</p>;
    }

    /* ----------------------------------------------------------------
       The modal is rendered into document.body through a portal.
       Rendering it inline keeps it inside the sidebar's stacking
       context: any ancestor with transform, filter, backdrop-filter,
       perspective, will-change, contain, isolation or opacity < 1
       creates that context, and then z-index only competes inside it -
       which is why the form panels painted over the modal no matter
       how high the z-index was set.
    ---------------------------------------------------------------- */
    const modal = previewFile ? createPortal(
        <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-[2147483000] bg-black/70 flex items-center justify-center p-6"
            onClick={closePreview}
        >
            <div
                className="bg-white rounded-[8px] w-full max-w-5xl h-[88vh] flex flex-col overflow-hidden shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#dde1ea] shrink-0">
                    <p className="text-[12.5px] font-bold text-[#1a202c] truncate">{previewFile.FileName}</p>
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            onClick={() => openBlob(previewFile, true)}
                            className="text-[11px] text-[#1a56db] hover:underline"
                        >
                            Download
                        </button>
                        <button
                            onClick={closePreview}
                            aria-label="Close preview"
                            className="text-[#64748b] hover:text-[#1a202c] text-[20px] leading-none px-1"
                        >
                            &times;
                        </button>
                    </div>
                </div>
                <div className="flex-1 min-h-0 bg-[#f3f4f6]">
                    {previewKind === "image" ? (
                        <img src={previewUrl} alt={previewFile.FileName} className="w-full h-full object-contain" />
                    ) : (
                        <iframe src={previewUrl} title={previewFile.FileName} className="w-full h-full border-0" />
                    )}
                </div>
            </div>
        </div>,
        document.body
    ) : null;

    return (
        <div className="flex flex-col gap-1.5 h-full">
            {!readOnly && (
                <div
                    onClick={() => inputRef.current?.click()}
                    onDragEnter={(e) => { e.preventDefault(); setDrag(true); }}
                    onDragOver={(e) => e.preventDefault()}
                    onDragLeave={() => setDrag(false)}
                    onDrop={(e) => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files); }}
                    className={`border-[1.5px] border-dashed rounded-[5px] py-[9px] text-center cursor-pointer transition-colors ${
                        drag ? "border-[#1a56db] bg-[#eef3fd]" : "border-[#c8d2e4] bg-[#fafbfd] hover:border-[#a0b0c8]"
                    }`}
                >
                    <FaCloudUploadAlt className="mx-auto text-[15px] text-[#8b9ab5]" />
                    <p className="text-[11px] text-[#5b6b85] font-medium mt-1">
                        {busy ? "Uploading…" : "Drag & drop files here"}
                    </p>
                    <p className="text-[9.5px] text-[#94aabf] mt-[1px]">or click to browse · Max 25 MB</p>
                    <input
                        ref={inputRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }}
                    />
                </div>
            )}

            {files.length === 0 && (
                <p className="text-[10.5px] text-[#94aabf] italic text-center py-1.5">No attachments</p>
            )}

            <div className="flex flex-col gap-1 flex-1 min-h-0 overflow-y-auto scrollbar-hide">
                {files.map((f) => (
                    <div
                        key={f.Id}
                        className="group flex items-center gap-1.5 border border-[#eef1f7] rounded-[4px] px-1.5 py-[5px] hover:bg-[#fafbfd]"
                    >
                        <span className="text-[13px] shrink-0">{ICON(f.FileType)}</span>
                        <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-semibold text-[#1a202c] truncate" title={f.FileName}>
                                {f.FileName}
                            </p>
                            <p className="text-[9.5px] text-[#5b6b85]">{fmtSize(f.FileSizeKB)} · {f.UploadedBy}</p>
                        </div>
                        <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                            {PREVIEWABLE(f) && (
                                <button
                                    type="button"
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); openBlob(f, false); }}
                                    title="View"
                                    className="p-0.5 text-[#64748b] hover:text-[#1a56db]"
                                >
                                    <FaEye className="text-[11px]" />
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); openBlob(f, true); }}
                                title="Download"
                                className="p-0.5 text-[#64748b] hover:text-[#1a56db]"
                            >
                                <FaDownload className="text-[11px]" />
                            </button>
                            {!readOnly && (
                                <button
                                    type="button"
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); remove(f); }}
                                    title="Remove"
                                    className="p-0.5 text-[#94aabf] hover:text-[#c00000]"
                                >
                                    <FaTrash className="text-[10px]" />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {modal}
        </div>
    );
});

export default AttachmentPanel;