import { useMemo, useState, memo } from "react";
import { AlertTriangle, Clock, Phone, Mail, Inbox, ChevronDown, Filter } from "lucide-react";
import { inrS, dmy, toD } from "../../../../utils/helpers";
import ExportMenu from "./ExportMenu";

/* Follow-up rules. These belong in an ALERT_RULE_CONFIG table (the spec's
   "IF order meets pending/follow-up rule" — thresholds must be configurable).
   Until that table exists, this is the single place to control them. */
const RULES = {
  critical: { days: 90, label: "Critical", cls: "bg-rose-50 border-rose-200 text-rose-700",    dot: "bg-rose-500"   },
  high:     { days: 60, label: "High",     cls: "bg-orange-50 border-orange-200 text-orange-700", dot: "bg-orange-500" },
  medium:   { days: 30, label: "Medium",   cls: "bg-amber-50 border-amber-200 text-amber-700",  dot: "bg-amber-500"  },
  low:      { days: 0,  label: "Low",      cls: "bg-slate-50 border-slate-200 text-slate-600",  dot: "bg-slate-400"  },
};
const SEVERITY_ORDER = ["critical", "high", "medium", "low"];
const EXPORT_COLS = [
  { key: (o) => RULES[o.sev]?.label, label: "Severity" },
  { key: "ord",   label: "Order No" },
  { key: "dt",    label: "Order Date", type: "date" },
  { key: "days",  label: "Open Days", type: "int" },
  { key: "cust",  label: "Customer" },
  { key: "city",  label: "City" },
  { key: "state", label: "State" },
  { key: "pay",   label: "Pay Terms" },
  { key: "qo",    label: "Qty Ordered", type: "int" },
  { key: "supplied", label: "Qty Supplied", type: "int" },
  { key: "balance",  label: "Qty Balance", type: "int" },
  { key: "pct",   label: "Fulfilled %", type: "pct" },
  { key: "amt",   label: "Order Value (₹)", type: "num" },
  { key: "atRisk", label: "Value at Risk (₹)", type: "num" },
  { key: "contact", label: "Contact" },
  { key: "mobile",  label: "Mobile" },
  { key: "email",   label: "Email" },
  { key: (o) => (o.items || []).join("; "), label: "Items" },
];

function severityOf(days) {
  if (days >= RULES.critical.days) return "critical";
  if (days >= RULES.high.days) return "high";
  if (days >= RULES.medium.days) return "medium";
  return "low";
}

/* Line rows -> order rows. Source of fulfillment:
   invQty (actual invoiced qty from FIN_SALES) preferred, SALE_QTY as fallback.
   Why: the SALE_QTY write-back never ran for orders before Dec-2025 — they are
   all 0 even though they were invoiced. Trusting that field made ~26k legacy
   lines show as "100% pending", which is wrong.
   NOTE: invQty is ORDER-level (sum of all items), so it is read once, never
   summed per line. Per-item fulfillment cannot be derived from it. */
function buildPendingOrders(rows, refDate) {
  const m = new Map();

  for (const r of rows) {
    if (r.cancelDt) continue;              // cancelled orders need no follow-up
    let o = m.get(r.ord);
    if (!o) {
      o = {
        ord: r.ord, dt: r.dt, cust: r.cust, custId: r.custId,
        city: r.city, state: r.state, pay: r.pay,
        contact: r.contact, mobile: r.mobile, email: r.email,
        qo: 0, qsField: 0, amt: 0, balAmt: 0,
        invQty: r.invQty ?? null,          // order-level — sum NAHI
        comple: "Y", items: [],
      };
      m.set(r.ord, o);
    }
    o.qo += r.qo || 0;
    o.qsField += r.qs || 0;
    o.amt += r.amt || 0;
    if ((r.qb || 0) > 0) o.balAmt += (r.qb || 0) * (r.rate || 0);
    if (r.comple === "N") o.comple = "N";
    if (r.item) o.items.push(r.item);
  }

  const out = [];
  for (const o of m.values()) {
    const supplied = o.invQty != null ? o.invQty : o.qsField;
    const balance = Math.max(0, o.qo - supplied);
    if (balance <= 0) continue;            // fully supplied — no alert

    const days = o.dt ? Math.round((toD(refDate) - toD(o.dt)) / 86400000) : 0;
    const pct = o.qo > 0 ? (supplied / o.qo) * 100 : 0;

    out.push({
      ...o,
      supplied,
      balance,
      pct,
      days,
      sev: severityOf(days),
      // value at risk — balance qty ka proportionate order value
      atRisk: o.qo > 0 ? (balance / o.qo) * o.amt : 0,
      derived: o.invQty != null,           // invoice se nikala ya field se
    });
  }

  // severity first, then value at risk — the costliest critical order on top
  return out.sort(
    (a, b) =>
      SEVERITY_ORDER.indexOf(a.sev) - SEVERITY_ORDER.indexOf(b.sev) ||
      b.atRisk - a.atRisk
  );
}

function PendingOrderAlerts({ rows, refDate, initialLimit = 15 }) {
  const [sevFilter, setSevFilter] = useState("");
  const [limit, setLimit] = useState(initialLimit);

  const all = useMemo(() => buildPendingOrders(rows, refDate), [rows, refDate]);

  const counts = useMemo(() => {
    const c = { critical: 0, high: 0, medium: 0, low: 0 };
    const v = { critical: 0, high: 0, medium: 0, low: 0 };
    for (const o of all) { c[o.sev]++; v[o.sev] += o.atRisk; }
    return { c, v };
  }, [all]);

  const list = useMemo(
    () => (sevFilter ? all.filter((o) => o.sev === sevFilter) : all),
    [all, sevFilter]
  );

  const shown = list.slice(0, limit);
  const totalAtRisk = useMemo(() => all.reduce((s, o) => s + o.atRisk, 0), [all]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <AlertTriangle className="h-3.5 w-3.5" strokeWidth={2.5} />
          </span>
          <h4 className="text-[13px] font-bold tracking-tight text-slate-700">Pending Order Follow-up</h4>
          {all.length > 0 && (
            <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10.5px] font-semibold text-slate-500">
              {inrS(totalAtRisk)} at risk
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {sevFilter && (
            <button
              onClick={() => setSevFilter("")}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-500 hover:bg-slate-50"
            >
              <Filter className="h-3 w-3" /> Clear
            </button>
          )}
          {/* exports the whole list for the active severity, not only the rows shown */}
          <ExportMenu title={sevFilter ? `Pending Orders - ${RULES[sevFilter].label}` : "Pending Order Follow-up"} id="pending-alerts" columns={EXPORT_COLS} rows={list} />
        </div>
      </div>

      {/* Severity summary — clickable filter */}
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {SEVERITY_ORDER.map((k) => {
          const r = RULES[k];
          const active = sevFilter === k;
          return (
            <button
              key={k}
              onClick={() => setSevFilter(active ? "" : k)}
              className={`rounded-xl border px-3 py-2.5 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${r.cls} ${
                active ? "ring-2 ring-indigo-400 ring-offset-1" : "hover:shadow-sm"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${r.dot}`} />
                <span className="text-[10.5px] font-bold uppercase tracking-wide">{r.label}</span>
              </div>
              <div className="mt-1 text-xl font-extrabold leading-none">{counts.c[k]}</div>
              <div className="mt-1 text-[10.5px] opacity-75">
                {k === "low" ? `< ${RULES.medium.days}d` : `${r.days}d+`} · {inrS(counts.v[k])}
              </div>
            </button>
          );
        })}
      </div>

      {shown.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-1.5 py-12 text-slate-300">
          <Inbox className="h-7 w-7" strokeWidth={1.5} />
          <span className="text-xs font-medium text-slate-400">
            {sevFilter ? `Koi ${RULES[sevFilter].label} order nahi` : "Koi pending order nahi"}
          </span>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-slate-100">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-3 py-2.5 sm:px-4">Order</th>
                  <th className="px-3 py-2.5 sm:px-4">Customer</th>
                  <th className="px-3 py-2.5 text-right sm:px-4">Open</th>
                  <th className="hidden px-4 py-2.5 text-right md:table-cell">Fulfilled</th>
                  <th className="px-3 py-2.5 text-right sm:px-4">At Risk</th>
                  <th className="hidden px-4 py-2.5 lg:table-cell">Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {shown.map((o) => {
                  const r = RULES[o.sev];
                  return (
                    <tr key={o.ord} className="transition-colors hover:bg-amber-50/40">
                      <td className="px-3 py-2.5 sm:px-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${r.dot}`} />
                          <span className="font-semibold text-slate-800">{o.ord}</span>
                        </div>
                        <div className="mt-0.5 text-[11px] text-slate-400">{dmy(o.dt)}</div>
                      </td>
                      <td className="max-w-[160px] px-3 py-2.5 sm:px-4">
                        <div className="truncate text-slate-800" title={o.cust}>{o.cust}</div>
                        <div className="truncate text-[11px] text-slate-400">
                          {o.city}{o.pay ? ` · ${o.pay}` : ""}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-right sm:px-4">
                        <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-slate-700">
                          <Clock className="h-3 w-3 text-slate-400" />{o.days}d
                        </span>
                      </td>
                      <td className="hidden px-4 py-2.5 text-right md:table-cell">
                        <div className="text-[12px] font-medium text-slate-700">{o.pct.toFixed(0)}%</div>
                        <div className="mt-1 ml-auto h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full ${o.pct >= 75 ? "bg-emerald-500" : o.pct >= 40 ? "bg-amber-500" : "bg-rose-400"}`}
                            style={{ width: `${Math.min(100, o.pct)}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-right sm:px-4">
                        <div className="font-semibold text-slate-800">{inrS(o.atRisk)}</div>
                        <div className="text-[11px] text-slate-400">
                          {Math.round(o.balance).toLocaleString("en-IN")} qty
                        </div>
                      </td>
                      <td className="hidden px-4 py-2.5 lg:table-cell">
                        {o.contact && <div className="text-[12px] text-slate-700">{o.contact}</div>}
                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                          {o.mobile && (
                            <a href={`tel:${o.mobile}`} className="inline-flex items-center gap-1 hover:text-indigo-600">
                              <Phone className="h-3 w-3" />{o.mobile}
                            </a>
                          )}
                          {o.email && (
                            <a href={`mailto:${o.email}`} title={o.email} className="inline-flex items-center gap-1 hover:text-indigo-600">
                              <Mail className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <p className="text-[11px] text-slate-400">
              Showing {shown.length} of {list.length.toLocaleString("en-IN")} pending orders
            </p>
            {shown.length < list.length && (
              <button
                onClick={() => setLimit((l) => l + 25)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-semibold text-slate-600 transition-colors hover:bg-slate-50"
              >
                Show more <ChevronDown className="h-3 w-3" />
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default memo(PendingOrderAlerts);