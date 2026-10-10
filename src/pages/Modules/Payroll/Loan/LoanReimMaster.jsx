import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Calendar,
  CreditCard,
  List,
  Check,
  Filter,
  X,
  Eye,
} from "lucide-react";

import { useERPMode } from "../../../../components/Reusable/form/useFormMode";
import Table from "../../../../components/Reusable/table/Table";
import ERPAutocomplete from "../../../../components/Reusable/input/ERPAutocomplete";
import LoanReimMasterForm from "./LoanReimMasterForm";
import LoanScheduleModal from "./components/LoanScheduleModal";
import LoanLedgerModal from "./components/LoanLedgerModal";
import LoanPrepayModal from "./components/LoanPrepayModal";

import {
  alertError,
  confirmDelete,
  showToast,
} from "../../../../components/Reusable/alert";

import { setERPHandlers } from "../../../../utils/erpShortcuts";

import {
  getLoanReimbursement,
  createLoanReimbursement,
  updateLoanReimbursement,
  deleteLoanReimbursement,
  approveLoanRequest,
  getActledList,
} from "../../../../utils/api";

const initialState = {
  id: null,
  employee_id: "",
  employee_name: "",
  master_type: "Loan",
  request_name: "",
  amount: "",
  interest_type: "Reducing",
  interest_rate: 10,
  tenure_months: 12,
  recovery_start: "",
  effective_from: "",
  effective_to: "",
  remarks: "",
  status: "Draft",
};

const initialFilters = {
  master_type: "All",
  status: "All",
  employee_name: "",
};

// Shared pill: every badge in the table has the same height & baseline
const pill =
  "inline-flex items-center justify-center h-5 px-2 text-[11px] font-semibold leading-none whitespace-nowrap rounded-full border";

const TYPE_STYLES = {
  Loan: "bg-blue-50 text-blue-700 border-blue-200",
  Advance: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Reimbursement: "bg-purple-50 text-purple-700 border-purple-200",
  Coupon: "bg-amber-50 text-amber-700 border-amber-200",
};

const STATUS_STYLES = {
  Draft: "bg-slate-100 text-slate-600 border-slate-200",
  Pending: "bg-amber-50 text-amber-700 border-amber-200",
  Approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Disbursed: "bg-purple-50 text-purple-700 border-purple-200",
  Closed: "bg-blue-50 text-blue-700 border-blue-200",
  Rejected: "bg-red-50 text-red-700 border-red-200",
  Returned: "bg-orange-50 text-orange-700 border-orange-200",
};

const iconBtn =
  "inline-flex h-6 w-6 items-center justify-center rounded border transition-colors cursor-pointer";

const LoanReimMaster = ({ tab }) => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Reusable Filter States
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState(initialFilters);
  const [draftFilters, setDraftFilters] = useState(initialFilters);
  const [employeeOptions, setEmployeeOptions] = useState([]);

  // Row modals
  const [activeModalLoan, setActiveModalLoan] = useState(null);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isLedgerOpen, setIsLedgerOpen] = useState(false);
  const [isPrepayOpen, setIsPrepayOpen] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getLoanReimbursement();
      setList(res.data || []);
    } catch (err) {
      console.error("loadData error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch employees for filter autocomplete
  useEffect(() => {
    const fetchEmps = async () => {
      try {
        const emps = await getActledList();
        if (Array.isArray(emps)) {
          setEmployeeOptions(emps.map((e) => e.Led_name.trim()));
        }
      } catch (err) {
        console.error("fetchEmps error:", err);
      }
    };
    fetchEmps();
  }, []);

  const {
    mode,
    formData,
    setFormData,
    showForm,
    setShowForm,
    saving,
    handleEditCancel,
    handleView,
    handleAdd,
    handleModify,
    performSave,
    rights,
  } = useERPMode(
    initialState,
    async (data) =>
      data.id
        ? await updateLoanReimbursement(data.id, data)
        : await createLoanReimbursement(data),
    loadData,
    tab?.appl_name
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleTabChange = (targetTab) => {
    if (targetTab === "search") {
      setShowForm(false);
    }
    if (targetTab === "entry") {
      setShowForm(true);
    }
  };

  const handleRowSelect = (row) => {
    const index = list.findIndex((item) => item.id === row.id);
    if (index !== -1) {
      setCurrentIndex(index);
    }
    handleView(row);
  };

  const handleSave = async (updatedData = formData) => {
    if (!updatedData.employee_id) {
      showToast({
        icon: "error",
        title: "Please select employee",
      });
      return;
    }

    const response = await performSave("id", updatedData);
    if (response?.success) {
      showToast({
        icon: "success",
        title: "Saved Successfully",
      });
      await loadData();
    }
  };

  const handleDelete = async (row) => {
    const confirmed = await confirmDelete({
      title: `Delete "${row.request_name || row.req_no}" ?`,
    });
    if (!confirmed) return;

    await deleteLoanReimbursement(row.id);
    showToast({
      icon: "success",
      title: "Deleted Successfully",
    });
    loadData();
  };

  const handleDeleteMultiple = async (selected) => {
    const ids = (selected || []).map((item) =>
      typeof item === "object" ? item.id || item.request_name : item
    );
    if (ids.length === 0) return;
    const confirmed = await confirmDelete({
      title: `Delete ${ids.length} record(s)?`,
    });
    if (!confirmed) return;
    try {
      const results = await Promise.all(ids.map((id) => deleteLoanReimbursement(id)));
      const failed = results.filter((r) => !r?.success).length;
      if (failed === 0) {
        showToast({ icon: "success", title: `${ids.length} deleted` });
      } else {
        showToast({
          icon: "warning",
          title: `${ids.length - failed} deleted, ${failed} failed`,
        });
      }
      loadData();
      setShowForm(false);
    } catch (err) {
      alertError("Delete Error", "Failed to delete records");
    }
  };

  useEffect(() => {
    if (list.length > 0 && showForm && currentIndex < list.length) {
      handleView(list[currentIndex]);
    }
  }, [currentIndex, list, showForm]);

  useEffect(() => {
    setERPHandlers({
      onNextRecord: () => setCurrentIndex((p) => Math.min(p + 1, list.length - 1)),
      onPrevRecord: () => setCurrentIndex((p) => Math.max(p - 1, 0)),
      onNew: handleAdd,
      onSave: handleSave,
      onEsc: () => setShowForm(false),
      onBackspaceNavigation: true,
    });
  }, [list, handleAdd, handleSave]);

  // Quick Approve row action
  const handleQuickApprove = async (e, row) => {
    e.stopPropagation();
    try {
      const res = await approveLoanRequest(row.id);
      if (res?.success) {
        showToast({ icon: "success", title: `Approved ${row.req_no || row.request_name}` });
        await loadData();
      } else {
        alertError("Approval Failed", res?.message || "Failed to approve");
      }
    } catch (err) {
      alertError("Error", err?.message);
    }
  };

  // Filter actions
  const handleApplyFilters = () => {
    setFilters({ ...draftFilters });
  };

  const handleClearFilters = () => {
    setDraftFilters(initialFilters);
    setFilters(initialFilters);
  };

  // Filtered dataset
  const filteredList = useMemo(() => {
    return list.filter((item) => {
      if (filters.master_type !== "All" && item.master_type !== filters.master_type) {
        return false;
      }
      if (filters.status !== "All" && (item.status || "Draft") !== filters.status) {
        return false;
      }
      if (
        filters.employee_name &&
        !item.employee_name?.toLowerCase().includes(filters.employee_name.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [list, filters]);

  // Columns: every cell is a single-line flex box so rows align vertically
  const columns = [
    {
      key: "req_no",
      label: "Req No",
      width: 150,
      render: (row) => (
        <span className={`${pill} rounded font-mono font-bold text-blue-700 bg-blue-50 border-blue-200`}>
          {row.req_no || "—"}
        </span>
      ),
    },
    {
      key: "employee_name",
      label: "Employee",
      width: 220,
      render: (row) => (
        <div
          className="flex items-center gap-1 min-w-0"
          title={`${row.employee_name || ""} ${row.employee_code ? `(${row.employee_code})` : ""}`}
        >
          <span className="truncate font-semibold text-slate-900">{row.employee_name || "—"}</span>
          {row.employee_code && (
            <span className="shrink-0 text-[11px] text-slate-400 font-mono">
              ({row.employee_code})
            </span>
          )}
        </div>
      ),
    },
    {
      key: "master_type",
      label: "Type",
      width: 120,
      render: (row) => {
        const type = row.master_type || "Loan";
        return (
          <span className={`${pill} ${TYPE_STYLES[type] || "bg-slate-50 text-slate-700 border-slate-200"}`}>
            {type}
          </span>
        );
      },
    },
    {
      key: "request_name",
      label: "Request Name",
      width: 170,
      render: (row) => (
        <span className="block truncate font-medium text-slate-800" title={row.request_name}>
          {row.request_name || "—"}
        </span>
      ),
    },
    {
      key: "amount",
      label: "Principal",
      type: "number",
      align: "right",
      width: 120,
      render: (row) => (
        <span className="font-bold tabular-nums text-slate-900">
          ₹{Number(row.amount || 0).toLocaleString()}
        </span>
      ),
    },
    {
      key: "monthly_emi",
      label: "Recovery Terms",
      width: 170,
      render: (row) => {
        if (row.master_type === "Advance") {
          return (
            <span className={`${pill} bg-emerald-50 text-emerald-700 border-emerald-200`}>
              1 Month · 0% Interest
            </span>
          );
        }
        if (row.master_type === "Loan") {
          return (
            <span className="text-xs font-semibold tabular-nums text-slate-800 whitespace-nowrap">
              ₹{Number(row.monthly_emi || 0).toLocaleString()}
              <span className="text-[11px] font-normal text-slate-500">
                {" "}
                /mo ({row.tenure_months || 1}m)
              </span>
            </span>
          );
        }
        return <span className="text-slate-400 text-xs">—</span>;
      },
    },
    {
      key: "balance_amount",
      label: "Balance / Repaid",
      width: 170,
      align: "right",
      render: (row) => {
        if (row.master_type !== "Loan" && row.master_type !== "Advance") {
          return <span className="text-slate-400 text-xs">—</span>;
        }

        const total = Number(row.total_payable || row.amount || 0);
        const bal = Number(row.balance_amount || total);
        const paid = Number(row.paid_amount || 0);
        const percent = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;

        const tone =
          percent >= 100
            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
            : percent > 0
              ? "bg-blue-50 text-blue-700 border-blue-200"
              : "bg-slate-100 text-slate-600 border-slate-200";

        return (
          <div className="flex items-center justify-end gap-2">
            <span className="font-semibold tabular-nums text-slate-800">₹{bal.toLocaleString()}</span>
            <span className={`${pill} w-11 ${tone}`}>{percent}%</span>
          </div>
        );
      },
    },
    {
      key: "status",
      label: "Status",
      width: 120,
      align: "center",
      render: (row) => {
        const s = row.status || "Draft";
        return (
          <span className={`${pill} min-w-[76px] ${STATUS_STYLES[s] || "bg-slate-50 text-slate-600 border-slate-200"}`}>
            {s}
          </span>
        );
      },
    },
    {
      key: "actions",
      label: "Actions",
      width: 150,
      align: "center",
      render: (row) => {
        const s = row.status || "Draft";
        const isLoanOrAdv = row.master_type === "Loan" || row.master_type === "Advance";

        return (
          <div
            className="flex items-center justify-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              title="Open"
              onClick={() => handleRowSelect(row)}
              className={`${iconBtn} bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200`}
            >
              <Eye size={12} />
            </button>

            {s === "Pending" && (
              <button
                type="button"
                title="Quick Approve"
                onClick={(e) => handleQuickApprove(e, row)}
                className={`${iconBtn} bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200`}
              >
                <Check size={12} />
              </button>
            )}

            {isLoanOrAdv && (s === "Disbursed" || s === "Closed") && (
              <>
                <button
                  type="button"
                  title="View Repayment Schedule"
                  onClick={() => {
                    setActiveModalLoan(row);
                    setIsScheduleOpen(true);
                  }}
                  className={`${iconBtn} bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300`}
                >
                  <Calendar size={12} />
                </button>
                <button
                  type="button"
                  title="View Audit Ledger"
                  onClick={() => {
                    setActiveModalLoan(row);
                    setIsLedgerOpen(true);
                  }}
                  className={`${iconBtn} bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300`}
                >
                  <List size={12} />
                </button>
              </>
            )}

            {isLoanOrAdv && s === "Disbursed" && (
              <button
                type="button"
                title="Early Prepayment / Settlement"
                onClick={() => {
                  setActiveModalLoan(row);
                  setIsPrepayOpen(true);
                }}
                className={`${iconBtn} bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200`}
              >
                <CreditCard size={12} />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  // Filter Panel
  const filterPanel = (
    <div className="bg-white px-3 py-3 sm:px-5 sm:py-3.5 border-b border-slate-200 shadow-2xs">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        {/* 1. Master Type */}
        <div className="relative min-w-[140px] flex-1 sm:flex-none">
          <label className="absolute -top-2 left-2.5 bg-white px-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wide z-10">
            Type
          </label>
          <select
            value={draftFilters.master_type}
            onChange={(e) => setDraftFilters((p) => ({ ...p, master_type: e.target.value }))}
            className="w-full h-[30px] text-xs border border-gray-300 rounded-md px-2.5 bg-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="All">All Types</option>
            <option value="Loan">Loan</option>
            <option value="Advance">Advance</option>
            <option value="Reimbursement">Reimbursement</option>
            <option value="Coupon">Coupon</option>
          </select>
        </div>

        {/* 2. Status */}
        <div className="relative min-w-[150px] flex-1 sm:flex-none">
          <label className="absolute -top-2 left-2.5 bg-white px-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wide z-10">
            Status
          </label>
          <select
            value={draftFilters.status}
            onChange={(e) => setDraftFilters((p) => ({ ...p, status: e.target.value }))}
            className="w-full h-[30px] text-xs border border-gray-300 rounded-md px-2.5 bg-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending Approval</option>
            <option value="Approved">Approved (Ready to Disburse)</option>
            <option value="Disbursed">Disbursed (Active)</option>
            <option value="Closed">Closed</option>
            <option value="Draft">Draft</option>
            <option value="Rejected">Rejected</option>
            <option value="Returned">Returned</option>
          </select>
        </div>

        {/* 3. Employee */}
        <div className="relative min-w-[200px] flex-1 sm:flex-none">
          <label className="absolute -top-2 left-2.5 bg-white px-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wide z-10">
            Employee
          </label>
          <ERPAutocomplete
            options={employeeOptions}
            value={draftFilters.employee_name}
            onChange={(val) => setDraftFilters((p) => ({ ...p, employee_name: val || "" }))}
            className="w-full h-[30px] text-xs border border-gray-300 rounded-md px-2.5 bg-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="Search employee..."
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 sm:ml-auto">
          <button
            type="button"
            onClick={handleApplyFilters}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1 rounded-md transition duration-150 ease-in-out shadow-xs h-[30px] cursor-pointer"
          >
            <Filter size={11} />
            Apply
          </button>
          <button
            type="button"
            onClick={handleClearFilters}
            className="flex items-center gap-1.5 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold px-3 py-1 rounded-md border border-gray-300 transition duration-150 ease-in-out shadow-xs h-[30px] cursor-pointer"
          >
            <X size={11} />
            Clear
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full w-full flex flex-col font-sans">
      {showForm ? (
        <LoanReimMasterForm
          initialData={formData}
          setFormData={setFormData}
          onSave={handleSave}
          onCancel={() => setShowForm(false)}
          onDelete={handleDelete}
          mode={mode}
          saving={saving}
          onModify={handleModify}
          onNewEntry={handleAdd}
          currentRecord={list.length > 0 ? currentIndex + 1 : 0}
          totalRecords={list.length}
          rights={rights}
          onEditCancel={handleEditCancel}
          activeTab="entry"
          onTabChange={handleTabChange}
          onPrevRecord={() => setCurrentIndex((p) => Math.max(p - 1, 0))}
          onNextRecord={() => setCurrentIndex((p) => Math.min(p + 1, list.length - 1))}
          onReload={loadData}
          employeeOptions={employeeOptions}
        />
      ) : (
        <div className="bg-slate-50 h-full flex flex-col overflow-hidden">
          <Table
            title="Loan / Reimbursement Master"
            storageKey="loan-reim-master-table-v4"
            onDeleteMultiple={handleDeleteMultiple}
            activeTab="search"
            onTabChange={handleTabChange}
            data={filteredList}
            columns={columns}
            rowKey="id"
            loading={loading}
            onAdd={rights?.add === 1 ? handleAdd : null}
            onRowDoubleClick={handleRowSelect}
            onRefresh={loadData}
            showForm={showFilter}
            onToggleFilter={() => setShowFilter((prev) => !prev)}
            formComponent={filterPanel}
          />
        </div>
      )}

      {/* Row Modals */}
      <LoanScheduleModal
        isOpen={isScheduleOpen}
        onClose={() => {
          setIsScheduleOpen(false);
          setActiveModalLoan(null);
        }}
        loan={activeModalLoan}
      />

      <LoanLedgerModal
        isOpen={isLedgerOpen}
        onClose={() => {
          setIsLedgerOpen(false);
          setActiveModalLoan(null);
        }}
        loan={activeModalLoan}
      />

      <LoanPrepayModal
        isOpen={isPrepayOpen}
        onClose={() => {
          setIsPrepayOpen(false);
          setActiveModalLoan(null);
        }}
        loan={activeModalLoan}
        onSuccess={loadData}
      />
    </div>
  );
};

export default LoanReimMaster;