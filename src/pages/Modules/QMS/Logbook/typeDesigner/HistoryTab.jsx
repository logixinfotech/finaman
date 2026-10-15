import { useEffect, useState } from "react";
import * as FaIcons from "react-icons/fa";
import { Btn, Pill, erp, fmtDateTime } from "../LogbookUi";
import { getTypeVersion } from "../../Utils/LogbookAPI";
import { TPL_STATUS, diffDefinitions } from "./model";
import { Panel, inputS } from "./atoms";

const Who = ({ by, at }) => (by ? <span className="leading-tight"><span className="block">{by}</span><span className="block text-[10.5px] text-[#64748b]">{fmtDateTime(at)}</span></span> : <span className="text-[#cbd5e1]">—</span>);
export const DiffList = ({ diff }) => {
  const ic = { add: ["text-emerald-600", FaIcons.FaPlus], mod: ["text-[#1a56db]", FaIcons.FaPen], del: ["text-[#dc2626]", FaIcons.FaMinus] };
  if (!diff.length) return <div className="px-3 py-3 text-[12.5px] text-[#94a3b8]">No differences.</div>;
  return diff.map((d, i) => { const [cls, I] = ic[d.k]; return <div key={i} className="flex items-start gap-2 px-3 py-1.5 text-[12.5px] text-[#1e293b]"><I size={9} className={`mt-1 shrink-0 ${cls}`} />{d.t}</div>; });
};

/* Every version of the template — who changed what, why, who approved it, how many registers use it */
export default function HistoryTab({ typeKey, versions, viewVer, onView }) {
  const shown = versions.filter((v) => v.Status !== "Discarded");
  const [a, setA] = useState(""); const [b, setB] = useState("");
  const [diff, setDiff] = useState(null); const [busy, setBusy] = useState(false);
  const [showDiscarded, setShowDiscarded] = useState(false);

  useEffect(() => {   // default compare: previous effective → newest
    if (shown.length >= 2) { setA(String(shown[1].VersionNo)); setB(String(shown[0].VersionNo)); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [versions]);

  const compare = async () => {
    if (!a || !b || a === b) return;
    setBusy(true);
    try {
      const [ra, rb] = await Promise.all([getTypeVersion(typeKey, a), getTypeVersion(typeKey, b)]);
      setDiff(diffDefinitions(ra?.definition, rb?.definition));
    } finally { setBusy(false); }
  };
  const rows = showDiscarded ? versions : shown;

  return (
    <div className="flex flex-col gap-[10px]">
      <Panel title="Version history" icon={FaIcons.FaHistory} bodyClass="p-0"
        right={versions.length !== shown.length && <label className="text-[11px] text-[#5b6b85] flex items-center gap-1.5"><input type="checkbox" checked={showDiscarded} onChange={(e) => setShowDiscarded(e.target.checked)} /> Show discarded drafts</label>}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr>{["Version", "Status", "Reason for change", "Prepared by", "Submitted", "Approved / reviewed", "Registers", ""].map((h) => <th key={h} className={erp.th}>{h}</th>)}</tr></thead>
            <tbody>
              {rows.map((v) => {
                const st = TPL_STATUS[v.Status] || TPL_STATUS.Draft; const on = v.VersionNo === viewVer;
                return (
                  <tr key={v.Id} className={on ? "bg-[#f0f5ff]" : "hover:bg-[#fafbfd]"}>
                    <td className={`${erp.td} font-bold whitespace-nowrap`}>v{v.VersionNo}</td>
                    <td className={erp.td}><Pill tone={st.tone}>{st.l}</Pill>{v.EffectiveFrom && <div className="text-[10.5px] text-[#64748b] mt-0.5">from {fmtDateTime(v.EffectiveFrom)}</div>}</td>
                    <td className={`${erp.td} max-w-[280px]`}>
                      {v.ChangeReason || <span className="text-[#cbd5e1]">—</span>}
                      {v.ReviewComment && <div className="text-[11px] text-[#5b6b85] mt-0.5"><FaIcons.FaCommentAlt size={9} className="inline -mt-0.5 mr-1" />{v.ReviewComment}</div>}
                    </td>
                    <td className={erp.td}><Who by={v.UpdatedBy || v.CreatedBy} at={v.UpdatedAt || v.CreatedAt} /></td>
                    <td className={erp.td}><Who by={v.SubmittedBy} at={v.SubmittedAt} /></td>
                    <td className={erp.td}><Who by={v.ApprovedBy || v.ReviewedBy} at={v.ApprovedAt || v.ReviewedAt} /></td>
                    <td className={erp.td}>{v.registers ? <span>{v.registers}{v.activeRegisters ? <span className="text-[11px] text-[#5b6b85]"> ({v.activeRegisters} active)</span> : ""}</span> : "0"}</td>
                    <td className={`${erp.td} text-right`}>{v.Status !== "Discarded" && !on && <Btn className="!h-[26px] !text-[11.5px]" onClick={() => onView(v.VersionNo)}><FaIcons.FaEye size={10} /> View</Btn>}{on && <span className="text-[11px] font-semibold text-[#1a56db]">Viewing</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      {shown.length >= 2 && (
        <Panel title="Compare versions" icon={FaIcons.FaExchangeAlt} bodyClass="p-0"
          right={<div className="flex items-center gap-1.5">
            <select className={`${inputS} !w-[90px] !h-[26px]`} value={a} onChange={(e) => { setA(e.target.value); setDiff(null); }}>{shown.map((v) => <option key={v.Id} value={v.VersionNo}>v{v.VersionNo}</option>)}</select>
            <FaIcons.FaArrowRight size={10} className="text-[#94a3b8]" />
            <select className={`${inputS} !w-[90px] !h-[26px]`} value={b} onChange={(e) => { setB(e.target.value); setDiff(null); }}>{shown.map((v) => <option key={v.Id} value={v.VersionNo}>v{v.VersionNo}</option>)}</select>
            <Btn kind="primary" className="!h-[26px] !text-[11.5px]" disabled={busy || a === b} onClick={compare}>{busy ? "…" : "Compare"}</Btn>
          </div>}>
          <div className="divide-y divide-[#eef1f8]">{diff ? <DiffList diff={diff} /> : <div className="px-3 py-3 text-[12.5px] text-[#94a3b8]">Pick two versions and press Compare.</div>}</div>
        </Panel>
      )}
    </div>
  );
}