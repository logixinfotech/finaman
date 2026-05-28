import React, { useState, useEffect, useCallback, useRef } from "react";
import PdfView from "./PdfView";

const FONT = `'Inter', 'Tahoma', system-ui, sans-serif`;

const STATUS_STYLES = {
    Pending: { bg: "bg-[#FAEEDA]", text: "text-[#633806]" },
    Approved: { bg: "bg-[#EAF3DE]", text: "text-[#27500A]" },
    Rejected: { bg: "bg-[#FCEBEB]", text: "text-[#791F1F]" },
    Hold: { bg: "bg-[#E6F1FB]", text: "text-[#0C447C]" },
    Draft: { bg: "bg-[#F1EFE8]", text: "text-[#444441]" },
};

const StatusPill = ({ status }) => {
    const s = STATUS_STYLES[status] ?? STATUS_STYLES.Draft;
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ${s.bg} ${s.text}`}>
            {status ?? "—"}
        </span>
    );
}; 
const Section = ({ title, extra, children, noPad = false }) => (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mb-3">
        {title && (
            <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-100">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{title}</span>
                {extra}
            </div>
        )}
        {noPad ? children : <div className="px-3 py-2">{children}</div>}
    </div>
);

// ─── Compact info row ─────────────────────────────────────────────────────────
const InfoRow = ({ label, value, children }) => (
    <div className="flex items-start justify-between gap-2 py-1.5 border-b border-slate-100 last:border-0">
        <span className="text-[12px] text-slate-400 shrink-0">{label}</span>
        <span className="text-[13px] font-medium text-slate-800 text-right break-words max-w-[65%]">
            {children ?? (value != null && value !== "" ? String(value) : "—")}
        </span>
    </div>
);

// ── DB se jo path aata hai usse full URL banao ────────────────────────────────
const BASE_URL = "http://122.160.143.110:63554";

const resolveAttachUrl = (raw) => {
    if (!raw) return null;
    if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
    if (raw.startsWith("/")) return `${BASE_URL}${raw}`;
    return raw;
};

const isImageUrl = (url) => !!url && /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|$)/i.test(url);

// ─── Attachment pane (sits INSIDE the layout, beside / above the form) ────────
const AttachPane = ({ url, onExpand }) => {
    if (!url) return null;

    return (
        <div className="relative w-full h-full bg-slate-200">
            {onExpand && (
                <button
                    onClick={onExpand}
                    className="absolute top-2 right-2 z-10 flex items-center gap-1 text-[11px]
                               bg-slate-900/80 text-white px-2 py-1 rounded-md active:bg-slate-900 transition-colors"
                >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" />
                        <line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" />
                    </svg>
                    Expand
                </button>
            )}
            {isImageUrl(url) ? (
                <div className="w-full h-full overflow-auto flex items-center justify-center p-2">
                    <img src={url} alt="" className="max-w-full max-h-full object-contain" />
                </div>
            ) : (
                <PdfView url={url} />
            )}
        </div>
    );
};

// ─── Fullscreen viewer (Expand button) ───────────────────────────────────────
const AttachViewer = ({ url, onClose, isMobile }) => {
    const fileName = url ? url.split("/").pop().split("?")[0] : "";

    useEffect(() => {
        const h = (e) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", h);
        return () => window.removeEventListener("keydown", h);
    }, [onClose]);

    return (
        <div
            className={`flex flex-col bg-slate-900 overflow-hidden ${isMobile ? "fixed inset-0 z-50" : "absolute inset-0 z-30"
                }`}
            style={isMobile ? {
                height: "100dvh",
                paddingTop: "env(safe-area-inset-top)",
                paddingBottom: "env(safe-area-inset-bottom)",
            } : undefined}
        >
            {/* Viewer header */}
            <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-800 shrink-0">
                <button
                    onClick={onClose}
                    className="flex items-center gap-1 text-slate-200 hover:text-white text-[13px]
                               px-2 py-1.5 rounded-md hover:bg-slate-700 transition-colors"
                    style={{ minHeight: "40px" }}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                    Back
                </button>
                <span className="text-[12px] text-slate-300 truncate flex-1">{fileName}</span>
                <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-slate-300 hover:text-white flex items-center gap-1
                               px-2 py-1 rounded hover:bg-slate-700 transition-colors"
                >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                        <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                    Open
                </a>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
                {isImageUrl(url) ? (
                    <div className="w-full h-full overflow-auto flex items-center justify-center">
                        <img src={url} alt={fileName} className="max-w-full max-h-full object-contain p-4" />
                    </div>
                ) : (
                    <PdfView url={url} />
                )}
            </div>
        </div>
    );
};

// ─── Action input field ───────────────────────────────────────────────────────
const ActionField = ({ label, required, error, children }) => (
    <div className="flex flex-col gap-0.5">
        <label className="text-[12px] text-slate-500">
            {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        {children}
        {error && <p className="text-[11px] text-red-500">{error}</p>}
    </div>
);

// ─── Main form ─────────────────────────────────────────────────────────────────
const POApprovalForm = ({
    formData,
    setFormData,
    mode = "view",
    saving,
    saveBtnRef,
    onAction,
    onCancel,
    onModify,
    onEditCancel,
    currentRecord,
    totalRecords,
    rights,
    onNavigate,
    isMobile = false,
}) => {
    const isViewMode = mode === "view";

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const timeStr = now.toTimeString().slice(0, 5);

    const [appDate, setAppDate] = useState(todayStr);
    const [appTime, setAppTime] = useState(timeStr);
    const [remark, setRemark] = useState("");
    const [errors, setErrors] = useState({});
    const [fullscreen, setFullscreen] = useState(false);
    const firstInputRef = useRef(null);

    // ── Parse attach field → array of resolved URLs ───────────────────────────
    const attachments = (() => {
        const raw = formData?.attach;
        if (!raw) return [];
        if (Array.isArray(raw)) return raw.filter(Boolean).map(resolveAttachUrl);
        try {
            const p = JSON.parse(raw);
            return Array.isArray(p) ? p.filter(Boolean).map(resolveAttachUrl) : [resolveAttachUrl(raw)];
        } catch { return [resolveAttachUrl(raw)]; }
    })();

    const attachUrl = attachments[0] || null;   // single attachment
    const hasAttach = !!attachUrl;

    // ── Reset on record change ────────────────────────────────────────────────
    useEffect(() => {
        setAppDate(todayStr);
        setAppTime(timeStr);
        setRemark("");
        setErrors({});
        setFullscreen(false);
    }, [formData?.approval_id]);

    useEffect(() => {
        if (!isViewMode && firstInputRef.current) firstInputRef.current.focus();
    }, [isViewMode]);

    // ── Make the phone's hardware / gesture "back" close the fullscreen viewer ─
    useEffect(() => {
        if (!fullscreen) return;
        window.history.pushState({ poViewer: true }, "");
        const onPop = () => setFullscreen(false);
        window.addEventListener("popstate", onPop);
        return () => {
            window.removeEventListener("popstate", onPop);
            // closed via the on-screen Back button → pop the entry we added
            if (window.history.state?.poViewer) window.history.back();
        };
    }, [fullscreen]);

    // ── Enter / Backspace navigation between inputs ───────────────────────────
    const handleKeyDown = useCallback((e) => {
        const container = document.getElementById("po-action-form");
        if (!container) return;
        const els = Array.from(
            container.querySelectorAll("input:not([disabled]), textarea:not([disabled])")
        ).filter(el => !el.disabled);
        const idx = els.findIndex(el => el === document.activeElement);
        if (e.key === "Enter") {
            e.preventDefault();
            if (idx < els.length - 1) els[idx + 1].focus();
            else saveBtnRef?.current?.focus();
        }
        if (e.key === "Backspace" && idx > 0) {
            const isEmpty = e.target.value === "";
            const atStart = e.target.selectionStart === 0 && e.target.selectionEnd === 0;
            if (isEmpty || atStart) { e.preventDefault(); els[idx - 1].focus(); }
        }
    }, [saveBtnRef]);

    const submit = (status) => {
        const errs = {};
        if (!remark.trim()) errs.remark = "Remark is required";
        if (!appDate) errs.appDate = "Required";
        if (!appTime) errs.appTime = "Required";
        if (Object.keys(errs).length) {
            setErrors(errs);
            setTimeout(() => {
                const el = document.querySelector(`[name="${Object.keys(errs)[0]}"]`);
                if (el) el.focus();
            }, 50);
            return;
        }
        onAction(formData.approval_id, {
            status,
            app_remark: remark.trim(),
            approved_at: `${appDate}T${appTime}:00`,
        });
    };

    const submitUnapprove = () => {
        if (!remark.trim()) {
            setErrors({ remark: "Remark is required to revert" });
            return;
        }
        onAction(formData.approval_id, {
            status: "Pending",
            app_remark: remark.trim(),
            approved_at: `${appDate}T${appTime}:00`,
        });
    };

    const isPending = !formData?.status || formData.status === "Pending" || formData.status === "Draft";
    const isActioned = ["Approved", "Rejected", "Hold"].includes(formData?.status);

    const inputCls = (field) =>
        `h-9 px-2.5 text-[13px] border rounded-lg outline-none focus:border-[#378ADD] transition-colors w-full ${errors[field] ? "border-red-400 bg-red-50" : "border-slate-200 bg-white"
        }`; 
    const actionPanel = (
        <div id="po-action-form" className="px-3 py-3">
            {isActioned && (
                <Section title="Previous decision">
                    <InfoRow label="Status" value={formData?.status} />
                    <InfoRow label="At" value={formData?.approved_at || "—"} />
                    <InfoRow label="Remark" value={formData?.app_remark || "—"} />
                </Section>
            )}

            <Section title={isPending ? "Your action" : "Revert decision"}>
                <div className="flex flex-col gap-3"> 
                    
                    <ActionField label="Remark" required error={errors.remark}>
                        <textarea                        
                            name="remark"
                            ref={firstInputRef}
                            rows={isMobile ? 2 : 3}
                            placeholder={isPending
                                ? "Add your remark before taking action…"
                                : "Reason for reverting this decision…"}
                            value={remark}
                            onChange={e => { setRemark(e.target.value); setErrors(p => ({ ...p, remark: null })); }}
                            onKeyDown={handleKeyDown}
                            className={`px-2.5 py-2 text-[13px] border rounded-lg resize-none outline-none
                                        focus:border-[#378ADD] transition-colors w-full ${errors.remark ? "border-red-400 bg-red-50" : "border-slate-200 bg-white"
                                }`}
                        />
                    </ActionField>

                    {/* Action buttons */}
                    {isPending ? (
                        <div className="flex gap-2">
                            <button
                                ref={saveBtnRef}
                                onClick={() => submit("Approved")}
                                disabled={saving}
                                className="flex-1 h-10 flex items-center justify-center gap-1.5 rounded-xl
                                           text-[13px] font-medium bg-[#EAF3DE] text-[#27500A]
                                           hover:bg-[#C0DD97] active:bg-[#C0DD97] disabled:opacity-50 transition-colors"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                                Approve
                            </button>
                            <button
                                onClick={() => submit("Hold")}
                                disabled={saving}
                                className="flex-1 h-10 flex items-center justify-center gap-1.5 rounded-xl
                                           text-[13px] font-medium bg-[#E6F1FB] text-[#0C447C]
                                           hover:bg-[#B5D4F4] active:bg-[#B5D4F4] disabled:opacity-50 transition-colors"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
                                </svg>
                                Hold
                            </button>
                            <button
                                onClick={() => submit("Rejected")}
                                disabled={saving}
                                className="flex-1 h-10 flex items-center justify-center gap-1.5 rounded-xl
                                           text-[13px] font-medium bg-[#FCEBEB] text-[#791F1F]
                                           hover:bg-[#F7C1C1] active:bg-[#F7C1C1] disabled:opacity-50 transition-colors"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                                Reject
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={submitUnapprove}
                            disabled={saving}
                            className="w-full h-10 flex items-center justify-center gap-2 rounded-xl
                                       text-[13px] font-medium border border-slate-300 bg-white text-slate-600
                                       hover:bg-slate-50 active:bg-slate-100 disabled:opacity-50 transition-colors"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="1 4 1 10 7 10" />
                                <path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
                            </svg>
                            Revert to Pending
                        </button>
                    )}
                </div>
            </Section>

            {isMobile && <div className="h-4" />}
        </div>
    ); 
    return (
        <div className="relative w-full h-full flex flex-col bg-slate-100" style={{ fontFamily: FONT }}> 
            {fullscreen && hasAttach && (
                <AttachViewer
                    url={attachUrl}
                    onClose={() => setFullscreen(false)}
                    isMobile={isMobile}
                />
            )} 
            {!isMobile && (
                <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-slate-200 shrink-0">
                    <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[13px] font-medium text-slate-700 truncate">
                            {formData?.key_doc_no ?? "—"}
                        </span>
                        {formData?.type && (
                            <span className="text-[11px] text-slate-400 hidden sm:inline truncate">
                                · {formData.type}
                            </span>
                        )}
                        <StatusPill status={formData?.status} />
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[11px] text-slate-400">{currentRecord}/{totalRecords}</span>
                        <button
                            onClick={() => onNavigate?.(-1)}
                            disabled={currentRecord <= 1}
                            className="w-7 h-7 flex items-center justify-center rounded-md border border-slate-200
                                       text-slate-500 hover:bg-slate-50 disabled:opacity-30 transition-colors"
                            title="Previous"
                        >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                <polyline points="15 18 9 12 15 6" />
                            </svg>
                        </button>
                        <button
                            onClick={() => onNavigate?.(1)}
                            disabled={currentRecord >= totalRecords}
                            className="w-7 h-7 flex items-center justify-center rounded-md border border-slate-200
                                       text-slate-500 hover:bg-slate-50 disabled:opacity-30 transition-colors"
                            title="Next"
                        >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                <polyline points="9 18 15 12 9 6" />
                            </svg>
                        </button>
                    </div>
                </div>
            )} 
 
            <div className={`flex-1 min-h-0 flex ${isMobile ? "flex-col" : "flex-row"}`}> 
                {hasAttach && (
                    <div className={isMobile
                        ? "h-[42vh] shrink-0 border-b border-slate-200"
                        : "flex-1 min-w-0 border-r border-slate-200"}>
                        <AttachPane url={attachUrl} onExpand={() => setFullscreen(true)} />
                    </div>
                )} 
                <div className={`overflow-y-auto bg-slate-100 ${isMobile ? "flex-1" : hasAttach ? "w-[380px] shrink-0" : "flex-1"
                    }`}>
                    {hasAttach
                        ? actionPanel
                        : <div className="max-w-2xl mx-auto">{actionPanel}</div>}
                </div>
            </div>

        </div>
    );
};

export default POApprovalForm;
