import * as FaIcons from "react-icons/fa";
import { Btn } from "../LogbookUi";
import { TYPE_META, SOURCES, SRC_LABEL, spanOf } from "./model";
import { inputS, MiniLabel as L, TypeChip, Toggle, Seg, ChipsEditor } from "./atoms";

/* Right-hand "Field properties" panel of the design tab */
export default function Inspector({ col, cols, editing, locked, onPatch, onRemove, onDuplicate }) {
  if (!col) return <div className="p-6 text-center text-[12.5px] text-[#94a3b8]"><FaIcons.FaMousePointer className="mx-auto mb-2" size={18} />Select a field on the form to see its properties.</div>;
  const others = cols.filter((c) => c._id !== col._id);
  const ctrlCol = cols.find((c) => c.key === col.showIf?.field);
  const op = col.showIf?.notEquals != null ? "notEquals" : "equals";
  const val = col.showIf?.[op] ?? "";
  const setIf = (patch) => {
    const field = patch.field ?? col.showIf?.field ?? "";
    if (!field) return onPatch({ showIf: undefined });
    const o = patch.op ?? op; const v = patch.val ?? val;
    onPatch({ showIf: v === "" ? { field } : { field, [o]: v } });
  };
  const sameType = others.filter((c) => c.type === col.type);

  return (
    <div className="p-3.5 flex flex-col gap-3.5">
      <div className="flex items-center gap-2">
        <TypeChip type={col.type} size={26} />
        <div className="min-w-0"><div className="text-[13px] font-bold text-[#1e293b] truncate">{col.label || "Untitled field"}</div><div className="text-[11px] text-[#5b6b85]">{TYPE_META[col.type]?.label}{locked ? " · saved field" : ""}</div></div>
      </div>

      <div><L>Label</L><input className={inputS} disabled={!editing} value={col.label || ""} onChange={(e) => onPatch({ label: e.target.value }, true)} /></div>

      <div>
        <L>Key {locked && <FaIcons.FaLock size={8} className="inline ml-1 -mt-0.5" />}</L>
        <input className={`${inputS} font-mono`} disabled={!editing || locked} value={col.key || ""} onChange={(e) => onPatch({ key: e.target.value.replace(/[^A-Za-z0-9_]/g, ""), _auto: false }, true)} />
        <div className="text-[10.5px] text-[#94a3b8] mt-0.5">{locked ? "Locked — data of earlier entries is stored under this key." : col._auto ? "Generated from the label." : "Custom key."}</div>
      </div>

      <div>
        <L>Field type</L>
        {locked ? <div className="text-[12.5px] text-[#475569]">{TYPE_META[col.type]?.label} <span className="text-[#94a3b8]">(locked)</span></div>
          : <select className={inputS} disabled={!editing} value={col.type} onChange={(e) => onPatch({ type: e.target.value, ...(e.target.value === "select" && !col.options && !col.source ? { options: ["Option 1", "Option 2"] } : {}) })}>
            {Object.entries(TYPE_META).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}
          </select>}
      </div>

      <div><L>Help text</L><input className={inputS} disabled={!editing} placeholder="Shown under the field to guide the operator" value={col.helpText || ""} onChange={(e) => onPatch({ helpText: e.target.value }, true)} /></div>
      <Toggle checked={!!col.required} disabled={!editing} onChange={(v) => onPatch({ required: v })} label="Mandatory" hint="Entry cannot be saved while this field is empty (when visible)." />

      {col.type === "number" && (
        <div>
          <L>Unit &amp; acceptable limits</L>
          <div className="grid grid-cols-3 gap-1.5">
            <input className={inputS} disabled={!editing} placeholder="Unit (°C)" value={col.unit || ""} onChange={(e) => onPatch({ unit: e.target.value }, true)} />
            <input className={inputS} type="number" disabled={!editing} placeholder="Min" value={col.min ?? ""} onChange={(e) => onPatch({ min: e.target.value === "" ? undefined : Number(e.target.value) }, true)} />
            <input className={inputS} type="number" disabled={!editing} placeholder="Max" value={col.max ?? ""} onChange={(e) => onPatch({ max: e.target.value === "" ? undefined : Number(e.target.value) }, true)} />
          </div>
          <div className="text-[10.5px] text-[#94a3b8] mt-1 leading-snug">A reading outside the limits is still recorded (never blocked) but flagged out-of-limit in the register and audit trail.</div>
        </div>
      )}

      {col.type === "select" && (
        <div>
          <L>Choices come from</L>
          <select className={`${inputS} mb-1.5`} disabled={!editing} value={col.source || ""} onChange={(e) => onPatch({ source: e.target.value || undefined, options: e.target.value ? undefined : (col.options?.length ? col.options : ["Option 1", "Option 2"]) })}>
            <option value="">Custom list</option>
            {SOURCES.map((s) => <option key={s} value={s}>{SRC_LABEL[s]} master</option>)}
          </select>
          {!col.source && <ChipsEditor value={Array.isArray(col.options) ? col.options : []} disabled={!editing} onChange={(v) => onPatch({ options: v })} />}
        </div>
      )}

      {(col.type === "time" || col.type === "date") && (
        <div>
          <L>Must not be before</L>
          <select className={inputS} disabled={!editing} value={col.afterField || ""} onChange={(e) => onPatch({ afterField: e.target.value || undefined })}>
            <option value="">No rule</option>
            {sameType.map((c) => <option key={c._id} value={c.key}>{c.label || c.key}</option>)}
          </select>
          <div className="text-[10.5px] text-[#94a3b8] mt-1">e.g. End time cannot be earlier than Start time. Checked on the server too.</div>
        </div>
      )}

      <div>
        <L>Width on form</L>
        <Seg disabled={!editing} value={spanOf(col)} onChange={(v) => onPatch({ span: v })} options={[{ v: 1, l: "¼" }, { v: 2, l: "½" }, { v: 3, l: "¾" }, { v: 4, l: "Full" }]} />
      </div>

      <div className="rounded-[6px] border border-[#e3e9f4] bg-[#fbfcfe] p-2.5">
        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.3px] text-[#5b6b85] mb-1.5"><FaIcons.FaCodeBranch size={10} /> Show this field only if</div>
        <select className={`${inputS} mb-1.5`} disabled={!editing} value={col.showIf?.field || ""} onChange={(e) => setIf({ field: e.target.value, val: "" })}>
          <option value="">Always visible</option>
          {others.map((c) => <option key={c._id} value={c.key}>{c.label || c.key}</option>)}
        </select>
        {col.showIf?.field && (
          <div className="flex gap-1.5">
            <select className={`${inputS} !w-[78px]`} disabled={!editing} value={op} onChange={(e) => setIf({ op: e.target.value })}><option value="equals">is</option><option value="notEquals">is not</option></select>
            {ctrlCol?.type === "select" && Array.isArray(ctrlCol.options) && ctrlCol.options.length
              ? <select className={inputS} disabled={!editing} value={val} onChange={(e) => setIf({ val: e.target.value })}><option value="">Select value…</option>{ctrlCol.options.map((o) => <option key={o} value={o}>{o}</option>)}</select>
              : <input className={inputS} disabled={!editing} placeholder="value" value={val} onChange={(e) => setIf({ val: e.target.value })} />}
          </div>
        )}
      </div>

      {editing && (
        <div className="flex gap-2 pt-1 border-t border-[#eef1f8]">
          <Btn className="!h-[28px] !text-[11.5px]" onClick={onDuplicate}><FaIcons.FaCopy size={10} /> Duplicate</Btn>
          <Btn kind="danger" className="!h-[28px] !text-[11.5px] ml-auto" onClick={onRemove}><FaIcons.FaTrash size={10} /> Remove</Btn>
        </div>
      )}
    </div>
  );
}