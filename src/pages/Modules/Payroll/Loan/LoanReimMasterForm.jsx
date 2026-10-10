import React, { useState, useCallback, useEffect, useRef } from "react";
import Swal from "sweetalert2";
import {
  Calendar,
  DollarSign,
  Clock,
  ShieldCheck,
  Send,
  Check,
  XCircle,
  RotateCcw,
  Zap,
  List,
  CreditCard,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import ERPHeader from "../../../../components/Reusable/form/HeaderForm";
import ERPFooter from "../../../../components/Reusable/form/FooterForm";
import ERPAutocomplete from "../../../../components/Reusable/input/ERPAutocomplete";
import ERPDateInput from "../../../../components/Reusable/input/Date";
import {
  getActledList,
  getEmployeeLoanEligibility,
  previewLoanSchedule,
  submitLoanForApproval,
  approveLoanRequest,
  rejectLoanRequest,
  returnLoanRequest,
  disburseLoanRequest,
} from "../../../../utils/api";
import { showToast, alertError } from "../../../../components/Reusable/alert";
import {
  focusFirstInput,
  handleERPEnterNavigation,
  focusFirstError,
  handleERPBackspaceNavigation,
} from "../../../../utils/erpShortcuts";

import LoanScheduleModal from "./components/LoanScheduleModal";
import LoanLedgerModal from "./components/LoanLedgerModal";
import LoanPrepayModal from "./components/LoanPrepayModal";

const masterTypes = ["Loan", "Advance", "Reimbursement", "Coupon"];
const requiredFields = ["employee_id", "master_type", "request_name", "amount"];
const FONT = "'Inter', 'Tahoma', system-ui, sans-serif";

const fieldIndexMap = {
  employee_id: 0,
  master_type: 1,
  request_name: 2,
  amount: 3,
};

const STATUS_BADGE = {
  Approved: "bg-emerald-100 text-emerald-800 border-emerald-300",
  Disbursed: "bg-purple-100 text-purple-800 border-purple-300",
  Closed: "bg-blue-100 text-blue-800 border-blue-300",
  Pending: "bg-amber-100 text-amber-800 border-amber-300",
  Rejected: "bg-red-100 text-red-800 border-red-300",
  Returned: "bg-orange-100 text-orange-800 border-orange-300",
  Draft: "bg-slate-100 text-slate-700 border-slate-300",
};

// Helper: get next month in YYYY-MM
const getNextMonthStr = () => {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

// <input type="month"> only accepts YYYY-MM. DB values like "2026-11-01..." show blank otherwise.
const toMonthValue = (v) => (v ? String(v).slice(0, 7) : "");

const wfBtn =
  "inline-flex h-7 items-center gap-1 rounded px-2.5 text-xs font-medium whitespace-nowrap transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed";

/* ---------- Field: stacked label + control, same layout everywhere ---------- */
const Field = ({ label, required, error, className = "", children }) => (
  <div className={`flex min-w-0 flex-col gap-1 ${className}`}>
    <label className="text-[13px] font-semibold leading-4 text-slate-700 whitespace-nowrap">
      {label}
      {required && <span className="ml-0.5 text-red-500">*</span>}
    </label>
    {children}
    {error && <span className="text-[11px] font-medium leading-3 text-red-500">{error}</span>}
  </div>
);

const LoanReimMasterForm = ({
  mode = "view",
  onSave,
  onCancel,
  onDelete,
  onEditCancel,
  saving,
  onModify,
  onNewEntry,
  currentRecord,
  totalRecords,
  setFormData,
  rights,
  activeTab = "entry",
  onTabChange,
  initialData = {},
  onPrevRecord,
  onNextRecord,
  onReload,
}) => {
  const [localData, setLocalData] = useState({
    interest_type: "Reducing",
    interest_rate: 10,
    tenure_months: 12,
    recovery_start: getNextMonthStr(),
    monthly_emi: 0,
    total_interest: 0,
    total_payable: 0,
    status: "Draft",
    ...initialData,
  });

  const [errors, setErrors] = useState({});
  const formRef = useRef(null);
  const saveBtnRef = useRef(null);
  const [employees, setEmployees] = useState([]);
  const [employeeNames, setEmployeeNames] = useState([]);

  // Eligibility & Live schedule calculation
  const [eligibility, setEligibility] = useState(null);
  const [loadingEligibility, setLoadingEligibility] = useState(false);
  const [previewScheduleList, setPreviewScheduleList] = useState([]);
  const [showSchedulePreview, setShowSchedulePreview] = useState(false);
  const [calcSummary, setCalcSummary] = useState(null);

  // Modals
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isLedgerOpen, setIsLedgerOpen] = useState(false);
  const [isPrepayOpen, setIsPrepayOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const isViewMode = mode === "view";
  const isEditMode = mode === "edit";
  const isAddMode = mode === "add";

  // Auto focus first field
  useEffect(() => {
    if (isAddMode || isEditMode) {
      focusFirstInput(formRef);
    }
  }, [isAddMode, isEditMode]);

  // Fetch Employees
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const data = await getActledList();
        setEmployees(data || []);
        setEmployeeNames((data || []).map((emp) => emp.Led_name.trim()));
      } catch (err) {
        console.error("fetchEmployees error:", err);
      }
    };
    fetchEmployees();
  }, []);

  // Fetch Eligibility when employee_id changes
  useEffect(() => {
    const fetchEligibility = async () => {
      if (!localData.employee_id) {
        setEligibility(null);
        return;
      }
      try {
        setLoadingEligibility(true);
        const res = await getEmployeeLoanEligibility(localData.employee_id);
        if (res?.success) {
          setEligibility(res.data);
        } else {
          setEligibility(null);
        }
      } catch (err) {
        console.error("fetchEligibility error:", err);
      } finally {
        setLoadingEligibility(false);
      }
    };

    fetchEligibility();
  }, [localData.employee_id]);

  // Initial data synchronization
  useEffect(() => {
    if (!initialData || Object.keys(initialData).length === 0) return;

    const employee =
      initialData.employee_name ||
      employees.find((emp) => Number(emp.Actled_id) === Number(initialData.employee_id))?.Led_name ||
      "";

    const formattedData = {
      interest_type: "Reducing",
      interest_rate: 10,
      tenure_months: 12,
      ...initialData,
      // normalise so <input type="month"> can display it
      recovery_start: toMonthValue(initialData.recovery_start) || getNextMonthStr(),
      employee_name: employee,
      effective_from: initialData.effective_from ? initialData.effective_from.split("T")[0] : "",
      effective_to: initialData.effective_to ? initialData.effective_to.split("T")[0] : "",
    };

    if (JSON.stringify(localData) !== JSON.stringify(formattedData)) {
      setLocalData(formattedData);
      setFormData(formattedData);
    }
  }, [initialData, employees]);

  // Live schedule calculation for Loan/Advance
  useEffect(() => {
    const calcSchedule = async () => {
      const amt = parseFloat(localData.amount);
      if (!amt || isNaN(amt) || amt <= 0) {
        setCalcSummary(null);
        setPreviewScheduleList([]);
        return;
      }

      if (localData.master_type === "Advance") {
        const summary = {
          principal: amt,
          total_interest: 0,
          total_payable: amt,
          emi: amt,
          tenure_months: 1,
        };
        setCalcSummary(summary);
        setLocalData((prev) => ({
          ...prev,
          monthly_emi: amt,
          total_interest: 0,
          total_payable: amt,
          tenure_months: 1,
          interest_rate: 0,
          interest_type: "None",
        }));
      } else if (localData.master_type === "Loan") {
        try {
          const res = await previewLoanSchedule({
            amount: amt,
            principal: amt,
            interest_rate: parseFloat(localData.interest_rate) || 0,
            annualRate: parseFloat(localData.interest_rate) || 0,
            tenure_months: parseInt(localData.tenure_months, 10) || 12,
            tenureMonths: parseInt(localData.tenure_months, 10) || 12,
            interest_type: localData.interest_type || "Reducing",
            interestType: localData.interest_type || "Reducing",
            recovery_start: toMonthValue(localData.recovery_start) || getNextMonthStr(),
            recoveryStart: toMonthValue(localData.recovery_start) || getNextMonthStr(),
          });

          if (res?.success) {
            const dataObj = res.data || {};
            const emi =
              res.summary?.emi ??
              dataObj.monthlyEmi ??
              dataObj.emi ??
              amt;
            const totalInterest =
              res.summary?.total_interest ??
              dataObj.totalInterest ??
              dataObj.total_interest ??
              0;
            const totalPayable =
              res.summary?.total_payable ??
              dataObj.totalPayable ??
              dataObj.total_payable ??
              (amt + totalInterest);
            const schedule = res.schedule || dataObj.schedule || [];

            setCalcSummary({
              principal: amt,
              emi,
              total_interest: totalInterest,
              total_payable: totalPayable,
              tenure_months: parseInt(localData.tenure_months, 10) || 12,
            });
            setPreviewScheduleList(schedule);
            setLocalData((prev) => ({
              ...prev,
              monthly_emi: emi,
              total_interest: totalInterest,
              total_payable: totalPayable,
            }));
          }
        } catch (err) {
          console.error("Preview schedule calc error:", err);
        }
      }
    };

    const timer = setTimeout(calcSchedule, 250);
    return () => clearTimeout(timer);
  }, [
    localData.amount,
    localData.interest_type,
    localData.interest_rate,
    localData.tenure_months,
    localData.recovery_start,
    localData.master_type,
  ]);

  // Handle change
  const handleChange = (field, value) => {
    let updatedData = { ...localData };

    if (field === "employee_name") {
      const selectedEmp = employees.find((emp) => emp.Led_name?.trim() === value?.trim());
      updatedData.employee_name = value;
      updatedData.employee_id = selectedEmp ? Number(selectedEmp.Actled_id) : "";
    } else if (field === "master_type") {
      updatedData.master_type = value;
      if (value === "Advance") {
        updatedData.interest_type = "None";
        updatedData.interest_rate = 0;
        updatedData.tenure_months = 1;
        if (!updatedData.recovery_start) updatedData.recovery_start = getNextMonthStr();
      } else if (value === "Loan") {
        if (!updatedData.interest_type || updatedData.interest_type === "None") {
          updatedData.interest_type = "Reducing";
        }
        if (!updatedData.interest_rate) updatedData.interest_rate = 10;
        if (!updatedData.tenure_months) updatedData.tenure_months = 12;
        if (!updatedData.recovery_start) updatedData.recovery_start = getNextMonthStr();
      }
    } else {
      updatedData[field] = value;
    }

    setLocalData(updatedData);
    setFormData(updatedData);

    setErrors((prev) => {
      const newErrors = { ...prev };
      if (field === "employee_name") delete newErrors.employee_id;
      else delete newErrors[field];
      return newErrors;
    });
  };

  // One input style for every control: same height, same radius, same states
  const getInputClass = (isDisabled, fieldName, height = "h-9") =>
    `w-full ${height} px-2.5 text-[14px] border rounded-md outline-none transition-colors ${errors[fieldName] ? "border-red-500" : "border-gray-300"
    } ${isDisabled
      ? "bg-[#eef1f6] text-gray-500 cursor-not-allowed"
      : "bg-white text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
    }`;

  // Validate + Save
  const handleValidateAndSave = useCallback(() => {
    if (isViewMode) return;
    const newErrors = {};

    requiredFields.forEach((field) => {
      if (!localData[field] || localData[field].toString().trim() === "") {
        newErrors[field] = "Required";
      }
    });

    if (localData.master_type === "Loan") {
      if (!localData.tenure_months || Number(localData.tenure_months) < 1) {
        newErrors.tenure_months = "Min 1 month";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      focusFirstError(formRef, newErrors, requiredFields, fieldIndexMap);
      return;
    }

    // Advance 50% cap soft warning / confirm
    if (
      localData.master_type === "Advance" &&
      eligibility?.max_advance_allowed > 0 &&
      parseFloat(localData.amount) > eligibility.max_advance_allowed
    ) {
      Swal.fire({
        title: "50% Net Salary Cap Exceeded",
        text: `Requested ₹${Number(localData.amount).toLocaleString()} exceeds the maximum allowed advance of ₹${eligibility.max_advance_allowed.toLocaleString()} (50% of monthly net salary ₹${eligibility.net_salary.toLocaleString()}). Do you still wish to submit?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#f59e0b",
        confirmButtonText: "Yes, Proceed",
      }).then((result) => {
        if (result.isConfirmed) {
          if (onSave) onSave(localData);
        }
      });
      return;
    }

    if (onSave) onSave(localData);
  }, [localData, onSave, isViewMode, eligibility]);

  // Key navigation
  const handleKeyDown = useCallback(
    (e) => {
      handleERPEnterNavigation(e, formRef, isViewMode, saveBtnRef);
      handleERPBackspaceNavigation(e, formRef, isViewMode);
    },
    [isViewMode]
  );

  // Workflow actions
  const handleWorkflowAction = async (actionType) => {
    if (!localData.id) return;
    try {
      setActionLoading(true);
      let res;
      if (actionType === "submit") {
        res = await submitLoanForApproval(localData.id);
      } else if (actionType === "approve") {
        res = await approveLoanRequest(localData.id);
      } else if (actionType === "disburse") {
        res = await disburseLoanRequest(localData.id);
      } else if (actionType === "reject") {
        const { value: reason } = await Swal.fire({
          title: "Reject Request",
          input: "textarea",
          inputLabel: "Reason for rejection",
          inputPlaceholder: "Enter rejection reason...",
          showCancelButton: true,
          confirmButtonColor: "#ef4444",
          confirmButtonText: "Reject",
          inputValidator: (val) => !val && "Rejection reason is required",
        });
        if (!reason) {
          setActionLoading(false);
          return;
        }
        res = await rejectLoanRequest(localData.id, reason);
      } else if (actionType === "return") {
        const { value: remarks } = await Swal.fire({
          title: "Return for Clarification",
          input: "textarea",
          inputLabel: "Remarks / Required changes",
          inputPlaceholder: "Enter remarks...",
          showCancelButton: true,
          confirmButtonColor: "#f59e0b",
          confirmButtonText: "Return",
          inputValidator: (val) => !val && "Remarks are required",
        });
        if (!remarks) {
          setActionLoading(false);
          return;
        }
        res = await returnLoanRequest(localData.id, remarks);
      }

      if (res?.success) {
        showToast({ icon: "success", title: res.message || "Action completed successfully" });
        if (onReload) await onReload();
      } else {
        alertError("Action Failed", res?.message || "Failed to execute workflow action");
      }
    } catch (err) {
      alertError("Error", err?.message || "An unexpected error occurred");
    } finally {
      setActionLoading(false);
    }
  };

  const currentStatus = localData.status || "Draft";
  const isLoanOrAdvance = localData.master_type === "Loan" || localData.master_type === "Advance";
  const exceedsCap =
    localData.master_type === "Advance" &&
    eligibility?.max_advance_allowed > 0 &&
    parseFloat(localData.amount) > eligibility.max_advance_allowed;

  return (
    <div
      className="w-full h-[calc(100vh-100px)] bg-[#eef1f6] flex flex-col overflow-hidden font-sans"
      style={{ fontFamily: FONT }}
    >
      <ERPHeader
        title="Loan / Advance / Reimbursement Master"
        isAddMode={isAddMode}
        isEditMode={isEditMode}
        isViewMode={isViewMode}
        activeTab={activeTab}
        onTabChange={onTabChange}
        rightContent={`${currentRecord || 1} / ${totalRecords || 1}`}
        currentIndex={currentRecord}
        totalRecords={totalRecords}
        onPrevRecord={onPrevRecord}
        onNextRecord={onNextRecord}
      />

      <div className="flex-1 p-3 sm:p-4 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-[900px] flex-col gap-3">
          {/* Workflow ribbon (saved records only) */}
          {localData.id && (
            <div className="flex min-h-[48px] flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-2 shadow-2xs">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex h-6 items-center rounded border border-slate-300 bg-slate-100 px-2 font-mono text-xs font-bold text-slate-800">
                  {localData.req_no || "REQ-DRAFT"}
                </span>

                <span
                  className={`inline-flex h-6 items-center rounded-full border px-3 text-[11px] font-bold uppercase tracking-wider ${STATUS_BADGE[currentStatus] || STATUS_BADGE.Draft
                    }`}
                >
                  {currentStatus}
                </span>

                {currentStatus === "Disbursed" && (
                  <span className="text-xs font-medium text-slate-600">
                    Bal:{" "}
                    <strong className="text-slate-800 tabular-nums">
                      ₹{Number(localData.balance_amount || 0).toLocaleString()}
                    </strong>{" "}
                    / ₹{Number(localData.total_payable || localData.amount || 0).toLocaleString()}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {currentStatus === "Draft" && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleWorkflowAction("submit")}
                    className={`${wfBtn} bg-blue-600 text-white hover:bg-blue-700`}
                  >
                    <Send size={12} /> Submit for Approval
                  </button>
                )}

                {currentStatus === "Pending" && (
                  <>
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleWorkflowAction("approve")}
                      className={`${wfBtn} bg-emerald-600 text-white hover:bg-emerald-700`}
                    >
                      <Check size={12} /> Approve
                    </button>
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleWorkflowAction("return")}
                      className={`${wfBtn} bg-amber-500 text-white hover:bg-amber-600`}
                    >
                      <RotateCcw size={12} /> Return
                    </button>
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleWorkflowAction("reject")}
                      className={`${wfBtn} bg-red-600 text-white hover:bg-red-700`}
                    >
                      <XCircle size={12} /> Reject
                    </button>
                  </>
                )}

                {currentStatus === "Approved" && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleWorkflowAction("disburse")}
                    className={`${wfBtn} bg-purple-600 font-bold text-white shadow-xs hover:bg-purple-700`}
                  >
                    <Zap size={12} /> Disburse (Activate Recovery)
                  </button>
                )}

                {(currentStatus === "Disbursed" || currentStatus === "Closed") && (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsScheduleOpen(true)}
                      className={`${wfBtn} border border-slate-300 bg-slate-100 font-semibold text-slate-700 hover:bg-slate-200`}
                    >
                      <Calendar size={12} /> Schedule
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsLedgerOpen(true)}
                      className={`${wfBtn} border border-slate-300 bg-slate-100 font-semibold text-slate-700 hover:bg-slate-200`}
                    >
                      <List size={12} /> Ledger
                    </button>
                    {currentStatus === "Disbursed" && (
                      <button
                        type="button"
                        onClick={() => setIsPrepayOpen(true)}
                        className={`${wfBtn} bg-emerald-600 font-semibold text-white hover:bg-emerald-700`}
                      >
                        <CreditCard size={12} /> Prepay
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Main card */}
          <div
            ref={formRef}
            className="relative w-full rounded-lg border border-slate-200 bg-white shadow-sm overflow-visible"
          >
            <div className="grid grid-cols-1 items-start gap-x-6 gap-y-4 p-5 md:grid-cols-2">
              {/* Row 1 */}
              <Field label="Employee" required error={errors.employee_id}>
                <ERPAutocomplete
                  options={employeeNames}
                  value={localData.employee_name || ""}
                  onChange={(val) => handleChange("employee_name", val)}
                  className={getInputClass(isViewMode, "employee_id")}
                  disabled={isViewMode}
                  onKeyDown={handleKeyDown}
                />
              </Field>

              <Field label="Master Type" required error={errors.master_type}>
                <ERPAutocomplete
                  options={masterTypes}
                  value={localData.master_type || ""}
                  onChange={(val) => handleChange("master_type", val)}
                  className={getInputClass(isViewMode, "master_type")}
                  disabled={isViewMode}
                  onKeyDown={handleKeyDown}
                />
              </Field>

              {/* Eligibility strip */}
              {isLoanOrAdvance && localData.employee_id && (
                <div className="flex flex-col justify-between gap-2 rounded-md border border-blue-200 bg-blue-50/70 px-3.5 py-2.5 text-xs sm:flex-row sm:items-center md:col-span-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={18} className="shrink-0 text-blue-600" />
                    <div>
                      <span className="font-bold text-blue-900">
                        {loadingEligibility ? "Checking payroll eligibility..." : "Payroll Profile:"}
                      </span>{" "}
                      {eligibility ? (
                        <span className="text-blue-800">
                          Monthly Net:{" "}
                          <strong className="tabular-nums">
                            ₹{Number(eligibility.net_salary || 0).toLocaleString()}
                          </strong>{" "}
                          · Advance Cap (50%):{" "}
                          <strong className="tabular-nums text-emerald-700">
                            ₹{Number(eligibility.max_advance_allowed || 0).toLocaleString()}
                          </strong>
                        </span>
                      ) : (
                        <span className="italic text-slate-500">
                          No active salary structure found for this employee
                        </span>
                      )}
                    </div>
                  </div>

                  {eligibility && (
                    <div className="text-[11px] text-blue-700">
                      Existing Active: Adv: <strong>{eligibility.active_advances_count || 0}</strong> (₹
                      {Number(eligibility.active_advances_balance || 0).toLocaleString()}) | Loans:{" "}
                      <strong>{eligibility.active_loans_count || 0}</strong> (₹
                      {Number(eligibility.active_loans_balance || 0).toLocaleString()})
                    </div>
                  )}
                </div>
              )}

              {/* Row 2 */}
              <Field label="Request Name" required error={errors.request_name}>
                <input
                  type="text"
                  name="request_name"
                  value={localData.request_name || ""}
                  disabled={isViewMode}
                  onChange={(e) => handleChange("request_name", e.target.value)}
                  onKeyDown={handleKeyDown}
                  className={getInputClass(isViewMode, "request_name")}
                  placeholder={
                    localData.master_type === "Advance"
                      ? "e.g. Festival Advance / Emergency"
                      : localData.master_type === "Loan"
                        ? "e.g. Personal Company Loan"
                        : "e.g. Travel Reimbursement"
                  }
                />
              </Field>

              <Field label="Principal / Amount" required error={errors.amount}>
                <input
                  type="number"
                  step="0.01"
                  name="amount"
                  value={localData.amount || ""}
                  disabled={isViewMode}
                  onChange={(e) => handleChange("amount", e.target.value)}
                  onKeyDown={handleKeyDown}
                  className={`${getInputClass(isViewMode, "amount")} text-right tabular-nums`}
                  placeholder="0.00"
                />
                {exceedsCap && (
                  <span className="text-[11px] font-semibold leading-3 text-amber-600">
                    ⚠️ Exceeds 50% net salary cap (₹{eligibility.max_advance_allowed.toLocaleString()})
                  </span>
                )}
              </Field>

              {/* ===== LOAN TERMS ===== */}
              {localData.master_type === "Loan" && (
                <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 md:col-span-2">
                  <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-800">
                    <DollarSign size={14} className="text-blue-600" /> Loan Financing & Recovery Terms
                  </h3>

                  <div className="grid grid-cols-1 items-start gap-x-4 gap-y-3 md:grid-cols-3">
                    <Field label="Interest Calculation">
                      <select
                        value={localData.interest_type || "Reducing"}
                        disabled={isViewMode}
                        onChange={(e) => handleChange("interest_type", e.target.value)}
                        className={getInputClass(isViewMode, "interest_type")}
                      >
                        <option value="Reducing">Reducing Balance EMI</option>
                        <option value="Flat">Flat Interest Rate</option>
                      </select>
                    </Field>

                    <Field label="Annual Interest Rate (%)">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={localData.interest_rate ?? 10}
                        disabled={isViewMode}
                        onChange={(e) => handleChange("interest_rate", e.target.value)}
                        className={`${getInputClass(isViewMode, "interest_rate")} text-right tabular-nums`}
                      />
                    </Field>

                    <Field label="Tenure (Months: 3 - 36)" error={errors.tenure_months}>
                      <input
                        type="number"
                        min="1"
                        max="60"
                        value={localData.tenure_months || 12}
                        disabled={isViewMode}
                        onChange={(e) => handleChange("tenure_months", e.target.value)}
                        className={`${getInputClass(isViewMode, "tenure_months")} text-right tabular-nums`}
                      />
                    </Field>
                  </div>

                  <div className="grid grid-cols-1 items-end gap-x-4 gap-y-3 md:grid-cols-2">
                    <Field label="Recovery Start Month">
                      <input
                        type="month"
                        value={toMonthValue(localData.recovery_start) || getNextMonthStr()}
                        disabled={isViewMode}
                        onChange={(e) => handleChange("recovery_start", e.target.value)}
                        className={getInputClass(isViewMode, "recovery_start")}
                      />
                    </Field>

                    {calcSummary ? (
                      <div className="grid h-[58px] grid-cols-3 items-center rounded-md border border-slate-200 bg-white text-center">
                        <div>
                          <span className="block text-[10px] font-semibold uppercase text-slate-500">
                            Monthly EMI
                          </span>
                          <strong className="text-sm tabular-nums text-blue-600">
                            ₹{calcSummary.emi?.toLocaleString()}
                          </strong>
                        </div>
                        <div className="border-x border-slate-100">
                          <span className="block text-[10px] font-semibold uppercase text-slate-500">
                            Total Interest
                          </span>
                          <strong className="text-sm tabular-nums text-amber-600">
                            ₹{calcSummary.total_interest?.toLocaleString()}
                          </strong>
                        </div>
                        <div>
                          <span className="block text-[10px] font-semibold uppercase text-slate-500">
                            Total Payable
                          </span>
                          <strong className="text-sm tabular-nums text-slate-800">
                            ₹{calcSummary.total_payable?.toLocaleString()}
                          </strong>
                        </div>
                      </div>
                    ) : (
                      <div className="hidden md:block" />
                    )}
                  </div>

                  {/* Schedule preview accordion */}
                  {previewScheduleList.length > 0 && (
                    <div>
                      <button
                        type="button"
                        onClick={() => setShowSchedulePreview((p) => !p)}
                        className="flex cursor-pointer items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
                      >
                        {showSchedulePreview ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        {showSchedulePreview ? "Hide" : "Preview"} {previewScheduleList.length}-Month Repayment
                        Schedule
                      </button>

                      {showSchedulePreview && (
                        <div className="mt-2 max-h-48 overflow-y-auto rounded border border-slate-200 bg-white">
                          <table className="w-full text-left text-xs">
                            <thead className="sticky top-0 bg-slate-100 text-[11px] text-slate-700">
                              <tr>
                                <th className="p-1.5">#</th>
                                <th className="p-1.5">Month</th>
                                <th className="p-1.5 text-right">Principal</th>
                                <th className="p-1.5 text-right">Interest</th>
                                <th className="p-1.5 text-right font-bold">EMI</th>
                                <th className="p-1.5 text-right">Remaining Bal</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {previewScheduleList.map((row) => (
                                <tr key={row.inst_no} className="hover:bg-slate-50">
                                  <td className="p-1.5">{row.inst_no}</td>
                                  <td className="p-1.5 font-mono">{row.due_month}</td>
                                  <td className="p-1.5 text-right tabular-nums">
                                    ₹{Number(row.principal_amt).toLocaleString()}
                                  </td>
                                  <td className="p-1.5 text-right tabular-nums">
                                    ₹{Number(row.interest_amt).toLocaleString()}
                                  </td>
                                  <td className="p-1.5 text-right font-bold tabular-nums text-blue-600">
                                    ₹{Number(row.emi_amount).toLocaleString()}
                                  </td>
                                  <td className="p-1.5 text-right tabular-nums text-slate-500">
                                    ₹{Number(row.closing_bal || 0).toLocaleString()}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ===== ADVANCE TERMS ===== */}
              {localData.master_type === "Advance" && (
                <div className="flex flex-col gap-3 rounded-lg border border-emerald-200 bg-emerald-50/60 p-4 md:col-span-2">
                  <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-900">
                    <Clock size={14} className="text-emerald-700" /> Salary Advance Terms (Single-Month Recovery)
                  </h3>

                  <div className="grid grid-cols-1 items-end gap-x-4 gap-y-3 md:grid-cols-2">
                    <Field label="Target Payroll Recovery Month">
                      <input
                        type="month"
                        value={toMonthValue(localData.recovery_start) || getNextMonthStr()}
                        disabled={isViewMode}
                        onChange={(e) => handleChange("recovery_start", e.target.value)}
                        className={getInputClass(isViewMode, "recovery_start")}
                      />
                    </Field>

                    <div className="flex h-[58px] items-center justify-between gap-3 rounded-md border border-emerald-200 bg-white px-3">
                      <div className="min-w-0">
                        <span className="block text-[10px] font-semibold uppercase text-slate-500">
                          Interest &amp; Tenure
                        </span>
                        <strong className="block truncate text-xs text-emerald-700">
                          0% Interest · 1 Month Full Recovery
                        </strong>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="block text-[10px] font-semibold uppercase text-slate-500">
                          Deduction in Payroll
                        </span>
                        <strong className="text-base tabular-nums text-slate-800">
                          ₹{Number(localData.amount || 0).toLocaleString()}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ===== REIMBURSEMENT / COUPON DATES ===== */}
              {!isLoanOrAdvance && (
                <>
                  <Field label="Effective From">
                    <ERPDateInput
                      value={localData.effective_from || ""}
                      disabled={isViewMode}
                      onChange={(val) => handleChange("effective_from", val)}
                      className={getInputClass(isViewMode, "effective_from")}
                      onKeyDown={handleKeyDown}
                    />
                  </Field>

                  <Field label="Effective To">
                    <ERPDateInput
                      value={localData.effective_to || ""}
                      disabled={isViewMode}
                      onChange={(val) => handleChange("effective_to", val)}
                      className={getInputClass(isViewMode, "effective_to")}
                      onKeyDown={handleKeyDown}
                    />
                  </Field>
                </>
              )}

              {/* Remarks */}
              <Field label="Remarks" className="md:col-span-2">
                <textarea
                  rows={3}
                  value={localData.remarks || ""}
                  disabled={isViewMode}
                  onChange={(e) => handleChange("remarks", e.target.value)}
                  onKeyDown={handleKeyDown}
                  className={`${getInputClass(isViewMode, "remarks", "h-auto min-h-[72px]")} py-2 resize-y`}
                  placeholder="Enter remarks or loan purpose..."
                />
              </Field>
            </div>
          </div>
        </div>
      </div>

      <ERPFooter
        isAddMode={isAddMode}
        isEditMode={isEditMode}
        saveBtnRef={saveBtnRef}
        isViewMode={isViewMode}
        saving={saving}
        handleSubmit={handleValidateAndSave}
        onModify={onModify}
        onDelete={() => onDelete && onDelete(localData)}
        onCancel={onCancel}
        onEditCancel={onEditCancel}
        onNewEntry={onNewEntry}
        rights={rights}
      />

      {/* Repayment Schedule Modal */}
      <LoanScheduleModal isOpen={isScheduleOpen} onClose={() => setIsScheduleOpen(false)} loan={localData} />

      {/* Transaction & Audit Ledger Modal */}
      <LoanLedgerModal isOpen={isLedgerOpen} onClose={() => setIsLedgerOpen(false)} loan={localData} />

      {/* Early Settlement / Prepayment Modal */}
      <LoanPrepayModal
        isOpen={isPrepayOpen}
        onClose={() => setIsPrepayOpen(false)}
        loan={localData}
        onSuccess={onReload}
      />
    </div>
  );
};

export default LoanReimMasterForm;