// pages/PublicQuotationRate.jsx
import { useEffect, useMemo, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import Swal from "sweetalert2";
import { Building2, Calendar, Hash, Save, Loader2, AlertTriangle, ShieldCheck, Pencil, ClipboardList } from "lucide-react";
import { fetchPublicQuotation, updatePublicQuotation } from "../../utils/publicApi";

function restrictToNumeric(value) {
    let v = value.replace(/[^0-9.]/g, "");
    const parts = v.split(".");
    if (parts.length > 2) v = parts[0] + "." + parts.slice(1).join("");
    return v;
}

function formatMoney(n) {
    return (Number(n) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(d) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
function formatDateInput(value) {
    // strip non-digits
    const digits = value.replace(/\D/g, "").slice(0, 8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
    return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4)}`;
}

function toISODate(ddmmyyyy) {
    // convert DD-MM-YYYY → YYYY-MM-DD for saving
    if (!ddmmyyyy || ddmmyyyy.length < 10) return null;
    const [dd, mm, yyyy] = ddmmyyyy.split("-");
    if (!dd || !mm || !yyyy || yyyy.length < 4) return null;
    return `${yyyy}-${mm}-${dd}`;
}

function fromISODate(isoDate) {
    // convert YYYY-MM-DD → DD-MM-YYYY for display
    if (!isoDate || isoDate.length < 10) return "";
    const [yyyy, mm, dd] = isoDate.split("-");
    return `${dd}-${mm}-${yyyy}`;
}

export default function PublicQuotationRate() {
    const [searchParams] = useSearchParams();
    const ledKey = searchParams.get("led_key") || "";

    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [loadError, setLoadError] = useState("");
    const [header, setHeader] = useState(null);
    const [rows, setRows] = useState([]);
    const [initialRows, setInitialRows] = useState([]);
    const [ledRmks, setLedRmks] = useState("");
    const [initialRmks, setInitialRmks] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const loadData = useCallback(async () => {
        if (!ledKey) { setLoading(false); setNotFound(true); return; }
        setLoading(true); setNotFound(false); setLoadError("");
        try {
            const data = await fetchPublicQuotation(ledKey);
            setHeader(data.header);
            const mapped = (data.items || []).map((r) => ({
                it_id: r.it_id, srl_no: r.srl_no, it_name: r.it_name, ord_qty: r.ord_qty,
                unit: r.unit, my_rmks: r.my_rmks,
                rate: r.rate == null ? "" : String(r.rate),
                ddlv_dt: r.ddlv_dt ? fromISODate(String(r.ddlv_dt).slice(0, 10)) : "",
                freight: r.freight || "", make: r.make || "", payterms: r.payterms || "",
                pkgsz: r.pkgsz || "", 
            }));
            setRows(mapped); setInitialRows(mapped);
            setLedRmks(data.header?.led_rmks || ""); setInitialRmks(data.header?.led_rmks || "");
        } catch (err) {
            if (err.response?.status === 404) setNotFound(true);
            else setLoadError("Unable to load quotation. Please refresh and try again.");
        } finally { setLoading(false); }
    }, [ledKey]);

    useEffect(() => { loadData(); }, [loadData]);

    const grandTotal = useMemo(
        () => rows.reduce((sum, r) => sum + (Number(r.ord_qty) || 0) * (Number(r.rate) || 0), 0),
        [rows]
    );

    const isDirty = useMemo(() => {
        if (ledRmks !== initialRmks) return true;
        return rows.some((r, i) => {
            const o = initialRows[i];
            if (!o) return true;
            return r.rate !== o.rate || r.pkgsz !== o.pkgsz || r.ddlv_dt !== o.ddlv_dt ||
                r.freight !== o.freight || r.make !== o.make || r.payterms !== o.payterms;
        });
    }, [rows, initialRows, ledRmks, initialRmks]);

    const updateRow = (idx, field, value) => {
        setRows((prev) => { const next = [...prev]; next[idx] = { ...next[idx], [field]: value }; return next; });
    };
    const handleRateChange = (idx, raw) => updateRow(idx, "rate", restrictToNumeric(raw));

    const handleSubmit = async () => {
        const result = await Swal.fire({
            title: "Confirm Save?", text: "Do you want to update all entered rows?", icon: "question",
            showCancelButton: true, confirmButtonColor: "#1d4ed8", cancelButtonColor: "#94a3b8",
            confirmButtonText: "Yes, Save It", cancelButtonText: "Cancel",
        });
        if (!result.isConfirmed) return;
        setSubmitting(true);
        try {
            await updatePublicQuotation({
                led_key: ledKey, led_rmks: ledRmks,
                rows: rows.map((r) => ({
                    item_id: r.it_id, new_rate: r.rate === "" ? null : r.rate, pkgsz: r.pkgsz,
                    ddlv_dt: toISODate(r.ddlv_dt) || null, freight: r.freight, make: r.make, payterms: r.payterms,
                })),
            });
            await Swal.fire({
                toast: true, position: "top-end", icon: "success", title: "Quotation updated successfully",
                showConfirmButton: false, timer: 2200, timerProgressBar: true,
            });
            await loadData();
        } catch {
            Swal.fire({ icon: "error", title: "Update failed", text: "Please check your entries and try again.", confirmButtonColor: "#1d4ed8" });
        } finally { setSubmitting(false); }
    };

    useEffect(() => {
        const handler = (e) => {
            if (e.key !== "Enter") return;
            const inputs = Array.from(document.querySelectorAll(".pq-nav"));
            const idx = inputs.indexOf(document.activeElement);
            if (idx > -1 && idx < inputs.length - 1) {
                e.preventDefault(); inputs[idx + 1].focus(); inputs[idx + 1].select?.();
            }
        };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [rows.length]);

    const inputBase =
        "pq-nav w-full h-9 px-2.5 rounded-md border border-amber-200/70 bg-amber-50/40 text-[13px] text-slate-800 " +
        "outline-none transition-colors duration-150 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:bg-white " +
        "placeholder:text-slate-300 min-w-0";

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            {/* ── Top brand bar ─────────────────────────────────────── */}
            <div className="bg-[#0b1f3a] text-white">
                <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-14 h-16 grid grid-cols-[auto_1fr_auto] items-center gap-3">
                    {/* left: logo + FINAMAN ERP */}
                    <div className="flex items-center gap-3 min-w-0">
                        <img
                            src="/logo512.png"
                            alt="Finaman ERP"
                            className="w-9 h-9 rounded-md object-contain bg-white/95 p-1 shrink-0"
                            onError={(e) => { e.target.style.display = "none"; }}
                        />
                        <div className="text-[14px] sm:text-[15px] font-bold leading-tight truncate">FINAMAN ERP</div>
                    </div>

                    {/* center: subtitle */}
                    <div className="hidden sm:block text-center text-[15px] font-bold text-white tracking-wide truncate">
                        Vendor Rate Submission Portal
                    </div>

                </div>
            </div>

            <div className="w-full max-w-[1920px] mx-auto px-3 sm:px-6 lg:px-10 xl:px-14 pt-5 pb-10">
                {loading && (
                    <div className="bg-white border border-slate-200 rounded-xl py-16 sm:py-20 flex flex-col items-center gap-3 px-4">
                        <Loader2 size={24} className="text-blue-600 animate-spin" />
                        <p className="text-[13px] text-slate-500">Loading quotation details…</p>
                    </div>
                )}

                {!loading && loadError && (
                    <div className="bg-white border border-red-200 rounded-xl py-14 sm:py-16 flex flex-col items-center gap-3 px-4">
                        <AlertTriangle size={24} className="text-red-500" />
                        <p className="text-[13px] text-red-600 text-center">{loadError}</p>
                    </div>
                )}

                {!loading && !loadError && notFound && (
                    <div className="bg-white border border-slate-200 rounded-xl py-14 sm:py-16 flex flex-col items-center gap-3 text-center px-4">
                        <div className="w-11 h-11 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                            <AlertTriangle size={20} className="text-red-500" />
                        </div>
                        <p className="text-[14px] font-medium text-slate-700">No quotation found</p>
                        <p className="text-[12.5px] text-slate-400 max-w-xs">
                            We couldn't find a record for this reference. Please check the link or contact the sender.
                        </p>
                    </div>
                )}

                {!loading && !loadError && !notFound && header && (
                    <>
                        {/* ── Page title ─────────────────────────────────────── */}


                        {/* ── Info card — clean, consistently aligned flex row ── */}
                        <div className="bg-white border border-slate-200 rounded-xl mb-4 overflow-hidden">
                            <div className="flex flex-wrap">
                                <InfoField icon={Building2} label="Customer" value={header.com_name?.trim()} className="basis-full sm:basis-1/2 md:basis-[28%]" />
                                <InfoField icon={Hash} label="Quotation No" value={header.qtn_no?.trim()} className="basis-1/2 sm:basis-1/4 md:basis-[18%]" />
                                <InfoField icon={Calendar} label="Quotation Date" value={formatDate(header.qtn_dt)} className="basis-1/2 sm:basis-1/4 md:basis-[18%]" />
                                <InfoField icon={Hash} label="Ref No" value={header.lqtn_no?.trim() || "—"} className="basis-1/2 sm:basis-1/4 md:basis-[18%]" />
                                <InfoField icon={Calendar} label="Ref Date" value={formatDate(header.lqtn_dt)} className="basis-1/2 sm:basis-1/4 md:basis-[18%]" last />
                            </div>
                        </div>

                        {/* ── Table card ─────────────────────────────────────── */}
                        <div className="hidden md:block bg-white border border-slate-200 rounded-xl mb-4 overflow-hidden">
                            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                                <div className="flex items-center gap-2">
                                    <ClipboardList size={15} className="text-blue-600" />
                                    <h2 className="text-[13.5px] font-semibold text-slate-700">Quotation Items</h2>
                                    <span className="text-[11px] text-slate-400">({rows.length} items)</span>
                                </div>
                            </div>

                            <div className="relative">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-[12.5px] border-collapse table-fixed">
                                        <colgroup>
                                            <col style={{ width: "3%" }} />    {/* # */}
                                            <col style={{ width: "18%" }} />   {/* Item */}
                                            <col style={{ width: "7%" }} />    {/* Qty */}
                                            <col style={{ width: "4%" }} />    {/* Unit */}
                                            <col style={{ width: "10%" }} />   {/* Remarks */}
                                            <col style={{ width: "8%" }} />    {/* Rate */}
                                            <col style={{ width: "8%" }} />    {/* Pack Size */}
                                            <col style={{ width: "10%" }} />   {/* Delivery Date */}
                                            <col style={{ width: "7%" }} />    {/* Freight */}
                                            <col style={{ width: "8%" }} />    {/* Make */}
                                            <col style={{ width: "8%" }} />    {/* Pay Terms */}
                                            <col style={{ width: "9%" }} />    {/* Amount */}
                                        </colgroup>
                                        <thead>
                                            <tr className="bg-slate-800">
                                                <th className="px-3 py-2.5 font-medium text-[10.5px] uppercase tracking-wide whitespace-nowrap text-center text-white/90">#</th>
                                                <th className="px-3 py-2.5 font-medium text-[10.5px] uppercase tracking-wide whitespace-nowrap text-left text-white/90">Item</th>
                                                <th className="px-3 py-2.5 font-medium text-[10.5px] uppercase tracking-wide whitespace-nowrap text-right text-white/90">QUANTITY</th>
                                                <th className="px-3 py-2.5 font-medium text-[10.5px] uppercase tracking-wide whitespace-nowrap text-center text-white/90">Unit</th>
                                                <th className="px-3 py-2.5 font-medium text-[10.5px] uppercase tracking-wide whitespace-nowrap text-left text-white/90">Remarks</th>
                                                <th className="px-3 py-2.5 font-medium text-[10.5px] uppercase tracking-wide whitespace-nowrap text-right text-white/90">Rate</th>
                                                <th className="px-3 py-2.5 font-medium text-[10.5px] uppercase tracking-wide whitespace-nowrap text-left text-white/90">Pack Size</th>
                                                <th className="px-3 py-2.5 font-medium text-[10.5px] uppercase tracking-wide whitespace-nowrap text-left text-white/90">Delivery Date</th>
                                                <th className="px-3 py-2.5 font-medium text-[10.5px] uppercase tracking-wide whitespace-nowrap text-left text-white/90">Freight</th>
                                                <th className="px-3 py-2.5 font-medium text-[10.5px] uppercase tracking-wide whitespace-nowrap text-left text-white/90">Make</th>
                                                <th className="px-3 py-2.5 font-medium text-[10.5px] uppercase tracking-wide whitespace-nowrap text-left text-white/90">Pay Terms</th>
                                                <th className="px-3 py-2.5 font-medium text-[10.5px] uppercase tracking-wide whitespace-nowrap text-right text-white/90">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {rows.map((r, idx) => (
                                                <tr key={r.it_id} className={`border-b border-slate-100 ${idx % 2 === 1 ? "bg-slate-50/50" : "bg-white"} hover:bg-blue-50/30`}>
                                                    <td className="px-3 py-2 text-center font-mono text-slate-500 align-middle">{r.srl_no}</td>
                                                    <td className="px-3 py-2 text-left font-medium text-slate-800 align-middle leading-snug">{r.it_name}</td>
                                                    <td className="px-3 py-2 text-right font-mono text-slate-600 align-middle whitespace-nowrap">{Number(r.ord_qty).toFixed(4)}</td>
                                                    <td className="px-3 py-2 text-center text-slate-500 align-middle whitespace-nowrap">{r.unit}</td>
                                                    <td className="px-3 py-2 text-left text-slate-400 text-[11.5px] align-middle break-words">{r.my_rmks || "—"}</td>
                                                    <td className="px-2 py-1.5 align-middle">
                                                        <input className={inputBase + " text-right font-mono"} inputMode="decimal" value={r.rate} placeholder="0.00"
                                                            onChange={(e) => handleRateChange(idx, e.target.value)} />
                                                    </td>
                                                    <td className="px-2 py-1.5 align-middle">
                                                        <input className={inputBase} value={r.pkgsz} onChange={(e) => updateRow(idx, "pkgsz", e.target.value)} />
                                                    </td>
                                                    <td className="px-2 py-1.5 align-middle">
                                                        <div className="relative">
                                                            <input
                                                                className={inputBase + " pr-8"}
                                                                value={r.ddlv_dt}
                                                                placeholder="DD-MM-YYYY"
                                                                maxLength={10}
                                                                onChange={(e) => updateRow(idx, "ddlv_dt", formatDateInput(e.target.value))}
                                                            /> 
                                                            <div className="absolute right-0 top-0 h-full w-8 overflow-hidden">
                                                                <input
                                                                    type="date"
                                                                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                                                                    onChange={(e) => {
                                                                        if (e.target.value) updateRow(idx, "ddlv_dt", fromISODate(e.target.value));
                                                                    }}
                                                                />
                                                                <Calendar size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-2 py-1.5 align-middle">
                                                        <input className={inputBase} value={r.freight} onChange={(e) => updateRow(idx, "freight", e.target.value)} />
                                                    </td>
                                                    <td className="px-2 py-1.5 align-middle">
                                                        <input className={inputBase} value={r.make} onChange={(e) => updateRow(idx, "make", e.target.value)} />
                                                    </td>
                                                    <td className="px-2 py-1.5 align-middle">
                                                        <input className={inputBase} value={r.payterms} onChange={(e) => updateRow(idx, "payterms", e.target.value)} />
                                                    </td>
                                                    <td className="px-3 py-2 text-right font-mono font-semibold text-slate-800 align-middle whitespace-nowrap tabular-nums">
                                                        {formatMoney((Number(r.ord_qty) || 0) * (Number(r.rate) || 0))}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        {/* ── Grand Total — lives right under the Amount column, inside the table ── */}
                                        <tfoot>
                                            <tr className="bg-slate-100 border-t-2 border-slate-300">
                                                <td colSpan={11} className="px-4 py-3 text-right font-semibold text-[13px] text-slate-600">
                                                    Grand Total
                                                </td>
                                                <td className="px-3 py-3 text-right font-mono font-bold text-[16px] text-blue-700 whitespace-nowrap">
                                                    ₹ {formatMoney(grandTotal)}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                                <div className="pointer-events-none absolute top-0 right-0 h-full w-6 bg-gradient-to-l from-white/70 to-transparent lg:hidden hidden md:block" />
                            </div>
                        </div>

                        {/* ── Mobile cards ───────────────────────────────────── */}
                        <div className="md:hidden space-y-3 mb-4">
                            {rows.map((r, idx) => (
                                <div key={r.it_id} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                                    <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 bg-slate-50 border-b border-slate-100">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="text-[10.5px] font-bold text-slate-500">#{r.srl_no}</span>
                                            <span className="text-[13px] font-semibold text-slate-800 truncate">{r.it_name}</span>
                                        </div>
                                        <span className="font-mono font-bold text-[13.5px] text-slate-800 shrink-0">
                                            ₹{formatMoney((Number(r.ord_qty) || 0) * (Number(r.rate) || 0))}
                                        </span>
                                    </div>

                                    <div className="px-3.5 py-3">
                                        <div className="text-[11.5px] text-slate-400 mb-3">
                                            {Number(r.ord_qty).toFixed(2)} {r.unit}
                                            {r.my_rmks ? ` · ${r.my_rmks}` : ""}
                                        </div>

                                        <div className="grid grid-cols-2 max-[380px]:grid-cols-1 gap-2.5">
                                            <MobileField label="Rate">
                                                <input className={inputBase + " text-right font-mono"} inputMode="decimal" value={r.rate} placeholder="0.00"
                                                    onChange={(e) => handleRateChange(idx, e.target.value)} />
                                            </MobileField>
                                            <MobileField label="Pack Size">
                                                <input className={inputBase} value={r.pkgsz} onChange={(e) => updateRow(idx, "pkgsz", e.target.value)} />
                                            </MobileField>
                                            <MobileField label="Delivery Date">
                                                <input
                                                    className={inputBase}
                                                    value={r.ddlv_dt}
                                                    placeholder="DD-MM-YYYY"
                                                    maxLength={10}
                                                    onChange={(e) => updateRow(idx, "ddlv_dt", formatDateInput(e.target.value))}
                                                />
                                            </MobileField>
                                            <MobileField label="Freight">
                                                <input className={inputBase} value={r.freight} onChange={(e) => updateRow(idx, "freight", e.target.value)} />
                                            </MobileField>
                                            <MobileField label="Make">
                                                <input className={inputBase} value={r.make} onChange={(e) => updateRow(idx, "make", e.target.value)} />
                                            </MobileField>
                                            <MobileField label="Pay Terms">
                                                <input className={inputBase} value={r.payterms} onChange={(e) => updateRow(idx, "payterms", e.target.value)} />
                                            </MobileField>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Grand Total summary card — same visual language as Amount above, mobile equivalent of tfoot */}
                            <div className="bg-slate-100 border-2 border-slate-300 rounded-xl px-4 py-3 flex items-center justify-between">
                                <span className="text-[13px] font-semibold text-slate-600">Grand Total</span>
                                <span className="font-mono font-bold text-[17px] text-blue-700">₹ {formatMoney(grandTotal)}</span>
                            </div>
                        </div>

                        {/* ── Remarks ────────────────────────────────────────── */}
                        <div className="bg-white border border-slate-200 rounded-xl p-3.5 sm:p-4 mb-4">
                            <label className="flex items-center gap-1.5 text-[11px] sm:text-[11.5px] font-semibold text-slate-500 uppercase tracking-wide mb-2">
                                <Pencil size={11} className="text-blue-500" /> Delivery Conditions / Remarks
                            </label>
                            <textarea
                                className="w-full border border-slate-300 rounded-md p-2.5 text-[13px] text-slate-700 outline-none resize-y
                           transition-colors duration-150 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                rows={3}
                                value={ledRmks}
                                onChange={(e) => setLedRmks(e.target.value)}
                                placeholder="Any conditions related to delivery, packing or payment…"
                            />
                        </div>

                        {/* ── Save — normal flow, right after everything (not fixed/floating) ── */}
                        <div className="flex justify-end">
                            <button
                                type="button"
                                disabled={!isDirty || submitting}
                                onClick={handleSubmit}
                                className={`w-full sm:w-auto h-11 px-6 rounded-md text-[13.5px] font-semibold text-white
                            flex items-center justify-center gap-2 transition-colors duration-150
                            ${!isDirty || submitting ? "bg-slate-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}
                            >
                                {submitting ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                                {submitting ? "Saving…" : isDirty ? "Save Changes" : "No Changes"}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

function InfoField({ icon: Icon, label, value, className = "", last }) {
    return (
        <div className={`${className} px-4 py-3 border-b sm:border-b-0 ${!last ? "sm:border-r" : ""} border-slate-100`}>
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
                <Icon size={11} className="shrink-0" /> <span className="truncate">{label}</span>
            </div>
            <div className="text-[13.5px] font-semibold text-slate-800 break-words">{value || "—"}</div>
        </div>
    );
}

function MobileField({ label, children }) {
    return (
        <div className="min-w-0">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1 truncate">{label}</div>
            {children}
        </div>
    );
}
