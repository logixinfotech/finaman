import { useEffect, useState, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { X, Copy, Check, ArrowRight, User, ShieldCheck, Clock } from "lucide-react";
import Table from "../../../../components/Reusable/table/Table";
import UnivarsalFilter from "../../../../components/Reusable/Filter/UnivarsalFilter.jsx";
import { copyToClipboard } from "../../../../utils/helpers";
import { getAuditTrail } from "./QmsAPI";

const auditModuleOptions = [
  { value: "", label: "All Modules" },
  { value: "deviation", label: "Deviation" },
  { value: "recall", label: "Product Recall" },
  { value: "incident", label: "Incident" },
  { value: "training", label: "Training" },
  { value: "dms", label: "DMS" },
  { value: "capa", label: "CAPA" },
  { value: "complaint", label: "Market Complaint" },
  { value: "change", label: "Change Control" },
];

const auditActionColors = {
  CREATE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  UPDATE: "bg-amber-50 text-amber-700 border-amber-200",
  DELETE: "bg-red-50 text-red-700 border-red-200",
  STATUS_CHANGE: "bg-blue-50 text-blue-700 border-blue-200",
};

const formatAction = (a) => {
  const s = String(a || "").replace(/_/g, " ").toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
};

const EMPTY_FILTERS = { moduleKey: "", recordNo: "", from_date: "", to_date: "" };

/* ───────────────────────── details parsing ───────────────────────── */

// "ProbableCause" -> "Probable cause"
const humanizeField = (f) => {
  const s = String(f || "")
    .replace(/_/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .trim()
    .toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
};

const isEmptyVal = (v) => {
  const t = String(v ?? "").trim();
  return t === "" || t === "—" || t === "-";
};

// Field: "old" → "new"; Field2: "old" → "new"
const CHANGE_RE =
  /(?:^|;\s+)([A-Za-z_][\w .\/()-]*?):\s*(?:"([\s\S]*?)"|(.*?))\s*→\s*(?:"([\s\S]*?)"|(.*?))(?=\s*;\s+[A-Za-z_][\w .\/()-]*?:\s|\s*$)/g;

function parseDetails(details) {
  const text = String(details ?? "").trim();
  if (!text) return { type: "empty" };

  const changes = [];
  let m;
  CHANGE_RE.lastIndex = 0;
  while ((m = CHANGE_RE.exec(text)) !== null) {
    changes.push({
      field: humanizeField(m[1]),
      from: m[2] ?? m[3] ?? "",
      to: m[4] ?? m[5] ?? "",
    });
    if (m[0] === "") CHANGE_RE.lastIndex++;
  }
  if (changes.length) return { type: "changes", changes };

  // Status transition: "Under Review → Under Investigation"
  const st = text.match(/^([^:;"]+?)\s*→\s*([^:;"]+)$/);
  if (st) return { type: "transition", from: st[1].trim(), to: st[2].trim() };

  return { type: "text", text };
}

/* ───────────────────────── small UI pieces ───────────────────────── */

const ActionBadge = ({ type }) => (
  <span
    className={`inline-flex items-center self-center h-5 px-2.5 text-[11px] font-semibold leading-none whitespace-nowrap rounded-[3px] border ${
      auditActionColors[type] || "bg-gray-50 text-gray-700 border-gray-200"
    }`}
  >
    {formatAction(type)}
  </span>
);

const ValueBox = ({ value, tone }) => {
  const empty = isEmptyVal(value);
  const styles =
    tone === "from"
      ? "bg-red-50/70 border-red-100 text-red-900"
      : "bg-emerald-50/70 border-emerald-100 text-emerald-900";
  return (
    <div className={`rounded-[6px] border px-2.5 py-2 text-[12.5px] leading-[1.5] whitespace-pre-wrap break-words ${styles}`}>
      {empty ? <span className="italic text-slate-400">Empty</span> : value}
    </div>
  );
};

const MetaItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-2 min-w-0">
    <div className="mt-[1px] w-6 h-6 rounded-[6px] bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
      <Icon size={12} />
    </div>
    <div className="min-w-0">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</div>
      <div className="text-[12.5px] font-medium text-slate-800 break-words">{value || "-"}</div>
    </div>
  </div>
);

/* ───────────────────────── detail modal ───────────────────────── */

function AuditDetailModal({ item, onClose }) {
  const [copied, setCopied] = useState(false);
  const parsed = useMemo(() => parseDetails(item.details), [item.details]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        e.stopImmediatePropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey, true);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey, true);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const handleCopy = async () => {
    try {
      await copyToClipboard(String(item.details ?? ""));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  };

  const when = item.performed_at
    ? new Date(item.performed_at).toLocaleString("en-IN", { dateStyle: "long", timeStyle: "medium" })
    : "-";

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-[2px] p-0 sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Audit entry details"
    >
      <div
        className="bg-white w-full sm:max-w-[720px] max-h-[88vh] sm:max-h-[85vh] flex flex-col rounded-t-[14px] sm:rounded-[12px] shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-4 sm:px-5 py-3.5 border-b border-slate-200 bg-slate-50/80">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-[15px] font-bold text-slate-900 truncate">
                {item.module_name || "Module"}
                {item.record_no ? <span className="text-slate-400 font-medium"> / </span> : null}
                {item.record_no}
              </h3>
              <ActionBadge type={item.action_type} />
            </div>
            <div className="text-[11.5px] text-slate-500 mt-0.5">Audit entry #{item.id}</div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 w-8 h-8 inline-flex items-center justify-center rounded-[8px] text-slate-500 hover:bg-slate-200/70 hover:text-slate-900 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Meta */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 px-4 sm:px-5 py-3.5 border-b border-slate-100">
          <MetaItem icon={User} label="Performed by" value={item.performed_by} />
          <MetaItem icon={ShieldCheck} label="Role" value={item.performed_role} />
          <MetaItem icon={Clock} label="Date & time" value={when} />
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-5 py-4 bg-white">
          {parsed.type === "changes" && (
            <>
              <div className="mb-3 text-[12px] font-semibold text-slate-700">
                {parsed.changes.length} field{parsed.changes.length !== 1 ? "s" : ""} changed
              </div>
              <div className="space-y-2.5">
                {parsed.changes.map((c, i) => (
                  <div key={i} className="rounded-[8px] border border-slate-200 overflow-hidden">
                    <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-200 text-[12px] font-semibold text-slate-700">
                      {c.field}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-2 sm:gap-2.5 items-start p-2.5">
                      <div>
                        <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">Before</div>
                        <ValueBox value={c.from} tone="from" />
                      </div>
                      <ArrowRight size={14} className="hidden sm:block text-slate-300 mt-8" />
                      <div>
                        <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">After</div>
                        <ValueBox value={c.to} tone="to" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {parsed.type === "transition" && (
            <div>
              <div className="text-[12px] font-semibold text-slate-700 mb-3">Status changed</div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="px-3 py-1.5 rounded-[6px] border border-red-100 bg-red-50/70 text-[13px] font-medium text-red-900">
                  {parsed.from}
                </span>
                <ArrowRight size={16} className="text-slate-400" />
                <span className="px-3 py-1.5 rounded-[6px] border border-emerald-100 bg-emerald-50/70 text-[13px] font-medium text-emerald-900">
                  {parsed.to}
                </span>
              </div>
            </div>
          )}

          {parsed.type === "text" && (
            <div className="rounded-[8px] border border-slate-200 bg-slate-50/60 px-3.5 py-3 text-[13px] leading-[1.6] text-slate-800 whitespace-pre-wrap break-words">
              {parsed.text}
            </div>
          )}

          {parsed.type === "empty" && (
            <div className="text-center text-[12.5px] text-slate-400 py-8">No details recorded for this entry.</div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 px-4 sm:px-5 py-3 border-t border-slate-200 bg-slate-50/80">
          <button
            onClick={handleCopy}
            disabled={!item.details}
            className="h-8 px-3 inline-flex items-center gap-1.5 text-[12px] font-semibold rounded-[8px] border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-colors"
          >
            {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
            {copied ? "Copied" : "Copy details"}
          </button>
          <button
            onClick={onClose}
            className="h-8 px-4 text-[12px] font-semibold rounded-[8px] bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ───────────────────────── page ───────────────────────── */

export default function AuditTrailPage({ tab }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [showFilter, setShowFilter] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAuditTrail({
        moduleKey: filters.moduleKey || "",
        recordNo: filters.recordNo || "",
        fromDate: filters.from_date || "",
        toDate: filters.to_date || "",
      });
      const arr = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
      setList(arr);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const clearFilter = useCallback(() => setFilters(EMPTY_FILTERS), []);
  const closeDetail = useCallback(() => setSelectedDetail(null), []);

  const tableData = useMemo(
    () => list.map((item, i) => ({ ...item, id: item.id ?? i })),
    [list]
  );

  const auditColumns = useMemo(
    () => [
      {
        key: "performed_at",
        label: "Timestamp",
        width: 170,
        render: (r) =>
          r.performed_at
            ? new Date(r.performed_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
            : "-",
      },
      { key: "module_name", label: "Module" },
      { key: "record_no", label: "Record No." },
      {
        key: "action_type",
        label: "Action",
        width: 150,
        render: (r) => <ActionBadge type={r.action_type} />,
      },
      { key: "performed_by", label: "Performed By" },
      { key: "performed_role", label: "Role", render: (r) => r.performed_role || "-" },
      {
        key: "details",
        label: "Details",
        width: 280,
        render: (r) => (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedDetail(r);
            }}
            className="text-left text-[12px] text-[#1a56db] hover:underline truncate max-w-[260px] block"
            title="View full details"
          >
            {r.details}
          </button>
        ),
      },
    ],
    []
  );

  return (
    <div className="h-full w-full flex flex-col bg-slate-50 min-w-0">
      <div className="flex-1 min-h-0 min-w-0">
        <Table
          isHidden={true}
          activeTab="search"
          onTabChange={() => {}}
          title="Audit Trail"
          data={tableData}
          columns={auditColumns}
          rowKey="id"
          loading={loading}
          onRefresh={loadData}
          onAdd={null}
          onToggleFilter={() => setShowFilter((p) => !p)}
          showForm={showFilter}
          formComponent={
            <UnivarsalFilter
              filters={filters}
              setFilters={setFilters}
              visibleFields={["auditModule", "recordNo", "filterType"]}
              options={{ auditModules: auditModuleOptions }}
              onApply={() => {}}
              onClear={clearFilter}
              setShowFilter={setShowFilter}
            />
          }
        />
      </div>

      {selectedDetail && <AuditDetailModal item={selectedDetail} onClose={closeDetail} />}
    </div>
  );
}