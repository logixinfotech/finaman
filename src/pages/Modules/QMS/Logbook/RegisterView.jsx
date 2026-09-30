import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as FaIcons from "react-icons/fa";
import { alertError, alertWarning, showToast } from "../../../../components/Reusable/alert";
import FieldRenderer from "../../../../components/Reusable/form/FieldRenderer";
import ERPHeader from "../../../../components/Reusable/form/HeaderForm";      // shared header (ENTRY / SEARCH, record nav)
import ERPFooter from "../../../../components/Reusable/form/FooterForm";      // shared footer (Add / Print / Exit buttons)
import ESignDialog from "../Components/ESignDialog";                            // shared e-sign dialog (Deviation, Incident, …)
import RecordAuditPanel from "../Utils/RecordAuditPanel.jsx";
import { getRegister, addEntry, verifyEntry, cancelEntry, closeRegister, getLogbookHistory } from "../Utils/LogbookAPI";
import { erp, Kbd, Pill, SignBadge, PrintPreview, useEnterNavigation, fmtDate, fmtDateTime, fmtTime, entryNo, validateDraft, isVisible, statusTone } from "./LogbookUi";
import { buildRegisterHtml } from "./printRegister";

const PAGE_SIZE = 25;   // rows per "page" — only for the page counter in the title block

/** One grid cell — rendered by the shared FieldRenderer so dropdowns / dates / times look like every other module. */
function Cell({ col, value, masters, onChange, disabled, error, onBlur }) {
  const fieldObj = useMemo(() => {
    const f = { key: col.key, label: col.label, type: col.type === "textarea" ? "text" : col.type };
    if (col.type === "select") f.options = col.source ? (masters?.[col.source] || []).map((o) => o.label) : (col.options || []);
    return f;
  }, [col, masters]);
  return (
    <div onBlur={onBlur}>
      <FieldRenderer fieldObj={fieldObj} value={value ?? ""} disabled={disabled} error={error} onChange={(v) => onChange(col.key, v)} />
      {error && <div className="text-[10.5px] text-[#dc2626] mt-[2px] leading-tight">{error}</div>}
    </div>
  );
}

/* paper-logbook grid styles */
const th = "px-[10px] py-[7px] text-left text-[11.5px] font-bold text-[#1e293b] bg-[#f1f5f9] border border-[#cbd5e1] whitespace-nowrap";
const td = "px-[10px] py-[6px] text-[13px] text-[#0f172a] border border-[#e2e8f0] align-top";

export default function RegisterView({ registerId, masters, company, types = [], registers = [], onSwitch, onBack, onChanged }) {
  const [loading, setLoading] = useState(true);
  const [reg, setReg] = useState(null);
  const [type, setType] = useState(null);
  const [entries, setEntries] = useState([]);
  const [me, setMe] = useState({});
  const [history, setHistory] = useState(null);
  const [tab, setTab] = useState("entries");
  const [draft, setDraft] = useState({});
  const [touched, setTouched] = useState({});   // inline validation shows after a field is left or Save is attempted
  const [busy, setBusy] = useState(false);
  const [sign, setSign] = useState(null);        // { kind: 'entry'|'verify'|'verify-all', entryId?, meaning }
  const [cancelFor, setCancelFor] = useState(null);
  const [preview, setPreview] = useState(false);
  const rowRef = useRef(null);
  const handleKeyDown = useEnterNavigation();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getRegister(registerId);
      if (!res?.register) throw new Error(res?.message || "Register not found.");
      setReg(res.register); setType(res.type); setEntries(res.entries || []); setMe(res.me || {});
      getLogbookHistory(res.register.RecordNo).then((h) => setHistory(h || null));
    } catch (e) {
      alertError("Load failed", e?.message || "Could not load the register.");
      onBack?.();
    } finally { setLoading(false); }
  }, [registerId, onBack]);

  useEffect(() => { load(); }, [load]);

  const cols = type?.columns || [];
  const visibleDraftCols = useMemo(() => cols.filter((c) => isVisible(c, draft)), [cols, draft]);
  const isActive = reg?.Status === "Active";
  const canEnter = isActive && !!me.canEnter;
  const pending = entries.filter((e) => e.Status === "Entered");
  const live = entries.filter((e) => e.Status !== "Cancelled");
  const nextSeq = (entries[entries.length - 1]?.SeqNo || 0) + 1;
  const pageCount = Math.max(1, Math.ceil(entries.length / PAGE_SIZE));

  const setField = (k, v) => setDraft((p) => ({ ...p, [k]: v }));
  const clearDraft = () => { setDraft({}); setTouched({}); };
  const focusFirst = () => setTimeout(() => rowRef.current?.querySelector("input:not([disabled]), select:not([disabled])")?.focus(), 30);
  const draftErrors = useMemo(() => validateDraft(cols, draft), [cols, draft]);
  const draftValid = Object.keys(draftErrors).length === 0;
  const showErr = (k) => (touched[k] || touched.__all) ? draftErrors[k] : undefined;

  const regLabel = (r) => `${r.RecordNo} — ${r.RefName}${r.Status !== "Active" ? " (Closed)" : ""}`;
  const sameTypeRegs = registers.filter((r) => r.TypeKey === reg?.TypeKey);
  const regIndex = Math.max(0, sameTypeRegs.findIndex((r) => r.Id === reg?.Id));

  // ── shortcuts: Ins new row · Ctrl+Enter save · Esc discard/back · Ctrl+P print ──
  useEffect(() => {
    const h = (e) => {
      if (sign || cancelFor || preview) return;
      if (e.key === "Insert" && canEnter) { e.preventDefault(); setTab("entries"); focusFirst(); }
      if (e.key === "Escape") { if (Object.keys(draft).length) { clearDraft(); document.activeElement?.blur?.(); } else onBack?.(); }
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && canEnter) { e.preventDefault(); startSave(); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") { e.preventDefault(); setPreview(true); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });

  // ── save entry ──
  const startSave = () => {
    if (!canEnter || busy) return;
    if (!draftValid) { setTouched({ __all: true }); rowRef.current?.querySelector(".border-\\[\\#dc2626\\], [aria-invalid=true]")?.focus?.(); return; }
    if (type.entrySign) setSign({ kind: "entry", meaning: `Record entry ${entryNo(reg.RecordNo, nextSeq)}` });
    else doSaveEntry(null);
  };
  const doSaveEntry = async (typedName) => {
    setBusy(true);
    try {
      const data = {}; visibleDraftCols.forEach((c) => { data[c.key] = draft[c.key] ?? ""; });
      const res = await addEntry(registerId, data, typedName);
      if (res && res.success === false) throw new Error(res.message);
      if (!res?.id) throw new Error("Entry was not saved.");
      showToast({ icon: "success", title: `Entry #${res.seqNo} recorded${res.isLateEntry ? " (late entry)" : ""}` });
      setSign(null); clearDraft(); await load(); onChanged?.(); focusFirst();
    } catch (e) { alertError("Save failed", e?.message || "Could not save the entry."); }
    finally { setBusy(false); }
  };

  // ── verify ──
  const startVerify = (entry) => setSign({ kind: "verify", entryId: entry.Id, meaning: `Verify entry ${entryNo(reg.RecordNo, entry.SeqNo)}` });
  const startVerifyAll = () => setSign({ kind: "verify-all", meaning: `Verify ${pending.length} pending entries in ${reg.RecordNo}` });
  const doVerify = async (typedName) => {
    setBusy(true);
    try {
      const ids = sign.kind === "verify-all" ? pending.map((e) => e.Id) : [sign.entryId];
      let failed = 0;
      for (const id of ids) {
        const res = await verifyEntry(id, typedName);
        if (!res || res.success === false) { failed += 1; if (ids.length === 1) throw new Error(res?.message || "Verification failed."); }
      }
      showToast({ icon: failed ? "warning" : "success", title: failed ? `${ids.length - failed} verified, ${failed} skipped` : `${ids.length} entr${ids.length > 1 ? "ies" : "y"} verified` });
      setSign(null); await load(); onChanged?.();
    } catch (e) { alertError("Verification failed", e?.message || "Could not verify."); }
    finally { setBusy(false); }
  };

  // ── cancel entry (signed, with reason) ──
  const doCancel = async (typedName, reason) => {
    setBusy(true);
    try {
      const res = await cancelEntry(cancelFor.Id, reason, typedName);
      if (res && res.success === false) throw new Error(res.message);
      showToast({ icon: "success", title: `Entry #${cancelFor.SeqNo} cancelled` });
      setCancelFor(null); await load(); onChanged?.();
    } catch (e) { alertError("Cancel failed", e?.message || "Could not cancel the entry."); }
    finally { setBusy(false); }
  };

  // ── close register ──
  const doClose = async () => {
    if (!window.confirm(`Close register ${reg.RecordNo}? No further entries can be added.`)) return;
    setBusy(true);
    try {
      const res = await closeRegister(registerId);
      if (res && res.success === false) throw new Error(res.message);
      showToast({ icon: "success", title: "Register closed" });
      await load(); onChanged?.();
    } catch (e) { alertError("Close failed", e?.message || "Could not close the register."); }
    finally { setBusy(false); }
  };

  const canCancel = (e) => isActive && e.Status === "Entered" && (String(e.DoneBy).toLowerCase() === String(me.name).toLowerCase() || me.canVerify);

  if (loading || !reg) {
    return <div className={`py-16 text-center text-[#64748b] text-[13px] ${erp.font}`}><FaIcons.FaSpinner className="animate-spin inline mr-2" />Loading register…</div>;
  }

  const recordedBy = type?.entryRoles?.length ? type.entryRoles.join(" / ") : "Any user";
  const verifiedBy = type?.verifyRequired ? (type.verifyRoles.length ? type.verifyRoles.join(" / ") : "Any head") : null;

  return (
    <div className={`h-full w-full flex flex-col ${erp.pageBg} ${erp.font}`}>
      {/* ── the one header: shared ERPHeader (ENTRY / SEARCH, ◀ n/N ▶ moves between registers of this type) ── */}
      <ERPHeader
        title="e-Logbook"
        subtitle={`${reg.RecordNo} · ${type?.name || ""} — ${reg.RefName}`}
        TitleIcon={FaIcons.FaBook}
        isViewMode
        activeTab="entry"
        onTabChange={(t) => { if (t === "search") onBack?.(); }}
        showSettingsTab={false}
        currentIndex={regIndex + 1}
        totalRecords={sameTypeRegs.length || 1}
        onPrevRecord={() => regIndex > 0 && onSwitch?.(sameTypeRegs[regIndex - 1].Id)}
        onNextRecord={() => regIndex < sameTypeRegs.length - 1 && onSwitch?.(sameTypeRegs[regIndex + 1].Id)}
      />

      {/* ── tab bar (FormBody style) ── */}
      <div className={erp.tabBar}>
        {[{ key: "entries", label: "Logbook page", Icon: FaIcons.FaBookOpen }, { key: "audit", label: "Audit Trail", Icon: FaIcons.FaHistory }].map(({ key, label, Icon }) => (
          <button key={key} type="button" onClick={() => setTab(key)} className={`${erp.tab} ${tab === key ? erp.tabOn : erp.tabOff}`}>
            <Icon size={12} className={tab === key ? "text-[#1a56db]" : "text-[#8b9ab5]"} />{label}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 overflow-auto p-[6px]">
        {tab === "audit" ? (
          <RecordAuditPanel history={history} />
        ) : (
          /* ── the logbook page (printed-page replica) ── */
          <div className="w-full min-h-full bg-white border border-[#cbd5e1] flex flex-col">
            {/* title block — register identity (left) · type / register switchers (right, medium width) */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-[12px] py-[7px] border-b-2 border-[#1e293b] bg-[#fbfcfe]">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={erp.label}>Logbook No.</span>
                  <span className="font-mono text-[14px] font-bold text-[#1a56db] whitespace-nowrap">{reg.RecordNo}</span>
                  <Pill tone={statusTone(reg.Status)}>{reg.Status}</Pill>
                  <span className="text-[11.5px] text-[#5b6b85]">page {pageCount} of {pageCount}</span>
                  {isActive && (me.canVerify || String(reg.IssuedBy).toLowerCase() === String(me.name).toLowerCase()) && (
                    <button type="button" onClick={doClose} disabled={busy} title="Close this register — no further entries" className="text-[11px] font-semibold text-[#dc2626] hover:underline"><FaIcons.FaLock size={9} className="inline mr-1" />Close register</button>
                  )}
                </div>
                <div className="text-[12.5px] text-[#0f172a] mt-[1px]"><span className="font-semibold">{reg.RefName}</span>{reg.Department ? <span className="text-[#5b6b85]"> · {reg.Department}</span> : null}</div>
              </div>

              <div className="ml-auto flex items-center gap-x-2 gap-y-1 flex-wrap">
                <span className={erp.label}>Type</span>
                <div className="w-[220px]">
                  <FieldRenderer fieldObj={{ key: "switchType", type: "select", options: types.map((t) => t.name) }} value={type?.name || ""}
                    onChange={(name) => {
                      const t = types.find((x) => x.name === name); if (!t) return;
                      const first = registers.find((r) => r.TypeKey === t.key && r.Status === "Active") || registers.find((r) => r.TypeKey === t.key);
                      if (first && first.Id !== reg.Id) onSwitch?.(first.Id); else if (!first) alertWarning("No register", `No register has been issued for "${t.name}" yet.`);
                    }} />
                </div>
                <span className={`${erp.label} ml-2`}>Register</span>
                <div className="w-[260px]">
                  <FieldRenderer fieldObj={{ key: "switchReg", type: "select", options: sameTypeRegs.map(regLabel) }} value={regLabel(reg)}
                    onChange={(label) => { const r = sameTypeRegs.find((x) => regLabel(x) === label); if (r && r.Id !== reg.Id) onSwitch?.(r.Id); }} />
                </div>
              </div>
            </div>

            {/* equipment / workflow strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 bg-[#f8fafc] border-b border-[#cbd5e1]">
              {[
                ["Issued on / by", `${fmtDate(reg.IssuedOn)} · ${reg.IssuedBy}`],
                ["Entries", `${live.length} valid · ${entries.length - live.length} cancelled`],
                ["Recorded by", `${recordedBy}${type?.entrySign ? " (e-sign)" : ""}`],
                ["Verified by", verifiedBy
                  ? <>{verifiedBy} {pending.length
                      ? <>{me.canVerify && isActive
                          ? <button type="button" onClick={startVerifyAll} disabled={busy} className={`${erp.btn} !h-[22px] !px-[8px] !text-[11px] ${erp.btnPrimary} ml-1`}><FaIcons.FaCheckDouble size={9} /> Verify all ({pending.length})</button>
                          : <Pill tone="amber">{pending.length} pending</Pill>}</>
                      : <Pill tone="green">all verified</Pill>}</>
                  : <span className="text-emerald-700">Not required — final once recorded</span>],
              ].map(([l, v]) => (
                <div key={l} className="px-[12px] py-[4px] border-r border-[#e2e8f0] last:border-r-0 min-w-0">
                  <div className="text-[10.5px] font-semibold uppercase tracking-[0.3px] text-[#5b6b85]">{l}</div>
                  <div className="text-[12.5px] text-[#0f172a] truncate">{v}</div>
                </div>
              ))}
            </div>

            {!isActive && (
              <div className="px-[12px] py-[6px] text-[12px] bg-slate-100 text-slate-600 border-b border-[#cbd5e1]">
                <FaIcons.FaLock className="inline mr-1.5" size={10} />Closed on {fmtDateTime(reg.ClosedOn)} by {reg.ClosedBy}. Read-only.
              </div>
            )}
            {isActive && !me.canEnter && (
              <div className="px-[12px] py-[6px] text-[12px] bg-amber-50 text-amber-700 border-b border-amber-200">
                Your role ({me.role || "—"}) can view this logbook but not add entries. Allowed: {recordedBy}.
              </div>
            )}

            {/* ruled grid */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className={`${th} w-[175px]`}>Entry No.</th>
                    <th className={`${th} w-[130px]`}>Date &amp; Time</th>
                    {cols.map((c) => <th key={c.key} style={{ width: c.width }} className={th}>{c.label}{c.required && <span className={erp.star}>*</span>}</th>)}
                    <th className={`${th} w-[150px]`}>Done by (sign)</th>
                    {type?.verifyRequired && <th className={`${th} w-[150px]`}>Verified by (sign)</th>}
                    <th className={`${th} w-[100px]`}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.length === 0 && (
                    <tr><td colSpan={cols.length + 5} className={`${td} py-5 text-center text-[12.5px] text-[#94a3b8]`}>No entries yet{canEnter ? " — start typing in the yellow row below" : ""}.</td></tr>
                  )}
                  {entries.map((e) => {
                    const cancelled = e.Status === "Cancelled";
                    const tdc = `${td} ${cancelled ? "text-[#94a3b8] line-through bg-[#f8fafc]" : ""}`;
                    const plain = { textDecoration: "none" };
                    return (
                      <tr key={e.Id} className={cancelled ? "" : "hover:bg-[#eef3ff]"}>
                        <td className={`${tdc} font-mono text-[12px] whitespace-nowrap`}>{entryNo(reg.RecordNo, e.SeqNo)}</td>
                        <td className={`${tdc} whitespace-nowrap`}>{fmtDateTime(e.EntryAt)}{e.IsLateEntry ? <> <Pill tone="amber" title="Recorded after the allowed time window">Late</Pill></> : null}</td>
                        {cols.map((c) => (
                          <td key={c.key} className={tdc}>{isVisible(c, e.data) && e.data?.[c.key] ? (c.type === "time" ? fmtTime(e.data[c.key]) : e.data[c.key]) : <span className="text-[#cbd5e1]">—</span>}</td>
                        ))}
                        <td className={tdc} style={plain}><SignBadge name={e.DoneBy} at={e.DoneAt} /></td>
                        {type?.verifyRequired && (
                          <td className={tdc} style={plain}>
                            {e.VerifiedBy ? <SignBadge name={e.VerifiedBy} at={e.VerifiedAt} /> : cancelled ? <span className="text-[#cbd5e1]">—</span> : <span className="text-[12px] text-[#94a3b8] italic">— pending —</span>}
                          </td>
                        )}
                        <td className={`${tdc} whitespace-nowrap`} style={plain}>
                          {e.Status === "Entered" && isActive && me.canVerify ? (
                            <button type="button" onClick={() => startVerify(e)} disabled={busy} className={`${erp.btn} !h-[26px] !px-[8px] !text-[11.5px] ${erp.btnPrimary}`}><FaIcons.FaCheck size={9} /> Verify</button>
                          ) : <Pill tone={statusTone(e.Status)}>{e.Status}</Pill>}
                          {canCancel(e) && (
                            <button type="button" onClick={() => setCancelFor(e)} disabled={busy} title="Cancel entry (signed, with reason)" className="ml-2 text-[#94a3b8] hover:text-[#dc2626] align-middle"><FaIcons.FaBan size={12} /></button>
                          )}
                          {cancelled && <div className="text-[11px] text-[#dc2626] mt-1 whitespace-normal leading-snug">{e.CancelReason}<br /><span className="text-[#94a3b8]">{e.CancelledBy} · {fmtDateTime(e.CancelledAt)}</span></div>}
                        </td>
                      </tr>
                    );
                  })}

                  {/* new-entry row */}
                  {canEnter && (
                    <tr ref={rowRef} onKeyDown={(e) => { const before = document.activeElement; handleKeyDown(e); if (e.key === "Enter" && !e.ctrlKey && document.activeElement === before && before?.tagName !== "BUTTON") { e.preventDefault(); startSave(); } }}
                      className="bg-[#fff3c4] [&>td]:border-y-[2px] [&>td]:border-y-[#f59e0b]">
                      <td className={`${td} align-middle shadow-[inset_4px_0_0_#1a56db] font-mono text-[12px] font-bold text-[#1a56db] whitespace-nowrap`}>{entryNo(reg.RecordNo, nextSeq)}<div className="text-[9.5px] font-sans font-bold text-[#b45309] uppercase tracking-[0.3px]">New entry</div></td>
                      <td className={`${td} align-middle whitespace-nowrap text-[12px] font-medium`}>{fmtDateTime(new Date())}</td>
                      {cols.map((c) => {
                        const vis = isVisible(c, draft);
                        return (
                          <td key={c.key} className="px-[4px] py-[5px] align-middle border border-[#e2e8f0]">
                            <Cell col={c} value={vis ? draft[c.key] : ""} masters={masters} onChange={setField} disabled={!vis || busy} error={vis ? showErr(c.key) : undefined} onBlur={() => setTouched((t) => ({ ...t, [c.key]: true }))} />
                          </td>
                        );
                      })}
                      <td className={`${td} text-[#94a3b8] align-middle text-[11.5px]`}>{type?.entrySign ? "e-sign on save" : me.name}</td>
                      {type?.verifyRequired && <td className={`${td} text-[#cbd5e1] align-middle`}>—</td>}
                      <td className={`${td} align-middle whitespace-nowrap`}>
                        <button type="button" onClick={startSave} disabled={!draftValid || busy} className={`${erp.btn} !h-[28px] !px-[10px] ${erp.btnPrimary}`}>Save</button>
                        {Object.keys(draft).length > 0 && <button type="button" onClick={clearDraft} title="Discard (Esc)" className="ml-2 text-[#94a3b8] hover:text-[#dc2626]"><FaIcons.FaTimes size={11} /></button>}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* <div className="mt-auto flex justify-between px-[12px] py-[5px] border-t border-[#e2e8f0] text-[11px] text-[#5b6b85]">
              <span>{canEnter ? <><Kbd>Ins</Kbd> new row · <Kbd>Enter</Kbd> next field · <Kbd>Ctrl+Enter</Kbd> save{type?.entrySign ? " + e-sign" : ""} · <Kbd>Esc</Kbd> discard / back · </> : null}Electronic record — cancelled entries retained with strike-through · review signature boxes print on the page</span>
              <span>{me.name}{me.role ? ` · ${me.role}` : ""}</span>
            </div> */}
          </div>
        )}
      </div>

      {/* ── shared ERP footer: Add = new entry · Print = preview · Cancel = back to registers ── */}
      <div className="shrink-0">
        <ERPFooter
          isViewMode
          isAddMode={false}
          isEditMode={false}
          moduleKey="logbook"
          formData={{}}                                   /* no Id → Update button hidden */
          rights={{ add: canEnter ? 1 : 0, mod: 0, del: 0, print: 1 }}
          onNewEntry={canEnter ? () => { setTab("entries"); focusFirst(); } : undefined}
          canPrint
          onPrint={() => setPreview(true)}
          onCancel={onBack}
        />
      </div>

      {preview && <PrintPreview title={`${reg.RecordNo} · ${type?.name}`} html={buildRegisterHtml(reg, type, entries, { printedBy: me.name, company })} onClose={() => setPreview(false)} />}
      {sign && (
        <ESignDialog meaning={sign.meaning} signingAsLabel={me.name || me.role || "Unknown"}
          onConfirm={(name) => (sign.kind === "entry" ? doSaveEntry(name) : doVerify(name))} onCancel={() => !busy && setSign(null)} />
      )}
      {cancelFor && (
        <ESignDialog meaning={`Cancel entry ${entryNo(reg.RecordNo, cancelFor.SeqNo)} — the row stays with a strike-through`}
          signingAsLabel={me.name || me.role || "Unknown"} requireReason reasonLabel="Cancellation reason"
          onConfirm={doCancel} onCancel={() => !busy && setCancelFor(null)} />
      )}
    </div>
  );
}