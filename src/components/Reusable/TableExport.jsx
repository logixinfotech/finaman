import { useRef, useState } from "react";
import {
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  Eye,
} from "lucide-react";

const TableExport = ({
  title,
  columns,
  data,
  visibleColumns,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const visibleCols = columns.filter(c => visibleColumns[c.key]);

  /* ================= CSV ================= */
  const exportCSV = () => {
    const header = visibleCols.map(c => c.label).join(",");
    const rows = data.map(row =>
      visibleCols
        .map(c => `"${String(row[c.key] ?? "").replace(/"/g, '""')}"`)
        .join(",")
    );

    const blob = new Blob([header + "\n" + rows.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${title || "table"}.csv`;
    link.click();
  };

  /* ================= PDF / PRINT ================= */
  const openPrintWindow = (autoPrint = false) => {
    const win = window.open("", "_blank");

    win.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: Arial; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #ccc; padding: 6px; }
            th { background: #f3f4f6; }
          </style>
        </head>
        <body>
          <h3>${title}</h3>
          <table>
            <thead>
              <tr>
                ${visibleCols.map(c => `<th>${c.label}</th>`).join("")}
              </tr>
            </thead>
            <tbody>
              ${data.map(row => `
                <tr>
                  ${visibleCols.map(c => `<td>${row[c.key] ?? ""}</td>`).join("")}
                </tr>
              `).join("")}
            </tbody>
          </table>
        </body>
      </html>
    `);

    win.document.close();
    if (autoPrint) win.print();
  };

return (
  <div className="download-wrapper" ref={ref}>
    <button
      className="icon-btn"
      title="Export / Print"
      onClick={() => setOpen(p => !p)}
    >
      <Download />
    </button>

    {open && (
      <div className="download-dropdown">
        <div className="download-item" onClick={exportCSV}>
          <FileSpreadsheet size={14} className="icon-csv" />
          Download CSV
        </div>

        <div className="download-item" onClick={() => openPrintWindow(false)}>
          <Eye size={14} className="icon-preview" />
          Preview Print
        </div>

        <div className="download-item" onClick={() => openPrintWindow(true)}>
          <Printer size={14} className="icon-print" />
          Direct Print
        </div>

        <div className="download-item" onClick={() => openPrintWindow(true)}>
          <FileText size={14} className="icon-pdf" />
          Download PDF
        </div>
      </div>
    )}
  </div>
);

};

export default TableExport;
