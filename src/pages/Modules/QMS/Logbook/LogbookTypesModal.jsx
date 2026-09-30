import { useEffect, useMemo, useState } from "react";
import * as FaIcons from "react-icons/fa";
import { alertError, showToast } from "../../../../components/Reusable/alert";
import FieldRenderer from "../../../../components/Reusable/form/FieldRenderer";
import { saveLogbookType, resetLogbookType, createLogbookType, getRoleOptions } from "../Utils/LogbookAPI";
import { Modal, Btn, Kbd, Pill, Section, Field, SearchBox, erp } from "./LogbookUi";

const COL_TYPES = ["text", "number", "select", "time", "date"];
const SOURCES = ["", "product", "personnel", "equipment", "instrument", "area"];
const REF_TYPES = ["equipment", "instrument", "area", "general"];
const CATEGORIES = ["Equipment", "Instrument", "Area", "General"];
const sig = (o) => JSON.stringify(o);
const NEW_KEY = "__new__";

const blankType = () => ({
  key: NEW_KEY, name: "", category: "General", refType: "general", entrySign: true, endTimeKey: "",
  verifyRequired: true, entryRoles: [], verifyRoles: [], columns: [{ key: "Col1", label: "New column", type: "text", required: true }],
  isCustom: true, isCustomized: false, standard: null,
});
const toDraft = (t) => ({
  name: t.name, category: t.category, refType: t.refType, entrySign: !!t.entrySign, endTimeKey: t.endTimeKey || "",
  verifyRequired: t.verifyRequired, entryRoles: [...(t.entryRoles || [])], verifyRoles: [...(t.verifyRoles || [])],
  columns: (t.columns || []).map((c) => ({ ...c })),
});

/** Multi-select chips for user groups (reuses /workflow-roles/options) */
function RolePicker({ value, options, onChange, disabled }) {
  const [q, setQ] = useState("");
  const list = options.filter((o) => o.role.toLowerCase().includes(q.toLowerCase()));
  const toggle = (r) => onChange(value.includes(r) ? value.filter((x) => x !== r) : [...value, r]);
  return (
    <div className={`border-[1.5px] border-[#c8d2e4] rounded-[5px] bg-[#fafbfd] p-2 ${disabled ? "opacity-60" : ""}`}>
      <div className="flex flex-wrap gap-1.5 mb-2 min-h-[22px]">
        {value.length === 0 && <span className="text-[12px] text-[#94a3b8]">Any logged-in user</span>}
        {value.map((r) => {
          const c = options.find((o) => o.role.toLowerCase() === r.toLowerCase())?.userCount ?? 0;
          return (
            <span key={r} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] ${c === 0 ? "border-red-300 bg-red-50 text-red-700" : "border-[#c8d2e4] bg-white text-[#1e293b]"}`}>
              {r} <span className="text-[10px] opacity-70">{c}</span>
              {!disabled && <button type="button" onClick={() => toggle(r)} className="ml-0.5 text-[#94a3b8] hover:text-[#dc2626]"><FaIcons.FaTimes size={8} /></button>}
            </span>
          );
        })}
      </div>
      {!disabled && (<>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search user group…" className={`${erp.input} !h-[28px] !text-[13px] !px-[8px]`} />
        <div className="max-h-28 overflow-y-auto mt-1">
          {list.map((o) => (
            <button key={o.role} type="button" onClick={() => toggle(o.role)} className="w-full flex items-center gap-2 px-1.5 py-1 text-left text-[12.5px] hover:bg-[#f4f7fc]">
              <span className={`w-3 h-3 rounded border ${value.includes(o.role) ? "bg-[#1a56db] border-[#1a56db]" : "border-[#c8d2e4]"}`} />
              <span className="flex-1 truncate">{o.role}</span><span className={`text-[10px] ${o.userCount ? "text-[#94a3b8]" : "text-[#dc2626] font-semibold"}`}>{o.userCount}</span>
            </button>
          ))}
          {list.length === 0 && <div className="text-[12px] text-[#94a3b8] px-1.5 py-2">No user group found</div>}
        </div>
      </>)}
    </div>
  );
}

export default function LogbookTypesModal({ types, onClose, onSaved }) {
  const [sel, setSel] = useState(types[0]?.key || "");
  const [newType, setNewType] = useState(null);      // blankType() while creating
  const [roleOpts, setRoleOpts] = useState([]);
  const [draft, setDraft] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [q, setQ] = useState("");

  const list = useMemo(() => (newType ? [newType, ...types] : types), [types, newType]);
  const type = useMemo(() => list.find((t) => t.key === sel) || null, [list, sel]);
  const isNew = type?.key === NEW_KEY;
  const isCustom = !!type?.isCustom;

  useEffect(() => { getRoleOptions().then((r) => setRoleOpts(r?.data || [])); }, []);
  useEffect(() => {
    if (!type) return;
    setDraft(toDraft(type));
    setEditing(isNew || isCustom || type.isCustomized);
  }, [type, isNew, isCustom]);

  const dirty = useMemo(() => !!type && !!draft && sig(draft) !== sig(toDraft(type)), [type, draft]);
  const match = (t) => !q.trim() || t.key === NEW_KEY || `${t.name} ${t.category} ${t.refType}`.toLowerCase().includes(q.trim().toLowerCase());
  const standardGroup = list.filter((t) => !t.isCustom && match(t));
  const customGroup = list.filter((t) => t.isCustom && t.key !== NEW_KEY && match(t));

  const setD = (patch) => setDraft((p) => ({ ...p, ...patch }));
  const setCol = (i, patch) => setDraft((p) => ({ ...p, columns: p.columns.map((c, j) => (j === i ? { ...c, ...patch } : c)) }));
  const moveCol = (i, d) => setDraft((p) => { const cols = [...p.columns]; const j = i + d; if (j < 0 || j >= cols.length) return p; [cols[i], cols[j]] = [cols[j], cols[i]]; return { ...p, columns: cols }; });
  const removeCol = (i) => setDraft((p) => ({ ...p, columns: p.columns.filter((_, j) => j !== i) }));
  const addCol = () => setDraft((p) => ({ ...p, columns: [...p.columns, { key: `Col${p.columns.length + 1}`, label: "New column", type: "text" }] }));

  const startNew = () => { const t = blankType(); setNewType(t); setSel(NEW_KEY); };
  const cancelNew = () => { setNewType(null); setSel(types[0]?.key || ""); };

  const payload = () => ({
    ...draft,
    columns: draft.columns.map((c) => ({
      ...c,
      options: c.type === "select" && !c.source ? (Array.isArray(c.options) ? c.options : String(c.options || "").split(",").map((s) => s.trim()).filter(Boolean)) : undefined,
      source: c.type === "select" && c.source ? c.source : undefined,
    })),
    endTimeKey: draft.endTimeKey || null,
  });

  const save = async () => {
    if (isNew && !draft.name.trim()) { alertError("Name required", "Give the new logbook type a name."); return; }
    setSaving(true);
    try {
      const res = isNew ? await createLogbookType(payload()) : await saveLogbookType(type.key, payload());
      if (res && res.success === false) throw new Error(res.message);
      showToast({ icon: "success", title: isNew ? `Type "${draft.name}" created` : `${type.name} saved` });
      if (isNew) { setNewType(null); setSel(res?.typeKey || ""); }
      onSaved?.();
    } catch (e) { alertError("Save failed", e?.message || "Could not save."); }
    finally { setSaving(false); }
  };
  const resetOrDelete = async () => {
    const q = isCustom ? `Delete custom type "${type.name}"? Only possible if no register uses it.` : `Reset "${type.name}" to the standard definition for this company?`;
    if (!window.confirm(q)) return;
    setSaving(true);
    try {
      const res = await resetLogbookType(type.key);
      if (res && res.success === false) throw new Error(res.message);
      showToast({ icon: "success", title: isCustom ? "Custom type deleted" : "Standard definition restored" });
      if (isCustom) setSel(types.find((t) => !t.isCustom)?.key || "");
      onSaved?.();
    } catch (e) { alertError(isCustom ? "Delete failed" : "Reset failed", e?.message || "Could not complete."); }
    finally { setSaving(false); }
  };

  const timeCols = (draft?.columns || []).filter((c) => c.type === "time").map((c) => c.key);

  const TypeRow = ({ t }) => (
    <button type="button" onClick={() => setSel(t.key)}
      className={`w-full text-left px-3 py-2 border-b border-[#eef1f8] last:border-0 ${sel === t.key ? "bg-[#e8edf7] border-l-[3px] border-l-[#1a56db]" : "hover:bg-[#f4f7fc]"}`}>
      <div className={`text-[13px] font-semibold ${sel === t.key ? "text-[#1a56db]" : "text-[#1e293b]"}`}>{t.key === NEW_KEY ? (draft?.name || "New type…") : t.name}</div>
      <div className="text-[11px] text-[#5b6b85] flex items-center gap-2 mt-0.5">
        {t.category} · {t.columns.length} cols
        {t.key === NEW_KEY ? <Pill tone="amber">Unsaved</Pill> : t.isCustom ? <Pill tone="blue">Custom</Pill> : t.isCustomized ? <Pill tone="blue">Customised</Pill> : null}
      </div>
    </button>
  );

  return (
    <Modal title="Logbook Types" subtitle="Standard types ship with the system. Customise them, or create your own types for this company." icon={FaIcons.FaListAlt} width="max-w-6xl w-[96vw]" onClose={onClose}
      footer={<>
        <span className="text-[11.5px] text-[#5b6b85]">
          {isNew ? "New type — not saved yet" : !editing ? "Standard definition in use" : dirty ? "Unsaved changes" : isCustom ? "Company-defined type" : type?.isCustomized ? "Customised for this company" : "No changes"}
        </span>
        <div className="ml-auto flex gap-2">
          {isNew && <Btn onClick={cancelNew} disabled={saving}>Discard new type</Btn>}
          {!isNew && (isCustom || type?.isCustomized) && <Btn kind="danger" onClick={resetOrDelete} disabled={saving}>{isCustom ? "Delete type" : "Reset to standard"}</Btn>}
          <Btn onClick={onClose} disabled={saving}>Close <Kbd>Esc</Kbd></Btn>
          {editing && <Btn kind="primary" onClick={save} disabled={(!dirty && !isNew) || saving}>{saving ? "Saving…" : isNew ? "Create type" : "Save"}</Btn>}
        </div>
      </>}>
      <div className="flex flex-col lg:grid lg:grid-cols-[270px_minmax(0,1fr)] gap-[10px]">
        {/* left: search + type list */}
        <div className={`${erp.card} flex flex-col overflow-hidden lg:self-start`}>
          <div className="flex items-center gap-[6px] p-[8px] border-b border-[#dde1ea] bg-[#f4f7fc]">
            <SearchBox value={q} onChange={setQ} placeholder="Search type" className="flex-1" />
            <Btn className="!h-[30px] !px-[10px]" onClick={startNew} disabled={!!newType} title="Create a company-defined type"><FaIcons.FaPlus size={10} /> New</Btn>
          </div>
          <div className="max-h-[220px] lg:max-h-[62vh] overflow-y-auto">
            {newType && <TypeRow t={newType} />}
            {customGroup.length > 0 && <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-[0.4px] text-[#5b6b85] bg-[#f4f7fc] border-b border-[#eef1f8]">Company types · {customGroup.length}</div>}
            {customGroup.map((t) => <TypeRow key={t.key} t={t} />)}
            <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-[0.4px] text-[#5b6b85] bg-[#f4f7fc] border-b border-[#eef1f8]">Standard types · {standardGroup.length}</div>
            {standardGroup.map((t) => <TypeRow key={t.key} t={t} />)}
            {standardGroup.length + customGroup.length === 0 && !newType && <div className="px-3 py-4 text-[12px] text-[#94a3b8] text-center">No type matches "{q}"</div>}
          </div>
        </div>

        {/* right: detail */}
        {type && draft && (
          <div className="min-w-0 flex flex-col gap-[8px]">
            <div className="flex flex-wrap items-start gap-3">
              <div className="min-w-0">
                <div className="text-[15px] font-bold text-[#1e293b]">{isNew ? "New logbook type" : type.name}</div>
                {!isNew && <div className="text-[11.5px] text-[#5b6b85]">Issued against: <b className="font-semibold">{type.refType}</b>{type.entrySign ? " · e-sign on every entry" : ""}{type.endTimeKey ? ` · late after ${type.lateAfterMinutes} min past ${type.endTimeKey}` : ""}</div>}
              </div>
              {!editing && <Btn className="ml-auto" onClick={() => setEditing(true)}><FaIcons.FaPen size={10} /> Customise for this company</Btn>}
            </div>

            {(isNew || isCustom) && (
              <Section title="1. Type Details" bodyClass="p-[14px] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[12px]">
                <Field label="Type name" required className="lg:col-span-2">
                  <FieldRenderer fieldObj={{ key: "name", type: "text" }} value={draft.name} onChange={(v) => setD({ name: v })} disabled={!editing} />
                </Field>
                <Field label="Category">
                  <FieldRenderer fieldObj={{ key: "category", type: "select", options: CATEGORIES }} value={draft.category} onChange={(v) => setD({ category: v })} disabled={!editing} />
                </Field>
                <Field label="Register issued against" required>
                  <FieldRenderer fieldObj={{ key: "refType", type: "select", options: REF_TYPES }} value={draft.refType} onChange={(v) => setD({ refType: v })} disabled={!editing || (!isNew && isCustom)} />
                </Field>
                <Field label="e-Sign on every entry">
                  <FieldRenderer fieldObj={{ key: "entrySign", type: "select", options: ["Yes", "No"] }} value={draft.entrySign ? "Yes" : "No"} onChange={(v) => setD({ entrySign: v === "Yes" })} disabled={!editing} />
                </Field>
                <Field label="Late-entry check column (time)">
                  <FieldRenderer fieldObj={{ key: "endTimeKey", type: "select", options: ["", ...timeCols] }} value={draft.endTimeKey} onChange={(v) => setD({ endTimeKey: v })} disabled={!editing} />
                </Field>
              </Section>
            )}

            <Section title={`${isNew || isCustom ? "2" : "1"}. Verification & Roles`} bodyClass="p-[14px] grid grid-cols-1 lg:grid-cols-3 gap-[12px]">
              <Field label="Verification">
                <select className={erp.input} disabled={!editing} value={draft.verifyRequired ? "1" : "0"} onChange={(e) => setD({ verifyRequired: e.target.value === "1" })}>
                  <option value="1">Required — second person signs</option>
                  <option value="0">Not required</option>
                </select>
              </Field>
              <Field label="Who can add entries"><RolePicker value={draft.entryRoles} options={roleOpts} disabled={!editing} onChange={(v) => setD({ entryRoles: v })} /></Field>
              <Field label="Who can verify"><RolePicker value={draft.verifyRoles} options={roleOpts} disabled={!editing || !draft.verifyRequired} onChange={(v) => setD({ verifyRoles: v })} /></Field>
            </Section>

            <Section title={`${isNew || isCustom ? "3" : "2"}. Columns`} bodyClass="overflow-x-auto"
              right={editing ? <Btn className="!h-[26px] !px-[8px] !text-[11.5px]" onClick={addCol}><FaIcons.FaPlus size={9} /> Add column</Btn> : <span className="text-[11px] text-[#5b6b85]">System columns (Sr, date-time, done by, verified by, status) are always present.</span>}>
              <table className="w-full min-w-[860px]">
                <thead><tr>
                  <th className={`${erp.th} w-[24px]`}>#</th><th className={erp.th}>Key</th><th className={erp.th}>Label</th><th className={erp.th}>Type</th>
                  <th className={erp.th}>Options / source</th><th className={erp.th}>Show if</th><th className={`${erp.th} text-center`}>Req.</th><th className={`${erp.th} w-[70px]`} />
                </tr></thead>
                <tbody>
                  {draft.columns.map((c, i) => (
                    <tr key={i} className="border-b border-[#eef1f8] last:border-0 hover:bg-[#fbfcfe]">
                      <td className="px-2 py-1 text-[12px] text-[#94a3b8]">{i + 1}</td>
                      <td className="px-1 py-1"><input className={`${erp.input} !h-[28px] !text-[13px] !px-[8px] font-mono`} disabled={!editing} value={c.key} onChange={(e) => setCol(i, { key: e.target.value })} /></td>
                      <td className="px-1 py-1"><input className={`${erp.input} !h-[28px] !text-[13px] !px-[8px]`} disabled={!editing} value={c.label} onChange={(e) => setCol(i, { label: e.target.value })} /></td>
                      <td className="px-1 py-1">
                        <select className={`${erp.input} !h-[28px] !text-[13px] !px-[8px]`} disabled={!editing} value={c.type} onChange={(e) => setCol(i, { type: e.target.value })}>
                          {COL_TYPES.map((t) => <option key={t}>{t}</option>)}
                        </select>
                      </td>
                      <td className="px-1 py-1">
                        {c.type === "select" ? (
                          <div className="flex gap-1">
                            <select className={`${erp.input} !h-[28px] !text-[13px] !px-[8px] !w-[92px]`} disabled={!editing} value={c.source || ""} onChange={(e) => setCol(i, { source: e.target.value || undefined })}>
                              {SOURCES.map((s) => <option key={s} value={s}>{s || "list"}</option>)}
                            </select>
                            {!c.source && <input className={`${erp.input} !h-[28px] !text-[13px] !px-[8px]`} disabled={!editing} placeholder="A, B, C" value={Array.isArray(c.options) ? c.options.join(", ") : (c.options || "")} onChange={(e) => setCol(i, { options: e.target.value })} />}
                          </div>
                        ) : <span className="text-[#cbd5e1]">—</span>}
                      </td>
                      <td className="px-1 py-1">
                        <div className="flex gap-1">
                          <input className={`${erp.input} !h-[28px] !text-[13px] !px-[8px]`} disabled={!editing} placeholder="field" value={c.showIf?.field || ""} onChange={(e) => setCol(i, { showIf: e.target.value ? { ...(c.showIf || {}), field: e.target.value } : undefined })} />
                          <input className={`${erp.input} !h-[28px] !text-[13px] !px-[8px]`} disabled={!editing || !c.showIf?.field} placeholder="= value" value={c.showIf?.equals || ""} onChange={(e) => setCol(i, { showIf: { field: c.showIf?.field, equals: e.target.value } })} />
                        </div>
                      </td>
                      <td className="px-2 py-1 text-center"><input type="checkbox" disabled={!editing} checked={!!c.required} onChange={(e) => setCol(i, { required: e.target.checked })} /></td>
                      <td className="px-1 py-1 whitespace-nowrap text-[#94a3b8]">
                        {editing && (<>
                          <button type="button" onClick={() => moveCol(i, -1)} className="hover:text-[#1e293b] px-0.5" title="Up"><FaIcons.FaChevronUp size={9} /></button>
                          <button type="button" onClick={() => moveCol(i, 1)} className="hover:text-[#1e293b] px-0.5" title="Down"><FaIcons.FaChevronDown size={9} /></button>
                          <button type="button" onClick={() => removeCol(i)} className="hover:text-[#dc2626] px-0.5" title="Remove"><FaIcons.FaTrash size={9} /></button>
                        </>)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
            {editing && <div className="text-[11.5px] text-[#5b6b85]">Removing a column does not delete old entries — their data stays in the record and simply is not shown as a column.</div>}
          </div>
        )}
      </div>
    </Modal>
  );
}