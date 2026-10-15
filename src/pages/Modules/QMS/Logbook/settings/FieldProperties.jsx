import * as FaIcons from "react-icons/fa";
import { TYPE_META, SOURCES, SRC_LABEL, spanOf } from "./model";
import { FieldBox, Hint, Toggle, Seg, ChipsEditor, TypeIcon, Accordion, Button, Empty, inpSm } from "./ui";

/* Right panel of the Form builder — properties of the selected field, in collapsible sections */
export default function FieldProperties({ col, cols, editing, locked, onPatch, onRemove, onDuplicate }) {
  if (!col) return <Empty icon={FaIcons.FaMousePointer} title="No field selected">Click a field on the form to edit it.</Empty>;
  const others = cols.filter((c) => c._id !== col._id);
  const times = others.filter((c) => c.type === "time");
  const ctrlCol = cols.find((c) => c.key === col.showIf?.field);
  const op = col.showIf?.notEquals != null ? "notEquals" : "equals";
  const val = col.showIf?.[op] ?? "";
  const setIf = (patch) => {
    const field = patch.field ?? col.showIf?.field ?? "";
    if (!field) return onPatch({ showIf: undefined });
    const o = patch.op ?? op; const v = patch.val ?? val;
    onPatch({ showIf: v === "" ? { field } : { field, [o]: v } });
  };
  const num = (k) => (e) => onPatch({ [k]: e.target.value === "" ? undefined : Number(e.target.value) }, true);
  const numeric = col.type === "number" || col.type === "duration";

  return (
    <div>
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#f3f4f6]">
        <TypeIcon type={col.type} size={32} />
        <div className="min-w-0 flex-1">
          <div className="text-[14px] font-semibold text-[#111827] truncate">{col.label || "Untitled field"}</div>
          <div className="text-[12px] text-[#6b7280]">{TYPE_META[col.type]?.label}{locked ? " · used in saved entries" : ""}</div>
        </div>
      </div>

      <Accordion title="Basics">
        <FieldBox label="Label"><input className={inpSm} disabled={!editing} value={col.label || ""} onChange={(e) => onPatch({ label: e.target.value }, true)} /></FieldBox>
        <FieldBox label="Key" hint="Name under which the value is stored. Locked once entries exist.">
          <div className="relative">
            <input className={`${inpSm} font-mono pr-7`} disabled={!editing || locked} value={col.key || ""} onChange={(e) => onPatch({ key: e.target.value.replace(/[^A-Za-z0-9_]/g, ""), _auto: false }, true)} />
            {locked && <FaIcons.FaLock size={9} className="absolute right-[10px] top-1/2 -translate-y-1/2 text-[#9ca3af]" />}
          </div>
        </FieldBox>
        <FieldBox label="Type">
          <select className={inpSm} disabled={!editing || locked} value={col.type} onChange={(e) => onPatch({ type: e.target.value, ...(e.target.value === "select" && !col.options && !col.source ? { options: ["Option 1", "Option 2"] } : {}), ...(e.target.value === "duration" ? { unit: col.unit || "min" } : {}) })}>
            {Object.entries(TYPE_META).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}
          </select>
          {locked && <Hint>Type is locked — earlier entries are stored as {TYPE_META[col.type]?.label.toLowerCase()}.</Hint>}
        </FieldBox>
        {col.type !== "duration" && <Toggle small checked={!!col.required} disabled={!editing} onChange={(v) => onPatch({ required: v })} label="Mandatory" hint="The entry cannot be saved while this field is empty." />}
        <FieldBox label="Help text"><input className={inpSm} disabled={!editing} placeholder="Shown under the field" value={col.helpText || ""} onChange={(e) => onPatch({ helpText: e.target.value }, true)} /></FieldBox>
      </Accordion>

      {col.type === "select" && (
        <Accordion title="Choices" count={col.source ? "master" : (col.options || []).length}>
          <FieldBox label="Choices come from">
            <select className={inpSm} disabled={!editing} value={col.source || ""} onChange={(e) => onPatch({ source: e.target.value || undefined, options: e.target.value ? undefined : (col.options?.length ? col.options : ["Option 1", "Option 2"]) })}>
              <option value="">Own list</option>
              {SOURCES.map((s) => <option key={s} value={s}>{SRC_LABEL[s]} master</option>)}
            </select>
          </FieldBox>
          {!col.source && <ChipsEditor value={Array.isArray(col.options) ? col.options : []} disabled={!editing} onChange={(v) => onPatch({ options: v })} />}
        </Accordion>
      )}

      {col.type === "duration" && (
        <Accordion title="Calculation">
          <div className="grid grid-cols-2 gap-2">
            <FieldBox label="From"><select className={inpSm} disabled={!editing} value={col.fromField || ""} onChange={(e) => onPatch({ fromField: e.target.value || undefined })}><option value="">Select…</option>{times.map((c) => <option key={c._id} value={c.key}>{c.label}</option>)}</select></FieldBox>
            <FieldBox label="To"><select className={inpSm} disabled={!editing} value={col.toField || ""} onChange={(e) => onPatch({ toField: e.target.value || undefined })}><option value="">Select…</option>{times.map((c) => <option key={c._id} value={c.key}>{c.label}</option>)}</select></FieldBox>
          </div>
          <Hint>Minutes between the two times, calculated by the system when the entry is saved. The operator cannot type it.</Hint>
        </Accordion>
      )}

      {numeric && (
        <Accordion title="Unit & limits">
          <FieldBox label="Unit"><input className={inpSm} disabled={!editing} placeholder="e.g. °C, %RH, Pa" value={col.unit || ""} onChange={(e) => onPatch({ unit: e.target.value }, true)} /></FieldBox>
          <div className="rounded-[6px] border border-[#f3f4f6] overflow-hidden">
            <div className="grid grid-cols-[70px_1fr_1fr] text-[11px] font-semibold text-[#6b7280] bg-[#f9fafb] px-2 h-[26px] items-center"><span /><span className="px-1">Min</span><span className="px-1">Max</span></div>
            {[["Alert", "alertMin", "alertMax", "#b45309"], ["Action", "min", "max", "#b91c1c"]].map(([l, a, b, c]) => (
              <div key={l} className="grid grid-cols-[70px_1fr_1fr] gap-1.5 px-2 py-1.5 items-center border-t border-[#f3f4f6]">
                <span className="text-[12px] font-semibold" style={{ color: c }}>{l}</span>
                <input type="number" className={inpSm} disabled={!editing} value={col[a] ?? ""} onChange={num(a)} />
                <input type="number" className={inpSm} disabled={!editing} value={col[b] ?? ""} onChange={num(b)} />
              </div>
            ))}
          </div>
          <Hint>Alert = early warning, action = out of specification. Readings are never blocked — use Rules &amp; alerts to decide what happens.</Hint>
        </Accordion>
      )}

      <Accordion title="Logic" defaultOpen={!!(col.showIf?.field || col.afterField)}>
        <FieldBox label="Show this field only if">
          <select className={inpSm} disabled={!editing} value={col.showIf?.field || ""} onChange={(e) => setIf({ field: e.target.value, val: "" })}>
            <option value="">Always shown</option>
            {others.map((c) => <option key={c._id} value={c.key}>{c.label || c.key}</option>)}
          </select>
          {col.showIf?.field && (
            <div className="flex gap-2 mt-2">
              <select className={`${inpSm} !w-[86px]`} disabled={!editing} value={op} onChange={(e) => setIf({ op: e.target.value })}><option value="equals">is</option><option value="notEquals">is not</option></select>
              {ctrlCol?.type === "select" && Array.isArray(ctrlCol.options) && ctrlCol.options.length
                ? <select className={inpSm} disabled={!editing} value={val} onChange={(e) => setIf({ val: e.target.value })}><option value="">Select value…</option>{ctrlCol.options.map((o) => <option key={o} value={o}>{o}</option>)}</select>
                : <input className={inpSm} disabled={!editing} placeholder="value" value={val} onChange={(e) => setIf({ val: e.target.value })} />}
            </div>
          )}
        </FieldBox>
        {(col.type === "time" || col.type === "date") && (
          <FieldBox label="Must not be before">
            <select className={inpSm} disabled={!editing} value={col.afterField || ""} onChange={(e) => onPatch({ afterField: e.target.value || undefined })}>
              <option value="">No rule</option>
              {others.filter((c) => c.type === col.type).map((c) => <option key={c._id} value={c.key}>{c.label || c.key}</option>)}
            </select>
          </FieldBox>
        )}
      </Accordion>

      <Accordion title="Layout" defaultOpen={false}>
        <FieldBox label="Width on the entry form">
          <Seg disabled={!editing} value={spanOf(col)} onChange={(v) => onPatch({ span: v })} options={[{ v: 1, l: "¼" }, { v: 2, l: "½" }, { v: 3, l: "¾" }, { v: 4, l: "Full" }]} />
        </FieldBox>
      </Accordion>

      {editing && (
        <div className="flex gap-2 px-4 py-3 border-t border-[#f3f4f6]">
          <Button size="sm" icon={FaIcons.FaCopy} onClick={onDuplicate}>Duplicate</Button>
          <Button size="sm" kind="danger" icon={FaIcons.FaTrash} className="ml-auto" onClick={onRemove}>Remove</Button>
        </div>
      )}
    </div>
  );
}
