 
// import { useRef, useState, useEffect } from "react";
// import {
//   Download,
//   FileSpreadsheet,
//   FileText,
//   Printer,
//   Eye,
// } from "lucide-react";
 
// const escapeHtml = (str) =>
//   String(str ?? "")
//     .replace(/&/g, "&amp;")
//     .replace(/</g, "&lt;")
//     .replace(/>/g, "&gt;")
//     .replace(/"/g, "&quot;");

// const TableExport = ({ title, columns, data, visibleColumns }) => {
//   const [downloadOpen, setDownloadOpen] = useState(false);
//   const [printOpen, setPrintOpen] = useState(false);
//   const [selected, setSelected] = useState(null);
//   const downloadRef = useRef(null);
//   const printRef = useRef(null);

//   const visibleCols = columns.filter((c) => visibleColumns[c.key]);

//   useEffect(() => {
//     const handleOutside = (e) => {
//       if (downloadRef.current && !downloadRef.current.contains(e.target)) {
//         setDownloadOpen(false);
//       }
//       if (printRef.current && !printRef.current.contains(e.target)) {
//         setPrintOpen(false);
//       }
//     };

//     document.addEventListener("mousedown", handleOutside);
//     return () => document.removeEventListener("mousedown", handleOutside);
//   }, []);

//   const exportCSV = () => {
//     setSelected("csv");

//     const header = visibleCols.map((c) => c.label).join(",");
//     const rows = data.map((row) =>
//       visibleCols
//         .map((c) => `"${String(row[c.key] ?? "").replace(/"/g, '""')}"`)
//         .join(","),
//     );

//     const blob = new Blob([header + "\n" + rows.join("\n")], {
//       type: "text/csv;charset=utf-8;",
//     });

//     const link = document.createElement("a");
//     link.href = URL.createObjectURL(blob);
//     link.download = `${title || "table"}.csv`;
//     link.click();

//     setDownloadOpen(false);
//   };

//   const openPrintWindow = (type) => {
//     setSelected(type);

//     const win = window.open("", "_blank");

//     if (!win) {
//       alert(
//         "Popup blocked hai! Print/PDF use karne ke liye is site ke liye popup allow karo browser settings mein.",
//       );
//       setDownloadOpen(false);
//       return;
//     }

//     win.document.write(`
//       <html>
//       <head>
//       <title>${escapeHtml(title)}</title>
//       <style>
//       body{font-family:Arial;padding:20px}
//       table{width:100%;border-collapse:collapse;font-size:12px}
//       th,td{border:1px solid #ddd;padding:6px}
//       th{background:#f3f4f6}
//       </style>
//       </head>
//       <body>
//       <h3>${escapeHtml(title)}</h3>
//       <table>
//       <thead>
//       <tr>${visibleCols.map((c) => `<th>${escapeHtml(c.label)}</th>`).join("")}</tr>
//       </thead>
//       <tbody>
//       ${data
//         .map(
//           (row) =>
//             `<tr>${visibleCols.map((c) => `<td>${escapeHtml(row[c.key])}</td>`).join("")}</tr>`,
//         )
//         .join("")}
//       </tbody>
//       </table>
//       </body>
//       </html>
//     `);

//     win.document.close();
//     if (type === "print" || type === "pdf") win.print();

//     setDownloadOpen(false);
//     setPrintOpen(false);
//   };

//   return (
//     <div className="flex items-center gap-1.5">
//       {/* ── PRINT BUTTON — dropdown with Direct Print / Preview ── */}
//       <div className="relative" ref={printRef}>
//         <button
//           className="h-7 w-9 flex items-center justify-center rounded-md
//           border border-purple-300 bg-purple-50 text-purple-600
//           hover:bg-purple-100 transition-all"
//           onClick={() => setPrintOpen((p) => !p)}
//           title="Print"
//         >
//           <Printer size={14} />
//         </button>

//         {printOpen && (
//           <div
//             className="absolute right-0 top-[110%] min-w-[180px]
//           bg-white border border-gray-200 rounded-md
//           shadow-lg py-1 z-50"
//           >
//             <ExportItem
//               icon={<Printer size={14} className="text-purple-600" />}
//               label="Direct Print"
//               active={selected === "print"}
//               onClick={() => openPrintWindow("print")}
//             />

//             <ExportItem
//               icon={<Eye size={14} className="text-blue-600" />}
//               label="Preview"
//               active={selected === "preview"}
//               onClick={() => openPrintWindow("preview")}
//             />
//           </div>
//         )}
//       </div>

//       {/* ── DOWNLOAD BUTTON — dropdown with CSV / PDF ── */}
//       <div className="relative" ref={downloadRef}>
//         <button
//           className="h-7 w-9 flex items-center justify-center rounded-md
//           border border-blue-300 bg-blue-50 text-blue-600
//           hover:bg-blue-100 transition-all"
//           onClick={() => setDownloadOpen((p) => !p)}
//           title="Download"
//         >
//           <Download size={14} />
//         </button>

//         {downloadOpen && (
//           <div
//             className="absolute right-0 top-[110%] min-w-[180px]
//           bg-white border border-gray-200 rounded-md
//           shadow-lg py-1 z-50"
//           >
//             <ExportItem
//               icon={<FileSpreadsheet size={14} className="text-green-600" />}
//               label="Download CSV"
//               active={selected === "csv"}
//               onClick={exportCSV}
//             />

//             <ExportItem
//               icon={<FileText size={14} className="text-red-600" />}
//               label="Download PDF"
//               active={selected === "pdf"}
//               onClick={() => openPrintWindow("pdf")}
//             />
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// const ExportItem = ({ icon, label, onClick, active }) => (
//   <div
//     onClick={onClick}
//     className={`flex items-center gap-2 px-3 py-1.5 text-[13px]
//     cursor-pointer
//     ${active ? "bg-gray-100 font-medium" : ""}
//     hover:bg-gray-100`}
//   >
//     {icon}
//     {label}
//   </div>
// );

// export default TableExport;
import { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  Eye,
} from "lucide-react";

const escapeHtml = (str) =>
  String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const TableExport = ({ title, columns, data, visibleColumns }) => {
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
        .map((c) => `"${String(row[c.key] ?? "").replace(/"/g, '""')}"`)
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
            `<tr>${visibleCols.map((c) => `<td>${escapeHtml(row[c.key])}</td>`).join("")}</tr>`,
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