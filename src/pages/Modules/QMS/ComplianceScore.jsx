import { useState, useEffect, useMemo, useCallback } from "react";
import {
  FaShieldAlt, FaSyncAlt, FaSearch, FaFileCsv, FaPrint, FaTimes, FaInfoCircle,
  FaChevronDown, FaChevronRight, FaExclamationTriangle, FaCheckCircle, FaClipboardCheck,
  FaArrowUp, FaArrowDown, FaMagic, FaUndo, FaBalanceScale, FaCalendarAlt,
} from "react-icons/fa";
import { ChartCard } from "./Components/Charts.jsx";
import { getComplianceScore } from "./Utils/QmsAPI";

const TONE = { good: "#2f9e7e", warn: "#c98a2e", bad: "#c25a5a", neutral: "#64748b", blue: "#3b6fd4" };
const SOFT = { good: "#e8f5f0", warn: "#fdf4e6", bad: "#fbeded", neutral: "#f1f5f9", blue: "#eef3fd" };

const bandOf = (s) =>
  s == null ? { text: "No data", tone: "neutral" }
  : s >= 85 ? { text: "Compliant", tone: "good" }
  : s >= 60 ? { text: "At Risk", tone: "warn" }
  : { text: "Critical", tone: "bad" };

const REASON_TYPE = {
  overdue:   { label: "Overdue", tone: "bad" },
  critical:  { label: "Critical open", tone: "bad" },
  aged:      { label: "Ageing > 30 d", tone: "warn" },
  excursion: { label: "Action-limit excursion", tone: "bad" },
};

// Static — regulatory mapping is a documented control, not live data.
const REG_CHECKLIST = [
  { req: "Schedule M (Revised 2024) — QMS, self-inspection, complaints & recall",
    prov: "Deviation, Audit, Complaint, Recall, CAPA modules with registers & logbooks", status: "Met" },
  { req: "21 CFR Part 11 readiness",
    prov: "User attribution, e-sign on save/status change, reason-for-change, immutable audit trail log", status: "Met" },
  { req: "ALCOA+ data integrity",
    prov: "Attributable, Legible, Contemporaneous (timestamps), Original, Accurate + complete/consistent/enduring/available", status: "Met" },
  { req: "PIC/S & WHO GMP — PQS elements",
    prov: "Change Control, Risk Management (ICH Q9), APQR (Product Quality Review), Validation, EM", status: "Met" },
  { req: "ICH Q9 Quality Risk Management",
    prov: "Risk register with S×P matrix, residual risk, review dates", status: "Met" },
  { req: "ICH Q10 — management review & continual improvement",
    prov: "Management Review module with KPI inputs and action tracking", status: "Partial" },
  { req: "EU GMP Annex 1 — environmental control",
    prov: "EM module with alert/action limits, excursion auto-deviation, trending", status: "Met" },
  { req: "Training & competency (Schedule M Part I)",
    prov: "Training module linked to DMS/STP revisions and Change Control", status: "Met" },
];

const CHECK_TONE = { Met: "good", Partial: "warn", Gap: "bad" };

const today = () => new Date().toISOString().slice(0, 10);
const monthsAgo = (n) => { const d = new Date(); d.setMonth(d.getMonth() - n); return d.toISOString().slice(0, 10); };

/* ──────────────── small pieces ──────────────── */

const Chip = ({ tone = "neutral", children, title, onClick }) => (
  <span title={title} onClick={onClick}
        className={`text-[9.5px] font-bold px-2 py-[2px] rounded-full whitespace-nowrap ${onClick ? "cursor-pointer" : ""}`}
        style={{ background: SOFT[tone], color: TONE[tone] }}>
    {children}
  </span>
);

function ScoreGauge({ score, band, delta }) {
  const v = score ?? 0;
  const R = 78, C = Math.PI * R;
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-[210px] h-[118px]">
        <svg viewBox="0 0 210 118" className="w-full h-full">
          <path d="M17,105 A78,78 0 0 1 193,105" fill="none" stroke="#eef2f8" strokeWidth="17" strokeLinecap="round" />
          <path d="M17,105 A78,78 0 0 1 193,105" fill="none" stroke={TONE[band.tone]} strokeWidth="17"
                strokeLinecap="round" strokeDasharray={`${(v / 100) * C} ${C}`}
                style={{ transition: "stroke-dasharray .9s cubic-bezier(.4,0,.2,1)" }} />
        </svg>
        <div className="absolute inset-x-0 bottom-[4px] flex flex-col items-center">
          <span className="text-[38px] font-bold leading-[38px] tracking-[-1.2px]" style={{ color: TONE[band.tone] }}>
            {score == null ? "—" : `${v}%`}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-[2px]">
        <span className="text-[10px] font-bold uppercase tracking-[1px]" style={{ color: TONE[band.tone] }}>
          {band.text}
        </span>
        {delta != null && delta !== 0 && (
          <Chip tone={delta > 0 ? "good" : "bad"}>
            {delta > 0 ? <FaArrowUp className="inline text-[7px] mr-[2px]" /> : <FaArrowDown className="inline text-[7px] mr-[2px]" />}
            {Math.abs(delta)} vs last month
          </Chip>
        )}
      </div>
    </div>
  );
}

function HistoryBars({ data = [] }) {
  if (data.length < 2) return null;
  return (
    <div className="flex items-end justify-center gap-[5px] h-[38px] mt-3">
      {data.map((d, i) => {
        const b = bandOf(d.score);
        return (
          <div key={i} className="flex flex-col items-center gap-[3px]" title={`${d.ym}: ${d.score}%`}>
            <div className="w-[16px] rounded-t-[2px]"
                 style={{ height: Math.max(3, (d.score / 100) * 30), background: TONE[b.tone], opacity: i === data.length - 1 ? 1 : 0.45 }} />
            <span className="text-[8px] text-[#a8b4c8]">{String(d.ym).slice(5)}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ──────────────── page ──────────────── */

export default function CompliancePage({ onOpenRecord }) {
  const [from, setFrom] = useState(monthsAgo(12));
  const [to, setTo] = useState(today());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const [q, setQ] = useState("");
  const [onlyPenalised, setOnlyPenalised] = useState(true);
  const [expanded, setExpanded] = useState({});
  const [fixed, setFixed] = useState({});          // simulator — recordNo => true
  const [showFormula, setShowFormula] = useState(false);
  const [checkFilter, setCheckFilter] = useState("all");

  const load = useCallback(async () => {
    setLoading(true); setErr(null);
    try {
      const r = await getComplianceScore(from, to);
      if (r?.success) { setData(r); setFixed({}); }
      else { setData(null); setErr(r?.message || "Compliance data could not be loaded."); }
    } catch (e) {
      setData(null);
      setErr(e?.response?.data?.message || e?.message || "Could not reach the QMS server.");
    } finally { setLoading(false); }
  }, [from, to]);

  useEffect(() => { load(); }, [load]);

  const breakdown = useMemo(() => (data?.breakdown || []).map((m) => ({
    ...m,
    reasons: m.reasons || [],
    penalty: Number(m.penalty) || 0,
  })), [data]);

  const score = data?.score ?? null;
  const band = bandOf(score);

  const totalPenalty = useMemo(() => breakdown.reduce((a, m) => a + m.penalty, 0), [breakdown]);

  // ── simulator: agar selected records fix ho jayen to score kya hoga ──
  const fixedPoints = useMemo(() => {
    let p = 0;
    breakdown.forEach((m) => m.reasons.forEach((r) => { if (fixed[`${m.key}|${r.recordNo}|${r.type}`]) p += (Number(r.points) || 0); }));
    return p;
  }, [breakdown, fixed]);

  const projected = score == null ? null : Math.min(100, score + fixedPoints);
  const projBand = bandOf(projected);

  const visible = useMemo(() => {
    const n = q.trim().toLowerCase();
    return breakdown
      .filter((m) => (!onlyPenalised || m.penalty > 0))
      .filter((m) => !n || m.label.toLowerCase().includes(n) || m.reasons.some((r) => String(r.recordNo).toLowerCase().includes(n)))
      .sort((a, b) => b.penalty - a.penalty);
  }, [breakdown, q, onlyPenalised]);

  const topDrivers = useMemo(() => [...breakdown].sort((a, b) => b.penalty - a.penalty).slice(0, 3).filter((m) => m.penalty > 0), [breakdown]);

  const checklist = useMemo(
    () => REG_CHECKLIST.filter((c) => checkFilter === "all" || c.status === checkFilter),
    [checkFilter]
  );
  const metCount = REG_CHECKLIST.filter((c) => c.status === "Met").length;

  const exportCsv = () => {
    const head = ["Module", "Penalty", "Record No.", "Finding", "Points"];
    const body = [];
    visible.forEach((m) => {
      if (!m.reasons.length) body.push([m.label, m.penalty, "", "", ""]);
      m.reasons.forEach((r) => body.push([m.label, m.penalty, r.recordNo, r.text || REASON_TYPE[r.type]?.label || r.type, r.points]));
    });
    const csv = [[`Compliance score`, `${score ?? ""}%`, band.text], [], head, ...body]
      .map((l) => l.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url; a.download = `QMS_Compliance_${to}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const w = data?.weights || {};
  const formula = `Score = 100 − penalties (overdue ×${w.overdue ?? 5}, critical open ×${w.critical ?? 5}, ageing > 30 d ×${w.aged ?? 2}, EM action excursions ×${w.excursion ?? 3})`;

  return (
    <div className="h-full w-full bg-[#f4f6fb] overflow-y-auto scrollbar-hide">
      <div className="p-[12px] flex flex-col gap-[11px] max-w-[1600px] mx-auto">

        {/* ═══════ HEADER ═══════ */}
        <div className="bg-white border border-[#dce6f7] rounded-[8px] shadow-[0_1px_3px_rgba(15,23,42,0.04)] overflow-hidden">
          <div className="px-[16px] py-[11px] flex flex-wrap items-center gap-3 border-b border-[#f0f3f8]">
            <div className="w-[30px] h-[30px] rounded-[7px] bg-[#f0f4fb] flex items-center justify-center shrink-0">
              <FaShieldAlt className="text-[13px] text-[#3b6fd4]" />
            </div>
            <div className="min-w-0">
              <h2 className="text-[15px] font-bold text-[#1e293b] leading-[19px]">Compliance Score</h2>
              <p className="text-[10.5px] text-[#94a3b8] leading-[13px]">
                {breakdown.length} modules assessed · {new Date(from).toLocaleDateString("en-IN")} — {new Date(to).toLocaleDateString("en-IN")}
                {data?.asOf && ` · updated ${new Date(data.asOf).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`}
              </p>
            </div>

            <div className="ml-auto flex items-center gap-1.5">
              <button onClick={exportCsv} title="Download audit CSV"
                      className="h-[30px] w-[30px] rounded-[6px] border border-[#dbe2ee] text-[#64748b] hover:border-[#2f9e7e] hover:text-[#2f9e7e] flex items-center justify-center">
                <FaFileCsv className="text-[11px]" />
              </button>
              <button onClick={() => window.print()} title="Print snapshot"
                      className="h-[30px] w-[30px] rounded-[6px] border border-[#dbe2ee] text-[#64748b] hover:border-[#3b6fd4] hover:text-[#3b6fd4] flex items-center justify-center">
                <FaPrint className="text-[11px]" />
              </button>
              <button onClick={load} disabled={loading}
                      className="h-[30px] px-[13px] text-[11.5px] font-semibold rounded-[6px] bg-[#3b6fd4] hover:bg-[#3260bd] text-white flex items-center gap-1.5 disabled:opacity-50">
                <FaSyncAlt className={`text-[10.5px] ${loading ? "animate-spin" : ""}`} />
                {loading ? "Loading" : "Refresh"}
              </button>
            </div>
          </div>

          <div className="px-[16px] py-[10px] bg-[#fafbfd] flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-[4px]">
              <label className="text-[9.5px] font-semibold uppercase tracking-[0.5px] text-[#94a3b8] flex items-center gap-1">
                <FaCalendarAlt className="text-[8px]" /> From
              </label>
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
                     className="h-[30px] px-[8px] text-[12.5px] border-[1.5px] border-[#dbe2ee] rounded-[6px] bg-white outline-none focus:border-[#3b6fd4]" />
            </div>
            <div className="flex flex-col gap-[4px]">
              <label className="text-[9.5px] font-semibold uppercase tracking-[0.5px] text-[#94a3b8]">To</label>
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
                     className="h-[30px] px-[8px] text-[12.5px] border-[1.5px] border-[#dbe2ee] rounded-[6px] bg-white outline-none focus:border-[#3b6fd4]" />
            </div>

            <div className="flex flex-col gap-[4px] min-w-[210px]">
              <label className="text-[9.5px] font-semibold uppercase tracking-[0.5px] text-[#94a3b8]">Find module or record</label>
              <div className="relative">
                <FaSearch className="absolute left-[9px] top-1/2 -translate-y-1/2 text-[10px] text-[#b6c2d6]" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. CAPA or DEV-2026-001"
                       className="h-[30px] w-full pl-[27px] pr-[26px] text-[12.5px] border-[1.5px] border-[#dbe2ee] rounded-[6px] bg-white outline-none focus:border-[#3b6fd4]" />
                {q && (
                  <button onClick={() => setQ("")} className="absolute right-[8px] top-1/2 -translate-y-1/2 text-[#b6c2d6] hover:text-[#64748b]">
                    <FaTimes className="text-[10px]" />
                  </button>
                )}
              </div>
            </div>

            <label className="flex items-center gap-1.5 mb-[6px] cursor-pointer select-none">
              <input type="checkbox" checked={onlyPenalised} onChange={(e) => setOnlyPenalised(e.target.checked)}
                     className="accent-[#3b6fd4] w-[13px] h-[13px]" />
              <span className="text-[11px] text-[#64748b] font-medium">Show only modules with findings</span>
            </label>
          </div>
        </div>

        {err && (
          <div className="bg-[#fbeded] border border-[#f0d2d2] text-[#a94848] rounded-[8px] px-[14px] py-[9px] text-[11.5px]">{err}</div>
        )}

        {/* ═══════ SCORE + BREAKDOWN ═══════ */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-[11px]">

          <ChartCard title="Overall Site Compliance" subtitle="Live score across all QMS modules" icon={<FaBalanceScale />}>
            <div className="flex flex-col items-center pt-1">
              <ScoreGauge score={score} band={band} delta={data?.delta} />

              <button onClick={() => setShowFormula(!showFormula)}
                      className="mt-3 text-[9.5px] text-[#94a3b8] hover:text-[#3b6fd4] flex items-center gap-1 text-center leading-[13px] px-2">
                <FaInfoCircle className="text-[9px] shrink-0" /> {formula}
              </button>

              {showFormula && (
                <div className="mt-2 w-full bg-[#fafbfd] border border-[#eef2f8] rounded-[6px] px-[10px] py-[8px]">
                  <div className="text-[9.5px] font-bold uppercase tracking-[0.5px] text-[#64748b] mb-1.5">Penalty weights</div>
                  {Object.entries(REASON_TYPE).map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between text-[10.5px] text-[#475569] py-[2px]">
                      <span className="flex items-center gap-1.5">
                        <span className="w-[6px] h-[6px] rounded-full" style={{ background: TONE[v.tone] }} />{v.label}
                      </span>
                      <span className="font-bold text-[#1e293b]">−{w[k] ?? (k === "aged" ? 2 : k === "excursion" ? 3 : 5)} per record</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between text-[10.5px] pt-1.5 mt-1.5 border-t border-[#eef2f8]">
                    <span className="text-[#64748b]">Total penalty applied</span>
                    <span className="font-bold text-[#c25a5a]">−{totalPenalty}</span>
                  </div>
                </div>
              )}

              <HistoryBars data={data?.history || []} />
            </div>
          </ChartCard>

          <ChartCard
            title="Penalty Breakdown by Module"
            subtitle="Every point deducted, traced to the record that caused it"
            icon={<FaExclamationTriangle />}
            className="xl:col-span-2"
            right={topDrivers.length > 0 && (
              <Chip tone="bad" title="Largest contributors">
                Top driver: {topDrivers[0].label} (−{topDrivers[0].penalty})
              </Chip>
            )}
            footer="Click a row to see the individual records behind the penalty; tick one to model the score after it is closed."
          >
            {!visible.length ? (
              <div className="h-[160px] flex flex-col items-center justify-center gap-1.5">
                <FaCheckCircle className="text-[22px] text-[#2f9e7e] opacity-40" />
                <span className="text-[11.5px] text-[#94a3b8]">
                  {loading ? "Loading…" : "No penalties in this period. Every module is inside its limits."}
                </span>
              </div>
            ) : (
              <div className="max-h-[430px] overflow-y-auto scrollbar-hide -mx-[2px]">
                <table className="w-full border-collapse">
                  <thead className="bg-[#fafbfd] sticky top-0 z-[1]">
                    <tr className="border-b border-[#e8edf6]">
                      <th className="px-[9px] py-[6px] text-left text-[9.5px] font-bold uppercase tracking-[0.5px] text-[#64748b]">Module</th>
                      <th className="px-[9px] py-[6px] text-center text-[9.5px] font-bold uppercase tracking-[0.5px] text-[#64748b] w-[70px]">Penalty</th>
                      <th className="px-[9px] py-[6px] text-left text-[9.5px] font-bold uppercase tracking-[0.5px] text-[#64748b]">Reasons</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((m) => {
                      const open = !!expanded[m.key];
                      return (
                        <>
                          <tr key={m.key} onClick={() => setExpanded((e) => ({ ...e, [m.key]: !e[m.key] }))}
                              className="border-b border-[#f2f5fa] hover:bg-[#f7faff] cursor-pointer h-[30px]">
                            <td className="px-[9px]">
                              <span className="flex items-center gap-1.5 text-[11.5px] font-semibold text-[#1e293b]">
                                {open ? <FaChevronDown className="text-[7px] text-[#94a3b8]" /> : <FaChevronRight className="text-[7px] text-[#94a3b8]" />}
                                {m.label}
                              </span>
                            </td>
                            <td className="px-[9px] text-center">
                              {m.penalty > 0 ? <Chip tone="bad">−{m.penalty}</Chip> : <Chip tone="good">0</Chip>}
                            </td>
                            <td className="px-[9px] text-[10.5px] text-[#64748b] truncate max-w-0">
                              {m.reasons.slice(0, 2).map((r) => r.recordNo).join(", ")}
                              {m.reasons.length > 2 && ` +${m.reasons.length - 2} more`}
                              {!m.reasons.length && "—"}
                            </td>
                          </tr>

                          {open && m.reasons.map((r) => {
                            const id = `${m.key}|${r.recordNo}|${r.type}`;
                            const t = REASON_TYPE[r.type] || { label: r.type, tone: "warn" };
                            return (
                              <tr key={id} className="bg-[#fafbfd] border-b border-[#f2f5fa] h-[28px]">
                                <td className="px-[9px] pl-[26px]">
                                  <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input type="checkbox" checked={!!fixed[id]}
                                           onChange={(e) => setFixed((f) => ({ ...f, [id]: e.target.checked }))}
                                           className="accent-[#2f9e7e] w-[12px] h-[12px]" />
                                    <span onClick={(e) => { e.preventDefault(); onOpenRecord?.(m.key, r.recordNo); }}
                                          className="text-[11px] font-semibold text-[#3b6fd4] hover:underline">
                                      {r.recordNo}
                                    </span>
                                  </label>
                                </td>
                                <td className="px-[9px] text-center text-[10.5px] font-bold text-[#c25a5a]">−{r.points}</td>
                                <td className="px-[9px]">
                                  <span className="flex items-center gap-2">
                                    <Chip tone={t.tone}>{t.label}</Chip>
                                    <span className="text-[10px] text-[#64748b] truncate">{r.text}</span>
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </ChartCard>
        </div>

        {/* ═══════ IMPACT SIMULATOR ═══════ */}
        {fixedPoints > 0 && (
          <div className="bg-white border border-[#cfe3d9] rounded-[8px] shadow-[0_1px_3px_rgba(15,23,42,0.04)] px-[14px] py-[10px] flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-2 text-[11.5px] font-bold text-[#1e293b]">
              <FaMagic className="text-[12px] text-[#2f9e7e]" /> Impact if these records are closed
            </span>
            <span className="flex items-center gap-2">
              <span className="text-[11px] text-[#64748b]">{score}%</span>
              <FaArrowUp className="text-[9px] text-[#2f9e7e]" />
              <span className="text-[18px] font-bold leading-[20px]" style={{ color: TONE[projBand.tone] }}>{projected}%</span>
              <Chip tone={projBand.tone}>{projBand.text}</Chip>
            </span>
            <span className="text-[10.5px] text-[#64748b]">
              {Object.values(fixed).filter(Boolean).length} record(s) selected · +{fixedPoints} points recovered
            </span>
            <button onClick={() => setFixed({})}
                    className="ml-auto h-[26px] px-[11px] text-[11px] font-semibold rounded-[5px] border border-[#dbe2ee] text-[#64748b] hover:border-[#3b6fd4] hover:text-[#3b6fd4] flex items-center gap-1.5">
              <FaUndo className="text-[9px]" /> Clear selection
            </button>
          </div>
        )}

        {/* ═══════ REGULATORY CHECKLIST ═══════ */}
        <div className="bg-white border border-[#dce6f7] rounded-[8px] shadow-[0_1px_3px_rgba(15,23,42,0.04)] overflow-hidden">
          <div className="px-[12px] h-[30px] bg-[#eef3fb] border-b border-[#dce6f7] flex items-center gap-[7px]">
            <FaClipboardCheck className="text-[11px] text-[#3b6fd4]" />
            <h3 className="text-[11px] font-bold uppercase tracking-[0.6px] text-[#2f63c4] flex-1">Regulatory Alignment Checklist</h3>
            <span className="text-[10px] text-[#94a3b8]">{metCount} of {REG_CHECKLIST.length} fully met</span>
          </div>

          <div className="px-[14px] py-[8px] bg-[#fafbfd] border-b border-[#f0f3f8] flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-[180px] h-[6px] rounded-full bg-[#eef2f8] overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700"
                   style={{ width: `${(metCount / REG_CHECKLIST.length) * 100}%`, background: TONE.good }} />
            </div>
            <div className="flex gap-[3px] p-[2px] bg-[#eef2f9] rounded-[6px]">
              {["all", "Met", "Partial", "Gap"].map((k) => (
                <button key={k} onClick={() => setCheckFilter(k)}
                        className={`h-[24px] px-[11px] text-[11px] font-semibold rounded-[4px] ${
                          checkFilter === k ? "bg-white text-[#3b6fd4] shadow-[0_1px_2px_rgba(15,23,42,0.08)]" : "text-[#64748b] hover:text-[#1e293b]"}`}>
                  {k === "all" ? "All" : k}
                </button>
              ))}
            </div>
          </div>

          <table className="w-full border-collapse">
            <thead className="bg-[#fafbfd] border-b border-[#e8edf6]">
              <tr>
                <th className="px-[12px] py-[7px] text-left text-[9.5px] font-bold uppercase tracking-[0.5px] text-[#64748b] w-[38%]">Requirement</th>
                <th className="px-[12px] py-[7px] text-left text-[9.5px] font-bold uppercase tracking-[0.5px] text-[#64748b]">eQMS provision</th>
                <th className="px-[12px] py-[7px] text-center text-[9.5px] font-bold uppercase tracking-[0.5px] text-[#64748b] w-[80px]">Status</th>
              </tr>
            </thead>
            <tbody>
              {checklist.map((c, i) => (
                <tr key={i} className="border-b border-[#f2f5fa] hover:bg-[#f7faff]">
                  <td className="px-[12px] py-[7px] text-[11px] font-semibold text-[#1e293b] leading-[15px]">{c.req}</td>
                  <td className="px-[12px] py-[7px] text-[11px] text-[#3b6fd4] leading-[15px]">{c.prov}</td>
                  <td className="px-[12px] py-[7px] text-center"><Chip tone={CHECK_TONE[c.status]}>{c.status}</Chip></td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="px-[14px] py-[8px] bg-[#fafbfd] border-t border-[#f0f3f8]">
            <p className="text-[9.5px] text-[#94a3b8] leading-[13px]">
              This mapping documents which eQMS control satisfies each requirement. It is a configured control, not a live measurement — review it whenever a module or regulation changes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}