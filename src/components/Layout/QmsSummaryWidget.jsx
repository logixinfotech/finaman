// // components/Layout/HomeDashboard/widgets/QmsSummaryWidget.jsx
// // Compact card — NOT the full MyWork page, just the KPI strip + top 3
// // overdue records, so it fits a dashboard tile. "Open My Work" jumps to
// // the full page.
// import { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { getMyWork } from "../../pages/Modules/QMS/Utils/QmsAPI";
 
// import { useOpenQmsModule } from "../../pages/Modules/QMS/QMSIntent/opneQMSModule"; // same helper My Work uses

// export default function QmsSummaryWidget() {
//   const [d, setD] = useState(null);
//   const [err, setErr] = useState("");
//   const navigate = useNavigate();
//   const openModule = useOpenQmsModule(navigate);

//   useEffect(() => {
//     getMyWork()
//       .then((r) => (r?.success ? setD(r) : setErr(r?.message || "Could not load")))
//       .catch((e) => setErr(e.message));
//   }, []);

//   if (err) return <Card title="QMS — My Work"><p className="text-xs text-gray-400">{err}</p></Card>;
//   if (!d) return <Card title="QMS — My Work"><p className="text-xs text-gray-400">Loading…</p></Card>;

//   const top = (d.needs || []).filter((r) => r.exclusive).slice(0, 3);

//   return (
//     <Card title="QMS — My Work">
//          <div className="flex flex-col h-full"> 
//       <div className="grid grid-cols-3 gap-2 mb-3">
//         <Stat label="Pending" value={d.kpi.pending} />
//         <Stat label="Overdue" value={d.kpi.overdue} tone="r" />
//         <Stat label="Due 7d" value={d.kpi.due7} tone="a" />
//       </div>
//       </div>
//       {top.length > 0 ? (
//         <ul className="space-y-1">
//           {top.map((r) => (
//             <li key={r.module + r.id} className="text-[11.5px] text-gray-600 flex justify-between">
//               <span className="truncate">{r.recordNo} · {r.stage}</span>
//               <span className={r.dueIn < 0 ? "text-red-500 font-medium" : "text-gray-400"}>
//                 {r.dueIn < 0 ? `${-r.dueIn}d over` : `${r.dueIn}d`}
//               </span>
//             </li>
//           ))}
//         </ul>
//       ) : (
//         <p className="text-[11.5px] text-gray-400">Nothing urgent right now.</p>
//       )}
//       <button
//         onClick={() => navigate("/app?page=Maindashboard")} 
//         className="mt-3 text-[11.5px] font-semibold text-[#0f5c6e]"
//       >
//         Open My Work →
//       </button>
//     </Card>
//   );
// }

// const Card = ({ title, children }) => (
//   <div className="h-full bg-white rounded-xl border border-gray-100 p-3.5 flex flex-col">
//     <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-2">{title}</p>
//     {children}
//   </div>
// );
// const Stat = ({ label, value, tone }) => (
//   <div>
//     <p className={`text-xl font-bold ${tone === "r" ? "text-red-500" : tone === "a" ? "text-amber-500" : "text-gray-800"}`}>
//       {value}
//     </p>
//     <p className="text-[10px] text-gray-400">{label}</p>
//   </div>
// );
// components/Layout/HomeDashboard/QmsSummaryWidget.jsx
// Outer card + title WidgetFrame deta hai. Yahan sirf content.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaRedo, FaChevronRight } from "react-icons/fa";
import { getMyWork } from "../../pages/Modules/QMS/Utils/QmsAPI";
import { setQmsIntent } from "../../pages/Modules/QMS/QMSIntent/QMSintent";
import { useOpenQmsModule } from "../../pages/Modules/QMS/QMSIntent/opneQMSModule";

const REFRESH_MS = 5 * 60 * 1000;

/* ---- same helpers as MyWork, so wording stays consistent ---- */
const sev = (s) => (/^(critical|high)$/i.test(s) ? "r" : /^major$/i.test(s) ? "a" : /^(minor|low)$/i.test(s) ? "g" : "n");
const tone = (r) => (r.dueIn == null ? "" : r.dueIn < 0 ? "r" : r.dueIn <= 3 ? "a" : "");
const dueText = (r) =>
  r.dueIn == null ? "No date" : r.dueIn < 0 ? `${-r.dueIn}d overdue` : r.dueIn === 0 ? "Due today" : `${r.dueIn}d left`;
// most urgent first, records without a date last
const byUrgency = (a, b) => (a.dueIn ?? 9999) - (b.dueIn ?? 9999);

const CHIP = {
  r: "bg-red-50 text-red-600",
  a: "bg-amber-50 text-amber-700",
  g: "bg-emerald-50 text-emerald-700",
  n: "bg-gray-100 text-gray-500",
};
const MARK = { r: "bg-red-500", a: "bg-amber-400", "": "bg-gray-200" };
const DUE = { r: "text-red-500", a: "text-amber-600", "": "text-gray-400" };

/**
 * Props
 *  - limit:       rows to show (default 4)
 *  - onOpenPage:  same prop MyWork receives — pass it from the dashboard if you have it
 *  - myWorkPage:  appl_name of the full My Work page (CONFIRM this value)
 */
export default function QmsSummaryWidget({ limit = 4, onOpenPage, myWorkPage = "QmsMyWork" }) {
  const navigate = useNavigate();
  const openModule = useOpenQmsModule(onOpenPage || navigate);
  const lastGo = useRef(0);

  const [d, setD] = useState(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState("needs");
  const alive = useRef(true);

  const load = useCallback(async (silent = false) => {
    if (!silent) setBusy(true);
    try {
      const r = await getMyWork();
      if (!alive.current) return;
      if (!r?.success) throw new Error(r?.message || "Could not load your work");
      setD(r);
      setErr("");
    } catch (e) {
      // on a silent background refresh keep showing the old data
      if (alive.current && !silent) setErr(e.message || "Could not load your work");
    } finally {
      if (alive.current) setBusy(false);
    }
  }, []);

  useEffect(() => {
    alive.current = true;
    load();
    const t = setInterval(() => load(true), REFRESH_MS);
    return () => { alive.current = false; clearInterval(t); };
  }, [load]);

  const go = (module, intent) => {
    if (Date.now() - lastGo.current < 800) return; // double-click guard (same as MyWork)
    lastGo.current = Date.now();
    setQmsIntent({ module, ...intent, at: Date.now() });
    openModule(module);
  };

  const k = d?.kpi || {};
  const lists = useMemo(() => ({
    needs: (d?.needs || []).filter((r) => r.exclusive).sort(byUrgency),
    waiting: [...(d?.waiting || [])].sort(byUrgency),
  }), [d]);
  const rows = lists[tab].slice(0, limit);
  const more = Math.max(0, lists[tab].length - rows.length);

  /* ---------- states ---------- */
  if (!d && !err) {
    return (
      <div className="animate-pulse space-y-3" aria-busy="true">
        <div className="h-2 rounded-full bg-gray-100" />
        <div className="grid grid-cols-3 gap-2">{[0, 1, 2].map((i) => <div key={i} className="h-14 rounded-lg bg-gray-100" />)}</div>
        {[0, 1, 2].map((i) => <div key={i} className="h-8 rounded-md bg-gray-100" />)}
      </div>
    );
  }
  if (err && !d) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-2 text-center">
        <p className="text-xs text-gray-500">{err}</p>
        <button onClick={() => load()} className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-[#0f5c6e]">
          <FaRedo size={9} className={busy ? "animate-spin" : ""} /> Try again
        </button>
      </div>
    );
  }

  const pending = k.pending || 0;
  const onTrack = Math.max(0, pending - (k.overdue || 0) - (k.due7 || 0));
  const pct = (n) => (pending ? (n / pending) * 100 : 0);

  return (
    <div className="h-full flex flex-col gap-3 min-h-0">
      {/* urgency strip */}
      {pending > 0 && (
        <div
          className="flex h-2 rounded-full overflow-hidden bg-gray-100 gap-0.5 flex-shrink-0"
          role="img"
          aria-label={`${k.overdue} overdue, ${k.due7} due in 7 days, ${onTrack} on track`}
        >
          <span className="bg-red-500" style={{ width: pct(k.overdue) + "%" }} />
          <span className="bg-amber-400" style={{ width: pct(k.due7) + "%" }} />
          <span className="bg-emerald-400/70" style={{ width: pct(onTrack) + "%" }} />
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-2 flex-shrink-0">
        <Kpi label="Pending" value={k.pending ?? 0} />
        <Kpi label="Overdue" value={k.overdue ?? 0} tone="r" />
        <Kpi label="Due in 7d" value={k.due7 ?? 0} tone="a" />
      </div>

      {/* tabs */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="inline-flex rounded-lg bg-gray-100 p-0.5" role="tablist">
          {[["needs", "Needs my action"], ["waiting", "Waiting"]].map(([key, label]) => (
            <button
              key={key}
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                tab === key ? "bg-white text-[#0f5c6e] shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {label} <span className="opacity-60">{lists[key].length}</span>
            </button>
          ))}
        </div>
        <button
          onClick={() => load()}
          title="Refresh"
          className="p-1.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100"
        >
          <FaRedo size={10} className={busy ? "animate-spin" : ""} />
        </button>
      </div>

      {/* list */}
      <div className="flex-1 min-h-0 overflow-auto -mx-1 px-1">
        {rows.length === 0 ? (
          <p className="h-full flex items-center justify-center text-[11.5px] text-gray-400 text-center">
            {tab === "needs" ? "Nothing is waiting on you 🎉" : "You are not waiting on anyone."}
          </p>
        ) : (
          <ul className="space-y-1">
            {rows.map((r) => {
              const t = tone(r);
              return (
                <li key={r.module + r.id}>
                  <button
                    onClick={() => go(r.module, { type: "open", id: r.id })}
                    className="group w-full flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-left hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f5c6e]"
                  >
                    <span className={`self-stretch w-1 rounded-full flex-shrink-0 ${MARK[t]}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <b className="text-[12px] text-gray-800 truncate">{r.recordNo}</b>
                        {r.severity && (
                          <span className={`text-[9.5px] font-semibold rounded px-1.5 py-px flex-shrink-0 ${CHIP[sev(r.severity)]}`}>
                            {r.severity}
                          </span>
                        )}
                      </div>
                      <p className="text-[10.5px] text-gray-400 truncate">
                        {[r.moduleLabel, r.stage].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <span className={`text-[11px] font-semibold flex-shrink-0 ${DUE[t]}`}>{dueText(r)}</span>
                    <FaChevronRight size={8} className="text-gray-300 group-hover:text-gray-500 flex-shrink-0" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* footer */}
      <div className="flex items-center justify-between flex-shrink-0 pt-2 border-t border-gray-100">
        <button
          onClick={() => navigate(`/app?page=${myWorkPage}`)}
          className="text-[11.5px] font-semibold text-[#0f5c6e] hover:underline"
        >
          Open My Work →
        </button>
        {more > 0 && <span className="text-[10.5px] text-gray-400">+{more} more</span>}
      </div>
    </div>
  );
}

const TONES = { r: "text-red-500", a: "text-amber-500" };
const Kpi = ({ label, value, tone }) => (
  <div className="rounded-lg border border-gray-100 bg-gray-50/60 px-2.5 py-2 min-w-0">
    <p className={`text-xl font-bold leading-none tabular-nums ${TONES[tone] || "text-gray-800"}`}>{value}</p>
    <p className="text-[10px] text-gray-400 mt-1 truncate">{label}</p>
  </div>
);