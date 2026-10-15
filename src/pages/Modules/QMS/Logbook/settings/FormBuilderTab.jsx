import { useState } from "react";
import * as FaIcons from "react-icons/fa";
import { Modal, Kbd } from "../LogbookUi";
import { ITEMS, PAL_MIME, TYPE_META, SRC_LABEL, spanOf, limitText } from "./model";
import { Card, Seg, Button, Badge, TypeIcon, Empty, inpSm } from "./ui";
import FieldLibrary from "./FieldLibrary";
import FieldProperties from "./FieldProperties";
import PreviewForm from "./PreviewForm";

/* ═══════════════════════════════════════════════════════════════════════
   Form builder:  field library (left) · entry form canvas (middle) · field properties (right)
   ═══════════════════════════════════════════════════════════════════════ */

const SYSTEM = ["Entry no.", "Date & time", "Done by", "e-Sign", "Verified by", "Status"];
/** Canvas columns: 2 on normal screens, the real 4-column form on wide screens */
const CSPAN = { 1: "col-span-1 2xl:col-span-1", 2: "col-span-2 2xl:col-span-2", 3: "col-span-2 2xl:col-span-3", 4: "col-span-2 2xl:col-span-4" };

/** Grey stand-in for the real input, so the canvas reads like the form the operator gets */
function Faux({ c }) {
  const box = "h-[30px] rounded-[6px] border border-[#e5e7eb] bg-[#f9fafb] px-2.5 flex items-center justify-between gap-2 text-[12px] text-[#9ca3af] overflow-hidden whitespace-nowrap";
  if (c.type === "textarea") return <div className={`${box} !h-[52px] !items-start pt-1.5`}>Long text…</div>;
  if (c.type === "select") return <div className={box}><span className="truncate">{c.source ? `Select ${SRC_LABEL[c.source]?.toLowerCase()}…` : (c.options || []).slice(0, 3).join(" · ") || "No options"}</span><FaIcons.FaChevronDown size={8} /></div>;
  if (c.type === "time") return <div className={box}><span>hh:mm</span><FaIcons.FaRegClock size={10} /></div>;
  if (c.type === "date") return <div className={box}><span>dd-mm-yyyy</span><FaIcons.FaRegCalendarAlt size={10} /></div>;
  if (c.type === "duration") return <div className={`${box} !bg-[#f0fdfa] !border-[#ccfbf1] !text-[#0f766e]`}><span>auto · {c.fromField || "?"} → {c.toField || "?"}</span><span className="font-semibold">{c.unit || "min"}</span></div>;
  if (c.type === "number") return <div className={box}><span>0</span>{c.unit && <span className="font-semibold text-[#6b7280]">{c.unit}</span>}</div>;
  return <div className={box}>Text…</div>;
}

const Flags = ({ c, locked }) => (
  <>
    {locked && <span title="Used in saved entries — key & type locked" className="text-[#9ca3af]"><FaIcons.FaLock size={8} /></span>}
    {c.showIf?.field && <Badge tone="blue" title={`Shown only if ${c.showIf.field} ${c.showIf.notEquals != null ? "is not" : "is"} ${c.showIf.equals ?? c.showIf.notEquals ?? "…"}`}>if {c.showIf.field}</Badge>}
    {c.afterField && <Badge tone="outline" title={`Must not be before ${c.afterField}`}>≥ {c.afterField}</Badge>}
    {(c.alertMin != null || c.alertMax != null) && <Badge tone="amber" title="Alert limits">alert {c.alertMin ?? "…"}–{c.alertMax ?? "…"}</Badge>}
    {limitText(c) && <Badge tone="red" title="Action limits">action {limitText(c)}</Badge>}
  </>
);

export default function FormBuilderTab({ ed, editing, lockedKeys, errorIds, copySources, onCopyFrom, onImport }) {
  const { draft, selId, setSelId } = ed;
  const cols = draft.columns;
  const [view, setView] = useState("layout");
  const [drag, setDrag] = useState({ idx: null, pal: null });
  const [ind, setInd] = useState(null);               // { i, after }
  const [preview, setPreview] = useState(false);
  const selCol = cols.find((c) => c._id === selId) || null;

  const addItem = (item) => { if (!editing) return; const i = cols.findIndex((c) => c._id === selId); ed.insertItem(i >= 0 ? i + 1 : cols.length, item); };
  const endDrag = () => { setDrag({ idx: null, pal: null }); setInd(null); };
  const over = (e, i, vertical) => {
    if (!editing) return; e.preventDefault(); e.stopPropagation(); e.dataTransfer.dropEffect = drag.pal ? "copy" : "move";
    const r = e.currentTarget.getBoundingClientRect();
    const after = vertical ? e.clientY > r.top + r.height / 2 : e.clientX > r.left + r.width / 2;
    if (!ind || ind.i !== i || ind.after !== after) setInd({ i, after });
  };
  const drop = (e) => {
    if (!editing) return; e.preventDefault();
    const at = ind ? (ind.after ? ind.i + 1 : ind.i) : cols.length;
    const palId = e.dataTransfer.getData(PAL_MIME) || drag.pal;
    if (palId && ITEMS[palId]) ed.insertItem(at, ITEMS[palId]); else if (drag.idx != null) ed.moveCol(drag.idx, at);
    endDrag();
  };
  const dragProps = (c, i) => ({
    draggable: editing, onClick: () => setSelId(c._id),
    onDragStart: (e) => { e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", c.key); setDrag({ idx: i, pal: null }); },
    onDragEnd: endDrag,
  });
  const RowTools = ({ c, i }) => editing && (
    <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
      {[[FaIcons.FaArrowUp, "Move up", () => ed.moveBy(i, -1), i === 0], [FaIcons.FaArrowDown, "Move down", () => ed.moveBy(i, 1), i === cols.length - 1],
        [FaIcons.FaCopy, "Duplicate", () => ed.dupCol(c._id)], [FaIcons.FaTrash, "Remove", () => ed.removeCol(c._id)]].map(([I, t, fn, dis]) => (
        <button key={t} type="button" title={t} disabled={dis} onClick={fn} className="w-[26px] h-[26px] rounded-[5px] flex items-center justify-center text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#111827] disabled:opacity-30"><I size={10} /></button>
      ))}
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[250px_minmax(0,1fr)] xl:grid-cols-[250px_minmax(0,1fr)_320px] gap-4 items-start">
      <FieldLibrary editing={editing} onAdd={addItem} onDragItem={(id) => setDrag({ idx: null, pal: id })} onDragEnd={endDrag} />

      <Card title="Entry form" desc={`${cols.length} field${cols.length === 1 ? "" : "s"} · drag to reorder · click a field to edit it`} bodyClass="p-0"
        right={<>
          {editing && copySources?.length > 0 && (
            <select className={`${inpSm} !w-[180px]`} value="" onChange={(e) => e.target.value && onCopyFrom(e.target.value)}>
              <option value="">Copy fields from…</option>
              {copySources.map((t) => <option key={t.key} value={t.key}>{t.name}</option>)}
            </select>)}
          <Seg value={view} onChange={setView} options={[{ v: "layout", l: "Layout" }, { v: "list", l: "List" }]} />
          <Button size="sm" icon={FaIcons.FaPlay} onClick={() => setPreview(true)}>Try form</Button>
          {editing && <Button size="sm" kind="ghost" icon={FaIcons.FaFileImport} onClick={onImport} title="Import fields from a JSON file">Import</Button>}
        </>}>
        <div className="flex flex-wrap items-center gap-1.5 px-5 py-2.5 border-b border-[#f3f4f6] bg-[#f9fafb] text-[12px] text-[#6b7280]">
          <FaIcons.FaLock size={9} /> Added automatically:{SYSTEM.map((s) => <Badge key={s} tone="outline">{s}</Badge>)}
        </div>

        <div onDragOver={(e) => { if (editing) e.preventDefault(); }} onDrop={drop} onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setInd(null); }}>
          {!cols.length && <Empty icon={FaIcons.FaThList} title="This form has no fields yet">Pick a field from the library on the left.</Empty>}

          {view === "layout" && cols.length > 0 && (
            <div className="p-4 grid grid-cols-2 2xl:grid-cols-4 gap-3">
              {cols.map((c, i) => {
                const on = c._id === selId; const bad = errorIds.has(c._id);
                const vert = spanOf(c) === 4;
                const mark = ind && ind.i === i && drag.idx !== i
                  ? (ind.after ? (vert ? "shadow-[0_3px_0_0_#1a56db]" : "shadow-[3px_0_0_0_#1a56db]") : (vert ? "shadow-[0_-3px_0_0_#1a56db]" : "shadow-[-3px_0_0_0_#1a56db]")) : "";
                return (
                  <div key={c._id} {...dragProps(c, i)} onDragOver={(e) => over(e, i, vert)}
                    className={`group relative rounded-[8px] border bg-white p-3 transition-shadow ${CSPAN[spanOf(c)]} ${editing ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"} ${on ? "border-[#1a56db] ring-[3px] ring-[#1a56db]/15" : bad ? "border-[#fca5a5]" : "border-[#e5e7eb] hover:border-[#9ca3af]"} ${drag.idx === i ? "opacity-40" : ""} ${mark}`}>
                    <div className="flex items-center gap-2 mb-2 min-h-[22px]">
                      <span className="text-[13px] font-semibold text-[#111827] truncate">{c.label || <i className="text-[#9ca3af] font-normal">Untitled</i>}</span>
                      {c.required && <span className="text-[#dc2626] text-[13px] leading-none -ml-1">*</span>}
                      {bad && <FaIcons.FaExclamationCircle size={11} className="text-[#dc2626] shrink-0" title="Has a problem — see Checks" />}
                    </div>
                    {editing && <span className={`absolute top-2 right-2 rounded-[6px] bg-white shadow-sm ring-1 ring-[#e5e7eb] ${on ? "" : "hidden group-hover:block"}`}><RowTools c={c} i={i} /></span>}
                    <Faux c={c} />
                    <div className="flex flex-wrap items-center gap-1 mt-2 min-h-[20px]">
                      <span className="text-[11px] font-mono text-[#9ca3af] mr-1">{c.key}</span><Flags c={c} locked={lockedKeys.has(c.key)} />
                    </div>
                  </div>
                );
              })}
              {editing && (
                <div onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); if (!ind || ind.i !== cols.length) setInd({ i: cols.length, after: false }); }}
                  className={`col-span-2 2xl:col-span-4 rounded-[8px] border border-dashed px-3 py-3.5 text-center text-[12px] transition-colors ${ind && ind.i === cols.length ? "border-[#1a56db] bg-[#eff6ff] text-[#1a56db]" : "border-[#d1d5db] text-[#9ca3af]"}`}>
                  Drop a field here to add it at the end
                </div>
              )}
            </div>
          )}

          {view === "list" && cols.length > 0 && (
            <div>
              {cols.map((c, i) => {
                const on = c._id === selId; const bad = errorIds.has(c._id);
                return (
                  <div key={c._id} {...dragProps(c, i)} onDragOver={(e) => over(e, i, true)}
                    className={`group relative flex items-center gap-3 px-5 py-2.5 border-b border-[#f3f4f6] ${on ? "bg-[#eff6ff]" : "hover:bg-[#f9fafb]"} ${drag.idx === i ? "opacity-40" : ""} ${editing ? "cursor-grab" : "cursor-pointer"}
                      ${ind && ind.i === i && drag.idx !== i ? (ind.after ? "shadow-[inset_0_-2px_0_0_#1a56db]" : "shadow-[inset_0_2px_0_0_#1a56db]") : ""}`}>
                    <span className="w-[22px] text-right text-[12px] text-[#9ca3af]">{i + 1}</span>
                    <TypeIcon type={c.type} size={28} />
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-semibold text-[#111827] truncate">{c.label}{c.required && <span className="text-[#dc2626]"> *</span>}{bad && <FaIcons.FaExclamationCircle size={10} className="inline ml-1.5 -mt-0.5 text-[#dc2626]" />}</div>
                      <div className="text-[12px] text-[#6b7280] truncate">{c.type === "select" && c.source ? `${SRC_LABEL[c.source]} master` : TYPE_META[c.type]?.label}<span className="font-mono text-[#9ca3af]"> · {c.key}</span></div>
                    </div>
                    <div className="hidden md:flex flex-wrap justify-end gap-1 max-w-[45%]"><Flags c={c} locked={lockedKeys.has(c.key)} /></div>
                    <span className={on ? "" : "opacity-0 group-hover:opacity-100"}><RowTools c={c} i={i} /></span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>

      <aside className="bg-white border border-[#e5e7eb] rounded-[8px] lg:col-span-2 xl:col-span-1 xl:sticky xl:top-0 xl:max-h-[calc(100vh-240px)] overflow-y-auto">
        <div className="px-4 pt-4 pb-3 border-b border-[#f3f4f6]"><h3 className="text-[14px] font-semibold text-[#111827]">Field properties</h3></div>
        <FieldProperties col={selCol} cols={cols} editing={editing} locked={selCol ? lockedKeys.has(selCol.key) : false}
          onPatch={(patch, merge) => selCol && ed.setCol(selCol._id, patch, merge)}
          onRemove={() => selCol && ed.removeCol(selCol._id)} onDuplicate={() => selCol && ed.dupCol(selCol._id)} />
      </aside>

      {preview && (
        <Modal title="Try the entry form" subtitle="Exactly what the operator sees. Nothing is saved." icon={FaIcons.FaPlay} width="max-w-5xl w-[94vw]" onClose={() => setPreview(false)}
          footer={<Button className="ml-auto" onClick={() => setPreview(false)}>Close <Kbd>Esc</Kbd></Button>}>
          <div className="bg-white border border-[#e5e7eb] rounded-[8px]"><PreviewForm columns={cols} entrySign={draft.entrySign} rules={draft.rules} /></div>
        </Modal>
      )}
    </div>
  );
}
