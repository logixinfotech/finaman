import { useEffect, useMemo, useRef, useState } from "react";
import * as FaIcons from "react-icons/fa";
import { PAPERS, PRINT_DEFAULTS, SRC_LABEL, toDefinition, durationOf } from "./model";
import { buildRegisterPrint } from "./print";
import { Card, FieldBox, Toggle, Seg, Accordion, Button, Check, inpSm } from "./ui";

/* ═══════════════════════════════════════════════════════════════════════
   Print layout — settings saved with the template (left) · live A4 preview (right)
   ═══════════════════════════════════════════════════════════════════════ */

const NAMES = ["Rohit Sharma", "Anjali Mehta", "Priya Nair", "Vikas Rao"];
const PAPER_PX = { A4L: 1123, A4P: 794, A3L: 1587 };
const pad = (n) => String(n).padStart(2, "0");

/** Realistic sample rows built from the template's own fields */
function sampleEntries(cols) {
  const today = new Date();
  return [1, 2, 3, 4].map((i) => {
    const data = {};
    cols.forEach((c, j) => {
      if (c.type === "select") data[c.key] = c.source ? (c.source === "personnel" ? NAMES[i % 4] : `${SRC_LABEL[c.source]} ${i}`) : (c.options || [])[(i + j) % Math.max((c.options || []).length, 1)] || "";
      else if (c.type === "number") data[c.key] = c.min != null && c.max != null ? +(c.min + (c.max - c.min) * (0.3 + i * 0.1)).toFixed(1) : 20 + i;
      else if (c.type === "time") data[c.key] = `${pad(8 + i * 2)}:${pad(c.afterField ? 15 + i * 8 : 5)}`;
      else if (c.type === "date") data[c.key] = today.toISOString().slice(0, 10);
      else if (c.type !== "duration") data[c.key] = /remark|comment/i.test(c.key) ? (i === 2 ? "Area found clean" : "") : `Sample ${i}`;
    });
    cols.filter((c) => c.type === "duration").forEach((c) => { data[c.key] = durationOf(c, data); });
    const at = new Date(today); at.setHours(8 + i * 2, 5 + i * 10, 0, 0);
    return { SeqNo: i, EntryAt: at.toISOString(), data, DoneBy: NAMES[(i - 1) % 4], VerifiedBy: i < 3 ? NAMES[i % 4] : "", VerifiedAt: i < 3 ? at.toISOString() : null,
      Status: i === 4 ? "Cancelled" : i < 3 ? "Verified" : "Entered", CancelReason: i === 4 ? "Wrong area selected" : "", CancelledBy: i === 4 ? NAMES[0] : "" };
  });
}

export default function PrintTab({ ed, editing, company, userName, effRow, verLabel, onPrintSpec }) {
  const d = ed.draft;
  const p = { ...PRINT_DEFAULTS, ...(d.print || {}) };
  const [mode, setMode] = useState("sample");
  const [zoom, setZoom] = useState("fit");
  const [fit, setFit] = useState(0.7);
  const frame = useRef(null); const box = useRef(null);
  const setP = (ch, merge) => ed.apply((x) => ({ ...x, print: { ...PRINT_DEFAULTS, ...(x.print || {}), ...ch } }), merge);
  const toggleCol = (k) => setP({ hidden: p.hidden.includes(k) ? p.hidden.filter((x) => x !== k) : [...p.hidden, k] });

  useEffect(() => {   // "Fit" = scale the page to the preview width
    const el = box.current; if (!el) return undefined;
    const ro = new ResizeObserver(() => setFit(Math.max(0.35, Math.min(1, (el.clientWidth - 48) / (PAPER_PX[p.paper] || 1123)))));
    ro.observe(el); return () => ro.disconnect();
  }, [p.paper]);
  const z = zoom === "fit" ? fit : Number(zoom);

  const html = useMemo(() => {
    const def = toDefinition(d);
    const raw = buildRegisterPrint({
      def, company, userName,
      ver: { label: verLabel, status: "Effective", effectiveFrom: effRow?.EffectiveFrom },
      register: mode === "sample" ? { RecordNo: "LB-2026-0001", RefName: `Sample ${d.refType}`, Department: "Production" } : {},
      entries: mode === "sample" ? sampleEntries(def.columns) : null,
    });
    const screen = `@media screen { html { background:#e5e7eb; } body { background:#fff; width:${PAPER_PX[p.paper] || 1123}px; min-height:${Math.round((PAPER_PX[p.paper] || 1123) * (p.paper === "A4P" ? 1.414 : 0.707))}px; margin:24px auto; padding:28px !important; box-shadow:0 4px 18px rgba(15,23,42,.18); zoom:${z}; } }`;
    return raw.replace("</style>", `${screen}</style>`);
  }, [d, company, userName, verLabel, effRow, mode, p.paper, z]);

  const shown = d.columns.filter((c) => !p.hidden.includes(c.key)).length;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[330px_minmax(0,1fr)] gap-4 items-start">
      <aside className="bg-white border border-[#e5e7eb] rounded-[8px] xl:sticky xl:top-0 xl:max-h-[calc(100vh-240px)] overflow-y-auto">
        <div className="px-4 pt-4 pb-3 border-b border-[#f3f4f6]">
          <h3 className="text-[14px] font-semibold text-[#111827]">Print settings</h3>
          <p className="mt-[2px] text-[12px] text-[#6b7280]">Saved with the template and used whenever a register is printed.</p>
        </div>
        <Accordion title="Page">
          <FieldBox label="Paper"><select className={inpSm} disabled={!editing} value={p.paper} onChange={(e) => setP({ paper: e.target.value })}>{Object.entries(PAPERS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></FieldBox>
          <FieldBox label="Rows per page"><input type="number" min={5} max={60} className={inpSm} disabled={!editing} value={p.rowsPerPage} onChange={(e) => setP({ rowsPerPage: Number(e.target.value) || 20 }, true)} /></FieldBox>
        </Accordion>
        <Accordion title="Header">
          <Toggle small disabled={!editing} checked={p.showCompany} onChange={(v) => setP({ showCompany: v })} label="Company name" />
          <Toggle small disabled={!editing} checked={p.repeatHeader} onChange={(v) => setP({ repeatHeader: v })} label="Repeat header on every page" />
          <div className="grid grid-cols-2 gap-2">
            <FieldBox label="Document no."><input className={inpSm} disabled={!editing} value={d.docNo} onChange={(e) => ed.setD({ docNo: e.target.value }, true)} /></FieldBox>
            <FieldBox label="Format no."><input className={inpSm} disabled={!editing} value={p.formatNo} onChange={(e) => setP({ formatNo: e.target.value }, true)} /></FieldBox>
          </div>
        </Accordion>
        <Accordion title="Columns" count={`${shown}/${d.columns.length}`}>
          <div className="-mx-2">
            {d.columns.map((c) => <Check key={c._id} checked={!p.hidden.includes(c.key)} disabled={!editing} onChange={() => toggleCol(c.key)} label={c.label} />)}
          </div>
          <Toggle small disabled={!editing} checked={p.strikeCancelled} onChange={(v) => setP({ strikeCancelled: v })} label="Print cancelled entries struck through" hint="Off = cancelled entries are left out." />
        </Accordion>
        <Accordion title="Signatures & footer">
          <Toggle small disabled={!editing} checked={p.signPrepared} onChange={(v) => setP({ signPrepared: v })} label="Prepared by" />
          <Toggle small disabled={!editing} checked={p.signReviewed} onChange={(v) => setP({ signReviewed: v })} label="Reviewed by" />
          <Toggle small disabled={!editing} checked={p.signApproved} onChange={(v) => setP({ signApproved: v })} label="Approved by" />
          <FieldBox label="Footer text"><input className={inpSm} disabled={!editing} value={p.footerText} onChange={(e) => setP({ footerText: e.target.value }, true)} /></FieldBox>
        </Accordion>
      </aside>

      <Card title="Preview" desc={`${PAPERS[p.paper]} · ${shown} of ${d.columns.length} columns · ${mode === "sample" ? "sample entries" : "blank format"}`} bodyClass="p-0"
        right={<>
          <Seg value={mode} onChange={setMode} options={[{ v: "sample", l: "With entries" }, { v: "blank", l: "Blank format" }]} />
          <select className={`${inpSm} !w-[86px]`} value={zoom} onChange={(e) => setZoom(e.target.value)} title="Zoom">
            <option value="fit">Fit</option><option value="0.75">75%</option><option value="1">100%</option>
          </select>
          {onPrintSpec && <Button size="sm" icon={FaIcons.FaFileAlt} onClick={onPrintSpec}>Specification</Button>}
          <Button size="sm" kind="primary" icon={FaIcons.FaPrint} onClick={() => { const w = frame.current?.contentWindow; if (w) { w.focus(); w.print(); } }}>Print / PDF</Button>
        </>}>
        <div ref={box} className="bg-[#e5e7eb] rounded-b-[8px]">
          <iframe ref={frame} title="print-preview" srcDoc={html} className="block w-full h-[72vh] border-0 rounded-b-[8px]" />
        </div>
      </Card>
    </div>
  );
}
