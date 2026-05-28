import { useEffect, useState, useCallback } from "react";
import Table from "../../../../components/Reusable/table/Table";
import OTTransactionForm from "./OtTransactionentry";
import { useERPMode } from "../../../../components/Reusable/form/useFormMode";
import { setERPHandlers } from "../../../../utils/erpShortcuts";
import { confirmDelete, showToast, alertError } from "../../../../components/Reusable/alert";
import {
  getOTTransactions, getOTTransactionById,
  saveOTTransaction, updateOTTransaction, deleteOTTransaction,
} from "../../../../utils/api";

const initialState = {
  ot_id:            null,
  employee_id:      "",
  employee_name:    "",
  employee_code:    "",
  ot_date:          "",
  day_type:         "",
  shift_id:         null,
  actual_ot_hours:  "",
  payable_ot_hours: "",
  rule_id:          null,
  ot_multiplier:    "",
  hourly_rate:      "",
  ot_amount:        "",
  status:           "Pending",
  remarks:          "",
};

// ── Format date for table display ────────────────────────────────────────────
const fmtDate = (v) => {
  if (!v) return "—";
  try {
    const d = new Date(v);
    return d.toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" });
  } catch { return v; }
};

const STATUS_PILL = {
  Pending:  { bg:"#fffbeb", color:"#92400e" },
  Approved: { bg:"#f0fdf4", color:"#166534" },
  Rejected: { bg:"#fef2f2", color:"#991b1b" },
};

const columns = [
  { key:"employee_name", label:"Employee" },
  { key:"ot_date",       label:"OT Date",  render: (r) => fmtDate(r.ot_date) },
  { key:"day_type",      label:"Day Type" },
  { key:"actual_ot_hours",  label:"Actual Hrs",  render: (r) => `${r.actual_ot_hours||0} hrs` },
  { key:"payable_ot_hours", label:"Payable Hrs", render: (r) => `${r.payable_ot_hours||0} hrs` },
  {
    key:"ot_amount", label:"OT Amount",
    render: (r) => (
      <span style={{ fontWeight:700, color:"#0284c7" }}>
        ₹{Number(r.ot_amount||0).toLocaleString("en-IN",{minimumFractionDigits:2})}
      </span>
    )
  },
  {
    key:"status", label:"Status",
    render: (r) => {
      const cfg = STATUS_PILL[r.status] || STATUS_PILL.Pending;
      return (
        <span style={{ background:cfg.bg, color:cfg.color, padding:"3px 10px", borderRadius:12, fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.05em" }}>
          {r.status}
        </span>
      );
    }
  },
];

// ═════════════════════════════════════════════════════════════════════════════
const OTTransaction = ({ tab }) => {
  const [list,         setList]         = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [page,         setPage]         = useState(1);
  const [pageSize,     setPageSize]     = useState(15);
  const [totalRecords, setTotalRecords] = useState(0);
  const [filters,      setFilters]      = useState({});

  const {
    mode, formData, setFormData,
    showForm, setShowForm,
    saving, canPrint, rights,
    handleView, handleAdd,
    handleModify: erpModify,
    performSave, handleEditCancel,
  } = useERPMode(
    initialState,
    async (data) => {
      const res = data.ot_id
        ? await updateOTTransaction(data.ot_id, data)
        : await saveOTTransaction(data);
      return res;
    },
    () => loadData(),
    tab?.appl_name
  );

  // ── Load list ──────────────────────────────────────────────────────────────
  const loadData = useCallback(async (pg = page, ps = pageSize, fl = filters) => {
    try {
      setLoading(true);
      const res = await getOTTransactions({ page: pg, pageSize: ps, ...fl });
      setList(res?.data || []);
      setTotalRecords(res?.total || res?.data?.length || 0);
    } catch(e) {
      alertError("Load Error", "Failed to load OT transactions");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filters]);

  useEffect(() => { loadData(); }, [page, pageSize]);

  // ── ERP keyboard shortcuts ─────────────────────────────────────────────────
  useEffect(() => {
    setERPHandlers({
      onNew:  () => { handleAdd(); setShowForm(true); },
      onSave: () => handleSave(),
      onEsc:  () => setShowForm(false),
      onNextRecord: () => setCurrentIndex(p => Math.min(p+1, list.length-1)),
      onPrevRecord: () => setCurrentIndex(p => Math.max(p-1, 0)),
    });
  }, [list]);

  // Navigate records
  useEffect(() => {
    if (showForm && mode === "view" && list.length > 0) {
      const rec = list[currentIndex];
      if (rec) handleViewMode(rec);
    }
  }, [currentIndex]);

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!formData.employee_id) { showToast({ icon:"warning", title:"Employee select karo" }); return; }
    if (!formData.ot_date)     { showToast({ icon:"warning", title:"OT Date select karo" }); return; }
    if (!formData.day_type)    { showToast({ icon:"warning", title:"Day Type select karo" }); return; }

    const res = await performSave("ot_id");
    if (res?.success) {
      showToast({ icon:"success", title: formData.ot_id ? "OT Transaction Updated" : "OT Transaction Saved" });
      handleView(formData);
    }
  };

  // ── View ───────────────────────────────────────────────────────────────────
  const handleViewMode = async (row) => {
    try {
      const idx = list.findIndex(r => r.ot_id === row.ot_id);
      if (idx !== -1) setCurrentIndex(idx);

      let data = row;
      if (row?.ot_id) {
        const res = await getOTTransactionById(row.ot_id);
        if (res?.data) data = res.data;
      }
      handleView(data);
      setFormData({ ...initialState, ...data });
      setShowForm(true);
    } catch(e) { console.error(e); }
  };

  // ── Modify ─────────────────────────────────────────────────────────────────
  const handleModify = async (row) => {
    try {
      let data = row;
      if (row?.ot_id) {
        const res = await getOTTransactionById(row.ot_id);
        if (res?.data) data = res.data;
      }
      erpModify(data);
      setFormData({ ...initialState, ...data });
      setShowForm(true);
    } catch(e) { console.error(e); }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (row) => {
    const confirmed = await confirmDelete({ title: "Delete OT Transaction?" });
    if (!confirmed) return;
    const res = await deleteOTTransaction(row?.ot_id || formData?.ot_id);
    if (res?.success) {
      showToast({ icon:"success", title:"Deleted Successfully" });
      setShowForm(false);
      loadData();
    }
  };

  const handleTabChange = (t) => {
    if (t === "search") setShowForm(false);
    if (t === "entry")  { setShowForm(true); if (!formData?.ot_id) handleAdd(); }
  };

  const handlePageChange = (newPage, newSize) => {
    if (newSize !== pageSize) { setPageSize(newSize); setPage(1); }
    else setPage(newPage);
  };

  return (
    <div className="h-full w-full">
      {showForm ? (
        <OTTransactionForm
          formData={formData}
          setFormData={setFormData}
          mode={mode}
          onSave={handleSave}
          onCancel={() => setShowForm(false)}
          onModify={(row) => handleModify(row || formData)}
          onDelete={(row) => handleDelete(row || formData)}
          onNewEntry={handleAdd}
          onEditCancel={handleEditCancel}
          activeTab="entry"
          onTabChange={handleTabChange}
          currentRecord={list.length > 0 ? currentIndex + 1 : 0}
          totalRecords={list.length}
          saving={saving}
          canPrint={canPrint}
          rights={rights}
        />
      ) : (
        <Table
          title="OT Transactions"
          data={list}
          columns={columns}
          rowKey="ot_id"
          loading={loading}
          onRefresh={() => loadData()}
          serverPagination={true}
          totalRecords={totalRecords}
          onPageChange={handlePageChange}
          defaultPageSize={pageSize}
          onAdd={() => { handleAdd(); setShowForm(true); }}
          onRowDoubleClick={handleViewMode}
        />
      )}
    </div>
  );
};

export default OTTransaction;