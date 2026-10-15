import { useMemo, useState } from "react";
import * as FaIcons from "react-icons/fa";
import Table from "../../../../components/Reusable/table/Table";
import { Pill, erp, fmtDateTime, templateTone } from "./LogbookUi";
import { CAT_ICON, TPL_STATUS } from "./typeDesigner/model";

/* Logbook templates master list — same Table as every QMS register; double-click opens the designer */
const FILTERS = [
  { k: "all", l: "All" },
  { k: "pending", l: "Pending approval" },
  { k: "draft", l: "Drafts" },
  { k: "custom", l: "Company templates" },
  { k: "retired", l: "Retired" },
];

export default function LogbookTemplateList({ types, me, loading, onBack, onOpen, onNew, onRefresh }) {
  const [f, setF] = useState("all");
  const counts = useMemo(() => ({
    pending: types.filter((t) => t.pending?.status === "InReview").length,
    draft: types.filter((t) => t.pending?.status === "Draft").length,
    custom: types.filter((t) => t.isCustom).length,
    retired: types.filter((t) => t.isRetired).length,
  }), [types]);

  const rows = useMemo(() => types
    .filter((t) => f === "all" || (f === "pending" && t.pending?.status === "InReview") || (f === "draft" && t.pending?.status === "Draft")
      || (f === "custom" && t.isCustom) || (f === "retired" && t.isRetired))
    .sort((a, b) => (b.pending?.status === "InReview") - (a.pending?.status === "InReview") || a.name.localeCompare(b.name))
    .map((t, i) => ({
      ...t, Id: t.key, Sr: i + 1,
      Status: t.isRetired ? "Retired" : t.effective ? "Effective" : "Draft",
      Version: t.effective ? `v${t.currentVersion ?? t.revision ?? 1}` : "—",
      Source: t.isCustom ? "Company" : t.isCustomized ? "Standard · customised" : "Standard",
    })), [types, f]);

  const COLUMNS = [
    { key: "Sr", label: "Sr" },
    { key: "name", label: "Template", render: (r) => { const I = CAT_ICON[r.category] || FaIcons.FaClipboardList; return <span className="inline-flex items-center gap-2 font-semibold"><I size={11} className="text-[#5b6b85]" />{r.name}</span>; } },
    { key: "category", label: "Category" },
    { key: "refType", label: "Issued against" },
    { key: "Source", label: "Source" },
    { key: "docNo", label: "Format No.", render: (r) => r.docNo || "—" },
    { key: "Version", label: "Effective version" },
    { key: "Status", label: "Status", render: (r) => <Pill tone={templateTone(r.Status)}>{TPL_STATUS[r.Status]?.l || r.Status}</Pill> },
    { key: "pending", label: "Change in progress", render: (r) => (r.pending
      ? <span className="inline-flex items-center gap-1.5"><Pill tone={templateTone(r.pending.status)}>v{r.pending.versionNo} · {TPL_STATUS[r.pending.status]?.l}</Pill><span className="text-[11px] text-[#5b6b85]">{r.pending.by}</span></span>
      : "—") },
    { key: "lastChangedAt", label: "Last approved", render: (r) => (r.lastChangedAt ? fmtDateTime(r.lastChangedAt) : r.effective ? "Standard" : "—") },
  ];

  return (
    <div className={`h-full w-full flex flex-col ${erp.font}`}>
      <div className="flex flex-wrap items-center gap-2 px-3 py-2 bg-white border-b border-[#dde1ea]">
        <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[#1a56db] hover:underline"><FaIcons.FaArrowLeft size={10} /> e-Logbook</button>
        <span className="text-[#cbd5e1]">/</span>
        <span className="text-[12.5px] font-semibold text-[#1e293b]">Logbook templates</span>
        <div className="ml-auto flex flex-wrap items-center gap-1">
          {FILTERS.map((x) => (
            <button key={x.k} type="button" onClick={() => setF(x.k)}
              className={`h-[26px] px-2.5 rounded-full text-[11.5px] font-semibold border ${f === x.k ? "bg-[#1a56db] border-[#1a56db] text-white" : "bg-white border-[#c8d2e4] text-[#475569] hover:bg-[#f4f7fc]"}`}>
              {x.l}{counts[x.k] ? ` · ${counts[x.k]}` : ""}
            </button>
          ))}
        </div>
      </div>
      {counts.pending > 0 && me?.canApprove && (
        <div className="px-3 py-1.5 bg-[#eef4ff] border-b border-[#c7d7fb] text-[12px] text-[#1e3a8a] flex items-center gap-2">
          <FaIcons.FaHourglassHalf size={11} /> {counts.pending} template change(s) waiting for your approval.
          <button type="button" className="font-semibold underline" onClick={() => setF("pending")}>Show</button>
        </div>
      )}
      <div className="flex-1 min-h-0">
        <Table
          title="Logbook templates"
          TitleIcon={FaIcons.FaListAlt}
          data={rows}
          columns={COLUMNS}
          rowKey="Id"
          loading={loading}
          onRefresh={onRefresh}
          onAdd={me?.canDesign ? onNew : undefined}
          onRowDoubleClick={(row) => onOpen(row.key)}
        />
      </div>
    </div>
  );
}
