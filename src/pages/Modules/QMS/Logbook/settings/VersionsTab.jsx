import { useEffect, useState } from "react";
import * as FaIcons from "react-icons/fa";
import { fmtDateTime } from "../LogbookUi";
import { getTypeVersion } from "../../Utils/LogbookAPI";
import { TPL_STATUS, diffDefinitions } from "./model";
import { Card, Badge, Button, Empty, inpSm } from "./ui";

const TONE = { Effective: "green", Draft: "amber", InReview: "blue", Superseded: "gray", Discarded: "gray" };
const DOT = { Effective: "bg-[#10b981]", Draft: "bg-[#f59e0b]", InReview: "bg-[#3b82f6]", Superseded: "bg-[#d1d5db]", Discarded: "bg-[#e5e7eb]" };

export const DiffList = ({ diff }) => {
  const ic = { add: ["text-[#047857]", FaIcons.FaPlus], mod: ["text-[#1d4ed8]", FaIcons.FaPen], del: ["text-[#b91c1c]", FaIcons.FaMinus] };
  if (!diff.length) return <div className="px-4 py-3 text-[13px] text-[#9ca3af]">No differences.</div>;
  return diff.map((d, i) => { const [cls, I] = ic[d.k]; return <div key={i} className="flex items-start gap-2.5 px-4 py-2 text-[13px] text-[#111827]"><I size={9} className={`mt-[5px] shrink-0 ${cls}`} />{d.t}</div>; });
};

/* Version history: timeline (left) · compare (right) */
export default function VersionsTab({ typeKey, versions, viewVer, onView, onPrintSpec, standard, currentDef }) {
  const shown = versions.filter((v) => v.Status !== "Discarded");
  const [all, setAll] = useState(false);
  const [a, setA] = useState(""); const [b, setB] = useState("");
  const [diff, setDiff] = useState(null); const [busy, setBusy] = useState(false);
  useEffect(() => { if (shown.length >= 2) { setA(String(shown[1].VersionNo)); setB(String(shown[0].VersionNo)); } else if (standard && shown[0]) { setA("std"); setB(String(shown[0].VersionNo)); } setDiff(null); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [versions]);
  const load = async (k) => (k === "std" ? standard : k === "cur" ? currentDef : (await getTypeVersion(typeKey, k))?.definition);
  const compare = async () => {
    if (!a || !b || a === b) return;
    setBusy(true);
    try { const [da, db] = await Promise.all([load(a), load(b)]); setDiff(diffDefinitions(da, db)); }
    finally { setBusy(false); }
  };
  const rows = all ? versions : shown;
  const opts = [...(standard ? [["std", "System standard"]] : []), ["cur", "Current edits"], ...shown.map((v) => [String(v.VersionNo), `v${v.VersionNo} · ${TPL_STATUS[v.Status]?.l}`])];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_420px] gap-4 items-start">
      <Card title="Version history" desc="Every change, why it was made and who approved it."
        right={<>
          {versions.length !== shown.length && <label className="flex items-center gap-1.5 text-[12px] text-[#6b7280]"><input type="checkbox" className="accent-[#1a56db]" checked={all} onChange={(e) => setAll(e.target.checked)} /> Show discarded</label>}
          <Button size="sm" icon={FaIcons.FaPrint} onClick={onPrintSpec}>Print specification</Button>
        </>} bodyClass="px-5 py-4">
        {!rows.length && <Empty icon={FaIcons.FaHistory} title="No versions yet">The first version is created when you save this template.</Empty>}
        <ol className="relative">
          {rows.map((v, i) => {
            const on = v.VersionNo === viewVer;
            return (
              <li key={v.Id} className="relative pl-8 pb-5 last:pb-0">
                {i < rows.length - 1 && <span className="absolute left-[7px] top-[18px] bottom-0 w-px bg-[#e5e7eb]" />}
                <span className={`absolute left-0 top-[4px] w-[15px] h-[15px] rounded-full ring-4 ring-white ${DOT[v.Status] || "bg-[#d1d5db]"}`} />
                <div className={`rounded-[8px] border px-4 py-3 ${on ? "border-[#1a56db] bg-[#f8fbff]" : "border-[#e5e7eb]"}`}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[14px] font-semibold text-[#111827]">v{v.VersionNo}</span>
                    <Badge tone={TONE[v.Status]}>{TPL_STATUS[v.Status]?.l || v.Status}</Badge>
                    {v.EffectiveFrom && <span className="text-[12px] text-[#6b7280]">effective {fmtDateTime(v.EffectiveFrom)}</span>}
                    <span className="ml-auto">{on ? <span className="text-[12px] font-semibold text-[#1a56db]">Viewing</span> : v.Status !== "Discarded" && <Button size="sm" kind="ghost" onClick={() => onView(v.VersionNo)}>Open</Button>}</span>
                  </div>
                  <div className="mt-1.5 text-[13px] text-[#374151]">{v.ChangeReason || <span className="text-[#9ca3af]">No reason recorded</span>}</div>
                  {v.ReviewComment && <div className="mt-1 text-[12px] text-[#b45309]"><FaIcons.FaCommentAlt size={9} className="inline -mt-0.5 mr-1.5" />{v.ReviewComment}</div>}
                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[12px] text-[#6b7280]">
                    <span>Prepared: <b className="font-semibold text-[#374151]">{v.UpdatedBy || v.CreatedBy || "—"}</b> {fmtDateTime(v.UpdatedAt || v.CreatedAt)}</span>
                    {v.SubmittedBy && <span>Sent: <b className="font-semibold text-[#374151]">{v.SubmittedBy}</b> {fmtDateTime(v.SubmittedAt)}</span>}
                    {(v.ApprovedBy || v.ReviewedBy) && <span>{v.ApprovedBy ? "Approved" : "Reviewed"}: <b className="font-semibold text-[#374151]">{v.ApprovedBy || v.ReviewedBy}</b> {fmtDateTime(v.ApprovedAt || v.ReviewedAt)}</span>}
                    <span>Registers: <b className="font-semibold text-[#374151]">{v.registers || 0}</b>{v.activeRegisters ? ` (${v.activeRegisters} running)` : ""}</span>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </Card>

      <Card title="Compare" desc="See exactly what changed between two versions." bodyClass="p-0" className="xl:sticky xl:top-0">
        <div className="flex flex-wrap items-center gap-2 px-5 py-3 border-b border-[#f3f4f6]">
          <select className={`${inpSm} !w-[150px]`} value={a} onChange={(e) => { setA(e.target.value); setDiff(null); }}>{opts.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
          <FaIcons.FaArrowRight size={10} className="text-[#9ca3af]" />
          <select className={`${inpSm} !w-[150px]`} value={b} onChange={(e) => { setB(e.target.value); setDiff(null); }}>{opts.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
          <Button size="sm" kind="primary" disabled={busy || !a || !b || a === b} onClick={compare}>{busy ? "…" : "Compare"}</Button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto py-1">{diff ? <DiffList diff={diff} /> : <div className="px-5 py-4 text-[13px] text-[#9ca3af]">Pick two versions and press Compare.{standard ? " “System standard” shows how far this company has customised the template." : ""}</div>}</div>
      </Card>
    </div>
  );
}
