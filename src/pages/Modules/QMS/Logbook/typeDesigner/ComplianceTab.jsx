import * as FaIcons from "react-icons/fa";
import { Panel } from "./atoms";

const ROWS = [["errors", FaIcons.FaTimesCircle, "text-[#dc2626]"], ["warns", FaIcons.FaExclamationTriangle, "text-amber-500"], ["infos", FaIcons.FaInfoCircle, "text-[#1a56db]"], ["oks", FaIcons.FaCheckCircle, "text-emerald-500"]];

/* ALCOA+ guidance — blocking items stop Save / Submit; the rest is for QA to judge */
export default function ComplianceTab({ analysis, onPick }) {
  const n = { e: analysis.errors.length, w: analysis.warns.length, o: analysis.oks.length };
  return (
    <Panel title="Compliance check · ALCOA+" icon={FaIcons.FaShieldAlt} bodyClass="p-3.5 flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-2.5">
        {[["Blocking", n.e, "text-[#dc2626] bg-red-50 border-red-200"], ["Warnings", n.w, "text-amber-600 bg-amber-50 border-amber-200"], ["Passed", n.o, "text-emerald-600 bg-emerald-50 border-emerald-200"]].map(([l, v, c]) => (
          <div key={l} className={`rounded-[7px] border px-3 py-2 ${c}`}><div className="text-[22px] font-bold leading-none">{v}</div><div className="text-[11px] font-semibold mt-1">{l}</div></div>
        ))}
      </div>
      <div className="rounded-[7px] border border-[#e3e9f4] divide-y divide-[#eef1f8]">
        {ROWS.flatMap(([k, I, cls]) => analysis[k].map((r, i) => (
          <div key={`${k}${i}`} className={`flex items-start gap-2.5 px-3 py-2 text-[12.5px] text-[#1e293b] ${r.id ? "cursor-pointer hover:bg-[#f4f7fc]" : ""}`} onClick={() => r.id && onPick(r.id)}>
            <I size={13} className={`mt-0.5 shrink-0 ${cls}`} />
            <span className="flex-1">{r.t}{r.id && <span className="ml-1.5 text-[11px] text-[#1a56db] font-semibold">Go to field →</span>}</span>
            {r.tag && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#eef2fa] text-[#5b6b85] whitespace-nowrap">{r.tag}</span>}
          </div>
        )))}
      </div>
      <div className="text-[11.5px] text-[#64748b]">Guidance against ALCOA+ data-integrity principles (attributable, legible, contemporaneous, original, accurate, complete). It does not replace your validation and change-control process.</div>
    </Panel>
  );
}