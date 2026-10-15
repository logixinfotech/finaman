import { useMemo, useRef, useState } from "react";
import * as FaIcons from "react-icons/fa";
import { Modal, Btn, Kbd } from "../LogbookUi";
import { buildBlankFormat, buildSpecification } from "./printTemplate";
import { exportExcel, exportJson } from "./exportTemplate";

/* Print & export centre: pick a layout on the left, live A4 preview on the right */
const LAYOUTS = [
  { k: "format", l: "Blank logbook format", d: "Paper format for the shop floor — header, register details, blank rows, sign-off.", i: FaIcons.FaTable, c: "#4338ca" },
  { k: "spec", l: "Template specification", d: "Field list, rules, workflow and version history — for QA review / audit.", i: FaIcons.FaFileAlt, c: "#047857" },
];

export default function PrintCenter({ def, ver, versions, company, userName, initial = "format", onClose }) {
  const [layout, setLayout] = useState(initial);
  const [rows, setRows] = useState(15);
  const [landscape, setLandscape] = useState(true);
  const ref = useRef(null);
  const html = useMemo(() => (layout === "format"
    ? buildBlankFormat({ def, ver, company, userName, rows, landscape })
    : buildSpecification({ def, ver, versions, company, userName })), [layout, def, ver, versions, company, userName, rows, landscape]);
  const doPrint = () => { const w = ref.current?.contentWindow; if (w) { w.focus(); w.print(); } };

  return (
    <Modal title="Print & export" subtitle={`${def.name} · ${ver.label}`} icon={FaIcons.FaPrint} width="max-w-[1250px] w-[97vw]" onClose={onClose}
      footer={<>
        <span className="text-[11.5px] text-[#5b6b85]">Tip: in the print dialog choose <b>Save as PDF</b> to get a PDF file.{ver.status !== "Effective" && <b className="text-[#dc2626]"> Not effective — printed with a DRAFT watermark.</b>}</span>
        <div className="ml-auto flex gap-2">
          <Btn onClick={onClose}>Close <Kbd>Esc</Kbd></Btn>
          <Btn kind="primary" onClick={doPrint}><FaIcons.FaPrint size={11} /> Print / Save PDF</Btn>
        </div>
      </>}>
      <div className="grid lg:grid-cols-[280px_minmax(0,1fr)] gap-3">
        <div className="flex flex-col gap-3">
          <div className="text-[10.5px] font-bold uppercase tracking-[0.4px] text-[#5b6b85]">Layout</div>
          {LAYOUTS.map((o) => (
            <button key={o.k} type="button" onClick={() => setLayout(o.k)}
              className={`text-left rounded-[10px] border-2 p-3 transition-all ${layout === o.k ? "bg-white shadow-md" : "bg-white/60 border-transparent hover:bg-white"}`}
              style={{ borderColor: layout === o.k ? o.c : undefined }}>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-[28px] h-[28px] rounded-[7px] flex items-center justify-center text-white" style={{ background: o.c }}><o.i size={12} /></span>
                <span className="text-[13px] font-bold text-[#0f172a]">{o.l}</span>
              </div>
              <div className="text-[11.5px] text-[#5b6b85] leading-snug">{o.d}</div>
            </button>
          ))}

          {layout === "format" && (
            <div className="rounded-[10px] bg-white p-3 flex flex-col gap-3">
              <div>
                <div className="text-[10.5px] font-bold uppercase tracking-[0.4px] text-[#5b6b85] mb-1.5">Blank rows per page</div>
                <div className="flex gap-1.5">{[10, 15, 20, 25].map((n) => (
                  <button key={n} type="button" onClick={() => setRows(n)} className={`flex-1 h-[28px] rounded-[6px] text-[12px] font-bold border ${rows === n ? "bg-[#4338ca] border-[#4338ca] text-white" : "bg-white border-[#c8d2e4] text-[#475569]"}`}>{n}</button>
                ))}</div>
              </div>
              <div>
                <div className="text-[10.5px] font-bold uppercase tracking-[0.4px] text-[#5b6b85] mb-1.5">Orientation</div>
                <div className="flex gap-1.5">{[[true, "Landscape"], [false, "Portrait"]].map(([v, l]) => (
                  <button key={l} type="button" onClick={() => setLandscape(v)} className={`flex-1 h-[28px] rounded-[6px] text-[12px] font-bold border ${landscape === v ? "bg-[#4338ca] border-[#4338ca] text-white" : "bg-white border-[#c8d2e4] text-[#475569]"}`}>{l}</button>
                ))}</div>
              </div>
            </div>
          )}

          <div className="text-[10.5px] font-bold uppercase tracking-[0.4px] text-[#5b6b85]">Export</div>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => exportExcel(def, ver.label)} className="rounded-[10px] bg-white p-2.5 text-left hover:shadow-md border border-[#e3e9f4]">
              <FaIcons.FaFileExcel className="text-[#15803d] mb-1" size={18} /><div className="text-[12px] font-bold">Excel</div><div className="text-[10.5px] text-[#5b6b85]">Field list (.csv)</div>
            </button>
            <button type="button" onClick={() => exportJson(def, ver.label)} className="rounded-[10px] bg-white p-2.5 text-left hover:shadow-md border border-[#e3e9f4]">
              <FaIcons.FaFileCode className="text-[#b45309] mb-1" size={18} /><div className="text-[12px] font-bold">JSON</div><div className="text-[10.5px] text-[#5b6b85]">Backup / import</div>
            </button>
            <button type="button" onClick={doPrint} className="col-span-2 rounded-[10px] bg-white p-2.5 text-left hover:shadow-md border border-[#e3e9f4] flex items-center gap-2.5">
              <FaIcons.FaFilePdf className="text-[#dc2626]" size={18} /><div><div className="text-[12px] font-bold">PDF</div><div className="text-[10.5px] text-[#5b6b85]">Print → Save as PDF</div></div>
            </button>
          </div>
        </div>

        <div className="rounded-[10px] bg-[#cbd5e1] p-3">
          <iframe ref={ref} title="logbook-print" srcDoc={html} className="w-full h-[70vh] bg-white rounded-[4px] shadow-xl" />
        </div>
      </div>
    </Modal>
  );
}
