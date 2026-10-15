import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as FaIcons from "react-icons/fa";
import { alertError, showToast } from "../../../../components/Reusable/alert";
import {
  getTypeVersions, getTypeVersion, createLogbookType, saveTypeDraft, submitTypeDraft, approveTypeDraft,
  returnTypeDraft, discardTypeDraft, setTypeRetired, getRoleOptions,
} from "../Utils/LogbookAPI";
import { fmtDateTime, PrintPreview } from "./LogbookUi";
import { NEW_KEY, TPL_STATUS, CAT_ICON, EXPORT_FORMAT, blankDefinition, toDefinition, draftSig, analyse, diffDefinitions } from "./settings/model";
import useTemplateDraft from "./settings/useTemplateDraft";
import TemplateSidebar from "./settings/TemplateSidebar";
import GeneralTab from "./settings/GeneralTab";
import FormBuilderTab from "./settings/FormBuilderTab";
import RulesTab from "./settings/RulesTab";
import PrintTab from "./settings/PrintTab";
import ExportTab from "./settings/ExportTab";
import VersionsTab, { DiffList } from "./settings/VersionsTab";
import SignDialog from "./settings/SignDialog";
import { buildSpecification } from "./settings/print";
import { makeXlsx, saveBlob } from "./settings/xlsx";
import { FONT, Badge, Button, Menu, Tabs, Notice, IconBtn } from "./settings/ui";

/* ═══════════════════════════════════════════════════════════════════════
   e-Logbook › Settings › Logbook templates
     Navigator (left, collapsible)  ·  Template workspace (right)
     Workspace = header with actions · tabs · content · status bar
   Change control: edit → Save draft → Submit for approval (e-sign) → QA approves → live
   ═══════════════════════════════════════════════════════════════════════ */

const call = async (p) => { const r = await p; if (r && r.success === false) throw new Error(r.message || "Request failed"); return r; };
const STATUS_TONE = { Effective: "green", Draft: "amber", InReview: "blue", Superseded: "gray" };
const WIDE_TABS = ["form", "print", "export"];

/* ───────────────────────── one template ───────────────────────── */
function TemplateEditor({ typeKey, initialDef, listMe, types, company, onDirty, onName, onCreated, onChanged, onClose, onDuplicate, onTab }) {
  const isNew = typeKey === NEW_KEY;
  const [meta, setMeta] = useState(null);
  const [viewVer, setViewVer] = useState(null);
  const [effDef, setEffDef] = useState(null);
  const [localDraft, setLocalDraft] = useState(isNew);
  const [loadedSig, setLoadedSig] = useState("");
  const [roleOpts, setRoleOpts] = useState([]);
  const [tab, setTabState] = useState(isNew ? "general" : "form");
  const [busy, setBusy] = useState(false);
  const [dialog, setDialog] = useState(null);       // submit | approve | return | discard | retire
  const [checksOpen, setChecksOpen] = useState(false);
  const [specHtml, setSpecHtml] = useState(null);
  const fileRef = useRef(null); const checksRef = useRef(null);
  const setTab = useCallback((t) => { setTabState(t); onTab?.(t); }, [onTab]);

  const versions = meta?.versions || [];
  const me = meta?.me || listMe || { canDesign: false, canApprove: false };
  const effRow = versions.find((v) => v.Status === "Effective");
  const openRow = versions.find((v) => v.Status === "Draft" || v.Status === "InReview");
  const viewRow = versions.find((v) => v.VersionNo === viewVer) || null;
  const isStandard = !!meta?.standard;
  const retired = !!meta?.type?.isRetired;
  const lockedKeys = useMemo(() => new Set((effDef?.columns || []).map((c) => c.key)), [effDef]);
  const ed = useTemplateDraft(lockedKeys);

  const mode = isNew ? "new" : localDraft ? "local" : viewRow?.Status || "loading";
  const editing = (mode === "new" || mode === "local" || mode === "Draft") && me.canDesign;
  const isAuthor = !!openRow && [openRow.CreatedBy, openRow.UpdatedBy, openRow.SubmittedBy].some((x) => x && me.name && x.toLowerCase() === me.name.toLowerCase());
  const canApproveThis = mode === "InReview" && me.canApprove && (!isAuthor || me.allowSelfApproval);
  const nextVer = (versions[0]?.VersionNo || 0) + 1;

  const beginLocal = useCallback((def) => { ed.load(def); setLocalDraft(true); setLoadedSig(draftSig(ed.ref.current)); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const refresh = useCallback(async (preferVer) => {
    if (isNew) return;
    try {
      const r = await call(getTypeVersions(typeKey));
      const open = r.versions.find((v) => v.Status === "Draft" || v.Status === "InReview");
      const eff = r.versions.find((v) => v.Status === "Effective");
      const def = eff ? (await call(getTypeVersion(typeKey, eff.VersionNo))).definition : null;
      setMeta(r); setEffDef(def);
      if (preferVer != null) { setLocalDraft(false); setViewVer(preferVer); return; }
      if (open) { setLocalDraft(false); setViewVer(open.VersionNo); return; }
      if (eff && def && r.me?.canDesign && !r.type?.isRetired) { setViewVer(eff.VersionNo); beginLocal(def); return; }
      setLocalDraft(false); setViewVer(eff?.VersionNo ?? r.versions[0]?.VersionNo ?? null);
    } catch (e) { alertError("Load failed", e.message); }
  }, [typeKey, isNew, beginLocal]);

  useEffect(() => {
    getRoleOptions().then((r) => setRoleOpts(r?.data || [])).catch(() => { });
    onTab?.(tab);
    if (isNew) { ed.load(initialDef || blankDefinition()); setLoadedSig(initialDef ? "" : draftSig(ed.ref.current)); return; }
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (isNew || localDraft || viewVer == null) return undefined;
    let live = true;
    getTypeVersion(typeKey, viewVer).then((r) => { if (live && r?.definition) { ed.load(r.definition); setLoadedSig(draftSig(ed.ref.current)); } });
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewVer, localDraft, meta]);
  useEffect(() => {   // close the checks panel on outside click
    if (!checksOpen) return undefined;
    const h = (e) => { if (checksRef.current && !checksRef.current.contains(e.target)) setChecksOpen(false); };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, [checksOpen]);

  const dirty = editing && !!ed.draft && draftSig(ed.draft) !== loadedSig;
  useEffect(() => { onDirty(dirty); }, [dirty, onDirty]);
  useEffect(() => { if (isNew && ed.draft) onName(ed.draft); }, [isNew, ed.draft, onName]);

  const analysis = useMemo(() => (ed.draft ? analyse(ed.draft, { roleOpts }) : null), [ed.draft, roleOpts]);
  const errorIds = useMemo(() => new Set((analysis?.errors || []).map((e) => e.id).filter(Boolean)), [analysis]);
  const diffVsEff = useMemo(() => (ed.draft ? diffDefinitions(effDef, toDefinition(ed.draft)) : []), [ed.draft, effDef]);

  const blockIfErrors = () => {
    if (!analysis.errors.length) return false;
    setChecksOpen(true);
    alertError("Please fix these first", analysis.errors.slice(0, 4).map((e) => e.t).join("\n"));
    return true;
  };

  /* ── actions ── */
  const saveDraftOnly = async () => {
    if (!editing || busy || !dirty || blockIfErrors()) return;
    setBusy(true);
    try {
      const definition = toDefinition(ed.ref.current);
      if (isNew) { const r = await call(createLogbookType({ definition, changeReason: "" })); showToast({ icon: "success", title: "Draft saved" }); onCreated(r.typeKey); return; }
      const r = await call(saveTypeDraft(typeKey, { definition, changeReason: viewRow?.ChangeReason || "", rowVer: mode === "Draft" ? viewRow?.RowVer : undefined }));
      showToast({ icon: "success", title: `Draft v${r.versionNo} saved` });
      await refresh(r.versionNo); onChanged();
    } catch (e) { alertError("Save failed", e.message); }
    finally { setBusy(false); }
  };
  const openSubmit = () => {
    if (blockIfErrors()) return;
    if (!isNew && effDef && !diffVsEff.length) { alertError("No changes", "Change a field, rule or setting first."); return; }
    setDialog("submit");
  };
  /** Submit for approval: save draft → submit (e-sign) → approve at once if self-approval is enabled and chosen */
  const doSubmit = async ({ typedName, comment, checked }) => {
    setBusy(true);
    let key = typeKey; let saved = false;
    try {
      const definition = toDefinition(ed.ref.current);
      let rowVer;
      if (isNew) { const r = await call(createLogbookType({ definition, changeReason: comment })); key = r.typeKey; rowVer = r.rowVer; }
      else { const r = await call(saveTypeDraft(typeKey, { definition, changeReason: comment, rowVer: mode === "Draft" ? viewRow?.RowVer : undefined })); rowVer = r.rowVer; }
      saved = true;
      await call(submitTypeDraft(key, { typedName, rowVer }));
      if (checked) await call(approveTypeDraft(key, { typedName, comment: "Approved by author (self-approval enabled)" }));
      showToast({ icon: "success", title: checked ? "New version is live" : "Sent for approval" });
      setDialog(null);
      if (isNew) { onCreated(key); return; }
      await refresh(); onChanged();
    } catch (e) {
      alertError(saved ? "Saved as draft, but not sent" : "Save failed", e.message);
      if (saved) { setDialog(null); if (isNew) onCreated(key); else { await refresh(); onChanged(); } }
    } finally { setBusy(false); }
  };
  const run = async (fn, okMsg) => {
    setBusy(true);
    try { const r = await call(fn()); showToast({ icon: "success", title: typeof okMsg === "function" ? okMsg(r) : okMsg }); setDialog(null); await refresh(); onChanged(); return r; }
    catch (e) { alertError("Action failed", e.message); return null; }
    finally { setBusy(false); }
  };
  const doApprove = ({ typedName, comment, checked }) => run(() => approveTypeDraft(typeKey, { typedName, comment, applyToActive: checked }), (r) => `v${r.versionNo} is now live`);
  const doReturn = ({ comment }) => run(() => returnTypeDraft(typeKey, { comment }), "Returned to the author");
  const doDiscard = async ({ comment }) => { const r = await run(() => discardTypeDraft(typeKey, { reason: comment }), "Draft discarded"); if (r && !effRow) onClose(true); };
  const doRetire = ({ typedName, comment }) => run(() => setTypeRetired(typeKey, { retire: !retired, reason: comment, typedName }), retired ? "Template reactivated" : "Template retired");
  const discardLocal = () => { if (window.confirm("Discard all unsaved changes?")) { if (isNew) onClose(true); else beginLocal(effDef); } };

  const resetToStandard = () => { if (meta?.standard && window.confirm("Replace all fields and settings with the system standard? (Undo with Ctrl+Z)")) ed.replaceAll(meta.standard, false); };
  const copyFrom = (k) => { const src = types.find((t) => t.key === k); if (src && window.confirm(`Replace the fields with those of “${src.name}”?`)) { ed.replaceAll(src, true); if (src.refType) ed.setD({ refType: src.refType }); } };
  const importJson = (file) => {
    if (!file) return;
    const rd = new FileReader();
    rd.onload = () => {
      try {
        const j = JSON.parse(String(rd.result));
        if (!Array.isArray(j.columns) || !j.columns.length) throw new Error("No fields found in this file.");
        if (window.confirm(`Replace the fields with ${j.columns.length} imported field(s)?`)) ed.replaceAll(j, true);
      } catch (e) { alertError("Import failed", e.message); }
    };
    rd.readAsText(file); if (fileRef.current) fileRef.current.value = "";
  };
  const exportJson = () => {
    const def = toDefinition(ed.draft);
    saveBlob(new Blob([JSON.stringify({ format: EXPORT_FORMAT, exportedAt: new Date().toISOString(), version: verLabel, ...def }, null, 2)], { type: "application/json" }),
      `${String(def.name || "template").replace(/\W+/g, "_")}_${verLabel}.json`);
  };
  const printSpec = () => setSpecHtml(buildSpecification({ def: toDefinition(ed.draft), ver: { label: verLabel, status: mode === "local" && !dirty ? "Effective" : mode === "local" || mode === "new" ? "Draft" : viewRow?.Status, effectiveFrom: effRow?.EffectiveFrom, approvedBy: effRow?.ApprovedBy, approvedAt: effRow?.ApprovedAt }, versions, company, userName: me.name }));

  /* ── keyboard ── */
  const act = useRef({}); act.current = { saveDraftOnly, ed, editing, tab, dialog };
  useEffect(() => {
    const h = (e) => {
      const a = act.current; if (a.dialog || !a.editing) return;
      const mod = e.ctrlKey || e.metaKey; const k = e.key.toLowerCase();
      const inField = /INPUT|TEXTAREA|SELECT/.test(e.target?.tagName || "");
      if (mod && k === "s") { e.preventDefault(); a.saveDraftOnly(); }
      else if (mod && k === "z" && !inField) { e.preventDefault(); e.shiftKey ? a.ed.redo() : a.ed.undo(); }
      else if (mod && k === "y" && !inField) { e.preventDefault(); a.ed.redo(); }
      else if (e.key === "Delete" && !inField && a.tab === "form" && a.ed.selId) a.ed.removeCol(a.ed.selId);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const d = ed.draft;
  if (!d || (!isNew && !meta)) return <div className="flex-1 flex items-center justify-center text-[13px] text-[#6b7280]"><FaIcons.FaSpinner className="animate-spin mr-2" /> Loading template…</div>;

  const verLabel = mode === "new" ? "v1" : mode === "local" ? (dirty ? `v${nextVer}` : `v${effRow?.VersionNo}`) : `v${viewVer}`;
  const nErr = analysis.errors.length; const nWarn = analysis.warns.length;
  const activeRegs = versions.reduce((a, v) => a + (v.activeRegisters || 0), 0);
  const allRegs = versions.reduce((a, v) => a + (v.registers || 0), 0);
  const CI = CAT_ICON[d.category] || FaIcons.FaClipboardList;
  const status = retired ? ["Retired", "red"] : mode === "new" ? ["New", "amber"] : mode === "local" ? (dirty ? ["Unsaved changes", "amber"] : ["Live", "green"]) : [TPL_STATUS[viewRow?.Status]?.l || "", STATUS_TONE[viewRow?.Status] || "gray"];
  const TABS = [
    { k: "general", l: "General", i: FaIcons.FaSlidersH },
    { k: "form", l: "Form builder", i: FaIcons.FaThLarge, n: d.columns.length },
    { k: "rules", l: "Rules & alerts", i: FaIcons.FaBolt, n: (d.rules || []).length || null },
    { k: "print", l: "Print layout", i: FaIcons.FaPrint },
    ...(!isNew ? [{ k: "export", l: "Export data", i: FaIcons.FaDownload }, { k: "versions", l: "Version history", i: FaIcons.FaHistory, n: versions.filter((v) => v.Status !== "Discarded").length }] : []),
  ];
  const footText = {
    new: dirty ? "New template — not saved yet" : "New template",
    local: dirty ? `Unsaved changes · saving creates draft v${nextVer} · running registers keep v${effRow?.VersionNo}` : `Live version v${effRow?.VersionNo} · edit anything to start v${nextVer}`,
    Draft: `Draft v${viewVer} · saved ${fmtDateTime(viewRow?.UpdatedAt || viewRow?.CreatedAt)} by ${viewRow?.UpdatedBy || viewRow?.CreatedBy}${dirty ? " · unsaved changes" : ""}`,
    InReview: `v${viewVer} waiting for approval · sent by ${viewRow?.SubmittedBy} ${fmtDateTime(viewRow?.SubmittedAt)}`,
    Effective: retired ? `Retired · last version v${viewVer}` : `Live version v${viewVer}`,
    Superseded: `Old version v${viewVer} — read only`,
  }[mode] || "";

  const more = [
    { label: "Print specification", icon: FaIcons.FaFileAlt, onClick: printSpec },
    { label: "Export template (JSON)", icon: FaIcons.FaFileCode, onClick: exportJson },
    editing && { label: "Import fields (JSON)…", icon: FaIcons.FaFileImport, onClick: () => fileRef.current?.click() },
    !isNew && me.canDesign && { label: "Duplicate as new template", icon: FaIcons.FaClone, onClick: () => onDuplicate(toDefinition(d)) },
    (editing && isStandard) && { divider: true },
    editing && isStandard && { label: "Reset to system standard", icon: FaIcons.FaUndoAlt, onClick: resetToStandard },
    mode === "Draft" && editing && { label: "Discard draft…", icon: FaIcons.FaTrashAlt, danger: true, onClick: () => setDialog("discard") },
    me.canApprove && effRow && { divider: true },
    me.canApprove && effRow && { label: retired ? "Reactivate template…" : "Retire template…", icon: FaIcons.FaBan, danger: !retired, onClick: () => setDialog("retire") },
  ];

  return (
    <div className="flex-1 min-w-0 min-h-0 flex flex-col">
      {/* header */}
      <div className="bg-white border-b border-[#e5e7eb] px-6 pt-4">
        <div className="flex flex-wrap items-start gap-4">
          <span className="w-[42px] h-[42px] rounded-[10px] bg-[#f3f4f6] text-[#4b5563] flex items-center justify-center shrink-0"><CI size={17} /></span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[18px] font-semibold text-[#111827] truncate">{d.name || "New template"}</h1>
              <Badge tone="outline">{verLabel}</Badge>
              <Badge tone={status[1]}>{status[0]}</Badge>
              {isStandard && <Badge>Standard</Badge>}
            </div>
            <div className="mt-1 text-[13px] text-[#6b7280] truncate">
              {d.category} · issued against {d.refType} · {d.entrySign ? "e-sign on every entry" : "no e-sign"} · {d.verifyRequired ? "second-person verification" : "no verification"}
              {!isNew && ` · used by ${allRegs} register${allRegs === 1 ? "" : "s"}${activeRegs ? ` (${activeRegs} running)` : ""}`}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 ml-auto">
            <div className="relative" ref={checksRef}>
              <button type="button" onClick={() => setChecksOpen((o) => !o)}
                className={`h-[34px] px-3 rounded-[6px] border text-[13px] font-semibold flex items-center gap-2 ${nErr ? "border-[#fecaca] text-[#b91c1c] bg-[#fef2f2]" : nWarn ? "border-[#fde68a] text-[#b45309] bg-[#fffbeb]" : "border-[#a7f3d0] text-[#047857] bg-[#ecfdf5]"}`}>
                {nErr ? <FaIcons.FaTimesCircle size={12} /> : nWarn ? <FaIcons.FaExclamationTriangle size={12} /> : <FaIcons.FaShieldAlt size={12} />}
                {nErr ? `${nErr} to fix` : nWarn ? `${nWarn} warning${nWarn > 1 ? "s" : ""}` : "GMP checks OK"}
              </button>
              {checksOpen && (
                <div className="absolute right-0 mt-1 w-[460px] max-w-[92vw] max-h-[60vh] overflow-y-auto bg-white border border-[#e5e7eb] rounded-[8px] shadow-[0_10px_30px_rgba(15,23,42,0.14)] z-40">
                  <div className="flex items-center px-4 h-[42px] border-b border-[#f3f4f6]"><span className="text-[14px] font-semibold text-[#111827]">GMP / ALCOA+ checks</span><span className="ml-auto"><IconBtn icon={FaIcons.FaTimes} title="Close" onClick={() => setChecksOpen(false)} /></span></div>
                  {[["errors", FaIcons.FaTimesCircle, "text-[#dc2626]"], ["warns", FaIcons.FaExclamationTriangle, "text-[#f59e0b]"], ["infos", FaIcons.FaInfoCircle, "text-[#3b82f6]"], ["oks", FaIcons.FaCheckCircle, "text-[#10b981]"]].flatMap(([k, I, cls]) => analysis[k].map((r, i) => (
                    <button type="button" key={k + i} className="w-full flex items-start gap-2.5 px-4 py-2.5 border-b border-[#f9fafb] text-left text-[13px] text-[#111827] hover:bg-[#f9fafb]"
                      onClick={() => { if (r.id) { ed.setSelId(r.id); setTab("form"); setChecksOpen(false); } else if (r.tab) { setTab(r.tab); setChecksOpen(false); } }}>
                      <I size={12} className={`mt-[3px] shrink-0 ${cls}`} /><span className="flex-1 leading-snug">{r.t}</span>{r.tag && <Badge>{r.tag}</Badge>}
                    </button>)))}
                </div>
              )}
            </div>
            <Menu items={more} />
            {editing && dirty && <Button onClick={discardLocal} disabled={busy}>Discard</Button>}
            {editing && <Button icon={FaIcons.FaSave} onClick={saveDraftOnly} disabled={busy || !dirty}>Save draft</Button>}
            {editing && (dirty || mode === "Draft") && <Button kind="primary" icon={FaIcons.FaPaperPlane} onClick={openSubmit} disabled={busy}>Submit for approval</Button>}
            {canApproveThis && <><Button icon={FaIcons.FaReply} onClick={() => setDialog("return")} disabled={busy}>Return</Button><Button kind="success" icon={FaIcons.FaCheck} onClick={() => setDialog("approve")} disabled={busy}>Approve</Button></>}
            {mode === "Superseded" && <Button onClick={() => refresh()}>Back to current version</Button>}
            {mode === "Effective" && !openRow && me.canDesign && !retired && <Button kind="primary" icon={FaIcons.FaPen} onClick={() => beginLocal(effDef)}>Edit</Button>}
          </div>
        </div>
        <div className="mt-3"><Tabs tabs={TABS} value={tab} onChange={setTab} /></div>
      </div>

      {/* content */}
      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 flex flex-col gap-4">
        {mode === "Draft" && viewRow?.ReviewComment && <Notice tone="amber">Returned by <b>{viewRow.ReviewedBy}</b>: “{viewRow.ReviewComment}”. Correct it and submit again.</Notice>}
        {mode === "InReview" && canApproveThis && <Notice action={<Button kind="success" size="sm" onClick={() => setDialog("approve")}>Review &amp; approve</Button>}><b>{viewRow?.SubmittedBy}</b> sent <b>v{viewVer}</b> for your approval — “{viewRow?.ChangeReason}” · {diffVsEff.length} change(s).</Notice>}
        {mode === "InReview" && !canApproveThis && <Notice icon={FaIcons.FaHourglassHalf}>Waiting for approval by {(me.approverRoles || []).join(" / ") || "an approver"}{isAuthor ? " — a different person must approve your change." : "."} Registers keep using v{effRow?.VersionNo ?? "—"} until then.</Notice>}
        {mode === "Superseded" && <Notice tone="gray">You are viewing an old version (read only).</Notice>}
        {mode === "Effective" && openRow && <Notice tone="amber" action={<Button size="sm" onClick={() => refresh(openRow.VersionNo)}>Open v{openRow.VersionNo}</Button>}>Change v{openRow.VersionNo} is {TPL_STATUS[openRow.Status].l.toLowerCase()}.</Notice>}
        {retired && <Notice tone="red">This template is retired — no new registers can be issued. Running registers continue until closed.</Notice>}
        {!me.canDesign && !isNew && <Notice tone="gray">Read only — editing templates needs the role {(me.designerRoles || []).join(" / ") || "template designer"}.</Notice>}

        {tab === "general" && <GeneralTab ed={ed} editing={editing} isStandard={isStandard} refLocked={!!effRow} roleOpts={roleOpts} effRow={effRow} retired={retired} canApprove={me.canApprove} onRetire={() => setDialog("retire")} />}
        {tab === "form" && <FormBuilderTab ed={ed} editing={editing} lockedKeys={lockedKeys} errorIds={errorIds} copySources={isNew ? types.filter((t) => t.effective !== false) : null} onCopyFrom={copyFrom} onImport={() => fileRef.current?.click()} />}
        {tab === "rules" && <RulesTab ed={ed} editing={editing} roleOpts={roleOpts} />}
        {tab === "print" && <PrintTab ed={ed} editing={editing} company={company} userName={me.name} effRow={effRow} verLabel={verLabel} onPrintSpec={printSpec} />}
        {tab === "export" && <ExportTab ed={ed} typeKey={typeKey} isNew={isNew} company={company} userName={me.name} ver={{ label: verLabel, status: "Effective", effectiveFrom: effRow?.EffectiveFrom }} />}
        {tab === "versions" && <VersionsTab typeKey={typeKey} versions={versions} viewVer={localDraft ? null : viewVer} standard={meta?.standard} currentDef={toDefinition(d)} onPrintSpec={printSpec}
          onView={(v) => { if (dirty && !window.confirm("Discard unsaved changes?")) return; refresh(v); }} />}
        <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => importJson(e.target.files?.[0])} />
      </div>

      {/* status bar */}
      <div className="h-[34px] shrink-0 flex items-center gap-3 px-6 bg-white border-t border-[#e5e7eb] text-[12px]">
        <span className={`w-[7px] h-[7px] rounded-full ${dirty ? "bg-[#f59e0b]" : "bg-[#10b981]"}`} />
        <span className={dirty ? "text-[#b45309] font-semibold" : "text-[#6b7280]"}>{footText}</span>
        {editing && <span className="ml-auto hidden lg:inline text-[#9ca3af]">Ctrl+S save draft · Ctrl+Z undo · Ctrl+Y redo · Del remove field</span>}
      </div>

      {/* dialogs */}
      {dialog === "submit" && (
        <SignDialog width="max-w-2xl" title={`Submit ${isNew ? "v1" : `v${mode === "Draft" ? viewVer : nextVer}`} for approval`} sign busy={busy}
          meaning={`I submit this version of “${d.name || "new template"}” for QA approval and confirm it is complete.`}
          comment={{ label: "Reason for change", required: true, initial: mode === "Draft" ? viewRow?.ChangeReason || "" : "", placeholder: "e.g. Added batch number column as per SOP QA-014 rev 3 / CC-2026-031" }}
          checkbox={me.canApprove && me.allowSelfApproval ? { label: "Approve and make it live now", hint: "Self-approval is enabled in Settings. Without it a second person must approve." } : null}
          confirmLabel="Sign & submit" onCancel={() => setDialog(null)} onConfirm={doSubmit}>
          <div>
            <div className="text-[12px] font-semibold text-[#374151] mb-1.5">{effDef ? `Changes against live v${effRow?.VersionNo}` : "New template"} ({diffVsEff.length})</div>
            <div className="max-h-[220px] overflow-y-auto rounded-[8px] border border-[#e5e7eb] divide-y divide-[#f3f4f6]"><DiffList diff={diffVsEff} /></div>
          </div>
          <div className="text-[12px] text-[#6b7280]">After approval new registers use this version. Running registers keep their version (QA can move them while approving). Old entries keep their data.</div>
          {nWarn > 0 && <div className="text-[12px] text-[#b45309]"><FaIcons.FaExclamationTriangle className="inline -mt-0.5 mr-1" />{nWarn} GMP warning(s) — the approver will see them.</div>}
        </SignDialog>
      )}
      {dialog === "approve" && (
        <SignDialog width="max-w-2xl" title={`Approve v${viewVer} — ${d.name}`} sign busy={busy} meaning={`I have reviewed version ${viewVer} and approve it as the effective logbook format.`}
          comment={{ label: "Approval comment", placeholder: "Optional" }}
          checkbox={effDef && activeRegs ? { label: `Also move the ${activeRegs} running register(s) to v${viewVer}`, hint: "Off (recommended): running registers finish on their current version." } : null}
          confirmLabel="Sign & approve" onCancel={() => setDialog(null)} onConfirm={doApprove}>
          <div className="text-[13px] text-[#111827]"><b>Reason for change:</b> {viewRow?.ChangeReason}<div className="text-[12px] text-[#6b7280] mt-0.5">Prepared by {viewRow?.UpdatedBy || viewRow?.CreatedBy} · sent by {viewRow?.SubmittedBy}</div></div>
          <div className="max-h-[220px] overflow-y-auto rounded-[8px] border border-[#e5e7eb] divide-y divide-[#f3f4f6]"><DiffList diff={diffVsEff} /></div>
          {(nErr > 0 || nWarn > 0) && <div className="text-[12px] text-[#b45309]">GMP checks: {nErr} blocking, {nWarn} warning(s).</div>}
        </SignDialog>
      )}
      {dialog === "return" && <SignDialog title={`Return v${viewVer} for correction`} comment={{ label: "What needs to be corrected", required: true, placeholder: "e.g. Add unit °C and limits to Room temperature" }} confirmLabel="Return to author" busy={busy} onCancel={() => setDialog(null)} onConfirm={doReturn} />}
      {dialog === "discard" && <SignDialog title={`Discard draft v${viewVer}`} danger confirmLabel="Discard draft" busy={busy} comment={{ label: "Reason (optional)" }} onCancel={() => setDialog(null)} onConfirm={doDiscard}>
        <div className="text-[13px] text-[#111827]">The draft stays in the version history as “Discarded”.</div></SignDialog>}
      {dialog === "retire" && <SignDialog title={retired ? "Reactivate template" : "Retire template"} sign danger={!retired} busy={busy}
        meaning={retired ? `I reactivate “${d.name}” so new registers can be issued.` : `I retire “${d.name}” — no new registers may be issued against it.`}
        comment={{ label: "Reason", required: true }} confirmLabel={retired ? "Sign & reactivate" : "Sign & retire"} onCancel={() => setDialog(null)} onConfirm={doRetire} />}
      {specHtml && <PrintPreview html={specHtml} title={`${d.name} — specification`} onClose={() => setSpecHtml(null)} />}
    </div>
  );
}

/* ───────────────────────── page ───────────────────────── */
function exportAllTemplates(types) {
  const header = ["Template", "Category", "Issued against", "Source", "Live version", "Status", "Document no.", "SOP ref", "Fields", "Mandatory", "Rules", "e-Sign", "Verification", "Verified by", "Change in progress"];
  const rows = types.map((t) => [
    t.name, t.category, t.refType, t.isCustom ? "Company" : t.isCustomized ? "Standard (customised)" : "Standard",
    t.effective === false ? "—" : `v${t.currentVersion ?? t.revision ?? 1}`, t.isRetired ? "Retired" : t.effective === false ? "Draft" : "Live",
    t.docNo || "", t.sopRef || "", (t.columns || []).length, (t.columns || []).filter((c) => c.required).length, (t.rules || []).length,
    t.entrySign ? "Yes" : "No", t.verifyRequired ? "Yes" : "No", (t.verifyRoles || []).join(" / "), t.pending ? `v${t.pending.versionNo} ${t.pending.status}` : "",
  ]);
  const fields = types.flatMap((t) => (t.columns || []).map((c, i) => [t.name, i + 1, c.label, c.key, c.type, c.required ? "Yes" : "", c.unit || "", c.alertMin ?? "", c.alertMax ?? "", c.min ?? "", c.max ?? "", (c.options || []).join(" / ") || c.source || ""]));
  saveBlob(makeXlsx([
    { name: "Templates", header, rows },
    { name: "Fields", header: ["Template", "#", "Field", "Key", "Type", "Mandatory", "Unit", "Alert min", "Alert max", "Action min", "Action max", "Choices"], rows: fields },
  ]), `logbook_templates_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export default function LogbookSettings({ types, me, company, onBack, onChanged }) {
  const first = types.find((t) => t.pending?.status === "InReview") || types.find((t) => t.isCustom) || types[0];
  const [sel, setSel] = useState(first?.key || null);
  const [newItem, setNewItem] = useState(null);       // { key: NEW_KEY, name, …, def }
  const [unsaved, setUnsaved] = useState(null);
  const [rev, setRev] = useState(0);
  const [navManual, setNavManual] = useState(null);   // null = automatic
  const [tab, setTab] = useState("form");
  const collapsed = navManual ?? WIDE_TABS.includes(tab);
  const confirmLeave = () => !unsaved || window.confirm("You have unsaved changes. Discard them?");

  const pick = (k) => { if (k === sel || !confirmLeave()) return; if (newItem && k !== NEW_KEY) setNewItem(null); setUnsaved(null); setSel(k); };
  const startNew = (def) => {
    if (!confirmLeave()) return;
    const base = def ? { ...def, name: `${def.name} (copy)` } : blankDefinition();
    setUnsaved(null); setNewItem({ key: NEW_KEY, name: base.name, category: base.category, columns: base.columns, rules: base.rules || [], def: def ? base : null });
    setSel(NEW_KEY); setRev((r) => r + 1);
  };
  const onDirty = useCallback((v) => setUnsaved(v ? sel : null), [sel]);
  const onName = useCallback((dr) => setNewItem((n) => (n && (n.name !== dr.name || n.category !== dr.category || n.columns.length !== dr.columns.length || n.rules.length !== (dr.rules || []).length)
    ? { ...n, name: dr.name, category: dr.category, columns: dr.columns, rules: dr.rules || [] } : n)), []);
  const onTab = useCallback((t) => { setTab(t); setNavManual(null); }, []);
  const close = (removed) => {
    if (removed) { setNewItem(null); setUnsaved(null); setSel(types[0]?.key || null); setRev((r) => r + 1); onChanged(); return; }
    if (confirmLeave()) onBack();
  };

  return (
    <div className={`h-full w-full flex flex-col bg-[#f5f6f8] ${FONT}`}>
      <div className="h-[52px] shrink-0 flex items-center gap-3 px-5 bg-white border-b border-[#e5e7eb]">
        <button type="button" onClick={() => confirmLeave() && onBack()} className="h-[32px] px-2 -ml-2 rounded-[6px] flex items-center gap-2 text-[13px] font-semibold text-[#374151] hover:bg-[#f3f4f6]"><FaIcons.FaArrowLeft size={11} /> e-Logbook</button>
        <FaIcons.FaChevronRight size={9} className="text-[#d1d5db]" />
        <span className="text-[13px] text-[#6b7280]">Settings</span>
        <FaIcons.FaChevronRight size={9} className="text-[#d1d5db]" />
        <span className="text-[13px] font-semibold text-[#111827]">Logbook templates</span>
        <div className="ml-auto flex items-center gap-2">
          <Button icon={FaIcons.FaFileExcel} onClick={() => exportAllTemplates(types)}>Export all</Button>
          {me?.canDesign !== false && <Button kind="primary" icon={FaIcons.FaPlus} onClick={() => startNew(null)} disabled={!!newItem}>New template</Button>}
        </div>
      </div>
      <div className="flex-1 min-h-0 flex">
        <TemplateSidebar types={types} selKey={sel} newItem={newItem} unsavedKey={unsaved} collapsed={collapsed}
          onToggle={() => setNavManual(!collapsed)} onPick={pick} />
        {sel ? (
          <TemplateEditor key={`${sel}:${rev}`} typeKey={sel} initialDef={sel === NEW_KEY ? newItem?.def : null} listMe={me} types={types} company={company}
            onDirty={onDirty} onName={onName} onChanged={onChanged} onTab={onTab} onDuplicate={(def) => startNew(def)}
            onCreated={(k) => { setNewItem(null); setUnsaved(null); onChanged(); setSel(k); }}
            onClose={close} />
        ) : <div className="flex-1 flex items-center justify-center text-[13px] text-[#9ca3af]">Select a template on the left.</div>}
      </div>
    </div>
  );
}
