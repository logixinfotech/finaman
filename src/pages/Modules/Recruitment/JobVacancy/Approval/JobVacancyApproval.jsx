import { useState, useEffect, useCallback, useMemo } from "react";
import Table from "../../../../../components/Reusable/table/Table";
import UnivarsalFilter from "../../../../../components/Reusable/Filter/UnivarsalFilter";
import { useGroupOptions } from "../../../../../Hooks/useUserGroupOption";
import {
  getJobVacancies,
  getJobVacancyById,
  updateVacancyStatus,
} from "../../../../../utils/recruitmentApi";
import { showToast } from "../../../../../components/Reusable/alert";
import {
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  CheckCheck,
  AlertCircle,
  Building2,
  Briefcase,
  Users,
  Layers,
  DollarSign,
  ShieldCheck,
  History,
  X,
  Search,
  Filter,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { FaUserCheck } from "react-icons/fa";

// --- STATUS & PRIORITY BADGE STYLES ---
const STATUS_BADGES = {
  Draft: "bg-slate-100 text-slate-700 border-slate-300",
  "Pending Approval": "bg-amber-50 text-amber-800 border-amber-300 font-semibold",
  Approved: "bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold",
  Open: "bg-blue-50 text-blue-800 border-blue-300 font-semibold",
  "On Hold": "bg-purple-50 text-purple-800 border-purple-300",
  Closed: "bg-slate-100 text-slate-700 border-slate-300",
  Rejected: "bg-rose-50 text-rose-800 border-rose-300 font-semibold",
  Cancelled: "bg-rose-50 text-rose-700 border-rose-200",
};

const PRIORITY_BADGES = {
  Urgent: "bg-rose-50 text-rose-700 border-rose-300 font-semibold",
  High: "bg-orange-50 text-orange-700 border-orange-300 font-semibold",
  Normal: "bg-slate-50 text-slate-700 border-slate-200",
  Low: "bg-slate-50 text-slate-500 border-slate-200",
};

const STATUS_FILTER_OPTIONS = [
  "All",
  "Pending Approval",
  "Approved",
  "Rejected",
  "On Hold",
  "Draft",
  "Open",
  "Closed",
];

const EMPTY_ACTION = {
  isOpen: false,
  type: null, // "Approved" | "Rejected" | "On Hold"
  vacancyId: null,
  vacancyNo: "",
  remarks: "",
};

// Small pill badge — inline-flex + fixed height so it never stretches to the row height
const Pill = ({ className = "", children }) => (
  <span
    className={`inline-flex items-center h-5 px-2 rounded-full border text-[10px] font-medium leading-none whitespace-nowrap ${className}`}
  >
    {children}
  </span>
);

// true below Tailwind's `md` breakpoint (768px) — switches table -> card list
const useIsMobile = (breakpoint = 768) => {
  const query = `(max-width: ${breakpoint - 1}px)`;
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.matchMedia(query).matches : false
  );
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = (e) => setIsMobile(e.matches);
    setIsMobile(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [query]);
  return isMobile;
};

const JobVacancyApproval = () => {
  const [vacancies, setVacancies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const isMobile = useIsMobile();
  const [search, setSearch] = useState("");

  // Detail Modal State
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedVacancy, setSelectedVacancy] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Approval / Action Remarks Dialog State
  const [actionModal, setActionModal] = useState(EMPTY_ACTION);
  const [actionLoading, setActionLoading] = useState(false);

  const { groupOptions } = useGroupOptions();

  // Filter State for UnivarsalFilter
  const [filters, setFilters] = useState({
    filterType: "Month Wise",
    from_date: "",
    to_date: "",
    department_id: "",
    department_name: "",
    status: "All",
  });

  // Load Vacancies
  const fetchVacancies = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.department_id) params.department_id = filters.department_id;
      const res = await getJobVacancies(params);
      if (res?.success && Array.isArray(res.data)) {
        setVacancies(res.data);
      } else {
        setVacancies([]);
      }
    } catch (err) {
      console.error("Error fetching vacancies:", err);
      showToast({ icon: "error", title: "Failed to load vacancies" });
    } finally {
      setLoading(false);
    }
  }, [filters.department_id]);

  useEffect(() => {
    fetchVacancies();
  }, [fetchVacancies]);

  // Esc closes the top-most modal + lock background scroll while a modal is open
  useEffect(() => {
    if (!detailModalOpen && !actionModal.isOpen) return;

    const onKey = (e) => {
      if (e.key !== "Escape") return;
      if (actionModal.isOpen) setActionModal(EMPTY_ACTION);
      else setDetailModalOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [detailModalOpen, actionModal.isOpen]);

  // Load Full Vacancy Details for Modal
  const openDetailModal = async (id) => {
    setDetailLoading(true);
    setDetailModalOpen(true);
    try {
      const res = await getJobVacancyById(id);
      if (res?.success && res.data) {
        setSelectedVacancy(res.data);
      } else {
        showToast({ icon: "error", title: "Could not fetch details" });
        setDetailModalOpen(false);
      }
    } catch (err) {
      console.error(err);
      showToast({ icon: "error", title: "Error loading vacancy details" });
      setDetailModalOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  // Status Action Handler
  const handleOpenAction = (type, row) => {
    setActionModal({
      isOpen: true,
      type,
      vacancyId: row?.vacancy_id || null,
      vacancyNo: row?.vacancy_no || "",
      remarks: "",
    });
  };

  const handleConfirmAction = async () => {
    const { type, vacancyId, remarks } = actionModal;
    if (!type || !vacancyId) return;

    if (type === "Rejected" && !remarks?.trim()) {
      showToast({ icon: "warning", title: "Remarks are required for rejection" });
      return;
    }

    setActionLoading(true);
    try {
      const res = await updateVacancyStatus(vacancyId, type, remarks);
      if (res?.success) {
        showToast({
          icon: "success",
          title: `Vacancy status updated to ${type}`,
        });
        setActionModal(EMPTY_ACTION);
        if (detailModalOpen && selectedVacancy?.vacancy_id === vacancyId) {
          openDetailModal(vacancyId);
        }
        fetchVacancies();
      } else {
        showToast({
          icon: "error",
          title: res?.message || "Failed to update status",
        });
      }
    } catch (err) {
      console.error(err);
      showToast({ icon: "error", title: "Action failed: " + err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered List based on Universal Filter
  const filteredData = useMemo(() => {
    return vacancies.filter((row) => {
      const status = (row.vacancy_status || "Draft").trim();

      // Universal Filter: Status
      if (filters.status && filters.status !== "All") {
        if (status.toLowerCase() !== filters.status.toLowerCase()) return false;
      }

      // Universal Filter: Department
      if (filters.department_name) {
        if (
          !row.department_name
            ?.toLowerCase()
            .includes(filters.department_name.toLowerCase())
        ) {
          return false;
        }
      }

      // Universal Filter: Date Range
      if (filters.from_date && row.vacancy_date) {
        const rowDate = new Date(row.vacancy_date);
        const fromDate = new Date(filters.from_date);
        if (rowDate < fromDate) return false;
      }
      if (filters.to_date && row.vacancy_date) {
        const rowDate = new Date(row.vacancy_date);
        const toDate = new Date(filters.to_date);
        toDate.setHours(23, 59, 59, 999);
        if (rowDate > toDate) return false;
      }

      return true;
    });
  }, [vacancies, filters]);

  // Mobile card list: same filtered data + quick text search
  const mobileList = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return filteredData;
    return filteredData.filter((r) =>
      [r.vacancy_no, r.designation_name, r.job_role, r.department_name, r.requested_by_name]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [filteredData, search]);

  // Table columns — widths tuned so nothing clips (esp. Approval Actions),
  // text cells truncate on one line, badges are compact pills.
  const columns = [
    {
      key: "vacancy_no",
      label: "Vacancy No",
      width: 140,
      render: (row) => (
        <span
          onClick={(e) => {
            e.stopPropagation();
            openDetailModal(row.vacancy_id);
          }}
          className="block truncate font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
          title="Click to view details"
        >
          {row.vacancy_no}
        </span>
      ),
    },
    {
      key: "vacancy_date",
      label: "Date",
      width: 110,
      render: (row) => (
        <span className="block whitespace-nowrap">
          {row.vacancy_date
            ? new Date(row.vacancy_date).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
            : "—"}
        </span>
      ),
    },
    {
      key: "designation_name",
      label: "Designation / Role",
      width: 200,
      render: (row) => (
        <span
          className="block truncate text-slate-800 font-medium"
          title={row.designation_name || row.job_role}
        >
          {row.designation_name || row.job_role || "—"}
        </span>
      ),
    },
    {
      key: "department_name",
      label: "Department",
      width: 160,
      render: (row) => (
        <span className="block truncate text-slate-700" title={row.department_name}>
          {row.department_name || "—"}
        </span>
      ),
    },
    {
      key: "positions",
      label: "Positions",
      width: 100,
      render: (row) => (
        <span className="block whitespace-nowrap font-medium text-slate-700">
          <span className="text-blue-600 font-semibold">{row.number_of_positions || 1}</span>
          <span className="text-slate-400 mx-1">/</span>
          <span className="text-emerald-600 font-semibold">{row.filled_positions || 0}</span>
        </span>
      ),
    },
    {
      key: "priority",
      label: "Priority",
      width: 100,
      render: (row) => {
        const p = row.priority || "Normal";
        return <Pill className={PRIORITY_BADGES[p] || PRIORITY_BADGES.Normal}>{p}</Pill>;
      },
    },
    {
      key: "requested_by_name",
      label: "Requested By",
      width: 160,
      render: (row) => (
        <span className="block truncate text-slate-700" title={row.requested_by_name}>
          {row.requested_by_name || "—"}
        </span>
      ),
    },
    {
      key: "ctc_range",
      label: "CTC Range (₹)",
      width: 150,
      render: (row) => {
        const min = row.min_ctc ? Number(row.min_ctc).toLocaleString("en-IN") : "0";
        const max = row.max_ctc ? Number(row.max_ctc).toLocaleString("en-IN") : "0";
        if (min === "0" && max === "0") return <span className="text-slate-400">—</span>;
        return (
          <span className="block whitespace-nowrap text-slate-700">
            ₹{min} - {max}
          </span>
        );
      },
    },
    {
      key: "vacancy_status",
      label: "Status",
      width: 130,
      render: (row) => {
        const s = row.vacancy_status || "Draft";
        return <Pill className={STATUS_BADGES[s] || STATUS_BADGES.Draft}>{s}</Pill>;
      },
    },
    {
      key: "actions",
      label: "Approval Actions",
      width: 210, // Approve + Reject + Eye need ~190px — 160 was clipping the eye icon
      render: (row) => {
        const s = (row.vacancy_status || "").trim();
        const isApproved = s === "Approved" || s === "Open";

        return (
          <div
            className="flex items-center gap-1.5 py-0.5 whitespace-nowrap"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Quick Approve Button */}
            {!isApproved ? (
              <button
                type="button"
                onClick={() => handleOpenAction("Approved", row)}
                title="Approve Vacancy"
                className="h-[22px] px-2 text-[10.5px] font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded flex items-center gap-1 transition-colors cursor-pointer"
              >
                <CheckCircle size={11} />
                Approve
              </button>
            ) : (
              <span className="text-[10.5px] text-emerald-700 font-medium flex items-center gap-1 bg-emerald-50 px-2 h-[22px] rounded border border-emerald-200">
                <CheckCheck size={11} /> Approved
              </span>
            )}

            {/* Quick Reject Button */}
            {s !== "Rejected" && (
              <button
                type="button"
                onClick={() => handleOpenAction("Rejected", row)}
                title="Reject Vacancy"
                className="h-[22px] px-2 text-[10.5px] font-medium bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded flex items-center gap-1 transition-colors cursor-pointer"
              >
                <XCircle size={11} />
                Reject
              </button>
            )}

            {/* Quick Details Eye */}
            <button
              type="button"
              onClick={() => openDetailModal(row.vacancy_id)}
              title="View Full Details"
              className="h-[22px] w-[22px] shrink-0 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded transition-colors cursor-pointer"
            >
              <Eye size={13} />
            </button>
          </div>
        );
      },
    },
  ];

  const closeActionModal = () => setActionModal(EMPTY_ACTION);
  const isOnHold = (selectedVacancy?.vacancy_status || "").trim().toLowerCase() === "on hold";

  // Small label/value row used in the detail cards
  const Field = ({ label, children }) => (
    <div className="flex items-start gap-1.5 min-w-0">
      <span className="text-slate-500 shrink-0">{label}:</span>
      <span className="font-medium text-slate-800 min-w-0 break-words">{children}</span>
    </div>
  );

  // Shared filter panel (desktop: inside Table, mobile: collapsible under the header)
  const filterPanel = (
    <UnivarsalFilter
      options={{
        ...groupOptions,
        status: STATUS_FILTER_OPTIONS,
      }}
      filters={filters}
      visibleFields={["filterType", "department", "status"]}
      setFilters={setFilters}
      onApply={() => fetchVacancies()}
      onClear={() => {
        setFilters({
          filterType: "Month Wise",
          from_date: "",
          to_date: "",
          department_id: "",
          department_name: "",
          status: "All",
        });
      }}
      setShowFilter={setShowFilter}
    />
  );

  return (
    <div className="relative h-full w-full bg-slate-50 overflow-hidden">
      {!isMobile ? (
        <Table
          title="Job Vacancy Approval"
          TitleIcon={FaUserCheck}
          data={filteredData}
          columns={columns}
          isHidden={true}
          rowKey="vacancy_id"
          loading={loading}
          onRefresh={fetchVacancies}
          onRowDoubleClick={(row) => openDetailModal(row.vacancy_id)}
          showForm={showFilter}
          onToggleFilter={() => setShowFilter((prev) => !prev)}
          serverPagination={false}
          formComponent={filterPanel}
        />
      ) : (
        /* ── MOBILE: header + search + filter + card list ─────────────── */
        <div className="h-full flex flex-col">
          <div className="flex-none bg-white border-b border-slate-200 px-3 py-2 flex items-center gap-2">
            <FaUserCheck className="text-blue-600 shrink-0" size={16} />
            <h1 className="text-sm font-bold text-slate-800 truncate flex-1">Job Vacancy Approval</h1>
            <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-100">
              {mobileList.length}
            </span>
            <button
              type="button"
              onClick={fetchVacancies}
              title="Refresh"
              className="h-8 w-8 flex items-center justify-center rounded-md border border-rose-200 bg-rose-50 text-rose-600 cursor-pointer"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
            <button
              type="button"
              onClick={() => setShowFilter((p) => !p)}
              title="Filters"
              className={`h-8 w-8 flex items-center justify-center rounded-md border cursor-pointer ${showFilter
                ? "bg-amber-100 border-amber-400 text-amber-700"
                : "bg-amber-50 border-amber-300 text-amber-600"
                }`}
            >
              <Filter size={14} />
            </button>
          </div>

          <div className="flex-none bg-white border-b border-slate-200 px-3 py-2">
            <div className="relative flex items-center">
              <Search size={13} className="absolute left-2.5 text-slate-400 pointer-events-none" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search vacancy, role, department…"
                className="h-9 w-full pl-8 pr-8 text-xs bg-slate-50 border border-slate-200 rounded-md outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
              {search && (
                <X
                  size={13}
                  className="absolute right-2.5 text-slate-400 cursor-pointer"
                  onClick={() => setSearch("")}
                />
              )}
            </div>
          </div>

          {showFilter && (
            <div className="flex-none max-h-[55%] overflow-y-auto bg-white border-b border-slate-200">
              {filterPanel}
            </div>
          )}

          <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2.5">
            {loading && mobileList.length === 0 ? (
              <div className="flex justify-center py-10">
                <div className="w-7 h-7 border-[3px] border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : mobileList.length === 0 ? (
              <div className="text-center text-xs text-slate-400 py-10">No vacancies found</div>
            ) : (
              mobileList.map((row) => {
                const st = (row.vacancy_status || "Draft").trim();
                const isApproved = st === "Approved" || st === "Open";
                const p = row.priority || "Normal";
                const min = row.min_ctc ? Number(row.min_ctc).toLocaleString("en-IN") : "0";
                const max = row.max_ctc ? Number(row.max_ctc).toLocaleString("en-IN") : "0";
                return (
                  <div
                    key={row.vacancy_id}
                    className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => openDetailModal(row.vacancy_id)}
                        className="text-[13px] font-bold text-blue-600 hover:underline cursor-pointer text-left"
                      >
                        {row.vacancy_no}
                      </button>
                      <Pill className={STATUS_BADGES[st] || STATUS_BADGES.Draft}>{st}</Pill>
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {row.designation_name || row.job_role || "—"}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {row.department_name || "—"}
                        {row.vacancy_date &&
                          ` • ${new Date(row.vacancy_date).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}`}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                      <div>
                        <span className="text-slate-400">Positions: </span>
                        <span className="font-semibold text-blue-600">{row.number_of_positions || 1}</span>
                        <span className="text-slate-400"> / </span>
                        <span className="font-semibold text-emerald-600">{row.filled_positions || 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-slate-400">Priority: </span>
                        <Pill className={PRIORITY_BADGES[p] || PRIORITY_BADGES.Normal}>{p}</Pill>
                      </div>
                      <div className="col-span-2 truncate">
                        <span className="text-slate-400">CTC: </span>
                        <span className="text-slate-700">
                          {min === "0" && max === "0" ? "—" : `₹${min} - ${max}`}
                        </span>
                      </div>
                      <div className="col-span-2 truncate">
                        <span className="text-slate-400">Requested by: </span>
                        <span className="text-slate-700">{row.requested_by_name || "—"}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                      {!isApproved ? (
                        <button
                          type="button"
                          onClick={() => handleOpenAction("Approved", row)}
                          className="flex-1 h-8 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <CheckCircle size={13} /> Approve
                        </button>
                      ) : (
                        <span className="flex-1 h-8 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md flex items-center justify-center gap-1">
                          <CheckCheck size={13} /> Approved
                        </span>
                      )}
                      {st !== "Rejected" && (
                        <button
                          type="button"
                          onClick={() => handleOpenAction("Rejected", row)}
                          className="flex-1 h-8 text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-md flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <XCircle size={13} /> Reject
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => openDetailModal(row.vacancy_id)}
                        title="View details"
                        className="h-8 w-8 shrink-0 flex items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:text-blue-600 cursor-pointer"
                      >
                        <Eye size={14} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ── DETAIL PREVIEW MODAL ──────────────────────────────────────────── */}
      {detailModalOpen && (
        <>
          <div
            className="absolute inset-0 z-40 flex items-center justify-center bg-slate-900/40 backdrop-blur-[1px] p-3 sm:p-6"
            onClick={() => setDetailModalOpen(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-2xl max-h-full rounded-xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
            >
              {/* Modal Header */}
              <div className="px-4 sm:px-5 py-3 bg-slate-900 text-white flex items-center justify-between gap-3 flex-none">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 bg-blue-600 rounded-lg shrink-0">
                    <Briefcase size={16} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-sm font-bold text-white tracking-wide">
                        {selectedVacancy?.vacancy_no || "Job Vacancy Details"}
                      </h2>
                      {selectedVacancy?.vacancy_status && (
                        <Pill
                          className={
                            STATUS_BADGES[selectedVacancy.vacancy_status] ||
                            "bg-slate-700 text-white border-slate-600"
                          }
                        >
                          {selectedVacancy.vacancy_status}
                        </Pill>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-300 truncate">
                      {selectedVacancy?.department_name} •{" "}
                      {selectedVacancy?.designation_name || selectedVacancy?.job_role}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setDetailModalOpen(false)}
                  className="p-1.5 shrink-0 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body — scrolls independently; header & footer stay fixed */}
              <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-5 space-y-4 bg-slate-50/50">
                {detailLoading ? (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
                    <div className="w-8 h-8 border-[3px] border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs font-medium">Loading vacancy details...</span>
                  </div>
                ) : selectedVacancy ? (
                  <>
                    {/* Grid 1: Basic & Position Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2">
                        <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Building2 size={13} className="text-blue-600" /> Position Info
                        </span>
                        <div className="text-xs space-y-1">
                          <Field label="Designation">
                            {selectedVacancy.designation_name || selectedVacancy.job_role || "—"}
                          </Field>
                          <Field label="Department">{selectedVacancy.department_name || "—"}</Field>
                          <Field label="Location">{selectedVacancy.location_name || "—"}</Field>
                          <Field label="Work Mode">{selectedVacancy.work_mode || "—"}</Field>
                          <Field label="Employment Type">{selectedVacancy.employment_type || "—"}</Field>
                        </div>
                      </div>

                      <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2">
                        <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Users size={13} className="text-emerald-600" /> Requirements & Counts
                        </span>
                        <div className="text-xs space-y-1">
                          <Field label="Type">{selectedVacancy.vacancy_type || "New Position"}</Field>
                          <Field label="Positions Required">
                            <span className="font-bold text-blue-700">
                              {selectedVacancy.number_of_positions || 1}
                            </span>
                          </Field>
                          <Field label="Priority">
                            <Pill
                              className={
                                PRIORITY_BADGES[selectedVacancy.priority] || PRIORITY_BADGES.Normal
                              }
                            >
                              {selectedVacancy.priority || "Normal"}
                            </Pill>
                          </Field>
                          <Field label="Experience Range">
                            {selectedVacancy.min_experience_years || 0} -{" "}
                            {selectedVacancy.max_experience_years || 0} Yrs
                          </Field>
                          {selectedVacancy.replacement_emp_name && (
                            <Field label="Replacement For">
                              <span className="font-semibold text-rose-700">
                                {selectedVacancy.replacement_emp_name}
                              </span>
                            </Field>
                          )}
                        </div>
                      </div>

                      <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2 sm:col-span-2 lg:col-span-1">
                        <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <DollarSign size={13} className="text-amber-600" /> Compensation & Dates
                        </span>
                        <div className="text-xs space-y-1">
                          <Field label="CTC Range">
                            <span className="font-bold">
                              ₹{Number(selectedVacancy.min_ctc || 0).toLocaleString("en-IN")} - ₹
                              {Number(selectedVacancy.max_ctc || 0).toLocaleString("en-IN")}
                            </span>
                          </Field>
                          {selectedVacancy.expected_gross && (
                            <Field label="Expected Gross">
                              ₹{Number(selectedVacancy.expected_gross).toLocaleString("en-IN")}
                            </Field>
                          )}
                          <Field label="Notice Period">
                            {selectedVacancy.notice_period_days || 30} Days
                          </Field>
                          <Field label="Probation">
                            {selectedVacancy.probation_period_months || 6} Months
                          </Field>
                          <Field label="Target Joining">
                            {selectedVacancy.target_joining_date
                              ? new Date(selectedVacancy.target_joining_date).toLocaleDateString("en-GB")
                              : "—"}
                          </Field>
                        </div>
                      </div>
                    </div>

                    {/* Justification */}
                    {selectedVacancy.justification && (
                      <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5">
                        <h4 className="text-[11px] font-bold text-amber-900 uppercase tracking-wider mb-1 flex items-center gap-1">
                          <AlertCircle size={13} className="text-amber-700" /> Business Justification
                        </h4>
                        <p className="text-xs text-amber-900 leading-relaxed break-words">
                          {selectedVacancy.justification}
                        </p>
                      </div>
                    )}

                    {/* Job Summary & Responsibilities */}
                    {(selectedVacancy.job_summary || selectedVacancy.job_responsibilities) && (
                      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                        {selectedVacancy.job_summary && (
                          <div>
                            <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                              Job Summary
                            </h4>
                            <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line break-words">
                              {selectedVacancy.job_summary}
                            </p>
                          </div>
                        )}
                        {selectedVacancy.job_responsibilities && (
                          <div>
                            <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                              Key Responsibilities
                            </h4>
                            <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line break-words">
                              {selectedVacancy.job_responsibilities}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Skills & Qualifications */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <Layers size={13} className="text-indigo-600" /> Required Skills
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedVacancy.skills?.length > 0 ? (
                            selectedVacancy.skills.map((s, idx) => (
                              <span
                                key={idx}
                                className={`px-2 py-0.5 rounded text-[11px] font-medium border break-words ${s.is_mandatory
                                  ? "bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold"
                                  : "bg-slate-50 text-slate-600 border-slate-200"
                                  }`}
                              >
                                {s.skill_name || s.skill_code || "Skill"} {s.is_mandatory && "★"}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400">No specific skills listed</span>
                          )}
                        </div>
                      </div>

                      <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <ShieldCheck size={13} className="text-teal-600" /> Qualifications
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedVacancy.qualifications?.length > 0 ? (
                            selectedVacancy.qualifications.map((q, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded text-[11px] font-medium bg-teal-50 text-teal-700 border border-teal-200"
                              >
                                {q.qualification_name || "Qualification"}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400">Any graduate</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status History Timeline */}
                    {selectedVacancy.status_history?.length > 0 && (
                      <div className="bg-white border border-slate-200 rounded-xl p-4">
                        <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                          <History size={13} className="text-slate-600" /> Workflow & Approval History
                        </h4>
                        <div className="space-y-2.5 border-l-2 border-slate-200 ml-2 pl-4">
                          {selectedVacancy.status_history.map((hist, i) => (
                            <div key={i} className="relative text-xs">
                              <div className="absolute -left-[23px] top-1 w-2.5 h-2.5 rounded-full bg-blue-600 border-2 border-white ring-1 ring-blue-300"></div>
                              <div className="flex items-center flex-wrap gap-x-2">
                                <span className="font-bold text-slate-800">
                                  {hist.from_status ? `${hist.from_status} → ` : ""}
                                  {hist.to_status}
                                </span>
                                <span className="text-[10px] text-slate-400 whitespace-nowrap">
                                  {hist.changed_at
                                    ? new Date(hist.changed_at).toLocaleString("en-GB")
                                    : ""}
                                </span>
                              </div>
                              {hist.remarks && (
                                <p className="text-[11px] text-slate-600 mt-0.5 italic bg-slate-50 p-1.5 rounded border border-slate-100 break-words">
                                  “{hist.remarks}”
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : null}
              </div>

              {/* Modal Footer Actions — stacks on small screens */}
              <div className="px-4 sm:px-5 py-3 bg-white border-t border-slate-200 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2 flex-none">
                <span className="text-xs text-slate-500 truncate">
                  Requested by:{" "}
                  <strong className="text-slate-700">
                    {selectedVacancy?.requested_by_name || "—"}
                  </strong>
                </span>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <button
                    onClick={() => handleOpenAction("On Hold", selectedVacancy)}
                    className="flex-1 sm:flex-none px-3 py-1.5 text-xs font-semibold bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg transition-colors cursor-pointer"
                  >
                    Put On Hold
                  </button>
                  <button
                    onClick={() => handleOpenAction("Rejected", selectedVacancy)}
                    className="flex-1 sm:flex-none px-3 py-1.5 text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <XCircle size={13} /> Reject
                  </button>
                  <button
                    onClick={() => handleOpenAction("Approved", selectedVacancy)}
                    className="flex-1 sm:flex-none px-4 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <CheckCircle size={13} /> Approve Vacancy
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── APPROVAL / REJECTION REMARKS DIALOG ───────────────────────────── */}
      {/* z-[80] so it always sits ABOVE the detail modal (it was hidden behind it before) */}
      {actionModal.isOpen && (
        <>
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-[2px] p-3 sm:p-6"
            onClick={closeActionModal}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md max-h-full flex flex-col overflow-hidden animate-in fade-in zoom-in duration-150"
            >
              <div
                className={`px-4 py-3 border-b flex items-center justify-between gap-2 flex-none ${actionModal.type === "Approved"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                  : actionModal.type === "Rejected"
                    ? "bg-rose-50 border-rose-200 text-rose-900"
                    : "bg-purple-50 border-purple-200 text-purple-900"
                  }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {actionModal.type === "Approved" ? (
                    <CheckCircle className="text-emerald-600 shrink-0" size={18} />
                  ) : actionModal.type === "Rejected" ? (
                    <XCircle className="text-rose-600 shrink-0" size={18} />
                  ) : (
                    <Clock className="text-purple-600 shrink-0" size={18} />
                  )}
                  <h3 className="font-bold text-sm truncate">
                    {actionModal.type} Vacancy - {actionModal.vacancyNo}
                  </h3>
                </div>
                <button
                  onClick={closeActionModal}
                  disabled={actionLoading}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-md shrink-0"
                  aria-label="Close"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-4 space-y-3 overflow-y-auto min-h-0">
                <p className="text-xs text-slate-600">
                  Are you sure you want to change the status to{" "}
                  <span className="font-bold text-slate-800">{actionModal.type}</span>?
                  {actionModal.type === "Rejected" && (
                    <span className="text-rose-600 block mt-1 font-medium">
                      * Please specify the reason for rejection below.
                    </span>
                  )}
                </p>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Remarks / Notes {actionModal.type === "Rejected" ? "(Mandatory)" : "(Optional)"}
                  </label>
                  <textarea
                    rows={3}
                    value={actionModal.remarks}
                    onChange={(e) =>
                      setActionModal((prev) => ({ ...prev, remarks: e.target.value }))
                    }
                    placeholder={
                      actionModal.type === "Approved"
                        ? "e.g., Approved for immediate hiring"
                        : actionModal.type === "Rejected"
                          ? "e.g., Budget not approved / Position on hold"
                          : "Enter remarks..."
                    }
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                  />
                </div>
              </div>

              <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2 flex-none">
                <button
                  onClick={closeActionModal}
                  disabled={actionLoading}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmAction}
                  disabled={actionLoading}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all text-white flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                    actionModal.type === "Approved"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : actionModal.type === "Rejected"
                        ? "bg-rose-600 hover:bg-rose-700"
                        : "bg-purple-600 hover:bg-purple-700"
                  }`}
                >
                  {actionLoading ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : actionModal.type === "Approved" ? (
                    <CheckCircle size={13} />
                  ) : actionModal.type === "Rejected" ? (
                    <XCircle size={13} />
                  ) : (
                    <Clock size={13} />
                  )}
                  <span>
                    {actionLoading
                      ? "Updating..."
                      : actionModal.type === "Approved"
                        ? "Confirm Approve"
                        : actionModal.type === "Rejected"
                          ? "Confirm Reject"
                          : "Confirm On Hold"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default JobVacancyApproval;