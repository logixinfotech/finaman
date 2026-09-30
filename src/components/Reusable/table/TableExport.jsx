// export default TableExport;
import { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  Eye,
  BookOpen,
} from "lucide-react";

const escapeHtml = (str) =>
  String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const cellValue = (row, c) => {
  if (typeof c.render === "function") {
    const v = c.render(row);
    if (typeof v === "string" || typeof v === "number") return v;
  }
  return row[c.key] ?? "";
};

const TableExport = ({ title, columns, data, visibleColumns, logbook }) => {
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const downloadBtnRef = useRef(null);
  const downloadMenuRef = useRef(null);
  const printBtnRef = useRef(null);
  const printMenuRef = useRef(null);

  const [downloadPos, setDownloadPos] = useState({ top: 0, right: 0 });
  const [printPos, setPrintPos] = useState({ top: 0, right: 0 });

  const visibleCols = columns.filter((c) => visibleColumns[c.key]);

  // ── position the download dropdown relative to its trigger button ──
  useEffect(() => {
    if (!downloadOpen) return;
    const updatePos = () => {
      if (downloadBtnRef.current) {
        const rect = downloadBtnRef.current.getBoundingClientRect();
        setDownloadPos({
          top: rect.bottom + 6,
          right: window.innerWidth - rect.right,
        });
      }
    };
    updatePos();
    window.addEventListener("scroll", updatePos, true);
    window.addEventListener("resize", updatePos);
    return () => {
      window.removeEventListener("scroll", updatePos, true);
      window.removeEventListener("resize", updatePos);
    };
  }, [downloadOpen]);

  // ── position the print dropdown relative to its trigger button ──
  useEffect(() => {
    if (!printOpen) return;
    const updatePos = () => {
      if (printBtnRef.current) {
        const rect = printBtnRef.current.getBoundingClientRect();
        setPrintPos({
          top: rect.bottom + 6,
          right: window.innerWidth - rect.right,
        });
      }
    };
    updatePos();
    window.addEventListener("scroll", updatePos, true);
    window.addEventListener("resize", updatePos);
    return () => {
      window.removeEventListener("scroll", updatePos, true);
      window.removeEventListener("resize", updatePos);
    };
  }, [printOpen]);

  // ── click outside (checks both trigger buttons and portal menus) ──
  useEffect(() => {
    const handleOutside = (e) => {
      const clickedDownloadBtn =
        downloadBtnRef.current && downloadBtnRef.current.contains(e.target);
      const clickedDownloadMenu =
        downloadMenuRef.current && downloadMenuRef.current.contains(e.target);
      if (!clickedDownloadBtn && !clickedDownloadMenu) {
        setDownloadOpen(false);
      }

      const clickedPrintBtn =
        printBtnRef.current && printBtnRef.current.contains(e.target);
      const clickedPrintMenu =
        printMenuRef.current && printMenuRef.current.contains(e.target);
      if (!clickedPrintBtn && !clickedPrintMenu) {
        setPrintOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const exportCSV = () => {
    setSelected("csv");

    const header = visibleCols.map((c) => c.label).join(",");
    const rows = data.map((row) =>
      visibleCols
        .map((c) => `"${String(cellValue(row, c)).replace(/"/g, '""')}"`)
        .join(","),
    );

    const blob = new Blob([header + "\n" + rows.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${title || "table"}.csv`;
    link.click();

    setDownloadOpen(false);
  };

  const openPrintWindow = (type) => {
    setSelected(type);

    const win = window.open("", "_blank");

    if (!win) {
      alert(
        "Popup blocked hai! Print/PDF use karne ke liye is site ke liye popup allow karo browser settings mein.",
      );
      setDownloadOpen(false);
      return;
    }

    win.document.write(`
      <html>
      <head>
      <title>${escapeHtml(title)}</title>
      <style>
      body{font-family:Arial;padding:20px}
      table{width:100%;border-collapse:collapse;font-size:12px}
      th,td{border:1px solid #ddd;padding:6px}
      th{background:#f3f4f6}
      </style>
      </head>
      <body>
      <h3>${escapeHtml(title)}</h3>
      <table>
      <thead>
      <tr>${visibleCols.map((c) => `<th>${escapeHtml(c.label)}</th>`).join("")}</tr>
      </thead>
      <tbody>
      ${data
        .map(
          (row) =>
            `<tr>${visibleCols.map((c) => `<td>${escapeHtml(cellValue(row, c))}</td>`).join("")}</tr>`,
        )
        .join("")}
      </tbody>
      </table>
      </body>
      </html>
    `);

    win.document.close();
    if (type === "print" || type === "pdf") win.print();

    setDownloadOpen(false);
    setPrintOpen(false);
  };

  // ── Logbook PDF — formal GMP register format ──
  // ── Logbook PDF — formal GMP register, FINAMAN ERP visual style ──
  const openLogbookWindow = () => {
    if (!logbook) return;
    setSelected("logbook");

    const win = window.open("", "_blank");
    if (!win) {
      alert("Popup blocked. Please allow popups for this site to generate the Logbook PDF.");
      setDownloadOpen(false);
      return;
    }

    const cols = logbook.columns || visibleCols;
    const rows = logbook.excludeRow ? data.filter((r) => !logbook.excludeRow(r)) : data;

    const fmt = (d) => {
      if (!d) return "";
      const s = String(d).slice(0, 10);
      const [y, m, dd] = s.split("-");
      return y && m && dd ? `${dd}-${m}-${y}` : s;
    };
    const dates = logbook.dateKey
      ? rows.map((r) => String(r[logbook.dateKey] || "").slice(0, 10)).filter(Boolean).sort()
      : [];
    const period = dates.length ? `${fmt(dates[0])} — ${fmt(dates[dates.length - 1])}` : "All records";

    const sk = logbook.statusKey;
    const count = (v) => (sk ? rows.filter((r) => r[sk] === v).length : 0);
    const closed = count("Closed"), rejected = count("Rejected");
    const open = rows.length - closed - rejected;

    // Status pill colour class (only used when column key === statusKey)
    const pillClass = (v) => {
      const s = String(v || "").toLowerCase();
      if (s.startsWith("closed")) return "p-green";
      if (s.startsWith("rejected")) return "p-red";
      if (s === "open") return "p-blue";
      return "p-amber";
    };

    const now = new Date();
    const generated = `${fmt(now.toISOString())}, ${now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`;
    const year = now.getFullYear();
    const docRef = logbook.docRef || `LOG-${(logbook.code || title || "REG").toUpperCase()}-${year}`;
    const company = logbook.company || "";
    const mark = (company.trim()[0] || "F").toUpperCase();
    const heading = logbook.title || (title + " LOGBOOK").toUpperCase();

    win.document.write(`
      <html><head><title>${escapeHtml(heading)}</title>
          <style>
        @page { size: A4 landscape; margin: 10mm 10mm 16mm 10mm;
          @bottom-left { content: "${escapeHtml(docRef)}  ·  System generated — uncontrolled when printed"; font: 8pt "Segoe UI",system-ui,Arial; color:#94a3b8 }
          @bottom-right { content: "Page " counter(page) " of " counter(pages); font: 8pt "Segoe UI",system-ui,Arial; color:#64748b } }
        *{box-sizing:border-box}
        body{font-family:"Segoe UI",system-ui,Arial,sans-serif;color:#0f172a;margin:0;font-size:10.5pt;-webkit-print-color-adjust:exact;print-color-adjust:exact}

        .bar{display:flex;justify-content:space-between;align-items:center;background:#0b1e4b;color:#fff;border-radius:8px;padding:9pt 12pt}
        .brand{display:flex;align-items:center;gap:9pt}
        .mark{width:30pt;height:30pt;border-radius:7pt;background:#2563eb;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:15pt}
        .co{font-size:13pt;font-weight:700;letter-spacing:.3pt;line-height:1.1}
        .co small{display:block;font-size:8pt;color:#93c5fd;font-weight:600;letter-spacing:1pt;text-transform:uppercase;margin-top:3pt}
        .meta{display:flex;gap:6pt}
        .chip{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.18);border-radius:6pt;padding:4pt 9pt;min-width:95pt}
        .chip span{display:block;font-size:7pt;letter-spacing:.8pt;color:#93c5fd;text-transform:uppercase}
        .chip b{display:block;font-size:10pt;margin-top:1pt;font-weight:600}

        .ttl{display:flex;align-items:center;gap:10pt;margin:11pt 0 8pt}
        .ttl:before,.ttl:after{content:"";flex:1;height:1px;background:#cbd5e1}
        .ttl h1{margin:0;font-size:16pt;letter-spacing:2.5pt;font-weight:800;color:#0b1e4b;text-align:center}
        .ttl h1 small{display:block;font-size:8.5pt;letter-spacing:.2pt;color:#64748b;font-weight:500;margin-top:2pt}

        .period{display:flex;justify-content:space-between;align-items:center;background:#eff6ff;border:1px solid #bfdbfe;border-left:3pt solid #2563eb;border-radius:6pt;padding:5pt 10pt;font-size:9.5pt;color:#334155;margin-bottom:8pt}
        .period b{color:#1d4ed8;font-weight:700}
        .period .gen{color:#64748b}

        table{width:100%;table-layout:fixed;border-collapse:separate;border-spacing:0;border:1px solid #cbd5e1;border-radius:6pt;overflow:hidden}
        thead{display:table-header-group}
        th{background:#e8edf7;color:#1e293b;font-size:8pt;text-align:left;padding:5pt 6pt;text-transform:uppercase;letter-spacing:.3pt;font-weight:700;border-bottom:2px solid #b0bed8;border-right:1px solid #d5dce8;white-space:normal;line-height:1.2}
        th:last-child{border-right:none}
        td{border-bottom:1px solid #e2e8f0;border-right:1px solid #eef2f7;padding:4pt 6pt;font-size:9pt;color:#1e293b;vertical-align:middle;white-space:normal;word-break:break-word;overflow-wrap:anywhere;line-height:1.3}
        td:last-child{border-right:none}
        tr:nth-child(even) td{background:#f8fafd}
        tr:last-child td{border-bottom:none}
        tr{page-break-inside:avoid}
        td.sr{color:#64748b;font-size:9pt;text-align:center}
        td.rec{font-weight:700;color:#0b1e4b;font-variant-numeric:tabular-nums;white-space:nowrap}
        td.c{text-align:center}
        .pill{display:inline-block;padding:1pt 6pt;border-radius:999px;font-size:7.5pt;font-weight:700;white-space:normal;line-height:1.3}
        .p-green{background:#dcfce7;color:#166534}.p-red{background:#fee2e2;color:#991b1b}
        .p-blue{background:#dbeafe;color:#1e40af}.p-amber{background:#fef3c7;color:#92400e}

        .stats{display:flex;gap:7pt;margin-top:10pt}
        .st{flex:1;border:1px solid #dde1ea;border-radius:6pt;padding:6pt 10pt;background:#fff;display:flex;justify-content:space-between;align-items:center}
        .st span{font-size:8pt;letter-spacing:.8pt;text-transform:uppercase;color:#64748b;font-weight:600}
        .st b{font-size:15pt;font-weight:800}
        .st.t b{color:#0b1e4b}.st.c b{color:#15803d}.st.r b{color:#b91c1c}.st.o b{color:#b45309}

        .sign{display:flex;gap:14pt;margin-top:24pt;page-break-inside:avoid}
        .sign div{flex:1;border-top:1.5px solid #334155;padding-top:4pt;font-size:8.5pt;color:#334155;text-transform:uppercase;letter-spacing:.6pt;font-weight:600}
        .sign div i{display:block;font-style:normal;color:#94a3b8;font-size:8pt;margin-top:12pt;letter-spacing:0;text-transform:none;font-weight:400}
      </style></head><body>

      <div class="bar">
        <div class="brand">
          <div class="mark">${escapeHtml(mark)}</div>
          <div class="co">${escapeHtml(company)}<small>${escapeHtml(logbook.subtitle || "Quality Management System")}</small></div>
        </div>
        <div class="meta">
          <div class="chip"><span>Doc. Ref.</span><b>${escapeHtml(docRef)}</b></div>
          <div class="chip"><span>Format No.</span><b>${escapeHtml(logbook.formatNo || "QA/F/LOG-01")}</b></div>
          <div class="chip"><span>Effective</span><b>${escapeHtml(logbook.effectiveDate || `01-01-${year}`)}</b></div>
        </div>
      </div>

      <div class="ttl"><h1>${escapeHtml(heading)}<small>${escapeHtml(logbook.description || `Chronological Register of ${title} Records`)}</small></h1></div>

      <div class="period">
        <span>PERIOD &nbsp; <b>${escapeHtml(period)}</b></span>
        <span class="gen">Generated ${escapeHtml(generated)} &nbsp;·&nbsp; By <b style="color:#334155">${escapeHtml(logbook.generatedBy || "")}</b> &nbsp;·&nbsp; ${rows.length} record${rows.length === 1 ? "" : "s"}</span>
      </div>

      <table>
        <thead><tr><th style="width:4%;text-align:center">Sr</th>${cols.map((c) =>
      `<th${c.pdfWidth ? ` style="width:${c.pdfWidth}"` : ""}>${escapeHtml(c.label)}</th>`).join("")}</tr></thead>        <tbody>
        ${rows.map((row, i) => `<tr><td class="sr">${i + 1}</td>${cols.map((c, j) => {
        const v = cellValue(row, c);
        const txt = escapeHtml(v || "—");
        if (sk && c.key === sk && v) return `<td><span class="pill ${pillClass(v)}">${txt}</span></td>`;
        return `<td class="${j === 0 ? "rec" : ""}${c.align === "center" ? " c" : ""}">${txt}</td>`;
      }).join("")}</tr>`).join("")}
        </tbody>
      </table>

      <div class="stats">
        <div class="st t"><span>Total Records</span><b>${rows.length}</b></div>
        <div class="st c"><span>Closed</span><b>${closed}</b></div>
        <div class="st r"><span>Rejected</span><b>${rejected}</b></div>
        <div class="st o"><span>Open / In Progress</span><b>${open}</b></div>
      </div>

      <div class="sign">
        <div>Prepared By (QA)<i>Sign &amp; Date</i></div>
        <div>Reviewed By (QA Head)<i>Sign &amp; Date</i></div>
        <div>Approved By (Head – Quality)<i>Sign &amp; Date</i></div>
      </div>
      </body></html>
    `);
    win.document.close();
    win.print();
    setDownloadOpen(false);
  };

  return (
    <div className="flex items-center gap-1.5">
      {/* ── PRINT BUTTON — dropdown with Direct Print / Preview ── */}
      <div className="relative shrink-0">
        <button
          ref={printBtnRef}
          className="h-7 w-9 flex items-center justify-center rounded-md
          border border-purple-300 bg-purple-50 text-purple-600
          hover:bg-purple-100 transition-all"
          onClick={() => setPrintOpen((p) => !p)}
          title="Print"
        >
          <Printer size={14} />
        </button>

        {printOpen &&
          createPortal(
            <div
              ref={printMenuRef}
              style={{
                position: "fixed",
                top: printPos.top,
                right: printPos.right,
              }}
              className="min-w-[180px] bg-white border border-gray-200 rounded-md shadow-lg py-1 z-[9999]"
            >
              <ExportItem
                icon={<Printer size={14} className="text-purple-600" />}
                label="Direct Print"
                active={selected === "print"}
                onClick={() => openPrintWindow("print")}
              />

              <ExportItem
                icon={<Eye size={14} className="text-blue-600" />}
                label="Preview"
                active={selected === "preview"}
                onClick={() => openPrintWindow("preview")}
              />
            </div>,
            document.body,
          )}
      </div>

      {/* ── DOWNLOAD BUTTON — dropdown with CSV / PDF ── */}
      <div className="relative shrink-0">
        <button
          ref={downloadBtnRef}
          className="h-7 w-9 flex items-center justify-center rounded-md
          border border-blue-300 bg-blue-50 text-blue-600
          hover:bg-blue-100 transition-all"
          onClick={() => setDownloadOpen((p) => !p)}
          title="Download"
        >
          <Download size={14} />
        </button>

        {downloadOpen &&
          createPortal(
            <div
              ref={downloadMenuRef}
              style={{
                position: "fixed",
                top: downloadPos.top,
                right: downloadPos.right,
              }}
              className="min-w-[180px] bg-white border border-gray-200 rounded-md shadow-lg py-1 z-[9999]"
            >
              <ExportItem
                icon={
                  <FileSpreadsheet size={14} className="text-green-600" />
                }
                label="Download CSV"
                active={selected === "csv"}
                onClick={exportCSV}
              />

              <ExportItem
                icon={<FileText size={14} className="text-red-600" />}
                label="Download PDF"
                active={selected === "pdf"}
                onClick={() => openPrintWindow("pdf")}
              />
              {logbook && (
                <ExportItem
                  icon={<BookOpen size={14} className="text-indigo-600" />}
                  label="Logbook (PDF)"
                  active={selected === "logbook"}
                  onClick={openLogbookWindow}
                />
              )}
            </div>,
            document.body,
          )}
      </div>
    </div>
  );
};

const ExportItem = ({ icon, label, onClick, active }) => (
  <div
    onClick={onClick}
    className={`flex items-center gap-2 px-3 py-1.5 text-[13px]
    cursor-pointer
    ${active ? "bg-gray-100 font-medium" : ""}
    hover:bg-gray-100`}
  >
    {icon}
    {label}
  </div>
);

export default TableExport;