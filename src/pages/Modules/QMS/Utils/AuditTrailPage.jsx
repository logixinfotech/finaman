import { useEffect, useState, useCallback } from "react";
import Table from "../../../../components/Reusable/table/Table";
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
};

 const auditColumns = [
  {
    key: "performed_at",
    label: "Timestamp",
    render: (r) => r.performed_at ? new Date(r.performed_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "-",
  },
  { key: "module_name", label: "Module" },
  { key: "record_no", label: "Record No." },
  { key: "action_type", label: "Action" }, 
  { key: "performed_by", label: "Performed By" },
  { key: "performed_role", label: "Role", render: (r) => r.performed_role || "-" },
  { key: "details", label: "Details" },
];


export default function AuditTrailPage({ tab }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    moduleKey: "",
    recordNo: "",
    fromDate: "",
    toDate: "",
  });
  const [selectedDetail, setSelectedDetail] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAuditTrail(filters);
      const arr = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
      setList(arr);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters({ moduleKey: "", recordNo: "", fromDate: "", toDate: "" });
  };

  const listWithBadge = list.map((item) => ({
    ...item,
      action_type_raw: item.action_type, 
    action_type: (
      <span className={`inline-block px-2 py-0.5 text-[11px] font-semibold rounded-full border ${auditActionColors[item.action_type] || "bg-gray-50 text-gray-700 border-gray-200"}`}>
        {item.action_type}
      </span>
    ),
    details: (
      <button
        type="button"
        onClick={() => setSelectedDetail(item)}
        className="text-left text-[12px] text-[#1a56db] hover:underline truncate max-w-[280px] block"
        title={item.details}
      >
        {item.details}
      </button>
    ),
  }));

  const auditColumns = [
    { key: "performed_at", label: "Timestamp", render: (r) => r.performed_at ? new Date(r.performed_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "-" },
    { key: "module_name", label: "Module" },
    { key: "record_no", label: "Record No." },
    { key: "action_type", label: "Action" },
    { key: "performed_by", label: "Performed By" },
    { key: "performed_role", label: "Role", render: (r) => r.performed_role || "-" },
    { key: "details", label: "Details" },
  ];

  return (
    <div className="h-full w-full flex flex-col bg-slate-50">
      {/* ── Filter bar ── */}
      <div className="bg-white border-b border-[#dde1ea] px-4 py-3 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-[#64748b]">Module</label>
          <select
            value={filters.moduleKey}
            onChange={(e) => handleFilterChange("moduleKey", e.target.value)}
            className="h-[30px] border border-[#c8d2e4] rounded-[5px] text-[12px] px-2 outline-none focus:border-[#1a56db]"
          >
            {auditModuleOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-[#64748b]">Record No.</label>
          <input
            type="text"
            value={filters.recordNo}
            onChange={(e) => handleFilterChange("recordNo", e.target.value)}
            placeholder="e.g. DEV-2026-0001"
            className="h-[30px] border border-[#c8d2e4] rounded-[5px] text-[12px] px-2 outline-none focus:border-[#1a56db] w-[160px]"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-[#64748b]">From Date</label>
          <input
            type="date"
            value={filters.fromDate}
            onChange={(e) => handleFilterChange("fromDate", e.target.value)}
            className="h-[30px] border border-[#c8d2e4] rounded-[5px] text-[12px] px-2 outline-none focus:border-[#1a56db]"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-[#64748b]">To Date</label>
          <input
            type="date"
            value={filters.toDate}
            onChange={(e) => handleFilterChange("toDate", e.target.value)}
            className="h-[30px] border border-[#c8d2e4] rounded-[5px] text-[12px] px-2 outline-none focus:border-[#1a56db]"
          />
        </div>

        <button
          onClick={handleClearFilters}
          className="h-[30px] px-3 text-[12px] font-semibold text-[#64748b] border border-[#c8d2e4] rounded-[5px] hover:bg-slate-50"
        >
          Clear
        </button>

        <div className="ml-auto text-[12px] text-[#94aabf]">{list.length} records</div>
      </div>

      {/* ── Table (read-only, no Add button) ── */}
      <div className="flex-1 min-h-0">
        <Table
          activeTab="search"
          onTabChange={() => {}}
          title="Audit Trail"
          data={listWithBadge}
          columns={auditColumns}
          rowKey="id"
          loading={loading}
          onAdd={null}
        />
      </div>

      {/* ── Full-detail modal on click ── */}
      {selectedDetail && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-[999]"
          onClick={() => setSelectedDetail(null)}
        >
          <div
            className="bg-white rounded-[8px] shadow-lg max-w-[500px] w-full mx-4 p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[14px] font-bold text-[#0f172a]">
                {selectedDetail.module_name} — {selectedDetail.record_no}
              </h3>
              <button onClick={() => setSelectedDetail(null)} className="text-[#64748b] hover:text-[#0f172a]">✕</button>
            </div>
            <div className="text-[12px] text-[#64748b] mb-2">
              {selectedDetail.action_type_raw || ""} by <span className="font-semibold text-[#0f172a]">{selectedDetail.performed_by}</span>
              {selectedDetail.performed_role ? ` (${selectedDetail.performed_role})` : ""} on{" "}
              {new Date(selectedDetail.performed_at).toLocaleString("en-IN")}
            </div>
            <div className="text-[12.5px] text-[#0f172a] whitespace-pre-wrap border-t border-[#eef1f7] pt-3">
              {selectedDetail.details}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}