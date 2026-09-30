// Opens a print-ready page for one register (paper logbook layout) and triggers window.print().
import { fmtDate, fmtDateTime, fmtTime, entryNo, isVisible } from "./LogbookUi";

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export function buildRegisterHtml(reg, type, entries, opts = {}) {
  const company = opts.company || "";
  const cols = type?.columns || [];
  const live = entries.filter((e) => e.Status !== "Cancelled").length;

  const head = `
    <tr>
      <th>Entry No.</th><th>Date &amp; time</th>
      ${cols.map((c) => `<th>${esc(c.label)}</th>`).join("")}
      <th>Done by</th>${type?.verifyRequired ? "<th>Verified by</th>" : ""}<th>Status</th>
    </tr>`;

  const rows = entries.map((e) => {
    const cx = e.Status === "Cancelled" ? "cancel" : "";
    const cells = cols.map((c) => `<td>${isVisible(c, e.data) && e.data?.[c.key] ? esc(c.type === "time" ? fmtTime(e.data[c.key]) : e.data[c.key]) : "—"}</td>`).join("");
    const st = e.Status === "Cancelled" ? `Cancelled<br><small>${esc(e.CancelReason)} — ${esc(e.CancelledBy)}</small>` : esc(e.Status);
    return `<tr class="${cx}">
      <td class="mono">${esc(entryNo(reg.RecordNo, e.SeqNo))}</td><td>${fmtDateTime(e.EntryAt)}${e.IsLateEntry ? ' <em>(late)</em>' : ""}</td>
      ${cells}
      <td>${esc(e.DoneBy)}<br><small>${fmtDateTime(e.DoneAt)}</small></td>
      ${type?.verifyRequired ? `<td>${e.VerifiedBy ? `${esc(e.VerifiedBy)}<br><small>${fmtDateTime(e.VerifiedAt)}</small>` : "—"}</td>` : ""}
      <td class="st">${st}</td>
    </tr>`;
  }).join("");

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(reg.RecordNo)} — ${esc(type?.name)}</title>
  <style>
    @page { size: A4 landscape; margin: 12mm; }
    body { font: 10.5px/1.35 Arial, Helvetica, sans-serif; color: #111; margin: 0; }
    .hd { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #111; padding-bottom: 6px; margin-bottom: 8px; }
    .hd h1 { font-size: 15px; margin: 0; } .hd .co { font-size: 12px; font-weight: 700; }
    .meta { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px 16px; font-size: 10px; margin-bottom: 8px; }
    .meta b { display: inline-block; min-width: 78px; color: #444; font-weight: 600; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #555; padding: 3px 5px; vertical-align: top; text-align: left; }
    th { background: #eee; font-size: 9.5px; text-transform: none; }
    td.r, th.r { text-align: right; width: 26px; } .mono { font-family: Consolas, monospace; font-size: 9.5px; white-space: nowrap; }
    tr.cancel td { color: #777; text-decoration: line-through; } tr.cancel td.st { text-decoration: none; color: #b00; }
    small { color: #555; font-size: 9px; } em { color: #b45309; font-style: normal; font-weight: 600; }
    .ft { margin-top: 10px; display: flex; justify-content: space-between; font-size: 9.5px; color: #444; }
    .sig { margin-top: 18px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
    .sig div { border-top: 1px solid #111; padding-top: 3px; font-size: 9.5px; }
    thead { display: table-header-group; } tr { page-break-inside: avoid; }
  </style></head><body>
  <div class="hd"><div><div class="co">${esc(company)}</div><h1>${esc(type?.name || "Logbook")}</h1></div>
    <div style="text-align:right"><div><b>Register no.</b> ${esc(reg.RecordNo)}</div><div>Status: ${esc(reg.Status)}</div></div></div>
  <div class="meta">
    <div><b>Subject</b> ${esc(reg.RefName)}</div><div><b>Department</b> ${esc(reg.Department || "—")}</div>
    <div><b>Issued on</b> ${fmtDate(reg.IssuedOn)}</div><div><b>Issued by</b> ${esc(reg.IssuedBy)}</div>
    ${reg.Status === "Closed" ? `<div><b>Closed on</b> ${fmtDateTime(reg.ClosedOn)}</div><div><b>Closed by</b> ${esc(reg.ClosedBy)}</div>` : ""}
    <div><b>Entries</b> ${live} valid · ${entries.length - live} cancelled</div>
  </div>
  <table><thead>${head}</thead><tbody>${rows || `<tr><td colspan="${cols.length + 5}">No entries</td></tr>`}</tbody></table>
  <div class="sig"><div>Reviewed by (Dept. Head) / Date</div><div>Reviewed by (QA) / Date</div><div>Remarks</div></div>
  <div class="ft"><span>Printed ${fmtDateTime(new Date())}${opts.printedBy ? ` by ${esc(opts.printedBy)}` : ""}</span><span>Electronic record — FINAMAN QMS e-Logbook. Cancelled entries are retained as per GMP.</span></div>
  </body></html>`;
  return html;
}

/** Direct print in a new window (no preview) */
export function printRegister(reg, type, entries, opts = {}) {
  const html = buildRegisterHtml(reg, type, entries, opts).replace("</body>", "<script>window.onload=function(){window.print();}</script></body>");
  const w = window.open("", "_blank", "width=1100,height=800");
  if (!w) return;
  w.document.open(); w.document.write(html); w.document.close();
}