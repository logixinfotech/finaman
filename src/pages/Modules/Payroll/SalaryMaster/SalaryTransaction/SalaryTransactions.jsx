import { useEffect, useState, useCallback } from "react";
import { useERPMode } from "../../../../../components/Reusable/form/useFormMode";
import { confirmDelete, alertError, showToast } from "../../../../../components/Reusable/alert";
import SalaryTransactionForm from "./SalaryTransactionForm";
import { getActledList } from "../../../../../utils/api";
import Table from "../../../../../components/Reusable/table/Table";
import {
  fetchSalaryTransactions,
  createSalaryTransaction,
  updateSalaryTransaction,
  deleteSalaryTransaction,
} from "../../../../../utils/api";
import { setERPHandlers } from "../../../../../utils/erpShortcuts";

const initialState = {
  emp_id: "", emp_name: "", approved_by_name: "",
  transaction_type: "INCREMENT", amount: "",
  month_year: "", effective_date: "", rating: "",
  installment_no: "", total_installments: "",
  reference_id: "", remarks: "", approved_by: "", status: "Pending",
};

const columns = [
  { key: "emp_name",        label: "Employee"    },
  { key: "transaction_type", label: "Type"       },
  { key: "amount",          label: "Amount"      },
  { key: "status",          label: "Status"      },
  { key: "effective_date",  label: "Effective"   },
  { key: "month_year",      label: "Month"       },
];

const TYPE_SHORT = {
  INCREMENT: "Increment", BONUS: "Bonus",
  INSTALLMENT_DEDUCTION: "Installment", APPRAISAL: "Appraisal",
};

const STATUS_COLOR = {
  Pending: { bg: "#fef3c7", text: "#92400e", dot: "#f59e0b" },
  Approved: { bg: "#d1fae5", text: "#065f46", dot: "#10b981" },
  Rejected: { bg: "#fee2e2", text: "#991b1b", dot: "#ef4444" },
  Applied: { bg: "#dbeafe", text: "#1e40af", dot: "#3b82f6" },
  Paid: { bg: "#dcfce7", text: "#14532d", dot: "#16a34a" },
};

const SalaryTransaction = ({ tab }) => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [filterTab, setFilterTab] = useState("All");
 

  const {
    mode, formData, setFormData, saving, showForm, setShowForm,  
    handleEditCancel, handleView, handleAdd, handleModify, performSave, rights,
  } = useERPMode(
    initialState,
    async (data, isEdit) =>
      isEdit ? await updateSalaryTransaction(data.id, data) : await createSalaryTransaction(data),
    () => loadList(),
    tab.appl_name
  );

  const loadList = useCallback(async () => {
  try {
    setLoading(true);
    const data  = await fetchSalaryTransactions();
    const final = Array.isArray(data) ? data : data?.data || [];

    // ✅ YAHAN ADD KARO — final ke baad, setList se pehle
    const empData = await getActledList();
    const empMap = {};
    (empData || []).forEach(e => { empMap[e.Actled_id] = e.Led_name?.trim(); });

    const withNames = final.map(item => ({
      ...item,
      emp_name: item.emp_name || empMap[item.emp_id] || "",
      approved_by_name: item.approved_by_name || empMap[item.approved_by] || "",
    }));

    // ✅ setList(final) ki jagah setList(withNames)
    setList(withNames);

    if (withNames.length > 0) {
      setFormData(withNames[0]);
      setCurrentIndex(0);
      handleView(withNames[0]);
    } else {
      handleAdd();
    }
  } catch {
    alertError("Fetch Error", "Failed to load salary transactions");
  } finally {
    setLoading(false);
  }
}, [setFormData, handleView, handleAdd]);

  useEffect(() => { loadList(); }, []);

  useEffect(() => {
    if (mode === "view" && list.length > 0) setFormData(list[currentIndex]);
  }, [currentIndex, list, mode, setFormData]);

  const handleRowSelect = (row, index) => { setCurrentIndex(index); handleView(row); };

const handleTabChange = (targetTab) => {
  if (targetTab === "search") setShowForm(false);
  if (targetTab === "entry")  setShowForm(true);
};

  const handleSave = async (updatedData) => {
    const response = await performSave("id", updatedData);
    if (response?.success) await loadList();
  };

  const handleDelete = async (row) => {
    const confirmed = await confirmDelete({
      title: `Delete "${TYPE_SHORT[row.transaction_type] || row.transaction_type}" transaction?`,
    });
    if (confirmed) {
      const res = await deleteSalaryTransaction(row.id);
      if (res?.success) { showToast({ icon: "success", title: "Deleted" }); await loadList(); }
    }
  };

  useEffect(() => {
    setERPHandlers({
      onNextRecord: () => setCurrentIndex((p) => Math.min(p + 1, list.length - 1)),
      onPrevRecord: () => setCurrentIndex((p) => Math.max(p - 1, 0)),
      onNew: handleAdd, onSave: handleSave, onEsc: handleEditCancel,
    });
  }, [list, handleAdd, handleSave, handleEditCancel]);

  const filteredList = list.filter((item) => {
    if (filterTab === "Done") return ["Approved", "Applied", "Paid"].includes(item.status);
    if (filterTab === "Pending") return item.status === "Pending";
    return true;
  });

  const pendingCount = list.filter((i) => i.status === "Pending").length;
  const doneCount = list.filter((i) => ["Approved", "Applied", "Paid"].includes(i.status)).length;

  return (
    <div style={{ display: "flex", height: "100%", width: "100%", overflow: "hidden", background: "#f0f2f7", fontFamily: "'Inter','Segoe UI',system-ui,sans-serif" }}>


      {/* ── SIDEBAR ──────────────────────────────────────────────────────── */}
       {showForm && (
      <div style={{ width: 200, minWidth: 200, display: "flex", flexDirection: "column", height: "100%", background: "#fff", borderRight: "1px solid #e8eaf0" }}>

        {/* Header */}
        <div style={{ padding: "12px 12px 8px", borderBottom: "1px solid #f0f2f6" }}>
          <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#9ca3b0", marginBottom: 8 }}>Transactions</p>

          {/* Stat chips */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4, marginBottom: 8 }}>
            {[
              { label: "All", count: list.length, key: "All", bg: "#f5f6fa", activeBg: "#e8eaf2", color: "#5b6278" },
              { label: "Pend", count: pendingCount, key: "Pending", bg: "#fffbf0", activeBg: "#fef3c7", color: "#b45309" },
              { label: "Done", count: doneCount, key: "Done", bg: "#f0fdf8", activeBg: "#d1fae5", color: "#047857" },
            ].map(({ label, count, key, bg, activeBg, color }) => (
              <button key={key} onClick={() => setFilterTab(key)} style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                padding: "5px 2px", borderRadius: 8, cursor: "pointer",
                border: `1px solid ${filterTab === key ? "transparent" : "#eef0f6"}`,
                background: filterTab === key ? activeBg : bg,
              }}>
                <span style={{ fontSize: 14, fontWeight: 800, lineHeight: 1, color }}>{count}</span>
                <span style={{ fontSize: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color, marginTop: 1 }}>{label}</span>
              </button>
            ))}
          </div>

          {/* Filter strip */}
          <div style={{ display: "flex", background: "#f5f6fa", borderRadius: 8, padding: 2, border: "1px solid #eef0f6" }}>
            {["All", "Pending", "Done"].map((t) => (
              <button key={t} onClick={() => setFilterTab(t)} style={{
                flex: 1, padding: "3px 0", borderRadius: 6, fontSize: 9, fontWeight: 700, cursor: "pointer",
                background: filterTab === t ? "#fff" : "transparent",
                color: filterTab === t ? "#3b5bdb" : "#9ca3b0",
                border: "none",
                boxShadow: filterTab === t ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              }}>{t}</button>
            ))}
          </div>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 60, fontSize: 10, color: "#9ca3b0" }}>Loading…</div>
          ) : filteredList.length === 0 ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 60, fontSize: 10, color: "#9ca3b0" }}>No transactions</div>
          ) : filteredList.map((item) => {
            const realIndex = list.findIndex((i) => i.id === item.id);
            const isActive = realIndex === currentIndex && mode === "view";
            const sc = STATUS_COLOR[item.status] || STATUS_COLOR.Pending;
            return (
              <button key={item.id} onClick={() => handleRowSelect(item, realIndex)} style={{
                width: "100%", textAlign: "left", padding: "9px 12px",
                borderLeft: `3px solid ${isActive ? "#4f6ef7" : "transparent"}`,
                borderBottom: "1px solid #f5f6fa", background: isActive ? "#eef1fd" : "transparent",
                cursor: "pointer", display: "block",
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: isActive ? "#3b5bdb" : "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 110 }}>
                    {item.emp_name || `EMP #${item.emp_id}`}
                  </span>
                  <span style={{ fontSize: 8, fontWeight: 800, padding: "2px 6px", borderRadius: 20, background: sc.bg, color: sc.text, flexShrink: 0 }}>
                    {item.status}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: sc.dot, flexShrink: 0 }} />
                  <span style={{ fontSize: 9, color: "#9ca3b0" }}>
                    {TYPE_SHORT[item.transaction_type]}
                    {item.amount ? ` · ₹${Number(item.amount).toLocaleString("en-IN")}` : ""}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
  )}
    
{/* ── RIGHT PANEL ── */}
<div style={{ flex: 1, overflow: "hidden", minWidth: 0 }}>
  {showForm ? (
    <SalaryTransactionForm
      formData={formData} setFormData={setFormData} mode={mode} saving={saving}
      onSave={handleSave} onDelete={handleDelete}
      onCancel={() => setShowForm(false)}
      onModify={handleModify} onNewEntry={handleAdd} onEditCancel={handleEditCancel}
      currentRecord={list.length > 0 ? currentIndex + 1 : 0}
      totalRecords={list.length} rights={rights}
      activeTab="entry" onTabChange={handleTabChange}
    />
  ) : (
    // ← YAHAN TABLE LAGAO, message nahi
    <div className="bg-slate-50 h-full">
      <Table
      activeTab="search"
          onTabChange={handleTabChange}
        title="Salary Transactions"
        data={list}
        columns={columns}
        rowKey="id"
        loading={loading}
        onAdd={rights?.add === 1 ? handleAdd : null}
        onRowDoubleClick={(row) => {
          const index = list.findIndex(i => i.id === row.id);
          handleRowSelect(row, index);
        }}
      />
    </div>
  )}
</div>

    </div>
  );
};

export default SalaryTransaction;