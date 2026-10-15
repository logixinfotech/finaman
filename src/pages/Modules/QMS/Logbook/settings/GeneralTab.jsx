import { CATEGORIES, REF_TYPES, PRINT_DEFAULTS } from "./model";
import { Card, SettingRow, Toggle, RolePicker, Button, Badge, inp, area } from "./ui";
import { fmtDateTime } from "../LogbookUi";

/* General: identification · document control · entry & signature · access · lifecycle */
export default function GeneralTab({ ed, editing, isStandard, refLocked, roleOpts, effRow, retired, canApprove, onRetire }) {
  const d = ed.draft;
  const p = { ...PRINT_DEFAULTS, ...(d.print || {}) };
  const timeCols = d.columns.filter((c) => c.type === "time");
  const setPrint = (ch) => ed.apply((x) => ({ ...x, print: { ...PRINT_DEFAULTS, ...(x.print || {}), ...ch } }), true);

  return (
    <div className="max-w-[1100px] flex flex-col gap-4">
      <Card title="Identification" desc="How the template appears in lists and on every register issued from it." bodyClass="px-5">
        <SettingRow title="Template name" required desc={isStandard ? "Standard templates keep their system name." : "Shown in the register list and printed in the header."}>
          <input className={inp} disabled={!editing || isStandard} value={d.name} placeholder="e.g. Cold room temperature log" onChange={(e) => ed.setD({ name: e.target.value }, true)} />
        </SettingRow>
        <SettingRow title="Category" desc="Groups templates in lists and reports.">
          <select className={inp} disabled={!editing || isStandard} value={d.category} onChange={(e) => ed.setD({ category: e.target.value })}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
        </SettingRow>
        <SettingRow title="Register issued against" required desc={refLocked && !isStandard ? "Fixed once a version is live — running registers depend on it." : "What a register of this template belongs to."}>
          <select className={inp} disabled={!editing || isStandard || refLocked} value={d.refType} onChange={(e) => ed.setD({ refType: e.target.value })}>{REF_TYPES.map((c) => <option key={c} value={c}>{c[0].toUpperCase() + c.slice(1)}</option>)}</select>
        </SettingRow>
        <SettingRow title="Purpose & instructions" desc="Shown to the operator above the entry form and printed on the format." last>
          <textarea rows={3} className={area} disabled={!editing} value={d.description} placeholder="What this logbook records and when an entry must be made." onChange={(e) => ed.setD({ description: e.target.value }, true)} />
        </SettingRow>
      </Card>

      <Card title="Document control" desc="References printed in the header of the logbook format." bodyClass="px-5">
        <SettingRow title="Document number">
          <input className={inp} disabled={!editing} value={d.docNo} placeholder="e.g. LB/F-014" onChange={(e) => ed.setD({ docNo: e.target.value }, true)} />
        </SettingRow>
        <SettingRow title="Format number">
          <input className={inp} disabled={!editing} value={p.formatNo} placeholder="e.g. QA/F/LOG-01" onChange={(e) => setPrint({ formatNo: e.target.value })} />
        </SettingRow>
        <SettingRow title="SOP reference" desc="The procedure that governs this logbook.">
          <input className={inp} disabled={!editing} value={d.sopRef} placeholder="e.g. SOP/QA/021" onChange={(e) => ed.setD({ sopRef: e.target.value }, true)} />
        </SettingRow>
        <SettingRow title="Effective date" desc="Set automatically when QA approves a version." last>
          <div className="h-[34px] flex items-center text-[13px] text-[#374151]">{effRow?.EffectiveFrom ? `${fmtDateTime(effRow.EffectiveFrom)} · v${effRow.VersionNo}` : "Not live yet"}</div>
        </SettingRow>
      </Card>

      <Card title="Entry & signature" desc="How each entry is confirmed and checked." bodyClass="px-5">
        <SettingRow title="e-Signature on every entry" desc="The operator confirms each entry by typing the login name. Name, role and time are stored.">
          <Toggle checked={d.entrySign} disabled={!editing} onChange={(v) => ed.setD({ entrySign: v })} label={d.entrySign ? "On" : "Off"} />
        </SettingRow>
        <SettingRow title="Second-person verification" desc="Entries stay “Entered” until another person verifies them. Nobody can verify their own entry.">
          <Toggle checked={d.verifyRequired} disabled={!editing} onChange={(v) => ed.setD({ verifyRequired: v })} label={d.verifyRequired ? "Required" : "Not required"} />
        </SettingRow>
        <SettingRow title="Late-entry check" desc="An entry recorded later than this after the chosen time is marked “Late entry”." last>
          <div className="grid grid-cols-[minmax(0,1fr)_150px] gap-2">
            <select className={inp} disabled={!editing} value={d.endTimeKey} onChange={(e) => ed.setD({ endTimeKey: e.target.value })}>
              <option value="">Off</option>
              {timeCols.map((c) => <option key={c._id} value={c.key}>After “{c.label}”</option>)}
            </select>
            <div className="relative">
              <input type="number" min={1} max={1440} className={`${inp} pr-[42px]`} disabled={!editing || !d.endTimeKey} value={d.lateAfterMinutes} onChange={(e) => ed.setD({ lateAfterMinutes: e.target.value === "" ? "" : Number(e.target.value) }, true)} />
              <span className="absolute right-[10px] top-1/2 -translate-y-1/2 text-[12px] text-[#9ca3af]">min</span>
            </div>
          </div>
          {!timeCols.length && <div className="mt-1.5 text-[12px] text-[#6b7280]">Add a time field in Form builder to use this check.</div>}
        </SettingRow>
      </Card>

      <Card title="Access" desc="Who may work with registers of this template. Changes apply to running registers once approved." bodyClass="px-5">
        <SettingRow title="Who can add entries" desc="Leave empty to allow any logged-in user.">
          <RolePicker value={d.entryRoles} options={roleOpts} disabled={!editing} onChange={(v) => ed.setD({ entryRoles: v })} />
        </SettingRow>
        <SettingRow title="Who can verify" desc="Usually QA or the department head." last>
          <RolePicker value={d.verifyRoles} options={roleOpts} disabled={!editing || !d.verifyRequired} onChange={(v) => ed.setD({ verifyRoles: v })} emptyText={d.verifyRequired ? "Any user except the author" : "Verification is off"} />
        </SettingRow>
      </Card>

      <Card title="Lifecycle" bodyClass="px-5">
        <SettingRow title="Status" desc="A retired template cannot be used for new registers. Running registers continue until closed." last>
          <div className="flex flex-wrap items-center gap-3 min-h-[34px]">
            {retired ? <Badge tone="red">Retired</Badge> : effRow ? <Badge tone="green">Live · v{effRow.VersionNo}</Badge> : <Badge tone="amber">Not live yet</Badge>}
            <span className="text-[12px] text-[#6b7280]">{effRow ? `Approved by ${effRow.ApprovedBy || "—"}` : "Becomes usable after the first approval."}</span>
            {canApprove && effRow && <Button kind={retired ? "secondary" : "danger"} size="sm" className="ml-auto" onClick={onRetire}>{retired ? "Reactivate" : "Retire template"}</Button>}
          </div>
        </SettingRow>
      </Card>
    </div>
  );
}
