// pages/LeaveManagement/LeaveAccrual/LeaveAccrualBulk.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Bulk accrual — employee list left, 12 months grid, auto-fill, post all
// No form needed — sab kuch ek hi table mein
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useState, useCallback } from "react";
import {
  getActledList,
  getLeaveTypes,
  getLeaveAccruals,
  bulkSaveAccrual,
  postAccruals,
  fetchUserGroupsByType,
} from "../../../../utils/api";
import { showToast, confirmDelete } from "../../../../components/Reusable/alert";
import ERPAutocomplete from "../../../../components/Reusable/input/ERPAutocomplete";

// ── Constants ────────────────────────────────────────────────────────────────
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) =>
  String(new Date().getFullYear() - 1 + i)
);

const AVATAR_COLORS = [
  { bg: "bg-blue-100", text: "text-blue-800" },
  { bg: "bg-purple-100", text: "text-purple-800" },
  { bg: "bg-teal-100", text: "text-teal-800" },
  { bg: "bg-amber-100", text: "text-amber-800" },
  { bg: "bg-pink-100", text: "text-pink-800" },
  { bg: "bg-green-100", text: "text-green-800" },
];

const initials = (name = "") =>
  name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

const fmtNum = (n) => (parseFloat(n) || 0).toFixed(2);

const LeaveTypeDropdown = ({ allLeaveTypes, selectedLTs, onToggle, onRateChange }) => {
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
      {/* Trigger */}
      <div
        onClick={() => setOpen((o) => !o)}
        className="min-h-[32px] px-3 py-1 border border-slate-200 rounded-md
                   bg-white cursor-pointer flex items-center justify-between gap-2
                   hover:border-blue-300 transition-colors"
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

      {/* Dropdown panel */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute top-full left-0 mt-1 z-50 bg-white border
                          border-slate-200 rounded-lg shadow-lg overflow-hidden"
            style={{ minWidth: 280 }}>

            <div className="px-3 py-2 bg-slate-50 border-b border-slate-100">
              <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">
                Select leave types &amp; set rate
              </p>
            </div>

            <div className="max-h-60 overflow-y-auto divide-y divide-slate-50">
              {allLeaveTypes.map((lt) => {
                const isChecked = !!selectedLTs[lt.leave_type_id]?.checked;
                const rate = selectedLTs[lt.leave_type_id]?.rate || "";

                return (
                  <div key={lt.leave_type_id}
                    className={`flex items-center gap-2 px-3 py-2.5 transition-colors
                      ${isChecked ? "bg-blue-50/40" : "hover:bg-slate-50"}`}>

                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => onToggle(lt.leave_type_id)}
                      className="w-3.5 h-3.5 accent-blue-600 cursor-pointer flex-shrink-0"
                    />

                    {/* Leave name */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-[13px] truncate
                        ${isChecked ? "font-medium text-slate-800" : "text-slate-500"}`}>
                        {lt.leave_name}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Max {lt.max_days} days / year
                      </p>
                    </div>

                    {/* Inline rate input — only when checked */}
                    {isChecked && (
                      <div className="flex items-center gap-1 bg-white border
                                      border-blue-200 rounded-md px-2 py-1 shrink-0">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={rate}
                          onChange={(e) => {
                            e.stopPropagation();
                            onRateChange(lt.leave_type_id, e.target.value);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          placeholder="0"
                          className="w-[36px] h-[18px] bg-transparent border-none
                                     outline-none text-center text-[12px] font-medium
                                     text-blue-800"
                        />
                        <span className="text-[10px] text-slate-400 whitespace-nowrap">
                          /mo
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer summary */}
            {Object.values(selectedLTs).some((v) => v?.checked) && (
              <div className="px-3 py-2 bg-slate-50 border-t border-slate-200
                              flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  {Object.values(selectedLTs).filter((v) => v?.checked).length} selected
                </span>
                <span className="text-[11px] font-medium text-blue-700
                                 bg-blue-50 border border-blue-200
                                 rounded-full px-2 py-0.5">
                  {totalRate} days / month total
                </span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const LeaveAccrualBulk = ({ tab }) => {
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [deptId, setDeptId] = useState("");
  const [deptName, setDeptName] = useState("All Departments");
  const [allLeaveTypes, setAllLeaveTypes] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedLTs, setSelectedLTs] = useState({});
  const [employees, setEmployees] = useState([]);
  const [accrualRate, setAccrualRate] = useState("1.5"); // default per month
  const [rows, setRows] = useState([]);    // one row per employee
  const [selected, setSelected] = useState({});    // { empId: bool }
  const [saving, setSaving] = useState(false);
  const [posting, setPosting] = useState(false);
  const [loading, setLoading] = useState(false);

  // ── Load employees + leave types ──────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const [empData, ltData, deptData] = await Promise.all([
          getActledList(),
          getLeaveTypes(),
          fetchUserGroupsByType("DEP"),
        ]);
        setAllEmployees(empData || []);
        setEmployees(empData || []);

        setAllLeaveTypes(ltData?.data || []);
        setLeaveTypes(ltData?.data || []);

        setDepartments(deptData?.data || []);
      } catch (err) {
        console.error("Load error:", err);
      }
    };
    load();
  }, []);


  // ── Department dropdown ─────────────────────────────────────────────────
  const deptNames = ["All Departments", ...departments.map((d) => d.group_name)];

  const handleDeptChange = (val) => {
    setDeptName(val);
    if (val === "All Departments") { setDeptId(""); return; }
    const found = departments.find((d) => d.group_name === val);
    setDeptId(found ? String(found.group_id) : "");
  };

  const filteredEmployees = deptId
    ? allEmployees.filter((e) => String(e.Op_id3) === deptId)
    : allEmployees;

  // ── Leave type toggle + rate ────────────────────────────────────────────
  const toggleLT = (ltId) => {
    setSelectedLTs((prev) => {
      if (prev[ltId]?.checked) {
        const next = { ...prev };
        delete next[ltId];
        return next;
      }
      // Auto-calculate rate from max_days
      const lt = allLeaveTypes.find((l) => l.leave_type_id === ltId);
      const rate = lt?.max_days ? (lt.max_days / 12).toFixed(2) : "1.00";
      return { ...prev, [ltId]: { checked: true, rate } };
    });
  };

  const handleRateChange = (ltId, val) => {
    setSelectedLTs((prev) => ({
      ...prev,
      [ltId]: { ...prev[ltId], rate: val },
    }));
  };

  const totalRate = Object.values(selectedLTs)
    .filter((v) => v?.checked)
    .reduce((s, v) => s + (parseFloat(v.rate) || 0), 0)
    .toFixed(2);

  const checkedLTList = Object.entries(selectedLTs)
    .filter(([, v]) => v?.checked)
    .map(([ltId, v]) => ({
      ltId,
      name: allLeaveTypes.find((l) => l.leave_type_id === ltId)?.leave_name || ltId,
      rate: v.rate,
    }));

  // ── Load existing accrual data when year/leaveType changes ────────────────
  const loadAccruals = useCallback(async () => {
    if (!year || filteredEmployees.length === 0) return;
    try {
      setLoading(true);
      const res = await getLeaveAccruals({ year });
      const existing = res?.data || [];

      // Build row per employee
      const newRows = filteredEmployees.map((emp) => {
        const empAccruals = existing.filter(
          (a) => a.employee_id === emp.Actled_id
        );

        // months: { 1: { accrual_id, days, is_posted }, ... }
        const months = {};
        empAccruals.forEach((a) => {
          if (a.accrual_month) {
            months[a.accrual_month] = {
              accrual_id: a.accrual_id,
              days: fmtNum(a.accrual_days),
              is_posted: !!a.is_posted,
            };
          }
        });

        // carry forward from last year's accrual
        const cfEntry = empAccruals.find((a) => !a.accrual_month);
        const carry_forward = cfEntry
          ? fmtNum(cfEntry.carry_forward)
          : "0.00";

        // is_posted = all 12 months posted
        const allPosted =
          Object.values(months).length === 12 &&
          Object.values(months).every((m) => m.is_posted);

        return {
          employee_id: emp.Actled_id,
          employee_name: emp.Led_name?.trim() || "",
          months,
          carry_forward,
          is_posted: allPosted,
        };
      });

      setRows(newRows);
      // Select all non-posted by default
      const sel = {};
      newRows.forEach((r) => {
        if (!r.is_posted) sel[r.employee_id] = true;
      });
      setSelected(sel);
    } catch (err) {
      console.error("loadAccruals error:", err);
    } finally {
      setLoading(false);
    }
  }, [year, deptId, allEmployees]);

  useEffect(() => { loadAccruals(); }, [loadAccruals]);

  // ── Auto-fill all months for all non-posted employees ────────────────────
  const handleAutoFill = () => {

    if (checkedLTList.length === 0) {
      showToast({
        icon: "error",
        title: "Please select leave type",
      });
      return;
    }

    setRows((prev) =>
      prev.map((row) => {

        if (row.is_posted) return row;

        const months = { ...row.months };

        for (let m = 1; m <= 12; m++) {

          if (!months[m]?.is_posted) {

            let totalMonthRate = 0;

            checkedLTList.forEach((lt) => {
              totalMonthRate += parseFloat(lt.rate) || 0;
            });

            months[m] = {
              ...months[m],
              accrual_id: months[m]?.accrual_id || null,
              days: totalMonthRate.toFixed(2),
              is_posted: false,
            };
          }
        }

        return { ...row, months };

      })
    );
  };

  // ── Update a single cell ─────────────────────────────────────────────────
  const handleCellChange = (empId, monthNum, value) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.employee_id !== empId) return row;
        return {
          ...row,
          months: {
            ...row.months,
            [monthNum]: {
              ...row.months[monthNum],
              accrual_id: row.months[monthNum]?.accrual_id || null,
              days: value,
              is_posted: row.months[monthNum]?.is_posted || false,
            },
          },
        };
      })
    );
  };

  // ── Update carry forward for a row ───────────────────────────────────────
  const handleCFChange = (empId, value) => {
    setRows((prev) =>
      prev.map((r) =>
        r.employee_id === empId ? { ...r, carry_forward: value } : r
      )
    );
  };

  // ── Compute total balance = sum(months) + carry_forward ──────────────────
  const getTotalBalance = (row) => {
    const monthSum = Object.values(row.months).reduce(
      (s, m) => s + (parseFloat(m.days) || 0), 0
    );
    const cf = parseFloat(row.carry_forward) || 0;
    return (monthSum + cf).toFixed(2);
  };

  // ── Save (bulk upsert) ────────────────────────────────────────────────────
  const handleSave = async () => {
    const selectedRows = rows.filter((r) => selected[r.employee_id] && !r.is_posted);
    if (selectedRows.length === 0) {
      showToast({ icon: "error", title: "No employees selected" });
      return;
    }
    setSaving(true);
    try {
      const payload = [];
      selectedRows.forEach((row) => {
        for (let m = 1; m <= 12; m++) {
          const cell = row.months[m];
          if (!cell?.days) continue;
          checkedLTList.forEach(({ ltId, rate }) => {

            payload.push({
              accrual_id: cell.accrual_id || null,
              employee_id: row.employee_id,
              leave_type_id: ltId,
              financial_year: year,
              accrual_month: m,
              accrual_days: parseFloat(rate) || 0,
              carry_forward:
                m === 1
                  ? parseFloat(row.carry_forward) || 0
                  : 0,
              is_posted: 0,
            });

          });
        }
      });

      await bulkSaveAccrual(payload);
      showToast({ icon: "success", title: "Accruals saved successfully" });
      await loadAccruals();
    } catch (err) {
      console.error("Save error:", err);
      showToast({ icon: "error", title: "Save failed" });
    } finally {
      setSaving(false);
    }
  };

  // ── Post (finalize) ───────────────────────────────────────────────────────
  const handlePost = async () => {
    const selectedRows = rows.filter((r) => selected[r.employee_id] && !r.is_posted);
    if (selectedRows.length === 0) {
      showToast({ icon: "error", title: "No employees selected to post" });
      return;
    }

    // Collect all accrual_ids for selected employees
    const accrualIds = [];
    selectedRows.forEach((row) => {
      Object.values(row.months).forEach((cell) => {
        if (cell?.accrual_id) accrualIds.push(cell.accrual_id);
      });
    });

    if (accrualIds.length === 0) {
      showToast({ icon: "error", title: "Please save first before posting" });
      return;
    }

    setPosting(true);
    try {
      await postAccruals({
        accrual_ids: accrualIds,
        financial_year: year,
      });
      showToast({ icon: "success", title: `${selectedRows.length} employees posted & balance updated` });
      await loadAccruals();
    } catch (err) {
      console.error("Post error:", err);
      showToast({ icon: "error", title: "Post failed" });
    } finally {
      setPosting(false);
    }
  };

  // ── Select / Deselect ────────────────────────────────────────────────────
  const toggleSelect = (empId) =>
    setSelected((p) => ({ ...p, [empId]: !p[empId] }));

  const toggleSelectAll = () => {
    const nonPosted = rows.filter((r) => !r.is_posted);
    const allSel = nonPosted.every((r) => selected[r.employee_id]);
    const next = {};
    nonPosted.forEach((r) => { next[r.employee_id] = !allSel; });
    setSelected(next);
  };

  // ── Stats ────────────────────────────────────────────────────────────────
  const selectedCount = rows.filter((r) => selected[r.employee_id]).length;
  const draftCount = rows.filter((r) => !r.is_posted).length;
  const postedCount = rows.filter((r) => r.is_posted).length;
  const totalAccrued = rows
    .filter((r) => !r.is_posted)
    .reduce((s, r) => {
      return s + Object.values(r.months).reduce(
        (ms, m) => ms + (parseFloat(m?.days) || 0), 0
      );
    }, 0).toFixed(1);


  return (
    <div className="h-full flex flex-col overflow-hidden bg-slate-50">

      {/* ── Top bar ── */}
      <div className="shrink-0 bg-white border-b border-slate-200
                      px-5 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-[15px] font-medium text-slate-800">
            Leave Accrual &amp; Carry Forward
          </h1>

        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full text-[11px] font-medium
                           bg-amber-50 text-amber-700 border border-amber-200">
            {draftCount} draft
          </span>
          <span className="px-2.5 py-1 rounded-full text-[11px] font-medium
                           bg-green-50 text-green-700 border border-green-200">
            {postedCount} posted
          </span>
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div className="shrink-0 bg-white border-b border-slate-200
                      px-5 py-2.5 flex items-end gap-4 flex-wrap">

        {/* Year */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">
            Year
          </span>
          <ERPAutocomplete
            options={YEAR_OPTIONS}
            value={year}
            onChange={setYear}
            className="h-[32px] w-[90px] px-2 text-[12px] border border-slate-200
                       rounded-md bg-white text-slate-700 outline-none
                       focus:border-blue-300"
          />
        </div>

        {/* Department */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">
            Department
          </span>
          <ERPAutocomplete
            options={deptNames}
            value={deptName}
            onChange={handleDeptChange}
            className="h-[32px] w-[180px] px-2 text-[12px] border border-slate-200
                       rounded-md bg-white text-slate-700 outline-none
                       focus:border-blue-300"
          />
        </div>

        {/* Leave Types dropdown */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between" style={{ minWidth: 220 }}>
            <span className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">
              Leave Types
            </span>
            {totalRate > 0 && (
              <span className="text-[10px] font-medium text-blue-700">
                {totalRate} days/mo total
              </span>
            )}
          </div>
          <LeaveTypeDropdown
            allLeaveTypes={allLeaveTypes}
            selectedLTs={selectedLTs}
            onToggle={toggleLT}
            onRateChange={handleRateChange}
          />
        </div>

        <div className="flex-1" />

        {/* Auto-fill */}
        <button
          onClick={handleAutoFill}
          className="h-[32px] px-4 rounded-md text-[12px] font-medium
                     bg-slate-700 text-white hover:bg-slate-800
                     transition-colors flex items-center gap-1.5"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 6h8M6 2l4 4-4 4" stroke="white" strokeWidth="1.3"
              strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Auto-fill &amp; calculate
        </button>
      </div>

      {/* ── Grid ── */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-48
                          text-[13px] text-slate-400">
            Loading...
          </div>
        ) : (
          <div className="min-w-[900px]">
            <table className="w-full border-collapse text-[12px]">
              <thead className="sticky top-0 z-10">
                <tr className="bg-slate-50 border-b border-slate-200">
                  {/* Checkbox */}
                  <th className="w-8 px-3 py-2 border-r border-slate-200">
                    <input
                      type="checkbox"
                      checked={
                        rows.filter((r) => !r.is_posted).length > 0 &&
                        rows.filter((r) => !r.is_posted).every((r) => selected[r.employee_id])
                      }
                      onChange={toggleSelectAll}
                      className="w-3.5 h-3.5 accent-blue-600 cursor-pointer"
                    />
                  </th>
                  {/* Employee */}
                  <th className="text-left px-3 py-2 font-medium text-slate-500
                                 border-r border-slate-200 w-[150px] text-[11px]
                                 uppercase tracking-wide">
                    Employee
                  </th>
                  {/* 12 months */}
                  {MONTHS.map((m, i) => (
                    <th key={m}
                      className={`px-1 py-2 text-center font-medium text-[11px]
                                  border-r border-slate-200 w-[52px]
                                  ${i === new Date().getMonth()
                          ? "bg-blue-50 text-blue-700"
                          : "text-slate-500"}`}>
                      {m}
                    </th>
                  ))}
                  {/* Carry forward */}
                  <th className="px-2 py-2 text-center font-medium text-[11px]
                                 bg-blue-50 text-blue-700 border-r border-slate-200
                                 w-[68px] uppercase tracking-wide">
                    Carry fwd
                  </th>
                  {/* Total */}
                  <th className="px-2 py-2 text-center font-medium text-[11px]
                                 bg-green-50 text-green-700 border-r border-slate-200
                                 w-[68px] uppercase tracking-wide">
                    Total bal.
                  </th>
                  {/* Status */}
                  <th className="px-2 py-2 text-center font-medium text-[11px]
                                 text-slate-500 w-[68px] uppercase tracking-wide">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {rows.map((row, rowIdx) => {
                  const { bg, text } = AVATAR_COLORS[rowIdx % AVATAR_COLORS.length];
                  const isPosted = row.is_posted;
                  const isSel = !!selected[row.employee_id];
                  const total = getTotalBalance(row);

                  return (
                    <tr
                      key={row.employee_id}
                      className={`border-b border-slate-100
                        ${isPosted ? "opacity-60" : ""}
                        ${isSel && !isPosted ? "bg-blue-50/30" : "hover:bg-slate-50"}`}
                    >
                      {/* Checkbox */}
                      <td className="px-3 py-1.5 border-r border-slate-100 text-center">
                        <input
                          type="checkbox"
                          checked={isSel}
                          disabled={isPosted}
                          onChange={() => toggleSelect(row.employee_id)}
                          className="w-3.5 h-3.5 accent-blue-600 cursor-pointer
                                     disabled:cursor-not-allowed"
                        />
                      </td>

                      {/* Employee name */}
                      <td className="px-2 py-1.5 border-r border-slate-100">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-6 h-6 rounded-full flex items-center
                                           justify-center text-[9px] font-medium
                                           shrink-0 ${bg} ${text}`}>
                            {initials(row.employee_name)}
                          </div>
                          <span className="text-[12px] text-slate-700 font-medium
                                           truncate max-w-[110px]">
                            {row.employee_name}
                          </span>
                        </div>
                      </td>

                      {/* 12 month cells */}
                      {Array.from({ length: 12 }, (_, i) => {
                        const mNum = i + 1;
                        const cell = row.months[mNum];
                        const val = cell?.days || "";
                        const cellPosted = cell?.is_posted || isPosted;
                        const isCurrent = mNum === new Date().getMonth() + 1;

                        return (
                          <td key={mNum}
                            className={`px-1 py-1.5 border-r border-slate-100 text-center
                              ${isCurrent ? "bg-blue-50/20" : ""}`}>
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              value={val}
                              disabled={cellPosted}
                              onChange={(e) =>
                                handleCellChange(row.employee_id, mNum, e.target.value)
                              }
                              className={`w-[44px] h-[24px] text-center text-[12px]
                                          rounded border outline-none transition-colors
                                          ${cellPosted
                                  ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed"
                                  : val
                                    ? "bg-green-50 border-green-300 text-green-800 focus:border-green-400"
                                    : "bg-white border-slate-200 text-slate-600 focus:border-blue-300"}`}
                            />
                          </td>
                        );
                      })}

                      {/* Carry forward */}
                      <td className="px-1 py-1.5 border-r border-slate-100 text-center
                                     bg-blue-50/30">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={row.carry_forward}
                          disabled={isPosted}
                          onChange={(e) =>
                            handleCFChange(row.employee_id, e.target.value)
                          }
                          className={`w-[52px] h-[24px] text-center text-[12px]
                                      rounded border outline-none
                                      ${isPosted
                              ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed"
                              : "bg-blue-50 border-blue-300 text-blue-800 focus:border-blue-400"}`}
                        />
                      </td>

                      {/* Total balance */}
                      <td className="px-2 py-1.5 border-r border-slate-100 text-center
                                     bg-green-50/30">
                        <span className="text-[13px] font-medium text-green-800">
                          {total}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-2 py-1.5 text-center">
                        {isPosted ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px]
                                           font-medium bg-green-50 text-green-700
                                           border border-green-200">
                            Posted
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px]
                                           font-medium bg-amber-50 text-amber-700
                                           border border-amber-200">
                            Draft
                          </span>
                        )}
                      </td>
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

       

      {/* ── Action bar ── */}
      <div className="shrink-0 bg-white border-t border-slate-200
                      px-5 py-2.5 flex items-center justify-between">
        <span className="text-[12px] text-slate-500">
          {selectedCount} employee{selectedCount !== 1 ? "s" : ""} selected
          {checkedLTList.length > 0
            ? ` · ${checkedLTList.map((l) => l.name).join(", ")} · ${year}`
            : ""}
        </span>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={saving || selectedCount === 0}
            className="h-[30px] px-4 rounded-md text-[12px] font-medium
                       bg-slate-100 text-slate-700 border border-slate-300
                       hover:bg-slate-200 disabled:opacity-50 transition-colors
                       flex items-center gap-1.5"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 6.5l2.5 2.5 5.5-5.5" stroke="#374151"
                strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {saving ? "Saving..." : "Save draft"}
          </button>

          <button
            onClick={handlePost}
            disabled={posting || selectedCount === 0}
            className="h-[30px] px-4 rounded-md text-[12px] font-medium
                       bg-green-700 text-white hover:bg-green-800
                       disabled:opacity-50 transition-colors
                       flex items-center gap-1.5"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 6.5l2.5 2.5 5.5-5.5" stroke="white"
                strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {posting ? "Posting..." : `Post & update balance (${selectedCount})`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeaveAccrualBulk;