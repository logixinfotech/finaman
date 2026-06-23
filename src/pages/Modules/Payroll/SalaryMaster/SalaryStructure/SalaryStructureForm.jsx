
import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import ERPHeader from "../../../../../components/Reusable/form/HeaderForm";
import ERPFooter from "../../../../../components/Reusable/form/FooterForm";
import ERPAutocomplete from "../../../../../components/Reusable/input/ERPAutocomplete";
import ERPDateInput from "../../../../../components/Reusable/input/Date";
import { confirmDelete, showToast } from "../../../../../components/Reusable/alert";

const FONT = `'Inter', 'Tahoma', system-ui, sans-serif`;
const requiredFields = ["employee_id", "effective_from"];
const fmt = (val) => {
  if (val === null || val === undefined || val === "") return "0.00";
  const n = parseFloat(val);
  if (isNaN(n)) return "0.00";
  return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// ── Amount input ────────────────────────────────────────────────
const AmountInput = ({ value, onChange, disabled, placeholder, className, onKeyDown, name, ...rest }) => {
  const [focused, setFocused] = useState(false);

  const display = focused
    ? (value ?? "")
    : (value !== "" && value !== null && value !== undefined && !isNaN(parseFloat(value)))
      ? fmt(value)
      : "";

  return (
    <input
      type="text"
      inputMode="decimal"
      name={name}
      value={display}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onKeyDown={onKeyDown}
      onChange={(e) => {
        const cleaned = e.target.value.replace(/[^0-9.]/g, "");
        const parts = cleaned.split(".");
        const safe = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join("")}` : cleaned;
        const decIdx = safe.indexOf(".");
        const trimmed = decIdx !== -1 ? safe.slice(0, decIdx + 3) : safe;
        onChange(trimmed);
      }}
      {...rest}
    />
  );
};

// ── Status pill ─────────────────────────────────────────────────
const STATUS_STYLES = {
  Active: { bg: "bg-[#EAF3DE]", text: "text-[#27500A]" },
  Inactive: { bg: "bg-[#F1EFE8]", text: "text-[#444441]" },
  Pending: { bg: "bg-[#FAEEDA]", text: "text-[#633806]" },
  Created: { bg: "bg-[#EAF3DE]", text: "text-[#27500A]" },
};

const StatusPill = ({ status }) => {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.Inactive;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${s.bg} ${s.text}`}>
      {status ?? "—"}
    </span>
  );
};

// ── Sidebar pieces ──────────────────────────────────────────────
const StatChip = ({ label, value, bg, color }) => (
  <div className={`flex-1 text-center py-1.5 px-1 rounded-lg ${bg}`}>
    <div className={`text-[16px] font-semibold leading-none ${color}`}>{value}</div>
    <div className={`text-[10px] mt-1 opacity-70 ${color}`}>{label}</div>
  </div>
);

const TabBtn = ({ label, active, badge, onClick }) => (
  <button
    onClick={onClick}
    className={`px-2.5 py-1.5 text-[12px] font-medium border-b-2 whitespace-nowrap transition-all
      ${active ? "border-[#0C447C] text-[#0C447C]" : "border-transparent text-slate-500"}`}
  >
    {label}
    {badge != null && badge > 0 && (
      <span className="ml-1 bg-[#FAEEDA] text-[#633806] text-[10px] px-1.5 py-0.5 rounded-full">
        {badge}
      </span>
    )}
  </button>
);

const EmployeeListCard = ({ record, isActive, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all duration-100 mb-1.5
      ${disabled ? "opacity-50 cursor-not-allowed" : ""}
      ${isActive
        ? "border-[#185FA5] bg-[#E6F1FB]"
        : "border-slate-200 bg-white hover:border-[#85B7EB] hover:bg-[#E6F1FB]/40 active:bg-[#E6F1FB]/60"
      }`}
  >
    <div className="flex items-center justify-between mb-0.5 gap-2">
      <span className={`text-[13px] font-medium truncate ${disabled ? "text-slate-400" : "text-slate-800"}`}>
        {record.Led_name}
      </span>
      <StatusPill status={record._status} />
    </div>
    <div className={`text-[11px] truncate ${disabled ? "text-slate-300" : "text-slate-500"}`}>
      ID: {record.Actled_id} {record.Op_id1 ? `· Grade ${record.Op_id1}` : ""}
    </div>
  </button>
);

// ── Section wrapper ─────────────────────────────────────────────
const Section = ({ title, extra, children, noPad = false }) => (
  <div className="bg-white border border-slate-200 rounded-xl mb-3">
    {title && (
      <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-100">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{title}</span>
        {extra}
      </div>
    )}
    {noPad ? children : <div className="p-3">{children}</div>}
  </div>
);

// ── Field wrapper ───────────────────────────────────────────────
const Field = ({ label, required, error, children, className = "" }) => (
  <div className={`flex flex-col gap-1 ${className}`}>
    <label className="text-[11px] text-slate-500 font-medium">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
    {error && <span className="text-[10px] text-red-500">{error}</span>}
  </div>
);
const getOffsetTop = (el) => {
  let top = 0;
  let node = el;
  while (node) {
    top += node.offsetTop || 0;
    node = node.offsetParent;
  }
  return top;
};

// ── Main component ──────────────────────────────────────────────
const SalaryStructureForm = ({
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
  rights,
  activeTab = "entry",
  onTabChange = () => { },
  formData,
  setFormData,
  employees = [],
  templates = [],
  incomeHeads = [],
  deductionHeads = [],
  structuresList = [],
  isEmbedded,
  onSidebarViewPick,
}) => {
  const [errors, setErrors] = useState({});
  const [activeHeadIds, setActiveHeadIds] = useState({});
  const [currentTemplate, setCurrentTemplate] = useState(null);
  const [calculatedValues, setCalculatedValues] = useState({
    income: {}, deduction: {},
    totalIncome: 0, totalDeduction: 0, netSalary: 0,
  });

  const [manualIncome, setManualIncome] = useState({});
  const [manualDeduction, setManualDeduction] = useState({});
  const [sidebarTab, setSidebarTab] = useState("Pending");
  const [mobileView, setMobileView] = useState("list");

  const isViewMode = mode === "view";
  const isAddMode = mode === "add";
  const isEditMode = mode === "edit";
  const firstInputRef = useRef(null);

  const isManualMode = (formData.type || "Manual") === "Manual";
  const employeesWithStatus = useMemo(() => {
    const haveStructure = new Set(structuresList.map(s => String(s.employee_id)));
    return employees.map(e => ({
      ...e,
      _status: haveStructure.has(String(e.Actled_id)) ? "Created" : "Pending",
    }));
  }, [employees, structuresList]);

  const pendingEmp = employeesWithStatus.filter(e => e._status === "Pending").length;
  const createdEmp = employeesWithStatus.filter(e => e._status === "Created").length;
  const totalEmp = employeesWithStatus.length;

  const filteredEmployees = useMemo(() => {
    if (sidebarTab === "All") return employeesWithStatus;
    return employeesWithStatus.filter(e => e._status === sidebarTab);
  }, [employeesWithStatus, sidebarTab]);


  useEffect(() => {
    if (!isViewMode) {
      const timer = setTimeout(() => {
        if (firstInputRef.current) firstInputRef.current.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isViewMode, isAddMode, isEditMode]);
  const handleChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => { const e = { ...prev }; delete e[field]; return e; });
    }
  }, [errors, setFormData]);

  useEffect(() => {
    if (!formData.type) {
      setFormData(prev => ({ ...prev, type: "Manual" }));
    }
  }, [formData.type, setFormData]);
  useEffect(() => {
    if (incomeHeads.length === 0 && deductionHeads.length === 0) return;
    setActiveHeadIds(prev => {
      const next = { ...prev };
      let changed = false;
      incomeHeads.forEach(h => {
        if (next[h.income_head_id] === undefined) {
          next[h.income_head_id] = true;
          changed = true;
        }
      });
      deductionHeads.forEach(h => {
        if (next[h.deduction_head_id] === undefined) {
          next[h.deduction_head_id] = true;
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [incomeHeads, deductionHeads]);

  const handleEmployeeChange = useCallback((empName) => {
    const emp = employees.find(e => e.Led_name?.trim() === empName?.trim());
    if (emp) {
      const activeTemplate = templates.find(t => String(t.grade) === String(emp.Op_id1 ?? emp.grade_id ?? emp.grade) && t.status === "Active");
      setFormData(prev => ({
        ...prev,
        employee_name: empName,
        employee_id: emp.Actled_id,
        grade: emp.Op_id1 ?? emp.grade_id ?? emp.grade ?? "",
        type: activeTemplate ? prev.type || "Grade Wise" : "Manual",
      }));
      if (emp.Op_id1 && !activeTemplate) {
        showToast({
          icon: "warning",
          title: "No Active Template",
          message: `The selected employee does not have an active salary template for grade ${emp.Op_id1}. Please create the salary structure manually.`,
        });
      }
    } else {
      setFormData(prev => ({ ...prev, employee_name: empName, employee_id: "", grade: "" }));
    }
  }, [employees, templates, setFormData]);

  const handleTypeChange = useCallback((val) => {
    handleChange("type", val);
    if (val === "Manual") {
      setManualIncome(prev => ({ ...prev, ...calculatedValues.income }));
      setManualDeduction(prev => ({ ...prev, ...calculatedValues.deduction }));
    }
  }, [handleChange, calculatedValues]);

  useEffect(() => {
    if (!formData.grade) { setCurrentTemplate(null); return; }
    const tpl = templates.find(t => String(t.grade) === String(formData.grade) && t.status === "Active");
    if (tpl) {
      const incomeFormulas = {};
      (tpl.incomeHeads || []).forEach(c => {
        const id = c.income_head_id || c.head_id;
        incomeFormulas[id] = { formula_type: c.formula_type, percentage: parseFloat(c.percentage) || 0 };
      });
      const deductionFormulas = {};
      (tpl.deductionHeads || []).forEach(c => {
        const id = c.deduction_head_id || c.head_id;
        deductionFormulas[id] = { formula_type: c.formula_type, percentage: parseFloat(c.percentage) || 0 };
      });
      setCurrentTemplate({
        salary_template_id: tpl.salary_template_id,
        grade: tpl.grade,
        incomeFormulas, deductionFormulas,
      });
      handleChange("salary_template_id", tpl.salary_template_id);
    } else {
      setCurrentTemplate(null);
    }
  }, [formData.grade, templates, handleChange]);

  useEffect(() => {
    
    if (isManualMode || !currentTemplate) return;

    const ctcYearly = parseFloat(formData.ctc) || 0;
    const ctcMonthly = ctcYearly / 12;
    const calcInc = {}, calcDed = {};
    let preBal = 0;
    let basicAmount = 0;

    // Pass 1: % of CTC and Fixed
    incomeHeads.forEach(head => {
      const f = currentTemplate.incomeFormulas[head.income_head_id];
      if (!f || !activeHeadIds[head.income_head_id] || f.formula_type === "Balancing") return;
      let val = 0;
      if (f.formula_type === "% of CTC") val = (ctcMonthly * f.percentage) / 100;
      if (f.formula_type === "Fixed") val = f.percentage;
      if (head.name?.toLowerCase().includes("basic")) basicAmount = val;
      calcInc[head.income_head_id] = val;
    });

    // Pass 2: % of Basic
    incomeHeads.forEach(head => {
      const f = currentTemplate.incomeFormulas[head.income_head_id];
      if (!f || !activeHeadIds[head.income_head_id]) return;
      if (f.formula_type === "% of Basic") {
        calcInc[head.income_head_id] = (basicAmount * f.percentage) / 100;
      }
    });
 
    Object.values(calcInc).forEach(v => { preBal += v; }); 
    let totalIncome = preBal;
    incomeHeads.forEach(head => {
      const f = currentTemplate.incomeFormulas[head.income_head_id];
      if (!f || !activeHeadIds[head.income_head_id]) return;
      if (f.formula_type === "Balancing") {
        const val = Math.max(0, ctcMonthly - preBal);
        calcInc[head.income_head_id] = val;
        totalIncome = preBal + val;   // exact, no double-count
      }
    });

    let totalDeduction = 0;
    deductionHeads.forEach(head => {
      const f = currentTemplate.deductionFormulas[head.deduction_head_id];
      if (!f || !activeHeadIds[head.deduction_head_id]) return;
      let val = 0;
      if (f.formula_type === "% of Basic") val = (basicAmount * f.percentage) / 100;
      if (f.formula_type === "Fixed") val = f.percentage;
      if (f.formula_type === "% of Gross") val = (totalIncome * f.percentage) / 100;
      calcDed[head.deduction_head_id] = val;
      totalDeduction += val;
    });

    setCalculatedValues({
      income: calcInc, deduction: calcDed,
      totalIncome, totalDeduction, netSalary: totalIncome - totalDeduction,
    });

    const grossNum = parseFloat(totalIncome.toFixed(2));
    setFormData(prev => {
      const prevGross = parseFloat(prev.gross_monthly) || 0;
      return prevGross === grossNum ? prev : { ...prev, gross_monthly: String(grossNum) };
    });
  }, [formData.ctc, currentTemplate, activeHeadIds, isManualMode, incomeHeads, deductionHeads, setFormData]);

  useEffect(() => {
    if (!isManualMode) return;

    let totalInc = 0, totalDed = 0;
    incomeHeads.forEach(h => {
      if (activeHeadIds[h.income_head_id]) totalInc += parseFloat(manualIncome[h.income_head_id] || 0);
    });
    deductionHeads.forEach(h => {
      if (activeHeadIds[h.deduction_head_id]) totalDed += parseFloat(manualDeduction[h.deduction_head_id] || 0);
    });

    setCalculatedValues({
      income: manualIncome, deduction: manualDeduction,
      totalIncome: totalInc, totalDeduction: totalDed, netSalary: totalInc - totalDed,
    });

    const grossNum = parseFloat(totalInc.toFixed(2));
    const ctcNum = parseFloat((totalInc * 12).toFixed(2));

    setFormData(prev => {
      const prevGross = parseFloat(prev.gross_monthly) || 0;
      const prevCtc = parseFloat(prev.ctc) || 0;
      if (prevGross === grossNum && prevCtc === ctcNum) return prev;
      return {
        ...prev,
        ...(prevGross !== grossNum ? { gross_monthly: String(grossNum) } : {}),
        ...(prevCtc !== ctcNum ? { ctc: String(ctcNum) } : {}),
      };
    });
  }, [manualIncome, manualDeduction, activeHeadIds, isManualMode, incomeHeads, deductionHeads, setFormData]);

useEffect(() => {
  if (!formData.incomeLines && !formData.deductionLines) return;

  const activeSeed = {};

  if (formData.incomeLines) {
    const incomeSeed = {};
    formData.incomeLines.forEach(l => {
      incomeSeed[l.head_id] = String(l.amount ?? "");
      activeSeed[l.head_id] = l.is_active === 1 || l.is_active === true;
    });
    setManualIncome(incomeSeed);
  }

  if (formData.deductionLines) {
    const deductionSeed = {};
    formData.deductionLines.forEach(l => {
      deductionSeed[l.head_id] = String(l.amount ?? "");
      activeSeed[l.head_id] = l.is_active === 1 || l.is_active === true;
    });
    setManualDeduction(deductionSeed);
  }

  if (Object.keys(activeSeed).length > 0) {
    setActiveHeadIds(activeSeed);
  }

}, [formData.salary_structure_id, formData.employee_id]);

  const handleManualChange = (type, id, value) => {
    if (type === "income") setManualIncome(prev => ({ ...prev, [id]: value }));
    else setManualDeduction(prev => ({ ...prev, [id]: value }));
  };

  const toggleHead = (head_id) => {
    if (isViewMode) return;
    setActiveHeadIds(prev => ({ ...prev, [head_id]: !prev[head_id] }));
  };
  const handleValidateAndSave = useCallback(() => {
    if (isViewMode || saving) return;

    const newErrors = {};
    requiredFields.forEach(field => {
      if (!formData[field]) newErrors[field] = "Required";
    });
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const incomeLines = incomeHeads.map(h => {
      const f = currentTemplate?.incomeFormulas[h.income_head_id];
      return {
        head_id: h.income_head_id,
        head_name: h.name,
        formula_type: isManualMode ? null : (f?.formula_type || null),
        percentage: isManualMode ? null : (f?.percentage ?? null),
        amount: parseFloat(
          isManualMode
            ? (manualIncome[h.income_head_id] || 0)
            : (calculatedValues.income[h.income_head_id] || 0)
        ),
        is_active: !!activeHeadIds[h.income_head_id],
      };
    });

    const deductionLines = deductionHeads.map(h => {
      const f = currentTemplate?.deductionFormulas[h.deduction_head_id];
      return {
        head_id: h.deduction_head_id,
        head_name: h.name,
        formula_type: isManualMode ? null : (f?.formula_type || null),
        percentage: isManualMode ? null : (f?.percentage ?? null),
        amount: parseFloat(
          isManualMode
            ? (manualDeduction[h.deduction_head_id] || 0)
            : (calculatedValues.deduction[h.deduction_head_id] || 0)
        ),
        is_active: !!activeHeadIds[h.deduction_head_id],
      };
    });

    onSave && onSave({
      salary_structure_id: formData.salary_structure_id,
      employee_id: formData.employee_id,
      employee_name: formData.employee_name,
      grade: formData.grade,
      type: formData.type || "Manual",
      salary_template_id: currentTemplate?.salary_template_id || null,
      effective_from: formData.effective_from,
      ctc: parseFloat(formData.ctc) || 0,
      gross_monthly: calculatedValues.totalIncome,
      total_income: calculatedValues.totalIncome,
      total_deduction: calculatedValues.totalDeduction,
      net_salary: calculatedValues.netSalary,
      revision_reason: formData.revision_reason || null,
      arrear_applicable: formData.arrear_applicable || "No",
      status: formData.status || "Active",
      incomeLines,
      deductionLines,
    });
  }, [
    isViewMode, saving, formData, currentTemplate, isManualMode, onSave,
    manualIncome, manualDeduction, calculatedValues, activeHeadIds,
    incomeHeads, deductionHeads,
  ]);

  const handleKeyDown = useCallback((e) => {
    if (isViewMode) return;
    const container = document.getElementById("salary-form-container");
    if (!container) return;
    const elements = Array.from(
      container.querySelectorAll("[data-auto], input, textarea, select, button")
    ).filter(el => !el.disabled && el.offsetParent !== null)
      .sort((a, b) => {
        const aTop = getOffsetTop(a), bTop = getOffsetTop(b);
        if (Math.abs(aTop - bTop) > 18) return aTop - bTop;
        return (a.offsetLeft || 0) - (b.offsetLeft || 0);
      });
    const index = elements.indexOf(e.target);
    if (e.key === "Enter") {
      e.preventDefault(); e.stopPropagation();
      if (index < elements.length - 1) elements[index + 1].focus();
      else (document.querySelector("#save") || document.querySelector("#update"))?.focus();
    }
  }, [isViewMode]);
const onSidebarPick = async (emp) => {
  if (isViewMode) {
    onSidebarViewPick && onSidebarViewPick(emp);
    setMobileView("detail");
    return;
  }

  if (isAddMode || isEditMode) {
    if (formData.employee_id && formData.employee_id !== emp.Actled_id) {
      const confirmed = await confirmDelete({
        title: "Change Employee",
        message: "Changing the employee will clear the current form data. Are you sure?",
      });
      if (!confirmed) return;
    }
  }

  handleEmployeeChange(emp.Led_name);
  setMobileView("detail");
};
  const formulaHint = (headId, type) => {
    const map = type === "income"
      ? currentTemplate?.incomeFormulas
      : currentTemplate?.deductionFormulas;
    const f = map?.[headId];
    if (!f) return "";
    if (f.formula_type === "Fixed") return `₹${fmt(f.percentage)} fixed`;
    if (f.formula_type === "Balancing") return "Balancing figure";
    if (f.formula_type === "% of CTC") return `${f.percentage}% of CTC`;
    if (f.formula_type === "% of Basic") return `${f.percentage}% of Basic`;
    if (f.formula_type === "% of Gross") return `${f.percentage}% of Gross`;
    return f.formula_type || "";
  };
  const disableSidebar = isAddMode || isEditMode;
  const sidebar = ({ disableSidebar }) => (
    <div className="flex flex-col bg-white h-full overflow-hidden">
      {!isEmbedded && (<> <div className="px-3 pt-3 pb-2 border-b border-slate-100">
        <div className="flex gap-1.5 mt-2">
          <StatChip label="Pend" value={pendingEmp} bg="bg-[#FAEEDA]" color="text-[#633806]" />
          <StatChip label="Created" value={createdEmp} bg="bg-[#EAF3DE]" color="text-[#27500A]" />
          <StatChip label="All" value={totalEmp} bg="bg-[#E6F1FB]" color="text-[#0C447C]" />
        </div>
      </div>

        <div className="flex px-2 border-b border-slate-100 overflow-x-auto no-scrollbar">
          {["Pending", "Created", "All"].map(t => (
            <TabBtn
              key={t} label={t}
              active={sidebarTab === t}
              badge={t === "Pending" ? pendingEmp : null}
              onClick={() => setSidebarTab(t)}
              disabled={disableSidebar}
            />
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-2 no-scrollbar">
          {filteredEmployees.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2 py-10">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
              </svg>
              <span className="text-[12px]">No employees</span>
            </div>
          ) : (
            filteredEmployees.map(emp => (
              <EmployeeListCard
                key={emp.Actled_id}
                record={emp}
                isActive={String(formData.employee_id) === String(emp.Actled_id)}
                onClick={() => onSidebarPick(emp)}
              />
            ))
          )}
        </div>
      </>)}
    </div>

  );
  const renderHeadRow = (head, type) => {
    const id = type === "income" ? head.income_head_id : head.deduction_head_id;
    const isActive = activeHeadIds[id] ?? true;
    const autoVal = (type === "income"
      ? calculatedValues.income[id]
      : calculatedValues.deduction[id]) || 0;
    const manualVal = type === "income" ? manualIncome[id] : manualDeduction[id];
    const hint = formulaHint(id, type);
    const isInc = type === "income";

    return (
      <div
        key={id}
        className={`flex items-center justify-between gap-2 px-3 py-2 border-b border-slate-100 last:border-0
          ${isViewMode ? "cursor-not-allowed" : "hover:bg-slate-50"}`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <input
            data-auto
            type="checkbox"
            checked={isActive}
            disabled={isViewMode}
            onChange={() => toggleHead(id)}
            onKeyDown={handleKeyDown}
            className={`shrink-0 ${isViewMode ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
          />
          <div className="min-w-0 flex-1">
            <div className={`text-[13px] font-medium truncate ${!isActive ? "text-slate-400 line-through" : "text-slate-700"}`}>
              {head.name}
            </div>
            {hint && !isManualMode && (
              <div className="text-[10px] text-slate-400 truncate">{hint}</div>
            )}
          </div>
        </div>

        <div className="shrink-0">
          {isManualMode ? (
            <AmountInput
              value={manualVal ?? ""}
              onChange={(v) => handleManualChange(type, id, v)}
              disabled={!isActive || isViewMode}
              onKeyDown={handleKeyDown}
              placeholder="0.00"
              className={`w-[110px] h-8 px-2 text-[13px] text-right border rounded-md outline-none
                ${isInc ? "focus:border-[#185FA5]" : "focus:border-red-400 text-red-600"}
                ${!isActive || isViewMode
                  ? "bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed"
                  : "bg-white border-slate-200"}`}
            />
          ) : (
            <span className={`inline-block min-w-[110px] text-right text-[13px] font-semibold tabular-nums
              ${isInc ? "text-slate-700" : "text-red-600"} ${!isActive ? "opacity-40" : ""}`}>
              ₹ {fmt(isActive ? autoVal : 0)}
            </span>
          )}
        </div>
      </div>
    );
  };

  // ── Form panel ──────────────────────────────────────────────────
  const formPanel = (
    <div id="salary-form-container" className="p-3 pb-32">
      <Section>
        <div className="flex flex-wrap gap-x-4 gap-y-3">

          {!isEmbedded && (<Field label="Employee" required error={errors.employee_id} className="w-full sm:w-[260px]">
            <ERPAutocomplete
              data-auto
              ref={firstInputRef}
              value={formData.employee_name || ""}
              options={employees.map(e => e.Led_name).filter(Boolean)}
              onChange={handleEmployeeChange}
              disabled={isViewMode || isEditMode}
              onKeyDown={handleKeyDown}
              className={`h-9 px-2.5 text-[13px] border rounded-lg outline-none focus:border-[#378ADD] w-full
                ${errors.employee_id ? "border-red-400 bg-red-50" : "border-slate-200 bg-white"}
                ${isViewMode || isEditMode ? "bg-slate-50 cursor-not-allowed" : ""}`}
            />
          </Field>)}

          <Field label="Type" required className="w-full sm:w-[140px]">
            <ERPAutocomplete
              data-auto
              value={formData.type || "Manual"}
              options={["Manual", "Grade Wise"]}
              onChange={handleTypeChange}
              disabled={isViewMode}
              onKeyDown={handleKeyDown}
              className={`h-9 px-2.5 text-[13px] border rounded-lg outline-none focus:border-[#378ADD] w-full
                ${isViewMode ? "bg-slate-50 cursor-not-allowed border-slate-200" : "border-slate-200 bg-white"}`}
            />
          </Field>

          <Field label="Effective from" required error={errors.effective_from} className="w-full sm:w-[150px]">
            <ERPDateInput
              value={formData.effective_from || ""}
              disabled={isViewMode}
              onChange={(v) => handleChange("effective_from", v)}
              onKeyDown={handleKeyDown}
              className={`h-9 px-2.5 text-[13px] border rounded-lg outline-none focus:border-[#378ADD] w-full
                ${errors.effective_from ? "border-red-400 bg-red-50" : "border-slate-200 bg-white"}
                ${isViewMode ? "bg-slate-50 cursor-not-allowed" : ""}`}
            />
          </Field>

          <Field label={isManualMode ? "CTC (auto) ₹" : "CTC (yearly) ₹"} className="w-[160px]">
            <AmountInput
              value={formData.ctc}
              onChange={(v) => handleChange("ctc", v)}
              disabled={isViewMode || isManualMode}
              onKeyDown={handleKeyDown}
              placeholder="0.00"
              name="ctc"
              className={`h-9 px-2.5 text-[13px] text-right border rounded-lg outline-none focus:border-[#378ADD] w-full tabular-nums
                ${isViewMode || isManualMode ? "bg-slate-50 cursor-not-allowed border-slate-200 text-slate-600" : "border-slate-200 bg-white"}`}
            />
          </Field>

          <Field label="Gross monthly ₹" className="w-[160px]">
            <input
              type="text"
              value={`₹ ${fmt(formData.gross_monthly)}`}
              disabled
              className="h-9 px-2.5 text-[13px] text-right border border-slate-200 rounded-lg bg-slate-50 text-slate-700 w-full tabular-nums font-medium"
            />
          </Field>

          <Field label="Status" className="w-[140px]">
            <div className="flex items-center gap-2 h-9">
              <div
                tabIndex={0}
                data-auto
                onKeyDown={(e) => {
                  handleKeyDown(e);
                  if (!isViewMode && e.key === " ") {
                    e.preventDefault();
                    const cur = formData.status === "Active" ? "Inactive" : "Active";
                    handleChange("status", cur);
                  }
                }}
                onClick={() => {
                  if (!isViewMode) {
                    const cur = (formData.status === "Active" || !formData.status)
                      ? "Inactive"
                      : "Active";
                    handleChange("status", cur);
                  }
                }}
                className={`w-[40px] h-[22px] flex items-center rounded-full p-[2px] cursor-pointer transition-colors shrink-0
                  ${(formData.status === "Active" || !formData.status) ? "bg-[#27500A]" : "bg-slate-400"}`}
              >
                <div className={`h-[18px] w-[18px] bg-white rounded-full transition-transform
                  ${(formData.status === "Active" || !formData.status) ? "translate-x-[18px]" : ""}`} />
              </div>
              <StatusPill status={formData.status || "Active"} />
            </div>
          </Field>

        </div>
      </Section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 bg-[#EAF3DE] border-b border-[#C0DD97]">
            <span className="text-[12px] font-semibold text-[#27500A] uppercase tracking-wider">Earnings · Monthly</span>
            <span className="text-[10px] text-[#27500A] opacity-80">
              {incomeHeads.filter(h => activeHeadIds[h.income_head_id]).length} active
            </span>
          </div>
          <div className="max-h-[280px] overflow-y-auto">
            {incomeHeads.length === 0 ? (
              <div className="px-3 py-8 text-center text-[12px] text-slate-400">No income heads available</div>
            ) : (
              incomeHeads.map(head => renderHeadRow(head, "income"))
            )}
          </div>
          <div className="flex justify-between items-center px-3 py-2 border-t border-slate-100 bg-slate-50">
            <span className="text-[12px] font-semibold text-slate-600">Total income</span>
            <span className="text-[14px] font-semibold text-slate-800 tabular-nums">
              ₹ {fmt(calculatedValues.totalIncome)}
            </span>
          </div>
        </div>

        {/* Deductions */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 bg-[#FCEBEB] border-b border-[#F7C1C1]">
            <span className="text-[12px] font-semibold text-[#791F1F] uppercase tracking-wider">Deductions · Monthly</span>
            <span className="text-[10px] text-[#791F1F] opacity-80">
              {deductionHeads.filter(h => activeHeadIds[h.deduction_head_id]).length} active
            </span>
          </div>
          <div className="max-h-[280px] overflow-y-auto">
            {deductionHeads.length === 0 ? (
              <div className="px-3 py-8 text-center text-[12px] text-slate-400">No deduction heads available</div>
            ) : (
              deductionHeads.map(head => renderHeadRow(head, "deduction"))
            )}
          </div>
          <div className="flex justify-between items-center px-3 py-2 border-t border-slate-100 bg-slate-50">
            <span className="text-[12px] font-semibold text-slate-600">Total deduction</span>
            <span className="text-[14px] font-semibold text-red-600 tabular-nums">
              ₹ {fmt(calculatedValues.totalDeduction)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between bg-gradient-to-r from-[#EAF3DE] to-[#C0DD97]/40 border border-[#C0DD97] rounded-xl px-4 py-3 mb-3">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-[#3B6D11] font-semibold">Net salary</div>
          <div className="text-[11px] text-[#3B6D11]/70">Take-home per month</div>
        </div>
        <div className="text-[22px] font-bold text-[#27500A] tabular-nums">
          ₹ {fmt(calculatedValues.netSalary)}
        </div>
      </div>

      <Section title="Revision & arrear">
        <div className="flex flex-wrap gap-x-4 gap-y-3">
          <Field label="Revision reason" className="w-full sm:w-[220px]">
            <ERPAutocomplete
              data-auto
              value={formData.revision_reason || ""}
              options={["Annual increment", "Promotion", "Correction", "Joining"]}
              onChange={(val) => handleChange("revision_reason", val)}
              disabled={isViewMode}
              onKeyDown={handleKeyDown}
              className={`h-9 px-2.5 text-[13px] border rounded-lg outline-none focus:border-[#378ADD] w-full
                ${isViewMode ? "bg-slate-50 cursor-not-allowed border-slate-200" : "border-slate-200 bg-white"}`}
            />
          </Field>
          <Field label="Arrear applicable" className="w-full sm:w-[120px]">
            <ERPAutocomplete
              data-auto
              value={formData.arrear_applicable || "No"}
              options={["Yes", "No"]}
              onChange={(val) => handleChange("arrear_applicable", val)}
              disabled={isViewMode}
              onKeyDown={handleKeyDown}
              className={`h-9 px-2.5 text-[13px] border rounded-lg outline-none focus:border-[#378ADD] w-full
                ${isViewMode ? "bg-slate-50 cursor-not-allowed border-slate-200" : "border-slate-200 bg-white"}`}
            />
          </Field>
        </div>
      </Section>
    </div>
  );

  const emptyDetail = (
    <div className="flex flex-col items-center justify-center h-full text-slate-300 gap-3 p-6">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="9" y1="13" x2="15" y2="13" />
      </svg>
      <p className="text-[13px]">Select an employee to set salary</p>
    </div>
  );

  const handleMobileBack = () => {
    if ((isEditMode || isAddMode) && formData.employee_id) {
    }
    setMobileView("list");
  };

  const mobileTopBar = (
    <div className="flex items-center gap-1.5 px-3 py-2 bg-white border-b border-slate-200 shrink-0">
      <button
        onClick={handleMobileBack}
        className="flex items-center text-[#185FA5] -ml-1 px-1.5 rounded-md active:bg-slate-100 transition-colors shrink-0"
        style={{ minHeight: "36px" }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <span className="text-[13px] text-slate-700 truncate font-medium flex-1 min-w-0">
        {formData?.employee_name || "New entry"}
      </span>
      {formData?.grade && <span className="text-[11px] text-slate-400 shrink-0">Gr {formData.grade}</span>}
    </div>
  );

  return (
    <div className="w-full mx-auto h-[calc(100vh-120px)] bg-slate-100 flex flex-col" style={{ fontFamily: FONT }}>
      {!isEmbedded && (<ERPHeader
        title="SALARY STRUCTURE ENTRY"
        isAddMode={isAddMode}
        isEditMode={isEditMode}
        isViewMode={isViewMode}
        activeTab={activeTab}
        onTabChange={onTabChange}
        rightContent={`${currentRecord || 1} / ${totalRecords || 1}`}
      />)}

      <div className="flex-1 overflow-hidden">
        {/* DESKTOP */}
        <div className="hidden lg:flex h-full">
          {!isEmbedded && (<div className="w-[280px] border-r border-slate-200 shrink-0">
            {sidebar({ disableSidebar })}
          </div>)}
          <div className="flex-1 overflow-y-auto">
            {formData.employee_id ? formPanel : emptyDetail}
          </div>
        </div>

        {/* MOBILE / TABLET */}
        <div className="flex lg:hidden h-full flex-col">
          {mobileView === "list" ? (
          <div className="h-full">{sidebar({ disableSidebar })}</div>
          ) : (
            <div className="h-full flex flex-col overflow-hidden">
              {mobileTopBar}
              <div className="flex-1 overflow-y-auto">{formPanel}</div>
            </div>
          )}
        </div>
      </div>
      {!isEmbedded && (
        <ERPFooter
          isAddMode={isAddMode}
          isEditMode={isEditMode}
          isViewMode={isViewMode}
          saving={saving}
          handleSubmit={handleValidateAndSave}
          onModify={onModify}
          onDelete={() => onDelete && onDelete(formData)}
          onCancel={onCancel}
          onEditCancel={onEditCancel}
          onNewEntry={onNewEntry}
          rights={rights}
        />)}
    </div>
  );
};

export default SalaryStructureForm;
