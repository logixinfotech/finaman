import * as FaIcons from "react-icons/fa";
import { Field, erp } from "../LogbookUi";
import { CATEGORIES, REF_TYPES } from "./model";
import { Panel, Toggle, RolePicker } from "./atoms";

/* Document control · entry & signature rules · access control */
export default function SettingsTab({ ed, editing, isStandard, refLocked, roleOpts }) {
  const d = ed.draft;
  const timeCols = d.columns.filter((c) => c.type === "time");
  return (
    <div className="grid lg:grid-cols-2 gap-[10px] items-start">
      <Panel title="Document control" icon={FaIcons.FaFileAlt} bodyClass="p-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Template name" required className="sm:col-span-2">
          <input className={erp.input} disabled={!editing || isStandard} value={d.name} placeholder="e.g. Cold room temperature log" onChange={(e) => ed.setD({ name: e.target.value }, true)} />
          {isStandard && <span className="text-[11px] text-[#94a3b8]">Name of a standard template is fixed.</span>}
        </Field>
        <Field label="Category">
          <select className={erp.input} disabled={!editing || isStandard} value={d.category} onChange={(e) => ed.setD({ category: e.target.value })}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
        </Field>
        <Field label="Register issued against" required>
          <select className={erp.input} disabled={!editing || isStandard || refLocked} value={d.refType} onChange={(e) => ed.setD({ refType: e.target.value })}>{REF_TYPES.map((c) => <option key={c}>{c}</option>)}</select>
          {refLocked && !isStandard && <span className="text-[11px] text-[#94a3b8]">Fixed once a version is effective.</span>}
        </Field>
        <Field label="Format / document No.">
          <input className={erp.input} disabled={!editing} value={d.docNo} placeholder="e.g. QA/FRM/014-02" onChange={(e) => ed.setD({ docNo: e.target.value }, true)} />
        </Field>
        <Field label="SOP reference">
          <input className={erp.input} disabled={!editing} value={d.sopRef} placeholder="e.g. SOP/QA/021" onChange={(e) => ed.setD({ sopRef: e.target.value }, true)} />
        </Field>
        <Field label="Purpose / instructions to operator" className="sm:col-span-2">
          <textarea rows={3} className={`${erp.input} !h-auto py-1.5`} disabled={!editing} value={d.description} placeholder="What this logbook records, when an entry must be made, what to do if a reading is out of limit." onChange={(e) => ed.setD({ description: e.target.value }, true)} />
        </Field>
      </Panel>

      <div className="flex flex-col gap-[10px]">
        <Panel title="Entry & signature" icon={FaIcons.FaSignature || FaIcons.FaPen} bodyClass="p-3.5 flex flex-col gap-3.5">
          <Toggle checked={d.entrySign} disabled={!editing} onChange={(v) => ed.setD({ entrySign: v })} label="e-Signature on every entry" hint="Operator confirms each entry by typing their login name; name, role and time are stored." />
          <Toggle checked={d.verifyRequired} disabled={!editing} onChange={(v) => ed.setD({ verifyRequired: v })} label="Second-person verification" hint="Entries stay “Entered” until a different person verifies and e-signs. The author can never verify their own entry." />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#eef1f8]">
            <Field label="Late-entry check on">
              <select className={erp.input} disabled={!editing} value={d.endTimeKey} onChange={(e) => ed.setD({ endTimeKey: e.target.value })}>
                <option value="">Off</option>
                {timeCols.map((c) => <option key={c._id} value={c.key}>{c.label} ({c.key})</option>)}
              </select>
            </Field>
            <Field label="Flag as late after (minutes)">
              <input type="number" min={1} max={1440} className={erp.input} disabled={!editing || !d.endTimeKey} value={d.lateAfterMinutes} onChange={(e) => ed.setD({ lateAfterMinutes: e.target.value === "" ? "" : Number(e.target.value) }, true)} />
            </Field>
            <div className="sm:col-span-2 text-[11.5px] text-[#5b6b85] -mt-1">Entries recorded later than this after the selected time are marked “late entry” in the register, reports and audit trail.</div>
          </div>
        </Panel>
        <Panel title="Access control" icon={FaIcons.FaUsers} bodyClass="p-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Who can add entries"><RolePicker value={d.entryRoles} options={roleOpts} disabled={!editing} onChange={(v) => ed.setD({ entryRoles: v })} /></Field>
          <Field label="Who can verify"><RolePicker value={d.verifyRoles} options={roleOpts} disabled={!editing || !d.verifyRequired} onChange={(v) => ed.setD({ verifyRoles: v })} emptyText={d.verifyRequired ? "Any user except the author" : "Verification is off"} /></Field>
          <div className="sm:col-span-2 text-[11.5px] text-[#5b6b85]">Access changes take effect for running registers as soon as this version is approved. Field changes apply only to registers issued on (or moved to) this version.</div>
        </Panel>
      </div>
    </div>
  );
}