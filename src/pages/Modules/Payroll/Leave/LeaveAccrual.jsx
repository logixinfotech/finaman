
import { useEffect, useState, useCallback, useRef } from "react";
import {
  getActledList,
  getLeaveTypes,
  getLeaveAccruals,
  bulkSaveAccrual,
  postAccruals,
  fetchUserGroupsByType,
  deleteLeaveAccrual,
} from "../../../../utils/api";
import { showToast, confirmDelete } from "../../../../components/Reusable/alert";
import ERPAutocomplete from "../../../../components/Reusable/input/ERPAutocomplete";
import ERPFooter from "../../../../components/Reusable/form/FooterForm";
import ERPHeader from "../../../../components/Reusable/form/HeaderForm";
import { useERPMode } from "../../../../components/Reusable/form/useFormMode";

const MONTHS = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => String(new Date().getFullYear() - 1 + i));

export const getEligibleFYMonths = (dojStr, fyStartYear) => {
  const fyYear = parseInt(fyStartYear) || new Date().getFullYear();
  const fyMonths = [
    { index: 1, name: "Apr", year: fyYear, month: 4 },
    { index: 2, name: "May", year: fyYear, month: 5 },
    { index: 3, name: "Jun", year: fyYear, month: 6 },
    { index: 4, name: "Jul", year: fyYear, month: 7 },
    { index: 5, name: "Aug", year: fyYear, month: 8 },
    { index: 6, name: "Sep", year: fyYear, month: 9 },
    { index: 7, name: "Oct", year: fyYear, month: 10 },
    { index: 8, name: "Nov", year: fyYear, month: 11 },
    { index: 9, name: "Dec", year: fyYear, month: 12 },
    { index: 10, name: "Jan", year: fyYear + 1, month: 1 },
    { index: 11, name: "Feb", year: fyYear + 1, month: 2 },
    { index: 12, name: "Mar", year: fyYear + 1, month: 3 },
  ];

  if (!dojStr) {
    return fyMonths.map((m) => ({ ...m, isEligible: true }));
  }

  const doj = new Date(dojStr);
  if (isNaN(doj.getTime())) {
    return fyMonths.map((m) => ({ ...m, isEligible: true }));
  }

  const dojY = doj.getFullYear();
  const dojM = doj.getMonth() + 1;
  const dojD = doj.getDate();

  // Rule:
  // If joined on or before 15th (dojD <= 15) -> eligible for that joining month
  // If joined after 15th (dojD > 15) -> eligible starting from next month
  let eligY = dojY;
  let eligM = dojM;
  if (dojD > 15) {
    if (dojM === 12) {
      eligY = dojY + 1;
      eligM = 1;
    } else {
      eligM = dojM + 1;
    }
  }

  return fyMonths.map((m) => {
    const isEligible = m.year > eligY || (m.year === eligY && m.month >= eligM);
    return { ...m, isEligible };
  });
};

export const getFYMonthTimeline = (monthIdx, fyStartYear) => {
  // monthIdx: 0 (Apr) to 11 (Mar)
  const fyYear = parseInt(fyStartYear) || new Date().getFullYear();
  const calMonth = monthIdx < 9 ? monthIdx + 4 : monthIdx - 8;
  const calYear = monthIdx < 9 ? fyYear : fyYear + 1;

  const now = new Date();
  const curYear = now.getFullYear();
  const curMonth = now.getMonth() + 1;

  const isPast = (calYear < curYear) || (calYear === curYear && calMonth < curMonth);
  const isCurrent = (calYear === curYear && calMonth === curMonth);
  const isFuture = !isPast && !isCurrent;

  return { calMonth, calYear, isPast, isCurrent, isFuture };
};

const AVATAR_COLORS = [
  { bg: "bg-blue-100", text: "text-blue-800" },
  { bg: "bg-purple-100", text: "text-purple-800" },
  { bg: "bg-teal-100", text: "text-teal-800" },
  { bg: "bg-amber-100", text: "text-amber-800" },
  { bg: "bg-pink-100", text: "text-pink-800" },
  { bg: "bg-green-100", text: "text-green-800" },
];
const initials = (name = "") => name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
const fmtNum = (n) => (parseFloat(n) || 0).toFixed(2);

// ── LeaveType Dropdown ────────────────────────────────────────────────────────
const LeaveTypeDropdown = ({ allLeaveTypes, selectedLTs, onToggle, onRateChange, disabled }) => {
  const [open, setOpen] = useState(false);

  const selectedNames = Object.entries(selectedLTs)
    .filter(([, v]) => v?.checked)
    .map(([id]) => allLeaveTypes.find((l) => l.leave_type_id === id)?.leave_name)
    .filter(Boolean);

  const totalRate = Object.values(selectedLTs)
    .filter((v) => v?.checked)
    .reduce((s, v) => s + (parseFloat(v.rate) || 0), 0)
    .toFixed(2);

  return (
    <div className="relative">
      <div
        onClick={() => !disabled && setOpen((o) => !o)}
        className={`min-h-[32px] px-3 py-1 border rounded-md bg-white
                    flex items-center justify-between gap-2 transition-colors
                    ${disabled
            ? "border-slate-100 bg-[#eef1f6] cursor-not-allowed"
            : "border-slate-200 cursor-pointer hover:border-blue-300"}`}
        style={{ minWidth: 220 }}
      >
        <div className="flex flex-wrap gap-1 flex-1">
          {selectedNames.length === 0 ? (
            <span className="text-[12px] text-slate-400">Select leave types...</span>
          ) : (
            selectedNames.map((name) => (
              <span key={name}
                className="px-2 py-0.5 rounded-full text-[11px] font-medium
                           bg-blue-50 text-blue-700 border border-blue-200">
                {name}
              </span>
            ))
          )}
        </div>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
          className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`}>
          <path d="M2 4l4 4 4-4" stroke="#94a3b8" strokeWidth="1.3"
            strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {open && !disabled && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 z-50 bg-white border
                          border-slate-200 rounded-lg shadow-lg overflow-hidden"
            style={{ minWidth: 290 }}>
            <div className="px-3 py-2 bg-slate-50 border-b border-slate-100">
              <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">
                Click row to select · Set days/month
              </p>
            </div>
            <div className="max-h-60 overflow-y-auto divide-y divide-slate-50">
              {allLeaveTypes.map((lt) => {
                const isChecked = !!selectedLTs[lt.leave_type_id]?.checked;
                const rate = selectedLTs[lt.leave_type_id]?.rate || "";
                return (
                  <div key={lt.leave_type_id}
                    onClick={() => onToggle(lt.leave_type_id)}
                    className={`flex items-center gap-2 px-3 py-2.5 cursor-pointer
                                transition-colors select-none
                                ${isChecked ? "bg-blue-50/50" : "hover:bg-slate-50"}`}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => { }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-3.5 h-3.5 accent-blue-600 cursor-pointer flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`text-[13px] truncate
                        ${isChecked ? "font-medium text-slate-800" : "text-slate-500"}`}>
                        {lt.leave_name}
                      </p>
                      <p className="text-[11px] text-slate-400">Max {lt.max_days} days / year</p>
                    </div>
                    {isChecked && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 bg-white border
                                   border-blue-200 rounded-md px-2 py-1 shrink-0">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={rate}
                          onChange={(e) => onRateChange(lt.leave_type_id, e.target.value)}
                          placeholder="0"
                          className="w-[36px] h-[18px] bg-transparent border-none
                                     outline-none text-center text-[12px] font-medium
                                     text-blue-800"
                        />
                        <span className="text-[10px] text-slate-400 whitespace-nowrap">/mo</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {Object.values(selectedLTs).some((v) => v?.checked) && (
              <div className="px-3 py-2 bg-slate-50 border-t border-slate-200
                              flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  {Object.values(selectedLTs).filter((v) => v?.checked).length} selected
                </span>
                <span className="text-[11px] font-medium text-blue-700
                                 bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5">
                  {totalRate} days / month
                </span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────
const LeaveAccrualBulk = ({ tab }) => {
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [deptId, setDeptId] = useState("");
  const [deptName, setDeptName] = useState("All Departments");
  const [allLeaveTypes, setAllLeaveTypes] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedLTs, setSelectedLTs] = useState({});
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState({});   // ← EMPTY by default
  const [posting, setPosting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Keep original rows for cancel/reset
  const originalRows = useRef([]);

  const { mode, setMode, handleAdd, handleModify, handleEditCancel, rights } = useERPMode(
    {}, async () => { }, async () => { }, tab?.appl_name
  );

  const isViewMode = mode === "view";
  const isEditMode = mode === "edit";
  const isAddMode = mode === "add";

  // ── Load master data ──────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const [empData, ltData, deptData] = await Promise.all([
          getActledList(), getLeaveTypes(), fetchUserGroupsByType("DEP"),
        ]);
        setAllEmployees(empData || []);
        setAllLeaveTypes(ltData?.data || []);
        setDepartments(deptData?.data || []);
      } catch (err) { console.error(err); }
    };
    load();
  }, []);

  const deptNames = ["All Departments", ...departments.map((d) => d.group_name)];
  const filteredEmployees = deptId
    ? allEmployees.filter((e) => String(e.Op_id3) === deptId)
    : allEmployees;

  const handleDeptChange = (val) => {
    setDeptName(val);
    if (val === "All Departments") { setDeptId(""); return; }
    const found = departments.find((d) => d.group_name === val);
    setDeptId(found ? String(found.group_id) : "");
  };

  // ── Leave type toggle ─────────────────────────────────────────────────
  const toggleLT = (ltId) => {
    setSelectedLTs((prev) => {
      if (prev[ltId]?.checked) {
        const next = { ...prev };
        delete next[ltId];
        return next;
      }
      const lt = allLeaveTypes.find((l) => l.leave_type_id === ltId);
      const rate = lt?.max_days ? (lt.max_days / 12).toFixed(2) : "1.00";
      return { ...prev, [ltId]: { checked: true, rate } };
    });
  };

  const handleRateChange = (ltId, val) =>
    setSelectedLTs((prev) => ({ ...prev, [ltId]: { ...prev[ltId], rate: val } }));

  const checkedLTList = Object.entries(selectedLTs)
    .filter(([, v]) => v?.checked)
    .map(([ltId, v]) => ({
      ltId,
      name: allLeaveTypes.find((l) => l.leave_type_id === ltId)?.leave_name || ltId,
      rate: v.rate,
    }));

  const totalRate = checkedLTList
    .reduce((s, lt) => s + (parseFloat(lt.rate) || 0), 0)
    .toFixed(2);

  // ── Load existing accruals ────────────────────────────────────────────
  const loadAccruals = useCallback(async () => {
    if (!year || filteredEmployees.length === 0) { setRows([]); return; }
    try {
      setLoading(true);
      const res = await getLeaveAccruals({ year });
      const existing = res?.data || [];
      const takenList = res?.takenLeaves || [];

      // Map employee_id -> { [monthNum 1..12]: totalTakenDays }
      const takenByEmpAndMonth = {};
      const fyStartYear = parseInt(year) || new Date().getFullYear();

      takenList.forEach((tl) => {
        const empId = Number(tl.employee_id);
        if (!empId || !tl.from_date) return;

        const d = new Date(tl.from_date);
        if (isNaN(d.getTime())) return;

        const calMonth = d.getMonth() + 1; // 1-12
        const calYear = d.getFullYear();

        let mNum = null;
        if (calMonth >= 4 && calYear === fyStartYear) {
          mNum = calMonth - 3;
        } else if (calMonth <= 3 && calYear === fyStartYear + 1) {
          mNum = calMonth + 9;
        }

        if (mNum) {
          if (!takenByEmpAndMonth[empId]) takenByEmpAndMonth[empId] = {};
          const days = parseFloat(tl.total_days) || 1;
          takenByEmpAndMonth[empId][mNum] = (takenByEmpAndMonth[empId][mNum] || 0) + days;
        }
      });

      const newRows = filteredEmployees.map((emp) => {
        const empAccruals = existing.filter(
          (a) => Number(a.employee_id) === Number(emp.Actled_id)
        );

        const months = {};
        const totalAnnual = empAccruals.reduce((s, a) =>
          s + parseFloat(a.accrual_days || 0), 0
        );
        const perMonthDisplay = parseFloat((totalAnnual / 12).toFixed(2));
        const isPostedAll = empAccruals.length > 0 && empAccruals.every(a => !!a.is_posted);

        // ✅ remarks se month-wise data parse karo
        let monthData = {};
        try {
          const remarksStr = empAccruals[0]?.remarks || "";
          const parsed = JSON.parse(remarksStr);
          if (parsed?.months) monthData = parsed.months;
        } catch (e) {
          monthData = {};
        }
        const hasMonthData = Object.keys(monthData).length > 0;

        // ✅ Calculate FY months eligibility based on employee Date of Joining (15th-day rule)
        const eligibleFYMonths = getEligibleFYMonths(emp.Doj, year);

        for (let i = 1; i <= 12; i++) {
          const isElig = eligibleFYMonths[i - 1]?.isEligible ?? true;

          const ltBreakdown = empAccruals.map(a => ({
            leave_type_id: a.leave_type_id,
            leave_name: a.leave_name,
            accrual_id: a.accrual_id,
            perMonth: parseFloat((parseFloat(a.accrual_days || 0) / 12).toFixed(2)),
          }));

          months[i] = {
            accrual_ids: empAccruals.map(a => a.accrual_id).filter(Boolean),
            // ✅ Month data available hai to use karo, warna eligible months mein perMonthDisplay
            days: hasMonthData
              ? (monthData[String(i)] !== undefined && monthData[String(i)] > 0 ? String(monthData[String(i)]) : "")
              : (isElig && perMonthDisplay > 0 ? String(perMonthDisplay) : ""),
            ltBreakdown,
            is_posted: isPostedAll,
            is_eligible: isElig,
          };
        }

        const carry_forward = fmtNum(empAccruals[0]?.carry_forward || 0);
        const isPosted = empAccruals.length > 0 && empAccruals.every((a) => a.is_posted);

        const existingLTIds = {};
        empAccruals.forEach((a) => {
          if (a.leave_type_id) existingLTIds[a.leave_type_id] = true;
        });

        const empTakenMonths = takenByEmpAndMonth[Number(emp.Actled_id)] || {};

        return {
          employee_id: emp.Actled_id,
          employee_name: (emp.full_name || emp.Led_name)?.trim() || "",
          doj: emp.Doj,
          dept_name: emp.Op_name3 || "—",
          months,
          takenMonths: empTakenMonths,
          carry_forward,
          is_posted: isPosted,
          existingLTIds,
        };
      });

      setRows(newRows);
      originalRows.current = JSON.parse(JSON.stringify(newRows));
      setSelected({});
    } catch (err) {
      console.error("loadAccruals error:", err);
    } finally {
      setLoading(false);
    }
  }, [year, deptId, allEmployees]);

  useEffect(() => { loadAccruals(); }, [year, deptId, allEmployees]);

  // ── When a row is selected in modify mode — pre-check its leave types ──
  // This runs when user clicks a row checkbox
  const handleRowSelect = (empId, row) => {
    const key = String(empId);
    const newSelected = { ...selected, [key]: !selected[key] };
    setSelected(newSelected);

    // Selected employees ke baad unki common leave types compute karo
    const selRows = rows.filter(r => newSelected[r.employee_id]);
    if (selRows.length === 0) {
      // Koi select nahi — dropdown clear karo
      setSelectedLTs({});
      return;
    }

    // Sabka union of existingLTIds
    const allLTIds = new Set();
    selRows.forEach(r => Object.keys(r.existingLTIds || {}).forEach(id => allLTIds.add(id)));

    const newLTs = {};
    allLTIds.forEach(ltId => {
      const lt = allLeaveTypes.find(l => l.leave_type_id === ltId);
      // Rate — selected employees mein se kisi ka ltBreakdown se nikalo
      let rate = lt?.max_days ? (lt.max_days / 12).toFixed(2) : "1.00";
      // Pehle selected employee ka rate use karo agar available ho
      for (const r of selRows) {
        for (const m of Object.values(r.months)) {
          const ltb = m.ltBreakdown?.find(l => l.leave_type_id === ltId);
          if (ltb?.perMonth) { rate = ltb.perMonth.toFixed(2); break; }
        }
        if (rate) break;
      }
      newLTs[ltId] = { checked: true, rate };
    });
    setSelectedLTs(newLTs);
  };

  const toggleSelectAll = () => {
    const nonPosted = rows.filter((r) => !r.is_posted);
    const allSel = nonPosted.every((r) => selected[String(r.employee_id)]);
    const next = {};
    nonPosted.forEach((r) => { next[String(r.employee_id)] = !allSel; });
    setSelected(next);
  };

  // ── Auto-fill (respects DOJ 15th-day rule, locks past and taken months) ──
  const handleAutoFill = () => {
    if (checkedLTList.length === 0) {
      showToast({ icon: "error", title: "Please select at least one leave type" });
      return;
    }
    const rate = parseFloat(totalRate) || 0;
    const fyYear = parseInt(year) || new Date().getFullYear();

    setRows(prev =>
      prev.map(row => {
        const isSelected = Object.keys(selected).some(
          k => String(k) === String(row.employee_id) && selected[k]
        );
        if (row.is_posted || !isSelected) return row;

        const months = { ...row.months };
        for (let m = 1; m <= 12; m++) {
          const { isPast } = getFYMonthTimeline(m - 1, fyYear);
          const isTaken = (row.takenMonths?.[m] || 0) > 0;
          const isElig = months[m]?.is_eligible ?? true;

          // Only auto-fill if not posted, eligible, not past month, and not leave taken
          if (!months[m]?.is_posted && isElig && !isPast && !isTaken) {
            months[m] = {
              ...months[m],
              days: rate.toFixed(2),
              is_posted: false
            };
          }
        }
        return { ...row, months };
      })
    );
  };


  const handleCellChange = (empId, monthNum, value) => {
    if (isViewMode) return;
    const { isPast } = getFYMonthTimeline(monthNum - 1, parseInt(year) || new Date().getFullYear());
    if (isPast) return; // Disallow editing past month

    setRows(prev => prev.map(row => {
      if (row.employee_id !== empId) return row;
      const isTaken = (row.takenMonths?.[monthNum] || 0) > 0;
      if (isTaken) return row; // Disallow editing month where leave was taken

      return {
        ...row,
        months: {
          ...row.months,
          [monthNum]: {
            ...row.months[monthNum],
            days: value,
            is_posted: false,
          },
        },
      };
    }));
  };

  const handleCFChange = (empId, value) => {
    if (isViewMode) return;
    setRows((prev) =>
      prev.map((r) => r.employee_id === empId ? { ...r, carry_forward: value } : r)
    );
  };

  const getTotalBalance = (row) => {
    const monthSum = Object.values(row.months).reduce((s, m) => s + (parseFloat(m.days) || 0), 0);
    return (monthSum + (parseFloat(row.carry_forward) || 0)).toFixed(2);
  };

  // ── Save ──────────────────────────────────────────────────────────────
  const handleSave = async () => {
    const selRows = rows.filter((r) => selected[r.employee_id] && !r.is_posted);
    if (selRows.length === 0) { showToast({ icon: "error", title: "Select at least one employee" }); return; }
    if (checkedLTList.length === 0) { showToast({ icon: "error", title: "Select at least one leave type" }); return; }

    setPosting(true);
    try {
      const payload = [];

      selRows.forEach((row) => {
        const cf = parseFloat(row.carry_forward) || 0;

        checkedLTList.forEach((lt) => {
          const activeLTCount = checkedLTList.length || 1;

          // Har month ki actual cell value ka sum — annual total
          const annualTotal = Object.values(row.months).reduce((s, m) => {
            return s + (parseFloat(m.days) || 0);
          }, 0);

          // Multiple LTs hain to equal split
          const ltAccrualDays = parseFloat((annualTotal / activeLTCount).toFixed(2));

          // Fallback — agar koi cell fill nahi
          const eligibleMonthsCount = Object.values(row.months).filter(m => m.is_eligible).length;
          const fallback = parseFloat(((parseFloat(lt.rate) || 0) * eligibleMonthsCount).toFixed(2));
          const finalAccrualDays = annualTotal > 0 ? ltAccrualDays : fallback;

          const ltTotal = parseFloat((finalAccrualDays + cf).toFixed(2));

          payload.push({
            employee_id: row.employee_id,
            leave_type_id: lt.ltId,
            financial_year: Number(year),
            accrual_type: "Yearly",
            accrual_days: finalAccrualDays,
            carry_forward: cf,
            total_accrued: ltTotal,
            // ✅ months data JSON mein store karo
            remarks: JSON.stringify({
              months: Object.fromEntries(
                Object.entries(row.months).map(([m, v]) => [m, parseFloat(v.days) || 0])
              )
            }),
          });
        });
      });

      await bulkSaveAccrual(payload);
      showToast({ icon: "success", title: `${selRows.length} employee accruals saved` });
      await loadAccruals();
      setMode("view");
    } catch (err) {
      showToast({ icon: "error", title: "Save failed" });
    } finally {
      setPosting(false);
    }
  };

  const handleCancel = useCallback(async () => {

    if (mode === "add" || mode === "edit") {

      const hasChanges =
        JSON.stringify(rows) !== JSON.stringify(originalRows.current);

      // FIRST CANCEL → RESET
      if (hasChanges) {

        setRows(JSON.parse(JSON.stringify(originalRows.current)));
        setSelected({});
        setSelectedLTs({});

        showToast({
          icon: "info",
          title: "Form Reset"
        });

        return;
      }

      // SECOND CANCEL / ESC → VIEW MODE
      setMode("view");
    }

  }, [mode, rows]);


  useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === "Escape") {
        handleCancel();
      }
    };
    window.addEventListener("keydown", handleEscKey);
    return () => {
      window.removeEventListener("keydown", handleEscKey);
    };
  }, [handleCancel]);

  // ✅ FIX 4: Delete selected rows
  const handleDelete = async () => {
    const selRows = rows.filter((r) => selected[r.employee_id]);
    if (selRows.length === 0) { showToast({ icon: "error", title: "Select employee to delete" }); return; }

    const confirmed = await confirmDelete({
      title: `Delete accrual for ${selRows.length} employee(s)?`,
    });
    if (!confirmed) return;

    try {
      for (const row of selRows) {
        const accrualIds = new Set();

        Object.values(row.months).forEach(m => {
          // ltBreakdown mein accrual_id hai
          (m.ltBreakdown || []).forEach(ltb => {
            if (ltb.accrual_id) accrualIds.add(ltb.accrual_id);
          });
          (m.accrual_ids || []).forEach(id => {
            if (id) accrualIds.add(id);
          });
        });

        for (const id of accrualIds) {
          await deleteLeaveAccrual(id);
        }
      }
      showToast({ icon: "success", title: "Deleted successfully" });
      await loadAccruals();
    } catch (err) {
      showToast({ icon: "error", title: "Delete failed" });
    }
  };

  const selectedCount = rows.filter((r) => selected[r.employee_id]).length;
  const draftCount = rows.filter((r) => !r.is_posted).length;
  const postedCount = rows.filter((r) => r.is_posted).length;

  return (
    <div className="h-full flex flex-col overflow-hidden bg-slate-50">

      <ERPHeader
        title="LEAVE ACCRUAL & CARRY FORWARD"
        isAddMode={isAddMode}
        isEditMode={isEditMode}
        isViewMode={isViewMode}
        isHidden={true}
        activeTab="entry"
        onTabChange={() => { }}
        rightContent={`${rows.length} Employees`}
      />

      {/* ── Filter bar ── */}
      <div className="shrink-0 bg-white border-b border-slate-200
                      px-5 py-2.5 flex items-end gap-4 flex-wrap">

        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">Year</span>
          <ERPAutocomplete
            options={YEAR_OPTIONS}
            value={year}
            onChange={(v) => { if (!isViewMode) setYear(v); }}
            className="h-[32px] w-[90px] px-2 text-[12px] border border-slate-200
                       rounded-md bg-white text-slate-700 outline-none focus:border-blue-300"
          />
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">Department</span>
          <ERPAutocomplete
            options={deptNames}
            value={deptName}
            onChange={(v) => { if (!isViewMode) handleDeptChange(v); }}
            className="h-[32px] w-[180px] px-2 text-[12px] border border-slate-200
                       rounded-md bg-white text-slate-700 outline-none focus:border-blue-300"
          />
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between" style={{ minWidth: 220 }}>
            <span className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">Leave Types</span>
            {parseFloat(totalRate) > 0 && (
              <span className="text-[10px] font-medium text-blue-700">{totalRate} days/mo</span>
            )}
          </div>
          <LeaveTypeDropdown
            allLeaveTypes={allLeaveTypes}
            selectedLTs={selectedLTs}
            onToggle={toggleLT}
            onRateChange={handleRateChange}
            disabled={isViewMode}
          />
        </div>

        <div className="flex-1" />

        {/* Status & Legend badges */}
        <div className="flex items-center gap-2 self-end pb-0.5 flex-wrap">
          <span className="px-2.5 py-1 rounded-full text-[11px] font-medium
                 bg-green-50 text-green-700 border border-green-200">
            {postedCount} posted
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-medium
                 bg-slate-100 text-slate-500 border border-slate-200" title="Previous months are locked">
            🔒 Past (Locked)
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-medium
                 bg-amber-50 text-amber-800 border border-amber-200" title="Months where leave was taken are locked">
            🏷️ Taken (Locked)
          </span>
        </div>

        <div className="flex flex-col gap-1 self-end">
          <span className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">Search</span>
          <div className="relative flex items-center">
            <svg width="12" height="12" className="absolute left-2.5 text-slate-400" fill="none"
              stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" />
            </svg>
            <input
              type="text"
              placeholder="Search employee..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="h-[32px] pl-8 pr-3 w-[180px] text-[12px] border border-slate-200
                 rounded-md bg-white text-slate-700 outline-none focus:border-blue-300"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")}
                className="absolute right-2 text-slate-400 hover:text-slate-600">
                <svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {!isViewMode && (
          <button
            onClick={handleAutoFill}
            className="h-[32px] px-4 rounded-md text-[12px] font-medium self-end
                       bg-slate-700 text-white hover:bg-slate-800
                       transition-colors flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 12 12" fill="none">
              <path d="M2 6h8M6 2l4 4-4 4" stroke="white" strokeWidth="1.3"
                strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Auto-fill selected
          </button>
        )}
      </div>

      {/* ── Table ── */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-[13px] text-slate-400">
            Loading...
          </div>
        ) : (
          <div className="min-w-[900px]">
            <table className="w-full border-collapse text-[12px]">
              <thead className="sticky top-0 z-10">
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="w-8 px-3 py-2 border-r border-slate-200">
                    {!isViewMode && (
                      <input
                        type="checkbox"
                        checked={
                          rows.filter((r) => !r.is_posted).length > 0 &&
                          rows.filter((r) => !r.is_posted).every((r) => selected[r.employee_id])
                        }
                        onChange={toggleSelectAll}
                        className="w-3.5 h-3.5 accent-blue-600 cursor-pointer"
                      />
                    )}
                  </th>
                  <th className="text-left px-3 py-2 font-medium text-slate-500
                                 border-r border-slate-200 w-[150px] text-[11px]
                                 uppercase tracking-wide">
                    Employee
                  </th>
                  {MONTHS.map((m, i) => {
                    const { isPast, isCurrent } = getFYMonthTimeline(i, parseInt(year) || new Date().getFullYear());
                    return (
                      <th key={m}
                        className={`px-1 py-1.5 text-center font-medium text-[11px]
                                    border-r border-slate-200 w-[52px]
                                    ${isCurrent
                            ? "bg-blue-100/70 text-blue-700 font-bold border-b-2 border-blue-500"
                            : isPast
                              ? "bg-slate-100/80 text-slate-400 font-medium"
                              : "text-slate-600 font-medium"}`}>
                        <span className="block">{m}</span>
                        {isCurrent && <span className="block text-[8px] text-blue-600 font-semibold uppercase leading-tight">Now</span>}
                        {isPast && <span className="block text-[8px] text-slate-400 uppercase leading-tight">Past</span>}
                      </th>
                    );
                  })}
                  <th className="px-2 py-2 text-center font-medium text-[11px]
                                 bg-purple-50 text-purple-700 border-r border-slate-200
                                 w-[68px] uppercase tracking-wide">
                    Carry Fwd
                  </th>
                  <th className="px-2 py-2 text-center font-medium text-[11px]
                                 bg-green-50 text-green-700 border-r border-slate-200
                                 w-[68px] uppercase tracking-wide">
                    Total
                  </th>
                  {/* <th className="px-2 py-2 text-center font-medium text-[11px]
                                 text-slate-500 w-[68px] uppercase tracking-wide">
                    Status
                  </th> */}
                </tr>
              </thead>

              <tbody>
                {rows
                  .filter(row =>
                    !searchQuery ||
                    row.employee_name.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((row, rowIdx) => {
                    const { bg, text } = AVATAR_COLORS[rowIdx % AVATAR_COLORS.length];
                    const isPosted = row.is_posted;
                    const isSel = !!selected[String(row.employee_id)];
                    const total = getTotalBalance(row);

                    return (
                      <tr key={row.employee_id}
                        className={`border-b border-slate-100 transition-colors
                        ${isPosted ? "opacity-60" : ""}
                        ${isSel && !isPosted ? "bg-blue-50/30" : "hover:bg-slate-50"}`}>

                        {/* Checkbox */}
                        <td className="px-3 py-1.5 border-r border-slate-100 text-center">
                          {!isViewMode && (
                            <input
                              type="checkbox"
                              checked={isSel}
                              disabled={isPosted}
                              onChange={() => handleRowSelect(row.employee_id, row)}
                              className="w-3.5 h-3.5 accent-blue-600 cursor-pointer
                                       disabled:cursor-not-allowed"
                            />
                          )}
                        </td>

                        {/* Employee */}
                        <td className="px-2 py-1.5 border-r border-slate-100">
                          <div className="flex items-center gap-1.5">
                            <div className={`w-6 h-6 rounded-full flex items-center
                                           justify-center text-[9px] font-medium
                                           shrink-0 ${bg} ${text}`}>
                              {initials(row.employee_name)}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-[12px] text-slate-700 font-medium
                                             truncate max-w-[110px]">
                                {row.employee_name}
                              </span>
                              {row.doj && (
                                <span className="text-[9px] text-slate-400">
                                  DOJ: {new Date(row.doj).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' })}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* 12 months */}
                        {Array.from({ length: 12 }, (_, i) => {
                          const mNum = i + 1;
                          const { isPast, isCurrent } = getFYMonthTimeline(i, parseInt(year) || new Date().getFullYear());
                          const cell = row.months[mNum];
                          const val = cell?.days || "";
                          const isElig = cell?.is_eligible ?? true;
                          const takenDays = row.takenMonths?.[mNum] || 0;
                          const isTaken = takenDays > 0;

                          const cellDis = cell?.is_posted || isPosted || isViewMode || !isElig || isPast || isTaken;

                          let tooltip = "";
                          if (!isElig) {
                            tooltip = "Not eligible for this month (joined after 15th / not yet joined)";
                          } else if (isTaken) {
                            tooltip = `Leave taken: ${takenDays} day(s) in this month — locked`;
                          } else if (isPast) {
                            tooltip = `Previous month (${MONTHS[i]}) — locked from editing`;
                          } else if (isCurrent) {
                            tooltip = "Current month";
                          }

                          let tdBgClass = "";
                          if (!isElig) {
                            tdBgClass = "bg-slate-100/60";
                          } else if (isTaken) {
                            tdBgClass = "bg-amber-50/70";
                          } else if (isPast) {
                            tdBgClass = "bg-slate-100/50";
                          } else if (isCurrent) {
                            tdBgClass = "bg-blue-50/20";
                          }

                          let inputClass = "w-[44px] h-[24px] text-center text-[12px] rounded border outline-none transition-colors ";
                          if (!isElig) {
                            inputClass += "bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed";
                          } else if (isTaken) {
                            inputClass += "bg-amber-100 border-amber-300 text-amber-900 font-semibold cursor-not-allowed shadow-inner";
                          } else if (isPast) {
                            inputClass += "bg-slate-100/80 border-slate-200 text-slate-400 font-medium cursor-not-allowed";
                          } else if (cellDis) {
                            inputClass += "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed";
                          } else if (val) {
                            inputClass += "bg-green-50 border-green-300 text-green-800 focus:border-green-400 focus:bg-white";
                          } else {
                            inputClass += "bg-white border-slate-200 text-slate-600 focus:border-blue-300";
                          }

                          return (
                            <td key={mNum}
                              className={`px-1 py-1.5 border-r border-slate-100 text-center ${tdBgClass}`}
                              title={tooltip}>
                              <div className="relative inline-block">
                                <input
                                  type="number"
                                  step="0.5"
                                  min="0"
                                  value={val}
                                  disabled={cellDis}
                                  onChange={(e) => handleCellChange(row.employee_id, mNum, e.target.value)}
                                  className={inputClass}
                                  title={tooltip}
                                />
                                {isTaken && (
                                  <span
                                    className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500 border border-white"
                                    title={`Leave taken: ${takenDays}d`}
                                  />
                                )}
                              </div>
                            </td>
                          );
                        })}

                        {/* Carry forward */}
                        <td className="px-1 py-1.5 border-r border-slate-100 text-center bg-purple-50/20">
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            value={row.carry_forward}
                            disabled={isPosted || isViewMode}
                            onChange={(e) => handleCFChange(row.employee_id, e.target.value)}
                            className={`w-[52px] h-[24px] text-center text-[12px]
                                      rounded border outline-none
                                      ${isPosted || isViewMode
                                ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed"
                                : "bg-purple-50 border-purple-300 text-purple-800 focus:border-purple-400"}`}
                          />
                        </td>

                        {/* Total */}
                        <td className="px-2 py-1.5 border-r border-slate-100 text-center bg-green-50/20">
                          <span className="text-[13px] font-medium text-green-800">{total}</span>
                        </td>

                        {/* Status */}
                        {/* <td className="px-2 py-1.5 text-center">
                          {isPosted ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium
                   bg-green-50 text-green-700 border border-green-200">
                              Posted
                            </span>
                          ) : null}
                        </td> */}
                      </tr>
                    );
                  })}

                {rows.length === 0 && (
                  <tr>
                    <td colSpan={17}
                      className="text-center py-12 text-[13px] text-slate-400">
                      No employees found. Check filters above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ERPFooter
        isAddMode={isAddMode}
        isEditMode={isEditMode}
        isViewMode={isViewMode}
        saving={posting}
        handleSubmit={handleSave}
        onModify={handleModify}
        onEditCancel={handleCancel}
        onDelete={selectedCount > 0 ? handleDelete : null}
        onCancel={handleCancel}
        onNewEntry={handleAdd}
        rights={rights}
      />
    </div>
  );
};

export default LeaveAccrualBulk;