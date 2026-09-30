import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useERPMode } from "../../../../components/Reusable/form/useFormMode";
import POApprovalForm from "./POApprovalForm";
import { showToast, alertError } from "../../../../components/Reusable/alert";
import { setERPHandlers } from "../../../../utils/erpShortcuts";
import { fetchApprovals, patchApproval } from "../../../../utils/api";
const STATUS_STYLES = {
    Pending:  { bg: "bg-[#FAEEDA]", text: "text-[#633806]" },
    Approved: { bg: "bg-[#EAF3DE]", text: "text-[#27500A]" },
    Rejected: { bg: "bg-[#FCEBEB]", text: "text-[#791F1F]" },
    Hold:     { bg: "bg-[#E6F1FB]", text: "text-[#0C447C]" },
    Draft:    { bg: "bg-[#F1EFE8]", text: "text-[#444441]" },
};

const StatusPill = ({ status }) => {
    const s = STATUS_STYLES[status] ?? STATUS_STYLES.Draft;
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${s.bg} ${s.text}`}>
            {status ?? "—"}
        </span>
    );
};
const countAttach = (raw) => {
    if (!raw) return 0;
    if (Array.isArray(raw)) return raw.filter(Boolean).length;
    try { const p = JSON.parse(raw); return Array.isArray(p) ? p.filter(Boolean).length : 1; }
    catch { return 1; }
};
const POListCard = ({ record, isActive, onClick }) => {
    const amount = record.amount != null && !isNaN(Number(record.amount))
        ? `₹${Number(record.amount).toLocaleString("en-IN")}`
        : "—";
    const ac = countAttach(record.attach);

    return (
        <button
            onClick={onClick}
            className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all duration-100 mb-1.5
                ${isActive
                    ? "border-[#185FA5] bg-[#E6F1FB]"
                    : "border-slate-200 bg-white hover:border-[#85B7EB] hover:bg-[#E6F1FB]/40 active:bg-[#E6F1FB]/60"
                }`}
        >
            <div className="flex items-center justify-between mb-0.5 gap-2">
                <span className="text-[13px] font-medium text-slate-800 truncate">{record.key_doc_no ?? "—"}</span>
                <StatusPill status={record.status} />
            </div>
            <div className="text-[11px] text-slate-500 truncate mb-0.5">
                {[record.department, record.submitted_by_name].filter(Boolean).join(" · ") || "—"}
            </div>
            <div className="flex items-center justify-between">
                <span className="text-[12px] font-semibold text-slate-700">{amount}</span>
                {ac > 0 && (
                    <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
                        </svg>
                        {ac}
                    </span>
                )}
            </div>
        </button>
    );
};
const StatChip = ({ label, value, bg, color }) => (
    <div className={`flex-1 text-center py-1.5 px-1 rounded-lg ${bg}`}>
        <div className={`text-[16px] font-semibold leading-none ${color}`}>{value}</div>
        <div className={`text-[10px] mt-1 opacity-70 ${color}`}>{label}</div>
    </div>
);
const TabBtn = ({ label, active, badge, onClick }) => (
    <button
        onClick={onClick}
        className={`px-2.5 py-1.5 text-[12px] font-medium border-b-2 whitespace-nowrap transition-all
            ${active ? "border-[#0C447C] text-[#0C447C]" : "border-transparent text-slate-500"}`}
    >
        {label}
        {badge != null && badge > 0 && (
            <span className="ml-1 bg-[#FAEEDA] text-[#633806] text-[10px] px-1.5 py-0.5 rounded-full">
                {badge}
            </span>
        )}
    </button>
);
const Sidebar = ({
    loading, list, activeTab, setActiveTab,
    currentIndex, handleRowSelect, stats,
}) => (
    <div className="flex flex-col bg-white h-full overflow-hidden">
<div className="px-3 pt-3 pb-2 border-b border-slate-100">
    <span className="text-[12px] font-semibold text-slate-500 uppercase tracking-wider">
        PO Approvals
    </span>
    <div className="flex gap-1.5 mt-2">
        <StatChip label="Pend"  value={stats.Pending}  bg="bg-[#FAEEDA]" color="text-[#633806]" />
        <StatChip label="Appr"  value={stats.Approved} bg="bg-[#EAF3DE]" color="text-[#27500A]" />
        <StatChip label="Rej"   value={stats.Rejected} bg="bg-[#FCEBEB]" color="text-[#791F1F]" />
        <StatChip label="Hold"  value={stats.Hold}     bg="bg-[#E6F1FB]" color="text-[#0C447C]" />
    </div>
</div>
        <div className="flex px-2 border-b border-slate-100 overflow-x-auto no-scrollbar">
            {["Pending", "Approved", "Rejected", "All"].map(t => (
                <TabBtn
                    key={t}
                    label={t}
                    active={activeTab === t}
                    badge={t === "Pending" ? stats.Pending : null}
                    onClick={() => setActiveTab(t)}
                />
            ))}
        </div>
        <div className="flex-1 overflow-y-auto p-2 no-scrollbar">
            {loading ? (
                <div className="flex items-center justify-center h-full text-slate-400 text-[12px]">
                    Loading…
                </div>
            ) : list.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2 py-10">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M9 11l3 3L22 4"/>
                        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
                    </svg>
                    <span className="text-[12px]">No records</span>
                </div>
            ) : (
                list.map((r, i) => (
                    <POListCard
                        key={r.approval_id}
                        record={r}
                        isActive={i === currentIndex}
                        onClick={() => handleRowSelect(r)}
                    />
                ))
            )}
        </div>
        {stats._pendingAmt > 0 && (
            <div className="px-3 py-1.5 border-t border-slate-100 flex items-center justify-between shrink-0">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">Pending value</span>
                <span className="text-[12px] font-semibold text-slate-600">
                    ₹{stats._pendingAmt.toLocaleString("en-IN")}
                </span>
            </div>
        )}
    </div>
);
const EmptyDetail = () => (
    <div className="flex flex-col items-center justify-center h-full text-slate-300 gap-3">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="9" y1="13" x2="15" y2="13"/>
            <line x1="9" y1="17" x2="11" y2="17"/>
        </svg>
        <p className="text-[13px]">Select a PO to review</p>
    </div>
);
const POApproval = ({ tab }) => { 
    const [allRecords,   setAllRecords]   = useState([]);
    const [loading,      setLoading]      = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [saving,       setSaving]       = useState(false);
    const [activeTab,    setActiveTab]    = useState("Pending");
    const [mobileView,   setMobileView]   = useState("list");
    const saveBtnRef = useRef(null);

    const {
        mode, formData, setFormData,
        showForm, setShowForm,
        handleEditCancel, handleView, handleModify, rights,
    } = useERPMode(
        {
            approval_id: null, type: "", key_doc_no: "", doc_date: "",
            description: "", amount: "", attach: "", submitted_by: "",
            submitted_by_name: "", department: "", extra_data: null,
            approval_user: "", status: "", approved_at: "", app_remark: "",
        },
        async () => {},
        () => loadList(),
        tab?.appl_name
    ); 
    const loadList = useCallback(async () => {
        try {
            setLoading(true);
            const data      = await fetchApprovals("All");
            const finalData = Array.isArray(data) ? data : data?.data ?? [];
            const parsed = finalData.map(r => ({
                ...r,
                doc_date:    r.doc_date    ? String(r.doc_date).slice(0, 10)    : "—",
                approved_at: r.approved_at ? String(r.approved_at).slice(0, 19) : "",
                extra_data:
                    typeof r.extra_data === "string"
                        ? (() => { try { return JSON.parse(r.extra_data); } catch { return null; } })()
                        : (r.extra_data ?? null),
            }));
            setAllRecords(parsed);
        } catch {
            alertError("Fetch Error", "Failed to load approvals");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadList(); }, [loadList]);
    const list = useMemo(() => {
        if (activeTab === "All")     return allRecords;
        if (activeTab === "Pending") return allRecords.filter(r => r.status === "Pending" || r.status === "Draft");
        return allRecords.filter(r => r.status === activeTab);
    }, [allRecords, activeTab]);
    const stats = useMemo(() => ({
        Pending:  allRecords.filter(r => r.status === "Pending" || r.status === "Draft").length,
        Approved: allRecords.filter(r => r.status === "Approved").length,
        Rejected: allRecords.filter(r => r.status === "Rejected").length,
        Hold:     allRecords.filter(r => r.status === "Hold").length,
        _pendingAmt: allRecords
            .filter(r => r.status === "Pending" || r.status === "Draft")
            .reduce((s, r) => s + (isNaN(Number(r.amount)) ? 0 : Number(r.amount)), 0),
    }), [allRecords]);
    useEffect(() => {
        if (list.length > 0) {
            setFormData(list[currentIndex] ?? list[0]);
            setShowForm(true);
        } else {
            setShowForm(false);
        }
    }, [currentIndex, list, setFormData, setShowForm]);

    const handleRowSelect = useCallback((row) => {
        const index = list.findIndex(r => r.approval_id === row.approval_id);
        if (index !== -1) { setCurrentIndex(index); handleView(row); }
        setMobileView("detail");
    }, [list, handleView]);

    const handleAction = async (approval_id, payload) => {
        try {
            setSaving(true);
            const res = await patchApproval(approval_id, payload);
            if (res?.success) {
                showToast({ icon: "success", title: `${payload.status} successfully` });
                loadList(); // refetch master — counts + list both update
            }
        } catch {
            alertError("Error", "Action failed. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    useEffect(() => {
        setERPHandlers({
            onNextRecord: () => setCurrentIndex(p => Math.min(p + 1, list.length - 1)),
            onPrevRecord: () => setCurrentIndex(p => Math.max(p - 1, 0)),
            onEsc:        () => { setShowForm(false); setMobileView("list"); },
            onBackspaceNavigation: true,
        });
    }, [list, setShowForm]);

    const navigate = useCallback((dir) => {
        setCurrentIndex(p => Math.max(0, Math.min(list.length - 1, p + dir)));
    }, [list.length]);
    const switchTab = useCallback((t) => {
        setActiveTab(t);
        setCurrentIndex(0);
    }, []);

    const sharedFormProps = {
        formData, setFormData, mode, saving, saveBtnRef,
        onAction: handleAction,
        onCancel: () => { setShowForm(false); setMobileView("list"); },
        onModify: handleModify,
        onEditCancel: handleEditCancel,
        currentRecord: currentIndex + 1,
        totalRecords: list.length,
        rights,
        onNavigate: navigate,
    };return (
        <div className="h-full w-full overflow-hidden bg-slate-100">
            <div className="hidden sm:flex h-full">
                <div className="w-[260px] min-w-[200px] border-r border-slate-200 shrink-0">
                    <Sidebar
                        loading={loading} list={list}
                        activeTab={activeTab} setActiveTab={switchTab}
                        currentIndex={currentIndex} handleRowSelect={handleRowSelect}
                        stats={stats}
                    />
                </div>
                <div className="flex-1 overflow-hidden">
                    {showForm && list.length > 0
                        ? <POApprovalForm {...sharedFormProps} />
                        : <EmptyDetail />
                    }
                </div>
            </div>
            <div className="flex sm:hidden h-full flex-col">
                {mobileView === "list" ? (
                    <div className="h-full">
                        <Sidebar
                            loading={loading} list={list}
                            activeTab={activeTab} setActiveTab={switchTab}
                            currentIndex={currentIndex} handleRowSelect={handleRowSelect}
                            stats={stats}
                        />
                    </div>
                ) : (
                    <div className="h-full flex flex-col overflow-hidden">
                        <div className="flex items-center gap-1.5 px-3 py-2 bg-white border-b border-slate-200 shrink-0"
                             style={{ paddingTop: "max(8px, env(safe-area-inset-top))" }}>
                            <button
                                onClick={() => setMobileView("list")}
                                className="flex items-center text-[#185FA5] -ml-1 px-1.5 rounded-md
                                           active:bg-slate-100 transition-colors shrink-0"
                                style={{ minHeight: "40px" }}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                                     stroke="currentColor" strokeWidth="2.4">
                                    <polyline points="15 18 9 12 15 6"/>
                                </svg>
                            </button>
                            <span className="text-[13px] text-slate-700 truncate font-medium flex-1 min-w-0">
                                {formData?.key_doc_no ?? ""}
                            </span>
                            <span className="text-[11px] text-slate-400 shrink-0">
                                {currentIndex + 1}/{list.length}
                            </span>
                            <button
                                onClick={() => navigate(-1)}
                                disabled={currentIndex <= 0}
                                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200
                                           text-slate-500 disabled:opacity-30 active:bg-slate-100 transition-colors shrink-0"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                    <polyline points="15 18 9 12 15 6"/>
                                </svg>
                            </button>
                            <button
                                onClick={() => navigate(1)}
                                disabled={currentIndex >= list.length - 1}
                                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200
                                           text-slate-500 disabled:opacity-30 active:bg-slate-100 transition-colors shrink-0"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                    <polyline points="9 18 15 12 9 6"/>
                                </svg>
                            </button>
                        </div>

                        <div className="flex-1 overflow-hidden">
                            {showForm && list.length > 0 && (
                                <POApprovalForm {...sharedFormProps} isMobile />
                            )}
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
};

export default POApproval;