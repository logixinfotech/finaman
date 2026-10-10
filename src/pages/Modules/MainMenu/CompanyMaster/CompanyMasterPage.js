import { useEffect, useState, useCallback, useMemo, useRef, memo } from "react";
import CompanyMasterForm from "./CompanyMasterEntry";
import CompanyMasterFilterForm from "./CompanyMasterList";
import Table from "../../../../components/Reusable/table/Table";
import ERPPrintPreview from "../../../../components/Reusable/ERPPrintPreview";

import {
  showToast,
  alertError,
  confirmDelete,
} from "../../../../components/Reusable/alert";
import {
  getCompanyList,
  createCompany,
  updateCompany,
  deleteCompany,
  provisionCompanyDb,
} from "../../../../utils/api";
import { setERPHandlers } from "../../../../utils/erpShortcuts";
import { useERPMode } from "../../../../components/Reusable/form/useFormMode";
import { usePrintWorkflow } from "../../../../Hooks/usePrintWorkflow";

const initialState = {
  company_id: null,
  com_id: "",  
  com_code: "",
  database: "",
  company_name: "",
  trade_name: "",
  business_type: "",
  business_address: "",
  postal_code: "",
  phone_number: "",
  email_address: "",
  website_url: "",
  country: "",
  state: "",
  city: "",
  gstin_number: "",
  pan_number: "",
  cin_number: "",
  tan_no: "",
  gst_type: "",
  iec_code: "",
  msme_no: "",
  drug_lic_no: "",
  drug_valid_from: "",
  drug_valid_to: "",
  fssai_no: "",
  fssai_from: "",
  fssai_to: "",
  mfg_lic_no: "",
  mfg_from: "",
  mfg_to: "",
  bank_name: "",
  bank_account_number: "",
  bank_ifsc_code: "",
  branch_name: "",
  account_type: "",
  bank_address: "",
  swift_code: "",
  upi_id: "",
  micr_code: "",
  contact_person: "",
  designation: "",
  alt_phone: "",
  alt_email: "",
  default_gst_rate: 0,
  default_tax_type: "Exclusive",
  tds_applicable: false,
  tcs_applicable: false,
  tax_method: "FIFO",
  default_language: "English",
  date_format: "DD/MM/YYYY",
  number_format: "Indian",
  fin_year_from: "",
  fin_year_to: "",
  fy_lock: false,
  auto_backup: false,
  company_status: "Active",
  logo: "",
}; 
const SEARCH_DEBOUNCE_MS = 300;

const useMediaQuery = (query) => {
  const get = () =>
    typeof window !== "undefined" && typeof window.matchMedia === "function"
      ? window.matchMedia(query).matches
      : false;

  const [matches, setMatches] = useState(get);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mql = window.matchMedia(query);
    const onChange = (e) => setMatches(e.matches);
    setMatches(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
};

const TONES = {
  success: { box: "bg-emerald-50 text-emerald-700 ring-emerald-600/20", dot: "bg-emerald-500" },
  warn: { box: "bg-amber-50 text-amber-800 ring-amber-600/25", dot: "bg-amber-500 animate-pulse" },
  danger: { box: "bg-red-50 text-red-700 ring-red-600/20", dot: "bg-red-500" },
};

const Badge = memo(({ tone = "success", children }) => (
  <span
    className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-semibold rounded-full ring-1 ring-inset whitespace-nowrap ${TONES[tone].box}`}
  >
    <span className={`w-1.5 h-1.5 rounded-full ${TONES[tone].dot}`} />
    {children}
  </span>
));

/* ── Tenant DB dialog: confirm → running → done | error ─────────────────── */
const TenantDbDialog = memo(({ state, onYes, onClose }) => {
  const phase = state?.phase;

  useEffect(() => {
    if (!phase) return;
    const onKey = (e) => {
      // Enter on a focused button is handled by the button itself
      if (phase === "confirm" && e.key === "Enter" && e.target?.tagName !== "BUTTON") {
        e.preventDefault();
        onYes();
      }
      if (e.key === "Escape" && phase !== "running") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [phase, onYes, onClose]);

  if (!state) return null;
  const { company_name, database, result, error } = state;
  const canClose = phase !== "running";

  return (
    <div
      className="fixed inset-0 z-[1000] bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && canClose) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="tenant-db-title"
        className="w-full sm:max-w-[520px] max-h-[90vh] flex flex-col bg-white border border-slate-200 rounded-t-xl sm:rounded-lg shadow-2xl text-[12px] text-slate-800"
      >
        <div className="px-3 py-2.5 border-b border-slate-200 bg-slate-50 rounded-t-xl sm:rounded-t-lg font-semibold flex items-center justify-between">
          <span id="tenant-db-title" className="truncate">
            Tenant Database — {database}
          </span>
          {canClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="text-slate-500 hover:text-slate-800 w-8 h-8 sm:w-6 sm:h-6 flex items-center justify-center rounded hover:bg-slate-200"
            >
              ✕
            </button>
          )}
        </div>

        <div className="px-3 py-3 space-y-2 overflow-y-auto" aria-live="polite">
          {phase === "confirm" && (
            <>
              <p>
                Company <b>{company_name}</b> has been saved.
              </p>
              <p>
                Database <b>{database}</b> does not exist on the server. Create it now with the full
                FINAMAN schema (all tables, keys, indexes and seed data)?
              </p>
              <p className="text-slate-500">
                If you choose Later, the company stays <b>Pending DB</b> and cannot be logged into
                until the database is created from the list.
              </p>
            </>
          )}

          {phase === "running" && (
            <div className="flex items-center gap-2">
              <span className="inline-block w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin motion-reduce:animate-none" />
              <span>Creating database and applying schema… this can take a minute.</span>
            </div>
          )}

          {phase === "done" && result && (
            <>
              <p className="text-emerald-700 font-semibold">Database ready.</p>
              <div className="overflow-x-auto">
                <table className="w-full border border-slate-200">
                  <tbody> 
                    <tr>
                      <td className="px-2 py-1 border-b bg-slate-50 w-32 sm:w-40">Created</td>
                      <td className="px-2 py-1 border-b">
                        {result.created ? "Yes" : "Already existed — upgraded"}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-2 py-1 border-b bg-slate-50">Files applied</td>
                      <td className="px-2 py-1 border-b break-words">
                        {result.files_applied?.length
                          ? result.files_applied.join(", ")
                          : "none (up to date)"}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-2 py-1 border-b bg-slate-50">Tables</td>
                      <td className="px-2 py-1 border-b">
                        {result.tables_created}
                        {result.template_tables != null ? ` (template: ${result.template_tables})` : ""}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-2 py-1 bg-slate-50">Time</td>
                      <td className="px-2 py-1">
                        {((result.duration_ms || 0) / 1000).toFixed(1)} s
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          )}

          {phase === "error" && (
            <>
              <p className="text-red-700 font-semibold">Database creation failed.</p>
              <p className="font-mono whitespace-pre-wrap break-words bg-red-50 border border-red-200 p-2 rounded max-h-48 overflow-y-auto">
                {error?.file ? `${error.file} — batch ${error.batch}\n` : ""}
                {error?.sqlError || error?.message}
              </p>
              <p className="text-slate-500">
                Fix the cause and run <b>Create DB</b> again — it resumes from the failed file.
              </p>
            </>
          )}
        </div>

        <div className="px-3 py-2 border-t border-slate-200 bg-slate-50 flex justify-end gap-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          {phase === "confirm" && (
            <>
              <button
                type="button"
                onClick={onClose}
                className="h-9 sm:h-7 px-3 border border-slate-300 bg-white rounded hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
              >
                Later (Esc)
              </button>
              <button
                type="button"
                autoFocus
                onClick={onYes}
                className="h-9 sm:h-7 px-3 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                Yes, create (Enter)
              </button>
            </>
          )}
          {(phase === "done" || phase === "error") && (
            <button
              type="button"
              autoFocus
              onClick={onClose}
              className="h-9 sm:h-7 px-3 bg-slate-700 text-white rounded hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-700"
            >
              Close (Esc)
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

/* ── Page ───────────────────────────────────────────────────────────────── */
const CompanyMasterPage = ({ tab }) => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [filters, setFilters] = useState({});
  const [showFilter, setShowFilter] = useState(false);
  const [formTab, setFormTab] = useState("basic");

  // { phase: 'confirm'|'running'|'done'|'error', company_id, company_name, database, result?, error? }
  const [dbDialog, setDbDialog] = useState(null);

  const isMobile = useMediaQuery("(max-width: 767px)");

  // Always-fresh list params without re-creating callbacks
  const paramsRef = useRef({ filters, page, pageSize });
  paramsRef.current = { filters, page, pageSize };

  // Guards against out-of-order responses and unmounted updates
  const requestIdRef = useRef(0);
  const mountedRef = useRef(true);
  const searchTimerRef = useRef(null);
  const provisioningRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearTimeout(searchTimerRef.current);
    };
  }, []);

  const printWorkflow = usePrintWorkflow({
    printBaseUrl: "/api/print/company_master",
    applName: "company_master",
    emailEndpoint: "/api/print/company_master",
    shareLinkEndpoint: "/api/print/company_master",
  });

  const loadCompanyList = useCallback(
    async (currentFilters = {}, currentPage = 1, currentPageSize = 100) => {
      const reqId = ++requestIdRef.current;
      try {
        setLoading(true);
        const response = await getCompanyList({
          page: currentPage,
          pageSize: currentPageSize,
          filters: currentFilters,
        });
        // A newer request has started — ignore this stale response
        if (!mountedRef.current || reqId !== requestIdRef.current) return;

        setList(
          Array.isArray(response.data)
            ? response.data
            : response?.data?.data || [],
        );
        setTotalRecords(response.total ?? response?.data?.total ?? 0);
      } catch (err) {
        if (mountedRef.current && reqId === requestIdRef.current) {
          alertError("Fetch Error", "Failed to load companies");
        }
      } finally {
        if (mountedRef.current && reqId === requestIdRef.current) setLoading(false);
      }
    },
    [],
  );

  // Reload with whatever the current filters/page are
  const refreshList = useCallback(() => {
    const { filters: f, page: p, pageSize: ps } = paramsRef.current;
    return loadCompanyList(f, p, ps);
  }, [loadCompanyList]);

  const {
    mode,
    formData,
    setFormData,
    showForm,
    setShowForm,
    saving,
    rights,
    canPrint,
    handleView,
    handleAdd,
    handleModify,
    performSave,
    handleEditCancel,
    isEditMode,
    activeTab,
    setActiveTab,
  } = useERPMode(
    initialState,
    async (data, isEdit) => {
      const payload = {
        ...data,
        appl_name: tab?.appl_name,
      };
      if (isEdit) {
        return await updateCompany(data.company_id, payload);
      } else {
        return await createCompany(payload);
      }
    },
    refreshList,
    tab?.appl_name,
  );

  /* ── Columns (memoised; secondary columns are hidden on mobile) ──────── */
  const columns = useMemo(() => {
    const all = [
      { key: "com_code", label: "Code" },
      { key: "company_name", label: "Company Name" },
      { key: "database", label: "Database", hideOnMobile: true },
      {
        key: "db_status",
        label: "DB",
        render: (row) =>
          row.db_status === "Active" ? (
            <Badge tone="success">Active</Badge>
          ) : (
            <button
              type="button"
              title="Create the tenant database"
              aria-label={`Create database for ${row.company_name}`}
              onClick={(e) => {
                e.stopPropagation();
                setDbDialog({
                  phase: "confirm",
                  company_id: row.company_id,
                  company_name: row.company_name,
                  database: row.database,
                });
              }}
              onDoubleClick={(e) => e.stopPropagation()}
              className="inline-flex items-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 hover:brightness-95 active:scale-95 transition"
            >
              <Badge tone="warn">{row.db_status || "Pending"} · Create DB</Badge>
            </button>
          ),
      },
      { key: "trade_name", label: "Trade Name", hideOnMobile: true },
      { key: "phone_number", label: "Phone", hideOnMobile: true },
      { key: "email_address", label: "Email", hideOnMobile: true },
      { key: "gstin_number", label: "GSTIN", hideOnMobile: true },
      { key: "pan_number", label: "PAN", hideOnMobile: true },
      { key: "business_type", label: "Type", hideOnMobile: true },
      {
        key: "company_status",
        label: "Status",
        render: (row) => (
          <Badge tone={row.company_status === "Active" ? "success" : "danger"}>
            {row.company_status}
          </Badge>
        ),
      },
    ];
    return isMobile ? all.filter((c) => !c.hideOnMobile) : all;
  }, [isMobile]);

  const handleTabChange = useCallback(
    (targetTab) => {
      setActiveTab(targetTab);
      if (targetTab === "search") setShowForm(false);
      if (targetTab === "entry") setShowForm(true);
    },
    [setShowForm, setActiveTab],
  );

  useEffect(() => {
    loadCompanyList(filters, page, pageSize);
  }, [page, pageSize, filters, loadCompanyList]);

  useEffect(() => {
    if (showForm && mode === "view" && list.length > 0) {
      setFormData(list[currentIndex]);
    }
  }, [currentIndex, list, showForm, mode, setFormData]);

  const handleRowSelect = useCallback(
    (row) => {
      const index = list.findIndex(
        (item) => item.company_id === row.company_id,
      );
      if (index !== -1) setCurrentIndex(index);
      handleView(row);
      setShowForm(true);
    },
    [list, handleView, setShowForm],
  );

  /* ── Tenant DB provisioning ──────────────────────────────────────────── */
  const runProvision = useCallback(
    async (company_id, company_name, database) => {
      if (provisioningRef.current) return; // block double-click / double-Enter
      provisioningRef.current = true;
      setDbDialog({ phase: "running", company_id, company_name, database });
      try {
        const r = await provisionCompanyDb(company_id);
        if (r?.success) {
          setDbDialog({ phase: "done", company_id, company_name, database, result: r });
          showToast({ icon: "success", title: `Database ${database} ready` });
          await refreshList();
        } else {
          setDbDialog({ phase: "error", company_id, company_name, database, error: r });
        }
      } catch (e) {
        const data = e?.response?.data || { message: e.message };
        setDbDialog({ phase: "error", company_id, company_name, database, error: data });
      } finally {
        provisioningRef.current = false;
      }
    },
    [refreshList],
  );

  const handleDbYes = useCallback(() => {
    if (dbDialog) runProvision(dbDialog.company_id, dbDialog.company_name, dbDialog.database);
  }, [dbDialog, runProvision]);

  const handleDbClose = useCallback(() => setDbDialog(null), []);

  const handleSave = useCallback(async () => {
    try {
      const response = await performSave("company_id");
      if (response?.success) {
        showToast({
          icon: "success",
          title: isEditMode ? "Updated successfully" : "Added successfully",
        });
        await refreshList();

        // New company whose database does not exist yet -> ask to create it
        if (!isEditMode && response.db_exists === false && response.data?.company_id) {
          setDbDialog({
            phase: "confirm",
            company_id: response.data.company_id,
            company_name: response.data.company_name,
            database: response.data.database,
          });
        }
      } else if (response?.message) {
        alertError("Error", response.message);
      }
    } catch (err) {
      alertError("Error", err?.response?.data?.message || err?.message || "Save failed");
    }
  }, [performSave, isEditMode, refreshList]);

  const handleDelete = useCallback(
    async (row) => {
      const id = row?.company_id ?? formData?.company_id;
      const name = row?.company_name ?? formData?.company_name;
      if (!id) return alertError("Error", "Company ID missing");

      const confirmed = await confirmDelete({
        title: `Delete "${name}"?`,
        text: "This action cannot be undone.",
      });
      if (!confirmed) return;

      try {
        const res = await deleteCompany(id);
        if (res?.success) {
          showToast({ icon: "success", title: "Deleted successfully" });
          setShowForm(false);
          await refreshList();
        } else {
          alertError("Error", res?.message ?? "Delete failed");
        }
      } catch (err) {
        alertError("Error", err?.response?.data?.message || "Delete failed");
      }
    },
    [formData, setShowForm, refreshList],
  );

  const handleDeleteMultiple = useCallback(
    async (ids) => {
      const confirmed = await confirmDelete({
        title: `Delete ${ids.length} record${ids.length > 1 ? "s" : ""}?`,
        text: "This action cannot be undone.",
      });
      if (!confirmed) return;

      try {
        setLoading(true);
        const results = await Promise.allSettled(ids.map((id) => deleteCompany(id)));
        const ok = results.filter(
          (r) => r.status === "fulfilled" && r.value?.success !== false,
        ).length;
        const failed = ids.length - ok;

        if (failed === 0) {
          showToast({ icon: "success", title: "Deleted successfully" });
        } else if (ok === 0) {
          alertError("Delete Error", "None of the selected records could be deleted");
        } else {
          showToast({
            icon: "warning",
            title: `${ok} of ${ids.length} deleted — ${failed} failed`,
          });
        }
      } finally {
        await refreshList();
      }
    },
    [refreshList],
  );

  const handlePrint = useCallback(
    (row) => {
      const id = row?.company_id ?? formData?.company_id;
      printWorkflow.openPrintFor(id, {
        fileName: formData?.company_name,
        contextLabel: formData?.company_name,
      });
    },
    [formData, printWorkflow],
  );

  // Debounced: one API call after the user pauses typing, not one per keystroke
  const handleSearch = useCallback((searchTerm) => {
    clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setFilters((prev) =>
        prev.company_name === searchTerm ? prev : { ...prev, company_name: searchTerm },
      );
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
  }, []);

  const applyFilter = useCallback(() => {
    setPage(1);
  }, []);

  const clearFilter = useCallback(() => {
    setFilters({});
    setPage(1);
  }, []);

  const handlePageChange = useCallback((newPage, newPageSize) => {
    setPageSize(newPageSize);
    setPage(newPage);
  }, []);

  const handleToggleFilter = useCallback(() => setShowFilter((p) => !p), []);
  const handleCloseForm = useCallback(() => setShowForm(false), [setShowForm]);
  const handlePrevRecord = useCallback(
    () => setCurrentIndex((p) => Math.max(p - 1, 0)),
    [],
  );
  const handleNextRecord = useCallback(
    () => setCurrentIndex((p) => Math.min(p + 1, Math.max(list.length - 1, 0))),
    [list.length],
  );

  useEffect(() => {
    setERPHandlers({
      onNextRecord: handleNextRecord,
      onPrevRecord: handlePrevRecord,
      onFirstRecord: () => setCurrentIndex(0),
      onLastRecord: () => setCurrentIndex(Math.max(list.length - 1, 0)),
      onNew: handleAdd,
      onSave: handleSave,
      onEsc: handleCloseForm,
    });
  }, [list.length, handleNextRecord, handlePrevRecord, handleAdd, handleSave, handleCloseForm]);

  const currentRecord = totalRecords > 0 ? currentIndex + 1 : 0;

  // Filter form element is memoised so the Table doesn't re-render for unrelated state
  const filterForm = useMemo(
    () => (
      <CompanyMasterFilterForm
        filters={filters}
        setFilters={setFilters}
        onApply={applyFilter}
        onClear={clearFilter}
      />
    ),
    [filters, applyFilter, clearFilter],
  );

  return (
    <div className="h-full">
      <TenantDbDialog state={dbDialog} onYes={handleDbYes} onClose={handleDbClose} />

      {printWorkflow.isOpen ? (
        <ERPPrintPreview title="Company Master" {...printWorkflow.printProps} />
      ) : showForm ? (
        <CompanyMasterForm
          formData={formData}
          setFormData={setFormData}
          mode={mode}
          formTab={formTab}
          onSave={handleSave}
          onCancel={handleCloseForm}
          onDelete={handleDelete}
          onPrint={handlePrint}
          onModify={handleModify}
          onNewEntry={handleAdd}
          onEditCancel={handleEditCancel}
          saving={saving}
          headerActiveTab={activeTab}
          showSettingsTab={true}
          rights={rights}
          canPrint={canPrint}
          currentRecord={currentRecord}
          totalRecords={totalRecords}
          activeTab={activeTab}
          onFormTabChange={setFormTab}
          onHeaderTabChange={handleTabChange}
          onPrevRecord={handlePrevRecord}
          onNextRecord={handleNextRecord}
        />
      ) : (
        <Table
          title="Company Master"
          activeTab="search"
          onTabChange={handleTabChange}
          data={list}
          columns={columns}
          rowKey="company_id"
          loading={loading}
          onAdd={rights?.add === 1 ? handleAdd : null}
          onRefresh={refreshList}
          onSearch={handleSearch}
          showForm={showFilter}
          onToggleFilter={handleToggleFilter}
          formComponent={filterForm}
          serverPagination={true}
          totalRecords={totalRecords}
          onPageChange={handlePageChange}
          defaultPageSize={pageSize}
          onRowDoubleClick={handleRowSelect}
          onDeleteMultiple={handleDeleteMultiple}
        />
      )}
    </div>
  );
};

export default CompanyMasterPage;
