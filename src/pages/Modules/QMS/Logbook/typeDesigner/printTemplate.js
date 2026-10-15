import { SRC_LABEL, TYPE_META, TPL_STATUS } from "./model";

/* ═══════════════════════════════════════════════════════════════════════
   Print layouts for a logbook template (HTML strings for the print iframe)
     1. buildBlankFormat — the controlled paper format: header block, register details,
        one column per field + Sr / Date / Done by / Verified by, N blank rows, sign-off block
     2. buildSpecification — the template specification: fields, rules, workflow, version history
   ═══════════════════════════════════════════════════════════════════════ */

const esc = (v) => String(v ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const d2 = (n) => String(n).padStart(2, "0");
const fmtDT = (v) => { if (!v) return ""; const d = new Date(v); return Number.isNaN(d.getTime()) ? "" : `${d2(d.getDate())}-${d2(d.getMonth() + 1)}-${d.getFullYear()} ${d2(d.getHours())}:${d2(d.getMinutes())}`; };
const fmtD = (v) => fmtDT(v).slice(0, 10);
const REF_LABEL = { equipment: "Equipment name & ID", instrument: "Instrument name & ID", area: "Area / room name & ID", general: "Register for" };

/** Small hint printed under each column heading so the paper form is self-explaining */
const hintOf = (c) => {
  const h = [];
  if (c.type === "select") h.push(c.source ? `${SRC_LABEL[c.source] || c.source} name` : (c.options || []).join(" / "));
  if (c.type === "time") h.push("HH:MM");
  if (c.type === "date") h.push("DD/MM/YYYY");
  if (c.type === "number" && (c.min != null || c.max != null)) h.push(`Limit ${c.min ?? "…"}–${c.max ?? "…"}${c.unit ? ` ${c.unit}` : ""}`);
  if (c.showIf?.field) h.push(`only if ${c.showIf.field} ${c.showIf.notEquals != null ? "≠" : "="} ${c.showIf.equals ?? c.showIf.notEquals}`);
  return h.join(" · ");
};

const BASE_CSS = (landscape) => `
  @page { size: A4 ${landscape ? "landscape" : "portrait"}; margin: 9mm 8mm 12mm; }
  * { box-sizing: border-box; }
  body { font-family: "Segoe UI", Arial, sans-serif; color: #0f172a; margin: 0; padding: 14px; font-size: 10.5px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  @media print { body { padding: 0; } .noprint { display: none; } }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid #334155; padding: 4px 5px; vertical-align: top; }
  .hdr td { padding: 6px 8px; }
  .co { font-size: 14px; font-weight: 700; text-transform: uppercase; }
  .ttl { text-align: center; font-size: 15px; font-weight: 800; text-transform: uppercase; letter-spacing: .4px; background: #e8edf7; }
  .k { color: #475569; font-size: 9px; text-transform: uppercase; letter-spacing: .3px; display: block; }
  .v { font-weight: 700; font-size: 11px; }
  .line { display: inline-block; min-width: 170px; border-bottom: 1px solid #334155; height: 13px; margin: 0 14px 0 4px; }
  .meta { margin: 8px 0; display: flex; flex-wrap: wrap; row-gap: 6px; font-size: 10.5px; }
  .grid th { background: #1e3a8a; color: #fff; font-size: 9.5px; text-align: center; vertical-align: middle; }
  .grid th small { display: block; font-weight: 400; color: #c7d2fe; font-size: 8px; margin-top: 2px; }
  .grid td { height: 26px; }
  .grid tr:nth-child(even) td { background: #f8fafc; }
  thead { display: table-header-group; }
  tr { page-break-inside: avoid; }
  .sec { margin: 12px 0 5px; font-size: 11px; font-weight: 800; text-transform: uppercase; color: #1e3a8a; border-bottom: 2px solid #1e3a8a; padding-bottom: 2px; }
  .note { font-size: 9.5px; color: #334155; margin: 6px 0; }
  .sign td { height: 48px; width: 33.3%; }
  .foot { margin-top: 8px; display: flex; justify-content: space-between; font-size: 8.5px; color: #64748b; }
  .wm { position: fixed; top: 40%; left: 0; right: 0; text-align: center; font-size: 80px; font-weight: 900; color: rgba(220,38,38,.10); transform: rotate(-22deg); pointer-events: none; z-index: 0; }
  .spec th { background: #e8edf7; font-size: 9.5px; text-align: left; }
  .tag { display: inline-block; padding: 0 5px; border-radius: 8px; background: #eef2ff; color: #3730a3; font-size: 8.5px; font-weight: 700; }
`;

function headerBlock({ def, ver, company, title }) {
  return `
  <table class="hdr">
    <tr>
      <td rowspan="2" style="width:26%"><span class="co">${esc(company || "Company name")}</span></td>
      <td class="ttl" style="width:48%">${esc(title)}</td>
      <td style="width:26%"><span class="k">Format No.</span><span class="v">${esc(def.docNo || "—")}</span></td>
    </tr>
    <tr>
      <td style="text-align:center"><span class="k">Logbook template</span><span class="v">${esc(def.name)}</span></td>
      <td><span class="k">Version / Effective from</span><span class="v">${esc(ver.label)}${ver.effectiveFrom ? ` · ${esc(fmtD(ver.effectiveFrom))}` : ""}</span></td>
    </tr>
    <tr>
      <td><span class="k">SOP reference</span><span class="v">${esc(def.sopRef || "—")}</span></td>
      <td><span class="k">Category · issued against</span><span class="v">${esc(def.category)} · ${esc(def.refType)}</span></td>
      <td><span class="k">Page</span><span class="v">____ of ____</span></td>
    </tr>
  </table>`;
}

function signBlock(ver) {
  return `
  <table class="sign" style="margin-top:10px">
    <tr><th style="background:#e8edf7">Prepared by</th><th style="background:#e8edf7">Reviewed by</th><th style="background:#e8edf7">Approved by (QA)</th></tr>
    <tr>
      <td>${esc(ver.preparedBy || "")}<br/><span class="k" style="margin-top:22px">Sign / Date</span></td>
      <td>${esc(ver.reviewedBy || "")}<br/><span class="k" style="margin-top:22px">Sign / Date</span></td>
      <td>${esc(ver.approvedBy || "")}${ver.approvedAt ? ` · ${esc(fmtD(ver.approvedAt))}` : ""}<br/><span class="k" style="margin-top:22px">Sign / Date</span></td>
    </tr>
  </table>`;
}

const footer = (userName) => `<div class="foot"><span>Controlled format — printed from e-Logbook by ${esc(userName || "—")} on ${esc(fmtDT(new Date()))}</span><span>Uncontrolled when photocopied</span></div>`;
const watermark = (ver) => (ver.status !== "Effective" ? `<div class="wm">${ver.status === "Superseded" ? "SUPERSEDED" : "DRAFT — NOT FOR USE"}</div>` : "");

/** ver = { label, status, effectiveFrom, preparedBy, reviewedBy, approvedBy, approvedAt } */
export function buildBlankFormat({ def, ver, company, userName, rows = 15, landscape = true }) {
  const cols = def.columns || [];
  const wide = (c) => (c.type === "textarea" || /remark|comment|action|description/i.test(c.key) ? 2 : 1);
  const total = cols.reduce((a, c) => a + wide(c), 0) + 3 + (def.verifyRequired ? 2 : 0);
  const pct = (w) => `${((w / total) * 100).toFixed(1)}%`;
  const head = `
    <tr>
      <th style="width:${pct(0.6)}">Sr.<br/>No.</th>
      <th style="width:${pct(1)}">Date<small>DD/MM/YYYY</small></th>
      ${cols.map((c) => `<th style="width:${pct(wide(c))}">${esc(c.label)}${c.unit ? ` (${esc(c.unit)})` : ""}${c.required ? " *" : ""}${hintOf(c) ? `<small>${esc(hintOf(c))}</small>` : ""}</th>`).join("")}
      <th style="width:${pct(1.4)}">Done by<small>${def.entrySign ? "Sign / Date / Time" : "Name / Date"}</small></th>
      ${def.verifyRequired ? `<th style="width:${pct(1.4)}">Verified by<small>Sign / Date</small></th>` : ""}
    </tr>`;
  const empty = Array.from({ length: rows }, (_, i) => `<tr><td style="text-align:center;color:#94a3b8">${i + 1}</td><td></td>${cols.map(() => "<td></td>").join("")}<td></td>${def.verifyRequired ? "<td></td>" : ""}</tr>`).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(def.name)} — format</title><style>${BASE_CSS(landscape)}</style></head><body>
    ${watermark(ver)}
    ${headerBlock({ def, ver, company, title: def.name })}
    <div class="meta">
      <span>${esc(REF_LABEL[def.refType] || "Subject")}:<span class="line"></span></span>
      <span>Department:<span class="line" style="min-width:120px"></span></span>
      <span>Register No.:<span class="line" style="min-width:110px"></span></span>
      <span>Issued on:<span class="line" style="min-width:90px"></span></span>
    </div>
    ${def.description ? `<div class="note"><b>Instructions:</b> ${esc(def.description)}</div>` : ""}
    <table class="grid"><thead>${head}</thead><tbody>${empty}</tbody></table>
    <div class="note">* Mandatory. Record entries at the time of the activity${def.endTimeKey ? ` — an entry made more than ${esc(def.lateAfterMinutes || 30)} min after “${esc(cols.find((c) => c.key === def.endTimeKey)?.label || def.endTimeKey)}” is a late entry` : ""}. Corrections: single line strike-through, sign, date and reason. Do not overwrite or use correction fluid.</div>
    ${signBlock(ver)}
    ${footer(userName)}
  </body></html>`;
}

export function buildSpecification({ def, ver, versions = [], company, userName }) {
  const cols = def.columns || [];
  const yes = (b) => (b ? "Yes" : "No");
  const rows = cols.map((c, i) => `<tr>
      <td>${i + 1}</td><td><b>${esc(c.label)}</b>${c.helpText ? `<br/><span style="color:#64748b">${esc(c.helpText)}</span>` : ""}</td>
      <td><code>${esc(c.key)}</code></td><td>${esc(TYPE_META[c.type]?.label || c.type)}</td><td>${yes(c.required)}</td>
      <td>${c.type === "select" ? (c.source ? `<span class="tag">${esc(SRC_LABEL[c.source])} master</span>` : esc((c.options || []).join(", "))) : ""}</td>
      <td>${c.type === "number" ? esc([c.unit, c.min != null || c.max != null ? `${c.min ?? "…"} – ${c.max ?? "…"}` : ""].filter(Boolean).join(" · ")) : ""}</td>
      <td>${[c.showIf?.field ? `Show if ${esc(c.showIf.field)} ${c.showIf.notEquals != null ? "≠" : "="} ${esc(c.showIf.equals ?? c.showIf.notEquals)}` : "", c.afterField ? `Not before ${esc(c.afterField)}` : ""].filter(Boolean).join("<br/>")}</td>
    </tr>`).join("");
  const hist = versions.filter((v) => v.Status !== "Discarded").map((v) => `<tr>
      <td>v${v.VersionNo}</td><td>${esc(TPL_STATUS[v.Status]?.l || v.Status)}</td><td>${esc(v.ChangeReason || "")}</td>
      <td>${esc(v.UpdatedBy || v.CreatedBy || "")}<br/>${esc(fmtDT(v.UpdatedAt || v.CreatedAt))}</td>
      <td>${esc(v.ApprovedBy || "")}<br/>${esc(fmtDT(v.ApprovedAt))}</td><td>${esc(fmtD(v.EffectiveFrom))}</td></tr>`).join("");
  const roles = (r) => (r && r.length ? esc(r.join(", ")) : "Any logged-in user");
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(def.name)} — specification</title><style>${BASE_CSS(false)}</style></head><body>
    ${watermark(ver)}
    ${headerBlock({ def, ver, company, title: "Logbook template specification" })}
    <div class="sec">1. Purpose</div><div class="note">${esc(def.description || "—")}</div>
    <div class="sec">2. Entry fields (${cols.length})</div>
    <table class="spec"><thead><tr><th>#</th><th>Field</th><th>Key</th><th>Type</th><th>Mandatory</th><th>Choices</th><th>Unit / limits</th><th>Rules</th></tr></thead><tbody>${rows}</tbody></table>
    <div class="note">Added automatically by the system for every entry: entry number, date-time (server clock), done by, e-signature, verified by, status, late-entry and out-of-limit flags.</div>
    <div class="sec">3. Workflow &amp; access</div>
    <table class="spec"><tbody>
      <tr><th style="width:32%">e-Signature on every entry</th><td>${yes(def.entrySign)}</td></tr>
      <tr><th>Second-person verification</th><td>${yes(def.verifyRequired)}${def.verifyRequired ? " — the author can never verify own entry" : ""}</td></tr>
      <tr><th>Who can add entries</th><td>${roles(def.entryRoles)}</td></tr>
      <tr><th>Who can verify</th><td>${def.verifyRequired ? roles(def.verifyRoles) : "—"}</td></tr>
      <tr><th>Late-entry check</th><td>${def.endTimeKey ? `On “${esc(cols.find((c) => c.key === def.endTimeKey)?.label || def.endTimeKey)}”, after ${esc(def.lateAfterMinutes || 30)} min` : "Off"}</td></tr>
    </tbody></table>
    ${hist ? `<div class="sec">4. Version history</div><table class="spec"><thead><tr><th>Version</th><th>Status</th><th>Reason for change</th><th>Prepared</th><th>Approved</th><th>Effective</th></tr></thead><tbody>${hist}</tbody></table>` : ""}
    ${signBlock(ver)}
    ${footer(userName)}
  </body></html>`;
}
