import { useState, useCallback, useEffect, useRef } from "react";
import ERPHeader from "../../../../../components/Reusable/form/HeaderForm";
import ERPFooter from "../../../../../components/Reusable/form/FooterForm";
import ERPDateInput from "../../../../../components/Reusable/input/Date";
import ERPAutocomplete from "../../../../../components/Reusable/input/ERPAutocomplete";
import { getActledList } from "../../../../../utils/api";
import { focusFirstInput, handleERPEnterNavigation } from "../../../../../utils/erpShortcuts";

/* ── Constants ───────────────────────────────────────────────────────────── */
const F = "'Inter','Segoe UI',system-ui,sans-serif";

const TYPE_CONFIG = {
    INCREMENT: {
        label: "Increment",
        accent: "#059669", dot: "#10b981",
        badge: { bg: "#d1fae5", text: "#065f46" },
        heroBg: "linear-gradient(135deg,#ecfdf5 0%,#a7f3d0 100%)",
        heroBorder: "#6ee7b7",
        fields: ["emp_id", "amount", "effective_date", "approved_by", "remarks"],
    },
    BONUS: {
        label: "Bonus",
        accent: "#2563eb", dot: "#3b82f6",
        badge: { bg: "#dbeafe", text: "#1e40af" },
        heroBg: "linear-gradient(135deg,#eff6ff 0%,#bfdbfe 100%)",
        heroBorder: "#93c5fd",
        fields: ["emp_id", "amount", "month_year", "approved_by", "remarks"],
    },
    INSTALLMENT_DEDUCTION: {
        label: "Installment",
        accent: "#d97706", dot: "#f59e0b",
        badge: { bg: "#fef3c7", text: "#92400e" },
        heroBg: "linear-gradient(135deg,#fffbeb 0%,#fde68a 100%)",
        heroBorder: "#fcd34d",
        fields: ["emp_id", "amount", "month_year", "installment_no", "total_installments", "approved_by", "remarks"],
    },
    APPRAISAL: {
        label: "Appraisal",
        accent: "#7c3aed", dot: "#8b5cf6",
        badge: { bg: "#ede9fe", text: "#4c1d95" },
        heroBg: "linear-gradient(135deg,#faf5ff 0%,#ddd6fe 100%)",
        heroBorder: "#c4b5fd",
        fields: ["emp_id", "rating", "remarks"],
    },
};

const STATUS_OPTIONS = ["Pending", "Approved", "Rejected", "Applied", "Paid"];
const RATING_OPTIONS = ["A+", "A", "B+", "B", "C", "D"];

const STATUS_CFG = {
    Pending: { bg: "#fef3c7", text: "#92400e", dot: "#f59e0b" },
    Approved: { bg: "#d1fae5", text: "#065f46", dot: "#10b981" },
    Applied: { bg: "#dbeafe", text: "#1e40af", dot: "#3b82f6" },
    Paid: { bg: "#dcfce7", text: "#14532d", dot: "#16a34a" },
    Rejected: { bg: "#fee2e2", text: "#991b1b", dot: "#ef4444" },
};

const RATING_LABEL = {
    "A+": "Outstanding", A: "Excellent", "B+": "Very Good",
    B: "Good", C: "Average", D: "Below Average",
};

const APPROVAL_STEPS = [
    { key: "created", label: "Created", done: () => true },
    { key: "pending", label: "Pending approval", done: (s) => ["Approved", "Applied", "Paid"].includes(s) },
    { key: "apply", label: "Applied to payroll", done: (s) => ["Applied", "Paid"].includes(s) },
    { key: "disbursed", label: "Disbursed", done: (s) => s === "Paid" },
];

const AVATAR_PAL = [
    { bg: "#dbeafe", text: "#1e40af" }, { bg: "#ede9fe", text: "#4c1d95" },
    { bg: "#d1fae5", text: "#065f46" }, { bg: "#fef3c7", text: "#92400e" },
    { bg: "#ffe4e6", text: "#9f1239" },
];
const avatarSt = (n = "") => AVATAR_PAL[(n.charCodeAt(0) || 0) % AVATAR_PAL.length];
const initials = (n = "") => n.split(" ").slice(0, 2).map(w => w[0]?.toUpperCase()).join("") || "?";

/* ── Tiny helpers ────────────────────────────────────────────────────────── */
const SLabel = ({ children }) => (
    <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#9ca3b0", marginBottom: 6 }}>
        {children}
    </p>
);

const InfoRow = ({ label, value, last }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: last ? "none" : "1px solid #f5f6fa" }}>
        <span style={{ fontSize: 11, color: "#9ca3b0" }}>{label}</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: "#374151" }}>{value}</span>
    </div>
);

/* ════════════════════════════════════════════════════════════════════════════
   RIGHT PANEL — Detail Preview, split into 2 columns, no scroll
═══════════════════════════════════════════════════════════════════════════════ */
const DetailPreview = ({ formData, mode, onDelete, rights }) => {
    const tc = TYPE_CONFIG[formData.transaction_type] || TYPE_CONFIG.INCREMENT;
    const sc = STATUS_CFG[formData.status] || STATUS_CFG.Pending;
    const av = avatarSt(formData.emp_name || "");

    const showProgress =
        formData.transaction_type === "INSTALLMENT_DEDUCTION" &&
        formData.installment_no && formData.total_installments;
    const pct = showProgress
        ? Math.min(Math.round((+formData.installment_no / +formData.total_installments) * 100), 100) : 0;

    return (
        <div style={{ height: "100%", display: "flex", flexDirection: "column", padding: "12px 14px", gap: 10, overflow: "hidden", fontFamily: F }}>

            {/* ── Hero card (full width across both cols) ─────────────────────── */}
            <div style={{ borderRadius: 12, overflow: "hidden", border: `1px solid ${tc.heroBorder}`, flexShrink: 0 }}>
                <div style={{ background: tc.heroBg, padding: "12px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        {/* Employee */}
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{
                                width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                                background: formData.emp_name ? av.bg : "#f0f2f7",
                                color: formData.emp_name ? av.text : "#c4c9d9",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 12, fontWeight: 800,
                                border: `2px solid ${tc.heroBorder}`,
                            }}>
                                {formData.emp_name ? initials(formData.emp_name) : "?"}
                            </div>
                            <div>
                                <p style={{ fontSize: 13, fontWeight: 700, color: "#1f2937", lineHeight: 1.2 }}>
                                    {formData.emp_name || <span style={{ color: "#c4c9d9", fontStyle: "italic", fontWeight: 400, fontSize: 11 }}>No employee</span>}
                                </p>
                                {formData.emp_id && (
                                    <p style={{ fontSize: 9, fontWeight: 700, color: tc.accent, fontFamily: "monospace", marginTop: 1 }}>
                                        EMP-{String(formData.emp_id).padStart(4, "0")}
                                    </p>
                                )}
                            </div>
                        </div>
                        {/* Badges */}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                            <span style={{ fontSize: 9, fontWeight: 800, padding: "3px 8px", borderRadius: 20, background: sc.bg, color: sc.text }}>
                                {formData.status || "Pending"}
                            </span>
                            <span style={{ fontSize: 8, fontWeight: 800, padding: "2px 6px", borderRadius: 20, background: tc.badge.bg, color: tc.badge.text, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                                {tc.label}
                            </span>
                        </div>
                    </div>

                    {/* Amount / Rating */}
                    <div style={{ marginTop: 10 }}>
                        {formData.transaction_type !== "APPRAISAL" ? (
                            formData.amount ? (
                                <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
                                    <span style={{ fontSize: 10, fontWeight: 700, color: tc.accent }}>₹</span>
                                    <span style={{ fontSize: 26, fontWeight: 800, color: tc.accent, lineHeight: 1 }}>
                                        {Number(formData.amount).toLocaleString("en-IN")}
                                    </span>
                                </div>
                            ) : (
                                <p style={{ fontSize: 11, color: "#c4c9d9", fontStyle: "italic" }}>Enter amount…</p>
                            )
                        ) : (
                            formData.rating ? (
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#fff", border: `2px solid ${tc.heroBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: tc.accent }}>
                                        {formData.rating}
                                    </div>
                                    <div>
                                        <p style={{ fontSize: 12, fontWeight: 700, color: tc.accent }}>{RATING_LABEL[formData.rating]}</p>
                                        <p style={{ fontSize: 9, color: "#9ca3b0" }}>Performance rating</p>
                                    </div>
                                </div>
                            ) : (
                                <p style={{ fontSize: 11, color: "#c4c9d9", fontStyle: "italic" }}>Select rating…</p>
                            )
                        )}
                    </div>
                </div>
            </div>

            {/* ── 2-column grid ───────────────────────────────────────────────── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, flex: 1, minHeight: 0 }}>

                {/* COL 1 — Transaction info + Installment */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10, minHeight: 0 }}>

                    {/* Transaction details */}
                    <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #eef0f6", padding: "10px 12px", flexShrink: 0 }}>
                        <SLabel>Details</SLabel>
                        {[
                            formData.effective_date && {
                                label: "Effective from",
                                value: new Date(formData.effective_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
                            },
                            formData.month_year && {
                                label: "Month",
                                value: new Date(formData.month_year).toLocaleDateString("en-IN", { month: "long", year: "numeric" }),
                            },
                            (formData.approved_by_name || formData.approved_by) && {
                                label: "Approved by",
                                value: formData.approved_by_name || `ID: ${formData.approved_by}`,
                            },
                        ].filter(Boolean).map((row, i, arr) => (
                            <InfoRow key={row.label} label={row.label} value={row.value} last={i === arr.length - 1} />
                        ))}
                        {!formData.effective_date && !formData.month_year && !formData.approved_by && (
                            <p style={{ fontSize: 10, color: "#d1d5db", fontStyle: "italic" }}>Fill form to see details…</p>
                        )}
                    </div>

                    {/* Remarks */}
                    {formData.remarks && (
                        <div style={{ background: "#f8f9fc", borderRadius: 10, border: "1px solid #eef0f6", padding: "10px 12px", flexShrink: 0 }}>
                            <SLabel>Remarks</SLabel>
                            <p style={{ fontSize: 11, color: "#4b5563", lineHeight: 1.5 }}>{formData.remarks}</p>
                        </div>
                    )}

                    {/* Installment progress */}
                    {showProgress && (
                        <div style={{ background: "#fffbeb", borderRadius: 10, border: "1px solid #fde68a", padding: "10px 12px", flexShrink: 0 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                                <SLabel>Installment</SLabel>
                                <span style={{ fontSize: 10, fontWeight: 700, color: "#92400e" }}>
                                    {formData.installment_no}/{formData.total_installments}
                                </span>
                            </div>
                            <div style={{ background: "#fde68a", borderRadius: 99, height: 5, overflow: "hidden" }}>
                                <div style={{ width: `${pct}%`, height: "100%", background: "linear-gradient(90deg,#f59e0b,#d97706)", borderRadius: 99, transition: "width 0.3s" }} />
                            </div>
                            <p style={{ fontSize: 9, color: "#b45309", marginTop: 4 }}>{pct}% complete</p>
                        </div>
                    )}

                    {/* Meta */}
                    {formData.id && (
                        <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #eef0f6", padding: "10px 12px", flexShrink: 0 }}>
                            <SLabel>Meta</SLabel>
                            <InfoRow label="Tx ID" value={formData.id.slice(0, 8).toUpperCase()} />
                            {formData.created_at && (
                                <InfoRow label="Created" last value={new Date(formData.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} />
                            )}
                        </div>
                    )}
                </div>

                {/* COL 2 — Approval flow + Delete */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10, minHeight: 0 }}>

                    {/* Approval flow */}
                    <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #eef0f6", padding: "10px 12px", flex: 1, minHeight: 0 }}>
                        <SLabel>Approval Flow</SLabel>
                        <div>
                            {APPROVAL_STEPS.map((step, i) => {
                                const isDone = step.done(formData.status);
                                const isCurrent = !isDone && APPROVAL_STEPS[i - 1]?.done(formData.status);
                                const isLast = i === APPROVAL_STEPS.length - 1;
                                return (
                                    <div key={step.key} style={{ display: "flex", gap: 8 }}>
                                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                                            <div style={{
                                                width: 10, height: 10, borderRadius: "50%", flexShrink: 0, marginTop: 2,
                                                background: isDone ? "#10b981" : isCurrent ? "#3b82f6" : "#e5e7eb",
                                                border: `2px solid ${isDone ? "#10b981" : isCurrent ? "#93c5fd" : "#d1d5db"}`,
                                                boxShadow: isCurrent ? "0 0 0 3px #dbeafe" : "none",
                                            }} />
                                            {!isLast && <div style={{ width: 1, flex: 1, minHeight: 14, margin: "2px 0", background: isDone ? "#a7f3d0" : "#e5e7eb" }} />}
                                        </div>
                                        <div style={{ paddingBottom: isLast ? 0 : 8 }}>
                                            <p style={{ fontSize: 11, fontWeight: 600, color: isDone ? "#374151" : isCurrent ? "#1d4ed8" : "#9ca3b0", lineHeight: 1.3 }}>
                                                {step.label}
                                            </p>
                                            {step.key === "pending" && isCurrent && (
                                                <p style={{ fontSize: 9, color: "#60a5fa" }}>Awaiting approval</p>
                                            )}
                                            {step.key === "disbursed" && !isDone && formData.month_year && (
                                                <p style={{ fontSize: 9, color: "#9ca3b0" }}>
                                                    {new Date(formData.month_year).toLocaleDateString("en-IN", { month: "short", year: "numeric" })} payroll
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Delete button */}
                    {mode === "view" && rights?.delete === 1 && (
                        <button onClick={() => onDelete(formData)} style={{
                            width: "100%", padding: "7px 0", borderRadius: 8, border: "1px solid #fca5a5",
                            background: "#fee2e2", color: "#991b1b", fontSize: 11, fontWeight: 700, cursor: "pointer", flexShrink: 0,
                        }}>
                            Delete Transaction
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

/* ════════════════════════════════════════════════════════════════════════════
   LEFT PANEL — Entry Form, 2–3 fields per row, no scroll
═══════════════════════════════════════════════════════════════════════════════ */
const EntryForm = ({
    formData, setFormData, mode, employees, empNames,
    errors, setErrors, formRef, handleKeyDown, onModify, rights,
}) => {
    const isView = mode === "view";
    const tc = TYPE_CONFIG[formData.transaction_type] || TYPE_CONFIG.INCREMENT;
    const sc = STATUS_CFG[formData.status] || STATUS_CFG.Pending;

    const onChange = (field, value) => {
        let u = { ...formData };
        if (field === "emp_name") {
            const emp = employees.find((e) => e.Led_name?.trim() === value?.trim());
            u.emp_name = value; u.emp_id = emp ? Number(emp.Actled_id) : "";
        } else if (field === "approved_by") {
            const emp = employees.find((e) => e.Led_name?.trim() === value?.trim());
            u.approved_by_name = value; u.approved_by = emp ? Number(emp.Actled_id) : "";
        } else {
            u[field] = value;
        }
        setFormData(u);
        setErrors((p) => { const c = { ...p }; delete c[field === "emp_name" ? "emp_id" : field]; return c; });
    };

    const inp = (f, extra = {}) => ({
        width: "100%", height: 28, padding: "0 8px", fontSize: 11,
        border: `1px solid ${errors[f] ? "#fca5a5" : isView ? "#eef0f6" : "#d1d5db"}`,
        borderRadius: 6, outline: "none", fontFamily: F, boxSizing: "border-box",
        background: isView ? "#f5f6fa" : "#fff",
        color: isView ? "#9ca3b0" : "#1f2937",
        cursor: isView ? "default" : "text",
        ...extra,
    });

    const FLabel = ({ children, req }) => (
        <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#9ca3b0", marginBottom: 3 }}>
            {children}{req && <span style={{ color: "#f87171" }}> *</span>}
        </p>
    );

    /* Each field returns { col: 1|2|3, node } to drive grid placement */
    const FIELD_COLS = {
        emp_id: 2, amount: 1, effective_date: 1, month_year: 1,
        approved_by: 2, remarks: 3,
        installment_no: 1, total_installments: 1, rating: 1,
    };

    const renderField = (key) => {
        const cols = FIELD_COLS[key] || 1;
        const spanStyle = { gridColumn: `span ${cols}` };

        if (key === "emp_id") return (
            <div key="emp_id" style={spanStyle}>
                <FLabel req>Employee</FLabel>
                <ERPAutocomplete
                    options={empNames}
                    value={formData.emp_name || ""}
                    onChange={(v) => onChange("emp_name", v)}
                    className={`w-full h-[28px] px-2 text-[11px] border rounded-md outline-none
    ${errors["emp_id"] ? "border-red-500" : "border-gray-300"}
    ${isView ? "bg-[#eef1f6] text-gray-500 cursor-not-allowed"
                            : "bg-white text-gray-900 focus:border-blue-500"}`}
                    disabled={isView}
                    onKeyDown={handleKeyDown}
                />
                {formData.emp_id && <p style={{ fontSize: 8, color: tc.accent, marginTop: 1, fontFamily: "monospace" }}>EMP-{String(formData.emp_id).padStart(4, "0")}</p>}
                {errors.emp_id && <p style={{ fontSize: 8, color: "#ef4444", marginTop: 1 }}>Required</p>}
            </div>
        );

        if (key === "approved_by") return (
            <div key="approved_by" style={spanStyle}>
                <FLabel>Approved by</FLabel>
                <ERPAutocomplete
                    options={empNames} value={formData.approved_by_name || ""}
                    onChange={(v) => onChange("approved_by", v)}
                    className={`w-full h-[28px] px-2 text-[11px] border rounded-md outline-none
    ${errors["emp_id"] ? "border-red-500" : "border-gray-300"}
    ${isView ? "bg-[#eef1f6] text-gray-500 cursor-not-allowed"
                            : "bg-white text-gray-900 focus:border-blue-500"}`}
                    disabled={isView} onKeyDown={handleKeyDown}
                />
                {formData.approved_by && <p style={{ fontSize: 8, color: tc.accent, marginTop: 1 }}>ID: {formData.approved_by}</p>}
            </div>
        );

        if (key === "rating") return (
            <div key="rating" style={spanStyle}>
                <FLabel>Rating</FLabel>
                <ERPAutocomplete
                    options={RATING_OPTIONS} value={formData.rating || ""}
                    onChange={(v) => onChange("rating", v)}
                    className={`w-full h-[28px] px-2 text-[11px] border rounded-md outline-none
    ${errors["emp_id"] ? "border-red-500" : "border-gray-300"}
    ${isView ? "bg-[#eef1f6] text-gray-500 cursor-not-allowed"
                            : "bg-white text-gray-900 focus:border-blue-500"}`}
                    disabled={isView} onKeyDown={handleKeyDown}
                />
                {formData.rating && <p style={{ fontSize: 8, color: tc.accent, marginTop: 1 }}>{RATING_LABEL[formData.rating]}</p>}
            </div>
        );

        if (key === "remarks") return (
            <div key="remarks" style={spanStyle}>
                <FLabel>Remarks</FLabel>
                <textarea
                    data-auto name="remarks" rows={2} disabled={isView}
                    value={formData.remarks || ""} placeholder="Notes…"
                    onChange={(e) => onChange("remarks", e.target.value)}
                    onKeyDown={handleKeyDown}
                    style={{ ...inp("remarks"), height: "auto", padding: "5px 8px", resize: "none", lineHeight: 1.4 }}
                />
            </div>
        );

        if (key === "effective_date") return (
            <div key="effective_date" style={spanStyle}>
                <FLabel>Effective from</FLabel>
                <ERPDateInput value={formData.effective_date || ""} onChange={(v) => onChange("effective_date", v)} disabled={isView} onKeyDown={handleKeyDown} style={inp("effective_date")} />
            </div>
        );

        if (key === "month_year") return (
            <div key="month_year" style={spanStyle}>
                <FLabel>Month</FLabel>
                <ERPDateInput value={formData.month_year || ""} onChange={(v) => onChange("month_year", v)} disabled={isView} onKeyDown={handleKeyDown} type="month" style={inp("month_year")} />
            </div>
        );

        const labelMap = { amount: "Amount (₹)", installment_no: "Installment no.", total_installments: "Total" };
        return (
            <div key={key} style={spanStyle}>
                <FLabel>{labelMap[key] || key}</FLabel>
                <input
                    data-auto name={key} disabled={isView}
                    type={key === "amount" || key.includes("installment") ? "number" : "text"}
                    value={formData[key] || ""} placeholder={labelMap[key] || key}
                    onChange={(e) => onChange(key, e.target.value)}
                    onKeyDown={handleKeyDown} style={inp(key)}
                />
                {errors[key] && <p style={{ fontSize: 8, color: "#ef4444", marginTop: 1 }}>{errors[key]}</p>}
            </div>
        );
    };

    const activeFields = tc.fields;

    return (
        <div ref={formRef} style={{ height: "100%", display: "flex", flexDirection: "column", padding: "12px 14px", gap: 10, fontFamily: F }}>

            {/* Mode badge */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: mode === "add" ? "#3b82f6" : mode === "edit" ? "#f59e0b" : "#10b981" }} />
                    <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: mode === "add" ? "#2563eb" : mode === "edit" ? "#d97706" : "#059669" }}>
                        {mode === "add" ? "New Transaction" : mode === "edit" ? "Editing" : "View Mode"}
                    </span>
                </div>
                {isView && rights?.edit === 1 && (
                    <button onClick={onModify} style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 6, border: "1.5px solid #bfdbfe", background: "#eff6ff", color: "#1d4ed8", cursor: "pointer" }}>
                        Edit
                    </button>
                )}
            </div>

            {/* Form card */}
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #eef0f6", padding: "12px 14px", flex: 1, display: "flex", flexDirection: "column", gap: 10, minHeight: 0 }}>

                {/* Type selector */}
                <div style={{ flexShrink: 0 }}>
                    <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#9ca3b0", marginBottom: 6 }}>
                        Transaction Type <span style={{ color: "#f87171" }}>*</span>
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                        {Object.entries(TYPE_CONFIG).map(([key, cfg]) => {
                            const active = formData.transaction_type === key;
                            return (
                                <button key={key} type="button" disabled={isView}
                                    onClick={() => !isView && onChange("transaction_type", key)}
                                    style={{
                                        display: "flex", alignItems: "center", gap: 5,
                                        padding: "4px 10px", borderRadius: 99, fontSize: 10, fontWeight: 700,
                                        border: `1.5px solid ${active ? cfg.dot : "#e5e7eb"}`,
                                        background: active ? cfg.badge.bg : "#f9fafb",
                                        color: active ? cfg.badge.text : "#9ca3b0",
                                        cursor: isView ? "default" : "pointer",
                                    }}>
                                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: active ? cfg.dot : "#d1d5db", flexShrink: 0 }} />
                                    {cfg.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Status */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                    <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#9ca3b0", flexShrink: 0 }}>Status</p>
                    {isView ? (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: sc.bg, color: sc.text }}>
                            {formData.status || "Pending"}
                        </span>
                    ) : (
                        <select data-auto name="status" value={formData.status || "Pending"}
                            onChange={(e) => onChange("status", e.target.value)} onKeyDown={handleKeyDown}
                            style={{ height: 26, padding: "0 8px", fontSize: 11, border: "1px solid #d1d5db", borderRadius: 6, background: "#fff", color: "#1f2937", outline: "none", fontFamily: F }}>
                            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                    )}
                </div>

                <div style={{ borderTop: "1px solid #f0f2f6", flexShrink: 0 }} />

                {/* Dynamic fields — 3-col grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px 12px", flex: 1, alignContent: "start" }}>
                    {activeFields.map((f) => renderField(f))}
                </div>
            </div>
        </div>
    );
};

/* ════════════════════════════════════════════════════════════════════════════
   MAIN EXPORT — Header | [Left Form + Right Detail] | Footer
   No scroll — everything fits in viewport height
═══════════════════════════════════════════════════════════════════════════════ */
const SalaryTransactionForm = ({
    formData, setFormData, mode, saving,
    onSave, onDelete, onModify, onNewEntry, onEditCancel, onCancel,
    currentRecord, totalRecords, rights, activeTab, onTabChange,
}) => {
    const [errors, setErrors] = useState({});
    const [employees, setEmployees] = useState([]);
    const [empNames, setEmpNames] = useState([]);
    const formRef = useRef(null);

    const isView = mode === "view";
    const isAdd = mode === "add";
    const isEdit = mode === "edit";

    useEffect(() => {
        if (isAdd || isEdit) focusFirstInput(formRef);
    }, [isAdd, isEdit]);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await getActledList();
                setEmployees(data || []);
                setEmpNames((data || []).map((e) => e.Led_name?.trim()));
            } catch (e) { console.error(e); }
        };
        load();
    }, []);

    const handleKeyDown = useCallback(
        (e) => handleERPEnterNavigation(e, formRef, isView), [isView]
    );

    const handleSave = useCallback(() => {
        if (isView) return;
        const errs = {};
        if (!formData.emp_id) errs.emp_id = "Required";
        if (!formData.transaction_type) errs.transaction_type = "Required";
        if (Object.keys(errs).length) { setErrors(errs); return; }
        onSave?.(formData);
    }, [formData, isView, onSave]);

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100%", width: "100%", background: "#f0f2f7", fontFamily: F }}>

            {/* ERP Header */}
            <ERPHeader
                title="SALARY TRANSACTION ENTRY"
                isAddMode={isAdd} isEditMode={isEdit} isViewMode={isView}
                activeTab={activeTab} onTabChange={onTabChange}
                rightContent={`${currentRecord || 1} / ${totalRecords || 1}`}
            />

            {/* Body — left form + right detail, side by side, fixed height */}
            <div style={{ flex: 1, display: "flex", overflow: "hidden", gap: 0, minHeight: 0 }}>

                {/* LEFT — Entry form (50%) */}
                <div style={{ width: "50%", flexShrink: 0, overflow: "hidden", borderRight: "1px solid #e8eaf0" }}>
                    <EntryForm
                        formData={formData} setFormData={setFormData}
                        mode={mode} employees={employees} empNames={empNames}
                        errors={errors} setErrors={setErrors}
                        formRef={formRef} handleKeyDown={handleKeyDown}
                        onModify={onModify} rights={rights}
                    />
                </div>

                {/* RIGHT — Detail preview (50%) */}
                <div style={{ width: "50%", flexShrink: 0, overflow: "hidden", background: "#f8f9fc" }}>
                    <DetailPreview
                        formData={formData} mode={mode}
                        onDelete={onDelete} rights={rights}
                    />
                </div>
            </div>

            {/* ERP Footer */}
            <ERPFooter
                isAddMode={isAdd} isEditMode={isEdit} isViewMode={isView}
                saving={saving} handleSubmit={handleSave}
                onModify={onModify} onDelete={() => { }} onCancel={onEditCancel || onCancel}
                onEditCancel={onEditCancel} onNewEntry={onNewEntry} rights={rights}
            />
        </div>
    );
};

export default SalaryTransactionForm;