/**
 * ERPPrintPreview — Responsive, scrollable, device-friendly
 *
 * FIXES vs previous version:
 *  - No fixed height / no height:100% — component is natural flow, parent just renders it
 *  - Paper width is fluid: max-width 860px, 100% otherwise — no horizontal cut-off
 *  - Toolbar wraps on small screens (flex-wrap)
 *  - Template switcher scrolls horizontally on mobile
 *  - All grids collapse to 1-col on narrow viewports via CSS vars
 *  - Entire page scrolls normally — no inner scroll trap
 *  - Print-only styles hide the chrome shell, paper prints clean A4
 */

import React, { useRef, useState, useCallback } from "react";
import { QRCodeCanvas } from "qrcode.react";
import {
  Printer, Download, ArrowLeft,
  FileText, Receipt, List, Award, LayoutGrid, Columns2,
  Clock, Ban, AlertTriangle, Copy as CopyIcon, CheckCircle
} from "lucide-react";
import { useReactToPrint } from "react-to-print";

/* ─── FONTS ─────────────────────────────────────────────── */
const Fonts = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

    .erp-preview-root {
      font-family: 'Plus Jakarta Sans', sans-serif;
      --erp-accent:   #2563eb;
      --erp-shell:    #111827;
      --erp-toolbar:  #1f2937;
      --erp-border:   #374151;
      --erp-muted:    #6b7280;
      --erp-paper:    #ffffff;
      --erp-ink1:     #0f172a;
      --erp-ink2:     #334155;
      --erp-ink3:     #64748b;
      --erp-ink4:     #94a3b8;
      --erp-rule:     #e2e8f0;
      --erp-tHead:    #f1f5f9;
      --erp-tAlt:     #f8fafc;
      --erp-tBorder:  #e2e8f0;
      --erp-mono:     'JetBrains Mono', monospace;
      box-sizing: border-box;
    }
    .erp-preview-root *, .erp-preview-root *::before, .erp-preview-root *::after {
      box-sizing: inherit;
      font-family: inherit;
    }
    .erp-mono { font-family: var(--erp-mono) !important; }

    /* ── Toolbar ── */
    .erp-toolbar {
      background: var(--erp-toolbar);
      border-bottom: 1px solid var(--erp-border);
      padding: 10px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      flex-wrap: wrap;
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .erp-toolbar-left  { display: flex; align-items: center; gap: 10px; min-width: 0; }
    .erp-toolbar-mid   { display: flex; align-items: center; overflow-x: auto; gap: 2px; background: #111827; border-radius: 8px; border: 1px solid var(--erp-border); padding: 3px; max-width: 100%; scrollbar-width: none; }
    .erp-toolbar-mid::-webkit-scrollbar { display: none; }
    .erp-toolbar-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }

    /* Tab buttons */
    .erp-tab {
      display: flex; align-items: center; gap: 5px;
      padding: 5px 11px; border-radius: 6px; border: none; cursor: pointer;
      font-size: 11px; font-weight: 500; white-space: nowrap;
      background: transparent; color: #6b7280;
      transition: background 0.15s, color 0.15s;
      font-family: 'Plus Jakarta Sans', sans-serif;
    }
    .erp-tab:hover  { background: #1f2937; color: #d1d5db; }
    .erp-tab.active { background: #1f2937; color: #f1f5f9; font-weight: 600; box-shadow: inset 0 0 0 1px #374151; }

    /* Toolbar icon btn */
    .erp-icon-btn {
      display: flex; align-items: center; justify-content: center;
      width: 34px; height: 34px; border-radius: 7px;
      border: 1px solid var(--erp-border); background: transparent;
      color: #9ca3af; cursor: pointer; transition: all 0.15s;
    }
    .erp-icon-btn:hover { background: #374151; color: #e5e7eb; }

    /* Action buttons */
    .erp-btn-ghost {
      display: flex; align-items: center; gap: 6px;
      padding: 7px 14px; border-radius: 7px;
      border: 1px solid var(--erp-border); background: transparent;
      color: #9ca3af; font-size: 11.5px; font-weight: 500; cursor: pointer;
      transition: all 0.15s; white-space: nowrap;
      font-family: 'Plus Jakarta Sans', sans-serif;
    }
    .erp-btn-ghost:hover { background: #374151; color: #e5e7eb; border-color: #4b5563; }

    .erp-btn-primary {
      display: flex; align-items: center; gap: 6px;
      padding: 7px 16px; border-radius: 7px; border: none;
      background: var(--erp-accent); color: #fff;
      font-size: 11.5px; font-weight: 600; cursor: pointer;
      transition: opacity 0.15s; white-space: nowrap;
      font-family: 'Plus Jakarta Sans', sans-serif;
    }
    .erp-btn-primary:hover { opacity: 0.88; }

    /* ── Canvas (bg behind paper) ── */
    .erp-canvas {
      background: #0f1117;
      padding: 24px 16px 48px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    /* ── Paper shell ── */
    .erp-paper-shell {
      width: 100%;
      max-width: 860px;
      box-shadow: 0 8px 40px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.3);
      border-radius: 3px;
    }

    /* ── The white A4 paper ── */
    .erp-paper {
      background: var(--erp-paper);
      width: 100%;
      padding: 36px 40px;
      position: relative;
    }
    @media (max-width: 600px) {
      .erp-paper { padding: 20px 16px; }
    }

    /* ── Document: header band ── */
    .erp-doc-header-band {
      background: var(--erp-ink1);
      margin: -36px -40px 0;
      padding: 20px 40px 18px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
    }
    @media (max-width: 600px) {
      .erp-doc-header-band { margin: -20px -16px 0; padding: 16px 16px 14px; }
    }

    .erp-doc-meta-strip {
      background: #f8fafc;
      border-bottom: 1px solid var(--erp-rule);
      margin: 0 -40px;
      padding: 9px 40px;
      display: flex;
      gap: 28px;
      flex-wrap: wrap;
      align-items: center;
    }
    @media (max-width: 600px) {
      .erp-doc-meta-strip { margin: 0 -16px; padding: 8px 16px; gap: 16px; }
    }

    /* ── Field grid — collapses on mobile ── */
    .erp-field-grid-2 { display: grid; grid-template-columns: 1fr 1fr; column-gap: 36px; }
    .erp-field-grid-3 { display: grid; grid-template-columns: repeat(3,1fr); column-gap: 28px; }
    @media (max-width: 680px) {
      .erp-field-grid-2 { grid-template-columns: 1fr; }
      .erp-field-grid-3 { grid-template-columns: 1fr 1fr; }
    }
    @media (max-width: 420px) {
      .erp-field-grid-3 { grid-template-columns: 1fr; }
    }

    .erp-field-row {
      display: flex; justify-content: space-between; align-items: baseline;
      border-bottom: 1px solid var(--erp-rule);
      padding: 6px 0; gap: 8px;
    }

    /* ── Table — horizontal scroll on mobile ── */
    .erp-table-wrap { overflow-x: auto; width: 100%; }
    .erp-table {
      width: 100%; border-collapse: collapse;
      font-size: 11.5px; min-width: 400px;
    }

    /* ── Invoice two-col splits to single on mobile ── */
    .erp-invoice-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 22px;
    }
    @media (max-width: 560px) {
      .erp-invoice-grid { grid-template-columns: 1fr; }
    }

    /* ── Two-column template ── */
    .erp-two-col-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 0;
    }
    @media (max-width: 560px) {
      .erp-two-col-grid { grid-template-columns: 1fr; }
      .erp-two-col-right { border-left: none !important; padding-left: 0 !important; border-top: 1px dashed var(--erp-rule); padding-top: 12px; }
    }

    /* ── Signature block ── */
    .erp-sig-grid {
      display: grid; gap: 24px; margin-top: 44px;
    }

    /* ── Status badge ── */
    .erp-badge {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 3px 10px; border-radius: 99px; font-size: 10px; font-weight: 700;
      letter-spacing: 0.07em; text-transform: uppercase;
    }

    /* ── Watermark pill in toolbar ── */
    .erp-wm-pill {
      display: flex; align-items: center; gap: 5px;
      padding: 4px 10px; border-radius: 5px;
      font-size: 10px; font-weight: 700; letter-spacing: 0.1em;
    }

    /* ── Totals panel ── */
    .erp-totals-panel {
      display: flex; justify-content: flex-end; margin-bottom: 24px;
    }
    @media (max-width: 480px) {
      .erp-totals-panel { justify-content: stretch; }
      .erp-totals-inner { width: 100% !important; }
    }

    /* ── Section heading ── */
    .erp-section-head {
      display: flex; align-items: center; gap: 10px;
      margin-bottom: 12px; margin-top: 6px;
    }

    /* ── Doc title in toolbar ── */
    .erp-toolbar-title {
      font-size: 12.5px; font-weight: 600; color: #e2e8f0;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      max-width: 180px;
    }
    @media (max-width: 480px) { .erp-toolbar-title { max-width: 110px; } }

    /* ── Print media ── */
    @media print {
      .erp-preview-root { background: #fff !important; }
      .erp-toolbar      { display: none !important; }
      .erp-canvas       { padding: 0 !important; background: #fff !important; }
      .erp-paper-shell  { box-shadow: none !important; max-width: 100% !important; }
      .erp-paper        { padding: 0 !important; }
      .erp-doc-header-band { margin: 0 !important; }
      .erp-doc-meta-strip  { margin: 0 !important; }
      @page { size: A4; margin: 12mm 14mm; }
      table  { page-break-inside: auto; }
      tr     { page-break-inside: avoid; }
      thead  { display: table-header-group; }
      tfoot  { display: table-footer-group; }
    }
  `}</style>
);

/* ─── HELPERS ──────────────────────────────────────────── */
const TEMPLATES = [
  { id:"detail",  label:"Detail",   Icon:FileText,   desc:"Full master record" },
  { id:"invoice", label:"Invoice",  Icon:Receipt,    desc:"Header + line items + totals" },
  { id:"list",    label:"Register", Icon:List,       desc:"Multi-row table report" },
  { id:"letter",  label:"Letter",   Icon:Award,      desc:"Letter / Certificate" },
  { id:"compact", label:"Compact",  Icon:LayoutGrid, desc:"Dense 3-col layout" },
  { id:"twoCol",  label:"2-Col",    Icon:Columns2,   desc:"Side-by-side comparison" },
];

const val = (data, key) => {
  const v = data?.[key];
  return (v !== undefined && v !== null && v !== "") ? v : "—";
};

/* ─── SHARED DOC PARTS ─────────────────────────────────── */

const SectionHead = ({ title }) => (
  <div className="erp-section-head">
    <span style={{ fontSize:9.5, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--erp-ink3)", whiteSpace:"nowrap" }}>
      {title}
    </span>
    <div style={{ flex:1, height:1, background:"var(--erp-rule)" }} />
  </div>
);

const FieldGrid = ({ fields = [], data, cols = 2 }) => {
  const cls = cols === 3 ? "erp-field-grid-3" : "erp-field-grid-2";
  const gridClass = cols === 1 ? "" : cls;
  return (
    <div className={gridClass} style={{ marginBottom:18, ...(cols === 1 ? { display:"grid", gridTemplateColumns:"1fr" } : {}) }}>
      {fields.map((f, i) => (
        <div key={i} className="erp-field-row">
          <span style={{ fontSize:11.5, color:"var(--erp-ink3)", flexShrink:0 }}>{f.label}</span>
          <span style={{ fontSize:11.5, fontWeight:500, color:"var(--erp-ink1)", textAlign:"right", wordBreak:"break-all", ...(f.mono ? { fontFamily:"var(--erp-mono)", fontSize:10.5 } : {}) }}>
            {f.render ? f.render(data) : val(data, f.key)}
          </span>
        </div>
      ))}
    </div>
  );
};

const DataTable = ({ columns = [], rows = [], showTotals, totalFields }) => (
  <div className="erp-table-wrap">
    <table className="erp-table">
      <thead>
        <tr style={{ background:"var(--erp-tHead)" }}>
          {columns.map((c, i) => (
            <th key={i} style={{ border:"1px solid var(--erp-tBorder)", padding:"8px 10px", textAlign:c.align||"left", fontWeight:600, color:"var(--erp-ink2)", fontSize:10.5, textTransform:"uppercase", letterSpacing:"0.04em" }}>
              {c.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 && (
          <tr><td colSpan={columns.length} style={{ textAlign:"center", padding:24, color:"var(--erp-ink4)", border:"1px solid var(--erp-tBorder)", fontStyle:"italic", fontSize:12 }}>No records found</td></tr>
        )}
        {rows.map((row, ri) => (
          <tr key={ri} style={{ background: ri%2===0 ? "#fff" : "var(--erp-tAlt)" }}>
            {columns.map((c, ci) => (
              <td key={ci} style={{ border:"1px solid var(--erp-tBorder)", padding:"6px 10px", textAlign:c.align||"left", color:"var(--erp-ink2)", ...(c.mono ? { fontFamily:"var(--erp-mono)", fontSize:10.5 } : {}) }}>
                {c.render ? c.render(row, ri) : row?.[c.key] ?? "—"}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
      {showTotals && totalFields && (
        <tfoot>
          <tr style={{ background:"#e8edf5" }}>
            {columns.map((c, i) => {
              const tf = totalFields.find(t => t.key === c.key);
              return (
                <td key={i} style={{ border:"1px solid #cbd5e1", padding:"8px 10px", fontWeight:700, fontSize:11.5, color:"var(--erp-ink1)", textAlign:c.align||"left", fontFamily: tf ? "var(--erp-mono)" : undefined }}>
                  {i===0 ? "TOTAL" : tf ? tf.value : ""}
                </td>
              );
            })}
          </tr>
        </tfoot>
      )}
    </table>
  </div>
);

const SignatureBlock = ({ signatories = ["Prepared By", "Checked By", "Authorised By"] }) => (
  <div className="erp-sig-grid" style={{ gridTemplateColumns:`repeat(${signatories.length}, 1fr)` }}>
    {signatories.map((name, i) => (
      <div key={i} style={{ textAlign:"center" }}>
        <div style={{ height:32 }} />
        <div style={{ borderTop:"1.5px solid var(--erp-ink1)", paddingTop:8, fontSize:10.5, color:"var(--erp-ink3)", fontWeight:500 }}>{name}</div>
        <div style={{ fontSize:9, color:"var(--erp-ink4)", marginTop:2 }}>Signature &amp; Date</div>
      </div>
    ))}
  </div>
);

const Watermark = ({ text }) => {
  const C = { DRAFT:"#f59e0b", CANCELLED:"#ef4444", COPY:"#2563eb", VOID:"#64748b" };
  const c = C[text?.toUpperCase()] || "#64748b";
  return (
    <div style={{ position:"absolute", inset:0, overflow:"hidden", pointerEvents:"none", zIndex:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <span style={{ fontSize:"min(18vw, 110px)", fontWeight:800, color:c, opacity:0.07, transform:"rotate(-28deg)", textTransform:"uppercase", whiteSpace:"nowrap", userSelect:"none", letterSpacing:"0.06em" }}>
        {text}
      </span>
    </div>
  );
};

const DocHeader = ({ title, data, logo, showQR=true, docNumber, docDate, status }) => {
  const S = { active:{bg:"#d1fae5",txt:"#065f46",dot:"#10b981"}, draft:{bg:"#fef3c7",txt:"#92400e",dot:"#f59e0b"}, cancelled:{bg:"#fee2e2",txt:"#991b1b",dot:"#ef4444"} };
  const s = S[status?.toLowerCase()];
  return (
    <div style={{ marginBottom:22 }}>
      <div className="erp-doc-header-band">
        <div style={{ display:"flex", alignItems:"center", gap:14, minWidth:0 }}>
          {logo && <img src={logo} alt="" style={{ height:38, objectFit:"contain", filter:"brightness(0) invert(1)", opacity:.9, flexShrink:0 }} />}
          <div style={{ minWidth:0 }}>
            <div style={{ fontSize:17, fontWeight:700, color:"#f1f5f9", letterSpacing:"-0.02em", lineHeight:1.2 }}>{title}</div>
            {data?.company_name && <div style={{ fontSize:11, color:"#94a3b8", marginTop:3 }}>{data.company_name}</div>}
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:12, flexShrink:0 }}>
          {s && (
            <span className="erp-badge" style={{ background:`${s.dot}22`, border:`1px solid ${s.dot}55`, color:s.dot }}>
              <span style={{ width:5, height:5, borderRadius:"50%", background:s.dot, display:"inline-block" }} />
              {status}
            </span>
          )}
          {showQR && (
            <div style={{ background:"#fff", padding:5, borderRadius:4, flexShrink:0 }}>
              <QRCodeCanvas value={data?.company_id||data?.id||"ERP"} size={48} fgColor="#0f172a" />
            </div>
          )}
        </div>
      </div>

      <div className="erp-doc-meta-strip">
        {data?.company_name && (
          <div>
            <div style={{ fontSize:8.5, color:"var(--erp-ink4)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em" }}>Organisation</div>
            <div style={{ fontSize:11.5, fontWeight:500, color:"var(--erp-ink2)", marginTop:1 }}>{data.company_name}</div>
          </div>
        )}
        {docNumber && (
          <div>
            <div style={{ fontSize:8.5, color:"var(--erp-ink4)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em" }}>Document No.</div>
            <div className="erp-mono" style={{ fontSize:11.5, fontWeight:500, color:"var(--erp-ink1)", marginTop:1 }}>{docNumber}</div>
          </div>
        )}
        {docDate && (
          <div>
            <div style={{ fontSize:8.5, color:"var(--erp-ink4)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em" }}>Date</div>
            <div style={{ fontSize:11.5, fontWeight:500, color:"var(--erp-ink2)", marginTop:1 }}>{docDate}</div>
          </div>
        )}
        {data?.branch && (
          <div>
            <div style={{ fontSize:8.5, color:"var(--erp-ink4)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em" }}>Branch</div>
            <div style={{ fontSize:11.5, fontWeight:500, color:"var(--erp-ink2)", marginTop:1 }}>{data.branch}</div>
          </div>
        )}
        <div style={{ marginLeft:"auto", fontSize:9, color:"var(--erp-ink4)", whiteSpace:"nowrap" }}>
          {new Date().toLocaleString("en-IN")}
        </div>
      </div>

      <div style={{ height:20 }} />
    </div>
  );
};

const DocFooter = ({ note }) => (
  <div style={{ borderTop:"1px solid var(--erp-rule)", marginTop:28, paddingTop:10, display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:6 }}>
    <span style={{ fontSize:9, color:"var(--erp-ink4)" }}>{note||"System generated document — ERP"}</span>
    <span className="erp-mono" style={{ fontSize:9, color:"var(--erp-ink4)" }}>{new Date().toISOString().slice(0,19).replace("T"," ")} UTC</span>
  </div>
);

/* ─── TEMPLATES ─────────────────────────────────────────── */

const TemplateDetail = ({ title, data, sections, logo, watermark, docNumber, docDate, status }) => {
  const autoCols = f => f?.length > 9 ? 3 : f?.length > 4 ? 2 : 1;
  return (
    <div style={{ position:"relative" }}>
      {watermark && <Watermark text={watermark} />}
      <div style={{ position:"relative", zIndex:1 }}>
        <DocHeader title={title} data={data} logo={logo} docNumber={docNumber} docDate={docDate} status={status} />
        {sections.map((sec, i) => {
          if (sec.type === "custom") return <div key={i}>{sec.render(data)}</div>;
          if (sec.type === "table") return (
            <div key={i} style={{ marginBottom:22 }}>
              <SectionHead title={sec.title} />
              <DataTable columns={sec.columns} rows={data?.[sec.dataKey]||[]} showTotals={sec.showTotals} totalFields={sec.totalFields} />
            </div>
          );
          return (
            <div key={i} style={{ marginBottom:6 }}>
              <SectionHead title={sec.title} />
              <FieldGrid fields={sec.fields} data={data} cols={sec.columns||autoCols(sec.fields)} />
            </div>
          );
        })}
        <SignatureBlock />
        <DocFooter />
      </div>
    </div>
  );
};

const TemplateInvoice = ({ title, data, sections, logo, watermark, docNumber, docDate, status }) => {
  const hdr  = sections.find(s => s.type==="fields" && s.position!=="receiver");
  const recv = sections.find(s => s.position==="receiver");
  const tbl  = sections.find(s => s.type==="table");
  const tots = sections.find(s => s.type==="totals");
  return (
    <div style={{ position:"relative" }}>
      {watermark && <Watermark text={watermark} />}
      <div style={{ position:"relative", zIndex:1 }}>
        <DocHeader title={title} data={data} logo={logo} docNumber={docNumber} docDate={docDate} status={status} showQR />
        <div className="erp-invoice-grid">
          {hdr && <div><SectionHead title={hdr.title} /><FieldGrid fields={hdr.fields} data={data} cols={1} /></div>}
          {recv && (
            <div style={{ background:"#f8fafc", border:"1px solid var(--erp-tBorder)", borderLeft:"3px solid var(--erp-accent)", borderRadius:7, padding:"13px 15px" }}>
              <div style={{ fontSize:9, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--erp-ink4)", marginBottom:9 }}>{recv.title}</div>
              {recv.fields.map((f, i) => (
                <div key={i} style={{ fontSize: i===0?13:11.5, fontWeight: i===0?600:400, color: i===0?"var(--erp-ink1)":"var(--erp-ink2)", marginBottom:3 }}>
                  {val(data, f.key)}
                </div>
              ))}
            </div>
          )}
        </div>
        {tbl && <div style={{ marginBottom:18 }}><SectionHead title={tbl.title||"Line Items"} /><DataTable columns={tbl.columns} rows={data?.[tbl.dataKey]||[]} showTotals={tbl.showTotals} totalFields={tbl.totalFields} /></div>}
        {tots && (
          <div className="erp-totals-panel">
            <div className="erp-totals-inner" style={{ width:300, border:"1px solid var(--erp-tBorder)", borderRadius:7, overflow:"hidden" }}>
              {tots.rows.map((row, i) => (
                <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 15px", background: row.bold?"var(--erp-ink1)": i%2===0?"#fff":"var(--erp-tAlt)", color: row.bold?"#f8fafc":"var(--erp-ink2)", fontWeight: row.bold?700:400, fontSize:12, borderBottom: row.bold?"none":"1px solid var(--erp-tBorder)" }}>
                  <span>{row.label}</span>
                  <span className="erp-mono" style={{ fontSize: row.bold?13:11.5 }}>{row.render ? row.render(data) : val(data, row.key)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {data?.terms && (
          <div style={{ background:"#fffbeb", border:"1px solid #fde68a", borderRadius:7, padding:"10px 14px", marginBottom:18 }}>
            <div style={{ fontSize:9, fontWeight:700, color:"#92400e", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:5 }}>Terms &amp; Conditions</div>
            <div style={{ fontSize:11, color:"#78350f", lineHeight:1.7 }}>{data.terms}</div>
          </div>
        )}
        <SignatureBlock signatories={["Prepared By","Checked By","Authorised Signatory"]} />
        <DocFooter note="E.&O.E. — Computer generated document." />
      </div>
    </div>
  );
};

const TemplateList = ({ title, data, sections, logo, watermark, docNumber, docDate }) => {
  const tbl = sections.find(s => s.type==="table");
  const rows = (tbl && data?.[tbl.dataKey]) || (Array.isArray(data) ? data : []);
  return (
    <div style={{ position:"relative" }}>
      {watermark && <Watermark text={watermark} />}
      <div style={{ position:"relative", zIndex:1 }}>
        <DocHeader title={title} data={data} logo={logo} showQR={false} docNumber={docNumber} docDate={docDate} />
        {data?.dateRange && (
          <div style={{ display:"inline-flex", alignItems:"center", gap:7, background:"#eff6ff", border:"1px solid #bfdbfe", borderRadius:20, padding:"4px 13px", marginBottom:14 }}>
            <Clock size={11} color="#2563eb" />
            <span style={{ fontSize:11, color:"#1d4ed8", fontWeight:500 }}>Period: {data.dateRange}</span>
          </div>
        )}
        {tbl && <DataTable columns={tbl.columns} rows={rows} showTotals={tbl.showTotals} totalFields={tbl.totalFields} />}
        <div style={{ marginTop:12 }}>
          <span style={{ fontSize:10, color:"var(--erp-ink3)", background:"#f1f5f9", borderRadius:4, padding:"3px 9px", fontWeight:500 }}>
            {rows.length} record{rows.length!==1?"s":""}
          </span>
        </div>
        <DocFooter />
      </div>
    </div>
  );
};

const TemplateLetter = ({ title, data, sections, logo, watermark }) => {
  const body = sections.find(s => s.type==="letter_body");
  const sig  = sections.find(s => s.type==="signature");
  return (
    <div style={{ position:"relative" }}>
      {watermark && <Watermark text={watermark} />}
      <div style={{ position:"relative", zIndex:1 }}>
        <div style={{ textAlign:"center", borderBottom:"2px solid var(--erp-ink1)", paddingBottom:18, marginBottom:24 }}>
          {logo && <img src={logo} alt="" style={{ height:48, objectFit:"contain", display:"block", margin:"0 auto 10px" }} />}
          <div style={{ fontSize:16, fontWeight:700, color:"var(--erp-ink1)" }}>{data?.company_name}</div>
          {data?.company_address && <div style={{ fontSize:11, color:"var(--erp-ink3)", marginTop:3, lineHeight:1.6 }}>{data.company_address}</div>}
          {data?.company_gstin && <div className="erp-mono" style={{ fontSize:10, color:"var(--erp-ink4)", marginTop:3 }}>GSTIN: {data.company_gstin}</div>}
        </div>
        <div style={{ textAlign:"right", marginBottom:18, fontSize:12, color:"var(--erp-ink2)" }}>
          Date: <strong>{data?.date || new Date().toLocaleDateString("en-IN")}</strong>
        </div>
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:12, fontWeight:600, color:"var(--erp-ink1)", marginBottom:4 }}>To,</div>
          {sections.filter(s=>s.type==="addressee").flatMap(s=>s.fields.map((f,j)=>(
            <div key={j} style={{ fontSize:12, color:"var(--erp-ink2)", marginBottom:2, lineHeight:1.6 }}>{val(data,f.key)}</div>
          )))}
        </div>
        <div style={{ fontSize:13, fontWeight:700, color:"var(--erp-ink1)", margin:"18px 0 14px", borderBottom:"2px solid var(--erp-ink1)", paddingBottom:5, display:"inline-block" }}>
          Sub: {title}
        </div>
        {body && (
          <div style={{ fontSize:12.5, color:"var(--erp-ink2)", lineHeight:2, whiteSpace:"pre-line", marginBottom:18 }}>
            {body.render ? body.render(data) : val(data, body.key)}
          </div>
        )}
        <div style={{ fontSize:12, color:"var(--erp-ink2)", marginTop:24, marginBottom:4 }}>Yours faithfully,</div>
        <div style={{ fontSize:13, fontWeight:600, color:"var(--erp-ink1)", marginBottom:2 }}>{data?.company_name}</div>
        <SignatureBlock signatories={sig?.signatories||["Authorised Signatory"]} />
        <DocFooter />
      </div>
    </div>
  );
};

const TemplateCompact = ({ title, data, sections, logo, watermark, docNumber, docDate, status }) => (
  <div style={{ position:"relative" }}>
    {watermark && <Watermark text={watermark} />}
    <div style={{ position:"relative", zIndex:1 }}>
      <DocHeader title={title} data={data} logo={logo} showQR={false} docNumber={docNumber} docDate={docDate} status={status} />
      {sections.map((sec, i) => (
        <div key={i} style={{ marginBottom:14 }}>
          <SectionHead title={sec.title} />
          {sec.type==="table"
            ? <DataTable columns={sec.columns} rows={data?.[sec.dataKey]||[]} />
            : <FieldGrid fields={sec.fields} data={data} cols={3} />
          }
        </div>
      ))}
      <DocFooter />
    </div>
  </div>
);

const TemplateTwoColumn = ({ title, data, sections, logo, watermark, docNumber, docDate, status }) => {
  const mid   = Math.ceil(sections.length/2);
  const left  = sections.filter((s,i) => s.side==="left"  || (!s.side && i < mid));
  const right = sections.filter((s,i) => s.side==="right" || (!s.side && i >= mid));
  return (
    <div style={{ position:"relative" }}>
      {watermark && <Watermark text={watermark} />}
      <div style={{ position:"relative", zIndex:1 }}>
        <DocHeader title={title} data={data} logo={logo} docNumber={docNumber} docDate={docDate} status={status} showQR />
        <div className="erp-two-col-grid">
          <div style={{ paddingRight:22 }}>
            {left.map((sec,i)=>(
              <div key={i} style={{ marginBottom:14 }}>
                <SectionHead title={sec.title} />
                {sec.type==="table"
                  ? <DataTable columns={sec.columns} rows={data?.[sec.dataKey]||[]} />
                  : <FieldGrid fields={sec.fields} data={data} cols={1} />}
              </div>
            ))}
          </div>
          <div className="erp-two-col-right" style={{ paddingLeft:22, borderLeft:"1px dashed var(--erp-tBorder)" }}>
            {right.map((sec,i)=>(
              <div key={i} style={{ marginBottom:14 }}>
                <SectionHead title={sec.title} />
                {sec.type==="table"
                  ? <DataTable columns={sec.columns} rows={data?.[sec.dataKey]||[]} />
                  : <FieldGrid fields={sec.fields} data={data} cols={1} />}
              </div>
            ))}
          </div>
        </div>
        <SignatureBlock />
        <DocFooter />
      </div>
    </div>
  );
};

const TMPL = { detail:TemplateDetail, invoice:TemplateInvoice, list:TemplateList, letter:TemplateLetter, compact:TemplateCompact, twoCol:TemplateTwoColumn };

/* ─── MAIN EXPORT ───────────────────────────────────────── */

/**
 * ERPPrintPreview
 *
 * Props:
 *  title              string    — document title shown in header + toolbar
 *  data               object    — flat data object (all field values)
 *  sections           array     — section config (see examples below)
 *  logo               string    — image URL shown in doc header
 *  onBack             fn        — back button callback
 *  defaultTemplate    string    — "detail"|"invoice"|"list"|"letter"|"compact"|"twoCol"
 *  allowedTemplates   string[]  — limit which tabs appear (omit = all)
 *  watermark          string    — "DRAFT"|"CANCELLED"|"COPY"|"VOID"
 *  status             string    — "active"|"draft"|"cancelled"  → badge in header
 *  docNumber          string    — shown in toolbar + doc meta strip
 *  docDate            string    — shown in doc meta strip
 *  onTemplateChange   fn        — (id) => void
 */
const ERPPrintPreview = ({
  title = "Document",
  data = {},
  sections = [],
  onBack,
  logo,
  defaultTemplate = "detail",
  allowedTemplates,
  watermark,
  status,
  docNumber,
  docDate,
  onTemplateChange,
}) => {
  const printRef = useRef();
  const [active, setActive] = useState(defaultTemplate);

  const visible = allowedTemplates
    ? TEMPLATES.filter(t => allowedTemplates.includes(t.id))
    : TEMPLATES;

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `${title}_${docNumber || Date.now()}`,
  });

  const switchTemplate = useCallback(id => {
    setActive(id);
    onTemplateChange?.(id);
  }, [onTemplateChange]);

  const ActiveTmpl = TMPL[active] || TemplateDetail;

  const wmColors = { DRAFT:"#f59e0b", CANCELLED:"#ef4444", COPY:"#60a5fa", VOID:"#94a3b8" };
  const wmC = wmColors[watermark?.toUpperCase()];

  return (
    <div className="erp-preview-root" style={{ width:"100%", background:"#0f1117" }}>
      <Fonts />

      {/* ── STICKY TOOLBAR ── */}
      <div className="erp-toolbar">

        {/* Left: back + title */}
        <div className="erp-toolbar-left">
          {onBack && (
            <button className="erp-icon-btn" onClick={onBack} title="Back">
              <ArrowLeft size={16} />
            </button>
          )}
          <div style={{ width:1, height:20, background:"var(--erp-border)" }} />
          <div>
            <div className="erp-toolbar-title">{title}</div>
            {docNumber && (
              <div className="erp-mono" style={{ fontSize:9.5, color:"#4b5563", marginTop:1 }}>{docNumber}</div>
            )}
          </div>
        </div>

        {/* Mid: template switcher — scrolls horizontally on mobile */}
        <div className="erp-toolbar-mid">
          {visible.map(t => {
            const { Icon } = t;
            const isA = t.id === active;
            return (
              <button key={t.id} className={`erp-tab${isA?" active":""}`} onClick={() => switchTemplate(t.id)} title={t.desc}>
                <Icon size={11} />{t.label}
              </button>
            );
          })}
        </div>

        {/* Right: badges + actions */}
        <div className="erp-toolbar-right">
          {watermark && wmC && (
            <div className="erp-wm-pill" style={{ background:`${wmC}18`, border:`1px solid ${wmC}55`, color:wmC }}>
              {watermark==="CANCELLED" ? <Ban size={10}/> : <AlertTriangle size={10}/>}
              {watermark}
            </div>
          )}
          <button className="erp-btn-ghost" onClick={handlePrint}>
            <Download size={13} />
            <span className="hide-sm">PDF</span>
          </button>
          <button className="erp-btn-primary" onClick={handlePrint}>
            <Printer size={13} /> Print
          </button>
        </div>
      </div>

      {/* ── CANVAS ── */}
      <div className="erp-canvas">
        <div className="erp-paper-shell">
          <div className="erp-paper" ref={printRef}>
            <ActiveTmpl
              title={title}
              data={data}
              sections={sections}
              logo={logo}
              watermark={watermark}
              status={status}
              docNumber={docNumber}
              docDate={docDate}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ERPPrintPreview;


/* ═══════════════════════════════════════════════════════════
   USAGE EXAMPLES
═══════════════════════════════════════════════════════════

─── Company Master (Detail) ────────────────────────────────
<ERPPrintPreview
  title="Company Master"
  data={companyRecord}
  logo="/finaman-logo.png"
  defaultTemplate="detail"
  allowedTemplates={["detail","compact","twoCol"]}
  status="active"
  docNumber="COM-2024-001"
  docDate="27 Apr 2025"
  sections={[
    { type:"fields", title:"Basic Information", fields:[
      { label:"Company Name",   key:"company_name" },
      { label:"Trade Name",     key:"trade_name" },
      { label:"Business Type",  key:"business_type" },
      { label:"Reg. No.",       key:"registration_number", mono:true },
      { label:"CIN No.",        key:"cin_number",          mono:true },
    ]},
    { type:"fields", title:"Tax & Compliance", columns:2, fields:[
      { label:"GSTIN",  key:"gstin_number", mono:true },
      { label:"PAN",    key:"pan_number",   mono:true },
      { label:"TAN",    key:"tan_number",   mono:true },
    ]},
    { type:"fields", title:"Bank Details", fields:[
      { label:"Bank Name",   key:"bank_name" },
      { label:"Account No.", key:"bank_account_number", mono:true },
      { label:"IFSC Code",   key:"ifsc_code",           mono:true },
    ]},
  ]}
  onBack={() => setShowPreview(false)}
/>

─── Tax Invoice (Invoice) ──────────────────────────────────
<ERPPrintPreview
  title="Tax Invoice"
  data={invoiceData}
  logo="/finaman-logo.png"
  defaultTemplate="invoice"
  watermark={invoiceData.status==="draft" ? "DRAFT" : undefined}
  status={invoiceData.status}
  docNumber={invoiceData.invoice_number}
  docDate={invoiceData.invoice_date}
  sections={[
    { type:"fields", title:"Invoice Details", fields:[
      { label:"Invoice No.",   key:"invoice_number", mono:true },
      { label:"Invoice Date",  key:"invoice_date" },
      { label:"Due Date",      key:"due_date" },
      { label:"Payment Terms", key:"payment_terms" },
    ]},
    { type:"fields", title:"Bill To", position:"receiver", fields:[
      { key:"customer_name" },
      { key:"customer_address" },
      { key:"customer_gstin" },
    ]},
    { type:"table", title:"Line Items", dataKey:"line_items",
      showTotals:true, totalFields:[{ key:"amount", value:"₹1,23,456" }],
      columns:[
        { key:"sno",         label:"#",    align:"center" },
        { key:"description", label:"Description" },
        { key:"qty",         label:"Qty",  align:"right", mono:true },
        { key:"rate",        label:"Rate", align:"right", mono:true },
        { key:"amount",      label:"Amt",  align:"right", mono:true },
      ]},
    { type:"totals", rows:[
      { label:"Subtotal",    key:"subtotal" },
      { label:"CGST (9%)",   key:"cgst" },
      { label:"SGST (9%)",   key:"sgst" },
      { label:"Grand Total", key:"grand_total", bold:true },
    ]},
  ]}
  onBack={() => setShowPreview(false)}
/>

─── Stock Register (List) ──────────────────────────────────
<ERPPrintPreview
  title="Stock Movement Register"
  data={{ company_name:"ACME Ltd", dateRange:"Apr 2024 – Mar 2025", items:stockRows }}
  defaultTemplate="list"
  sections={[{ type:"table", dataKey:"items", showTotals:true,
    totalFields:[{ key:"closing", value:"4,250" }],
    columns:[
      { key:"item_code", label:"Code",    mono:true },
      { key:"item_name", label:"Item" },
      { key:"opening",   label:"Open",   align:"right", mono:true },
      { key:"inward",    label:"In",     align:"right", mono:true },
      { key:"outward",   label:"Out",    align:"right", mono:true },
      { key:"closing",   label:"Close",  align:"right", mono:true },
    ]
  }]}
  onBack={() => setShowPreview(false)}
/>
*/
