import React, { useState, useMemo, useEffect } from "react";
import ERPHeader from "../../../../../components/Reusable/form/HeaderForm";
import ERPAutocomplete from "../../../../../components/Reusable/input/ERPAutocomplete";
import {
  BaseButton,
  DiscardButton,
  ResetButton,
} from "../../../../../components/Reusable/button/ActionButon";
import {
  alertSuccess,
  alertError,
  alertWarning,
} from "../../../../../components/Reusable/alert";
import {
  Calculator,
  ChevronDown,
  ChevronRight,
  Users,
  Search,
  X,
  CheckCircle2,
  Calendar,
  CheckSquare,
  Square,
  Sparkles,
  ArrowRight,
  Lock,
  Unlock,
  Layers,
} from "lucide-react";
import {
  getActledList,
  fetchActiveIncomeHeads,
  fetchActiveDeductionHeads,
  fetchActiveContributionHeads,
  createSalaryStructure,
} from "../../../../../utils/api";

const FONT = `'Inter', 'Tahoma', system-ui, sans-serif`;

const fmt = (n) => Math.round(n || 0).toLocaleString("en-IN");
const dash = (n) => (n && Math.round(n) !== 0 ? fmt(n) : "-");

const capPctValue = (formula, val) => {
  if (formula?.startsWith("PERCENT")) {
    const num = Number(val);
    if (isNaN(num) || num <= 0 || num > 100) return "50";
  }
  return val;
};

const DEFAULT_INCOME_HEADS = [
  { income_head_id: 1, income_name: "Basic Salary", head_code: "BASIC", type: "fixed" },
  { income_head_id: 2, income_name: "House Rent Allowances", head_code: "HRA", type: "fixed" },
  { income_head_id: 3, income_name: "Special Allowances", head_code: "SPA", type: "fixed" },
  { income_head_id: 4, income_name: "Medical Allowance", head_code: "MEDALL", type: "fixed" },
  { income_head_id: 5, income_name: "Transport Allowance", head_code: "TRPALL", type: "variable" },
  { income_head_id: 6, income_name: "Dearness Allowances", head_code: "ABCD", type: "variable" },
];

const DEFAULT_DEDUCTION_HEADS = [
  { deduction_head_id: 1, deduction_name: "ESI", head_code: "ESI", type: "fixed" },
  { deduction_head_id: 2, deduction_name: "EPF", head_code: "EPF", type: "percentage" },
];

const getEmpId = (emp, idx) => {
  if (!emp) return `emp-${idx}`;
  const id =
    emp.employee_id ??
    emp.Employee_id ??
    emp.actled_id ??
    emp.Actled_id ??
    emp.id ??
    emp.employee_code ??
    emp.Employee_code ??
    emp.Led_code;
  return id !== undefined && id !== null && id !== ""
    ? String(id)
    : `emp-${idx}`;
};

export default function SalaryCalculator() {
  const [primarySelect, setPrimarySelect] = useState("ctc");
  const [primaryVal, setPrimaryVal] = useState("0");
  const [lockPrimary, setLockPrimary] = useState(true);

  const [basicVal, setBasicVal] = useState("0");
  const [lockBasic, setLockBasic] = useState(true);

  const [medicalVal, setMedicalVal] = useState("0");
  const [transportVal, setTransportVal] = useState("0");
  const [variableVal, setVariableVal] = useState("0");

  const [pfOn, setPfOn] = useState(true);
  const [esiOn, setEsiOn] = useState(true);
  const [gratOn, setGratOn] = useState(true);
  const [ptOn, setPtOn] = useState(false);
  const [ptVal, setPtVal] = useState("200");


  const [lastEdited, setLastEdited] = useState("basic");
  const [stored, setStored] = useState({ ctc: 0, gross: 0, net: 0 });

  // Assignment Modal & Master Data State
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [incomeHeads, setIncomeHeads] = useState([]);
  const [deductionHeads, setDeductionHeads] = useState([]);
  const [contributionHeads, setContributionHeads] = useState([]);
  const [loadingMaster, setLoadingMaster] = useState(false);

  // Dynamic Head Selection & Configuration State
  const [selectedIncomeHeadIds, setSelectedIncomeHeadIds] = useState(
    () => new Set(DEFAULT_INCOME_HEADS.map((h) => String(h.income_head_id || h.id || h.head_code)))
  );
  const [selectedDeductionHeadIds, setSelectedDeductionHeadIds] = useState(
    () => new Set(DEFAULT_DEDUCTION_HEADS.map((h) => String(h.deduction_head_id || h.id || h.head_code)))
  );
  const [incomeHeadConfigs, setIncomeHeadConfigs] = useState({});
  const [deductionHeadConfigs, setDeductionHeadConfigs] = useState({});

  // Assignment Form State
  const [selectedEmpIds, setSelectedEmpIds] = useState(new Set());
  const [searchEmp, setSearchEmp] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [revisionReason, setRevisionReason] = useState(
    "Assigned from Salary Calculator"
  );
  const [savingAssign, setSavingAssign] = useState(false);

  const HRA_PCT = 50;

  const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

  const getIncomeHeadConfig = (head) => {
    const id = String(head.income_head_id || head.id || head.head_code || head.income_name || head.name);
    const name = (head.income_name || head.name || head.head_code || "").toLowerCase();
    const userCfg = incomeHeadConfigs[id];

    const isBasic = name.includes("basic");
    const isHra = name.includes("hra") || name.includes("house rent");
    const isSpecial = name.includes("special");
    const isMedical = name.includes("medical");
    const isTransport = name.includes("transport") || name.includes("conveyance");

    let formula_type = userCfg?.formula_type;
    if (!formula_type) {
      if (isBasic) formula_type = "FIXED";
      else if (isHra) formula_type = "PERCENT_BASIC";
      else if (isSpecial) formula_type = "BALANCING";
      else formula_type = "FIXED";
    }

    let value = userCfg?.value;
    if (value === undefined || value === null) {
      if (isBasic) value = basicVal;
      else if (isHra) {
        value = formula_type === "FIXED" ? String(Math.round((Number(basicVal) || 0) * 0.5)) : "50";
      } else if (isMedical) value = medicalVal;
      else if (isTransport) value = transportVal;
      else value = "0";
    }

    return { id, name, isBasic, isHra, isSpecial, isMedical, isTransport, formula_type, value };
  };

  // Calculation Engine based on HTML solver with Shortfall Guard and EPF/ESI statutory rules
  const forwardFromBasicAndGross = (bInput, gInput) => {
    const gross = Math.max(0, gInput);
    const headsToUse = incomeHeads.length > 0 ? incomeHeads : DEFAULT_INCOME_HEADS;

    let basic = Math.max(0, bInput);
    const basicHead = headsToUse.find((h) => {
      const name = (h.income_name || h.name || h.head_code || "").toLowerCase();
      return name.includes("basic");
    });
    if (basicHead) {
      const basicCfg = getIncomeHeadConfig(basicHead);
      if (basicCfg.formula_type?.startsWith("PERCENT")) {
        basic = (gross * (Number(basicCfg.value) || 50)) / 100;
      }
    }

    let hra = 0;
    let medical = 0;
    let transport = 0;
    let otherSum = 0;

    headsToUse.forEach((head) => {
      const cfg = getIncomeHeadConfig(head);
      if (!selectedIncomeHeadIds.has(cfg.id)) return;
      if (cfg.isBasic || cfg.formula_type === "BALANCING") return;

      const valNum = Number(cfg.value) || 0;
      let calculatedVal = 0;
      if (cfg.formula_type === "FIXED") {
        calculatedVal = valNum;
      } else if (cfg.formula_type === "PERCENT_CTC") {
        calculatedVal = (gross * valNum) / 100;
      } else if (cfg.formula_type === "PERCENT_BASIC") {
        calculatedVal = (basic * valNum) / 100;
      }

      if (cfg.isHra) hra = calculatedVal;
      else if (cfg.isMedical) medical = calculatedVal;
      else if (cfg.isTransport) transport = calculatedVal;
      else otherSum += calculatedVal;
    });

    let special = 0;
    let _error = null;

    const fixedFloor = basic + hra + medical + transport + otherSum;
    let actualGross = gross;
    if (gross >= fixedFloor) {
      special = gross - fixedFloor;
      actualGross = gross;
    } else {
      // Shortfall Guard: Special Allowance falls below zero
      const deficit = fixedFloor - gross;
      special = 0;
      // Pull deficit out of HRA instead of Basic
      const newHra = Math.max(0, hra - deficit);
      const actualDeduction = hra - newHra;
      actualGross = basic + newHra + medical + transport + otherSum;
      _error = {
        from: "special",
        into: "hra",
        deficit: Math.round(deficit),
        actualDeduction: Math.round(actualDeduction),
      };
    }

    // EPF Rules: Employee PF = MIN(Basic * 12%, 1800), Employer PF = MIN(Basic * 12%, 1800)
    const empPF = pfOn ? Math.min(round2(basic * 0.12), 1800) : 0;
    const erPF = pfOn ? Math.min(round2(basic * 0.12), 1800) : 0;

    // ESI Rules: Employee ESI = Gross * 0.75%, Employer ESI = Gross * 3.25% (Eligible if Gross <= 21000)
    const esiEligible = esiOn && actualGross <= 21000;
    const empESI = esiEligible ? round2(actualGross * 0.0075) : 0;
    const erESI = esiEligible ? round2(actualGross * 0.0325) : 0;

    const gratuity = gratOn ? round2((basic * 15) / 26 / 12) : 0;
    const pt = ptOn ? (actualGross > 15000 ? 200 : Math.max(0, Number(ptVal) || 0)) : 0;

    const totalDeduction = round2(empPF + empESI + pt);
    const takeHome = round2(actualGross - totalDeduction);
    const totalCompanyContribution = round2(erPF + erESI + gratuity);
    const ctcMonthly = round2(actualGross + totalCompanyContribution);

    return {
      basic,
      hra: hra - (_error ? _error.actualDeduction : 0),
      medical,
      transport,
      special,
      gross: actualGross,
      empPF,
      erPF,
      esiEligible,
      empESI,
      erESI,
      gratuity,
      pt,
      totalDeduction,
      takeHome,
      totalCompanyContribution,
      ctcMonthly,
      _error,
    };
  };

  const fromGross = (g) => {
    const b = lockBasic ? Math.max(0, Number(basicVal) || 0) : g * 0.5;
    return forwardFromBasicAndGross(b, g);
  };

  const solveGrossForTarget = (targetMonthly, pickFn) => {
    let lo = 0,
      hi = Math.max(targetMonthly * 3, 1000000);
    for (let i = 0; i < 60; i++) {
      const mid = (lo + hi) / 2;
      if (pickFn(fromGross(mid)) < targetMonthly) lo = mid;
      else hi = mid;
    }
    return fromGross((lo + hi) / 2);
  };

  const variableAnnual = Math.max(0, Number(variableVal) || 0);
  const variableMonthlyEquiv = variableAnnual / 12;

  const result = useMemo(() => {
    if (lockPrimary) {
      if (primarySelect === "ctc") {
        const targetCtc =
          Math.max(0, Number(primaryVal) || 0) - variableMonthlyEquiv;
        return solveGrossForTarget(targetCtc, (r) => r.ctcMonthly);
      } else if (primarySelect === "gross") {
        return fromGross(Math.max(0, Number(primaryVal) || 0));
      } else if (primarySelect === "net") {
        return solveGrossForTarget(
          Math.max(0, Number(primaryVal) || 0),
          (r) => r.takeHome
        );
      }
    }

    if (lastEdited === "basic") {
      const b = Math.max(0, Number(basicVal) || 0);
      return forwardFromBasicAndGross(b, b * 2);
    } else if (lastEdited === "gross") {
      return fromGross(Math.max(0, Number(primaryVal) || 0));
    } else if (lastEdited === "net") {
      return solveGrossForTarget(
        Math.max(0, Number(primaryVal) || 0),
        (r) => r.takeHome
      );
    } else if (lastEdited === "ctc") {
      const targetCtc =
        Math.max(0, Number(primaryVal) || 0) - variableMonthlyEquiv;
      return solveGrossForTarget(targetCtc, (r) => r.ctcMonthly);
    }
    return forwardFromBasicAndGross(0, 0);
  }, [
    lockPrimary,
    primarySelect,
    lastEdited,
    primaryVal,
    basicVal,
    lockBasic,
    medicalVal,
    transportVal,
    variableVal,
    pfOn,
    esiOn,
    gratOn,
    ptOn,
    ptVal,
    variableMonthlyEquiv,
    incomeHeadConfigs,
    incomeHeads,
    selectedIncomeHeadIds,
  ]);

  const ctcWithVariable = result.ctcMonthly + variableMonthlyEquiv;
  const isEsiDisabled = result.gross > 21000;

  // Auto-load master data on mount so Income Head Master mappings are available immediately
  useEffect(() => {
    loadMasterData();
  }, []);

  // Load master data for employee assignment & head mapping
  const loadMasterData = async () => {
    setLoadingMaster(true);
    try {
      const [empRes, incRes, dedRes, conRes] = await Promise.all([
        getActledList(),
        fetchActiveIncomeHeads(),
        fetchActiveDeductionHeads(),
        fetchActiveContributionHeads(),
      ]);

      const empData = empRes?.data || empRes || [];
      const incData = incRes?.data || incRes || [];
      const dedData = dedRes?.data || dedRes || [];
      const conData = conRes?.data || conRes || [];

      // Filter only active & approved employees (matching Employee Master search: 27 records)
      const activeEmpData = (Array.isArray(empData) ? empData : []).filter((e) => {
        const isApproved = e.Approved === undefined || e.Approved === null ? true : Number(e.Approved) === 1;
        const notLeft = !e.Dol && !e.status_leaving_date && !e["Status Leaving Date"];
        const st = (e.status || e.Status || (isApproved ? "Active" : "Inactive")).toString().toLowerCase();
        const isActive = st === "active" || st === "1" || st === "true";
        return isApproved && notLeft && isActive;
      });

      setEmployees(activeEmpData);
      const fetchedIncome = Array.isArray(incData) ? incData : [];
      const fetchedDeductions = Array.isArray(dedData) ? dedData : [];
      setIncomeHeads(fetchedIncome);
      setDeductionHeads(fetchedDeductions);
      setContributionHeads(Array.isArray(conData) ? conData : []);

      if (fetchedIncome.length > 0) {
        setSelectedIncomeHeadIds(
          new Set(fetchedIncome.map((h) => String(h.income_head_id || h.id || h.head_code || h.income_name || h.name)))
        );
      }
      if (fetchedDeductions.length > 0) {
        setSelectedDeductionHeadIds(
          new Set(fetchedDeductions.map((h) => String(h.deduction_head_id || h.id || h.head_code || h.deduction_name || h.name)))
        );
      }
    } catch (err) {
      console.error("Master data load error:", err);
    } finally {
      setLoadingMaster(false);
    }
  };

  const handleOpenAssignModal = () => {
    setShowAssignModal(true);
    setSelectedEmpIds(new Set());
    loadMasterData();
  };

  // Head Mapping Engine - Dynamic based on master data & active selections
  const mappedIncomeLines = useMemo(() => {
    const listToMap =
      Array.isArray(incomeHeads) && incomeHeads.length > 0
        ? incomeHeads
        : DEFAULT_INCOME_HEADS;

    const lines = [];
    listToMap.forEach((head) => {
      const cfg = getIncomeHeadConfig(head);
      if (!selectedIncomeHeadIds.has(cfg.id)) {
        return; // unchecked by user
      }

      const name = head.name || head.income_name || "Income Head";
      let amount = 0;
      let calcType = cfg.formula_type?.startsWith("PERCENT") ? "PERCENTAGE" : "FLAT";
      let pct = Number(cfg.value) || 0;

      if (cfg.isBasic) {
        amount = Math.round(result.basic);
        if (cfg.formula_type?.startsWith("PERCENT")) {
          calcType = "PERCENTAGE";
          pct = Number(cfg.value) || 50;
        } else {
          calcType = "FLAT";
          pct = 0;
        }
      } else if (cfg.isHra) {
        amount = Math.round(result.hra);
        if (cfg.formula_type === "FIXED") {
          calcType = "FLAT";
          pct = 0;
        }
      } else if (cfg.isSpecial) {
        if (cfg.formula_type === "BALANCING") {
          amount = Math.round(result.special);
          calcType = "FLAT";
          pct = 0;
        } else if (cfg.formula_type === "PERCENT_BASIC") {
          amount = Math.round((result.basic * (Number(cfg.value) || 0)) / 100);
          calcType = "PERCENTAGE";
          pct = Number(cfg.value) || 0;
        } else if (cfg.formula_type === "PERCENT_CTC") {
          amount = Math.round((ctcWithVariable * (Number(cfg.value) || 0)) / 100);
          calcType = "PERCENTAGE";
          pct = Number(cfg.value) || 0;
        } else {
          amount = Math.round(Number(cfg.value) || 0);
          calcType = "FLAT";
          pct = 0;
        }
      } else if (cfg.isMedical) {
        amount = Math.round(result.medical);
        if (cfg.formula_type === "FIXED") {
          calcType = "FLAT";
          pct = 0;
        }
      } else if (cfg.isTransport) {
        amount = Math.round(result.transport);
        if (cfg.formula_type === "FIXED") {
          calcType = "FLAT";
          pct = 0;
        }
      } else {
        const valNum = Number(cfg.value) || 0;
        if (cfg.formula_type === "PERCENT_BASIC") {
          amount = Math.round((result.basic * valNum) / 100);
        } else if (cfg.formula_type === "PERCENT_CTC") {
          amount = Math.round((ctcWithVariable * valNum) / 100);
        } else if (cfg.formula_type === "BALANCING") {
          amount = Math.round(result.special);
          calcType = "FLAT";
          pct = 0;
        } else {
          amount = Math.round(valNum);
          calcType = "FLAT";
          pct = 0;
        }
      }

      if (amount > 0 || cfg.isBasic) {
        lines.push({
          income_head_id: head.income_head_id || head.id || null,
          income_name: name,
          calculation_type: calcType,
          formula_type: cfg.isBasic && cfg.formula_type?.startsWith("PERCENT") ? "PERCENT_CTC" : cfg.formula_type,
          percentage: pct,
          monthly_amount: amount,
          annual_amount: amount * 12,
        });
      }
    });

    return lines;
  }, [incomeHeads, selectedIncomeHeadIds, incomeHeadConfigs, basicVal, medicalVal, transportVal, result, ctcWithVariable]);

  const mappedDeductionLines = useMemo(() => {
    const rawList =
      Array.isArray(deductionHeads) && deductionHeads.length > 0
        ? deductionHeads
        : DEFAULT_DEDUCTION_HEADS;

    const listToMap = rawList.filter((h) => {
      const n = (h.name || h.deduction_name || h.code || "").toLowerCase();
      return !n.includes("grat");
    });

    const lines = [];
    (Array.isArray(listToMap) ? listToMap : []).forEach((head) => {
      const id = String(head.deduction_head_id || head.id || head.code || head.head_code || head.name || head.deduction_name);
      if (!selectedDeductionHeadIds.has(id)) {
        return;
      }

      const name = head.name || head.deduction_name || "Deduction Head";
      const nameLower = name.toLowerCase();
      const cfg = deductionHeadConfigs[id] || { formula_type: "PERCENT_BASIC", value: "12" };
      const valNum = Number(cfg.value !== undefined ? cfg.value : "12") || 0;
      let amount = 0;
      let calcType = cfg.formula_type?.startsWith("PERCENT") ? "PERCENTAGE" : "FLAT";
      let pct = valNum;

      if (nameLower.includes("pf") || nameLower.includes("epf") || nameLower.includes("provident")) {
        if (pfOn && result.empPF > 0) {
          amount = Math.round(result.empPF);
          pct = 12;
          calcType = "PERCENTAGE";
        } else if (valNum > 0) {
          amount = cfg.formula_type === "PERCENT_GROSS"
            ? Math.round((result.gross * valNum) / 100)
            : cfg.formula_type === "FIXED"
              ? Math.round(valNum)
              : Math.round((result.basic * valNum) / 100);
        }
      } else if (nameLower.includes("esi") || nameLower.includes("esic")) {
        if (isEsiDisabled) {
          amount = 0; // Auto-disabled when Gross > 21000
        } else if (esiOn && result.empESI > 0) {
          amount = Math.round(result.empESI);
          pct = 0.75;
          calcType = "PERCENTAGE";
        } else if (!isEsiDisabled && valNum > 0) {
          amount = cfg.formula_type === "PERCENT_GROSS"
            ? Math.round((result.gross * valNum) / 100)
            : cfg.formula_type === "FIXED"
              ? Math.round(valNum)
              : Math.round((result.basic * valNum) / 100);
        }
      } else if (nameLower.includes("pt") || nameLower.includes("professional tax")) {
        if (ptOn && result.pt > 0) {
          amount = Math.round(result.pt);
        } else if (valNum > 0) {
          amount = cfg.formula_type === "FIXED"
            ? Math.round(valNum)
            : Math.round((result.basic * valNum) / 100);
        }
      } else {
        if (cfg.formula_type === "PERCENT_BASIC") {
          amount = Math.round((result.basic * valNum) / 100);
        } else if (cfg.formula_type === "PERCENT_GROSS") {
          amount = Math.round((result.gross * valNum) / 100);
        } else {
          amount = Math.round(valNum);
        }
      }

      if (amount > 0) {
        lines.push({
          deduction_head_id: head.deduction_head_id || head.id || null,
          deduction_name: name,
          calculation_type: calcType,
          formula_type: cfg.formula_type || (nameLower.includes("esi") ? "PERCENT_GROSS" : "PERCENT_BASIC"),
          percentage: pct,
          monthly_amount: amount,
          annual_amount: amount * 12,
        });
      }
    });

    return lines;
  }, [deductionHeads, selectedDeductionHeadIds, deductionHeadConfigs, pfOn, esiOn, isEsiDisabled, ptOn, result]);

  const mappedContributionLines = useMemo(() => {
    const listToMap =
      Array.isArray(contributionHeads) && contributionHeads.length > 0
        ? contributionHeads
        : [
          { id: "1", name: "PF – Employer Contribution" },
          { id: "2", name: "ESIC – Employer Contribution" },
          { id: "3", name: "Gratuity" },
        ];

    const lines = [];
    (Array.isArray(listToMap) ? listToMap : []).forEach((head) => {
      const name = head.name || head.contribution_name || "Contribution Head";
      const nameLower = name.toLowerCase();
      let amount = 0;
      let pct = 0;
      let calcType = "FLAT";
      let formula_type = "FIXED";

      if (nameLower.includes("pf") || nameLower.includes("provident")) {
        if (pfOn && result.erPF > 0) {
          amount = Math.round(result.erPF);
          pct = 12;
          calcType = "PERCENTAGE";
          formula_type = "PERCENT_BASIC";
        }
      } else if (nameLower.includes("esi") || nameLower.includes("esic")) {
        if (esiOn && !isEsiDisabled && result.erESI > 0) {
          amount = Math.round(result.erESI);
          pct = 3.25;
          calcType = "PERCENTAGE";
          formula_type = "PERCENT_GROSS";
        }
      } else if (nameLower.includes("grat")) {
        if (gratOn && result.gratuity > 0) {
          amount = Math.round(result.gratuity);
          pct = 4.81;
          calcType = "PERCENTAGE";
          formula_type = "PERCENT_BASIC";
        }
      } else {
        const valNum = Number(head.monthly_amount || head.value || 0);
        amount = Math.round(valNum);
      }

      if (amount > 0) {
        lines.push({
          contribution_head_id: head.contribution_head_id || head.deduction_head_id || head.id || null,
          contribution_name: name,
          calculation_type: calcType,
          formula_type: formula_type,
          percentage: pct,
          monthly_amount: amount,
          annual_amount: amount * 12,
        });
      }
    });

    return lines;
  }, [contributionHeads, pfOn, esiOn, isEsiDisabled, gratOn, result]);

  const displayGrossMonthly = useMemo(
    () => mappedIncomeLines.reduce((acc, l) => acc + (l.monthly_amount || 0), 0),
    [mappedIncomeLines]
  );
  const displayGrossYearly = useMemo(
    () => mappedIncomeLines.reduce((acc, l) => acc + (l.annual_amount || 0), 0),
    [mappedIncomeLines]
  );

  const displayDeductionMonthly = useMemo(
    () => mappedDeductionLines.reduce((acc, l) => acc + (l.monthly_amount || 0), 0),
    [mappedDeductionLines]
  );
  const displayDeductionYearly = useMemo(
    () => mappedDeductionLines.reduce((acc, l) => acc + (l.annual_amount || 0), 0),
    [mappedDeductionLines]
  );

  const displayTakeHomeMonthly = displayGrossMonthly - displayDeductionMonthly;
  const displayTakeHomeYearly = displayGrossYearly - displayDeductionYearly;

  const displayContributionMonthly = useMemo(
    () => mappedContributionLines.reduce((acc, l) => acc + (l.monthly_amount || 0), 0),
    [mappedContributionLines]
  );
  const displayContributionYearly = useMemo(
    () => mappedContributionLines.reduce((acc, l) => acc + (l.annual_amount || 0), 0),
    [mappedContributionLines]
  );

  const displayVariableMonthly = Math.round(variableMonthlyEquiv);
  const displayVariableYearly = Math.round(variableAnnual);

  const displayCtcMonthly = useMemo(() => {
    if (lockPrimary && primarySelect === "ctc" && Number(primaryVal) > 0) {
      return Math.round(Number(primaryVal));
    }
    return displayGrossMonthly + displayContributionMonthly + displayVariableMonthly;
  }, [lockPrimary, primarySelect, primaryVal, displayGrossMonthly, displayContributionMonthly, displayVariableMonthly]);

  const displayCtcYearly = useMemo(() => {
    if (lockPrimary && primarySelect === "ctc" && Number(primaryVal) > 0) {
      return Math.round(Number(primaryVal)) * 12;
    }
    return displayGrossYearly + displayContributionYearly + displayVariableYearly;
  }, [lockPrimary, primarySelect, primaryVal, displayGrossYearly, displayContributionYearly, displayVariableYearly]);

  // Sync stored values and primary inputs without triggering redundant re-render loops
  useEffect(() => {
    const ctcR = displayCtcMonthly;
    const grossR = displayGrossMonthly;
    const netR = displayTakeHomeMonthly;

    setStored((prev) =>
      prev.ctc === ctcR && prev.gross === grossR && prev.net === netR
        ? prev
        : { ctc: ctcR, gross: grossR, net: netR }
    );

    // Only update basicVal from result if top lock is OFF and user is not editing basic directly
    if (!lockPrimary && lastEdited !== "basic") {
      const rounded = String(Math.round(result.basic));
      setBasicVal((prev) => (prev === rounded ? prev : rounded));
    }
  }, [displayCtcMonthly, displayGrossMonthly, displayTakeHomeMonthly, result.basic, lastEdited, lockPrimary]);

  // Update primaryVal ONLY when lockPrimary is OFF
  useEffect(() => {
    if (!lockPrimary) {
      const currentStored = stored[primarySelect];
      if (currentStored !== undefined) {
        const strVal = String(currentStored);
        setPrimaryVal((prev) => (prev === strVal ? prev : strVal));
      }
    }
  }, [primarySelect, stored, lockPrimary]);

  // Filtered active employees
  const filteredEmployees = useMemo(() => {
    const safeEmpList = Array.isArray(employees) ? employees : [];
    if (!searchEmp.trim()) return safeEmpList;
    const q = searchEmp.toLowerCase();
    return safeEmpList.filter((e) => {
      const name = (
        e.full_name ||
        e.Led_name ||
        e.employee_name ||
        e.name ||
        ""
      ).toLowerCase();
      const code = (
        e.employee_code ||
        e.Employee_code ||
        e.Led_code ||
        e.code ||
        ""
      ).toLowerCase();
      const dept = (e.department || "").toLowerCase();
      return name.includes(q) || code.includes(q) || dept.includes(q);
    });
  }, [employees, searchEmp]);

  const toggleSelectEmp = (empId) => {
    setSelectedEmpIds((prev) => {
      const next = new Set(prev);
      if (next.has(empId)) next.delete(empId);
      else next.add(empId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (
      selectedEmpIds.size === filteredEmployees.length &&
      filteredEmployees.length > 0
    ) {
      setSelectedEmpIds(new Set());
    } else {
      const allIds = filteredEmployees.map((e, idx) => getEmpId(e, idx));
      setSelectedEmpIds(new Set(allIds));
    }
  };

  // Submit Bulk Structure Assignment
  const handleAssignSubmit = async () => {
    if (selectedEmpIds.size === 0) {
      alertWarning("Select Employees", "Please select at least one employee.");
      return;
    }
    if (!effectiveFrom) {
      alertWarning("Effective Date Required", "Please select an effective date.");
      return;
    }

    setSavingAssign(true);
    let successCount = 0;
    let failCount = 0;

    try {
      const selectedList = employees.filter((e, idx) =>
        selectedEmpIds.has(getEmpId(e, idx))
      );

      for (const emp of selectedList) {
        const empIdStr = getEmpId(emp, 0);
        const payload = {
          employee_id: empIdStr,
          employee_name: emp.Led_name || emp.employee_name || emp.name || "",
          grade: emp.grade || emp.designation || null,
          type: "CTC",
          effective_from: effectiveFrom,
          ctc: Math.round(displayCtcMonthly),
          gross_monthly: Math.round(displayGrossMonthly),
          total_income: Math.round(displayGrossMonthly),
          total_deduction: Math.round(displayDeductionMonthly),
          net_salary: Math.round(displayTakeHomeMonthly),
          revision_reason: revisionReason,
          status: "Active",
          incomeLines: mappedIncomeLines,
          deductionLines: mappedDeductionLines,
          contributionLines: mappedContributionLines,
        };

        try {
          const res = await createSalaryStructure(payload);
          if (res?.success || res?.data) {
            successCount++;
          } else {
            failCount++;
          }
        } catch (e) {
          console.error(`Assignment error for ${empIdStr}:`, e);
          failCount++;
        }
      }

      if (failCount === 0) {
        alertSuccess(
          "Structure Assigned",
          `Salary structure assigned successfully to ${successCount} employee(s)!`
        );
      } else {
        alertWarning(
          "Assignment Completed",
          `Assigned to ${successCount} employee(s), but ${failCount} failed.`
        );
      }

      setShowAssignModal(false);
      setSelectedEmpIds(new Set());
    } catch (err) {
      console.error("Bulk assign error:", err);
      alertError("Assignment Error", err?.message || "Error assigning structure");
    } finally {
      setSavingAssign(false);
    }
  };

  const handleResetForm = () => {
    setPrimaryVal("0");
    setBasicVal("0");
    setMedicalVal("0");
    setTransportVal("0");
    setVariableVal("0");
    setPfOn(true);
    setEsiOn(true);
    setGratOn(true);
    setPtOn(false);
    setIncomeHeadConfigs({});
    setDeductionHeadConfigs({});
    const activeIncomeList = incomeHeads.length > 0 ? incomeHeads : DEFAULT_INCOME_HEADS;
    const activeDeductionList = deductionHeads.length > 0 ? deductionHeads : DEFAULT_DEDUCTION_HEADS;
    setSelectedIncomeHeadIds(new Set(activeIncomeList.map((h) => getIncomeHeadConfig(h).id)));
    setSelectedDeductionHeadIds(new Set(activeDeductionList.map((h) => String(h.deduction_head_id || h.id || h.head_code || h.deduction_name || h.name))));
    alertSuccess("Form Reset", "All inputs and statutory configurations have been reset.");
  };

  const otherKeys = ["ctc", "gross", "net"].filter((k) => k !== primarySelect);
  const otherNames = { ctc: "CTC", gross: "Gross", net: "Net Hand" };

  return (
    <div
      className="w-full h-full md:h-[calc(100vh-100px)] bg-[#eef1f6] flex flex-col overflow-hidden text-[13px] text-[#0f172a] leading-[1.4]"
      style={{ fontFamily: FONT }}
    >
      {/* ERP Header Bar */}
      <ERPHeader
        title="Salary Calculator"
        TitleIcon={Calculator}
        isViewMode={true}
        hideActionButtons={true}
      />

      <div className="flex-1 overflow-hidden p-2 md:p-3 h-full">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch h-full overflow-hidden">
          {/* LEFT: CONTROL PANEL (6 Cols) */}
          <div className="lg:col-span-6 bg-white rounded-md border border-gray-300 shadow-sm overflow-hidden flex flex-col h-full">
            {/* Form Section Header */}
            <div className="bg-slate-50 border-b border-gray-200 px-3.5 py-2 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-4 bg-blue-600 rounded-full shrink-0"></div>
                <div className="flex items-baseline gap-2">
                  <h2 className="text-[13.5px] font-semibold text-[#0f172a]">
                    Control Panel
                  </h2>
                  <span className="text-[10.5px] text-[#64748b]">
                    Primary inputs, editable in any order
                  </span>
                </div>
              </div>

              {/* Action Buttons: Reset + Assign to Employees */}
              <div className="flex items-center gap-2">
                <ResetButton onClick={handleResetForm} />
                <BaseButton
                  label="Assign to Employees"
                  icon={<Users size={16} />}
                  tone="emerald"
                  onClick={handleOpenAssignModal}
                />
              </div>
            </div>

            <div className="p-2.5 space-y-2.5 flex-1 overflow-y-auto">
              {/* Primary Figure Select Dropdown with Inline Input & Fix Button */}
              <div className="space-y-1.5 bg-[#fafbfd] p-2.5 rounded-md border border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                  <div className="sm:col-span-5">
                    <ERPAutocomplete
                      value={
                        primarySelect === "ctc"
                          ? "Cost to Company (CTC)"
                          : primarySelect === "gross"
                            ? "Gross Salary"
                            : "Net Hand Salary"
                      }
                      options={["Cost to Company (CTC)", "Gross Salary", "Net Hand Salary"]}
                      onChange={(val) => {
                        const mapping = {
                          "Cost to Company (CTC)": "ctc",
                          "Gross Salary": "gross",
                          "Net Hand Salary": "net",
                        };
                        const key = mapping[val] || "ctc";
                        setPrimarySelect(key);
                        setLastEdited(key);
                      }}
                      className="h-[28px] px-2 text-[12px] font-medium text-[#0f172a] border border-gray-300 rounded-md outline-none bg-white focus:border-blue-500 focus:ring-1 focus:ring-[#1a56db] w-full"
                    />
                  </div>
                  <div className="sm:col-span-7 flex items-center w-full">
                    <div className="w-full flex items-center bg-white border border-gray-300 rounded-md px-2 h-[28px] focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-[#1a56db] transition-all">
                      <span className="text-[12px] text-[#64748b] font-mono mr-1">₹</span>
                      <input
                        type="number"
                        value={primaryVal}
                        onChange={(e) => {
                          setLastEdited(primarySelect);
                          setPrimaryVal(e.target.value);
                        }}
                        className="w-full text-right font-mono text-[13px] font-semibold text-[#0f172a] bg-transparent focus:outline-none"
                      />
                    </div>

                    {/* Fix Selected Figure Switch - hidden / display: none */}
                    <label
                      className="hidden"
                      style={{ display: "none" }}
                      title={`Fix ${primarySelect === "ctc" ? "CTC" : primarySelect === "gross" ? "Gross" : "Net Hand"} — keep unchanged while editing other components`}
                    >
                      <input
                        type="checkbox"
                        checked={lockPrimary}
                        onChange={(e) => setLockPrimary(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-8 h-4.5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-[#0f6b5c] "></div>
                    </label>
                  </div>
                </div>

                {/* Inline Stats Pill for other calculated figures */}
                <div className="flex items-center justify-between text-[10.5px] font-medium bg-[#f0f4f8] px-2.5 py-1 rounded-md border border-[#d5dfeb] text-[#334155]">
                  {otherKeys.map((k) => (
                    <span key={k} className="flex items-center gap-1.5">
                      <span className="font-medium text-[#64748b]">{otherNames[k]}:</span>
                      <span className="font-mono font-semibold text-[#0f6b5c]">
                        ₹{(stored[k] || 0).toLocaleString("en-IN")}
                      </span>
                    </span>
                  ))}
                </div>
              </div>

              {/* DYNAMIC SECTION 1: Earnings (Income heads) Card */}
              <div className="border border-gray-200 rounded-md overflow-hidden bg-white shadow-xs">
                <div className="px-3 py-1.5 bg-[#eef5fc] border-b border-gray-200 flex items-center justify-between">
                  <span className="text-[11.5px] font-semibold text-[#0f172a]    tracking-wider flex items-center gap-1.5">
                    <div className="w-1.5 h-3.5 bg-[#1a56db] rounded-full shrink-0"></div>
                    Earnings (Income heads)
                  </span>
                  <span className="text-[10px] font-medium text-[#1a56db] bg-blue-100/80 px-1.5 py-0.2 rounded">
                    {selectedIncomeHeadIds.size} selected
                  </span>
                </div>

                <div className="p-2 space-y-1.5 bg-[#fafbfd]">
                  {(incomeHeads.length > 0 ? incomeHeads : DEFAULT_INCOME_HEADS).map((head) => {
                    const cfg = getIncomeHeadConfig(head);
                    const isSelected = selectedIncomeHeadIds.has(cfg.id);
                    const name = head.income_name || head.name || "Income Head";

                    return (
                      <div
                        key={cfg.id}
                        className={`flex items-center justify-between gap-2 p-1.5 rounded-md border transition-all ${isSelected ? "bg-white border-blue-200 shadow-2xs" : "bg-slate-50/50 border-gray-200 opacity-60"
                          }`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              const next = new Set(selectedIncomeHeadIds);
                              if (e.target.checked) next.add(cfg.id);
                              else next.delete(cfg.id);
                              setSelectedIncomeHeadIds(next);
                            }}
                            className="w-3.5 h-3.5 rounded text-[#1a56db] focus:ring-[#1a56db] cursor-pointer"
                          />
                          <span
                            className={`text-[11.5px] font-medium truncate transition-colors ${isSelected ? "text-slate-800" : "text-slate-400 line-through"
                              }`}
                            title={name}
                          >
                            {name}
                          </span>

                          <span
                            className={`text-[9.5px] font-normal px-1 py-0.1 rounded shrink-0 ${!isSelected
                              ? "bg-slate-100 text-slate-400 border border-slate-200"
                              : head.income_type?.toLowerCase() === "variable" || head.type?.toLowerCase() === "variable"
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              }`}
                          >
                            {head.income_type || head.type || "fixed"}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <select
                            value={cfg.formula_type}
                            disabled={!isSelected}
                            onChange={(e) => {
                              const newFormula = e.target.value;
                              let newVal = cfg.value;
                              if (cfg.isHra) {
                                if (newFormula === "FIXED" && (newVal === "50" || !newVal)) {
                                  newVal = String(Math.round((Number(basicVal) || 0) * 0.5));
                                } else if (newFormula === "PERCENT_BASIC" && (!newVal || newVal === String(Math.round((Number(basicVal) || 0) * 0.5)))) {
                                  newVal = "50";
                                }
                              }
                              newVal = capPctValue(newFormula, newVal);
                              setIncomeHeadConfigs((prev) => ({
                                ...prev,
                                [cfg.id]: {
                                  ...prev[cfg.id],
                                  formula_type: newFormula,
                                  value: newVal,
                                },
                              }));
                            }}
                            className="h-[25px] px-1.5 text-[11px] font-normal border border-gray-300 rounded bg-white outline-none focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-400"
                          >
                            <option value="FIXED">Fixed</option>
                            <option value="PERCENT_BASIC">% of Basic</option>
                            <option value="PERCENT_CTC">% of CTC</option>
                            <option value="BALANCING">Balancing (remainder)</option>
                          </select>

                          {cfg.formula_type !== "BALANCING" && (
                            <div className={`flex items-center border border-gray-300 rounded px-1.5 h-[25px] w-20 ${!isSelected ? "bg-slate-100" : "bg-white"
                              }`}>
                              <span className="text-[10.5px] text-slate-400 mr-1">
                                {cfg.formula_type?.startsWith("PERCENT") ? "%" : "₹"}
                              </span>
                              <input
                                type="number"
                                value={cfg.value || ""}
                                disabled={!isSelected}
                                onChange={(e) => {
                                  const v = capPctValue(cfg.formula_type, e.target.value);
                                  if (cfg.isBasic) {
                                    setLastEdited("basic");
                                    setBasicVal(v);
                                  } else if (cfg.isMedical) {
                                    setMedicalVal(v);
                                  } else if (cfg.isTransport) {
                                    setTransportVal(v);
                                  }
                                  setIncomeHeadConfigs((prev) => ({
                                    ...prev,
                                    [cfg.id]: { ...prev[cfg.id], formula_type: cfg.formula_type, value: v },
                                  }));
                                }}
                                className="w-full text-right font-mono text-[11px] font-medium text-slate-800 outline-none bg-transparent disabled:text-slate-400"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* DYNAMIC SECTION 2: Deductions Card */}
              <div className="border border-gray-200 rounded-md overflow-hidden bg-white shadow-xs">
                <div className="px-3 py-1.5 bg-[#fcf2f2] border-b border-gray-200 flex items-center justify-between">
                  <span className="text-[11.5px] font-semibold text-[#0f172a]    tracking-wider flex items-center gap-1.5">
                    <div className="w-1.5 h-3.5 bg-rose-600 rounded-full shrink-0"></div>
                    Deductions
                  </span>
                  <span className="text-[10px] font-medium text-rose-700 bg-rose-100/80 px-1.5 py-0.2 rounded">
                    {selectedDeductionHeadIds.size} selected
                  </span>
                </div>

                <div className="p-2 space-y-1.5 bg-[#fafbfd]">
                  {(deductionHeads.length > 0 ? deductionHeads : DEFAULT_DEDUCTION_HEADS)
                    .filter((h) => !((h.deduction_name || h.name || h.head_code || "").toLowerCase().includes("grat")))
                    .map((head) => {
                      const id = String(head.deduction_head_id || head.id || head.head_code || head.deduction_name || head.name);
                      const isSelected = selectedDeductionHeadIds.has(id);
                      const cfg = deductionHeadConfigs[id] || { formula_type: "PERCENT_BASIC", value: "12" };
                      const name = head.deduction_name || head.name || "Deduction Head";
                      const isEsiHead = name.toLowerCase().includes("esi");
                      const headDisabled = isEsiHead && isEsiDisabled;

                      return (
                        <div
                          key={id}
                          className={`flex items-center justify-between gap-2 p-1.5 rounded-md border transition-all ${headDisabled
                            ? "bg-amber-50/40 border-amber-200 opacity-60"
                            : isSelected
                              ? "bg-white border-rose-200 shadow-2xs"
                              : "bg-slate-50/50 border-gray-200 opacity-60"
                            }`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0 flex-1">
                            <input
                              type="checkbox"
                              checked={headDisabled ? false : isSelected}
                              disabled={headDisabled}
                              onChange={(e) => {
                                const next = new Set(selectedDeductionHeadIds);
                                if (e.target.checked) next.add(id);
                                else next.delete(id);
                                setSelectedDeductionHeadIds(next);

                                if (name.toLowerCase().includes("pf")) setPfOn(e.target.checked);
                                if (name.toLowerCase().includes("esi")) setEsiOn(e.target.checked);
                                if (name.toLowerCase().includes("pt") || name.toLowerCase().includes("tax")) setPtOn(e.target.checked);
                              }}
                              className="w-3.5 h-3.5 rounded text-rose-600 focus:ring-rose-600 cursor-pointer disabled:cursor-not-allowed"
                            />
                            <span
                              className={`text-[11.5px] font-medium truncate transition-colors ${isSelected && !headDisabled ? "text-slate-800" : "text-slate-400 line-through"
                                }`}
                              title={name}
                            >
                              {name}
                            </span>

                            {headDisabled ? (
                              <span className="text-[9.5px] font-medium px-1 py-0.1 rounded shrink-0 bg-amber-100 text-amber-800 border border-amber-200">
                                Disabled (&gt; ₹21k)
                              </span>
                            ) : (
                              <span
                                className={`text-[9.5px] font-normal px-1 py-0.1 rounded shrink-0 ${!isSelected
                                  ? "bg-slate-100 text-slate-400 border border-slate-200"
                                  : "bg-blue-50 text-blue-700 border border-blue-200"
                                  }`}
                              >
                                {head.type || "percentage"}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <select
                              value={cfg.formula_type || "PERCENT_BASIC"}
                              disabled={headDisabled || !isSelected}
                              onChange={(e) => {
                                const newFormula = e.target.value;
                                setDeductionHeadConfigs((prev) => ({
                                  ...prev,
                                  [id]: {
                                    ...prev[id],
                                    formula_type: newFormula,
                                    value: capPctValue(newFormula, prev[id]?.value || "12")
                                  },
                                }));
                              }}
                              className="h-[25px] px-1.5 text-[11px] font-normal border border-gray-300 rounded bg-white outline-none focus:border-rose-500 disabled:bg-slate-100 disabled:text-slate-400"
                            >
                              <option value="PERCENT_BASIC">% of Basic</option>
                              <option value="PERCENT_GROSS">% of Gross</option>
                              <option value="FIXED">Fixed</option>
                            </select>

                            <div className={`flex items-center border border-gray-300 rounded px-1.5 h-[25px] w-20 ${headDisabled || !isSelected ? "bg-slate-100" : "bg-white"
                              }`}>
                              <span className="text-[10.5px] text-slate-400 mr-1">
                                {cfg.formula_type?.startsWith("PERCENT") ? "%" : "₹"}
                              </span>
                              <input
                                type="number"
                                value={headDisabled ? "0" : cfg.value || "0"}
                                disabled={headDisabled || !isSelected}
                                onChange={(e) => {
                                  const formula = cfg.formula_type || "PERCENT_BASIC";
                                  const v = capPctValue(formula, e.target.value);
                                  setDeductionHeadConfigs((prev) => ({
                                    ...prev,
                                    [id]: { ...prev[id], value: v },
                                  }));
                                }}
                                className="w-full text-right font-mono text-[11px] font-medium text-slate-800 outline-none bg-transparent disabled:text-slate-400"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* DYNAMIC SECTION 3: Company Contribution Card */}
              <div className="border border-gray-200 rounded-md overflow-hidden bg-white shadow-xs">
                <div className="px-3 py-1.5 bg-[#f0f3ff] border-b border-gray-200 flex items-center justify-between">
                  <span className="text-[11.5px] font-semibold text-[#0f172a]    tracking-wider flex items-center gap-1.5">
                    <div className="w-1.5 h-3.5 bg-indigo-600 rounded-full shrink-0"></div>
                    Company Contribution
                  </span>
                  <span className="text-[10px] font-medium text-indigo-700 bg-indigo-100/80 px-1.5 py-0.2 rounded">
                    Employer Liability
                  </span>
                </div>

                <div className="p-2 space-y-1.5 bg-[#fafbfd]">
                  <div className={`flex items-center justify-between gap-2 p-1.5 rounded-md border transition-all ${gratOn ? "border-indigo-200 bg-white shadow-2xs" : "bg-slate-50/50 border-gray-200 opacity-60"
                    }`}>
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <input
                        type="checkbox"
                        checked={gratOn}
                        onChange={(e) => setGratOn(e.target.checked)}
                        className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-600 cursor-pointer"
                      />
                      <span
                        className={`text-[11.5px] font-medium truncate transition-colors ${gratOn ? "text-slate-800" : "text-slate-400 line-through"
                          }`}
                        title="Gratuity"
                      >
                        Gratuity
                      </span>
                      <span
                        className={`text-[9.5px] font-normal px-1 py-0.1 rounded shrink-0 ${gratOn ? "bg-indigo-50 text-indigo-700 border border-indigo-200" : "bg-slate-100 text-slate-400 border border-slate-200"
                          }`}
                      >
                        Employer
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`h-[25px] px-2 text-[11px] font-normal flex items-center border rounded ${gratOn ? "text-slate-600 bg-slate-50 border-gray-200" : "text-slate-400 bg-slate-100 border-gray-200 line-through"
                        }`}>
                        % of Basic (4.81%)
                      </span>
                      <div className={`flex items-center border border-gray-200 rounded px-1.5 h-[25px] w-20 ${gratOn ? "bg-slate-50" : "bg-slate-100"
                        }`}>
                        <span className="text-[10.5px] text-slate-400 mr-1">₹</span>
                        <span className={`w-full text-right font-mono text-[11px] font-medium ${gratOn ? "text-slate-700" : "text-slate-400"
                          }`}>
                          {fmt(result.gratuity)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: SALARY STRUCTURE CARD (6 Cols) */}
          <div className="lg:col-span-6 bg-white rounded-md border border-gray-300 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="bg-slate-50 border-b border-gray-200 px-3.5 py-2 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-4 bg-blue-600 rounded-full shrink-0"></div>
                <h2 className="text-[13.5px] font-semibold text-[#0f172a]">
                  Salary Structure
                </h2>
              </div>
              <span className="font-mono text-[11.5px] bg-emerald-100 border border-emerald-300 text-emerald-700 px-2 py-0.5 rounded-md font-semibold shadow-xs">
                CTC ₹{fmt(displayCtcYearly)} / yr
              </span>
            </div>

            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-left text-[12px] border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-[#475569] font-medium text-[10.5px] tracking-wider bg-[#f8fafc]">
                    <th className="py-1.5 px-3 text-left">Particulars</th>
                    <th className="py-1.5 px-3 text-right">Monthly</th>
                    <th className="py-1.5 px-3 text-right">Yearly</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-[11.5px]">
                  {/* INCOMES */}
                  <tr className="bg-[#eff6ff] border-t border-b border-[#dbeafe]">
                    <td
                      colSpan="3"
                      className="py-1.5 px-3 text-[13px] font-bold text-[#1e40af] tracking-wider"
                    >
                      Incomes
                    </td>
                  </tr>
                  {mappedIncomeLines.map((line, idx) => (
                    <tr key={line.income_head_id || `inc-${idx}`} className="bg-white hover:bg-blue-50/40 transition-colors">
                      <td className="py-1 px-3 text-slate-700 font-medium">
                        <span>{line.income_name}</span>
                      </td>
                      <td className="py-1 px-3 text-right font-mono text-slate-800">{fmt(line.monthly_amount)}</td>
                      <td className="py-1 px-3 text-right font-mono text-slate-800">{fmt(line.annual_amount)}</td>
                    </tr>
                  ))}
                  <tr className="bg-[#e0f2fe]/60 font-semibold text-[#0369a1] text-[11.5px] border-y border-[#bae6fd]">
                    <td className="py-1 px-3">Gross</td>
                    <td className="py-1 px-3 text-right font-mono">
                      {fmt(displayGrossMonthly)}
                    </td>
                    <td className="py-1 px-3 text-right font-mono">
                      {fmt(displayGrossYearly)}
                    </td>
                  </tr>
                  {result._error && (
                    <tr>
                      <td colSpan="3" className="p-2 bg-rose-50 text-center border-b border-rose-200">
                        <div className="flex items-start gap-1.5 text-rose-900 text-[11px] leading-tight font-medium">
                          <span className="text-rose-600 font-semibold text-center shrink-0">⚠️ Shortfall Warning:</span>
                          <span className="text-center text-rose-600">
                            ⚠ Shortfall ₹{fmt(result._error.deficit)} — ₹{fmt(result._error.actualDeduction)} pulled from HRA{result._error.actualDeduction < result._error.deficit ? " (not fully covered)" : ""}
                          </span>
                        </div>
                      </td>
                    </tr>
                  )}

                  {/* GAP BEFORE DEDUCTIONS */}
                  <tr className="h-2.5 bg-[#f8fafc]"><td colSpan="3" className="p-0 border-0"></td></tr>

                  {/* DEDUCTIONS */}
                  <tr className="bg-[#fff1f2] border-t border-b border-[#fecdd3]">
                    <td
                      colSpan="3"
                      className="py-1.5 px-3 text-[13px] font-bold text-[#9f1239] tracking-wider"
                    >
                      Deductions
                    </td>
                  </tr>
                  {mappedDeductionLines.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="py-1 px-3 text-slate-400 italic bg-white">No deductions selected</td>
                    </tr>
                  ) : (
                    mappedDeductionLines.map((line, idx) => (
                      <tr key={line.deduction_head_id || `ded-${idx}`} className="bg-white hover:bg-rose-50/40 transition-colors">
                        <td className="py-1 px-3 text-slate-700 font-medium">
                          <span>{line.deduction_name}</span>
                        </td>
                        <td className="py-1 px-3 text-right font-mono text-slate-800">{fmt(line.monthly_amount)}</td>
                        <td className="py-1 px-3 text-right font-mono text-slate-800">{fmt(line.annual_amount)}</td>
                      </tr>
                    ))
                  )}
                  <tr className="bg-[#ffe4e6]/60 font-semibold text-[#be123c] text-[11.5px] border-y border-[#fecdd3]">
                    <td className="py-1 px-3">Total Deduction</td>
                    <td className="py-1 px-3 text-right font-mono">
                      {fmt(displayDeductionMonthly)}
                    </td>
                    <td className="py-1 px-3 text-right font-mono">
                      {fmt(displayDeductionYearly)}
                    </td>
                  </tr>
                  <tr className="bg-[#dcfce7] font-bold text-[#15803d] text-[12px] border-y-2 border-[#86efac]">
                    <td className="py-1 px-3">Take Home</td>
                    <td className="py-1 px-3 text-right font-mono text-[12px]">
                      {fmt(displayTakeHomeMonthly)}
                    </td>
                    <td className="py-1 px-3 text-right font-mono text-[12px]">
                      {fmt(displayTakeHomeYearly)}
                    </td>
                  </tr>

                  {/* GAP BEFORE COMPANY CONTRIBUTION */}
                  <tr className="h-2.5 bg-[#f8fafc]"><td colSpan="3" className="p-0 border-0"></td></tr>

                  {/* COMPANY CONTRIBUTION */}
                  <tr className="bg-[#f0f3ff] border-t border-b border-[#e0e7ff]">
                    <td
                      colSpan="3"
                      className="py-1.5 px-3 text-[13px] font-bold text-[#3730a3] tracking-wider"
                    >
                      Company Contribution
                    </td>
                  </tr>
                  {mappedContributionLines.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="py-1 px-3 text-slate-400 italic bg-white">No contributions selected</td>
                    </tr>
                  ) : (
                    mappedContributionLines.map((line, idx) => (
                      <tr key={line.contribution_head_id || `con-${idx}`} className="bg-white hover:bg-indigo-50/40 transition-colors">
                        <td className="py-1 px-3 text-slate-700 font-medium">
                          <span>{line.contribution_name}</span>
                        </td>
                        <td className="py-1 px-3 text-right font-mono text-slate-800">{fmt(line.monthly_amount)}</td>
                        <td className="py-1 px-3 text-right font-mono text-slate-800">{fmt(line.annual_amount)}</td>
                      </tr>
                    ))
                  )}
                  <tr className="bg-[#e0e7ff]/60 font-semibold text-[#4338ca] text-[11.5px] border-y border-[#c7d2fe]">
                    <td className="py-1 px-3">Total Company Contribution</td>
                    <td className="py-1 px-3 text-right font-mono">
                      {fmt(displayContributionMonthly)}
                    </td>
                    <td className="py-1 px-3 text-right font-mono">
                      {fmt(displayContributionYearly)}
                    </td>
                  </tr>

                  {/* GAP BEFORE VARIABLE */}
                  <tr className="h-2 bg-[#f8fafc]"><td colSpan="3" className="p-0 border-0"></td></tr>

                  {/* VARIABLE */}
                  <tr className="bg-[#fffbeb] border-t border-b border-[#fde68a]">
                    <td
                      colSpan="3"
                      className="py-1.5 px-3 text-[13px] font-bold text-[#92400e] tracking-wider"
                    >
                      Variable
                    </td>
                  </tr>
                  <tr className="bg-white hover:bg-amber-50/40 transition-colors">
                    <td className="py-1 px-3 text-slate-700 font-medium">Performance Based Pay (Variable)</td>
                    <td className="py-1 px-3 text-right font-mono text-slate-800">{dash(variableMonthlyEquiv)}</td>
                    <td className="py-1 px-3 text-right font-mono text-slate-800">{dash(variableAnnual)}</td>
                  </tr>

                  {/* GAP BEFORE GRAND TOTAL */}
                  <tr className="h-2.5 bg-[#f8fafc]"><td colSpan="3" className="p-0 border-0"></td></tr>

                  {/* GRAND TOTAL */}
                  <tr className="bg-[#ecfdf5] border-t-2 border-b-2 border-[#a7f3d0] font-bold text-[#047857] text-[14px]">
                    <td className="py-2 px-3">Cost to Company</td>
                    <td className="py-2 px-3 text-right font-mono text-[12.5px]">{fmt(displayCtcMonthly)}</td>
                    <td className="py-2 px-3 text-right font-mono text-[12.5px]">{fmt(displayCtcYearly)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ASSIGN SALARY STRUCTURE MODAL */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div
            className="bg-white rounded-md shadow-2xl border border-gray-300 w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden"
            style={{ fontFamily: FONT }}
          >
            {/* Modal Header */}
            <div className="bg-slate-50 border-b border-gray-200 px-3.5 py-2.5 flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="w-1.5 h-5 bg-blue-600 rounded-full shrink-0"></div>
                <div>
                  <h3 className="text-[14px] font-bold text-[#0f172a]">
                    Assign Salary Structure to Employees
                  </h3>
                  <p className="text-[11px] text-[#64748b]">
                    Apply this calculated structure &amp; match with Master Heads
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Top Details & Date Selector */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-[#fafbfd] p-3 rounded-md border border-gray-200">
                <div>
                  <label className="block text-[#1e293b] font-medium text-[11px]   tracking-[0.3px] mb-1">
                    Effective From Date
                  </label>
                  <div className="flex items-center bg-white border border-gray-300 rounded-md px-2.5 h-[30px] focus-within:border-blue-50">
                    <Calendar className="w-4 h-4 text-slate-400 mr-2" />
                    <input
                      type="date"
                      value={effectiveFrom}
                      onChange={(e) => setEffectiveFrom(e.target.value)}
                      className="w-full text-[12px] font-medium text-[#0f172a] bg-transparent focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[#1e293b] font-medium text-[11px]  tracking-[0.3px] mb-1">
                    Revision Reason / Note
                  </label>
                  <input
                    type="text"
                    value={revisionReason}
                    onChange={(e) => setRevisionReason(e.target.value)}
                    className="w-full h-[30px] px-2 text-[12px] font-medium text-[#0f172a] bg-white border border-gray-300 rounded-md focus:outline-none focus:border-blue-50"
                  />
                </div>

                <div className="flex flex-col justify-center">
                  <span className="text-[11px] text-[#64748b] font-semibold  tracking-[0.3px]">
                    Calculated Monthly CTC
                  </span>
                  <span className="text-[16px] font-bold font-mono text-[#0f6b5c]">
                    ₹{fmt(displayCtcMonthly)}
                  </span>
                </div>
              </div>

              {/* Head Mapping / Linting Review Panel */}
              <div className="border border-gray-200 rounded-md p-3 bg-slate-50/70 space-y-2">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#0f6b5c]" />
                  <h4 className="text-[11px] font-bold text-[#0f172a]  tracking-wider">
                    Income, Deduction &amp; Contribution Head Mapping
                  </h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[12px] font-mono">
                  {/* Income Lines */}
                  <div className="bg-white p-2.5 rounded-md border border-gray-200 space-y-1">
                    <span className="font-bold text-[#0f6b5c] block font-sans mb-1 text-[11px]  tracking-[0.3px]">
                      Mapped Income Heads ({mappedIncomeLines.length})
                    </span>
                    {mappedIncomeLines.map((line, idx) => (
                      <div key={idx} className="flex justify-between items-center text-slate-700 text-[11px]">
                        <span className="font-sans font-medium flex items-center gap-1">
                          {line.income_name}
                          {line.calculation_type === "PERCENTAGE" && line.percentage > 0 && (
                            <span className="text-[9.5px] text-blue-700 bg-blue-50 border border-blue-200 px-1 py-0.1 rounded font-normal">
                              ({line.percentage}%)
                            </span>
                          )}
                        </span>
                        <span>₹{fmt(line.monthly_amount)} / mo</span>
                      </div>
                    ))}
                  </div>

                  {/* Deduction Lines */}
                  <div className="bg-white p-2.5 rounded-md border border-gray-200 space-y-1">
                    <span className="font-bold text-rose-700 block font-sans mb-1 text-[11px]  tracking-[0.3px]">
                      Mapped Deduction Heads ({mappedDeductionLines.length})
                    </span>
                    {mappedDeductionLines.length === 0 ? (
                      <span className="text-slate-400 italic text-[11px]">No deductions applicable</span>
                    ) : (
                      mappedDeductionLines.map((line, idx) => (
                        <div key={idx} className="flex justify-between items-center text-slate-700 text-[11px]">
                          <span className="font-sans font-medium flex items-center gap-1">
                            {line.deduction_name}
                            {line.calculation_type === "PERCENTAGE" && line.percentage > 0 && (
                              <span className="text-[9.5px] text-rose-700 bg-rose-50 border border-rose-200 px-1 py-0.1 rounded font-normal">
                                ({line.percentage}%)
                              </span>
                            )}
                          </span>
                          <span>₹{fmt(line.monthly_amount)} / mo</span>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Contribution Lines */}
                  <div className="bg-white p-2.5 rounded-md border border-gray-200 space-y-1">
                    <span className="font-bold text-teal-700 block font-sans mb-1 text-[11px]  tracking-[0.3px]">
                      Mapped Contribution Heads ({mappedContributionLines.length})
                    </span>
                    {mappedContributionLines.length === 0 ? (
                      <span className="text-slate-400 italic text-[11px]">No contributions applicable</span>
                    ) : (
                      mappedContributionLines.map((line, idx) => (
                        <div key={idx} className="flex justify-between items-center text-slate-700 text-[11px]">
                          <span className="font-sans font-medium flex items-center gap-1">
                            {line.contribution_name}
                            {line.calculation_type === "PERCENTAGE" && line.percentage > 0 && (
                              <span className="text-[9.5px] text-teal-700 bg-teal-50 border border-teal-200 px-1 py-0.1 rounded font-normal">
                                ({line.percentage}%)
                              </span>
                            )}
                          </span>
                          <span>₹{fmt(line.monthly_amount)} / mo</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Employee Selection List */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h4 className="text-[12px] font-bold text-[#0f172a]  tracking-[0.3px]">
                      Select Employees ({selectedEmpIds.size} / {employees.length} selected)
                    </h4>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-white border border-gray-300 rounded-md px-2 h-[28px] focus-within:border-blue-50">
                      <Search className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
                      <input
                        type="text"
                        placeholder="Search employee..."
                        value={searchEmp}
                        onChange={(e) => setSearchEmp(e.target.value)}
                        className="w-40 text-[12px] font-medium text-[#0f172a] bg-transparent focus:outline-none"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={toggleSelectAll}
                      className="text-[12px] font-semibold text-[#0f6b5c] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {selectedEmpIds.size === filteredEmployees.length && filteredEmployees.length > 0 ? (
                        <>
                          <CheckSquare className="w-4 h-4" /> Deselect All
                        </>
                      ) : (
                        <>
                          <Square className="w-4 h-4" /> Select All
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {loadingMaster ? (
                  <div className="p-6 text-center text-[12px] text-slate-500">
                    Loading employees &amp; master heads...
                  </div>
                ) : filteredEmployees.length === 0 ? (
                  <div className="p-6 text-center text-[12px] text-slate-400 border rounded-md border-dashed">
                    No employees found.
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-md overflow-hidden max-h-40 overflow-y-auto divide-y divide-gray-100">
                    {filteredEmployees.map((emp, index) => {
                      const empId = getEmpId(emp, index);
                      const isSelected = selectedEmpIds.has(empId);
                      const empName = emp.Led_name || emp.employee_name || emp.name || "Employee";
                      const empCode = emp.employee_code || emp.Employee_code || emp.Led_code || emp.code || "";
                      const dept = emp.department || "General";

                      return (
                        <div
                          key={empId}
                          onClick={() => toggleSelectEmp(empId)}
                          className={`flex items-center justify-between p-2 cursor-pointer transition-colors ${isSelected ? "bg-emerald-50/60" : "hover:bg-slate-50"
                            }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => { }}
                              className="w-4 h-4 rounded text-[#0f6b5c] focus:ring-[#0f6b5c] cursor-pointer"
                            />
                            <div>
                              <span className="text-[12px] font-bold text-[#0f172a] block">
                                {empName}{" "}
                                {empCode ? (
                                  <span className="font-mono text-slate-500 font-normal">
                                    ({empCode})
                                  </span>
                                ) : null}
                              </span>
                              <span className="text-[11px] text-slate-400">{dept}</span>
                            </div>
                          </div>

                          {isSelected && (
                            <span className="text-[11px] font-bold text-[#0f6b5c] flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Selected
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 border-t border-gray-200 px-4 py-2.5 flex justify-between items-center">
              <span className="text-[12px] font-medium text-[#475569]">
                Ready to assign to {selectedEmpIds.size} employee(s)
              </span>

              <div className="flex items-center gap-2">
                <DiscardButton onClick={() => setShowAssignModal(false)} />

                <BaseButton
                  label={savingAssign ? "Assigning..." : "Apply Structure"}
                  icon={!savingAssign && <ArrowRight className="w-4 h-4" />}
                  tone="emerald"
                  onClick={handleAssignSubmit}
                  disabled={savingAssign || selectedEmpIds.size === 0}
                  loading={savingAssign}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
