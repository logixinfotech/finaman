import { useState } from "react";
import * as FaIcons from "react-icons/fa";
import { PALETTE, ITEMS, PAL_MIME, SPAN, spanOf, limitText, TYPE_META } from "./model";
import { Panel, TypeChip, Faux } from "./atoms";
import Inspector from "./Inspector";

const GROUP_COLOR = { Basic: "#0e7490", Choice: "#7c3aed", "Master data": "#059669", "GMP blocks": "#d97706" };

/* Form design: field library · WYSIWYG canvas (drag & drop) · field properties */
export default function DesignTab({ ed, editing, lockedKeys, errorIds, toolbar }) {
  const { draft, selId, setSelId } = ed;
  const cols = draft.columns;
  const [drag, setDrag] = useState({ idx: null, pal: null });
  const [ind, setInd] = useState(null);

  const selIdx = cols.findIndex((c) => c._id === selId);
  const selCol = selIdx >= 0 ? cols[selIdx] : null;

  const addFromPalette = (item) => { if (!editing) return; const i = cols.findIndex((c) => c._id === selId); ed.insertItem(i >= 0 ? i + 1 : cols.length, item); };
  const endDrag = () => { setDrag({ idx: null, pal: null }); setInd(null); };
  const onCardOver = (e, i, c) => {
    if (!editing) return; e.preventDefault(); e.stopPropagation(); e.dataTransfer.dropEffect = drag.pal ? "copy" : "move";
    const r = e.currentTarget.getBoundingClientRect();
    const after = spanOf(c) === 4 ? e.clientY > r.top + r.height / 2 : e.clientX > r.left + r.width / 2;
    const pos = after ? "after" : "before";
    if (!ind || ind.i !== i || ind.pos !== pos) setInd({ i, pos });
  };
  const onCanvasDrop = (e) => {
    if (!editing) return; e.preventDefault();
    const at = ind ? (ind.pos === "after" ? ind.i + 1 : ind.i) : cols.length;
    const palId = e.dataTransfer.getData(PAL_MIME) || drag.pal;
    if (palId && ITEMS[palId]) ed.insertItem(at, ITEMS[palId]); else if (drag.idx != null) ed.moveCol(drag.idx, at);
    endDrag();
  };

  return (
    <div className="grid xl:grid-cols-[minmax(0,1fr)_320px] gap-[10px] items-start">
      <div className="min-w-0 flex flex-col gap-[10px]">
        {editing && (
          <Panel title="Field library" icon={FaIcons.FaThLarge} bodyClass="p-3 flex flex-col gap-2.5"
            right={<span className="text-[11px] text-[#5b6b85] hidden md:inline">Drag onto the form · or click to add after the selected field</span>}>
            {PALETTE.map((g) => (
              <div key={g.group} className="flex flex-wrap items-center gap-1.5">
                <span className="w-[100px] text-[10.5px] font-extrabold uppercase tracking-[0.3px] flex items-center gap-1.5" style={{ color: GROUP_COLOR[g.group] }}><span className="w-2 h-2 rounded-full" style={{ background: GROUP_COLOR[g.group] }} />{g.group}</span>
                {g.items.map((p) => (
                  <button key={p.id} type="button" draggable onClick={() => addFromPalette(p)}
                    onDragStart={(e) => { e.dataTransfer.setData(PAL_MIME, p.id); e.dataTransfer.effectAllowed = "copy"; setDrag({ idx: null, pal: p.id }); }} onDragEnd={endDrag}
                    style={{ "--gc": GROUP_COLOR[g.group], background: `${GROUP_COLOR[g.group]}0d`, borderColor: `${GROUP_COLOR[g.group]}40` }}
                    className="inline-flex items-center gap-1.5 h-[30px] px-3 rounded-[8px] border-[1.5px] text-[12px] font-semibold text-[#1e293b] cursor-grab active:cursor-grabbing hover:shadow-md hover:-translate-y-px transition-all select-none">
                    <p.icon size={11} style={{ color: GROUP_COLOR[g.group] }} /> {p.label} <FaIcons.FaPlus size={8} className="opacity-40" />
                  </button>
                ))}
              </div>
            ))}
          </Panel>
        )}

        <Panel title="Entry form layout" icon={FaIcons.FaThList} bodyClass="p-0"
          right={<><span className="text-[11px] text-[#5b6b85]">{cols.length} field{cols.length === 1 ? "" : "s"}</span>{toolbar}</>}>
          <div className="px-3 py-1.5 border-b border-[#eef1f8] bg-[#fbfcfe] flex flex-wrap items-center gap-1.5 text-[11px] text-[#5b6b85]">
            <FaIcons.FaLock size={9} /> Always added by the system:
            {["Entry No.", "Date-time", "Done by + e-sign", "Verified by", "Status", "Late / OOL flags"].map((s) => <span key={s} className="px-1.5 py-0.5 rounded bg-[#eef2fa] text-[#64748b] font-medium">{s}</span>)}
          </div>
          <div className="p-3 grid grid-cols-4 gap-2.5 min-h-[200px] bg-[#f7f9fd] bg-[radial-gradient(#dbe3f0_1px,transparent_1px)] [background-size:14px_14px]"
            onDragOver={(e) => { if (editing) e.preventDefault(); }} onDrop={onCanvasDrop}
            onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setInd(null); }}>
            {cols.map((c, i) => {
              const on = c._id === selId; const locked = lockedKeys.has(c.key); const bad = errorIds.has(c._id);
              const vert = spanOf(c) === 4;
              const mark = ind && ind.i === i && drag.idx !== i ? (ind.pos === "after" ? (vert ? "[box-shadow:0_4px_0_0_#1a56db]" : "[box-shadow:5px_0_0_0_#1a56db]") : (vert ? "[box-shadow:0_-4px_0_0_#1a56db]" : "[box-shadow:-5px_0_0_0_#1a56db]")) : "";
              return (
                <div key={c._id} draggable={editing} onClick={() => setSelId(c._id)}
                  onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", c.key); setDrag({ idx: i, pal: null }); }} onDragEnd={endDrag}
                  onDragOver={(e) => onCardOver(e, i, c)}
                  style={{ borderLeftWidth: 4, borderLeftColor: (TYPE_META[c.type] || TYPE_META.text).color }}
                  className={`group relative rounded-[9px] border-[1.5px] bg-white p-2.5 shadow-sm hover:shadow-md transition-colors ${editing ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"} ${SPAN[spanOf(c)]} ${on ? "border-[#1a56db] ring-[3px] ring-[#1a56db]/15" : bad ? "border-[#fca5a5]" : "border-[#d5dcea] hover:border-[#9fb3d6]"} ${drag.idx === i ? "opacity-40" : ""} ${mark}`}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <TypeChip type={c.type} size={20} />
                    <span className="text-[12.5px] font-semibold text-[#0f172a] truncate">{c.label || <i className="text-[#94a3b8]">Untitled</i>}</span>
                    {c.required && <span className="text-[#dc2626] text-[13px] leading-none -ml-1">*</span>}
                    {bad && <FaIcons.FaExclamationCircle size={11} className="text-[#dc2626] shrink-0" title="Has a blocking problem — see Compliance check" />}
                    {editing && <FaIcons.FaGripVertical size={11} className="ml-auto text-[#b6c2d8] group-hover:text-[#1a56db] shrink-0" />}
                  </div>
                  <Faux c={c} />
                  <div className="flex flex-wrap items-center gap-1 mt-1.5 text-[10.5px]">
                    <span className="font-mono text-[#94a3b8]">{c.key}</span>
                    {locked && <span title="Saved field — key & type locked" className="text-[#94a3b8]"><FaIcons.FaLock size={8} /></span>}
                    {c.showIf?.field && <span title={`Shown if ${c.showIf.field} ${c.showIf.notEquals != null ? "is not" : "is"} ${c.showIf.equals ?? c.showIf.notEquals ?? "…"}`} className="inline-flex items-center gap-1 px-1.5 rounded bg-sky-50 text-sky-700 font-semibold"><FaIcons.FaCodeBranch size={8} />if {c.showIf.field}</span>}
                    {c.afterField && <span className="px-1.5 rounded bg-violet-50 text-violet-700 font-semibold">≥ {c.afterField}</span>}
                    {limitText(c) && <span className="px-1.5 rounded bg-amber-50 text-amber-700 font-semibold">{limitText(c)}</span>}
                  </div>
                  {editing && on && (
                    <div className="absolute -top-2.5 right-2 flex items-center gap-0.5 rounded-[5px] bg-[#1a56db] text-white shadow px-1 py-0.5" onClick={(e) => e.stopPropagation()}>
                      <button type="button" title="Move earlier" disabled={i === 0} onClick={() => ed.moveBy(i, -1)} className="p-1 disabled:opacity-30"><FaIcons.FaChevronLeft size={9} /></button>
                      <button type="button" title="Move later" disabled={i === cols.length - 1} onClick={() => ed.moveBy(i, 1)} className="p-1 disabled:opacity-30"><FaIcons.FaChevronRight size={9} /></button>
                      <button type="button" title="Duplicate" onClick={() => ed.dupCol(c._id)} className="p-1"><FaIcons.FaCopy size={9} /></button>
                      <button type="button" title="Remove" onClick={() => ed.removeCol(c._id)} className="p-1 hover:text-red-200"><FaIcons.FaTrash size={9} /></button>
                    </div>
                  )}
                </div>
              );
            })}
            {editing && (
              <div onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); if (!ind || ind.i !== cols.length) setInd({ i: cols.length, pos: "before" }); }}
                className={`col-span-4 rounded-[7px] border-2 border-dashed px-3 py-4 text-center text-[12px] transition-colors ${ind && ind.i === cols.length ? "border-[#1a56db] bg-[#e8f0ff] text-[#1a56db]" : "border-[#c8d4e8] text-[#7b8aa5]"}`}>
                {cols.length ? "Drop here to add at the end" : "This form is empty — drag a field from the library, or click one to add it"}
              </div>
            )}
          </div>
        </Panel>
        {editing && <div className="text-[11.5px] text-[#5b6b85] px-1">Removing a field never deletes old entries. Keys and types of fields used by the effective version are locked so earlier entries stay readable.</div>}
      </div>

      <div className="xl:sticky xl:top-2">
        <Panel title="Field properties" icon={FaIcons.FaSlidersH} bodyClass="p-0">
          <Inspector col={selCol} cols={cols} editing={editing} locked={selCol ? lockedKeys.has(selCol.key) : false}
            onPatch={(patch, merge) => selCol && ed.setCol(selCol._id, patch, merge)}
            onRemove={() => selCol && ed.removeCol(selCol._id)} onDuplicate={() => selCol && ed.dupCol(selCol._id)} />
        </Panel>
      </div>
    </div>
  );
}