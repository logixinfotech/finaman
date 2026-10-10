import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Clock,
  User,
  Calendar,
  Building2,
  CheckCircle2,
  AlertCircle,
  Save,
  ArrowRight,
  Sparkles,
  Loader2,
  Info,
  ChevronDown,
  Check,
} from "lucide-react";
import { formInputClass } from "../../../../../components/Reusable/form/SectionCard";

const STATUS_OPTIONS = [
  { value: "PRESENT", label: "PRESENT" },
  { value: "L1", label: "L1 - Late 1" },
  { value: "L2", label: "L2 - Late 2" },
  { value: "HALF_DAY", label: "HALF DAY" },
  { value: "ABSENT", label: "ABSENT" },
  { value: "WFH", label: "WFH - Home" },
  { value: "WFS", label: "WFS - Site" },
  { value: "WEEK OFF", label: "WEEK OFF" },
  { value: "WEEKOFF OT", label: "WEEKOFF OT" },
  { value: "HOLIDAYS", label: "HOLIDAYS" },
  { value: "HOLIDAY OT", label: "HOLIDAY OT" },
  { value: "UNPAID", label: "UNPAID" },
  { value: "UNL", label: "UNL - Unpaid leave" },
  { value: "EL", label: "EL - Earned Leave" },
  { value: "RH", label: "RH - Restricted Holiday" },
  { value: "CL", label: "CL - Casual Leave" },
  { value: "SL", label: "SL - Sick Leave" },
  { value: "PL", label: "PL - Privilege Leave" },
  { value: "OD", label: "OD - On Duty / Client Visit" },
  { value: "REG", label: "REG - Regularized" },
];

const REASON_OPTIONS = [
  "Forgot to Punch Out",
  "Forgot to Punch In & Out",
  "Biometric Machine Malfunction",
  "Outdoor/Client Duty",
  "Approved Half Day",
  "Shift Timing Adjustment",
  "Work From Home / Remote Duty",
  "Emergency Leave Regularized",
  "Other Reason",
];

const normalizeFormStatus = (st) => {
  if (!st) return "PRESENT";
  const s = st.toString().toUpperCase().trim();
  if (s === "P" || s === "PRESENT") return "PRESENT";
  if (s === "HD" || s === "HALF_DAY" || s === "HALF DAY") return "HALF_DAY";
  if (s === "A" || s === "ABSENT") return "ABSENT";
  if (s === "WO" || s === "WEEK OFF" || s === "WEEKOFF") return "WEEK OFF";
  if (s === "WOT" || s === "WEEKOFF OT") return "WEEKOFF OT";
  if (s === "H" || s === "HOLIDAY" || s === "HOLIDAYS") return "HOLIDAYS";
  if (s === "HOT" || s === "HOLIDAY OT") return "HOLIDAY OT";
  if (s === "FH" || s === "WFH") return "WFH";
  if (s === "D" || s === "WFS") return "WFS";
  return s;
};

function CustomSelect({
  value,
  options,
  onChange,
  placeholder = "Select...",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleMouseDown = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, []);

  const selectedOpt = options.find((o) => (typeof o === "object" ? o.value === value : o === value));
  const displayLabel = selectedOpt
    ? typeof selectedOpt === "object"
      ? selectedOpt.label
      : selectedOpt
    : placeholder;

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`${formInputClass(false, false)} !text-xs font-semibold flex items-center justify-between !pr-2 text-left w-full cursor-pointer select-none bg-white hover:border-slate-400`}
      >
        <span className="truncate text-slate-800">{displayLabel}</span>
        <ChevronDown
          size={14}
          className={`text-slate-400 shrink-0 ml-1 transition-transform duration-150 ${isOpen ? "rotate-180 text-blue-600" : ""
            }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-[calc(100%+3px)] left-0 right-0 z-50 bg-white border border-slate-200 rounded-lg shadow-xl overflow-y-auto max-h-[165px] py-1 animate-in fade-in zoom-in-95 duration-100 divide-y divide-slate-50">
          {options.map((opt) => {
            const optVal = typeof opt === "object" ? opt.value : opt;
            const optLabel = typeof opt === "object" ? opt.label : opt;
            const isSelected = optVal === value;

            return (
              <button
                key={optVal}
                type="button"
                onClick={() => {
                  onChange(optVal);
                  setIsOpen(false);
                }}
                className={`w-full px-3 py-1.5 text-left text-xs flex items-center justify-between transition-colors ${isSelected
                  ? "bg-blue-50 text-blue-700 font-bold"
                  : "text-slate-700 hover:bg-slate-100 font-medium"
                  }`}
              >
                <span className="truncate">{optLabel}</span>
                {isSelected && <Check size={13} className="text-blue-600 shrink-0 ml-1.5" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

const formatTimeForInput = (timeVal) => {
  if (!timeVal) return "";
  const s = String(timeVal).trim();
  if (!s || s === "null" || s === "undefined") return "";

  // If already HH:mm
  if (/^\d{2}:\d{2}$/.test(s)) return s;

  // If HH:mm:ss
  if (/^\d{2}:\d{2}:\d{2}/.test(s)) return s.substring(0, 5);

  // If ISO or DateTime string
  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  }
  return s;
};

/**
 * AttendanceRegularizationModal
 * Quick-action modal dialog for regularizing an employee's attendance record with sequential traversal.
 */
export default function AttendanceRegularizationModal({
  isOpen = false,
  onClose,
  cellData,
  currentIndex = 0,
  totalDiscrepancies = 0,
  onSave,
  onSaveAndNext,
  hasNextRecord = false,
  saving = false,
}) {
  const [inTime, setInTime] = useState("");
  const [outTime, setOutTime] = useState("");
  const [status, setStatus] = useState("PRESENT");
  const [reason, setReason] = useState("Forgot to Punch Out");
  const [remarks, setRemarks] = useState("");

  // Sync internal state when cellData changes
  useEffect(() => {
    if (cellData) {
      const formattedIn = formatTimeForInput(cellData.punch_in_time);
      const formattedOut = formatTimeForInput(cellData.punch_out_time);
      setInTime(formattedIn);
      setOutTime(formattedOut);
      const currentNormalized = normalizeFormStatus(cellData.status);
      setStatus(
        currentNormalized === "ABSENT" || currentNormalized === "HALF_DAY"
          ? "PRESENT"
          : currentNormalized
      );
      setReason(
        cellData.reason ||
        (cellData.status === "A" || cellData.status === "ABSENT"
          ? "Emergency Leave Regularized"
          : "Forgot to Punch Out")
      );
      setRemarks(cellData.remarks || "");
    }
  }, [cellData]);

  // If user adds punch out time and status was HALF_DAY or ABSENT, auto suggest PRESENT
  const handleOutTimeChange = (e) => {
    const val = e.target.value;
    setOutTime(val);
    if (val && (status === "HALF_DAY" || status === "ABSENT")) {
      setStatus("PRESENT");
    }
  };

  if (!isOpen || !cellData) return null;

  const currentDisplayStatus = cellData.status || "HD";
  const dateFormatted = cellData.attendance_date
    ? new Date(cellData.attendance_date).toLocaleDateString("en-IN", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    : "—";

  const dbInFormatted = formatTimeForInput(cellData.punch_in_time);
  const dbOutFormatted = formatTimeForInput(cellData.punch_out_time);

  const getFormData = () => ({
    employee_id: cellData.employee_id,
    employee_name: cellData.employee_name,
    employee_code: cellData.employee_code,
    department: cellData.department,
    attendance_date: cellData.attendance_date,
    punch_in_time: inTime,
    punch_out_time: outTime,
    status: status,
    reason: reason,
    remarks: remarks,
  });

  const handleSaveClick = () => {
    onSave?.(getFormData());
  };

  const handleSaveAndNextClick = () => {
    onSaveAndNext?.(getFormData());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r bg-blue-900  text-white px-5 py-3.5 flex items-center justify-between shadow-xs shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center text-white backdrop-blur-sm">
              <Clock size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold tracking-wide">ATTENDANCE REGULARISATION</h3>
                {totalDiscrepancies > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400 text-amber-950 shadow-2xs">
                    {currentIndex + 1} of {totalDiscrepancies}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-blue-100/90 mt-0.5">
                Adjust punch timings & mark attendance status for the selected record
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg text-white/80 hover:text-white hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Read-Only Context Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 text-xs">
            <div>
              <span className="text-[10.5px] font-semibold text-slate-500 block">Employee</span>
              <span className="font-bold text-slate-900 block truncate" title={cellData.employee_name}>
                {cellData.employee_name}
              </span>
              <span className="text-[10px] font-mono text-indigo-700 font-semibold block">
                {cellData.employee_code || `EMP-${cellData.employee_id}`}
              </span>
            </div>

            <div>
              <span className="text-[10.5px] font-semibold text-slate-500 block">Date</span>
              <span className="font-bold text-slate-900 block">{dateFormatted}</span>
            </div>

            <div>
              <span className="text-[10.5px] font-semibold text-slate-500 block">DB Check-In</span>
              <span className="font-bold text-slate-900 font-mono block">
                {dbInFormatted ? (
                  <span className="text-emerald-700 font-bold">{dbInFormatted}</span>
                ) : (
                  <span className="text-slate-400 font-normal italic">No punch</span>
                )}
              </span>
            </div>

            <div>
              <span className="text-[10.5px] font-semibold text-slate-500 block">DB Check-Out</span>
              <span className="font-bold text-slate-900 font-mono block">
                {dbOutFormatted ? (
                  <span className="text-emerald-700 font-bold">{dbOutFormatted}</span>
                ) : (
                  <span className="text-slate-400 font-normal italic">No punch</span>
                )}
              </span>
            </div>

            <div>
              <span className="text-[10.5px] font-semibold text-slate-500 block">Current Status</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200 mt-0.5">
                <AlertCircle size={11} />
                <span>{currentDisplayStatus}</span>
              </span>
            </div>
          </div>

          {/* Form Fields Section */}
          <div className="space-y-3.5">
            {/* Punch In & Punch Out Times */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Punch In Time
                </label>
                <div className="relative">
                  <Clock size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="time"
                    value={inTime}
                    onChange={(e) => setInTime(e.target.value)}
                    className={`${formInputClass(false, false)} !pl-8 !text-xs font-mono`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Punch Out Time
                </label>
                <div className="relative">
                  <Clock size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="time"
                    value={outTime}
                    onChange={handleOutTimeChange}
                    className={`${formInputClass(false, false)} !pl-8 !text-xs font-mono`}
                  />
                </div>
              </div>
            </div>

            {/* Target Regularized Status & Reason */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Regularized Status <span className="text-rose-500">*</span>
                </label>
                <CustomSelect
                  value={status}
                  onChange={(val) => setStatus(val)}
                  options={STATUS_OPTIONS}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Regularization Reason <span className="text-rose-500">*</span>
                </label>
                <CustomSelect
                  value={reason}
                  onChange={(val) => setReason(val)}
                  options={REASON_OPTIONS}
                />
              </div>
            </div>

            {/* Remarks */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Verification Remarks / Justification
              </label>
              <textarea
                rows={3}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="e.g. Verified with team leader; biometric machine was under maintenance..."
                className={`${formInputClass(false, false)} !h-auto !py-2 !text-xs leading-relaxed`}
              />
            </div>

            {/* Info Helper Callout */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-2.5 flex items-start gap-2 text-xs text-blue-900">
              <Info size={15} className="text-blue-600 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                Adding valid in and out timings will mark this record as <strong>Present (P)</strong> and update payroll calculation hours accordingly.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer Toolbar */}
        <div className="border-t border-slate-200 bg-slate-50 px-5 py-3 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl shadow-2xs transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveClick}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl shadow-2xs transition-colors"
            >
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              <span>Save Record</span>
            </button>

            <button
              type="button"
              onClick={handleSaveAndNextClick}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-xl shadow-xs transition-all"
            >
              {saving ? (
                <Loader2 size={13} className="animate-spin" />
              ) : hasNextRecord ? (
                <ArrowRight size={13} />
              ) : (
                <CheckCircle2 size={13} />
              )}
              <span>{hasNextRecord ? "Save & Next Record" : "Save & Finish"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
